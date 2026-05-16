# Product Requirements Document (PRD): Apollo DQMS 2.0

## 1. Executive Summary
Apollo DQMS 2.0 is an enterprise-grade, AI-powered hospital operations orchestration platform. It is designed to transform manual, reactive queue management into a proactive, intelligent, and autonomous ecosystem. By leveraging real-time data, AI-driven clinical sequencing, and dynamic resource allocation, the platform optimizes patient flow, reduces wait times, and enhances operational efficiency across multi-branch healthcare facilities. The system focuses on real-time queue orchestration, dynamic scheduling, operational analytics, intelligent notifications, and clinical sequencing to provide a comprehensive solution for modern healthcare environments.

## 2. Problem Statement & Business Case

### 2.1 The Problem
Hospitals currently face significant challenges in managing patient flow across shared resources such as X-ray, ECG, ultrasound, treadmill, and vital-check equipment. Today, most queue allocation is done manually, with floor staff physically directing guests to free stations. This manual coordination leads to unpredictable waiting times for patients and creates bottlenecks when multiple guests arrive simultaneously. Furthermore, staff dependency on manual entries to check resource availability results in crowding in smaller waiting areas and low visibility of status regarding which station is free, which is occupied, and for how long. Ultimately, this poor patient experience, especially during peak hours, negatively impacts same-day review completion. Given the lack of an integrated digital system, managing flow becomes reactive instead of proactive, reducing throughput and slowing down overall turnaround time for health checks.

### 2.2 Business Impact
Implementing Apollo DQMS 2.0 is expected to drive substantial operational improvements. The platform aims to achieve a 40-60% reduction in patient waiting time and a 25-35% increase in patient throughput. Additionally, it targets a 70-80% reduction in manual coordination efforts by hospital staff. These operational efficiencies will lead to a better patient experience, resulting in higher satisfaction rates and improved same-day review completion. The platform also provides real-time visibility across all departments and resources, enabling data-driven decisions and continuous optimization.

## 3. Product Vision & Goals

### 3.1 Vision
The vision for Apollo DQMS 2.0 is to create a "Zero-Touch" hospital flow orchestration platform that autonomously manages the end-to-end patient journey. It aims to be an AI-powered hospital operations intelligence platform rather than just a simple queue management system.

### 3.2 Strategic Goals
The primary goal is to deliver a Minimum Viable Product (MVP) that can effectively manage queues for Inpatient (IP), Outpatient (OP), and Health Check (HC) departments, assigning patients dynamically to available equipment. The solution must be low-cost to allow for scalable deployment across multiple branches. It must also possess the ability to integrate seamlessly with existing Hospital Information Systems (HIS). Furthermore, the platform will feature automated communication triggers to notify patients about their turn, thereby reducing confusion and waiting-area crowding. Finally, it will provide a simple, real-time dashboard for floor managers to easily monitor queues, equipment status, and patient flow.

## 4. User Personas & Roles

| Role | Responsibilities | Key Needs |
| :--- | :--- | :--- |
| **Super Admin** | Platform-wide configuration and tenant management. | Multi-hospital visibility and system health monitoring. |
| **Hospital Admin** | Branch-specific settings and staff management. | Operational reports and resource allocation tools. |
| **Floor Manager** | Real-time queue monitoring and manual overrides. | Live dashboards and bottleneck alerts. |
| **Technician/Doctor** | Service delivery and status updates. | Clear task lists and real-time patient status. |
| **Receptionist** | Patient onboarding and triage. | Fast check-in processes and token generation. |
| **Patient** | Navigation and waiting for turns. | Real-time updates and clear directions. |

## 5. Modular Functional Requirements

### Module 1: Identity & Access Management (IAM)
The IAM module handles authentication, authorization, Role-Based Access Control (RBAC), and multi-tenant access. It ensures strict data isolation between different hospital groups and branches. The module manages secure JWT-based logins, session management, and granular permissions for all roles, including Super Admin, Hospital Admin, Floor Manager, Receptionist, Technician, Doctor, and Patient.

### Module 2: Patient Management
This module manages patient demographic and registration data. It facilitates digital onboarding through QR-based check-in and kiosk integration. The system performs intelligent triage, classifying patients into IP, OP, HC, or Emergency categories, and assigns priority tags accordingly. It also centralizes patient records, visit history, and provides robust search and filtering capabilities.

### Module 3: Encounter Management
The Encounter Management module represents a patient’s active hospital visit or session. It tracks the patient's lifecycle from arrival to discharge, monitoring workflow state transitions between departments. Everything in DQMS revolves around these encounters, ensuring accurate tracking of the patient journey and current state.

### Module 4: Queue Orchestration Engine (Core)
As the core intelligence engine for patient flow optimization, this module handles queue creation and dynamic prioritization. It utilizes a Hybrid Dynamic Priority Scheduling Engine that scores patients based on emergency severity, SLA timers, department priority, equipment availability, and clinical dependencies. The engine supports dynamic rerouting, automatically moving patients to the shortest queue if a station becomes free, and provides real-time wait-time estimation.

### Module 5: Clinical Sequencing Engine
This module handles dependency-aware patient sequencing. It enforces clinical rules, such as fasting requirements before specific blood tests, and manages test ordering and medical sequencing. The engine optimizes the sequence of tests to minimize total turnaround time (TAT) through smart routing.

### Module 6: Station & Equipment Management
This module tracks operational resources in real-time. It monitors equipment status (e.g., Free, Occupied, Maintenance), room occupancy, and station availability. It also handles the dynamic allocation of technicians to specific stations and monitors overall resource utilization.

### Module 7: Real-time Communication Layer
Providing live operational synchronization, this layer ensures instant updates across all dashboards via WebSockets. It manages queue broadcasts, real-time notifications, and live occupancy tracking. The architecture utilizes Supabase Realtime and WebSockets for the MVP, with plans to scale using Redis Streams and Kafka in the future.

### Module 8: Notification System
The Notification System handles multi-channel communication with patients and staff. It supports SMS, WhatsApp, Email, In-App alerts, and digital signage updates. Automated triggers notify patients when they are next in line or when a station is ready, significantly reducing confusion and improving patient flow.

### Module 9: Navigation & Tracking
This module tracks patient movement and navigation. For the MVP, it utilizes low-cost, reliable QR checkpoints for workflow tracking and auto check-in/check-out. It provides smart navigation, directing patients to their next station via mobile web or app. Future enterprise scaling will incorporate BLE beacons and WiFi triangulation.

### Module 10: Analytics & Intelligence
Providing operational insights and predictions, this module features an operational dashboard with heatmaps, TAT monitoring, and utilization metrics. It leverages AI models for wait-time prediction, congestion forecasting, bottleneck detection, and no-show prediction, enabling data-driven operational recommendations.

### Module 11: Integration Layer
The Integration Layer connects DQMS with external systems, including HIS, EMR, RIS, LIS, billing systems, and payment gateways. It handles API orchestration, data synchronization, retry mechanisms, and mapping transformations to ensure seamless interoperability.

## 6. System Architecture & Tech Stack

### 6.1 Tech Stack
The platform utilizes a modern, scalable technology stack. The frontend is built with React, Vite, TypeScript, TailwindCSS, and shadcn/ui, utilizing Zustand or Redux Toolkit for state management and React Query for data fetching. The backend is powered by FastAPI (Python), SQLAlchemy, and Pydantic, supporting async APIs and WebSockets. The database layer relies on Supabase PostgreSQL, with Redis for caching and queues. Real-time capabilities are driven by Supabase Realtime and WebSockets. AI and machine learning features are implemented using Python ML Services, Scikit-learn, and XGBoost.

### 6.2 Architecture Principles
The recommended architecture approach starts with a Modular Monolith design, establishing clear, microservice-ready boundaries. This allows for fast development and easier debugging while maintaining enterprise scalability. The system is event-driven, utilizing events, services, and queues for inter-module communication to avoid tightly coupled dependencies. It prioritizes a realtime-first infrastructure and API-first design, ensuring all functionality is exposed via secure REST or WebSocket APIs.

## 7. Security & Compliance
The platform features a HIPAA-inspired security architecture designed for enterprise readiness. It implements strict Role-Based Access Control (RBAC) and multi-tenant isolation to ensure data privacy. All communication is encrypted at rest and in transit. Comprehensive audit logging tracks every operational action, recording the actor, timestamp, tenant, previous state, and new state to maintain full operational traceability.

## 8. Implementation Roadmap

The development strategy is divided into five distinct phases to ensure systematic delivery and scalability.

**Phase 1: Foundation** focuses on building the core Identity & Access Management (IAM), Patient Management, and Encounter Management modules.
**Phase 2: Core Product** delivers the essential operational features, including the Queue Engine, Station Management, and the Real-time Layer.
**Phase 3: Experience** enhances user interaction by implementing the Notification System, Navigation & Tracking, and operational Dashboards.
**Phase 4: Intelligence** introduces advanced capabilities, building the Analytics module, AI prediction models, and the optimization engine.
**Phase 5: Enterprise** scales the platform for large deployments, adding external Integrations, multi-hospital support, advanced auditing, and scaling infrastructure.

## 9. Key Metrics (KPIs)
The success and operational efficiency of the platform will be measured against several key performance indicators. These include Average Wait Time (AWT), Turnaround Time (TAT), and Queue Length. The system will also track the No-Show Rate, Daily Patient Volume, and overall Resource Utilization Rate to ensure optimal performance and continuous improvement.

## 10. References

- [Apollo DQMS 2.0 Architecture Diagram](https://www.example.com/dqms_diagram.png) [1]
- [DQMS Enterprise Architecture Master Guide](https://www.example.com/dqms_master_guide.md) [2]
