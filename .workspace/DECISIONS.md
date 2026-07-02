# Apollo PFIP 4.0 - Architecture & Design Decisions

## Purpose
Document all technical and architectural decisions made during development.

---

## 📋 Decision Log

### 2024-01-26 | Day 1 - Foundation Decisions

#### Decision 1: Technology Stack
**Issue:** PFIP document suggests Node.js/Express but we have Python/FastAPI implementation  
**Options:**
1. Migrate to Node.js (as per PFIP doc)
2. Keep Python/FastAPI (current working system)
3. Hybrid approach (Python backend, Node.js for specific services)

**Decision:** ✅ **Keep Python/FastAPI**  
**Rationale:**
1. Healthcare industry heavily favors Python (DICOM, HL7, EHR integrations)
2. AI/ML capabilities require Python ecosystem
3. FastAPI provides excellent async support and performance
4. Existing codebase is working and tested
5. Samsung/Apollo stakeholders won't see backend code - they'll see demos
6. Migration would waste 4-6 weeks with minimal benefit

**Impact:**
- Continue with Python/FastAPI
- Add WebSocket support to FastAPI
- Use Python ML libraries for triage engine
- Write comprehensive documentation explaining stack choice

---

#### Decision 2: Focus Prioritization
**Issue:** Need to balance Samsung demo vs Apollo hospital workflow  
**Options:**
1. Focus on Samsung demo features
2. Focus on Apollo hospital workflow
3. Split focus 50/50

**Decision:** ✅ **Focus on Apollo hospital workflow**  
**Rationale:**
1. Apollo is the actual end-user/customer
2. Real hospital workflow = real value
3. Samsung demo will benefit from actual working system
4. Apollo adoption = stronger case for Samsung

**Impact:**
- Research actual Apollo processes first
- Build for hospital production use
- Demo features will emerge naturally
- Better long-term sustainability

---

#### Decision 3: Folder Structure
**Issue:** Current structure mixes concerns, hard to scale  
**Options:**
1. Keep current flat structure
2. Feature-based modular structure
3. Domain-driven design structure

**Decision:** ✅ **Feature-based modular structure**  
**Rationale:**
1. Scales better with team growth
2. Clear boundaries between features
3. Easier testing and maintenance
4. Natural separation of concerns
5. Matches PFIP feature modules

**Structure:**
```
frontend/
├── features/
│   ├── triage/
│   ├── gates/
│   ├── forecast/
│   └── queue/
```

**Impact:**
- Need to reorganize existing code
- Update imports across files
- Create clear module boundaries
- Better team collaboration

---

#### Decision 4: Real-time Implementation
**Issue:** PFIP requires <2 sec sync, current system uses polling  
**Options:**
1. Polling (current)
2. WebSockets
3. Server-Sent Events (SSE)

**Decision:** ✅ **WebSockets**  
**Rationale:**
1. FastAPI has excellent native WebSocket support
2. Bi-directional communication
3. Lower latency than polling
4. Connected/unconnected state management
5. Industry standard for real-time apps
6. Can coexist with REST API

**Implementation:**
- Add `/ws` endpoint
- Room-based broadcasting
- Connection management
- Heartbeat system
- Reconnection logic

---

#### Decision 5: Database Architecture
**Issue:** Need to add PFIP features (gates, audit logs, triage logs)  
**Options:**
1. Add to existing models
2. Create separate models
3. Use JSON fields in existing models

**Decision:** ✅ **Create separate models**  
**Rationale:**
1. Clear separation of concerns
2. Better performance with indexes
3. Easier querying and filtering
4. Maintains data integrity
5. Scales better
6. Easier to debug and monitor

**New Models Required:**
1. `Gate` - Discharge gates (Lab, Pharmacy, Clearance)
2. `AuditLog` - Comprehensive audit trail
3. `TriageLog` - AI classification history
4. `Prediction` - Forecasting results storage
5. `Notification` - Outbound communications

---

#### Decision 6: AI Triage Engine Stack
**Issue:** Need to implement P1/P2/P3 classification  
**Options:**
1. Rule-based system (simple)
2. ML model with training (complex)
3. Hybrid approach

**Decision:** ✅ **Hybrid approach**  
**Rationale:**
1. Start with rule-based for MVP
2. Use NLP for symptom classification
3. Add ML model later as data grows
4. Ensure clinical safety with override
5. Can integrate both approaches

**Implementation Phases:**
1. Phase 1: Rule-based keywords + risk factors
2. Phase 2: Basic NLP symptom classification
3. Phase 3: ML training on historical data
4. Always: Doctor override capability

---

#### Decision 7: State Management
**Issue:** Frontend state management needs improvement  
**Options:**
1. Continue with Zustand (current)
2. Switch to Redux
3. Add React Query for server state

**Decision:** ✅ **Zustand + React Query + WebSocket**  
**Rationale:**
1. Zustand already working well for client state
2. React Query optimal for server state caching
3. WebSocket for real-time updates
4. Lightweight combination
5. Good TypeScript support

**Architecture:**
- Zustand: UI state, form state
- React Query: API cache, pagination
- WebSocket: Real-time updates
- Context: Theme, auth context

---

#### Decision 8: UI Framework & Animations
**Issue:** Need stunning animations for demo  
**Options:**
1. Tailwind CSS utilities (current)
2. Framer Motion
3. React Spring
4. Native CSS animations

**Decision:** ✅ **Tailwind + Framer Motion**  
**Rationale:**
1. Tailwind already integrated
2. Framer Motion has excellent React integration
3. Good performance characteristics
4. Great developer experience
5. Good documentation and community

**Animation Strategy:**
- Page transitions: Framer Motion
- Micro-interactions: Tailwind + CSS
- Complex animations: Framer Motion
- Loading states: skeleton components

---

#### Decision 9: Development Workflow
**Issue:** Need efficient development process  
**Options:**
1. Individual module development
2. Pair programming style
3. Phase-based development

**Decision:** ✅ **Module-by-module with daily checkpoints**  
**Rationale:**
1. Clear progress tracking
2. Minimal context switching
3. Easier testing and validation
4. Better documentation flow
5. Clear completion criteria

**Workflow:**
1. Complete all files for a module
2. Test module integration
3. Update documentation
4. Move to next module
5. Daily status updates in CHANGELOG

---

#### Decision 10: Documentation Strategy
**Issue:** Need comprehensive documentation  
**Options:**
1. Minimal docs for speed
2. Comprehensive docs
3. Code as documentation

**Decision:** ✅ **Comprehensive docs + self-documenting code**  
**Rationale:**
1. Required for hospital compliance
2. Needed for team handoff
3. Easier maintenance
4. Better for demo presentations
5. Clinical safety requirement

**Documentation Types:**
1. Architecture docs (decisions, diagrams)
2. API documentation (auto-generated)
3. User guides
4. Developer guides
5. Deployment guides
6. Clinical workflow docs

---

## 📊 Summary Table

| Decision Area | Decision | Justification | Impact |
|--------------|----------|--------------|--------|
| Backend Stack | Python/FastAPI | Healthcare standard, AI/ML ready | Keep existing, add features |
| Focus | Apollo workflow | Real customer value | Build production system |
| Structure | Feature-based | Scalability, clarity | Reorganize codebase |
| Real-time | WebSockets | Industry standard, FastAPI support | Add new endpoint |
| Database | Separate models | Clear boundaries, performance | Add 5 new models |
| AI Triage | Hybrid | Clinical safety, gradual improvement | Rule-based then ML |
| State Management | Zustand + React Query | Already working, good TS support | Enhance existing |
| UI/Animations | Framer Motion + Tailwind | Professional results, good DX | Add animation library |
| Workflow | Module-by-module | Clear progress, easier testing | Systematic development |
| Documentation | Comprehensive | Hospital compliance, team handoff | Create full docs |

---

## 🔄 Change History
All decisions are subject to review based on:
1. New requirements from Apollo
2. Performance benchmarks
3. Team feedback
4. Technical constraints

---

**Decision Record Keeper:** Development Team  
**Review Cycle:** Weekly review of all decisions  
**Last Updated:** January 26, 2024