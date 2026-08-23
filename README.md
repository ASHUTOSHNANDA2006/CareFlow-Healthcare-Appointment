# CareFlow

> **Healthcare, prepared before you arrive.**

CareFlow is an AI-assisted healthcare appointment coordination platform built with the MERN stack. Instead of treating an appointment as only a calendar entry, CareFlow manages the complete workflow from symptom intake and safe slot reservation to AI-assisted pre-visit preparation, doctor consultation, patient-friendly follow-up, medication reminders, notifications, and calendar synchronization.

## Why CareFlow?

Traditional appointment systems usually stop at:

**Find doctor → Pick slot → Book**

CareFlow extends that workflow:

**Symptoms → Doctor discovery → Safe slot reservation → AI pre-visit brief → Appointment → Doctor notes → AI follow-up → Medication reminders → Calendar + notifications**

The goal is to make the appointment useful **before, during, and after** the consultation.

> **Important:** AI-generated information is assistive and must not be treated as a medical diagnosis or a substitute for clinical judgment.

---

## Key Features

### Patient

- Register and securely log in
- Search doctors by specialization
- View doctor availability
- Reserve appointment slots
- Temporary slot-hold mechanism
- Submit symptoms before confirming an appointment
- View AI-generated pre-visit information
- View appointment status
- Reschedule or cancel appointments
- View patient-friendly post-visit summary
- View medication schedule and reminders
- Receive appointment/leave notifications
- Synchronize appointments with Google Calendar

### Doctor

- Secure role-based login
- View today's appointments
- View AI-generated pre-visit brief
- See patient symptoms and suggested questions
- Submit clinical notes
- Enter prescription details
- Generate patient-friendly post-visit summary
- Manage appointment status

### Admin

- Create and manage doctor profiles
- Configure specialization
- Configure working hours
- Configure slot duration
- Manage doctor leave
- Detect leave conflicts with existing appointments
- Trigger affected-patient notifications

---

## Engineering Highlights

### 1. Four-Layer React Architecture

The frontend follows a separation-of-concerns model:

```text
UI Pages / Components
        ↓
Custom Hooks
        ↓
Context API
        ↓
Axios Services
        ↓
REST API
```

This keeps UI rendering, state management, reusable application behavior, and HTTP communication separate.

### 2. Secure Authentication

Authentication uses:

- JWT
- HTTP-only cookies
- Secure cookie configuration in production
- Role-based authorization
- Server-side token revocation

JWTs contain a unique `jti`. On logout, the token identifier is stored in a blacklist collection.

MongoDB TTL indexing automatically removes expired blacklist records.

This reduces client-side token exposure and provides server-side revocation of logged-out/revoked tokens.

### 3. Concurrency-Safe Appointment Booking

The frontend never acts as the final authority on slot availability.

The database is the source of truth.

```text
Patient selects slot
        ↓
Validate working hours
        ↓
Check doctor leave
        ↓
Attempt atomic reservation
        ↓
      HELD
        ↓
Patient confirms
        ↓
   CONFIRMED
```

If another patient successfully reserves the same slot first, the second request receives a slot-unavailable response.

### 4. Temporary Slot Holds

Selected slots can temporarily enter:

```text
AVAILABLE → HELD → CONFIRMED
```

If confirmation does not happen before the hold expires:

```text
HELD → EXPIRED → AVAILABLE
```

This reduces race conditions during the booking flow.

### 5. Structured AI Pipeline

CareFlow uses the `@google/genai` SDK for AI-assisted clinical summarization.

The AI pipeline is:

```text
Patient / Doctor Input
        ↓
Input Validation
        ↓
Prompt Builder
        ↓
Google GenAI
        ↓
Structured responseSchema
        ↓
Runtime Validation
        ↓
Business Validation
        ↓
Typed Application Object
        ↓
MongoDB
```

Structured output constrains the response format. It does not guarantee factual correctness.

### Pre-Visit AI

The system produces:

- Urgency: Low / Medium / High
- Chief complaint
- Key symptoms
- Up to three suggested questions for the doctor

### Post-Visit AI

The system converts clinician-provided notes into a patient-friendly summary containing:

- Visit summary
- Medication information
- Follow-up instructions
- Precautions

### Graceful AI Failure

AI is not a single point of failure.

If the LLM fails:

```text
LLM failure
    ↓
Log failure
    ↓
Mark AI status = FAILED
    ↓
Keep appointment workflow operational
```

The appointment should continue even when AI is temporarily unavailable.

---

## System Architecture

```text
                         CAREFLOW
                            │
              ┌─────────────┴─────────────┐
              │                           │
          React App                  Express API
              │                           │
     ┌────────┼────────┐           ┌──────┼─────────┐
     │        │        │           │      │         │
   Pages    Hooks   Context       Auth  Services  Middleware
     │        │        │           │      │         │
     └────────┴────────┘           └──────┼─────────┘
              │                           │
          Axios Services                  │
              │                           │
              └──────────────┬────────────┘
                             │
                       MongoDB Atlas
                             │
       ┌─────────────────────┼──────────────────────┐
       │                     │                      │
 Appointments          Authentication          Notifications
       │                     │                      │
       │                 JWT + Cookie          Email + Retry
       │                 + TTL Blacklist
       │
       ├───────────────┐
       │               │
       ▼               ▼
 Slot Engine        Leave Engine
       │               │
       ▼               ▼
 Atomic Booking    Conflict Detection
       │
       ▼
 Google Calendar
       │
       ▼
     AI Service
       │
  @google/genai
       │
 responseSchema
       │
 Validation
       │
 MongoDB
```

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Context API
- Custom Hooks
- Axios
- Responsive UI

### Backend

- Node.js
- Express.js
- REST API
- JWT authentication
- HTTP-only cookies
- Role-based middleware

### Database

- MongoDB Atlas
- Mongoose
- MongoDB TTL indexes

### AI

- Google GenAI
- `@google/genai`
- Structured response schemas
- Runtime/business validation

### Integrations

- Google Calendar API
- OAuth 2.0
- Email service
- Background notification/reminder jobs

### Deployment

The project is designed for free-tier deployment where possible.

---

## Project Structure

```text
CareFlow/
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── routes/
│   │   └── styles/
│   └── package.json
│
├── PROJECT_SPEC.md
├── SYSTEM_DESIGN.md
├── README.md
├── .env.example
└── .gitignore
```

---

## Core Data Models

```text
User
 ├── name
 ├── email
 ├── passwordHash
 └── role

Doctor
 ├── userId
 ├── specialization
 ├── workingHours
 └── slotDuration

Appointment
 ├── doctorId
 ├── patientId
 ├── date
 ├── startTime
 ├── endTime
 ├── status
 ├── holdExpiresAt
 └── googleCalendarEventId

SymptomReport
 ├── patientId
 ├── appointmentId
 ├── symptoms
 ├── aiStatus
 └── aiSummary

VisitNote
 ├── appointmentId
 ├── doctorId
 ├── clinicalNotes
 ├── prescription
 ├── aiStatus
 └── patientSummary

Leave
 ├── doctorId
 └── date

Notification
 ├── recipientId
 ├── appointmentId
 ├── type
 ├── status
 └── retryCount

BlacklistedToken
 ├── jti
 ├── userId
 └── expiresAt
```

---

## API Overview

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Doctors

```http
GET   /api/doctors
GET   /api/doctors/:id
POST  /api/admin/doctors
PATCH /api/admin/doctors/:id
```

### Availability

```http
GET /api/doctors/:id/availability?date=YYYY-MM-DD
```

### Appointments

```http
POST  /api/appointments/hold
POST  /api/appointments/confirm
GET   /api/appointments
GET   /api/appointments/:id
PATCH /api/appointments/:id/reschedule
PATCH /api/appointments/:id/cancel
```

### AI

```http
POST /api/ai/pre-visit
POST /api/ai/post-visit
```

### Visits

```http
POST /api/visits
GET  /api/doctor/appointments
```

### Leave

```http
POST /api/admin/doctors/:id/leave
GET  /api/admin/conflicts
```

---

## Local Setup

### Prerequisites

Install:

- Node.js 18+
- npm
- MongoDB Atlas account or local MongoDB
- Google Cloud project for Calendar integration
- Google GenAI API access

### 1. Clone

```bash
git clone https://github.com/ASHUTOSHNANDA2006/CareFlow.git
cd CareFlow
```

### 2. Backend

```bash
cd Backend
npm install
```

Create:

```text
.env
```

using `.env.example`.

Then run:

```bash
npm run dev
```

### 3. Frontend

```bash
cd ../Frontend
npm install
npm run dev
```

---

## Environment Variables

Create `.env` files locally and never commit real credentials.

Example:

```env
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

GEMINI_API_KEY=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

FRONTEND_URL=
```

---

## Google Calendar Setup

1. Create/select a Google Cloud project.
2. Enable Google Calendar API.
3. Configure OAuth consent screen.
4. Create OAuth 2.0 credentials.
5. Add the application's redirect URI.
6. Store client credentials in environment variables.
7. Complete OAuth authorization.
8. Store the required calendar integration information securely.
9. On appointment confirmation, create the event.
10. On reschedule, update the event.
11. On cancellation, delete the event.

Calendar synchronization errors must not corrupt the appointment's core database state.

---

## AI Prompts

### Pre-Visit

The application asks the model to analyze supplied symptoms and return a structured object containing:

- urgency
- chief complaint
- key symptoms
- up to three suggested questions

The model must not diagnose the patient.

### Post-Visit

The application asks the model to transform clinician-provided notes into a patient-friendly structured summary containing:

- summary
- medication information
- follow-up
- precautions

Medication data should originate from the clinician's prescription rather than being invented by the model.

---

## Demo Flow

The recommended demonstration is:

```text
Patient Login
    ↓
Search Doctor
    ↓
Select Slot
    ↓
Enter Symptoms
    ↓
AI Visit Brief
    ↓
Confirm Appointment
    ↓
Doctor Login
    ↓
View AI Visit Brief
    ↓
Enter Clinical Notes + Prescription
    ↓
Generate Patient Summary
    ↓
Patient Views Summary
    ↓
Medication Reminder / Calendar
```

A secondary reliability demonstration can show two attempts to reserve the same slot and demonstrate that only one succeeds.

---

## Security Notes

- Passwords are hashed before storage.
- JWTs are stored in HTTP-only cookies.
- JWTs are not stored in browser localStorage.
- Authorization is enforced server-side.
- API secrets remain server-side.
- `.env` files are not committed.
- Synthetic data should be used for demos.
- AI output is validated before persistence.
- AI output is not treated as a medical diagnosis.
- User-generated content must be rendered safely.
- Sensitive clinical information should not be written into unnecessary logs.

---

## Current Limitations

CareFlow is a prototype designed to demonstrate the engineering concepts required by the assignment.

It should not be used as a production medical system without additional work around:

- clinical validation
- regulatory/compliance requirements
- comprehensive audit logging
- encryption and key management
- production-grade observability
- stronger privacy controls
- infrastructure scaling
- disaster recovery
- formal medical safety review

---

## Roadmap

### Phase 1
Core appointment workflow.

### Phase 2
AI and integrations.

### Phase 3
Notification reliability and reminders.

### Phase 4
Advanced analytics and product enhancements.

---

## Author

**Ashutosh Nanda**

B.Tech CSE  
VIT Bhopal University

GitHub: `https://github.com/ASHUTOSHNANDA2006`

---

## License

This project is developed as a portfolio/assignment prototype.
