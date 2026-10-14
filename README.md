# EZ Chatbot Admin Dashboard

Next.js 16 administration dashboard for the **EZ Chatbot** multi-tenant platform. This application provides business owners, administrators, and customer support agents with an intuitive interface to manage websites, train AI knowledge bases, customize chat widgets with real-time preview, monitor live visitor conversations, take over chats in real-time, and manage appointment bookings.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Local Installation & Setup](#local-installation--setup)
  - [1. Navigate to Project Directory](#1-navigate-to-project-directory)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Environment Variables Reference](#4-environment-variables-reference)
  - [5. Run Development Server](#5-run-development-server)
- [Available Scripts](#available-scripts)
- [Docker Deployment](#docker-deployment)
- [Ecosystem Services](#ecosystem-services)

---

## Overview

The **EZ Chatbot Admin Dashboard** (`ez-chatbot-web`) acts as the command center for the entire chatbot ecosystem. It interfaces with:

1. **`ez-chatbot-api`** (NestJS backend) for authentication, multi-tenant site settings, document embeddings, web crawling, analytics, and booking management.
2. **Socket.IO Gateway** for real-time live chat monitoring, notifications, and human agent takeover.
3. **`ez-chat-widget`** for in-dashboard chatbot simulation, theme testing, and embed script distribution.

---

## Key Features

- **Multi-Tenant Site & Organization Management:**
  - Create and configure sites with isolated knowledge bases, bookings, and settings (`siteId`).
  - Domain allowlist configuration to safeguard embed widgets against unauthorized domains.
  - One-click embed code generator with customizable attributes.
  - Enable/disable chatbot switch per site.

- **Knowledge Base (KB) & Web Crawler Management:**
  - Ingest documents (PDF, TXT, Markdown, HTML) with asynchronous processing and status tracking (`pending`, `processing`, `ready`, `failed`).
  - Automated web crawler and sitemap synchronization with depth control, `robots.txt` compliance, and crawl history.
  - Page-level crawler inspection and one-click retry for failed URLs.

- **Visual Customizer & Live Testing:**
  - Theme editor: configure primary/secondary colors, chatbot bubble launcher, avatar, greeting messages, and placement.
  - Real-time side-by-side preview showing changes as you customize.
  - Interactive chatbot testing simulator directly in the dashboard before deploying to production.

- **Live Chat Monitoring & Human Agent Takeover:**
  - Real-time conversation tracking via WebSockets across lifecycle states (`active`, `waiting`, `agent_assigned`, `closed_visitor`, `closed_timeout`).
  - Audio and visual browser notifications for visitor agent requests.
  - One-click agent takeover allowing support agents to chat directly with visitors.

- **Appointment & Booking System (v2.0):**
  - Searchable booking management with status filtering (`confirmed`, `completed`, `cancelled`).
  - Interactive day-view booking calendar organized by staff/resources.
  - Manual booking modal for walk-in or telephone reservations with conflict detection.
  - Industry template selection (e.g., Salon template with customizable service durations).

- **Analytics & Reporting:**
  - Visual charts powered by Recharts: session volume, message counts, customer satisfaction (thumbs up/down ratings), and bot containment rate.

- **Security & Role-Based Access Control (RBAC):**
  - Multi-role support: `ADMIN` and `AGENT` permissions.
  - NextAuth.js v5 (Auth.js) session handling with JWT strategy.
  - Two-Factor Authentication (TOTP 2FA) setup, QR code pairing, and verification.

---

## Tech Stack

| Layer                    | Technology                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**            | [Next.js 16](https://nextjs.org/) (App Router)                                                                                                                        |
| **Core Library**         | [React 19](https://react.dev/)                                                                                                                                        |
| **Language**             | [TypeScript 5](https://www.typescriptlang.org/)                                                                                                                       |
| **UI Component Library** | [Ant Design 6](https://ant.design/) (`antd` + `@ant-design/icons`)                                                                                                    |
| **Admin Framework**      | [Refine](https://refine.dev/) (`@refinedev/antd`, `@refinedev/nextjs-router`)                                                                                         |
| **Authentication**       | [NextAuth.js v5 (beta)](https://authjs.dev/)                                                                                                                          |
| **Real-Time Gateway**    | [Socket.IO Client](https://socket.io/) (`socket.io-client` v4)                                                                                                        |
| **Data Visualization**   | [Recharts 3](https://recharts.org/)                                                                                                                                   |
| **Utilities**            | [Day.js](https://day.js.org/), [React Markdown](https://github.com/remarkjs/react-markdown), [libphonenumber-js](https://gitlab.com/catamphetamine/libphonenumber-js) |
| **Unit Testing**         | [Vitest](https://vitest.dev/)                                                                                                                                         |
| **Code Quality**         | ESLint 9, Prettier, Husky, lint-staged                                                                                                                                |
| **Containerization**     | Docker (Alpine Linux, multi-stage standalone build)                                                                                                                   |

---

## Project Architecture

```text
final-project-ez-admin-dashboard/
|-- app/                            # Next.js App Router
|   |-- (dashboard)/                # Protected dashboard layout & routes
|   |   |-- analytics/              # Performance & containment analytics
|   |   |-- bookings/               # Booking list, calendar, & manual creation
|   |   |-- dashboard/              # Metrics overview & quick stats
|   |   |-- live-chats/             # Real-time chat monitor & agent takeover
|   |   |-- organizations/          # Multi-tenant organization settings
|   |   |-- profile/                # User profile & 2FA management
|   |   |-- sites/                  # Site list, detail, KB, crawler, appearance
|   |   |-- users/                  # User accounts & RBAC management
|   |   `-- layout.tsx              # Auth guard & main shell layout
|   |-- api/auth/[...nextauth]/     # NextAuth route handlers
|   |-- health/                     # Healthcheck endpoint for Docker/K8s
|   |-- login/                      # Login & 2FA verification pages
|   |-- set-password/               # Password setup for invited users
|   |-- auth.ts                     # NextAuth configuration & JWT provider
|   `-- providers.tsx               # Ant Design & Refine theme context providers
|-- src/
|   |-- components/                 # Shared UI components (layout, header, sidebar)
|   |-- contexts/                   # React contexts (AuthContext, SocketContext)
|   |-- features/                   # Domain-driven feature modules
|   |   |-- analytics/              # Analytics charts & data processing
|   |   |-- auth/                   # Authentication forms & 2FA modals
|   |   |-- bookings/               # Booking table, calendar view, create modal
|   |   |-- dashboard/              # Stat cards & recent activity components
|   |   |-- knowledge-base/         # Document uploader, crawler sync, status tables
|   |   |-- live-chats/             # Chat session lists, chat room, message feed
|   |   |-- organizations/          # Organization cards & member tables
|   |   `-- sites/                  # Site form, theme customizer, chat test tab
|   |-- hooks/                      # Custom React hooks (sockets, notifications, roles)
|   |-- lib/                        # API clients, axios/fetch interceptors, Refine dataProvider
|   `-- types/                      # TypeScript definitions & API response models
|-- public/                         # Static assets (favicons, images)
|-- Dockerfile                      # Production Docker container build definition
|-- package.json                    # Project dependencies & scripts
`-- tsconfig.json                   # TypeScript configuration
```

---

## Prerequisites

Before running the dashboard locally, make sure you have installed:

- **Node.js**: `>= 24.0.0` (Node 24 is recommended, matching `.nvmrc`)
- **npm**: `>= 10.0.0`
- **Backend API**: [`final-project-ez-chatbot-api`](../final-project-ez-chatbot-api) running on `http://localhost:3000`
- _(Optional)_ **Chat Widget**: [`final-project-ez-chat-widget`](../final-project-ez-chat-widget) running on `http://localhost:5173` for interactive live testing

---

## Local Installation & Setup

### 1. Navigate to Project Directory

```bash
cd final-project-ez-admin-dashboard
```

### 2. Install Dependencies

Install the required npm packages:

```bash
npm install
```

> **Note:** If you want a deterministic install matching `package-lock.json`, you can use `npm ci`.

### 3. Configure Environment Variables

Create your local environment file by copying `.env.example`:

**On macOS / Linux (bash):**

```bash
cp .env.example .env.local
```

**On Windows (PowerShell):**

```powershell
Copy-Item .env.example .env.local
```

### 4. Environment Variables Reference

| Variable Name                   | Required | Default Value                             | Description                                                          |
| ------------------------------- | :------: | ----------------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`           |   Yes    | `http://localhost:3000/api/v1`            | Base REST & WebSocket API endpoint of `ez-chatbot-api`               |
| `AUTH_SECRET`                   |   Yes    | `my-super-secret-next-auth-key-123`       | Random string used by NextAuth to sign and encrypt session JWTs      |
| `AUTH_TRUST_HOST`               |   Yes    | `true`                                    | Tells NextAuth to trust localhost headers in local development       |
| `AUTH_URL`                      |    No    | `http://localhost:3001`                   | Canonical application URL for NextAuth callbacks                     |
| `NEXT_PUBLIC_CHAT_WIDGET_URL`   |    No    | `http://localhost:5173`                   | Host URL where the chat widget is served (used in testing simulator) |
| `NEXT_PUBLIC_WIDGET_SCRIPT_URL` |    No    | `http://localhost:5173/ez-chat-widget.js` | Script URL suggested in the Site Embed Code snippet                  |
| `NEXT_PUBLIC_WIDGET_VERSION`    |    No    | `local`                                   | Cache-busting version query string for the embed snippet             |

### 5. Run Development Server

Start the Next.js dev server on port **3001**:

```bash
npm run dev
```

Open your browser and navigate to:

```text
http://localhost:3001
```

> **Sign In:** Log in using the credentials created by the backend seed script (e.g. `superadmin@example.com` / `superAdminPassword123` or your administrator account).

---

## Available Scripts

The following scripts are defined in `package.json`:

| Command                | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`          | Starts the Next.js development server with hot-reload on port 3001                   |
| `npm run build`        | Compiles and builds the application for production (`.next/standalone`)              |
| `npm run start`        | Serves the production build on port 3001                                             |
| `npm run lint`         | Runs ESLint 9 checks across all source files                                         |
| `npm run lint:fix`     | Automatically fixes autofixable ESLint errors                                        |
| `npm run format`       | Formats all code, markdown, and config files with Prettier                           |
| `npm run format:check` | Checks for Prettier code formatting compliance                                       |
| `npm run typecheck`    | Validates TypeScript types with `tsc --noEmit`                                       |
| `npm run test`         | Runs the test suite once using Vitest                                                |
| `npm run test:watch`   | Starts Vitest in interactive watch mode                                              |
| `npm run validate`     | Runs all verification checks (`format:check`, `lint`, `type-check`, `test`, `build`) |

> **Pre-Pull Request Checklist:** Always execute `npm run validate` before pushing code or creating a PR to ensure formatting, linting, types, and build all pass.

---

## Docker Deployment

The application includes an optimized multi-stage `Dockerfile` with standalone Next.js output and health check.

### 1. Build the Docker Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 \
  --build-arg NEXT_PUBLIC_CHAT_WIDGET_URL=http://localhost:5173 \
  -t ez-admin-dashboard:latest .
```

### 2. Run the Container

```bash
docker run -d \
  --name ez-admin-dashboard \
  -p 3001:3000 \
  -e AUTH_SECRET="your-secure-production-secret" \
  -e AUTH_TRUST_HOST="true" \
  ez-admin-dashboard:latest
```

The container will expose the application on `http://localhost:3001` and provide an automatic container health check via `/health`.

---

## Ecosystem Services

For the complete multi-tenant chatbot platform, run these companion services alongside the dashboard:

| Service             | Directory                          | Description                                     | Default Port |
| ------------------- | ---------------------------------- | ----------------------------------------------- | ------------ |
| **Backend API**     | `final-project-ez-chatbot-api`     | NestJS, PostgreSQL, Redis, Socket.IO, Vector KB | `3000`       |
| **Admin Dashboard** | `final-project-ez-admin-dashboard` | Next.js 16, Ant Design 6, Refine                | `3001`       |
| **Chat Widget**     | `final-project-ez-chat-widget`     | Embeddable visitor chat widget (Vite/React)     | `5173`       |
| **MCP Server**      | `final-project-ez-mcp`             | Model Context Protocol agent tooling server     | `3002`       |
