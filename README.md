# CareFlow

> **Healthcare, prepared before you arrive.**

CareFlow is an AI-assisted healthcare appointment coordination platform built with the MERN stack, Google GenAI SDK, Nodemailer, and Google Calendar integrations. It coordinates scheduling, clinical analysis, notifications, and calendar syncs.

---

## 1. Local Setup Instructions

### Backend
1. Go to the `Backend/` directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your local environment variables in `Backend/.env` matching the template format in `.env.example`.
4. Run the development watch script:
   ```bash
   npm run dev
   ```

### Frontend
1. Go to the `Frontend/` directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:5173/`.

---

## 2. API Contract Documentation

### Authentication
* `POST /api/auth/register` — Register a new account.
* `POST /api/auth/login` — Sign in to receive an HTTP-only JWT token.
* `POST /api/auth/logout` — Revoke and blacklist JWT token `jti` in database.
* `GET  /api/auth/me` — Retrieve active profile details.

### Doctor & Admin Portals
* `GET   /api/doctors` — Search doctors by name or specialization.
* `GET   /api/doctors/:id` — Fetch doctor profile properties.
* `POST  /api/admin/doctors` — Create a new doctor user profile (Admin only).
* `PATCH /api/admin/doctors/:id` — Update doctor profile parameters (Admin only).
* `POST  /api/admin/doctors/:doctorId/leave` — Apply doctor leaves and cancel conflicts (Admin only).

### Appointment Scheduling
* `GET   /api/appointments/doctors/:doctorId/availability?date=YYYY-MM-DD` — Retrieve available time slots.
* `POST  /api/appointments/hold` — Place a 5-minute hold lock on a slot.
* `POST  /api/appointments/confirm` — Confirm booking details, triggering calendar syncs and confirmation emails.
* `GET   /api/appointments` — Fetch active appointment list.
* `PATCH /api/appointments/:id/cancel` — Cancel appointment and update calendar event.
* `PATCH /api/appointments/:id/reschedule` — Reschedule appointment slot.

### AI Integration
* `POST /api/ai/pre-visit` — Submit patient symptoms to trigger pre-visit briefs.
* `POST /api/ai/post-visit` — Submit doctor notes and prescription details to trigger patient-friendly AI summary.

---

## 3. Database Schema Layout

* **User**: `name`, `email`, `passwordHash`, `role` (`patient`, `doctor`, `admin`).
* **Doctor**: `userId` (ref User), `specialization`, `qualification`, `experience`, `slotDuration`, `workingHours` (`start`, `end`).
* **Leave**: `doctorId` (ref Doctor), `date` (normalized Date), `reason`. Index: `{ doctorId: 1, date: 1 }` (unique).
* **Appointment**: `doctorId`, `patientId`, `date`, `startTime`, `endTime`, `status` (`HELD`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`), `holdExpiresAt`, `googleCalendarEventId`, `googleCalendarSyncStatus`. Index: `{ doctorId: 1, date: 1, startTime: 1 }` (unique partial expression excluding Cancelled/Expired).
* **SymptomReport**: `patientId`, `appointmentId`, `symptoms`, `aiStatus` (`PENDING`, `COMPLETED`, `FAILED`), `aiSummary` (`urgency`, `chiefComplaint`, `keySymptoms`, `suggestedQuestions`).
* **VisitNote**: `appointmentId`, `doctorId`, `clinicalNotes`, `prescription` (`name`, `dosage`, `frequency`, `duration`), `aiStatus`, `patientSummary`.
* **Notification**: `recipientId`, `appointmentId`, `type`, `channel`, `status` (`PENDING`, `SENT`, `FAILED`), `retryCount`, `lastError`, `scheduledFor`, `sentAt`, `metadata`.
* **BlacklistedToken**: `jti` (unique index), `userId`, `expiresAt` (TTL index expires in 0).

---

## 4. LLM Prompts & Schemas

### Pre-Visit Brief
* **Prompt**: `Analyze the following patient symptoms and return a structured JSON response. Do not diagnose the patient. Label output clearly matching the response schema. Symptom Text: "<symptoms>"`
* **Schema**: Matches JSON properties:
  * `urgency`: "Low" | "Medium" | "High"
  * `chiefComplaint`: String
  * `keySymptoms`: Array of Strings
  * `suggestedQuestions`: Array of Strings (max 3 items)

### Post-Visit Summary
* **Prompt**: `Translate the following clinical notes and explain the prescriptions in simple, patient-friendly language. Do not invent any new medications or modify the names or dosages of the prescribed medications. Clinical Notes: "<notes>" Prescriptions: <prescription_array>`
* **Schema**: Matches JSON properties:
  * `summary`: String (patient-friendly interpretation)
  * `medications`: Array of Objects matching prescribed items.
  * `followUp`: String
  * `precautions`: Array of Strings

---

## 5. Google Calendar Integration Guide

1. Log in to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Calendar API** for your project.
3. Configure the OAuth consent screen with Web App redirect URIs: `http://localhost:5000/api/auth/google/callback`.
4. Copy the `Client ID` and `Client Secret` credentials.
5. Populate variables `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` inside your environment `.env` settings.
6. The integration service (`googleCalendar.service.js`) will invoke events creation, updates, and cancellations matching confirmed scheduling events automatically.

---

## 6. Credentials for Testing

Use the following seeded accounts for local E2E workflow verification:

* **Patient Account**:
  * Email: `patient@careflow.com`
  * Password: `password123`
* **Doctor Account**:
  * Email: `doctor@careflow.com`
  * Password: `password123`
* **Admin Account**:
  * Email: `admin@careflow.com`
  * Password: `password123`

---

## 7. System Design Architecture Write-Up

### 1. Double-Booking Prevention & Concurrency Handling
CareFlow employs a multi-tiered concurrency strategy to prevent double-booking under high simultaneous user loads:
- **Atomic SlotHold Locks**: When a patient selects a time slot, a transient `SlotHold` document is created in MongoDB with an atomic unique compound index on `{ doctorId, date, startTime }` and a 5-minute TTL expiration.
- **MongoDB Partial Unique Index**: The primary `Appointment` collection enforces a unique partial index on `{ doctorId, date, startTime }` where `status` is in `['PENDING', 'CONFIRMED', 'COMPLETED']`. If two patients simultaneously submit confirmation requests for the exact same slot, MongoDB Atlas rejects the second attempt at the database driver level with duplicate key error code `E11000`. The backend catches `E11000` and gracefully responds with HTTP 409 `SLOT_UNAVAILABLE`.
- **Automatic Slot Release**: When an appointment transitions to `CANCELLED` or `REJECTED`, the partial unique index condition is no longer met for that appointment, instantly unlocking the slot for future bookings without requiring manual DB cleanup.

### 2. Doctor Leave Conflict Management
- **Atomic Leave Application**: When an admin or doctor applies leave for a specific date, a `Leave` document is created with a unique index on `{ doctorId, date }`.
- **Cascading Conflict Resolution**: A dedicated background service (`handleLeaveConflicts`) instantly queries MongoDB for all existing `PENDING` and `CONFIRMED` appointments matching the doctor and leave date.
- **Automatic Cancellation & Notification**: All conflicting appointments are updated to `CANCELLED` status (`reason: "Doctor on leave"`), releasing their calendar slots. The system automatically queues high-priority system alerts and Nodemailer email notifications (`DOCTOR_LEAVE_CONFLICT`) to inform all affected patients.

### 3. Slot Hold Reservation Mechanism
- **Temporary State Locking**: To prevent slot hoarding, slot holds expire after 300 seconds (5 minutes).
- **Time-Aware Availability Filtering**: Slot availability calculation dynamically computes current local time in `Asia/Kolkata` (`APP_TIMEZONE`). Slots in the past relative to the current timestamp are automatically marked unbookable.
- **Background Hold Janitor**: A recurring background task (`releaseExpiredHolds`) polls MongoDB for expired `HELD` slot holds (`expiresAt <= now`) and updates their status to `EXPIRED`, keeping slot availability accurate in real time.

### 4. Notification Pipeline & Failure Resilience
- **Database Persistence & Retry Queuing**: All system notifications and emails are recorded in the `Notification` collection with tracking properties (`status: PENDING | SENT | FAILED`, `retryCount`, `lastError`, `scheduledFor`).
- **Resilient Email Worker**: A background worker process periodically fetches `PENDING` or `FAILED` notifications where `retryCount < 3`. Emails are dispatched via Nodemailer SMTP.
- **Graceful Failure Handling**: Network glitches or rate limits (e.g., SMTP 550 rate limits) record the specific error traceback and increment `retryCount`, scheduling exponential backoff retries without blocking HTTP API execution or causing user request failures.

