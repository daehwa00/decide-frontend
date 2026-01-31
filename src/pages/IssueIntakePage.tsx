import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Shield, CreditCard, Server, Gavel, Tag, AlertTriangle } from 'lucide-react';

const TAGS = [
  { id: 'privacy', icon: Shield, label: '프라이버시' },
  { id: 'payments', icon: CreditCard, label: '결제' },
  { id: 'infra', icon: Server, label: '인프라' },
  { id: 'legal', icon: Gavel, label: '법무' },
  { id: 'security', icon: Shield, label: '보안' },
  { id: 'growth', icon: Tag, label: '성장' },
];

export default function IssueIntakePage() {
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission latency
    setTimeout(() => {
       navigate('/analysis', { state: { tags: selectedTags } });
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in slide-in-from-bottom-5 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">새 의사결정 요청</CardTitle>
          <p className="text-muted-foreground">
            조직 판단이 필요한 이슈를 설명하세요.
            <span className="block text-xs text-muted-foreground/80">
              입력된 이슈는 관련 부서와 책임자에게 자동으로 전달됩니다.
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">이슈 제목</Label>
              <Input id="title" placeholder="예: 리텐션 개선을 위한 행동 데이터 수집 확대" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">상세 설명</Label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="이슈의 배경과 필요한 결정 사항을 입력하세요..."
              />
            </div>

            <div className="space-y-3">
              <Label>도메인 태그 (최소 1개 선택)</Label>
              <p className="text-xs text-muted-foreground">
                선택한 태그는 검토가 필요한 부서와 판단 집합을 결정하는 데 사용됩니다.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TAGS.map(tag => {
                  const Icon = tag.icon;
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <div
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`cursor-pointer flex items-center space-x-2 p-3 rounded-md border transition-all hover:bg-accent ${
                        isSelected ? 'border-primary bg-accent ring-1 ring-primary' : 'bg-card'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{tag.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2">
                 <Label>긴급도</Label>
                 <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <option>낮음 (일반)</option>
                   <option>중간 (이번 주)</option>
                   <option>높음 (즉시)</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <Label>비용 영향</Label>
                 <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <option>없음 / 미미</option>
                   <option>{'<'} $50k</option>
                   <option>{'>'} $50k</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="dueDate">기한 (Due Date)</Label>
                 <Input id="dueDate" type="date" />
               </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">▶ 예상 결과:</span>
                <span className="ml-2">최소 판단 집합 (3~7명) · 책임자 및 검토 부서 · 의사결정 카드 초안</span>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={selectedTags.length === 0 || loading}>
                 {loading ? '그래프 분석 중...' : '의사결정 경로 분석'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-8 p-4 border border-yellow-900/50 bg-yellow-900/10 rounded-lg flex items-start space-x-3 text-yellow-500 text-sm">
         <AlertTriangle className="w-5 h-5 shrink-0" />
         <p>
           <strong>안내:</strong> 제출된 이슈는 DECIDE Engine에서 자동 라우팅됩니다. 
           최소 판단 경로 계산을 위해 도메인 태그를 정확히 선택하세요.
         </p>
      </div>
    </div>
  );
}
