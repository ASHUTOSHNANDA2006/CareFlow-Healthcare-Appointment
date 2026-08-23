# CareFlow — Stitch Design Specification

**Product:** CareFlow  
**Tagline:** Healthcare, prepared before you arrive.  
**Purpose:** UI/UX source of truth for Google Stitch and later React implementation.

---

## 1. Design Objective

Design CareFlow as a calm, premium, minimal health-tech product.

The interface must feel:

- Calm
- Trustworthy
- Human
- Intelligent
- Simple
- Professional
- Soft and reassuring

CareFlow is an appointment coordination product, not a generic hospital website.

The design should communicate that CareFlow connects:

```text
Symptoms
    ↓
Doctor discovery
    ↓
Safe appointment booking
    ↓
AI pre-visit preparation
    ↓
Consultation
    ↓
AI follow-up
    ↓
Medication reminders
```

### Critical constraint

**Do not add features or screens that are not specified in this document.**

Do not fill empty space with unnecessary cards, statistics or decorative sections.

Whitespace is intentional.

---

# 2. Visual Personality

## Desired feeling

When a user opens CareFlow, the product should feel:

> "This is calm, reliable and thoughtfully designed."

It should NOT feel:

- Like a hospital ERP
- Like a generic SaaS dashboard
- Like an AI-generated template
- Like a medical government portal
- Like a fintech dashboard
- Like a futuristic AI experiment

Avoid visual noise.

Use hierarchy, whitespace and typography instead of excessive colors or cards.

---

# 3. Color System

Use a soft, muted healthcare palette.

### Primary

Muted deep teal / blue-green.

Suggested direction:

```text
Primary: #2F6F6D
```

### Secondary

Soft sage / muted mint.

```text
Secondary: #A8C8BE
```

### Background

Warm off-white.

```text
Background: #F7F8F5
```

### Surface

```text
Surface: #FFFFFF
```

### Primary Text

```text
Text: #263536
```

### Secondary Text

```text
Muted Text: #697776
```

### Success

Soft green.

```text
Success: #6FA889
```

### Warning

Soft amber.

```text
Warning: #D6A85C
```

### Error

Muted coral.

```text
Error: #C97872
```

### Rules

- Do not use neon colors.
- Do not use saturated hospital blue.
- Do not use purple AI gradients.
- Do not use dark-mode-first styling.
- Do not use excessive gradients.
- Use color primarily for hierarchy and status.
- Maintain accessible contrast.

---

# 4. Typography

Use a modern, highly readable sans-serif font.

Recommended visual direction:

```text
Headings:
Strong, elegant, medium/bold weight

Body:
Comfortable regular weight

Labels:
Small, medium weight

Numbers:
Medium/bold
```

Avoid extremely large marketing typography.

The largest heading should create a strong hierarchy without dominating the entire screen.

Use typography rather than decorative elements to create structure.

---

# 5. Spacing

Use generous whitespace.

Suggested spacing scale:

```text
4px
8px
12px
16px
24px
32px
48px
64px
80px
```

Major sections should have breathing room.

Do not compress dashboards with too many cards.

---

# 6. Border Radius

Use a consistent radius system.

```text
Small controls: 8px
Cards: 14px
Large surfaces: 18px
Buttons: 10px
```

Avoid extremely rounded pill-shaped cards everywhere.

Pills should primarily be used for:

- Status
- Tags
- Urgency indicators
- Small metadata

---

# 7. Shadows and Borders

Prefer borders and whitespace over shadows.

Use:

```text
1px subtle neutral border
```

for most cards.

Use soft shadows only for:

- Modal
- Floating menu
- Important elevated surface
- Selected booking panel

Avoid heavy shadows.

---

# 8. Application Shell

Authenticated pages use one consistent application shell.

## Desktop

```text
┌──────────────┬──────────────────────────────────────┐
│              │ Header                               │
│   Sidebar    ├──────────────────────────────────────┤
│              │                                      │
│              │ Main Content                         │
│              │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

Sidebar:

- CareFlow logo
- Role-specific navigation
- Minimal icons
- Active state
- Logout

Header:

- Page title
- Optional contextual information
- Notification indicator
- User profile/menu

Do not create multiple navigation bars.

## Mobile

Use:

- Compact top header
- Menu button
- Slide-out navigation

The application shell must remain visually consistent.

---

# 9. Navigation

## Patient

```text
Dashboard
Find Doctor
Appointments
Visit Summaries
Medications
```

## Doctor

```text
Dashboard
Appointments
Patients
Availability
```

## Admin

```text
Dashboard
Doctors
Leave & Conflicts
```

Do not add:

- Blog
- Community
- Chat
- Payments
- Analytics
- Marketplace
- Hospital directory
- Insurance

---

# 10. Landing Page

The landing page must be minimal.

## Hero

Display:

```text
CARE
FLOW

Healthcare,
prepared before you arrive.
```

Supporting text:

```text
From symptoms and scheduling to doctor
preparation and follow-up, CareFlow keeps
every appointment connected.
```

Primary CTA:

```text
Book an appointment
```

Secondary CTA:

```text
See how it works
```

## Hero visual

Use a subtle product UI preview rather than a generic doctor/hospital stock image.

The visual should show a simplified appointment journey:

```text
Symptoms
   ↓
Doctor
   ↓
AI Visit Brief
   ↓
Appointment
   ↓
Follow-up
```

Do not use:

- Giant medical illustrations
- Floating medical icons everywhere
- Human stock photography
- Excessive gradients
- Animated particles

## Below Hero

Only include:

### How CareFlow works

Five steps:

```text
01 Tell us how you feel
02 Find the right doctor
03 Prepare your doctor with AI
04 Attend your appointment
05 Understand your follow-up
```

### Patient experience

Brief visual explanation.

### Doctor experience

Brief visual explanation.

### AI-assisted workflow

Brief explanation of the AI Visit Brief and patient summary.

### Final CTA

```text
Ready for a better appointment experience?

Book an appointment
```

No pricing, testimonials, FAQ, blog or statistics.

---

# 11. Authentication

Create:

- Login
- Register

## Login

Fields:

```text
Email
Password
```

Primary button:

```text
Sign in
```

## Register

Fields:

```text
Name
Email
Password
Role
```

Primary button:

```text
Create account
```

Design should be centered and minimal.

Include:

- Clear validation
- Inline errors
- Loading state
- Password visibility toggle

Do not add social login unless explicitly implemented.

---

# 12. Patient Dashboard

This is a primary screen.

## Header

```text
Good morning, [Name]
```

Subtext:

```text
Here's what's happening with your care.
```

## Next Appointment

Large but restrained card:

```text
NEXT APPOINTMENT

Dr. Priya Sharma
General Medicine

Today
10:30 AM

CONFIRMED

[View appointment]
```

## AI Visit Preparation

If symptoms have been submitted:

```text
AI VISIT PREPARATION

Your visit brief is ready.

Urgency
MEDIUM

[View AI brief]
```

If AI is processing:

```text
Preparing your visit brief...
```

If AI fails:

```text
AI summary is temporarily unavailable.
Your appointment can continue normally.
```

## Upcoming Appointments

Simple list.

Each row:

```text
Date
Time
Doctor
Status
Action
```

## Recent Visit

Show:

```text
Doctor
Date
Summary available
[View summary]
```

## Medication Reminders

Show only relevant active medications.

Do not add charts.

Do not add fake analytics.

---

# 13. Doctor Search

Title:

```text
Find the right doctor
```

Search field:

```text
Search by doctor or specialization
```

Filter:

```text
Specialization
```

Doctor card:

```text
Doctor Name
Specialization
Qualification
Experience

Next available:
10:30 AM

[View profile]
```

Cards should be compact and easy to scan.

Do not show excessive medical information.

---

# 14. Doctor Profile

Display:

```text
Doctor Name
Specialization
Qualification
Experience
```

Working hours.

Available date selector.

Available slots.

Slot states:

```text
AVAILABLE
HELD
UNAVAILABLE
```

Available:

Normal surface + primary accent.

Held:

Soft amber.

Unavailable:

Muted gray.

Primary action:

```text
Book appointment
```

---

# 15. Booking Flow

Use a focused step-based experience.

```text
01 Date
02 Time
03 Symptoms
04 Review
05 Confirm
```

Show progress at the top.

## Step 1

Select date.

## Step 2

Select time.

Display available slots in a clean grid.

## Step 3

Symptoms

Large textarea:

```text
Tell us what you're experiencing...
```

Add subtle explanatory text:

```text
This helps your doctor prepare before the appointment.
```

## Step 4

Review:

```text
Doctor
Date
Time
Symptoms
```

## Step 5

Confirmation.

Do not add payment.

Do not add unnecessary onboarding.

---

# 16. Slot Hold UI

When a slot is temporarily reserved:

```text
Slot temporarily reserved

You have 04:32 remaining
```

Use a subtle countdown.

Do not make it alarming.

If the hold expires:

```text
Your reservation expired.
Please select another available slot.
```

---

# 17. AI Visit Brief

This is a signature CareFlow design element.

It should feel premium but restrained.

## Card

```text
AI VISIT BRIEF

Patient
Rahul Sharma

Urgency
MEDIUM

Chief complaint
Persistent fever and headache

Key symptoms
Fever
Headache
Fatigue

Suggested questions

01  How long has the fever persisted?
02  What was the highest recorded temperature?
03  Have you taken any medication?
```

Bottom label:

```text
AI-generated support · Not a diagnosis
```

Urgency styling:

```text
LOW     → soft green
MEDIUM  → soft amber
HIGH    → muted coral
```

Do not use:

- Robot icons
- Glowing AI borders
- Purple gradients
- "Magic" animations
- Futuristic HUD design

The intelligence should come from the information structure.

---

# 18. Doctor Dashboard

This is the second signature screen.

Header:

```text
Good morning, Dr. Sharma
```

Show a compact overview:

```text
TODAY

8 appointments
5 confirmed
2 awaiting
1 high urgency
```

Do not use charts.

## Next Patient

Large focus card:

```text
NEXT PATIENT

Rahul Sharma
10:30 AM

AI VISIT BRIEF
MEDIUM

Persistent fever and headache

[Open appointment]
```

## Today's Appointments

List:

```text
Time
Patient
AI brief
Status
Action
```

The next patient should receive the strongest visual emphasis.

---

# 19. Doctor Visit Screen

Doctor view should contain:

## Patient information

Name, appointment time.

## Symptoms

Patient-submitted symptoms.

## AI Visit Brief

Show structured AI information.

## Clinical Notes

Large text area.

## Prescription

Repeating medication fields:

```text
Medication
Dosage
Frequency
Duration
```

## Follow-up

Text input.

Primary action:

```text
Complete visit
```

Secondary action:

```text
Generate patient summary
```

Keep clinical information clearly separated.

---

# 20. Patient Post-Visit Summary

Title:

```text
Your visit summary
```

Use simple language.

Sections:

### What we discussed

Short summary.

### Your medications

Medication cards:

```text
PARACETAMOL

500 mg
Twice daily
5 days

Next reminder
8:00 PM
```

### Follow-up

```text
Return after 7 days
```

### Next steps

Simple bullet list.

Footer:

```text
AI-assisted summary based on your doctor's notes.
Please follow your doctor's instructions.
```

Do not make this look like an official diagnosis document.

---

# 21. Medications

Simple active medication list.

Each medication:

```text
Name
Dosage
Frequency
Duration
Next reminder
```

Optional completion state:

```text
Taken
Upcoming
Missed
```

Do not create pharmacy functionality.

---

# 22. Appointment Details

Display:

```text
Doctor
Patient
Date
Time
Status
Symptoms
AI Visit Brief
Calendar status
```

Actions:

```text
Reschedule
Cancel
```

Use a confirmation modal for cancellation.

---

# 23. Admin Dashboard

Keep it operational.

Top-level information:

```text
Doctors
Today's appointments
Upcoming conflicts
```

Doctor management table:

```text
Doctor
Specialization
Working hours
Slot duration
Status
Actions
```

Actions:

```text
Edit
Manage leave
```

No complex analytics.

---

# 24. Leave & Conflicts

Admin selects:

```text
Doctor
Leave date
Reason
```

If there are no appointments:

```text
Leave added successfully.
No appointments are affected.
```

If conflicts exist:

```text
LEAVE CONFLICT

3 appointments are affected.

Rahul Sharma — 10:30 AM
Priya Mehta — 11:00 AM
Aman Verma — 12:00 PM

[Notify affected patients]
```

Use soft warning colors.

Do not use aggressive red unless an action is destructive.

---

# 25. Notifications

Use a compact notification panel.

Notification examples:

```text
Appointment confirmed
Your appointment with Dr. Sharma is confirmed.

AI summary ready
Your visit summary is now available.

Doctor unavailable
Your appointment needs to be rescheduled.

Medication reminder
Time to take your medication.
```

Use subtle icons and timestamps.

Do not make it resemble a social-media notification feed.

---

# 26. Loading States

Use skeleton loaders.

Examples:

```text
Doctor card skeleton
Appointment skeleton
AI brief skeleton
Dashboard skeleton
```

AI processing:

```text
Preparing your visit brief...
```

Use a subtle animated indicator.

No flashy AI animation.

---

# 27. Error States

## Slot conflict

```text
This slot was just booked by another patient.
Please choose another time.
```

Primary action:

```text
View available slots
```

## AI failure

```text
AI summary is temporarily unavailable.
Your appointment can continue normally.
```

## Calendar failure

```text
Appointment confirmed, but calendar synchronization
needs to be retried.
```

## Network failure

```text
We couldn't connect right now.
Please try again.
```

---

# 28. Empty States

Keep empty states short.

## No appointments

```text
No upcoming appointments.

[Find a doctor]
```

## No medications

```text
No active medications.
```

## No conflicts

```text
No upcoming leave conflicts.
```

Do not add decorative illustrations just to fill space.

---

# 29. Responsive Design

Design all screens for:

- Desktop
- Tablet
- Mobile

## Desktop

Sidebar navigation.

## Tablet

Compact sidebar.

## Mobile

Top navigation/menu.

Cards stack vertically.

Tables become responsive cards/lists.

Booking flow should remain easy to use with one hand.

Do not simply shrink desktop layouts.

---

# 30. Accessibility

Ensure:

- Good color contrast
- Visible keyboard focus
- Semantic headings
- Proper labels
- Accessible form errors
- Large enough touch targets
- Status is not communicated by color alone
- Interactive elements have clear hover/focus states

---

# 31. Motion

Use subtle motion only.

Allowed:

- Button hover
- Card hover
- Page transitions
- Modal transitions
- Slot selection
- Skeleton animation
- Toast entrance/exit

Avoid:

- Parallax
- Particle backgrounds
- Large animated gradients
- Excessive bouncing
- Rotating 3D objects
- AI glow effects

The product should feel calm.

---

# 32. Component Reusability

Design reusable components for:

```text
Button
Input
Select
Modal
Toast
StatusBadge
DoctorCard
AppointmentCard
AISummaryCard
MedicationCard
EmptyState
LoadingSkeleton
PageHeader
Sidebar
TopBar
```

Do not create slightly different versions of the same component for every page.

---

# 33. Design Tokens

Use these as the visual foundation:

```text
Background: #F7F8F5
Surface: #FFFFFF
Primary: #2F6F6D
Secondary: #A8C8BE
Text: #263536
Muted: #697776
Success: #6FA889
Warning: #D6A85C
Error: #C97872

Radius:
8 / 10 / 14 / 18

Spacing:
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80
```

These values are a starting design system, not rigid requirements. Maintain visual consistency.

---

# 34. Design Priorities

When there is a conflict between visual decoration and usability:

```text
Usability
    >
Clarity
    >
Consistency
    >
Accessibility
    >
Decoration
```

When there is a conflict between adding another UI feature and preserving whitespace:

**Preserve whitespace.**

When there is a conflict between animation and performance:

**Choose performance.**

---

# 35. Screens to Design

Google Stitch should produce a coherent design system covering these screens:

### Public

1. Landing
2. Login
3. Register

### Patient

4. Patient Dashboard
5. Doctor Search
6. Doctor Profile
7. Booking Flow
8. Appointment Details
9. AI Visit Brief
10. Visit Summary
11. Medications

### Doctor

12. Doctor Dashboard
13. Appointment Details / Visit
14. Patient Detail
15. Availability

### Admin

16. Admin Dashboard
17. Doctor Management
18. Leave & Conflicts

### Shared

19. Notifications
20. Loading / Error / Empty states

Do not create additional screens unless required to support one of these workflows.

---

# 36. Final Visual Goal

The final product should look like a real health-tech startup product that could plausibly be launched.

The strongest visual moments should be:

1. Landing page
2. Patient booking flow
3. Doctor dashboard
4. AI Visit Brief
5. Patient post-visit summary

Everything else should remain intentionally restrained.

The final emotional impression should be:

> **"This product feels calm, trustworthy and intelligently designed."**

---

# 37. Implementation Handoff

This document is the UI/UX source of truth.

Google Stitch should focus on:

- Layout
- Visual hierarchy
- Design system
- Components
- Responsive behavior
- Interaction states

The implementation agent must preserve this visual language when implementing the React application.

Do not introduce:

- New product features
- New navigation sections
- New colors
- New visual styles
- Unnecessary dashboards
- Unnecessary cards
- Unnecessary animations

The application architecture, backend behavior, API contracts, database design and AI implementation are defined separately in `PROJECT_SPEC.md`.
