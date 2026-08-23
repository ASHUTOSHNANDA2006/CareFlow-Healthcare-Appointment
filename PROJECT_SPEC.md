# CareFlow --- Project Specification

**Version:** 1.0\
**Project Type:** AI-assisted healthcare appointment coordination
platform\
**Stack:** MERN + Google GenAI + Google Calendar\
**Target:** 2-day implementation and deployment\
**Primary Goal:** Deliver a polished, reliable, interview-ready
prototype that satisfies the company assignment while demonstrating
strong system design and product thinking.

------------------------------------------------------------------------

## 1. Product Vision

### Product Name

**CareFlow**

### Tagline

**Healthcare, prepared before you arrive.**

### Product Thesis

An appointment should not be treated as only a calendar entry. CareFlow
manages the complete appointment lifecycle:

**symptom intake → doctor discovery → slot reservation → AI pre-visit
brief → consultation → AI follow-up → medication reminders →
notifications → calendar synchronization**

### Core Users

  -----------------------------------------------------------------------
  Role                                Primary Goal
  ----------------------------------- -----------------------------------
  Patient                             Find a doctor, book safely, provide
                                      symptoms, understand follow-up

  Doctor                              Manage appointments, review
                                      AI-prepared patient information,
                                      record visits

  Admin                               Manage doctors, working hours, slot
                                      duration and leave
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 2. Assignment Requirements

The implementation must cover the supplied assignment requirements:

-   Separate patient, doctor and admin portals.
-   Patient registration, login, doctor search and appointment booking.
-   Symptom collection before appointment confirmation.
-   AI-generated pre-visit summary containing urgency, chief complaint
    and suggested doctor questions.
-   Doctor post-visit notes and prescription.
-   AI-generated patient-friendly post-visit summary.
-   Medication reminders based on prescription frequency.
-   Booking confirmation, reminder and cancellation notifications.
-   Google Calendar event creation, update and deletion.
-   Doctor leave handling and notification of affected patients.
-   Safe prevention of simultaneous double-booking.
-   Graceful LLM failure handling.
-   Backend API, frontend, database and role-based authentication.
-   Background jobs for medication reminders and notification retries.
-   README, `.env.example`, API documentation, database schema, LLM
    prompts and Google Calendar setup documentation.
-   Hosted application URL and complete source code.

------------------------------------------------------------------------

## 3. Scope Priorities

### P0 --- Must Work

1.  Authentication and role-based access.
2.  Patient doctor search.
3.  Doctor availability.
4.  Appointment slot generation.
5.  Temporary slot hold.
6.  Atomic/concurrency-safe appointment confirmation.
7.  Symptom submission.
8.  AI pre-visit summary.
9.  Doctor appointment dashboard.
10. Post-visit notes and prescription.
11. AI post-visit summary.
12. Appointment cancellation and rescheduling.
13. Doctor leave and conflict detection.
14. Responsive, polished core UI.
15. Deployment.

### P1 --- Should Work

1.  Google Calendar synchronization.
2.  Email notifications.
3.  Medication reminders.
4.  Notification retry handling.
5.  Admin doctor management.
6.  Notification/status visibility.

### P2 --- Only if time remains

1.  Advanced analytics.
2.  Advanced animation.
3.  AI appointment-preparation assistant.
4.  Expanded admin reporting.
5.  Additional dashboard metrics.

P2 features must never delay or destabilize P0/P1 functionality.

------------------------------------------------------------------------

## 4. Frontend Architecture

The frontend will use a four-layer separation-of-concerns model:

``` text
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

### Layer 1 --- UI

Responsible only for rendering, user interaction and presentation.

``` text
pages/
components/
```

### Layer 2 --- Custom Hooks

Responsible for reusable application behavior and data-fetching
orchestration.

Examples:

``` text
useAuth()
useDoctors()
useAppointments()
useAI()
useNotifications()
```

### Layer 3 --- Context API

Only genuinely global state should live here.

Initial contexts:

``` text
AuthContext
AppointmentContext
```

Do not place all application state into Context.

### Layer 4 --- Axios Services

All HTTP communication should be centralized.

``` text
services/
├── api.js
├── auth.service.js
├── doctor.service.js
├── appointment.service.js
├── ai.service.js
└── notification.service.js
```

Components and pages should not directly call Axios.

------------------------------------------------------------------------

## 5. Frontend Folder Structure

``` text
Frontend/
└── src/
    ├── components/
    │   ├── common/
    │   ├── appointment/
    │   ├── doctor/
    │   ├── patient/
    │   └── ai/
    │
    ├── pages/
    │   ├── auth/
    │   ├── patient/
    │   ├── doctor/
    │   └── admin/
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useDoctors.js
    │   ├── useAppointments.js
    │   ├── useAI.js
    │   └── useNotifications.js
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── AppointmentContext.jsx
    │
    ├── services/
    │   ├── api.js
    │   ├── auth.service.js
    │   ├── doctor.service.js
    │   ├── appointment.service.js
    │   ├── ai.service.js
    │   └── notification.service.js
    │
    ├── routes/
    │   └── app.routes.jsx
    │
    ├── styles/
    ├── App.jsx
    └── main.jsx
```

------------------------------------------------------------------------

## 6. Backend Architecture

Backend responsibilities are separated into:

``` text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Models / Database
```

### Controllers

Handle HTTP request/response concerns only.

### Services

Contain business logic.

Important services:

``` text
services/
├── auth/
│   └── token.service.js
│
├── appointment/
│   ├── slot.service.js
│   ├── booking.service.js
│   └── leave.service.js
│
├── ai/
│   ├── preVisit.service.js
│   ├── postVisit.service.js
│   ├── prompts.js
│   ├── schemas.js
│   └── validator.js
│
├── calendar/
│   └── googleCalendar.service.js
│
└── notification/
    ├── email.service.js
    └── retry.service.js
```

Business logic must not be placed directly in route handlers.

------------------------------------------------------------------------

## 7. Backend Folder Structure

``` text
Backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   ├── google.js
│   │   └── genai.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── appointment.controller.js
│   │   ├── doctor.controller.js
│   │   ├── patient.controller.js
│   │   ├── admin.controller.js
│   │   ├── ai.controller.js
│   │   └── notification.controller.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── error.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   ├── SymptomReport.js
│   │   ├── VisitNote.js
│   │   ├── Leave.js
│   │   ├── Notification.js
│   │   └── BlacklistedToken.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── appointment.routes.js
│   │   ├── doctor.routes.js
│   │   ├── patient.routes.js
│   │   ├── admin.routes.js
│   │   └── ai.routes.js
│   │
│   ├── services/
│   ├── utils/
│   └── app.js
│
├── server.js
└── package.json
```

------------------------------------------------------------------------

## 8. Authentication and Authorization

### Authentication

Use:

-   JWT
-   HTTP-only cookie
-   `Secure` in production
-   appropriate `SameSite` policy
-   short-lived access token
-   server-side token revocation

JWT should contain:

``` text
sub
role
jti
iat
exp
```

### Token Blacklisting

On logout:

``` text
JWT
 ↓
extract jti
 ↓
store jti in BlacklistedToken
 ↓
clear HTTP-only cookie
```

`BlacklistedToken.expiresAt` will have a MongoDB TTL index so expired
blacklist records are automatically removed.

This reduces client-side token exposure and provides server-side
revocation of logged-out/revoked tokens. It does not claim to make the
application completely XSS-proof or guarantee that all replay scenarios
are impossible.

### Authorization

Roles:

``` text
patient
doctor
admin
```

Use middleware such as:

``` text
requireAuth()
requireRole("doctor")
requireRole("admin")
```

------------------------------------------------------------------------

## 9. Database Design

### User

``` text
_id
name
email
passwordHash
role
createdAt
updatedAt
```

### Doctor

``` text
_id
userId
specialization
qualification
experience
slotDuration
workingHours
createdAt
updatedAt
```

### Appointment

``` text
_id
doctorId
patientId
date
startTime
endTime
status
holdExpiresAt
symptomReportId
visitNoteId
googleCalendarEventId
createdAt
updatedAt
```

Appointment status:

``` text
HELD
CONFIRMED
COMPLETED
CANCELLED
EXPIRED
```

### SymptomReport

``` text
_id
patientId
appointmentId
symptoms
aiStatus
aiSummary
createdAt
updatedAt
```

### VisitNote

``` text
_id
appointmentId
doctorId
clinicalNotes
prescription[]
aiStatus
patientSummary
createdAt
updatedAt
```

### Leave

``` text
_id
doctorId
date
reason
createdAt
```

### Notification

``` text
_id
recipientId
appointmentId
type
channel
status
retryCount
lastError
scheduledFor
sentAt
createdAt
```

### BlacklistedToken

``` text
_id
jti
userId
expiresAt
createdAt
```

Create a TTL index on `expiresAt`.

------------------------------------------------------------------------

## 10. Appointment and Slot Architecture

The database is the source of truth for slot availability. Frontend
availability is advisory only.

### Slot lifecycle

``` text
AVAILABLE
   ↓
HELD
   ↓
CONFIRMED
```

If the hold expires:

``` text
HELD
   ↓
EXPIRED
   ↓
AVAILABLE
```

### Booking flow

``` text
Patient selects slot
       ↓
Validate doctor working hours
       ↓
Check doctor leave
       ↓
Attempt atomic reservation
       ↓
SUCCESS → HELD
       ↓
Patient confirms
       ↓
CONFIRMED
```

If another request wins the same slot:

``` text
CONFLICT
   ↓
Return SLOT_UNAVAILABLE
   ↓
Frontend refreshes availability
```

The backend must prevent two simultaneous requests from successfully
confirming the same doctor/date/time slot.

------------------------------------------------------------------------

## 11. Doctor Leave Conflict Handling

When admin marks a doctor as unavailable for a date:

``` text
Create Leave
    ↓
Find existing appointments
    ↓
If none → complete
    ↓
If conflicts exist
    ↓
Create conflict records/notifications
    ↓
Notify affected patients
```

Patient-facing message:

> Your appointment needs to be rescheduled because the doctor is
> unavailable on this date.

The system must not silently delete existing appointments.

------------------------------------------------------------------------

## 12. AI Architecture

Use the `@google/genai` SDK.

The LLM is treated as an inference service, not as a trusted database.

Pipeline:

``` text
User Input
   ↓
Input Validation
   ↓
Prompt Builder
   ↓
@google/genai
   ↓
Structured responseSchema
   ↓
Runtime validation
   ↓
Business validation
   ↓
Typed application object
   ↓
MongoDB
```

Structured output constrains the response format. It does not guarantee
medical correctness or make the output literally hallucination-free.

------------------------------------------------------------------------

## 13. Pre-Visit AI Contract

Required output:

``` text
{
  urgency: "Low" | "Medium" | "High",
  chiefComplaint: string,
  keySymptoms: string[],
  suggestedQuestions: string[]
}
```

Constraints:

-   `urgency` must be one of Low, Medium or High.
-   `suggestedQuestions` must contain at most 3 questions.
-   Output must match the configured response schema.
-   Output must be validated before persistence.
-   UI must label the result as AI-generated and non-diagnostic.

Suggested prompt intent:

> Analyze the supplied patient symptoms and return a structured
> pre-visit summary containing urgency level, chief complaint, key
> symptoms and up to three questions the doctor may consider asking. Do
> not provide a diagnosis.

------------------------------------------------------------------------

## 14. Post-Visit AI Contract

Required output:

``` text
{
  summary: string,
  medications: [
    {
      name: string,
      dosage: string,
      frequency: string,
      duration: string
    }
  ],
  followUp: string,
  precautions: string[]
}
```

The output should convert clinician-provided notes into language that is
easier for the patient to understand.

The system must not allow the LLM to silently invent a prescription.
Medication data should originate from the doctor's entered prescription
and the AI should primarily transform/explain it.

------------------------------------------------------------------------

## 15. LLM Failure Handling

AI failure must not break appointment workflows.

### Success

``` text
LLM response
 ↓
validate
 ↓
save
 ↓
aiStatus = COMPLETED
```

### Failure

``` text
LLM failure
 ↓
log error
 ↓
aiStatus = FAILED
 ↓
store no unsafe/incomplete AI document
 ↓
appointment continues
```

UI should display:

> AI summary is temporarily unavailable. The appointment workflow can
> continue normally.

Optional retry can be triggered asynchronously.

------------------------------------------------------------------------

## 16. API Contract

### Authentication

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Doctors

``` text
GET   /api/doctors
GET   /api/doctors/:id
POST  /api/admin/doctors
PATCH /api/admin/doctors/:id
```

### Availability

``` text
GET /api/doctors/:id/availability?date=YYYY-MM-DD
```

### Appointments

``` text
POST  /api/appointments/hold
POST  /api/appointments/confirm
GET   /api/appointments
GET   /api/appointments/:id
PATCH /api/appointments/:id/reschedule
PATCH /api/appointments/:id/cancel
```

### AI

``` text
POST /api/ai/pre-visit
POST /api/ai/post-visit
```

### Visits

``` text
POST /api/visits
GET  /api/doctor/appointments
```

### Leave

``` text
POST /api/admin/doctors/:id/leave
GET  /api/admin/conflicts
```

------------------------------------------------------------------------

## 17. Google Calendar Integration

Use Google Calendar API with OAuth 2.0.

### On confirmed booking

``` text
Appointment CONFIRMED
        ↓
Create Calendar Event
        ↓
Store event ID
```

### On reschedule

``` text
Appointment updated
        ↓
Update Google Calendar event
```

### On cancellation

``` text
Appointment cancelled
        ↓
Delete Google Calendar event
```

Calendar integration failures should not corrupt the appointment state.
Store synchronization status/error information and allow retry.

------------------------------------------------------------------------

## 18. Notification Architecture

Notification types:

``` text
BOOKING_CONFIRMATION
APPOINTMENT_REMINDER
CANCELLATION
RESCHEDULE
DOCTOR_LEAVE_CONFLICT
MEDICATION_REMINDER
```

Notification flow:

``` text
Business event
    ↓
Create Notification
    ↓
Background worker
    ↓
Email provider
    ↓
SUCCESS → SENT
FAILURE → RETRY
```

Store:

``` text
status
retryCount
lastError
scheduledFor
sentAt
```

Retries must be bounded and should not create duplicate successful
notifications.

------------------------------------------------------------------------

## 19. Medication Reminder Architecture

Prescription example:

``` text
Medication:
Paracetamol

Dosage:
500 mg

Frequency:
Twice daily

Duration:
5 days
```

The reminder system should derive reminder times from the stored
prescription frequency and create scheduled reminder jobs.

The appointment/visit record remains the source of prescription
information.

------------------------------------------------------------------------

## 20. UI/UX Direction

### Visual Identity

**CareFlow --- Healthcare, prepared before you arrive.**

Design should feel like a modern health-tech product rather than a
college CRUD application.

### Principles

-   Clean
-   Spacious
-   Professional
-   Calm
-   Accessible
-   Minimal
-   Strong visual hierarchy
-   Clear status indicators
-   Subtle motion
-   Consistent component system

### Core Screens

1.  Landing page
2.  Patient dashboard
3.  Doctor search
4.  Booking flow
5.  Doctor dashboard
6.  AI Visit Brief
7.  Post-visit summary
8.  Admin dashboard
9.  Authentication screens

### Hero Experience

The landing page should communicate:

``` text
Symptoms
   ↓
Doctor
   ↓
AI preparation
   ↓
Appointment
   ↓
Follow-up
```

### Doctor Dashboard Highlight

The main visual centerpiece should be the **AI Visit Brief**.

Example:

``` text
NEXT PATIENT

Rahul Sharma
10:30 AM

AI VISIT BRIEF

Urgency
MEDIUM

Chief Complaint
Persistent fever and headache

Suggested Questions
1. ...
2. ...
3. ...
```

Include a clear disclaimer:

> AI-generated support; not a diagnosis or substitute for clinical
> judgment.

------------------------------------------------------------------------

## 21. Demo Flow

The application should be demoable in approximately 5--7 minutes.

### Step 1 --- Patient

1.  Login.
2.  Search doctor.
3.  Select date.
4.  Select available slot.
5.  Enter symptoms.
6.  View AI-generated pre-visit brief.
7.  Confirm appointment.

### Step 2 --- Doctor

1.  Login as doctor.
2.  View today's appointments.
3.  Open the new appointment.
4.  View AI Visit Brief.
5.  Enter clinical notes and prescription.
6.  Generate patient-friendly summary.

### Step 3 --- Patient

1.  Return to patient dashboard.
2.  View post-visit summary.
3.  View medication schedule.
4.  Show appointment/calendar status.

### Optional Step 4 --- Reliability Demo

Demonstrate:

-   Attempt to book the same slot twice.
-   Show second attempt being rejected.
-   Show doctor leave conflict detection.

These scenarios directly demonstrate the engineering decisions evaluated
by the assignment.

------------------------------------------------------------------------

## 22. Security Requirements

-   Passwords must never be stored in plaintext.
-   JWT must not be stored in localStorage.
-   Use HTTP-only cookies.
-   Use secure cookie settings in production.
-   Validate request bodies.
-   Enforce role-based authorization server-side.
-   Do not trust frontend role checks as security.
-   Do not expose API secrets to frontend code.
-   Do not commit `.env`.
-   Use synthetic patient data for demos.
-   Sanitize/render user-generated content safely.
-   Do not expose clinical data unnecessarily in logs.
-   AI output must not be treated as medical diagnosis.

------------------------------------------------------------------------

## 23. Environment Variables

Create `.env.example` containing placeholders only.

``` text
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

Never commit real credentials.

------------------------------------------------------------------------

## 24. Error Handling

Use a centralized Express error middleware.

API errors should follow a predictable shape:

``` text
{
  success: false,
  error: {
    code: "SLOT_UNAVAILABLE",
    message: "The selected appointment slot is no longer available."
  }
}
```

Important error codes:

``` text
AUTH_REQUIRED
FORBIDDEN
VALIDATION_ERROR
SLOT_UNAVAILABLE
SLOT_HOLD_EXPIRED
DOCTOR_ON_LEAVE
APPOINTMENT_NOT_FOUND
AI_SERVICE_UNAVAILABLE
CALENDAR_SYNC_FAILED
NOTIFICATION_FAILED
```

Frontend should show user-friendly messages while logs contain technical
details.

------------------------------------------------------------------------

## 25. Non-Functional Requirements

### Reliability

A failed AI/email/calendar operation must not unnecessarily fail the
core appointment transaction.

### Maintainability

Keep controllers thin and business logic in services.

### Reusability

Use reusable React components and hooks.

### Security

Use server-side authentication and authorization.

### Consistency

Database state is authoritative for appointments.

### Observability

Log important failures with enough information for debugging without
exposing sensitive patient data.

### Performance

Avoid unnecessary API requests and repeated LLM calls.

------------------------------------------------------------------------

## 26. Definition of Done

The project is considered complete when:

-   [ ] Patient can register and login.
-   [ ] Doctor can login.
-   [ ] Admin can login.
-   [ ] Role-based routes work.
-   [ ] Admin can create/manage doctors.
-   [ ] Doctor working hours can be configured.
-   [ ] Doctor leave can be configured.
-   [ ] Patient can search doctors.
-   [ ] Patient can view available slots.
-   [ ] Patient can submit symptoms.
-   [ ] Slot hold works.
-   [ ] Double-booking is prevented server-side.
-   [ ] Appointment confirmation works.
-   [ ] Appointment cancellation works.
-   [ ] Appointment rescheduling works.
-   [ ] AI pre-visit summary works.
-   [ ] AI output is schema-constrained and validated.
-   [ ] AI failure does not break booking.
-   [ ] Doctor can view AI Visit Brief.
-   [ ] Doctor can submit visit notes.
-   [ ] Doctor can enter prescription.
-   [ ] AI post-visit summary works.
-   [ ] Patient can view the summary.
-   [ ] Medication reminder workflow exists.
-   [ ] Leave conflicts are detected.
-   [ ] Affected patients can be notified.
-   [ ] Email notifications work or have a demonstrable retry/failure
    architecture.
-   [ ] Google Calendar synchronization works or has a tested graceful
    failure path.
-   [ ] Production build succeeds.
-   [ ] Frontend is deployed.
-   [ ] Backend is deployed.
-   [ ] Database is hosted.
-   [ ] `.env.example` exists.
-   [ ] README is complete.
-   [ ] System design write-up is complete.
-   [ ] No secrets are committed.
-   [ ] Demo accounts/data are available.

------------------------------------------------------------------------

## 27. Documentation Deliverables

Repository must contain:

``` text
README.md
SYSTEM_DESIGN.md
PROJECT_SPEC.md
.env.example
```

### README must include

-   Project overview
-   Features
-   Architecture
-   Tech stack
-   Local setup
-   Environment variables
-   API documentation
-   Database schema
-   LLM prompts
-   Google Calendar OAuth setup
-   Deployment instructions
-   Demo credentials
-   Known limitations

### SYSTEM_DESIGN.md must explain

1.  Double-booking prevention.
2.  Slot hold mechanism.
3.  Doctor leave conflict handling.
4.  Notification failure/retry strategy.
5.  LLM failure handling.
6.  Key database design decisions.

Keep the system design write-up within the assignment's 800-word
maximum.

------------------------------------------------------------------------

## 28. AI Development Rules for Antigravity

Antigravity must not redesign the project architecture unless explicitly
instructed.

### Rules

1.  Follow this specification as the source of truth.
2.  Do not create unnecessary files.
3.  Do not introduce additional frameworks without approval.
4.  Keep controllers thin.
5.  Keep business logic in services.
6.  Do not call Axios directly from React components.
7.  Do not store JWTs in localStorage.
8.  Do not expose secrets in frontend code.
9.  Do not persist unvalidated LLM output.
10. Do not allow LLM failure to break appointment workflows.
11. Do not implement frontend-only authorization.
12. Do not replace the database concurrency strategy with frontend
    checks.
13. Reuse existing components where appropriate.
14. Keep P0 functionality ahead of P2 features.
15. After each major feature, run/build/test before continuing.
16. Explain major architectural changes before applying them.

------------------------------------------------------------------------

## 29. Implementation Order

### Phase 1 --- Foundation

``` text
Repository
→ Frontend setup
→ Backend setup
→ MongoDB connection
→ Environment configuration
```

### Phase 2 --- Authentication

``` text
User model
→ JWT
→ HTTP-only cookie
→ Auth middleware
→ Role middleware
→ Logout blacklist + TTL
```

### Phase 3 --- Doctor and Availability

``` text
Doctor model
→ Working hours
→ Leave
→ Slot generation
```

### Phase 4 --- Appointment Engine

``` text
Slot hold
→ Atomic booking
→ Confirmation
→ Cancellation
→ Rescheduling
```

### Phase 5 --- AI

``` text
GenAI configuration
→ response schemas
→ runtime validation
→ pre-visit
→ post-visit
→ failure handling
```

### Phase 6 --- Integrations

``` text
Google Calendar
→ Email
→ Notification retry
→ Medication reminders
```

### Phase 7 --- UI

``` text
Landing
→ Patient
→ Doctor
→ Admin
→ AI experiences
→ Error/loading/empty states
```

### Phase 8 --- Deployment and Documentation

``` text
Production build
→ Deploy
→ Test production flow
→ README
→ SYSTEM_DESIGN.md
→ Demo data
→ Final QA
```

------------------------------------------------------------------------

## 30. Final Engineering Principles

### Principle 1

**The database is the source of truth for appointment availability.**

### Principle 2

**The LLM is an untrusted inference service, not a trusted data
source.**

### Principle 3

**AI enhances the workflow; it must never become a single point of
failure.**

### Principle 4

**Controllers coordinate; services implement business logic.**

### Principle 5

**Frontend authorization improves UX, but backend authorization provides
security.**

### Principle 6

**The project should demonstrate engineering decisions, not merely
feature count.**

### Principle 7

**A smaller reliable system is better than a larger unstable system.**

------------------------------------------------------------------------

## 31. Success Criteria

CareFlow should leave an evaluator with three impressions:

### Product

> This solves a real workflow problem rather than being another CRUD
> appointment application.

### Engineering

> The developer thought carefully about concurrency, security, failure
> handling, architecture and data integrity.

### AI

> AI is integrated as a controlled, structured component of the system
> rather than being used as a superficial chatbot feature.

**Primary objective: build a reliable, polished P0/P1 product first; add
visual and AI polish only after the core workflow is stable.**
