DECIDE (decision-compiler-frontend)

Frontend Development Instruction (Hackathon PoC)

문서 목적

이 문서는 DECIDE (decision-compiler-frontend)의 프론트엔드 구현을 위한 유일한 기준 문서다.
프론트엔드는 “기술 데모”가 아니라 의사결정 구조를 설득하는 인터페이스여야 한다.

⚠️ 중요
이 시스템의 가치는
“1200명을 처리한다”가 아니라
**“1200명 중 왜 이 3~7명이 판단해야 하는지 납득시키는 것”**이다.

⸻

0. 절대 지켜야 할 UX 철학 (Mandatory)

❌ 금지 사항
	•	사용자가 그래프를 설계/편집하게 만들지 말 것
	•	1200명 노드를 한 번에 화면에 렌더링하지 말 것
	•	“AI가 결정했습니다”라는 표현 사용 금지
	•	점수만 보여주고 근거를 숨기는 UI 금지

✅ 반드시 보여줘야 하는 것
	•	항상 “왜 이 사람이 선택됐는지”
	•	항상 “책임자는 누구인지”
	•	항상 “사람이 최종 결정을 내린다는 구조”
	- electron을 이용하여 구현

⸻

1. 전체 사용자 플로우 (고정)

프론트엔드는 반드시 아래 흐름을 따른다.

[Issue Intake]
   ↓
[Routing Result]
   ↓
[Graph Context]
   ↓
[Decision Card + Approval]

이 순서를 깨는 UI는 허용하지 않는다.

⸻

2. Screen 1 — Issue Intake (입력 화면)

목적
	•	사용자가 **“누가 결정해야 할지 모르는 문제”**를 그대로 입력하게 한다.
	•	사람/부서 선택 UI는 절대 제공하지 않는다.

UI 요구사항

입력 필드
	•	Title (필수)
	•	Description (필수, 자유 텍스트)
	•	Tags (필수 1~3개)
	•	privacy / security / payments / infra / legal / pricing / brand / data / growth
	•	Impact Scope
	•	internal / customer-facing
	•	Cost Impact
	•	none / low / medium / high
	•	Urgency
	•	low / medium / high

CTA 버튼
	•	버튼 문구:
“결정 가능한 사람 찾기”
	•	submit 시 바로 Routing Result 화면으로 이동

⸻

3. Screen 2 — Routing Result (가장 중요한 화면)

⚠️ 이 화면은 “심사위원 설득용 핵심 화면”이다.

레이아웃 (3단 구성, 고정)

⸻

3.1 상단 KPI Bar (스케일 인식용)

반드시 상단에 고정 표시

Employees: 1,200
Active Projects: XX
Decision Logs: XXXX
Avg Decision Time: X.X min

	•	이 수치는 실제 계산 정확도보다 ‘규모감’이 중요
	•	mock 값 가능

⸻

3.2 좌측 패널 — Top 12 Candidates

목적
	•	“1200명 전체를 다 고려했다”는 인상을 주는 영역

구성
	•	제목:
“Top 12 candidates out of 1,200”

각 후보 카드에 반드시 포함:
	•	이름
	•	직책 / 부서
	•	총점 (큰 숫자)
	•	점수 분해 (4개 항목을 bar 또는 chip으로 표시)
	•	Similar Issues
	•	Domain Fit
	•	Responsibility Fit
	•	Current Load

⚠️ 주의
	•	점수는 절대 하나의 숫자만 보여주지 말 것
	•	항상 분해해서 보여줄 것

⸻

3.3 우측 패널 — Recommended Decision Group (3~7명)

목적
	•	“이번 이슈를 실제로 판단할 사람들”을 명확히 보여준다.

구성
	•	섹션 제목:
“Recommended Decision Group”

각 인물 카드:
	•	이름 / 역할 배지 (Security, Legal, Owner 등)
	•	선정 이유 1줄 요약
	•	예: “최근 90일 내 유사 이슈 4건 참여”
	•	아이콘으로 근거 표시

행동
	•	이 그룹은 다음 화면(Graph / Decision Card)의 기준 집합이다.
	•	사용자는 여기서 인원을 직접 바꾸지 않는다 (자동 선정)

⸻

4. Screen 3 — Graph Context (설명용 그래프)

그래프의 역할

사용자가 조작하는 도구 ❌
시스템이 맥락을 설명하는 시각 자료 ✅

기본 상태
	•	전체 그래프는 클러스터 뷰
	•	Engineering (n=420)
	•	Security (n=35)
	•	Legal (n=18)

상호작용 규칙
	•	Top 12 후보 중 한 명 클릭 시:
	•	해당 인물 중심의 국소 서브그래프만 펼침
	•	연결 타입별 색상:
	•	프로젝트 기반
	•	리스크 기반
	•	예산/계약 기반

강조 규칙
	•	최종 판단자(3~7명): 항상 강조 표시
	•	책임자(Owner):
	•	조직 트리 위치를 텍스트로 함께 표시
	•	예:
“Owner — VP, Payments Engineering”

⸻

5. Screen 4 — Micro-meeting Summary

목적
	•	실제 회의를 하지 않아도
“핵심 쟁점이 논의된 것처럼” 보이게 한다

UI 구성

섹션 제목:
“Key Considerations”
	•	Security Perspective
	•	Legal Perspective
	•	Product / Business Perspective

각 항목:
	•	1~2줄 요약 텍스트
	•	초기 버전에서는 LLM 생성 텍스트 사용 가능

⸻

6. Screen 5 — Decision Card + Approval (종착지)

⚠️ 이 화면은 “결정의 단일 진실(Single Source of Truth)”이다.

Decision Card 구성 (문서형 UI)

반드시 포함:
	1.	Issue Summary (한 문장)
	2.	Recommendation
	3.	Execution Conditions
	•	필수 조건
	•	권고 조건
	4.	Risks
	•	Legal / Security / Brand / Finance
	5.	Decision Participants
	•	3~7명 + 선정 근거
	6.	Decision Owner
	•	조직 트리 상 책임자 강조

⸻

Approval Actions (절대 타협 불가)

버튼
	•	✅ Approve
	•	⚠️ Conditional Approve
	•	❌ Reject

규칙
	•	모든 액션은 코멘트 입력 필수
	•	코멘트 없이는 제출 불가
	•	“AI가 결정”이라는 문구 절대 사용 금지

⸻

7. Timeline / Audit Log (신뢰 확보)

Decision Card 하단에 타임라인 표시

예시:

10:31 Issue created by PM
10:32 Routing completed (1200 → 12 → 5)
10:35 Decision Card generated
10:38 Conditional approval by Product VP

→ AI의 역할과 사람의 역할이 명확히 구분되어야 함

⸻

8. 기술 구현 가이드 (권장)

Framework
	•	Next.js (App Router)

상태 관리
	•	서버 상태: React Query
	•	UI 상태: Zustand

그래프
	•	전체 렌더링 금지
	•	서브그래프만 렌더링
	•	노드 수 200 이하 유지 (권장 50~120)

스타일
	•	B2B SaaS 톤
	•	Linear / Notion / Stripe Dashboard 계열
	•	과한 애니메이션, 게임 UI 금지

⸻

9. 구현 우선순위 (Hackathon 기준)

MUST
	•	Issue Intake
	•	Routing Result (Top 12 + 3~7)
	•	Graph Context (서브그래프)
	•	Decision Card + Approval
	•	Timeline Log

SHOULD
	•	Micro-meeting Summary 자동 생성

NICE
	•	음성 입력 / 음성 요약

⸻

10. 마지막 확인 질문 (개발 완료 전 체크)

프론트엔드를 열었을 때, 심사위원이 다음 질문에 10초 안에 답할 수 있는가?
	1.	이 회사는 큰 조직인가? (1200명 느낌)
	2.	왜 이 사람들이 선택됐는가?
	3.	AI는 어디까지 했고, 사람은 어디서 결정했는가?
	4.	책임자는 누구인가?

👉 이 4개 중 하나라도 UI에서 즉시 안 보이면, 구현은 실패다.
