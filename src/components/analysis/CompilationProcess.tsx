import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui';
import { Bot, Shield, Scale, FileText, Terminal, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompilationProcessProps {
  onComplete: () => void;
  logs?: AgentLog[];
}

export type AgentLog = {
  id: string;
  agent: string;
  role: 'security' | 'legal' | 'product' | 'system';
  message: string;
  type: 'check' | 'warning' | 'consensus' | 'action';
};

export function CompilationProcess({ onComplete, logs: externalLogs }: CompilationProcessProps) {
  const [logs, setLogs] = useState<AgentLog[]>(externalLogs ?? []);
  const scrollRef = useRef<HTMLDivElement>(null);

  const script: Omit<AgentLog, 'id'>[] = [
    { agent: 'System', role: 'system', message: '미팅 로그 컨텍스트 추출 중...', type: 'action' },
    { agent: 'System', role: 'system', message: '주요 키워드: "행동 데이터", "GPS", "90일 보관"', type: 'check' },
    { agent: 'Ethan Park', role: 'security', message: '⚠️ GPS 데이터 감지. PII 등급 상향 조정 필요.', type: 'warning' },
    { agent: 'Soojin Lee', role: 'legal', message: '잠시만요, GPS 수집 시 위치정보법 제15조 검토가 필요합니다.', type: 'check' },
    { agent: 'Minji Kim', role: 'product', message: '서비스 제공을 위해 필수적입니다. 사용자 동의 절차는 UX에 포함되어 있습니다.', type: 'action' },
    { agent: 'Ethan Park', role: 'security', message: '보관 기간 90일은 리스크가 너무 큽니다. 리스크 스코어: 8.5/10', type: 'warning' },
    { agent: 'Soojin Lee', role: 'legal', message: 'GDPR 컴플라이언스 위반 소지 있음. 30일로 단축하거나 익명화 처리 필수입니다.', type: 'warning' },
    { agent: 'Minji Kim', role: 'product', message: '리텐션 분석을 위해 90일이 필요하지만... 익명화된 데이터라면 수용 가능합니다.', type: 'consensus' },
    { agent: 'System', role: 'system', message: '✅ 합의 감지: "30일 원본 보관 + 이후 익명화"', type: 'check' },
    { agent: 'Soojin Lee', role: 'legal', message: '조건부 승인 조항 생성 중: "익명화 처리 기술 검증 조건부"', type: 'action' },
    { agent: 'Ethan Park', role: 'security', message: '기술 보안성 검토 책임자 할당: Ethan Park', type: 'action' },
    { agent: 'System', role: 'system', message: '최종 의사결정 카드 합성 완료.', type: 'check' }
  ];

  useEffect(() => {
    if (externalLogs) {
      setLogs(externalLogs);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= script.length) {
        clearInterval(interval);
        setTimeout(onComplete, 1500);
        return;
      }

      const nextLog = script[currentIndex];
      setLogs(prev => [...prev, { ...nextLog, id: Math.random().toString() }]);
      currentIndex++;

      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 800);

    return () => clearInterval(interval);
  }, [externalLogs, onComplete]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (role: string) => {
    switch (role) {
      case 'security': return <Shield className="w-4 h-4 text-red-400" />;
      case 'legal': return <Scale className="w-4 h-4 text-blue-400" />;
      case 'product': return <FileText className="w-4 h-4 text-orange-400" />;
      case 'system': return <Terminal className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeStyle = (type: AgentLog['type']) => {
    switch (type) {
      case 'warning': return 'text-amber-400';
      case 'consensus': return 'text-green-400 font-bold';
      case 'check': return 'text-blue-300';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-500">
       <div className="text-center space-y-2">
         <h2 className="text-2xl font-bold flex items-center justify-center">
            <Bot className="w-8 h-8 mr-3 text-primary animate-pulse" />
            Decision Compiler Agent
         </h2>
         <p className="text-muted-foreground">멀티 에이전트가 합의 내용을 검증하고 최종 조건을 조율 중입니다...</p>
       </div>

       <Card className="w-full max-w-3xl bg-slate-950 border-slate-800 p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="text-xs text-slate-400 font-mono">agent_consensus_protocol.log</div>
          </div>
          
          <div 
            ref={scrollRef}
            className="h-[400px] overflow-y-auto p-6 font-mono text-sm space-y-3 bg-slate-950/50"
          >
             <AnimatePresence>
               {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3"
                  >
                     <div className="mt-0.5 opacity-80">{getIcon(log.role)}</div>
                     <div className="flex-1">
                        <span className={`font-bold mr-2 ${
                           log.role === 'security' ? 'text-red-400' :
                           log.role === 'legal' ? 'text-blue-400' :
                           log.role === 'product' ? 'text-orange-400' : 'text-green-400'
                        }`}>
                           [{log.agent}]
                        </span>
                        <span className={getTypeStyle(log.type)}>{log.message}</span>
                     </div>
                  </motion.div>
               ))}
               {logs.length < script.length && (
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   className="pl-7 text-green-500/50 animate-pulse"
                 >
                   _
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
       </Card>
    </div>
  );
}
