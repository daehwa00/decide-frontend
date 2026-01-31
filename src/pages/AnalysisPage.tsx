import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiClient, SseClient } from '@/services/apiClient';
import type {
  ApiGraphEdge,
  ApiGraphNode,
  DecisionCardAssigned,
  DecisionCardStreamData,
  MeetingParticipant,
  RoutingCandidate
} from '@/types/api';
import { KPIBar } from '@/components/analysis/KPIBar';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { CandidateCard } from '@/components/analysis/CandidateCard';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { MeetingPanel } from '@/components/meeting/MeetingPanel';
import { DecisionCardView } from '@/components/decision/DecisionCard';
import { CompilationProcess, type AgentLog } from '@/components/analysis/CompilationProcess';

export default function AnalysisPage() {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'ready' | 'error'>('loading');
  const [graphNodes, setGraphNodes] = useState<ApiGraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<ApiGraphEdge[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);
  const [subgraphLoading, setSubgraphLoading] = useState(false);
  const [candidates, setCandidates] = useState<RoutingCandidate[]>([]);
  const [decisionSet, setDecisionSet] = useState<RoutingCandidate[]>([]);
  const [decisionCard, setDecisionCard] = useState<DecisionCardStreamData | null>(null);
  const [cardAssigned, setCardAssigned] = useState<DecisionCardAssigned | null>(null);
  const [meetingParticipants, setMeetingParticipants] = useState<RoutingCandidate[]>([]);
  const [issueMeta, setIssueMeta] = useState<{ id?: string; title?: string } | null>(null);
  const [streamLogs, setStreamLogs] = useState<AgentLog[]>([]);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>('이슈를 분석 중...');
  const [currentStep, setCurrentStep] = useState(0);
  const receivedStepsRef = useRef<Set<string>>(new Set());
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'analysis' | 'meeting' | 'compiling' | 'decision'>('analysis');
  const [meetingComplete, setMeetingComplete] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const [toasts, setToasts] = useState<string[]>([]);
  const modeRef = useRef(mode);
  const thinkingBufferRef = useRef('');
  const agentBufferRef = useRef<Record<string, string>>({});
  const subgraphRequestedRef = useRef(false);

  const runId = location.state?.run_id as string | undefined;
  const issueId = location.state?.issue_id as string | undefined;
  const displayIssueId = issueMeta?.id ?? issueId ?? 'ISS-—';
  const meetingRoster = useMemo(
    () => (meetingParticipants.length > 0 ? meetingParticipants : decisionSet),
    [meetingParticipants, decisionSet]
  );
  const progressSteps = [
    { key: 'initial_decision.completed', label: '초기 판단' },
    { key: 'safety_check.applied', label: '안전성 검증' },
    { key: 'rule_applied', label: '규칙 판단' },
    { key: 'graph_scope_activated', label: '그래프 범위' },
    { key: 'vector_ranked', label: '벡터 리랭킹' },
    { key: 'meeting_ready', label: '미팅 준비' },
    { key: 'risk_review.completed', label: '리스크 검토' },
    { key: 'owner_search.assigned', label: '담당자 배정' },
    { key: 'decision_card.assigned', label: '카드 확정' }
  ];

  const normalizeGraphData = (nodes: ApiGraphNode[], edges: ApiGraphEdge[]) => {
    const normalizedNodes = nodes.map(node => {
      const fallbackName =
        (typeof node.properties?.name === 'string' && node.properties.name) ||
        (typeof node.properties?.label === 'string' && node.properties.label) ||
        node.name ||
        node.id;
      return {
        ...node,
        name: fallbackName
      };
    });
    const nodeIds = new Set(normalizedNodes.map(node => node.id));
    const resolveId = (value: string) => {
      if (nodeIds.has(value)) return value;
      if (value.startsWith('domain-')) {
        const candidate = value.replace('domain-', '').toUpperCase();
        if (nodeIds.has(candidate)) return candidate;
      }
      return null;
    };
    const normalizedEdges = edges
      .map(edge => {
        const source = resolveId(edge.source);
        const target = resolveId(edge.target);
        if (!source || !target) return null;
        return { ...edge, source, target };
      })
      .filter((edge): edge is ApiGraphEdge => Boolean(edge));
    return { nodes: normalizedNodes, edges: normalizedEdges };
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const mergeCandidates = (prev: RoutingCandidate[], next: RoutingCandidate[]) => {
    const map = new Map(prev.map(candidate => [candidate.id, candidate]));
    next.forEach(candidate => {
      const existing = map.get(candidate.id) ?? {};
      map.set(candidate.id, { ...existing, ...candidate });
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!runId) {
      setPhase('ready');
      return;
    }

    setError(null);
    setGraphNodes([]);
    setGraphEdges([]);
    setGraphError(null);
    setGraphLoading(true);
    setSubgraphLoading(false);
    subgraphRequestedRef.current = false;
    setCandidates([]);
    setDecisionSet([]);
    setMeetingParticipants([]);
    setDecisionCard(null);
    setCardAssigned(null);
    setIssueMeta(null);
    setStreamLogs([]);
    setMeetingComplete(false);
    setStreamComplete(false);
    setStreamStatus('이슈를 분석 중...');
    setCurrentStep(0);
    receivedStepsRef.current = new Set();
    setPhase('reveal');
    const revealTimer = window.setTimeout(() => setPhase('ready'), 2000);

    const fetchSubgraph = () => {
      if (subgraphRequestedRef.current) return;
      subgraphRequestedRef.current = true;
      setSubgraphLoading(true);
      ApiClient.getSubgraph(runId)
        .then(data => {
          if (data.nodes.length > 0 || data.edges.length > 0) {
            const normalized = normalizeGraphData(data.nodes, data.edges);
            setGraphNodes(normalized.nodes);
            setGraphEdges(normalized.edges);
            console.log('[Graph] subgraph loaded', {
              nodes: normalized.nodes.length,
              edges: normalized.edges.length
            });
            setGraphError(null);
          } else {
            console.warn('[Graph] subgraph empty, keeping full graph');
          }
        })
        .catch(err => {
          const message = err instanceof Error ? err.message : '그래프 데이터를 불러오지 못했습니다.';
          setGraphError(message);
          console.error('[Graph] subgraph error', message);
        })
        .finally(() => {
          setSubgraphLoading(false);
        });
    };

    ApiClient.getFullGraph({ maxNodes: 500, maxEdges: 1000 })
      .then(data => {
        const normalized = normalizeGraphData(data.nodes, data.edges);
        setGraphNodes(normalized.nodes);
        setGraphEdges(normalized.edges);
        setGraphError(null);
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : '전체 그래프를 불러오지 못했습니다.';
        setGraphError(message);
      })
      .finally(() => {
        setGraphLoading(false);
      });

    const pushLog = (log: Omit<AgentLog, 'id'>) => {
      setStreamLogs(prev => [
        ...prev,
        {
          ...log,
          id: `${log.agent}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        }
      ]);
    };

    const formatStructuredMessage = (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return '';
      const candidate = trimmed.replace(/```json|```/g, '').trim();
      if (!candidate.startsWith('{')) return candidate;
      try {
        const parsed = JSON.parse(candidate);
        const lines: string[] = [];
        if (parsed.risk_tier) lines.push(`- 리스크: ${parsed.risk_tier}`);
        if (parsed.execution_path) lines.push(`- 경로: ${parsed.execution_path}`);
        if (parsed.reasoning) lines.push(`- 근거: ${parsed.reasoning}`);
        if (Array.isArray(parsed.key_factors) && parsed.key_factors.length > 0) {
          lines.push(`- 핵심 요인: ${parsed.key_factors.join(', ')}`);
        }
        if (parsed.escalation_required_to) {
          lines.push(`- 필요 승인: ${parsed.escalation_required_to}`);
        }
        if (parsed.critical_note) lines.push(`- 유의사항: ${parsed.critical_note}`);
        return lines.length > 0 ? lines.join('\n') : JSON.stringify(parsed, null, 2);
      } catch {
        return candidate;
      }
    };

    const formatFindings = (findings: any[] | undefined) => {
      if (!Array.isArray(findings) || findings.length === 0) return '';
      const lines = findings.map((finding) => {
        const risk = finding.risk_type ? `리스크 ${finding.risk_type}` : '리스크';
        const severity = typeof finding.severity === 'number' ? ` (심각도 ${finding.severity})` : '';
        const evidence = finding.evidence ? ` · 근거: ${finding.evidence}` : '';
        const recommendation = finding.recommendation ? ` · 권고: ${finding.recommendation}` : '';
        return `- ${risk}${severity}${evidence}${recommendation}`;
      });
      return lines.join('\n');
    };

    const flushThinking = (reason?: string) => {
      const text = thinkingBufferRef.current.trim();
      if (text.length === 0) return;
      const cleaned = formatStructuredMessage(text);
      pushLog({
        agent: 'System',
        role: 'system',
        type: 'check',
        message: reason ? `${reason}\n${cleaned}` : cleaned
      });
      thinkingBufferRef.current = '';
    };

    const appendAgentBuffer = (agentKey: string, chunk: string, isFinal?: boolean) => {
      const prev = agentBufferRef.current[agentKey] ?? '';
      agentBufferRef.current[agentKey] = `${prev}${chunk}`;
      if (isFinal) {
        const finalText = agentBufferRef.current[agentKey].trim();
        agentBufferRef.current[agentKey] = '';
        return finalText;
      }
      return null;
    };

    const stopStream = SseClient.streamDecision(runId, {
      onEvent: (eventType, data) => {
        const statusMap: Record<string, string> = {
          'initial_decision.started': 'LLM 판단 시작',
          'initial_decision.thinking': 'LLM 추론 중',
          'initial_decision.completed': '초기 판단 완료',
          'safety_check.applied': '안전성 검증 적용',
          'rule_applied': '규칙 기반 판단',
          'graph_scope_activated': '그래프 범위 설정',
          'graph_candidates': '그래프 후보 수집',
          'vector_ranked': '벡터 리랭킹 완료',
          'reference_nodes_found': '유사 경험자 참조',
          'meeting_ready': '미팅 준비 완료',
          'risk_review.started': '리스크 검토 시작',
          'risk_review.agent.message': '리스크 메시지 수신',
          'risk_review.completed': '리스크 검토 완료',
          'owner_search.started': '담당자 탐색 시작',
          'owner_search.candidates': '담당자 후보 수집',
          'owner_search.assigned': '담당자 배정 완료',
          'decision_card': '의사결정 카드 생성',
          'decision_card.assigned': '의사결정 완료'
        };
        if (statusMap[eventType]) {
          setStreamStatus(statusMap[eventType]);
        }
        const stepIndex = progressSteps.findIndex(step => step.key === eventType);
        if (stepIndex !== -1) {
          receivedStepsRef.current.add(eventType);
          setCurrentStep(prev => (stepIndex > prev ? stepIndex : prev));
        }
        if (eventType === 'initial_decision.started') {
          thinkingBufferRef.current = '';
          pushLog({ agent: 'System', role: 'system', type: 'action', message: 'LLM 판단을 시작합니다.' });
        }
        if (eventType === 'initial_decision.thinking') {
          if (data?.content) {
            thinkingBufferRef.current += data.content;
            if (data.is_final) {
              flushThinking('LLM 추론 완료');
            }
          }
        }
        if (eventType === 'initial_decision.completed') {
          flushThinking();
          if (data?.reasoning || data?.key_factors) {
            const details = [
              data.reasoning ? `근거: ${data.reasoning}` : null,
              Array.isArray(data.key_factors) && data.key_factors.length > 0
                ? `핵심 요인: ${data.key_factors.join(', ')}`
                : null
            ]
              .filter(Boolean)
              .join('\n');
            if (details) {
              pushLog({ agent: 'System', role: 'system', type: 'check', message: details });
            }
          }
          const summary = [
            data.risk_tier ? `리스크 ${data.risk_tier}` : null,
            data.execution_path ? `경로 ${data.execution_path}` : null
          ].filter(Boolean).join(' · ');
          pushLog({
            agent: 'System',
            role: 'system',
            type: 'check',
            message: summary ? `초기 판단 완료 · ${summary}` : '초기 판단 완료'
          });
        }
        if (eventType === 'safety_check.applied') {
          const summary = [
            data.final_risk_tier ? `리스크 ${data.final_risk_tier}` : null,
            data.final_execution_path ? `경로 ${data.final_execution_path}` : null,
            data.override_reason ? `사유: ${data.override_reason}` : null
          ]
            .filter(Boolean)
            .join(' · ');
          pushLog({
            agent: 'System',
            role: 'system',
            type: 'warning',
            message: summary ? `안전성 검증 적용 · ${summary}` : '안전성 검증 적용'
          });
        }
        if (eventType === 'rule_applied') {
          const summary = [
            data.risk_tier ? `리스크 ${data.risk_tier}` : null,
            data.execution_path ? `경로 ${data.execution_path}` : null,
            data.budget_impact ? `예산 영향 ${data.budget_impact}` : null
          ]
            .filter(Boolean)
            .join(' · ');
          pushLog({
            agent: 'System',
            role: 'system',
            type: 'check',
            message: summary ? `규칙 기반 판단 · ${summary}` : '규칙 기반 판단 적용'
          });
        }
        if (eventType === 'graph_scope_activated') {
          const summary = [
            data.scope ? `스코프 ${data.scope}` : null,
            typeof data.hop === 'number' ? `거리 ${data.hop}` : null
          ]
            .filter(Boolean)
            .join(' · ');
          pushLog({
            agent: 'System',
            role: 'system',
            type: 'action',
            message: summary ? `그래프 범위 설정 · ${summary}` : '그래프 범위 설정'
          });
        }
        if (eventType === 'risk_review.agent.message') {
          const roleMap: Record<string, AgentLog['role']> = {
            SECURITY: 'security',
            LEGAL: 'legal',
            FINANCE: 'product',
            OPS: 'product',
            REPUTATION: 'product',
            PRODUCT: 'product',
            SYSTEM: 'system'
          };
          const role = roleMap[data.agent_type] ?? 'system';
          if (data.message_type === 'delta' && data.content) {
            appendAgentBuffer(data.agent_type ?? 'Agent', data.content, false);
          } else {
            const combined = data.content
              ? appendAgentBuffer(data.agent_type ?? 'Agent', data.content, true)
              : null;
            const formatted = formatStructuredMessage(combined ?? data.content ?? '리스크 메시지 수신');
            const findings = formatFindings(data.findings);
            const message = findings ? `${formatted}\n${findings}` : formatted;
            pushLog({
              agent: data.agent_type ?? 'Agent',
              role,
              type: 'check',
              message
            });
          }
        }
        if (eventType === 'risk_review.started') {
          const summary = [
            typeof data.agent_count === 'number' ? `에이전트 ${data.agent_count}명` : null,
            Array.isArray(data.agents) ? `참여: ${data.agents.join(', ')}` : null
          ]
            .filter(Boolean)
            .join(' · ');
          pushLog({
            agent: 'System',
            role: 'system',
            type: 'action',
            message: summary ? `리스크 검토 시작 · ${summary}` : '리스크 검토 시작'
          });
        }
        if (eventType === 'risk_review.completed') {
          pushLog({ agent: 'System', role: 'system', type: 'consensus', message: '리스크 검토 완료' });
        }
        if (eventType === 'owner_search.started') {
          const summary = [
            data.required_level ? `요구 레벨 ${data.required_level}` : null,
            Array.isArray(data.domains) ? `도메인 ${data.domains.join(', ')}` : null
          ]
            .filter(Boolean)
            .join(' · ');
          pushLog({
            agent: 'System',
            role: 'system',
            type: 'action',
            message: summary ? `담당자 탐색 시작 · ${summary}` : '담당자 탐색 시작'
          });
        }
        if (eventType === 'owner_search.assigned') {
          const summary = [
            data.assignment_reason ? `사유: ${data.assignment_reason}` : null
          ]
            .filter(Boolean)
            .join(' · ');
          pushLog({
            agent: 'System',
            role: 'system',
            type: 'action',
            message: summary ? `담당자 배정 완료 · ${summary}` : '담당자 배정 완료'
          });
        }
        if (eventType === 'decision_card') {
          pushLog({ agent: 'System', role: 'system', type: 'check', message: '의사결정 카드 생성 완료' });
        }

        if (eventType === 'initial_decision.started') {
          setIssueMeta({
            id: data.issue_id,
            title: data.issue_title
          });
        }

        if (eventType === 'graph_candidates') {
          if (typeof data.count === 'number') {
            pushLog({
              agent: 'System',
              role: 'system',
              type: 'action',
              message: `그래프 후보 ${data.count}명 수집`
            });
          }
          const nextCandidates: RoutingCandidate[] = (data.candidates ?? []).map((candidate: any) => ({
            id: candidate.person_id ?? candidate.id,
            name: candidate.name,
            role: candidate.role,
            level: candidate.level,
            team: candidate.team,
            department: candidate.department,
            source: 'graph'
          }));
          setCandidates(nextCandidates);
        }

        if (eventType === 'vector_ranked') {
          const coreCount = Array.isArray(data.core_nodes) ? data.core_nodes.length : 0;
          const refCount = Array.isArray(data.reference_nodes) ? data.reference_nodes.length : 0;
          if (coreCount + refCount > 0) {
            pushLog({
              agent: 'System',
              role: 'system',
              type: 'action',
              message: `벡터 리랭킹 완료 · 핵심 ${coreCount} · 참조 ${refCount}`
            });
          }
          const ranked: RoutingCandidate[] = (data.core_nodes ?? []).map((candidate: any) => ({
            id: candidate.person_id ?? candidate.id,
            name: candidate.name,
            role: candidate.role,
            score: candidate.score,
            source: 'vector'
          }));
          const referenced: RoutingCandidate[] = (data.reference_nodes ?? []).map((candidate: any) => ({
            id: candidate.person_id ?? candidate.id,
            name: candidate.name,
            role: candidate.role,
            score: candidate.score,
            source: 'reference'
          }));
          setCandidates(prev => mergeCandidates(prev, ranked));
          if (referenced.length > 0) {
            setCandidates(prev => mergeCandidates(prev, referenced));
          }
          if (ranked.length > 0) {
            setDecisionSet(prev => (prev.length > 0 ? prev : ranked.slice(0, 5)));
          }
        }

        if (eventType === 'reference_nodes_found') {
          const references: RoutingCandidate[] = (data.references ?? []).map((reference: any) => ({
            id: reference.person_id ?? reference.id,
            name: reference.name ?? reference.person_id,
            role: reference.role,
            score: reference.similarity,
            reason: reference.experience_summary,
            source: 'reference'
          }));
          if (references.length > 0) {
            pushLog({
              agent: 'System',
              role: 'system',
              type: 'check',
              message: `유사 경험자 ${references.length}명 참조`
            });
            setCandidates(prev => mergeCandidates(prev, references));
          }
        }

        if (eventType === 'meeting_ready') {
          const participants: RoutingCandidate[] = (data.participants ?? []).map((participant: MeetingParticipant) => ({
            id: participant.person_id ?? participant.id ?? participant.name,
            name: participant.name,
            role: participant.role,
            source: 'meeting'
          }));
          setDecisionSet(participants);
          setMeetingParticipants(participants);
          if (data.summary) {
            pushLog({
              agent: 'System',
              role: 'system',
              type: 'check',
              message: `미팅 준비 완료 · ${data.summary}`
            });
          }
        }

        if (eventType === 'owner_search.candidates') {
          const owners: RoutingCandidate[] = (data.candidates ?? []).map((candidate: any) => ({
            id: candidate.id,
            name: candidate.name,
            level: candidate.level,
            score: candidate.match_score,
            source: 'owner'
          }));
          if (typeof data.count === 'number') {
            pushLog({
              agent: 'System',
              role: 'system',
              type: 'action',
              message: `담당자 후보 ${data.count}명 탐색`
            });
          }
          setCandidates(prev => mergeCandidates(prev, owners));
        }

        if (eventType === 'owner_search.assigned') {
          const owner = data.owner;
          const reviewers = data.co_reviewers ?? [];
          const assigned: RoutingCandidate[] = [owner, ...reviewers].filter(Boolean).map((member: any) => ({
            id: member.id,
            name: member.name,
            level: member.level,
            source: 'owner'
          }));
          setDecisionSet(assigned);
          setCardAssigned({
            owner_id: owner?.id,
            owner_name: owner?.name,
            co_reviewer_ids: reviewers.map((reviewer: any) => reviewer.id),
            approval_status: data.approval_status
          });
          fetchSubgraph();
        }

        if (eventType === 'decision_card') {
          setDecisionCard(data as DecisionCardStreamData);
          if (modeRef.current === 'compiling') {
            setTimeout(() => setMode('decision'), 400);
          }
        }

        if (eventType === 'decision_card.assigned') {
          setCardAssigned(prev => ({
            ...prev,
            card_id: data.card_id,
            owner_id: data.owner_id,
            owner_name: data.owner_name,
            co_reviewer_ids: data.co_reviewer_ids,
            approval_status: data.approval_status
          }));
          pushLog({ agent: 'System', role: 'system', type: 'consensus', message: '의사결정 완료' });
          setStreamComplete(true);
          fetchSubgraph();
        }

        if (eventType === 'meeting_ready') {
          setToasts(['미팅 채널이 준비되었습니다.']);
          setTimeout(() => setToasts([]), 3000);
        }

        if (eventType === 'error') {
          setError(data?.message ?? '의사결정 스트림 오류가 발생했습니다.');
          setPhase('error');
        }
      },
      onError: (err) => {
        setError(err.message);
        setPhase('error');
      }
    });

    return () => {
      window.clearTimeout(revealTimer);
      stopStream();
    };
  }, [runId]);

  useEffect(() => {
    if (location.state?.mode) {
      setMode(location.state.mode);
    } else {
      setMode(location.state?.startMode === 'decision' ? 'decision' : 'analysis');
    }

    if (location.state?.showRoutingToasts) {
      setToasts(['Security Inbox에 추가됨', 'Legal Inbox에 추가됨']);
      const timer = setTimeout(() => setToasts([]), 3000);
      return () => clearTimeout(timer);
    }
    if (location.state?.startMode === 'decision') {
      setToasts(['의사결정 카드 화면으로 이동했습니다']);
      const timer = setTimeout(() => setToasts([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    navigate('.', {
      replace: true,
      state: {
        ...location.state,
        mode
      }
    });
  }, [mode, navigate, location.state]);

  useEffect(() => {
    if (mode !== 'compiling') return;
    if (!decisionCard && !cardAssigned) return;
    setStreamComplete(true);
  }, [mode, decisionCard, cardAssigned]);

  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
        <h2 className="text-xl font-bold">분석할 이슈가 없습니다</h2>
        <p className="text-sm text-muted-foreground">새 이슈를 제출하면 라우팅 분석을 시작합니다.</p>
        <Button onClick={() => navigate('/issues/new')}>새 이슈 제출</Button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
        <h2 className="text-xl font-bold">분석 스트림 오류</h2>
        <p className="text-sm text-muted-foreground">{error ?? '오류가 발생했습니다.'}</p>
        <Button variant="outline" onClick={() => navigate('/issues/new')}>다시 제출</Button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold">조직 그래프 분석 중...</h2>
        <p className="text-muted-foreground">1,200명 풀에서 최소 판단 집합을 계산하고 있습니다</p>
      </div>
    );
  }

  if (phase === 'reveal') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-full max-w-md rounded-lg border bg-card/60 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">라우팅 그래프 준비 중...</p>
            <p className="text-xs text-muted-foreground">조직 신호를 수집해 판단 집합을 수렴하고 있어요</p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>조직 그래프 로딩</span>
              <span className="text-foreground">완료</span>
            </div>
            <div className="flex items-center justify-between">
              <span>연결 경로 탐색</span>
              <span className="text-foreground">진행 중</span>
            </div>
            <div className="flex items-center justify-between">
              <span>판단 집합 수렴</span>
              <span>대기</span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full w-2/3 bg-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toasts.length > 0 && (
        <div className="fixed right-6 top-20 z-50 space-y-2">
          {toasts.map((toast, idx) => (
            <div key={`${toast}-${idx}`} className="rounded-lg border bg-background/90 px-4 py-2 text-sm shadow-lg">
              {toast}
            </div>
          ))}
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
           <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
             <span>{displayIssueId}</span>
             <span>/</span>
             <span className="uppercase">{mode} Phase</span>
           </div>
           {issueMeta?.title && (
             <p className="text-xs text-muted-foreground">{issueMeta.title}</p>
           )}
           <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'analysis' && '라우팅 분석'}
            {mode === 'meeting' && '마이크로 미팅'}
            {mode === 'compiling' && '의사결정 컴파일'}
            {mode === 'decision' && '의사결정 카드'}
           </h1>
           <p className="text-muted-foreground">
             {mode === 'analysis' && '최소 판단 경로를 식별하고 있습니다'}
             {mode === 'meeting' && '비동기 합의 채널을 시뮬레이션합니다'}
             {mode === 'compiling' && 'AI 에이전트들이 합의 내용을 바탕으로 의사결정 카드를 생성합니다'}
             {mode === 'decision' && '결정 맥락, 리스크, 책임을 최종 컴파일합니다'}
           </p>
        </div>
        {mode === 'analysis' && (
          <Button
            onClick={() => setMode('meeting')}
            className="shadow-lg shadow-primary/20"
            disabled={meetingRoster.length === 0}
          >
             마이크로 미팅 시작
          </Button>
        )}
      </div>

      {mode === 'analysis' && <KPIBar />}
      {mode === 'analysis' && (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          {!streamComplete ? (
            <div className="h-4 w-4 rounded-full border-2 border-slate-300/40 border-t-sky-500 animate-spin" />
          ) : (
            <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              ✓
            </div>
          )}
          <span>{streamComplete ? `처리 완료: ${streamStatus}` : `실시간 처리 중: ${streamStatus}`}</span>
        </div>
      )}
      {mode === 'analysis' && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground">
          {progressSteps.map((step, index) => {
            const isDone = receivedStepsRef.current.has(step.key);
            const isActive = index === currentStep;
            return (
              <div
                key={step.key}
                className={`flex items-center gap-1.5 rounded-full px-2 py-1 border ${
                  isDone
                    ? 'border-emerald-400/40 text-emerald-600 bg-emerald-500/10'
                    : isActive
                      ? 'border-sky-400/40 text-sky-500 bg-sky-500/10'
                      : 'border-border/60'
                }`}
              >
                <span className="text-[10px] font-semibold">{index + 1}</span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="my-6 h-px bg-border/50" />

      {/* Mode Content */}
      {mode === 'analysis' && (
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="min-w-0">
             <GraphCanvas
               nodes={graphNodes}
               edges={graphEdges}
               selectedCandidates={decisionSet}
               loading={graphLoading || subgraphLoading}
               error={graphError ?? undefined}
             />
          </div>
          <div className="bg-card/30 backdrop-blur rounded-lg p-4 border border-border h-[600px] overflow-y-auto sticky top-24 self-start">
             <h3 className="font-semibold mb-4 sticky top-0 bg-background/80 backdrop-blur z-10 p-2 border-b">
               추천 판단 집합 ({decisionSet.length})
             </h3>
             {candidates.length === 0 && (
               <p className="text-xs text-muted-foreground p-2">후보자를 불러오는 중입니다.</p>
             )}
             {candidates.map((candidate, idx) => (
               <CandidateCard 
                 key={candidate.id}
                 candidate={candidate}
                 index={idx}
                 isSelected={decisionSet.some(c => c.id === candidate.id)}
                 onSelect={() => {}}
               />
             ))}
          </div>
        </div>
      )}

      {mode === 'meeting' && (
        <div className="max-w-4xl mx-auto">
           <MeetingPanel 
              participants={meetingRoster} 
              runId={runId}
              issueId={issueMeta?.id ?? issueId}
              onComplete={() => setMeetingComplete(true)}
           />
           {meetingComplete && (
             <div className="mt-4 flex justify-end">
               <Button onClick={() => setMode('compiling')} className="shadow-lg">
                 다음: AI 리스크 검토
               </Button>
             </div>
           )}
        </div>
      )}
      
      {mode === 'compiling' && (
        <div className="max-w-4xl mx-auto">
           <CompilationProcess logs={streamLogs} onComplete={() => {}} />
           <div className="mt-4 flex justify-end">
             <Button
               onClick={() => setMode('decision')}
               disabled={!streamComplete}
               className="shadow-lg"
             >
               다음: 의사결정 카드 생성
             </Button>
           </div>
        </div>
      )}

      {mode === 'decision' && (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
           <DecisionCardView 
              decisionSet={decisionSet}
              decisionData={decisionCard}
              cardMeta={cardAssigned ?? undefined}
              runId={runId}
              onClose={() => setMode('analysis')} 
           />
        </div>
      )}
    </div>
  );
}
