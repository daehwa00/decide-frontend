import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Label } from '@/components/ui';
import { RoutingResult } from '@/types';
import { CheckCircle2, Fingerprint, ShieldAlert, History, Users, AlertTriangle, FileText } from 'lucide-react';
import { LogService } from '@/services/LogService';

interface DecisionCardProps {
  result: RoutingResult;
  onClose: () => void;
}

export function DecisionCardView({ result, onClose }: DecisionCardProps) {
  const [status, setStatus] = useState<'draft' | 'approved' | 'rejected' | 'conditional'>('draft');
  const [comment, setComment] = useState('');
  
  const statusLabel: Record<typeof status, string> = {
    draft: '초안',
    approved: '승인',
    rejected: '반려',
    conditional: '조건부 승인'
  };

  const mockIssueTags = ['privacy', 'data', 'customer_comms'];

  const roleSummaryTemplates = {
    security: {
      concerns: '개인정보 범위 과다 수집 가능성',
      conditions: '수집 항목 최소화, 30일 보관',
      risk: 'Medium'
    },
    legal: {
      concerns: 'EU 사용자 대상 규정 준수 이슈',
      conditions: '보관 기간 제한 및 고지 문구 반영',
      risk: 'High'
    },
    finance: {
      concerns: '운영 비용 상승',
      conditions: '월 비용 상한 설정',
      risk: 'Low'
    },
    product: {
      concerns: '사용자 가치 대비 비용 효율성',
      conditions: '실험 범위 제한 및 지표 검증',
      risk: 'Medium'
    }
  } as const;

  const inferRoleKey = (role: string) => {
    if (role.toLowerCase().includes('security')) return 'security';
    if (role.toLowerCase().includes('legal')) return 'legal';
    if (role.toLowerCase().includes('finance')) return 'finance';
    return 'product';
  };

  const generateRoleSummary = (roleKey: keyof typeof roleSummaryTemplates, tags: string[]) => {
    const base = roleSummaryTemplates[roleKey];
    if (tags.includes('pricing') || tags.includes('finance')) {
      if (roleKey === 'finance') {
        return { ...base, concerns: '예산 상한 초과 가능성', conditions: '월 비용 상한 설정' };
      }
    }
    if (tags.includes('privacy') || tags.includes('data')) {
      if (roleKey === 'legal') {
        return { ...base, concerns: '개인정보 처리 동의 및 고지 이슈', conditions: '고지 문구 업데이트 및 보관 기간 제한' };
      }
      if (roleKey === 'security') {
        return { ...base, concerns: 'PII 노출 위험', conditions: '저장 시 암호화 및 접근 제어 강화' };
      }
    }
    return base;
  };

  const riskRows = [
    ...(mockIssueTags.some(tag => ['privacy', 'data', 'customer_comms'].includes(tag))
      ? [
          { risk: 'GDPR 위반', owner: 'Legal', severity: 'High', mitigation: '30일 보관 제한', applied: true },
          { risk: 'PII 노출', owner: 'Security', severity: 'Medium', mitigation: '암호화 필수', applied: true }
        ]
      : []),
    ...(mockIssueTags.some(tag => ['pricing', 'finance'].includes(tag))
      ? [{ risk: '비용 증가', owner: 'Finance', severity: 'Low', mitigation: '월 비용 상한', applied: true }]
      : [{ risk: '비용 증가', owner: 'Finance', severity: 'Low', mitigation: '월 비용 상한', applied: true }])
  ];

  const auditLogs = [
    { id: 'log-issue', label: 'Issue created by PM', timestamp: '10:31' },
    { id: 'log-routing', label: 'Routing completed (1200 → 12 → 5)', timestamp: '10:32' },
    { id: 'log-card', label: 'Decision Card generated', timestamp: '10:35' },
    ...LogService.getLogs('card-1').map(log => ({
      id: log.id,
      label: `${log.action} by ${log.actor_id}`,
      timestamp: new Date(log.timestamp).toLocaleTimeString()
    }))
  ];

  const handleAction = (action: 'approved' | 'rejected' | 'conditional') => {
    if (!comment) {
       alert("감사 로그를 위해 코멘트를 입력해 주세요.");
       return;
    }
    setStatus(action);
    LogService.addLog('card-1', action, comment, 'current-user');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in zoom-in-95 duration-300 pb-10">
      <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <div className="flex justify-between items-center">
             <CardTitle className="flex items-center space-x-2 text-xl">
                <Fingerprint className="w-6 h-6 text-blue-500" />
                <span>의사결정 카드 #DC-2024-001</span>
             </CardTitle>
             <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-muted-foreground">ISS-2841</Badge>
                <Badge variant={status === 'draft' ? 'secondary' : 'default'} className="uppercase text-sm px-3 py-1">
                   {statusLabel[status]}
                </Badge>
             </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-12 divide-x divide-border h-full min-h-[600px]">
            {/* Left Column: Context & Rationale (7/12) */}
            <div className="col-span-7 p-6 space-y-8">
               {/* Issue Summary */}
               <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decision Context</Label>
                  <h3 className="text-2xl font-bold leading-tight">행동 데이터 수집 확대에 따른 개인정보 정책 수립</h3>
                  <p className="text-muted-foreground">사용자 행동 기반 추천 시스템 고도화를 위해 GPS 및 앱 사용 로그 수집 범위를 확대하고자 함.</p>
               </div>

               {/* Recommendation */}
               <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-900">
                  <h4 className="flex items-center font-bold text-emerald-700 dark:text-emerald-400 mb-2 text-lg">
                     <CheckCircle2 className="w-5 h-5 mr-2" /> 추천 결론: 조건부 승인
                  </h4>
                  <p className="text-emerald-900 dark:text-emerald-100 leading-relaxed text-sm">
                     서비스 품질 향상을 위한 데이터 수집 필요성은 인정되나, 개인정보 보호 리스크 완화를 위해 
                     <span className="font-bold underline decoration-emerald-500 mx-1">데이터 보관 기간을 30일로 제한</span>
                     하고, 이후 데이터는 즉시 익명화 처리 해야 합니다.
                  </p>
               </div>

               {/* Agent Stances */}
               <div className="space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    Agent Consensus Summary
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                     {result.decision_set.map(p => {
                       const roleKey = inferRoleKey(p.role);
                       const template = generateRoleSummary(roleKey, mockIssueTags);
                       const isHighRisk = template.risk === 'High';
                       return (
                         <div key={p.id} className={`p-3 rounded-lg border bg-card hover:bg-muted/5 transition-colors flex flex-col gap-2 ${isHighRisk ? 'border-red-200 dark:border-red-900/30 ring-1 ring-red-50 dark:ring-red-900/10' : ''}`}>
                            <div className="flex items-start justify-between">
                               <div className="flex flex-col gap-1 w-full min-w-0">
                                  <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 h-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                    {p.role}
                                  </Badge>
                                  <span className="text-sm font-semibold truncate w-full" title={p.name}>{p.name}</span>
                               </div>
                               {isHighRisk && <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />}
                            </div>
                            <div className="space-y-1.5 pt-1 border-t border-dashed">
                               <div className="text-xs">
                                  <span className="text-muted-foreground block text-[10px]">주요 우려</span>
                                  <span className="font-medium text-[11px] leading-tight block">{template.concerns}</span>
                               </div>
                               <div className="text-xs bg-muted/50 p-1.5 rounded text-[11px] leading-tight">
                                  <span className="font-semibold text-primary text-[10px] block mb-0.5">REQUIREMENT</span> 
                                  {template.conditions}
                               </div>
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>

            {/* Right Column: Risks, Assignment, Actions (5/12) */}
            <div className="col-span-5 bg-muted/10 flex flex-col h-full">
               <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* Risks */}
                  <div className="space-y-3">
                     <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Identified Risks
                     </Label>
                     <div className="space-y-2">
                        {riskRows.map(row => (
                           <div key={row.risk} className="bg-background border rounded-lg p-3 shadow-sm flex items-start space-x-3">
                              <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${row.severity === 'High' ? 'bg-red-500' : 'bg-orange-400'}`} />
                              <div className="flex-1 space-y-1">
                                 <div className="flex justify-between items-center text-sm font-medium">
                                    <span>{row.risk}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${row.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                       {row.severity}
                                    </span>
                                 </div>
                                 <div className="text-xs text-muted-foreground">
                                    완화대책: {row.mitigation}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Assignment Reason */}
                  <div className="space-y-3">
                     <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Assignment Rationale
                     </Label>
                     <div className="bg-background border rounded-lg p-4 text-xs space-y-2 text-muted-foreground">
                        <p>• <strong className="text-foreground">Security Reviewer</strong>: 최근 90일 내 유사 개인정보 이슈 4건 참여 이력 기반 배정</p>
                        <p>• <strong className="text-foreground">Legal Reviewer</strong>: EU 사용자 정책 도메인 전문가</p>
                        <p>• <strong className="text-foreground">Product Owner</strong>: 해당 서비스 최종 책임자</p>
                     </div>
                  </div>

                  {/* Audit Logs */}
                  <div className="space-y-2">
                     <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <History className="w-3 h-3 mr-1" /> Audit Trail
                     </Label>
                     <div className="space-y-2 pl-2 border-l-2 border-muted">
                        {auditLogs.slice(0, 5).map(log => (
                           <div key={log.id} className="text-xs flex justify-between relative">
                              <span className="text-muted-foreground">{log.label}</span>
                              <span className="text-muted-foreground opacity-50">{log.timestamp}</span>
                              <div className="absolute -left-[13px] top-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Action Footer */}
               <div className="p-6 bg-background border-t mt-auto sticky bottom-0">
                  {status === 'draft' ? (
                     <div className="space-y-3">
                        <textarea 
                           className="w-full p-3 rounded-md bg-muted/30 border text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none h-20"
                           placeholder="최종 승인/반려 코멘트를 입력하세요..."
                           value={comment}
                           onChange={e => setComment(e.target.value)}
                        />
                        <div className="grid grid-cols-3 gap-3">
                           <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('approved')}>
                              승인
                           </Button>
                           <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:text-orange-300" onClick={() => handleAction('conditional')}>
                              조건부 승인
                           </Button>
                           <Button variant="destructive" onClick={() => handleAction('rejected')}>
                              반려
                           </Button>
                        </div>
                     </div>
                  ) : (
                     <div className="text-center space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                           의사결정이 <span className="text-foreground font-bold">{statusLabel[status]}</span> 되었습니다.
                        </p>
                        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                           <History className="w-3 h-3" />
                           <span>Immutable Ledger Block #938210 verified</span>
                        </div>
                        <Button variant="secondary" className="w-full" onClick={onClose}>목록으로 돌아가기</Button>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

