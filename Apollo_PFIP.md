# APOLLO PFIP
### Apollo Patient Flow Intelligence Platform

**Samsung Solve for Tomorrow 2026 · Health & Education Track**

*Intelligent. Autonomous. Real-Time. Human-Centered.*

**AI-Assisted Operational Intelligence for Smart Hospitals**

**Team:**
- **Vinay J** — MSc Health Informatics, The Apollo University
- **Midhun** — B.Tech Computer Science Engineering, The Apollo University

---

## Slide 2 — Major Problem in Hospitals

Hospitals face major challenges in managing queues across shared diagnostic equipment:

- Manual coordination by floor staff
- No real-time equipment visibility
- Long and unpredictable waiting times
- Bottlenecks during peak hours
- Crowding in waiting areas
- Delayed same-day health reviews

---

## Slide 3 — THE PROBLEM *(02)*
### Hospitals Still Run Queues Built for a Smaller, Simpler World

**Key statistics:**

| Stat | Meaning |
|---|---|
| **71%** | of OPD wait time is caused by bottlenecks inside the department itself — not patient volume |
| **2h vs 3m** | typical total OPD visit time, against actual face-to-face consultation time |
| **83.5%** | physician utilization flagged as the critical bottleneck in tertiary-hospital studies |
| **30%** | reduction in excessive-wait probability demonstrated by queueing-theory–based modeling |

**Narrative:**
First-come-first-served queues ignore clinical severity. A 68-year-old with chest pain waits behind forty routine follow-ups. Administrators only discover a department is congested after walkouts have already begun — and patients with nowhere to turn pay the price in lost care, lost trust, and lost revenue for the hospital.

*Sources: peer-reviewed OPD queueing & patient-flow studies, Indian tertiary and government hospitals*

---

## Slide 4 — THE SOLUTION *(03)*
### A Command Center for Patient Flow — Not Another Token Number

Apollo PFIP isn't an EHR and isn't a billing system. It's the operational intelligence layer that sits across the entire visit — registration, triage, consultation, diagnostics, pharmacy, and discharge — coordinating every department in real time.

**Smart Clinical Triage**
AI engine classifies patients into P1 / P2 / P3 urgency bands using chief-complaint keywords, age, and mobility — fast-tracking high-risk patients automatically, not by who shouts loudest.

**Deterministic Forecasting**
An M/M/1 queueing model — real arrival and service rates, not guesswork — predicts wait times and department congestion 30, 60 and 120 minutes ahead.

**Unified Digital Discharge**
Lab, pharmacy and clearance gates are tracked independently and resolve automatically. A QR exit pass is issued only once every clinical condition is genuinely met.

**Vision:** Transform hospital operations from reactive queue management to proactive patient flow intelligence — for better care, every time.

---

## Slide 5 — THE PATIENT JOURNEY *(04)*
### Seven Steps, Fully Instrumented — End to End

1. **Registration** — Check-in, token, capture details →
2. **Smart Triage** — AI risk classification & priority →
3. **Consultation** — Nurse / doctor diagnosis & plan →
4. **Diagnostics** — Lab orders, samples, results →
5. **Pharmacy** — Prescription & dispensing →
6. **Queue Clearance** — All gates verified complete →
7. **Exit Pass** — Digital QR discharge

Every transition is event-driven — when a nurse completes triage, the patient card moves on every connected dashboard in under 2 seconds, with zero manual refresh and zero double bookings.

---

## Slide 6 — SYSTEM ARCHITECTURE *(05)*
### Built Like Production Software, Not a Hackathon Demo

*(This slide is a full-bleed layered architecture diagram rather than a bullet list. Layers, top to bottom:)*

**Client Layer**
- Patient Kiosk / Mobile Web App
- Staff Dashboard (Web)
- Admin / Analytics Console

**Real-Time Layer**
- WebSocket server pushing live queue-state updates to every connected client (the <2‑second sync referenced elsewhere in the deck)
- REST API gateway handling standard requests

**Application Layer (Node.js / Express, event-driven backend)**
- Queue Orchestration Engine
- Smart Triage AI Engine (P1 / P2 / P3 classification)
- M/M/1 Queueing & Forecasting Engine
- Unified Discharge Gate Service (Lab / Pharmacy / Clearance gates)
- Notification Service (SMS / WhatsApp)

**Data Layer**
- PostgreSQL with Prisma ORM (nested transactions — zero orphaned records)
- Redis (caching / session state)
- Audit Trail Ledger (100% of critical transitions logged)

**External Integrations**
- FHIR / HL7 EHR connector
- SMS / WhatsApp API gateway
- Hospital EHR / HIS systems (no rip-and-replace integration)

Security shown running across the stack: **JWT + RBAC** role-scoped authentication on every route.

> Note: This slide is diagram-only artwork; the labels above are transcribed from the rendered image as faithfully as possible. If you need the exact original diagram, the image itself should be preserved/exported separately rather than relying on this text transcription.

---

## Slide 7 — THE COMPARISON *(07)*
### Traditional Queue Systems vs. Apollo DQMS

| Traditional Queue Systems | Apollo DQMS 3.0 / 4.0 |
|---|---|
| FIFO only — sorted by arrival time, ignoring clinical severity | AI re-ranks queues by clinical severity, fast-tracking critical cases |
| No visibility into patient frustration until walkouts happen | Predictive walkout-risk monitor warns staff before patients leave |
| Patients shuttle between lab, pharmacy & billing with paper files | Unified digital discharge gates auto-clear and issue a QR exit pass |
| Staff reassigned manually, only after bottlenecks are visible | SLA-driven allocator recommends reassigning staff in real time |
| Names called over speaker systems — noisy and confusing | Automated SMS / WhatsApp updates sent at every transition |

---

## Slide 8 — VALIDATION *(08)*
### We Didn't Just Design It — We Tested It

**PASS — Scenario A: Lab Path Only**
Triage → Consult → Lab referral. Confirms LAB_REPORTS gate auto-clears on results; PHARMACY gate stays pending.

**PASS — Scenario B: Pharmacy Path Only**
Triage → Consult → Prescription. Confirms stock deducts on dispensing and PHARMACY gate clears correctly.

**PASS — Scenario C: Combined Path**
Referral to both Lab and Pharmacy. Confirms exit pass stays blocked until both gates independently clear.

All scenarios run through a dedicated UAT test runner (`uat-scenarios.ts`) against the live API — not mocked.

**Key metrics:**

| Metric | Value |
|---|---|
| Sync latency across all staff dashboards after any transition | **<2 sec** |
| Orphaned records — nested Prisma transactions on every write | **Zero** |
| Role-scoped authentication on every route | **JWT + RBAC** |
| Critical transitions captured in the audit-trail ledger | **100%** |

---

## Slide 9 — BUSINESS MODEL *(09)*
### From Hackathon Prototype to Hospital SaaS

**How We Earn**
- Private hospital chains — per-OPD-counter / per-bed SaaS subscription
- Government & district hospitals — tender-based or grant-funded deployment (aligned with ABDM digitization push)
- Premium tier — federated cross-hospital congestion prediction and WhatsApp voice-bot pre-triage
- Integrates with existing EHR/HIS via FHIR connectors — no rip-and-replace required

**Why Now**
- India's hospital digitization is accelerating under NABH and Ayushman Bharat Digital Mission (ABDM) mandates
- Most existing systems are EHR/billing-first — operational flow intelligence is a clear, underserved gap
- Our prototype already runs the full patient lifecycle end-to-end — not a slide deck claim, a working system
- Natural expansion path: tier-2/3 private hospitals → government PHCs → multi-hospital networks

---

## Slide 10 — IMPACT & ROADMAP *(10)*
### What Changes for Hospitals — and What's Next

**Measured Outcomes**
- Reduced wait times
- Improved throughput
- Better patient experience
- Operational efficiency
- Real-time visibility
- Data-driven decisions
- Higher resource utilization
- Safer, smarter hospitals

**Roadmap & Use of Incubation Support**

1. **Pilot at 2 hospitals in Andhra Pradesh** — Validate against real OPD load and SLA targets
2. **FHIR / HL7 EHR Connector** — Auto-sync check-ins and lab orders with hospital EHR/HIS
3. **WhatsApp Voice-Bot Pre-Triage** — Let patients pre-triage by voice before arriving
4. **Federated Cross-Hospital Prediction** — Predict congestion across units without sharing patient-level data

---

## Slide 11 — Total Investment Required

A total of **₹15–35 lakhs** (Complete setup with manpower)

**Covers:**
- Frontend (patient app + manager dashboard)
- Queue orchestration engine
- Rule-based + priority logic
- Basic geofence trigger
- SMS / WhatsApp API integration
- Cloud hosting (3–6 months)
- Mock / sandbox HIS connector
- Analytics dashboard
- Security baseline

**Team:**
3–5 engineers + 1 designer + clinical advisor

---

## Slide 12 — Benefits of Using Our Solution

**Financial Impact (Per Diagnostics Wing / Year)**

| Item | Amount |
|---|---|
| Extra diagnostic revenue | ₹2.0–2.2 Cr |
| Staff & ops savings | ₹0.5–0.9 Cr |
| Bed-turnover improvement | ₹0.4–0.8 Cr |
| **Total upside** | **₹2.9–3.9 Cr** |

**After platform cost:**
**Net margin improvement: ₹2.2–3.2 Cr / year**

---

## Slide 13 — OUR TEAM *(11)*
### Apollo University — Health Informatics Meets Systems Engineering

**Vinay J** — MSc Health Informatics
Health Informatics and Analytics building national EHR infrastructure. Brings clinical workflow design, FHIR/HL7 standards, patient identity & triage logic, and AI clinical-safety governance directly into PFIP's design.

**Midhun** — B.Tech Computer Science Engineering
Systems and full-stack engineering lead — architecture, microservices, real-time WebSocket infrastructure, and the event-driven backend that makes PFIP run like production software.

---

## Slide 14 — Closing

# BUILT FOR INDIA.
# BUILT FOR EVERY PATIENT.

**Thank you — Questions & Discussion**

- **Vinay J** — MSc Health Informatics, The Apollo University
- **Midhun** — B.Tech Computer Science Engineering, The Apollo University

*Project: Apollo PFIP 4.0 · Samsung Solve for Tomorrow 2026 · Health & Education Track*
