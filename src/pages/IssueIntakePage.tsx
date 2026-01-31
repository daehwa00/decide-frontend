import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Shield, CreditCard, Server, Gavel, Tag, AlertTriangle } from 'lucide-react';
import { ApiClient } from '@/services/apiClient';
import type { ApiIssueCreateRequest } from '@/types/api';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgencyLabel, setUrgencyLabel] = useState('낮음 (일반)');
  const [costLabel, setCostLabel] = useState('없음 / 미미');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const mapUrgency = (value: string) => {
    if (value.includes('높음')) return 'HIGH';
    if (value.includes('중간')) return 'MID';
    return 'LOW';
  };

  const mapCostImpact = (value: string): ApiIssueCreateRequest['cost_impact'] => {
    if (value.includes('$50k') && value.includes('>')) return 'HIGH';
    if (value.includes('$50k') && value.includes('<')) return 'MID';
    if (value.includes('없음')) return 'NONE';
    return 'LOW';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    const text = trimmedDescription || trimmedTitle;
    if (!text) {
      setError('이슈 제목 또는 상세 설명을 입력해 주세요.');
      setLoading(false);
      return;
    }

    let timelineDays: number | undefined;
    if (dueDate) {
      const dueTime = new Date(dueDate).getTime();
      const now = Date.now();
      const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        timelineDays = diffDays;
      }
    }

    const payload: ApiIssueCreateRequest = {
      text,
      title: trimmedTitle || undefined,
      tags: selectedTags,
      urgency: mapUrgency(urgencyLabel),
      cost_impact: mapCostImpact(costLabel)
    };

    if (timelineDays) {
      payload.timeline_days = timelineDays;
    }

    try {
      const response = await ApiClient.createIssue(payload);
      try {
        const raw = localStorage.getItem('decide_issue_runs');
        const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        map[response.issue_id] = response.run_id;
        localStorage.setItem('decide_issue_runs', JSON.stringify(map));
      } catch {
        // ignore localStorage errors
      }
      navigate('/analysis', {
        state: {
          run_id: response.run_id,
          issue_id: response.issue_id,
          tags: selectedTags
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '이슈 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTitle('모바일 앱 SDK 추가 제안');
                setDescription(
                  '모바일 PM이 사용자 행동 분석을 위해 써드파티 SDK 추가를 제안했습니다. 이 SDK는 개인정보를 수집하고 해외 서버로 전송합니다. 개인정보보호 검토가 필요한지, 법률 검토가 필요한지 판단이 어렵습니다. 누구에게 보고해야 할까요?'
                );
                setSelectedTags(['privacy', 'legal', 'security', 'growth']);
                setUrgencyLabel('중간 (이번 주)');
                setCostLabel('없음 / 미미');
                setDueDate('');
              }}
            >
              데모 입력 채우기
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTitle('');
                setDescription('');
                setSelectedTags([]);
                setUrgencyLabel('낮음 (일반)');
                setCostLabel('없음 / 미미');
                setDueDate('');
              }}
            >
              초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">이슈 제목</Label>
              <Input
                id="title"
                name="title"
                placeholder="예: 리텐션 개선을 위한 행동 데이터 수집 확대"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">상세 설명</Label>
              <textarea
                name="desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
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
                 <select
                   name="urgency"
                   value={urgencyLabel}
                   onChange={e => setUrgencyLabel(e.target.value)}
                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 >
                   <option>낮음 (일반)</option>
                   <option>중간 (이번 주)</option>
                   <option>높음 (즉시)</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <Label>비용 영향</Label>
                 <select
                   name="costImpact"
                   value={costLabel}
                   onChange={e => setCostLabel(e.target.value)}
                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 >
                   <option>없음 / 미미</option>
                   <option>{'<'} $50k</option>
                   <option>{'>'} $50k</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="dueDate">기한 (Due Date)</Label>
                 <Input
                   id="dueDate"
                   name="dueDate"
                   type="date"
                   value={dueDate}
                   onChange={e => setDueDate(e.target.value)}
                 />
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
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-8 p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-start space-x-3 text-amber-700 text-sm">
         <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
         <p>
           <strong>안내:</strong> 제출된 이슈는 DECIDE Engine에서 자동 라우팅됩니다. 
           최소 판단 경로 계산을 위해 도메인 태그를 정확히 선택하세요.
         </p>
      </div>
    </div>
  );
}
