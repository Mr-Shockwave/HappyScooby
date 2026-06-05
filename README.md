# Behavioral Archaeologist / AI Psychologist

Production-ready backend scaffold for the Agentic AI SF Hackathon. An AI agent that analyzes behavioral signals from Telegram messages and robot-dog phone camera frames to detect mood patterns and contradictions.

## Hackathon Sponsors

| Sponsor | Module | Purpose |
|---------|--------|---------|
| **Butterbase** | `butterbase/` | PostgreSQL via Prisma, consent/auth, AI gateway routing, encrypted storage |
| **RocketRide** | `rocketride/` | Visual AI pipeline orchestration and custom processing nodes |
| **XTrace** | `xtrace/` | Long-term behavioral memory and contradiction resolution |
| **Photon** | `photon/` | Telegram bot webhook and empathetic message delivery |

## Project Structure

```text
backend/           Core Express server, controllers, middleware, services
butterbase/        Prisma schema, AI gateway, encrypted storage
rocketride/        Pipeline definition and custom node stubs
xtrace/            Memory API wrapper and prompt templates
photon/            Telegram webhook handler and message formatter
hardware-bridge/   Android phone image ingestion (10s interval frames)
```

## Quick Start

```bash
cp .env.example .env
# Edit .env with your sponsor API keys

npm install
npm run prisma:generate
npm run dev
```

Server starts at `http://localhost:3000` by default.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production server |
| `npm run typecheck` | Type-check without emitting |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check with sponsor module list |
| `POST` | `/api/hardware/image` | Receive base64 or multipart image from Android phone |
| `POST` | `/photon/telegram/webhook` | Photon Telegram webhook (user's only interface) |

## Test Image Ingestion

```bash
# JSON base64 payload
curl -X POST http://localhost:3000/api/hardware/image \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "deviceId": "android-01"}'

# Multipart file upload
curl -X POST http://localhost:3000/api/hardware/image \
  -F "image=@/path/to/frame.jpg" \
  -F "deviceId=android-01"
```

## RocketRide Pipeline

**Visual editor:** Open [`rocketride/behavioral-archaeologist.pipe`](rocketride/behavioral-archaeologist.pipe) in VS Code with the RocketRide extension to view and edit the workflow graph.

Pipeline DAG: `webhook (ingestion)` → `image_vision_openai (vision)` → `prompt + llm_anthropic (psych)` → `response_answers (action)`

- Hardware images and Telegram text are forwarded from Express into the `webhook_1` source node.
- [`rocketride/pipeline.yaml`](rocketride/pipeline.yaml) maps `.pipe` components to the TypeScript orchestrator modules.
- [`rocketride/orchestrator.ts`](rocketride/orchestrator.ts) runs the same 4-stage flow in code when not using the RocketRide cloud engine.
