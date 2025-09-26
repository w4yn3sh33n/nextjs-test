# AI Chat Assistant with Supabase Authentication

이 프로젝트는 Supabase 인증을 사용하는 AI 채팅 어시스턴트입니다. Google Gemini 2.0 Flash를 사용하여 실시간 채팅 기능을 제공합니다.

## 주요 기능

- 🔐 Supabase Auth를 사용한 이메일 회원가입/로그인
- 💬 실시간 AI 채팅 (Gemini 2.0 Flash)
- 📱 반응형 UI (shadcn/ui + Tailwind CSS)
- 💾 로컬 스토리지를 사용한 채팅 히스토리 저장
- 🛡️ 인증된 사용자만 채팅 페이지 접근 가능

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key
LLM_MODEL=gemini-2.0-flash-exp
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성하세요
2. 프로젝트 설정에서 URL과 anon key를 복사하여 환경 변수에 설정하세요
3. Authentication > Settings에서 이메일 인증을 활성화하세요

### 3. 개발 서버 실행

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 프로젝트 구조

```
├── app/
│   ├── api/chat/stream/     # 채팅 스트리밍 API
│   ├── chat/                # 채팅 페이지 (인증 필요)
│   └── page.tsx             # 홈페이지 (인증 필요)
├── components/
│   ├── auth-form.tsx        # 로그인/회원가입 폼
│   ├── auth-provider.tsx    # 인증 상태 관리
│   ├── protected-route.tsx  # 라우트 보호 컴포넌트
│   └── ui/                  # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase.ts          # Supabase 클라이언트 설정
│   ├── use-auth.ts          # 인증 훅
│   └── types.ts             # TypeScript 타입 정의
└── components.json          # shadcn/ui 설정
```

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Authentication**: Supabase Auth
- **AI**: Google Gemini 2.0 Flash
- **Package Manager**: pnpm

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
