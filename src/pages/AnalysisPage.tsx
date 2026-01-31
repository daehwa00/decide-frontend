import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoutingService } from '@/services/RoutingService';
import { RoutingResult } from '@/types';
import { KPIBar } from '@/components/analysis/KPIBar';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { CandidateCard } from '@/components/analysis/CandidateCard';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { MeetingPanel } from '@/components/meeting/MeetingPanel';
import { DecisionCardView } from '@/components/decision/DecisionCard';
import { CompilationProcess } from '@/components/analysis/CompilationProcess';

export default function AnalysisPage() {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'ready'>('loading');
  const [result, setResult] = useState<RoutingResult | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'analysis' | 'meeting' | 'compiling' | 'decision'>('analysis');
  const [toasts, setToasts] = useState<string[]>([]);

  useEffect(() => {
    // Simulate fetching based on issue
    const mockIssue: any = { id: 'temp', tags: location.state?.tags || ['privacy'] };
    let timer: number | undefined;
    RoutingService.analyze(mockIssue).then(res => {
      setResult(res);
      setPhase('reveal');
      timer = window.setTimeout(() => setPhase('ready'), 2200);
    });
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

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

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold">조직 그래프 분석 중...</h2>
        <p className="text-muted-foreground">1,200명 풀에서 최소 판단 집합을 계산하고 있습니다</p>
      </div>
    );
  }

  if (!result) return <div>분석 결과를 불러오는 중 오류가 발생했습니다.</div>;

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
             <span>ISS-2841</span>
             <span>/</span>
             <span className="uppercase">{mode} Phase</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'analysis' && '라우팅 분석'}
            {mode === 'meeting' && '마이크로 미팅'}
            {mode === 'compiling' && '의사결정 컴파일'}
            {mode === 'decision' && '의사결정 카드'}
           </h1>
           <p className="text-muted-foreground">
             {mode === 'analysis' && `이슈 #${result.issue_id}의 최소 판단 경로를 식별했습니다`}
             {mode === 'meeting' && '비동기 합의 채널을 시뮬레이션합니다'}
             {mode === 'compiling' && 'AI 에이전트들이 합의 내용을 바탕으로 의사결정 카드를 생성합니다'}
             {mode === 'decision' && '결정 맥락, 리스크, 책임을 최종 컴파일합니다'}
           </p>
        </div>
        {mode === 'analysis' && (
          <Button onClick={() => setMode('meeting')} className="shadow-lg shadow-primary/20">
             마이크로 미팅 시작
          </Button>
        )}
      </div>

      {mode === 'analysis' && <KPIBar />}

      <div className="my-6 h-px bg-border/50" />

      {/* Mode Content */}
      {mode === 'analysis' && (
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="min-w-0">
             <GraphCanvas selectedCandidates={result.decision_set} />
          </div>
          <div className="bg-card/30 backdrop-blur rounded-lg p-4 border border-border h-[600px] overflow-y-auto sticky top-24 self-start">
             <h3 className="font-semibold mb-4 sticky top-0 bg-background/80 backdrop-blur z-10 p-2 border-b">
               추천 판단 집합 ({result.decision_set.length})
             </h3>
             {result.candidates.map((candidate, idx) => (
               <CandidateCard 
                 key={candidate.id}
                 candidate={candidate}
                 index={idx}
                 isSelected={result.decision_set.some(c => c.id === candidate.id)}
                 onSelect={() => {}}
               />
             ))}
          </div>
        </div>
      )}

      {mode === 'meeting' && (
        <div className="max-w-4xl mx-auto">
           <MeetingPanel 
              participants={result.decision_set} 
              onComplete={() => setMode('compiling')} 
           />
        </div>
      )}
      
      {mode === 'compiling' && (
        <div className="max-w-4xl mx-auto">
           <CompilationProcess onComplete={() => setMode('decision')} />
        </div>
      )}

      {mode === 'decision' && (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
           <DecisionCardView 
              result={result} 
              onClose={() => setMode('analysis')} 
           />
        </div>
      )}
    </div>
  );
}
