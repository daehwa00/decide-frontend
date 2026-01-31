import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '@/components/ui';
import { Activity, Shield, Scale, Star } from 'lucide-react';
import { ApiClient } from '@/services/apiClient';
import type { ApiIssueResponse } from '@/types/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Array<{
    id: string;
    title: string;
    tags: string[];
    urgency: '높음' | '중간' | '낮음';
    status: string;
    owner: string;
    age: string;
    sla: '위험' | '정상';
    decisionSet: string[];
    decisionContext: Record<string, string>;
    collaboration: {
      steps: { security: 'done' | 'current' | 'pending'; legal: 'done' | 'current' | 'pending'; owner: 'done' | 'current' | 'pending' };
    };
    runId?: string;
  }>>([]);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedIssue = issues.find(issue => issue.id === selectedIssueId) ?? issues[0];
  const tagLabels: Record<string, string> = {
    privacy: '프라이버시',
    data: '데이터',
    customer_comms: '고객 커뮤니케이션',
    pricing: '가격',
    brand: '브랜드',
    legal: '법무',
    infra: '인프라',
    security: '보안',
    growth: '성장',
    payments: '결제',
    payment: '결제',
    ux: 'UX'
  };
  const collaborationIcons = {
    security: Shield,
    legal: Scale,
    owner: Star
  } as const;
  const collaborationLabels = {
    security: 'Security',
    legal: 'Legal',
    owner: 'Owner'
  } as const;
  const stageClass = {
    done: 'bg-primary text-primary-foreground',
    current: 'bg-primary/10 text-primary ring-1 ring-primary/30',
    pending: 'bg-muted text-muted-foreground ring-1 ring-border'
  } as const;
  const stageTextMap = {
    security: '보안 검토',
    legal: '법무 검토',
    owner: '책임자 결정'
  } as const;
  const deriveCollaborationText = (steps: typeof issues[number]['collaboration']['steps']) => {
    const current = (Object.keys(steps) as Array<keyof typeof steps>).filter(key => steps[key] === 'current');
    if (current.length > 0) {
      return current.map(key => stageTextMap[key]).join(' · ') + ' 중';
    }
    const pending = (Object.keys(steps) as Array<keyof typeof steps>).filter(key => steps[key] === 'pending');
    if (pending.length === 3) {
      return '라우팅 대기';
    }
    if (pending.length > 0) {
      return pending.map(key => stageTextMap[key]).join(' · ') + ' 대기';
    }
    return '검토 완료';
  };

  const issueRunMap = useMemo(() => {
    try {
      const raw = localStorage.getItem('decide_issue_runs');
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }, []);

  const formatAge = (dateString: string) => {
    const created = new Date(dateString).getTime();
    if (Number.isNaN(created)) return '알 수 없음';
    const diffMs = Date.now() - created;
    const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const mapUrgency = (value?: string | null) => {
    if (!value) return '낮음';
    const upper = value.toUpperCase();
    if (upper.includes('HIGH')) return '높음';
    if (upper.includes('MID') || upper.includes('MED')) return '중간';
    if (upper.includes('LOW')) return '낮음';
    return '낮음';
  };

  const mapStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '대기';
      case 'PROCESSING':
        return '검토 중';
      case 'DECIDED':
        return '결정 완료';
      case 'EXECUTED':
        return '실행됨';
      case 'CANCELLED':
        return '취소됨';
      default:
        return status;
    }
  };

  const mapSteps = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return { security: 'current', legal: 'pending', owner: 'pending' } as const;
      case 'DECIDED':
      case 'EXECUTED':
        return { security: 'done', legal: 'done', owner: 'done' } as const;
      case 'CANCELLED':
        return { security: 'pending', legal: 'pending', owner: 'pending' } as const;
      default:
        return { security: 'pending', legal: 'pending', owner: 'pending' } as const;
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    ApiClient.listIssues({ limit: 20 })
      .then((data: ApiIssueResponse[]) => {
        if (!isMounted) return;
        const mapped = data.map(issue => {
          const runId = issueRunMap[issue.id];
          const placeholderDecision = runId ? '분석 대기' : '미배정';
          return {
            id: issue.id,
            title: issue.title ?? issue.text ?? '제목 없음',
            tags: issue.tags ?? [],
            urgency: mapUrgency(issue.urgency),
            status: mapStatusLabel(issue.status),
            owner: issue.submitter_id ? `제출자 ${issue.submitter_id}` : '미지정',
            age: formatAge(issue.created_at),
            sla: formatAge(issue.created_at).includes('d') ? '위험' : '정상',
            decisionSet: [placeholderDecision],
            decisionContext: {
              [placeholderDecision]: runId ? '라우팅 분석 필요' : 'Run ID 없음'
            },
            collaboration: {
              steps: mapSteps(issue.status)
            },
            runId
          };
        });
        setIssues(mapped);
        setSelectedIssueId(prev => {
          if (mapped.some(issue => issue.id === prev)) return prev;
          return mapped[0]?.id ?? '';
        });
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : '이슈 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [issueRunMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">업무 큐</p>
          <h1 className="text-3xl font-bold tracking-tight">의사결정 인박스</h1>
          <p className="text-sm text-muted-foreground">
            최소 판단 집합이 필요한 이슈들이 실시간으로 쌓이는 업무 목록입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/issues/new">
            <Button size="sm">새 이슈</Button>
          </Link>
          <Link to="/analysis">
            <Button size="sm" variant="outline">분석 열기</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest">
          <Activity className="h-3.5 w-3.5" />
          현재 조직 상태
        </div>
        <div className="h-3 w-px bg-border/60" />
        <span>1200명 참여</span>
        <span>· 평균 결정 7.4분</span>
        <span>· SLA 경고 3건</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">들어온 이슈</h2>
            <p className="text-xs text-muted-foreground">
              {loading ? '불러오는 중...' : `대기 ${issues.length}건`}
            </p>
          </div>

          <div className="space-y-3">
            {error && (
              <Card className="p-4 text-xs text-red-500 border-red-200 space-y-2">
                <div>요청 실패: {error}</div>
                <pre className="whitespace-pre-wrap text-[10px] text-red-400/90">
                  {error}
                </pre>
              </Card>
            )}
            {!loading && issues.length === 0 && !error && (
              <Card className="p-4 text-xs text-muted-foreground">
                아직 등록된 이슈가 없습니다.
              </Card>
            )}
            {issues.map(issue => (
              <Card
                key={issue.id}
                className={`p-4 hover:bg-accent/30 transition-colors cursor-pointer ${selectedIssueId === issue.id ? 'border-primary ring-1 ring-primary' : ''}`}
                onClick={() => setSelectedIssueId(issue.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={issue.urgency === '높음' ? 'destructive' : issue.urgency === '중간' ? 'secondary' : 'outline'}
                        className="text-[10px]"
                      >
                        {issue.urgency === '높음' && '🔴 High'}
                        {issue.urgency === '중간' && '🟡 Medium'}
                        {issue.urgency === '낮음' && '🟢 Low'}
                        {issue.sla === '위험' ? ' · SLA Risk' : ''}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{issue.status}</Badge>
                    </div>
                    <div className="font-semibold">{issue.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="uppercase tracking-wide">{issue.id}</span>
                      <span>책임자: {issue.owner}</span>
                      <span>대기: {issue.age}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {issue.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] uppercase">
                          {tagLabels[tag] ?? tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-wide">협업 단계</span>
                        <span className="font-medium text-foreground">
                          {deriveCollaborationText(issue.collaboration.steps)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(Object.keys(collaborationIcons) as Array<keyof typeof collaborationIcons>).map(key => {
                          const Icon = collaborationIcons[key];
                          const state = issue.collaboration.steps[key];
                          return (
                            <div key={key} className="flex items-center gap-1">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${stageClass[state as keyof typeof stageClass]}`}>
                                <Icon className="h-3 w-3" />
                                {collaborationLabels[key]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        {(Object.keys(collaborationIcons) as Array<keyof typeof collaborationIcons>).map((key, index, arr) => {
                          const state = issue.collaboration.steps[key];
                          const segmentClass =
                            state === 'done'
                              ? 'bg-primary'
                              : state === 'current'
                                ? 'bg-primary/40'
                                : 'bg-muted';
                          return (
                            <div key={`${key}-segment`} className="flex items-center gap-2 flex-1">
                              <div className={`h-1.5 rounded-full w-full ${segmentClass}`} />
                              {index < arr.length - 1 && <div className="h-1.5 w-2 bg-transparent" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>판단 집합</p>
                    <p className="text-sm font-semibold text-foreground">
                      {issue.decisionSet[0]}
                    </p>
                    <p>{issue.decisionSet.length}명</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3 sticky top-24 self-start">
          <h2 className="text-lg font-semibold">현재 결정</h2>
          <Card className="p-4 space-y-4 bg-slate-50/80 border-slate-200">
            {selectedIssue ? (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{selectedIssue.id}</p>
                  <p className="text-base font-semibold">{selectedIssue.title}</p>
                  <p className="text-xs text-muted-foreground">상태: {selectedIssue.status}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">최소 판단 집합</p>
                  <div className="space-y-2">
                    {selectedIssue.decisionSet.map(member => (
                      <div key={member} className="flex items-start justify-between text-sm">
                        <div className="space-y-1">
                          <span>{member}</span>
                          <p className="text-[11px] text-muted-foreground">
                            {(selectedIssue.decisionContext as any)?.[member] ?? '컨텍스트'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">시스템 선정</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">다음 작업</p>
                  <p className="text-[11px] text-muted-foreground">판단 집합에게 검토 요청이 전송됩니다</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!selectedIssue?.runId}
                      onClick={() => {
                        if (!selectedIssue?.runId) return;
                        navigate('/analysis', {
                          state: {
                            run_id: selectedIssue.runId,
                            issue_id: selectedIssue.id,
                            tags: selectedIssue.tags,
                            showRoutingToasts: true
                          }
                        });
                      }}
                    >
                      라우팅 시작
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={!selectedIssue?.runId}
                      onClick={() => {
                        if (!selectedIssue?.runId) return;
                        navigate('/analysis', {
                          state: {
                            run_id: selectedIssue.runId,
                            issue_id: selectedIssue.id,
                            tags: selectedIssue.tags,
                            startMode: 'decision'
                          }
                        });
                      }}
                    >
                      의사결정 카드 열기
                    </Button>
                  </div>
                  {!selectedIssue?.runId && (
                    <p className="text-[10px] text-muted-foreground">
                      이 이슈는 run_id가 없어 분석을 시작할 수 없습니다.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">선택된 이슈가 없습니다.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
