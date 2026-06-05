# Behavioral Archaeologist / AI Psychologist Agent

## 🏗️ Project Structure

```text
/behavioral-archaeologist
├── /backend                 # Core Node.js/TypeScript Server (Express)
│   ├── /controllers         # Route handlers for hardware and webhooks
│   ├── /middleware          # Butterbase Auth & Consent verification middleware
│   ├── /services            # Business logic (Hardware bridge, Mood aggregator)
│   └── server.ts            # Main entry point
├── /butterbase              # 🧈 Butterbase Integration
│   ├── schema.prisma        # Database schema (Users, ConsentLogs, MoodHistory)
│   ├── ai-gateway.ts        # Routing: GPT-4o (Vision) -> Claude 3.5 Sonnet (Psych Analysis)
│   └── storage.ts           # Encrypted storage handler for sensitive visual/text data
├── /rocketride              # 🚀 RocketRide AI Pipelines
│   ├── pipeline.yaml        # Visual workflow definition
│   ├── /nodes               # Custom node logic if needed
│   │   ├── ingestion.ts     # Merges Telegram text + 10s interval phone images
│   │   ├── vision-analysis.ts # GPT-4o facial expression extraction
│   │   ├── psych-analysis.ts  # Claude 3.5 Sonnet mood & contradiction detection
│   │   └── action-decision.ts # Decides Telegram response & XTrace update
├── /xtrace                  # 🧠 XTrace Memory Layer
│   ├── memory-manager.ts    # Wrapper for XTrace Memory API
│   └── prompt-templates.ts  # Prompts for extracting long-term patterns & resolving contradictions
├── /photon                  # 💬 Photon Messaging
│   ├── telegram-bot.ts      # Photon webhook handler for Telegram
│   └── message-formatter.ts # Ensures bug-free, native plain-text empathetic responses
├── /hardware-bridge         # 🐕 Robot Dog Phone Integration
│   └── image-poller.ts      # Lightweight server receiving 10s interval images from Android phone
├── .env.example             # Pre-configured API keys for all 4 sponsors
├── package.json
└── README.md