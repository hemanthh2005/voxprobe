# VoxProbe — 3-Minute Hackathon Demo Script

**Total Target Duration:** 2:45 to 3:00 minutes  
**Goal:** Show judges the core value prop: Evidence-First Voice API Debugging (`Voice -> Tool -> Verification -> Evidence -> Regression Test`).

---

### Scene 1: Problem & Introduction (0:00 - 0:25)
- **Visual:** Speaker on screen / product title screen displaying VoxProbe logo and tagline: *"Speak the bug. Prove the failure. Ship the fix."*
- **Voiceover:**
  > "Hi judges! Developers waste hours jumping between Postman, terminals, OpenAPI docs, and test runners just to diagnose API bugs. Generic AI chatbots often guess or hallucinate API failures without running real tests. 
  > 
  > Meet **VoxProbe**—an evidence-first voice API debugging agent built on the **AssemblyAI Voice Agent API**."

---

### Scene 2: Live Golden Demo — Flagship Scenario ORD-1042 (0:25 - 1:35)
- **Visual:** Show VoxProbe Developer Evidence Cockpit UI. Click microphone button.
- **User Speaks:**
  > "VoxProbe, investigate why order ORD-1042 is returning an invalid response."
- **VoxProbe Agent Spoken Response:**
  > "I'll test the endpoint and compare its response with the API contract."
- **Visual Focus:**
  1. Live Investigation Timeline animates `[RUN API TEST]` -> `GET /api/orders/ORD-1042` -> `HTTP 200 OK`.
  2. Contract checker triggers `validate_response` -> `AJV Schema Check FAILED`.
  3. Signature **Evidence Chain Graph** illuminates: 
     - Observed: `total = "1499"` (Type: `string`)
     - Contract Expectation: `total` must be `number`.
- **VoxProbe Agent Spoken Explanation:**
  > "I found a verified contract mismatch. The total field is returned as a string, but the contract requires a number."

---

### Scene 3: Regression Test Generation (1:35 - 2:15)
- **User Speaks:**
  > "Create a regression test for this failure."
- **VoxProbe Agent Spoken Response:**
  > "Done. I generated a Vitest regression test that will catch this contract mismatch."
- **Visual Focus:**
  1. Click **"View Test Code"** button in UI.
  2. Modal opens displaying clean, executable Vitest + Supertest code inspecting `typeof targetField !== 'string'`.
  3. Demonstrate **Download .test.ts** button.

---

### Scene 4: Second Scenario & Architecture (2:15 - 2:45)
- **Visual:** Click quick prompt chip **"Verify order ORD-1043"**.
- **Agent Action:** 
  > Agent tests `ORD-1043` and catches Enum violation (`status: "in_transit"` not permitted in `[pending, processing, shipped, delivered]`).
- **Voiceover:**
  > "VoxProbe runs directly on AssemblyAI's managed Voice Agent WebSocket API using 24kHz PCM16 low-latency streaming and AudioWorklet audio processing. All diagnostic requests run through a secure backend tool allowlist with AJV OpenAPI validation."

---

### Scene 5: Closing Statement (2:45 - 3:00)
- **Visual:** VoxProbe Evidence Cockpit summary screen.
- **Voiceover:**
  > "VoxProbe turns voice interaction into deterministic engineering proof. Speak the bug. Prove the failure. Ship the fix. Thank you!"
