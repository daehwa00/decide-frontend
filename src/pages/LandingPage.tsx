import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Badge } from '@/components/ui';
import { Activity, Shield, Scale, Star } from 'lucide-react';

export default function LandingPage() {
  const issues = [
    {
      id: 'ISS-2841',
      title: '리텐션 개선을 위한 행동 데이터 수집 확대',
      tags: ['privacy', 'data', 'customer_comms'],
      urgency: '높음',
      status: '라우팅 대기',
      owner: '미지정',
      age: '2h 14m',
      sla: '위험',
      decisionSet: ['Minji Kim (PM)', 'Ethan Park (Security)', 'Soojin Lee (Legal)'],
      decisionContext: {
        'Minji Kim (PM)': '맥락 및 비즈니스',
        'Ethan Park (Security)': 'Risk Review',
        'Soojin Lee (Legal)': 'Compliance'
      },
      collaboration: {
        steps: { security: 'current', legal: 'current', owner: 'pending' }
      }
    },
    {
      id: 'ISS-2837',
      title: '엔터프라이즈 신규 가격 티어 도입',
      tags: ['pricing', 'brand', 'legal'],
      urgency: '중간',
      status: '검토 중',
      owner: 'Grace Han (VP Product)',
      age: '6h 03m',
      sla: '정상',
      decisionSet: ['Grace Han (Owner)', 'Jae Choi (Finance)', 'Mina Jung (Legal)'],
      decisionContext: {
        'Grace Han (Owner)': '최종 책임',
        'Jae Choi (Finance)': 'Budget Impact',
        'Mina Jung (Legal)': 'Compliance'
      },
      collaboration: {
        steps: { security: 'done', legal: 'done', owner: 'current' }
      }
    },
    {
      id: 'ISS-2832',
      title: 'EU 트래픽 신규 데이터센터 이전',
      tags: ['infra', 'security', 'legal'],
      urgency: '높음',
      status: '결정 대기',
      owner: 'Daniel Kang (Infra Dir.)',
      age: '1d 02h',
      sla: '위험',
      decisionSet: ['Daniel Kang (Owner)', 'Hana Shin (Security)', 'Leo Yoon (Legal)'],
      decisionContext: {
        'Daniel Kang (Owner)': '최종 책임',
        'Hana Shin (Security)': 'Risk Review',
        'Leo Yoon (Legal)': 'Compliance'
      },
      collaboration: {
        steps: { security: 'done', legal: 'current', owner: 'pending' }
      }
    },
    {
      id: 'ISS-2824',
      title: 'Q2 성장 리퍼럴 프로그램 론칭',
      tags: ['growth', 'brand'],
      urgency: '낮음',
      status: '대기열',
      owner: 'N/A',
      age: '2d 11h',
      sla: '정상',
      decisionSet: ['N/A'],
      decisionContext: {
        'N/A': '대기 중'
      },
      collaboration: {
        steps: { security: 'pending', legal: 'pending', owner: 'pending' }
      }
    }
  ];

  const [selectedIssueId, setSelectedIssueId] = useState(issues[0]?.id ?? '');
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
    growth: '성장'
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
            <p className="text-xs text-muted-foreground">대기 {issues.length}건</p>
          </div>

          <div className="space-y-3">
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
                <Link to="/analysis" state={{ showRoutingToasts: true }}>
                  <Button size="sm" className="w-full">라우팅 시작</Button>
                </Link>
                <Link to="/analysis" state={{ startMode: 'decision' }}>
                  <Button size="sm" variant="outline" className="w-full">의사결정 카드 열기</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
