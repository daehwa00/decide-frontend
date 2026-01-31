import { Activity } from 'lucide-react';

export function KPIBar() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest">
        <Activity className="h-3.5 w-3.5" />
        조직 그래프 상태
      </div>
      <div className="h-3 w-px bg-border/60" />
      <span>1200명</span>
      <span>· 그래프 엣지 ~15k</span>
      <span>· 결정 로그 8,432</span>
      <span>· 활성 프로젝트 42</span>
    </div>
  );
}
