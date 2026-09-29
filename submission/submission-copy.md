# LabLab.ai + AssemblyAI Voice Agent Hackathon Submission Copy

## PROJECT TITLE
VoxProbe

## TAGLINE
"Speak the bug. Prove the failure. Ship the fix."

## SHORT DESCRIPTION (Max 255 characters)
VoxProbe is an evidence-first voice API debugging agent powered by AssemblyAI. Speak naturally to investigate endpoints, verify OpenAPI contracts, generate reproducible Vitest regression tests, and ship fixes with real empirical evidence.

## LONG DESCRIPTION (100+ words)
Software developers and QA engineers waste countless hours context-switching between terminals, REST clients, OpenAPI documentation, logs, issue trackers, and test suites when diagnosing API bugs. Generic AI assistants often invent API responses or hallucinate bugs without running actual diagnostic tests.

VoxProbe solves this problem by introducing **Evidence-First Voice API Debugging**. 

Powered by the **AssemblyAI Voice Agent API**, developers can speak naturally: *"VoxProbe, investigate why order ORD-1042 is failing the API contract."* 

VoxProbe understands spoken intent, executes deterministic backend diagnostic tools (`run_api_test`, `validate_response`), tests real microservice sandbox endpoints, validates response payloads against OpenAPI 3.0 schemas using AJV, and presents a visual **Evidence Chain**. 

If a defect is verified—such as order `total` returned as a string `"1499"` instead of number `1499`—VoxProbe explains the evidence out loud via voice and instantly generates a downloadable, executable Vitest/Supertest regression test file. VoxProbe never invents API results; every claim is backed by empirical verification.

## TECHNOLOGY TAGS
- AssemblyAI Voice Agent API
- Node.js
- Express
- React
- TypeScript
- Vite
- Tailwind CSS
- AJV Schema Validator
- OpenAPI 3.0
- Vitest / Supertest
- Web Audio API / AudioWorklet

## CATEGORY TAGS
- Voice AI Agents
- Developer Tools & QA Automation
- API Contract Testing
- Software Engineering
- AssemblyAI Hackathon

## DEMO URL PLACEHOLDER
https://voxprobe.onrender.com (or Vercel / local URL)

## GITHUB URL PLACEHOLDER
https://github.com/your-username/voxprobe

## ADDITIONAL INFORMATION
- Native 24 kHz PCM16 mono audio streaming over WebSockets.
- Instant barge-in audio queue flushing when user speaks.
- Strict security allowlists blocking arbitrary external URLs or shell execution.
- Includes deterministic microservices sandbox for instant judge testing.
