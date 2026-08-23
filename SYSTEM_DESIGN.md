# CareFlow — System Design

## 1. Overview

CareFlow is an AI-assisted healthcare appointment coordination platform built using the MERN stack. The system separates patient, doctor and admin workflows while connecting appointment scheduling, AI-assisted summaries, notifications and Google Calendar synchronization.

The main architectural objective is reliability: an appointment must remain consistent even when multiple users attempt to book the same slot, a doctor becomes unavailable, or an external service such as an LLM, email provider or calendar API fails.

## 2. Double-Booking Prevention

The frontend displays available slots, but it is not treated as the source of truth. The backend validates working hours and doctor leave and then performs the reservation against MongoDB.

A selected slot can first enter a temporary `HELD` state. The appointment stores a `holdExpiresAt` value. Once the patient confirms, the appointment becomes `CONFIRMED`; if the hold expires, it becomes available again.

The booking operation uses an atomic database-level strategy so simultaneous requests cannot both successfully reserve the same doctor/date/time combination. If another request wins the race, the second request receives a `SLOT_UNAVAILABLE` response and the frontend refreshes availability.

This design prevents relying on client-side checks, which are inherently unsafe under concurrent requests.

## 3. Slot Hold Mechanism

The slot lifecycle is:

```text
AVAILABLE → HELD → CONFIRMED
                 ↘
                  EXPIRED → AVAILABLE
```

When a patient selects a slot, the backend creates a temporary hold with an expiration timestamp. This prevents another booking flow from taking the slot while the first patient completes the confirmation step.

Expired holds are not treated as confirmed appointments. The system can release them through an expiry/background-job process or by checking the expiration during subsequent availability operations.

## 4. Doctor Leave Conflict Handling

Doctor leave is stored separately and checked whenever availability is generated or a booking is attempted.

When an administrator adds leave for a date, the system searches for existing appointments for that doctor and date. Existing appointments are not silently deleted. Instead, the affected appointments are identified as conflicts and the relevant patients are notified.

This creates an explicit conflict-resolution workflow:

```text
Doctor Leave
     ↓
Find Existing Appointments
     ↓
Conflict?
  /       \
No        Yes
 |         |
Done    Notify Patients
```

The same leave validation is applied to new bookings so patients cannot book a doctor on a leave date.

## 5. Notification Reliability

Notifications are modeled as application records rather than being sent directly inside every business operation.

For example, after an appointment is confirmed, the system creates a notification record. A background worker processes pending notifications and sends them through the configured email provider.

Notification records contain status, retry count, scheduled time and the latest error. Failed deliveries can be retried using a bounded retry strategy. This prevents a temporary email-provider failure from causing the appointment transaction itself to fail.

The same principle applies to calendar synchronization: appointment state remains authoritative in MongoDB, while Google Calendar synchronization is treated as an external side effect that can be retried.

## 6. LLM Architecture and Failure Handling

CareFlow uses the `@google/genai` SDK for two controlled AI tasks: generating a pre-visit doctor brief and converting post-visit clinical notes into a patient-friendly summary.

The pipeline is:

```text
Input
 ↓
Validation
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
MongoDB
```

The response schema constrains the shape and allowed fields of the model output. Runtime and business validation are still required because structured output does not guarantee factual correctness.

The LLM is therefore treated as an untrusted inference service rather than a trusted database source.

If the LLM fails, times out or produces invalid output, the system records the AI operation as failed and keeps the appointment workflow operational. The doctor or patient can continue using the core appointment features, while the AI operation can be retried separately.

## 7. Security and Authorization

Authentication uses JWTs stored in HTTP-only cookies rather than browser local storage. Each token contains a unique `jti`. During logout or revocation, the `jti` is stored in a blacklist collection. A MongoDB TTL index automatically removes blacklist records after their expiration time.

Role-based authorization is enforced on the backend for patient, doctor and admin operations. Frontend route protection is used for user experience but is not considered a security boundary.

## 8. Conclusion

CareFlow is intentionally designed around a few high-value engineering principles: MongoDB is the source of truth for appointment availability, booking consistency is enforced server-side, external integrations are isolated from core transactional state, and AI is treated as an assistive inference layer rather than an authoritative clinical source.

This keeps the prototype manageable while directly addressing the assignment's key evaluation areas: double-booking prevention, slot holds, doctor leave conflicts, notification reliability, LLM failure handling, database design and API architecture.
