# SSE API 가이드 - Decision Compiler Server

클라이언트에서 Decision Compiler Server의 SSE(Server-Sent Events) 엔드포인트를 연동하기 위한 완전한 가이드입니다.

## 📡 SSE 엔드포인트 목록

### 1. 의사결정 스트림 (Decision Stream)
```
GET /api/decisions/stream/{run_id}
Content-Type: text/event-stream
```

**설명**: 이슈에 대한 의사결정 과정을 18개 이벤트로 실시간 스트리밍

**Parameters**:
- `run_id` (path, required): DecisionRun ID (POST /api/issues 응답에서 획득)

**이벤트 순서**:
1. `initial_decision.started` - LLM 판단 시작
2. `initial_decision.thinking` - LLM 추론 과정 (스트리밍, 여러번)
3. `initial_decision.completed` - LLM 판단 완료
4. `safety_check.applied` - 안전성 검증
5. `rule_applied` - 규칙 기반 판단
6. `graph_scope_activated` - Neo4j 그래프 범위 설정
7. `graph_candidates` - 그래프 후보자 목록
8. `vector_ranked` - 벡터 검색 및 리랭킹
9. `reference_nodes_found` - 유사 경험자 참조
10. `meeting_ready` - 회의 정보 준비
11. `risk_review.started` - 리스크 검토 시작
12. `risk_review.agent.message` - 리스크 Agent 메시지 (여러번)
13. `risk_review.completed` - 리스크 검토 완료
14. `owner_search.started` - 담당자 검색 시작
15. `owner_search.candidates` - 담당자 후보 목록
16. `owner_search.assigned` - 담당자 배정
17. `decision_card` - Decision Card 생성
18. `decision_card.assigned` - Owner 배정 완료
19. `error` - 에러 발생 (선택적)

---

### 2. 가상 회의 생성 (Virtual Meeting)
```
POST /api/virtual-meetings/generate/{run_id}
Content-Type: application/json → text/event-stream
```

**설명**: 가상 마이크로미팅을 생성하고 발화를 실시간 스트리밍

**Parameters**:
- `run_id` (path, required): DecisionRun ID

**Request Body**:
```json
{
  "issue_id": "string",
  "participants": [
    {
      "name": "김철수",
      "role": "PM",
      "persona_description": "10년차 PM, 보수적 성향"
    }
  ],
  "meeting_config": {
    "target_turns": 10,
    "tone": "balanced",
    "conflict_level": "medium"
  }
}
```

**이벤트 순서**:
1. `utterance` - 발화 이벤트 (참가자 수 × 턴 수만큼 반복)
2. `complete` - 회의 완료
3. `error` - 에러 발생 (선택적)

---

## 🔌 클라이언트 연동 방법

### JavaScript (EventSource API)

```javascript
// 1. 이슈 생성
const createResponse = await fetch('http://localhost:18000/api/issues/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-ID': 'user-123'
  },
  body: JSON.stringify({
    text: '결제 UX 개선 건',
    title: '결제 UX 개선',
    tags: ['payment', 'ux']
  })
});

const { run_id } = await createResponse.json();

// 2. SSE 연결
const eventSource = new EventSource(
  `http://localhost:18000/api/decisions/stream/${run_id}`
);

// 3. 이벤트 리스너 등록
eventSource.addEventListener('initial_decision.completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('LLM 판단:', data.risk_tier, data.execution_path);
  console.log('판단 근거:', data.reasoning);
});

eventSource.addEventListener('rule_applied', (event) => {
  const data = JSON.parse(event.data);
  console.log('규칙 판단:', data);
});

eventSource.addEventListener('decision_card', (event) => {
  const data = JSON.parse(event.data);
  console.log('최종 결정:', data.action, data.summary);
  console.log('예상 비용:', data.budget_estimate);
  console.log('예상 일정:', data.timeline_days);
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('에러:', data.message);
  eventSource.close();
});

// 4. 연결 종료 감지
eventSource.addEventListener('decision_card.assigned', (event) => {
  console.log('의사결정 완료!');
  eventSource.close();
});
```

### React 예제

```jsx
import { useEffect, useState } from 'react';

function DecisionStream({ runId }) {
  const [events, setEvents] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `http://localhost:18000/api/decisions/stream/${runId}`
    );

    // 모든 이벤트 타입 리스너 등록
    const eventTypes = [
      'initial_decision.started',
      'initial_decision.thinking',
      'initial_decision.completed',
      'safety_check.applied',
      'rule_applied',
      'graph_scope_activated',
      'graph_candidates',
      'vector_ranked',
      'reference_nodes_found',
      'meeting_ready',
      'risk_review.started',
      'risk_review.agent.message',
      'risk_review.completed',
      'owner_search.started',
      'owner_search.candidates',
      'owner_search.assigned',
      'decision_card',
      'decision_card.assigned',
      'error'
    ];

    eventTypes.forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        const data = JSON.parse(event.data);
        setEvents(prev => [...prev, { type: eventType, data }]);

        // 완료 이벤트 감지
        if (eventType === 'decision_card.assigned') {
          setIsComplete(true);
          eventSource.close();
        }
      });
    });

    return () => {
      eventSource.close();
    };
  }, [runId]);

  return (
    <div>
      <h2>의사결정 진행 상황 {isComplete && '✅'}</h2>
      <ul>
        {events.map((event, idx) => (
          <li key={idx}>
            <strong>{event.type}</strong>: {JSON.stringify(event.data)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Python (httpx-sse)

```python
from httpx_sse import connect_sse
import httpx
import json

# 1. 이슈 생성
with httpx.Client() as client:
    response = client.post(
        'http://localhost:18000/api/issues/',
        headers={'X-User-ID': 'user-123'},
        json={
            'text': '결제 UX 개선 건',
            'title': '결제 UX 개선',
            'tags': ['payment', 'ux']
        }
    )
    run_id = response.json()['run_id']

# 2. SSE 연결
with httpx.Client() as client:
    with connect_sse(
        client,
        'GET',
        f'http://localhost:18000/api/decisions/stream/{run_id}'
    ) as event_source:
        for sse in event_source.iter_sse():
            event_type = sse.event
            data = json.loads(sse.data)

            print(f"Event: {event_type}")
            print(f"Data: {data}")

            # 완료 이벤트 감지
            if event_type == 'decision_card.assigned':
                print("의사결정 완료!")
                break
```

---

## 📝 이벤트 상세 스키마

### 1. Initial Decision 이벤트

#### `initial_decision.started`
```json
{
  "issue_id": "string",
  "issue_title": "string"
}
```

#### `initial_decision.thinking`
```json
{
  "content": "string (스트리밍 텍스트 조각)",
  "is_final": false
}
```

#### `initial_decision.completed`
```json
{
  "risk_tier": "LOW | MID | HIGH",
  "execution_path": "AUTO_APPROVE | SOFT_GATE | HARD_GATE",
  "reasoning": "string (판단 근거)",
  "key_factors": ["factor1", "factor2"]
}
```

#### `safety_check.applied`
```json
{
  "safety_override": true,
  "original_risk_tier": "MID",
  "final_risk_tier": "HIGH",
  "original_execution_path": "SOFT_GATE",
  "final_execution_path": "HARD_GATE",
  "override_reason": "string (변경 사유)"
}
```

---

### 2. 기존 이벤트

#### `rule_applied`
```json
{
  "risk_tier": "LOW | MID | HIGH",
  "execution_path": "AUTO_APPROVE | SOFT_GATE | HARD_GATE",
  "budget_impact": "NONE | LOW | MID | HIGH",
  "rollback_possible": true
}
```

#### `graph_scope_activated`
```json
{
  "scope": "string (예: payment_team)",
  "hop": 2
}
```

#### `graph_candidates`
```json
{
  "candidates": [
    {
      "person_id": "string",
      "name": "string",
      "role": "string",
      "level": "string",
      "team": "string",
      "department": "string"
    }
  ],
  "count": 5
}
```

#### `vector_ranked`
```json
{
  "core_nodes": [
    {
      "person_id": "string",
      "name": "string",
      "role": "string",
      "score": 0.95
    }
  ],
  "reference_nodes": [...]
}
```

#### `reference_nodes_found`
```json
{
  "references": [
    {
      "person_id": "string",
      "experience_summary": "string",
      "similarity": 0.85
    }
  ]
}
```

#### `meeting_ready`
```json
{
  "participants": [
    {
      "person_id": "string",
      "name": "string",
      "role": "string",
      "perspective": "string"
    }
  ],
  "summary": "string (회의 요약)"
}
```

---

### 3. Risk Review 이벤트

#### `risk_review.started`
```json
{
  "agent_count": 5,
  "agents": ["SECURITY", "LEGAL", "FINANCE", "OPS", "REPUTATION"]
}
```

#### `risk_review.agent.message`
```json
{
  "agent_type": "SECURITY",
  "message_type": "delta | final",
  "content": "string (delta용 스트리밍 텍스트)",
  "findings_count": 3,
  "findings": [
    {
      "risk_type": "string",
      "severity": 1-5,
      "evidence": "string",
      "recommendation": "string"
    }
  ]
}
```

#### `risk_review.completed`
```json
{
  "overall_risk_score": 3.5,
  "required_owner_level": "TEAM_LEAD",
  "total_findings": 8,
  "human_ack_required": true
}
```

---

### 4. Owner Assignment 이벤트

#### `owner_search.started`
```json
{
  "required_level": "TEAM_LEAD",
  "domains": ["payment", "security"]
}
```

#### `owner_search.candidates`
```json
{
  "candidates": [
    {
      "id": "string",
      "name": "string",
      "level": "string",
      "match_score": 0.92
    }
  ],
  "count": 3
}
```

#### `owner_search.assigned`
```json
{
  "owner": {
    "id": "string",
    "name": "string",
    "level": "string"
  },
  "co_reviewers": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "assignment_reason": "string"
}
```

---

### 5. Decision Card 이벤트

#### `decision_card`
```json
{
  "action": "APPROVE | REJECT | DEFER",
  "summary": "string (의사결정 요약)",
  "execution_path": "AUTO_APPROVE | SOFT_GATE | HARD_GATE",
  "risk_tier": "LOW | MID | HIGH",
  "budget_estimate": 3000000,
  "timeline_days": 5,
  "rollback_conditions": "string",
  "next_steps": ["step1", "step2"]
}
```

#### `decision_card.assigned`
```json
{
  "card_id": "string",
  "owner_id": "string",
  "owner_name": "string",
  "co_reviewer_ids": ["id1", "id2"],
  "approval_status": "PENDING"
}
```

---

### 6. 에러 이벤트

#### `error`
```json
{
  "stage": "string (에러 발생 단계)",
  "message": "string (에러 메시지)",
  "recoverable": false
}
```

---

### 7. Virtual Meeting 이벤트

#### `utterance`
```json
{
  "turn": 1,
  "speaker_name": "김철수",
  "speaker_role": "PM",
  "text": "결제 UX 개선 건에 대해 논의하겠습니다.",
  "perspective": "supportive | concerned | neutral | critical"
}
```

#### `complete`
```json
{
  "summary": "string (회의 요약)",
  "total_turns": 10,
  "meeting_id": "string (run_id)"
}
```

---

## 🎯 사용 시나리오

### 시나리오 1: 프론트엔드에서 실시간 의사결정 모니터링

```javascript
class DecisionMonitor {
  constructor(runId) {
    this.runId = runId;
    this.eventSource = null;
    this.callbacks = {};
  }

  on(eventType, callback) {
    this.callbacks[eventType] = callback;
    return this;
  }

  start() {
    this.eventSource = new EventSource(
      `http://localhost:18000/api/decisions/stream/${this.runId}`
    );

    // 이벤트 리스너 등록
    Object.keys(this.callbacks).forEach(eventType => {
      this.eventSource.addEventListener(eventType, (event) => {
        const data = JSON.parse(event.data);
        this.callbacks[eventType](data);
      });
    });

    // 자동 종료
    this.eventSource.addEventListener('decision_card.assigned', () => {
      this.stop();
    });

    return this;
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// 사용 예
const monitor = new DecisionMonitor(runId)
  .on('initial_decision.completed', (data) => {
    updateUI('LLM 판단 완료', data);
  })
  .on('risk_review.completed', (data) => {
    updateUI('리스크 검토 완료', data);
  })
  .on('decision_card', (data) => {
    showDecisionCard(data);
  })
  .start();
```

### 시나리오 2: 진행 상황 추적

```javascript
const progressSteps = [
  'initial_decision.completed',
  'safety_check.applied',
  'rule_applied',
  'graph_scope_activated',
  'vector_ranked',
  'meeting_ready',
  'risk_review.completed',
  'owner_search.assigned',
  'decision_card'
];

let currentStep = 0;

eventSource.addEventListener('message', (event) => {
  const eventType = event.type;
  const stepIndex = progressSteps.indexOf(eventType);

  if (stepIndex !== -1 && stepIndex > currentStep) {
    currentStep = stepIndex;
    updateProgressBar((currentStep + 1) / progressSteps.length * 100);
  }
});
```

---

## 🔒 인증

모든 요청에 `X-User-ID` 헤더 필수:

```javascript
// EventSource는 헤더를 지원하지 않으므로,
// 서버에서 쿼리 파라미터로 user_id를 받도록 수정하거나
// Polyfill 라이브러리 사용 필요

// 대안: fetch + ReadableStream
const response = await fetch(url, {
  headers: { 'X-User-ID': 'user-123' }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  // SSE 파싱 필요
}
```

---

## 🐛 에러 처리

### 연결 에러

```javascript
eventSource.onerror = (error) => {
  console.error('SSE 연결 에러:', error);

  // 재연결 로직
  setTimeout(() => {
    eventSource = new EventSource(url);
  }, 5000);
};
```

### 타임아웃 처리

```javascript
const timeout = setTimeout(() => {
  console.error('SSE 타임아웃 (30초)');
  eventSource.close();
}, 30000);

eventSource.addEventListener('decision_card.assigned', () => {
  clearTimeout(timeout);
  eventSource.close();
});
```

---

## 📊 Swagger UI에서 확인

1. http://localhost:18000/docs 접속
2. `GET /api/decisions/stream/{run_id}` 엔드포인트 선택
3. **Responses** 탭 → **200 - SSE 스트림** 확인
4. 모든 이벤트 타입과 예제 확인 가능

또는 **ReDoc**에서 더 깔끔하게 확인:
- http://localhost:18000/redoc

---

## 📞 문의

- 이슈: https://github.com/your-org/decision-compiler-server/issues
- 이메일: dev@your-org.com
