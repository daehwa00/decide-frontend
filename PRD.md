DECIDE (decision-compiler-frontend) PRD (Hackathon PoC, Enterprise-scale Demo)

0. 문서 목적과 범위

본 PRD는 해커톤 심사위원에게 **“대기업(1,200~1,500명)에서 의사결정 지연의 본질(책임/결정권 불명확)을 해결한다”**는 메시지를 데모로 증명하기 위한 단일 요구사항 문서다.
    •    목표: “누가 결정해야 하는지 모른다”로 인해 발생하는 지연을, **최소 판단 집합(3~7명)**을 자동 구성하고 Decision Card로 컴파일하여, 빠르고 책임 있는 결정을 가능하게 함.
    •    핵심 설계 원칙
    1.    조직의 책임 구조(Tree)는 유지한다.
    2.    협업 구조(Graph)는 확장한다.
    3.    AI는 결정권자를 “지정”하지 않는다. AI는 자율 실행 가능 범위 / 최소 판단 집합을 계산한다.
    4.    결정 경로는 분산(그래프)되되, 책임 경로는 고정(트리)된다.

⸻

1. 문제 정의 (Problem)

1.1 현상

전통적 대기업에서 작은 결정도:
    •    보고 → 승인 → 보류 → 재보고의 루프로 2~3일 이상 지연
    •    겉으로는 “실행력 부족”처럼 보이나 실제는:
    •    책임 소재 불안정
    •    결재/승인 라인의 모호함
    •    회의 과다/결정 회피(위로 떠넘김)

1.2 본질

문제는 실행이 아니라 ‘누가 결정해야 하는지 모른다’
    •    Top은 맥락이 부족하고
    •    Down은 결정권이 부족하다
→ 그래서 모두가 결정을 미루고 기다린다.

1.3 해커톤에서 증명해야 하는 것
    •    이슈가 들어오면 시스템이 최소한의 판단권자 집합을 찾아내고
    •    짧은 “Micro-meeting” 또는 합의 절차로 핵심 판단을 정리하고
    •    책임 라인이 명확한 형태(Decision Card)로 결정/조건/근거를 남기며
    •    결정을 “실행 가능한 형태”로 컴파일한다.

⸻

2. 솔루션 개요 (Solution)

DECIDE (decision-compiler-frontend)은 3가지 정보를 결합한다.
    1.    Tree(책임 구조): 조직 트리, 직책/권한, 승인 책임 라인
    2.    Graph(협업 구조): 프로젝트/업무 상호작용, 협업 엣지, 관계 강도
    3.    Vector(경험/유사도): 과거 유사 이슈/결정 로그, 문서(정책/가이드)

2.1 시스템이 하는 일(정확한 문장)
    •    AI가 “누가 결정해라”라고 지시하지 않는다.
    •    AI는 해당 이슈가 자율 실행 가능한지와,
    •    판단에 필요한 최소 인원(3~7명) 및 그 근거를 계산한다.

⸻

3. 제품 목표 (Goals) / 비목표 (Non-goals)

3.1 Goals
    •    (G1) 이슈 입력 후 30초 내에 “최소 판단 집합”과 “상위 후보 12명”을 출력
    •    (G2) Decision Card를 자동 생성(결정 옵션/조건/리스크/근거 포함)
    •    (G3) 책임자가 “승인/반려/조건부 승인”을 UI에서 명확히 남김
    •    (G4) 1,200명 규모가 존재하는 것처럼 보이는 데이터/검색/그래프 UX 구현
    •    (G5) 전체 그래프 렌더링 없이도 “스케일 + 설득력”을 보여주는 시각화 제공

3.2 Non-goals (해커톤에서 하지 않음)
    •    실제 기업 인사/권한 시스템 연동(SSO/HRIS)
    •    실제 문서 시스템(Confluence/Drive) 실시간 동기화
    •    실시간 회의(음성) 완성형 구현(가능하면 데모용으로만)
    •    완전 자동 실행(최종 책임 없는 자동 배포 등)

⸻

4. 사용자/이해관계자 (Personas)
    1.    Issue Reporter(실무자/PM/운영)

    •    상황: “결정이 필요한 이슈”를 올리지만 누가 책임자인지 모름
    •    니즈: 빠른 라우팅, 최소한의 회의, 결정 조건 명확화

    2.    Decision Owner(책임자: VP/Director/Manager)

    •    상황: 승인요청이 올라오면 리스크 때문에 미루기 쉬움
    •    니즈: 근거가 정리된 Decision Card, 조건부 승인, 책임 로그

    3.    Domain Reviewer(SME: Security/Legal/Finance/Infra)

    •    상황: 특정 태그(보안/법무/예산) 이슈에 자주 호출됨
    •    니즈: 짧고 명확한 쟁점 정리, 검토 범위, 의견 기록

    4.    Judge(심사위원)

    •    니즈: “이게 왜 AI가 필요하고”, “왜 그래프가 필요하고”, “책임이 어떻게 남는지”를 한 번에 이해

⸻

5. 핵심 컨셉: Tree → Graph로 펼치기

5.1 핵심 문장
    •    기존 조직은 Tree 구조라 의사결정 경로가 하나뿐이다.
    •    우리는 그걸 Graph로 펼쳐서,
    •    결정 경로는 여러 개지만
    •    책임 경로는 하나로 남긴다.

5.2 그래프를 쓰는 이유 (오버엔지니어링 방어)
    •    Tree는 “책임”을 정의하지만 “협업/맥락”을 담지 못한다.
    •    실제 결정은:
    •    프로젝트 엮임
    •    리스크 엮임
    •    예산/계약 엮임
같은 그래프 관계 위에서 일어난다.
    •    그래프 없이 “책임자 추천”만 하면
    •    결정의 근거가 빈약하고
    •    조직 현실(협업)을 반영 못 하며
    •    심사위원이 “그냥 LLM 요약 + 추천”으로 본다.
    •    따라서 그래프는 “최소 판단 집합”의 설명 가능성과 현실감을 담당한다.

⸻

6. 데이터 모델(해커톤용): 1,200명 “합성 생성” + 국소 등장

6.1 원칙
    •    1,200명은 전원 엔티티로 존재
    •    UI에는 이슈별 3~7명만 등장
    •    그래프는 전체를 렌더링하지 않고 클러스터/서브그래프만 펼친다.

6.2 조직 트리 합성(예)
    •    부서: Product, Engineering, Security, Legal, Finance, Sales, Operations, HR, Data
    •    레벨: CEO → VP → Director → Manager → IC
    •    비율: IC 70%, Manager 20%, Director+ 10%
    •    org_path 예: /Engineering/Payments/Platform/IC4

6.3 개인 속성(최소 10개)
    •    id, name
    •    org_path
    •    seniority_level (IC1IC6 / M1M4 / D1~VP)
    •    years_experience (0~20)
    •    domain_strength[10] (0~1, 10차원)
    •    risk_tolerance (low/med/high)
    •    decision_style (fast/balanced/conservative)
    •    past_decisions_count (현실 분포: 레벨별 포아송)
    •    latency_profile_ms (응답 속도)
    •    current_load (0~1)
    •    (선택) location/timezone, languages

6.4 그래프 엣지 합성(“랜덤 티” 제거)

엣지 타입 3종:
    1.    프로젝트 기반: PM–FE–BE–Design
    2.    리스크 기반: Security–Legal–Infra–Data
    3.    예산/계약 기반: Sales–Legal–Finance

    •    평균 degree: 8~15 (희소 그래프)
    •    엣지 가중치: 최근 상호작용 기반(30/90일)
    •    w = 0.7 * interactions_30d + 0.3 * interactions_90d

6.5 과거 결정 로그 합성
    •    decision_log:
    •    issue_tags, 참여자, 결과(승인/반려/조건부), 소요시간, 리스크 레벨, 비용 영향
    •    목적:
    •    유사 이슈 참여도를 계산
    •    “근거 기반 추천”을 보여주기 위함

⸻

7. 기능 요구사항 (Functional Requirements)

7.1 이슈 리포트 생성 (Issue Intake)

FR-1 사용자는 이슈를 생성할 수 있다.
    •    입력:
    •    제목, 상세 설명
    •    태그(최소 1개): privacy, payments, infra, security, legal, pricing, customer_comms, brand, data, growth
    •    긴급도(낮/중/높)
    •    비용 영향(대략): 0, <500만, <5천만, >5천만
    •    영향 범위: internal / customer-facing

FR-2 제출 즉시 “분석 결과 화면”으로 이동한다.

⸻

7.2 최소 판단 집합 계산 (Routing)

FR-3 시스템은 후보 1,200명 풀에서 상위 후보 12명을 산출한다.
    •    출력 항목(각 후보에 대해):
    •    총점
    •    점수 분해(4항목)
    •    선정 근거(1~3줄)

FR-4 시스템은 최소 판단 집합 3~7명을 확정한다.
    •    제한: 기본 5명 권장(심사 데모 최적)
    •    조건: (리스크/태그에 따라) 특정 도메인 리뷰어가 포함될 수 있음

FR-5 점수 모델(설명 가능)
Score 예시(데모용 고정):
    •    0.45 * 유사 이슈 참여도
    •    0.30 * 도메인 적합도
    •    0.15 * 책임 적합도(Tree)
    •    0.10 * 현재 부하(낮을수록 좋음)

FR-6 “책임 적합도(Tree)” 계산 방식(룰처럼 보이지 않게)
    •    이슈 태그 → owner_org_path(사전에 정의된 “소유 조직”)
    •    책임 적합도 = exp(-α * tree_distance(candidate.org_path, owner_org_path))

⸻

7.3 그래프 시각화 (Graph View)

FR-7 그래프는 전체 렌더링을 금지한다.
    •    기본: 클러스터 뷰(부서/프로젝트 중심)
    •    펼치기:
    •    top-K 후보(예: 30명) + 1-hop neighbors
    •    또는 owner_org 주변 N-depth 서브그래프

FR-8 그래프는 “왜 이 사람이 뽑혔는지”를 시각적으로 표시한다.
    •    선정 3~7명: 강조
    •    각 후보의 선정 근거:
    •    태그 아이콘/바
    •    과거 유사 이슈 수
    •    책임 거리(tree distance)
    •    current_load

⸻

7.4 Micro-meeting (합의/쟁점 정리)

해커톤에서 “회의”를 실제로 구현할 필요는 없지만, 회의가 있었던 것처럼 보여줘야 한다.

FR-9 최소 판단 집합 구성원들의 “쟁점/의견”이 수집된다.
    •    방법 옵션:
    •    (A) LLM이 각 역할 관점의 코멘트를 생성(데모용)
    •    (B) 사용자가 1~2줄씩 입력(더 간단)
    •    출력: 쟁점 3개 + 권고안 1개 + 리스크/조건

⸻

7.5 Decision Card 컴파일 (Single Source Output)

FR-10 시스템은 Decision Card를 자동 생성한다.
Decision Card 필수 필드:
    •    Issue 요약(한 문장)
    •    결정 옵션(1~3개)
    •    추천 결론(1개)
    •    실행 조건(필수/권고)
    •    리스크(법무/보안/브랜드/재무)
    •    선정된 판단자 목록(3~7명) + 근거(각 1줄)
    •    책임자(Owner) 표시
    •    감사 로그 필드(시간, 입력자, 승인자)

FR-11 Decision Card는 “승인/반려/조건부 승인” 워크플로우를 가진다.
    •    승인 시: 조건/코멘트 1줄 이상 필수
    •    반려 시: 반려 사유 필수
    •    조건부 승인: 조건 항목 체크 + 코멘트 필수

⸻

7.6 로그/감사/재사용 (Learning Loop)

FR-12 모든 결정은 decision_log로 저장된다.
    •    저장 항목:
    •    issue_tags, 참여자, owner, 결론, 조건, 결과, 소요시간, 점수 분해, 그래프 서브셋 id

FR-13 다음 라우팅에서 과거 로그가 “유사 이슈 참여도”에 반영된다.

⸻

8. 화면 요구사항 (UI/UX Requirements)

해커톤에서 반드시 필요한 화면은 4개.

8.1 Screen 1: Issue Intake
    •    이슈 입력 폼 + 태그 + 영향/비용/긴급도
    •    제출 버튼

8.2 Screen 2: Routing Result (스케일 보여주는 핵심)
    •    KPI 바:
    •    Employees: 1200
    •    Edges: XXXX
    •    Decision logs: XXXX
    •    Active projects: XX
    •    “전체 후보 1200명 중 상위 12명”
    •    각 후보: 총점 + 점수 분해(4항목)
    •    “선정된 3~7명” 카드
    •    이름/역할 + 왜 뽑혔는지(근거)

8.3 Screen 3: Graph View
    •    중앙: 클러스터 그래프
    •    좌측: 조직도/검색(1200명 자동완성)
    •    우측: “이번 이슈 선정자(3~7)” + 근거
    •    상호작용:
    •    top-12 클릭 시 서브그래프 펼치기
    •    owner_org 기준 필터

8.4 Screen 4: Decision Card + Approval
    •    Decision Card 렌더
    •    승인/반려/조건부 승인 버튼
    •    코멘트 필수 입력
    •    타임라인 로그(누가 언제 무엇을)

⸻

9. 기술 요구사항 (Tech Requirements)

9.1 성능/제약
    •    후보 산출(1200명 스코어링): 1초 내(로컬/서버 기준)
    •    그래프 렌더: 서브그래프 200 노드 이하로 제한(권장 50~120)
    •    평균 degree 8~15 유지

9.2 아키텍처(해커톤 현실형)
    •    Frontend: 그래프 중심 UI(조직도/그래프/카드)
    •    Backend: FastAPI (권장)
    •    issue ingest
    •    routing score compute
    •    graph subgraph query
    •    decision card CRUD
    •    logs
    •    AI:
    •    태그 추출/요약/역할 코멘트 생성(LLM)
    •    임베딩/리랭킹(선택)로 유사 이슈 찾기
    •    Data:
    •    people(1200), edges, projects, decision_logs, issues, decision_cards

9.3 시각화 라이브러리 요구
    •    전체 그래프 렌더링 금지
    •    클러스터/서브그래프 렌더 + 하이라이트/필터
    •    노드 클릭 시 카드 패널 업데이트

⸻

10. 데모 시나리오(권장 1개, 고정)

시나리오: “행동 데이터 수집 SDK 추가”
    •    입력: “이탈률 개선 위해 이벤트 수집 확대”
    •    태그: privacy, data, customer_comms
    •    시스템 출력:
    •    top-12 후보(1200 풀 중)
    •    최소 판단 집합 5명: PM, Backend Lead, Data Lead, Security, Legal
    •    Micro-meeting 결과(데모):
    •    쟁점: 동의/보관기간/수집 범위
    •    조건: 최소 수집, 30일 보관, 고지 문구 수정
    •    Decision Card:
    •    조건부 승인(Owner가 코멘트 남김)
    •    로그:
    •    결정 저장, 다음 유사 이슈 라우팅에 반영

⸻

11. 평가 기준 대응(심사위원 관점 정렬)

11.1 Specificity
    •    “의사결정 지연의 원인 = 책임/결정권 불명확”을 구체적으로 증명
    •    데모에서 “승인/반려/조건부 승인 + 근거”를 남기는 화면 제공

11.2 AI Necessity
    •    단순 요약이 아니라:
    •    태그 추출
    •    최소 판단 집합 계산
    •    유사 로그 기반 참여도 반영
    •    Decision Card 컴파일
을 통해 “AI가 핵심 로직”임을 보여줌

11.3 Real Impact
    •    기존: 2~3일 지연(보고/회의/책임 모호)
    •    제안: 30초 라우팅 + 7분 micro-meeting + 즉시 조건부 승인
    •    로그 기반으로 반복 개선(유사 이슈 처리 속도 증가)

11.4 Completeness
    •    4개 화면이 end-to-end로 이어지고
    •    로그까지 저장되는 “완결된 흐름” 제공

⸻

12. 리스크 및 대응

12.1 “오버엔지니어링” 공격
    •    대응: 그래프는 “설명 가능성”을 위한 장치
    •    top-12 + 점수 분해 + 서브그래프 하이라이트로 직관 제공

12.2 “AI가 틀리면 책임은?”
    •    대응:
    •    AI는 결정을 내리지 않음
    •    책임자가 승인/반려를 남김(코멘트 강제)
    •    Decision Card/로그가 감사 가능

12.3 1200명 데이터/그래프 성능
    •    대응:
    •    희소 그래프(평균 degree 8~15)
    •    클러스터/서브그래프 렌더만
    •    top-K 후보 기반 국소 계산/캐시

⸻

13. MVP 범위 정의 (Hackathon Cutline)

Must-have (필수)
    •    1200명 합성 생성 + 검색에서 “존재”
    •    이슈 입력
    •    top-12 후보 + 최소 판단 집합(3~7)
    •    그래프 서브그래프 시각화(선정자 하이라이트)
    •    Decision Card 생성 + 승인/반려 + 로그 저장

Should-have (있으면 강함)
    •    역할 관점 코멘트 자동 생성(마이크로 미팅 느낌)
    •    유사 이슈 검색/참여도 반영(로그 기반)

Nice-to-have
    •    음성 입력/요약(데모 효과는 좋지만 구현 비용 큼)
    •    실시간 협업(멀티 유저)

⸻

14. 데이터 스키마 초안(최소)
    •    people(id, name, org_path, seniority, years_exp, domain_vec, risk_tol, style, past_decisions, latency_ms, load, location, languages)
    •    org_units(id, name, path, parent_path)
    •    projects(id, name, tags)
    •    people_projects(person_id, project_id, role)
    •    edges(src_id, dst_id, type, w_30d, w_90d, w)
    •    issues(id, title, body, tags, urgency, cost_bucket, scope, created_at, created_by)
    •    routing_results(issue_id, top12_json, selected_json, created_at)
    •    decision_cards(id, issue_id, summary, options_json, recommendation, conditions_json, risks_json, participants_json, owner_id, status, created_at)
    •    decision_logs(id, decision_card_id, action, actor_id, comment, created_at, metrics_json)

⸻

15. 구현 순서(해커톤 실행 플랜)
    1.    도메인 태그 10개 고정 + owner_org_path 매핑
    2.    조직 트리 생성 + 1200명 합성 생성
    3.    프로젝트/로그/엣지 합성 생성
    4.    스코어링 함수 구현(top-12, selected 3~7)
    5.    서브그래프 질의 + 시각화(클러스터 → 펼치기)
    6.    Decision Card 생성 + 승인 플로우 + 로그 저장
    7.    데모 시나리오 1개 고정하여 전 구간 리허설

⸻

원하면, 위 PRD를 그대로 기준으로:
    •    더미 데이터 생성기(1200명/엣지/로그) 설계,
    •    API 엔드포인트 목록(OpenAPI 스펙 수준),
    •    프론트 화면별 컴포넌트 구조(상태/데이터 흐름)
까지 한 번에 이어서 구체화할 수 있다.
