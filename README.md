# OTP Chat (`xpresso_demo2_otpchat`)

> **Autonomous ChatGPT-Class PWA Powered by Featherless AI, Cloudflare Workers & Cloudflare Access OTP**  
> Deployed Live at Edge: [https://xs_demo2_chat.milkies.work](https://xs_demo2_chat.milkies.work)  
> Application Lifecycle Ledger: [docs/app-ledger.md](docs/app-ledger.md) | License: [LICENSE.md](LICENSE.md)

---

## 1. Executive Summary & Philosophy

**OTP Chat** is a premier, autonomous AI chat workstation designed for organization team members. Built from scratch on the [Xpresso Boilerplate](docs/app-ledger.md), it delivers a native, ChatGPT-grade conversational experience without passwords, without end-user API key management, and with zero latency penalty.

### Key Highlights
- **Cloudflare Access Zero-Trust OTP**: Perimeter authentication guards the edge application. Identity is cryptographically derived directly from Cloudflare Access headers (`Cf-Access-Authenticated-User-Email` and `Cf-Access-Jwt-Assertion`).
- **Featherless AI Edge Streaming**: Direct Server-Sent Events (SSE) pipe proxying open-weights foundation models (`Qwen/Qwen2.5-72B-Instruct`, `deepseek-ai/DeepSeek-R1-Distill-Llama-70B`, `zai-org/GLM-4.7-Flash`, `meta-llama/Meta-Llama-3.1-70B-Instruct`, and `Qwen/Qwen2.5-Coder-32B-Instruct`).
- **Zero Token Leakage**: The Featherless API secret is strictly bound to the Cloudflare Worker runtime environment (`apps/web/src/worker.ts`). Zero client bundle exposure.
- **Five Native Device-Class Forms**: Dedicated layouts tailored for Mobile (`M`), Tablet Portrait (`TP`), Tablet Landscape (`TL`), Desktop Standard (`DS`), and Desktop Wide (`DW`).
- **Full PWA Capability**: Offline-capable application shell, web app manifest, cache-control policies, and responsive touch interactions exceeding `chatgpt.com`.

---

## 2. Architecture & Edge Topology

```
                                  [ User Browser / PWA ]
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │     Cloudflare Global Edge Anycast Network    │
                    │         (xs_demo2_chat.milkies.work)          │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      Cloudflare Access OTP Perimeter Guard    │
                    │        (28 Whitelisted Team Member Emails)    │
                    └───────────────────────┬───────────────────────┘
                                            │  Injected Access Headers:
                                            │  • Cf-Access-Authenticated-User-Email
                                            │  • Cf-Access-Jwt-Assertion
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │     Cloudflare Worker Runtime (`workerd`)     │
                    │             (xpresso-demo2-otpchat)           │
                    │                                               │
                    │  ┌─────────────────────┐ ┌──────────────────┐ │
                    │  │ Worker Assets (SPA) │ │ Strict Edge CSP  │ │
                    │  │ index.html + /dist  │ │ SHA-256 Hashes   │ │
                    │  └─────────────────────┘ └──────────────────┘ │
                    │  ┌─────────────────────┐ ┌──────────────────┐ │
                    │  │ GET /api/me         │ │ POST /api/chat   │ │
                    │  │ Identity extraction │ │ Streaming SSE    │ │
                    │  └─────────────────────┘ └────────┬─────────┘ │
                    └───────────────────────────────────┼───────────┘
                                                        │
                                      Authorization: Bearer $FEATHERLESS_API_KEY
                                      User-Agent: xpresso-otpchat/1.0.0
                                                        │
                                                        ▼
                                    ┌───────────────────────────────────────┐
                                    │         Featherless AI Gateway        │
                                    │  https://api.featherless.ai/v1/chat   │
                                    └───────────────────────────────────────┘
```

### Edge Components & Contracts
1. **Discard Routing (`AAAA 100::`)**:
   - Provisioned via [scripts/ensure_dns.sh](scripts/ensure_dns.sh) in Cloudflare zone `78d2442920a4612b381ca27fd643082b`.
   - Maps Anycast DNS directly to Cloudflare Worker edge dispatch without exposing an origin web server.
2. **Access OTP Application**:
   - Provisioned via [scripts/ensure_access.sh](scripts/ensure_access.sh).
   - Enforces one-time pin verification for 28 designated organization email addresses.
3. **Edge Worker Runtime**:
   - Implemented in [apps/web/src/worker.ts](apps/web/src/worker.ts).
   - Handles static assets via `env.ASSETS.fetch` with single-page-application fallback.
   - Enforces strict CSP via [apps/web/src/csp.ts](apps/web/src/csp.ts) with inline script SHA-256 hashes and `'connect-src 'self''`.
4. **Featherless AI Streaming Relay**:
   - Handles SSE stream chunks, `: FEATHERLESS PROCESSING` keep-alive comments, and reasoning deltas (`delta.reasoning`).

---

## 3. Five Native Device-Class Forms

The application surface provides 5 distinct responsive forms rather than a generic resized web page:

| Device Class | Viewport Range | Layout & UX Behavior | Source Reference |
|--------------|----------------|----------------------|------------------|
| **Mobile (`M`)** | `<600px` | Bottom-sheet thread drawer, thumb-friendly floating composer, virtual keyboard viewport-fit avoidance, haptic-like touch responses. | [apps/web/src/modules/chat/forms.ts](apps/web/src/modules/chat/forms.ts) |
| **Tablet Portrait (`TP`)** | `600px – 839px` | Slide-over drawer navigation, centered reading width, bottom-sheet session inspector. | [apps/web/src/modules/chat/forms.ts](apps/web/src/modules/chat/forms.ts) |
| **Tablet Landscape (`TL`)** | `840px – 1199px` | Two-pane split workspace (compact session rail + active chat stream), collapsible right drawer. | [apps/web/src/modules/chat/forms.ts](apps/web/src/modules/chat/forms.ts) |
| **Desktop Standard (`DS`)** | `1200px – 1599px` | Collapsible sidebar, 72ch centered canvas, `Cmd+K` command palette, keyboard shortcut navigation (`Cmd+N`, `Cmd+/`). | [apps/web/src/modules/chat/forms.ts](apps/web/src/modules/chat/forms.ts) |
| **Desktop Wide (`DW`)** | `1600px+` | Persistent tri-pane flagship workstation (sidebar + chat canvas + live token & reasoning inspector). | [apps/web/src/modules/chat/Chat.tsx](apps/web/src/modules/chat/Chat.tsx) |

---

## 4. Supported AI Models

Configured and available via `/api/models`:

1. **`Qwen/Qwen2.5-72B-Instruct`** *(Default)*: Flagship open-weights model, excellent general reasoning, mathematics, and code generation.
2. **`deepseek-ai/DeepSeek-R1-Distill-Llama-70B`** *(Reasoning)*: State-of-the-art distilled reasoning model with visible chain-of-thought tokens.
3. **`zai-org/GLM-4.7-Flash`** *(Fast)*: Ultra-low latency model optimized for agile interactive dialogue.
4. **`meta-llama/Meta-Llama-3.1-70B-Instruct`** *(General)*: Meta's open foundation model with balanced capabilities.
5. **`Qwen/Qwen2.5-Coder-32B-Instruct`** *(Coding)*: Specialized model for software architecture, code generation, and debugging.

---

## 5. Local Development & Deployment Runbook

### Prerequisites
- Node.js 22+
- pnpm 10.x
- Python 3.12 (`/opt/homebrew/bin/python3.12`)
- Cloudflare Wrangler CLI (`wrangler`)
- GitHub CLI (`gh`)

### Local Development Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Configure local environment secret
echo "FEATHERLESS_API_KEY=rc_029ce8baff7510edc6c0dd91b54869434bf5dd098bd6d34254abaed2dad8c0e5" > apps/web/.dev.vars

# 3. Start local development server
pnpm --filter web dev
```

### Production Edge Deployment
```bash
export CLOUDFLARE_API_TOKEN="..."

# 1. Provision DNS AAAA 100:: proxied record
bash scripts/ensure_dns.sh

# 2. Provision Cloudflare Access OTP Application and 28-email policy
bash scripts/ensure_access.sh

# 3. Configure Worker runtime secret
printf '%s' "$FEATHERLESS_API_KEY" | npx wrangler secret put FEATHERLESS_API_KEY -c apps/web/wrangler.toml

# 4. Build web application and deploy to edge
pnpm --filter web build
npx wrangler deploy -c apps/web/wrangler.toml
```

---

## 6. Verification & Quality Gates

The codebase enforces strict quality gates with zero hardcoded colors, zero leftover demo strings, and full E2E test coverage:

```bash
# Verify Xpresso composition gates (0 demo strings, 0 orphaned overlays)
python3.12 skills/xpresso_boilerplate/scripts/compose-gates.py

# Verify zero hardcoded color tokens in UI components
bash scripts/check_no_hardcoded_colors.sh

# Verify zero secrets committed in Git history
python3.12 scripts/scan_secrets.py

# Run TypeScript typecheck
pnpm --filter web typecheck

# Run full 192-test E2E suite across all 4 tiers
python3.12 scripts/test_e2e.py
```

---

## 7. Project Structure & Key Modules

```
xpresso_demo2_otpchat/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── modules/
│       │   │   └── chat/                 # Primary Chat Module
│       │   │       ├── forms/            # 5 Device-Class Forms (M, TP, TL, DS, DW)
│       │   │       ├── types.ts          # Core domain entity interfaces
│       │   │       ├── models.ts         # Model catalog definitions
│       │   │       ├── store.ts          # IndexedDB conversation state machine
│       │   │       ├── sse.ts            # Robust SSE stream reader
│       │   │       ├── markdown.ts       # KaTeX + Prism code syntax renderer
│       │   │       └── Chat.tsx          # Responsive shell root
│       │   ├── worker.ts                 # Cloudflare Worker edge backend
│       │   └── csp.ts                    # Edge Content-Security-Policy builder
│       └── wrangler.toml                 # Cloudflare Worker & Assets route config
├── docs/
│   └── app-ledger.md                     # Canonical lifecycle ledger (GOAL to REPORT)
├── scripts/
│   ├── ensure_dns.sh                     # Idempotent Cloudflare DNS provisioner
│   ├── ensure_access.sh                  # Idempotent Cloudflare Access provisioner
│   ├── scan_secrets.py                   # Git history secret scanner
│   └── check_no_hardcoded_colors.sh      # Design system color token auditor
├── package.json                          # Workspace root configuration
└── LICENSE.md                            # MIT License
```

---

## 8. License

MIT License — Copyright (c) 2026 Michal Jerzy Lew. See [LICENSE.md](LICENSE.md) for details.
