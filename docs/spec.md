# T-AI 어시스턴트 - 통신사 ChatGPT 앱 기획서

## 1. 앱 개요

**앱 이름**: T-AI 어시스턴트  
**플랫폼**: ChatGPT Apps (OpenAI Apps SDK / MCP 기반)  
**목적**: 통신사 고객이 ChatGPT 대화 내에서 자연어로 요금 조회, 데이터 사용량 확인, 요금제 추천, 해외 로밍 안내를 받을 수 있는 인라인 앱

> 본 프로젝트는 **목업(Mock)** 데이터 기반으로, 실제 통신사 API 연동 없이 핵심 UI/UX를 시연하는 데 집중합니다.

---

## 2. 핵심 기능

### 2.1 데이터/통화/문자 사용량 조회

| 항목 | 내용 |
|------|------|
| Tool 이름 | `check_usage` |
| 설명 | 현재 요금제의 데이터/통화/문자 사용량과 잔여량 조회 |
| Widget | 도넛 차트 + 프로그레스바 대시보드 |
| Input | 없음 (현재 로그인 사용자 기준) |

**structuredContent 스키마:**

```json
{
  "type": "usage",
  "userName": "string",
  "planName": "string",
  "billingCycle": "string",
  "items": [
    {
      "category": "data | voice | sms",
      "label": "string",
      "used": "number",
      "total": "number",
      "unit": "string"
    }
  ]
}
```

### 2.2 요금 조회

| 항목 | 내용 |
|------|------|
| Tool 이름 | `check_bill` |
| 설명 | 이번 달 청구 요금 상세 내역 조회 |
| Widget | 요금 카드 + 항목별 breakdown 리스트 |
| Input | `{ month?: string }` (기본값: 이번 달) |

**structuredContent 스키마:**

```json
{
  "type": "bill",
  "month": "string",
  "totalAmount": "number",
  "previousAmount": "number",
  "currency": "KRW",
  "items": [
    {
      "label": "string",
      "amount": "number",
      "description": "string"
    }
  ],
  "paymentDate": "string",
  "paymentMethod": "string"
}
```

### 2.3 요금제 추천

| 항목 | 내용 |
|------|------|
| Tool 이름 | `recommend_plan` |
| 설명 | 현재 사용 패턴 기반 최적 요금제 3개 추천 |
| Widget | 요금제 비교 카드 (가로 스크롤 Carousel) |
| Input | 없음 |

**structuredContent 스키마:**

```json
{
  "type": "planRecommendation",
  "currentPlan": {
    "name": "string",
    "monthlyFee": "number"
  },
  "recommendations": [
    {
      "id": "string",
      "name": "string",
      "monthlyFee": "number",
      "data": "string",
      "voice": "string",
      "sms": "string",
      "savingAmount": "number",
      "badge": "string | null",
      "features": ["string"]
    }
  ]
}
```

### 2.4 해외 로밍 안내

| 항목 | 내용 |
|------|------|
| Tool 이름 | `roaming_info` |
| 설명 | 국가별 로밍 요금 및 추천 패키지 안내 |
| Widget | 없음 (텍스트 응답) |
| Input | `{ country: string }` |

**structuredContent 스키마:**

```json
{
  "type": "roaming",
  "country": "string",
  "countryCode": "string",
  "packages": [
    {
      "name": "string",
      "duration": "string",
      "data": "string",
      "price": "number",
      "description": "string"
    }
  ],
  "basicRates": {
    "dataPerMB": "number",
    "voicePerMin": "number",
    "smsPerMsg": "number"
  }
}
```

---

## 3. 기술 스택

| 항목 | 선택 | 비고 |
|------|------|------|
| MCP Server | Node.js + TypeScript | `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps` |
| UI Widget | React 18 + esbuild | 단일 HTML로 번들링, iframe 내 렌더링 |
| 스타일링 | Vanilla CSS | ChatGPT 컨테이너에 맞는 반응형 |
| 배포 | Vercel | ChatGPT Apps 공식 지원, Streamable HTTP |
| Mock 데이터 | 서버 내 in-memory | `mock-data.ts` |
| 스키마 검증 | Zod | Tool input 검증 |

---

## 4. 프로젝트 구조

```
test-gpt-apps/
├── docs/
│   └── spec.md                 # 본 기획 문서
├── server/
│   ├── server.ts               # MCP 서버 엔트리포인트
│   └── mock-data.ts            # 목업 데이터
├── web/
│   ├── src/
│   │   ├── usage-widget.tsx    # 사용량 대시보드 위젯
│   │   ├── bill-widget.tsx     # 요금 조회 위젯
│   │   ├── plan-widget.tsx     # 요금제 추천 위젯
│   │   └── bridge.ts          # MCP Apps bridge 유틸
│   ├── dist/                   # 빌드 결과물
│   └── package.json
├── package.json                # 루트 (서버 의존성)
├── tsconfig.json
└── vercel.json                 # Vercel 배포 설정
```

---

## 5. 아키텍처

```
┌──────────────────────────────────────────────┐
│                   ChatGPT                     │
│                                               │
│  ┌─────────────┐    JSON-RPC     ┌─────────┐ │
│  │  Widget UI   │◄──postMessage──►│  Host   │ │
│  │  (iframe)    │                 │ Bridge  │ │
│  └─────────────┘                 └────┬────┘ │
│                                       │       │
└───────────────────────────────────────┼───────┘
                                        │ MCP (Streamable HTTP)
                                        ▼
                               ┌────────────────┐
                               │   MCP Server    │
                               │  (Vercel/Node)  │
                               │                 │
                               │  Tools:         │
                               │  - check_usage  │
                               │  - check_bill   │
                               │  - recommend_   │
                               │    plan         │
                               │  - roaming_info │
                               │                 │
                               │  Resources:     │
                               │  - usage widget │
                               │  - bill widget  │
                               │  - plan widget  │
                               └────────────────┘
```

---

## 6. 구현 순서

### Phase 1: 프로젝트 셋업
- Node.js 프로젝트 초기화 (`package.json`, `tsconfig.json`)
- 의존성 설치: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `zod`
- 위젯 프로젝트 초기화 (React, esbuild)
- Mock 데이터 작성

### Phase 2: MCP 서버 구현
- 4개 tool 등록 및 structuredContent 반환
- 3개 UI resource 등록 (위젯 HTML 번들)
- CORS, health check, Streamable HTTP transport 설정

### Phase 3: 위젯 UI 구현
- `usage-widget`: SVG 도넛 차트 + 프로그레스바
- `bill-widget`: 항목별 요금 카드
- `plan-widget`: 요금제 비교 Carousel
- MCP Apps bridge 연동

### Phase 4: 로컬 테스트
- `node server.js`로 로컬 실행
- MCP Inspector로 tool 호출 테스트
- ngrok으로 ChatGPT 연동 테스트

### Phase 5: Vercel 배포
- `vercel.json` 작성
- Vercel 배포 후 ChatGPT Connector 등록
- 개발자 모드에서 동작 확인

---

## 7. 배포 가이드

### 로컬 개발 (독립 서버)
```bash
# 위젯 빌드
cd web && npm run build && cd ..

# 독립 MCP 서버 실행 (포트 8787)
npm run dev

# ngrok 터널
ngrok http 8787
```

### 로컬 개발 (Next.js)
```bash
# 위젯 빌드
cd web && npm run build && cd ..

# Next.js dev 서버 (포트 3000, MCP: /api/mcp)
npm run dev:next
```

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### ChatGPT 연결
1. ChatGPT Settings → Connectors → Create
2. MCP 서버 URL 입력: `https://<your-domain>.vercel.app/api/mcp`
3. 개발자 모드 활성화 (Settings → Apps & Connectors → Advanced)
4. 새 대화에서 커넥터 추가 후 테스트

---

## 8. ChatGPT 앱 제출 체크리스트

- [ ] Tool 설명이 명확하고 구체적인지 확인
- [ ] Widget이 모바일/데스크톱 모두에서 반응형으로 동작하는지 확인
- [ ] CORS 헤더가 올바르게 설정되어 있는지 확인
- [ ] `/mcp` 엔드포인트가 Streamable HTTP를 지원하는지 확인
- [ ] 에러 상황에서 적절한 fallback 메시지를 반환하는지 확인
- [ ] 민감한 사용자 데이터를 서버에 저장하지 않는지 확인
- [ ] UX 가이드라인 준수 여부 검토
- [ ] MCP Inspector에서 모든 tool이 정상 동작하는지 확인
