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
