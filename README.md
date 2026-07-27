# ez-chatbot-web

Next.js admin application for ez-chatbot, using Ant Design.

## Requirements

- Node.js 24
- ez-chatbot-api running on port 3000

## First run

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3001
```

## Commands

```powershell
npm run dev
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
npm run build
npm run validate
```

Run `npm run validate` before opening a pull request.
