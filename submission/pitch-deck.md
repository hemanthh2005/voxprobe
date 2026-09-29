# VoxProbe — Pitch Deck

## Slide 1: Cover Title
**VoxProbe**  
*"Speak the bug. Prove the failure. Ship the fix."*  
- Voice-First API Debugging & Contract Verification Agent  
- Built for LabLab.ai + AssemblyAI Voice Agent Hackathon  

---

## Slide 2: The Problem
**Developer Time Wasted in Debugging Silos**  
- **Context Switching**: Developers spend 30%+ of engineering time context-switching between Postman, terminal logs, OpenAPI docs, and test runners.  
- **Generic AI Hallucinations**: Standard chatbots guess root causes, invent fake status codes, and hallucinate non-existent API responses.  
- **No Traceability**: No bridge between natural spoken dialogue and deterministic automated testing.  

---

## Slide 3: The Solution
**VoxProbe: Evidence-First Voice Debugging**  
- **Spoken API Investigation**: Natural voice requests to test microservice endpoints.  
- **Deterministic Tool Calling**: AssemblyAI Agent calls server tools to execute real HTTP tests.  
- **OpenAPI Schema Validation**: AJV contract engine verifies exact type, enum, and required property constraints.  
- **Empirical Evidence**: Every claim is backed by traceable HTTP logs, schema diffs, and evidence IDs.  

---

## Slide 4: How the AssemblyAI Voice Agent Works
**Real-Time Voice & Tool Integration Flow**  
```
USER VOICE (24kHz PCM16)
       ↓
AssemblyAI Voice Agent (WebSocket API)
       ↓
`tool.call` Event (run_api_test / validate_response)
       ↓
Express Backend Tool Execution (Sandbox Allowlist)
       ↓
AJV OpenAPI Contract Checker
       ↓
`tool.result` Event -> Spoken Audio Explanation
       ↓
Evidence Chain UI & Vitest Regression Test Generation
```

---

## Slide 5: The Signature Feature — Evidence Chain
**Traceable Engineering Proof**  
- **Node 1**: Spoken Intent (*"Investigate order ORD-1042"*)  
- **Node 2**: Tool Call (*`run_api_test` -> `GET /api/orders/ORD-1042`*)  
- **Node 3**: Raw Response (*HTTP 200 OK, `total = "1499"`*)  
- **Node 4**: Contract Verification (*FAILED: `total` expected `number`, observed `string`*)  
- **Node 5**: Regression Test (*Generated Vitest test spec*)  

---

## Slide 6: Security & Architectural Integrity
**Built for Enterprise Safety**  
- **Zero Front-End Credentials**: Backend generates temporary short-lived AssemblyAI tokens.  
- **Strict Endpoint Allowlist**: External arbitrary URLs, SSRF, and shell execution strictly blocked.  
- **Prompt Injection Defense**: Tool outputs treated as raw data evidence, never instructions.  
- **Zero Latency Audio**: AudioWorklet 24kHz PCM16 recording with instant barge-in queue flushing.  

---

## Slide 7: Market Opportunity & Future Potential
**The Future of AI QA Automation**  
- **Target Audience**: Software Engineers, QA Leads, Microservices Teams, DevOps Engineers.  
- **Roadmap Expansion**:  
  1. Multi-environment OpenAPI schema loading (Staging / Production).  
  2. Automated GitHub PR creation with regression test commits.  
  3. CI/CD pipeline integration (GitHub Actions / GitLab CI).  

---

## Slide 8: Technology & Open Source
**AssemblyAI Powered Stack**  
- **Voice AI**: AssemblyAI Voice Agent API  
- **Backend**: Node.js, Express, AJV, OpenAPI 3.0  
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide Icons  
- **Testing**: Vitest, Supertest  
- **GitHub Repository**: [Link to Repository]  
- **Live Demo**: [Link to Live App]  
