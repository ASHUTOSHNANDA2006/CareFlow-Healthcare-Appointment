import axios from 'axios';
import http from 'http';
import https from 'https';

const jar = {};
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  httpAgent: new http.Agent(),
  httpsAgent: new https.Agent(),
});

api.interceptors.response.use((res) => {
  const sc = res.headers['set-cookie'];
  if (sc) {
    sc.forEach((c) => {
      const [kv] = c.split(';');
      const [k, v] = kv.split('=');
      jar[k.trim()] = v;
    });
  }
  return res;
});

api.interceptors.request.use((cfg) => {
  const c = Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  if (c) cfg.headers['Cookie'] = c;
  return cfg;
});

const clearCookies = () => {
  Object.keys(jar).forEach((k) => delete jar[k]);
};

const results = [];
const logTest = (name, passed, details = '') => {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '— ' + details : ''}`);
};

async function runPhase3Audit() {
  console.log('=== CAREFLOW PHASE 3 REAL WORKFLOW E2E VERIFICATION ===\n');

  // 1. Fresh Patient Registration
  const timeId = Date.now();
  const patientEmail = `patient_phase3_${timeId}@careflow.com`;
  const patientName = `Phase3 Test Patient ${timeId}`;

  let patientAuth;
  try {
    const regRes = await api.post('/auth/register', {
      name: patientName,
      email: patientEmail,
      password: 'Password123!',
      role: 'patient',
    });
    patientAuth = regRes.data;
    logTest('Patient Registration', patientAuth.success && patientAuth.data.user.role === 'patient', `ID: ${patientAuth.data.user.id}`);
  } catch (err) {
    logTest('Patient Registration', false, err.response?.data?.error?.message || err.message);
  }

  // 2. Fetch Doctors Directory & Pick Doctor
  let doctorId;
  try {
    const docsRes = await api.get('/doctors');
    const docs = docsRes.data.data.doctors;
    if (docs.length > 0) {
      doctorId = docs[0]._id;
      logTest('Fetch Doctors Directory', true, `Found ${docs.length} doctor(s). Selected: ${docs[0].userId.name} (${doctorId})`);
    } else {
      logTest('Fetch Doctors Directory', false, 'No doctors found in database.');
    }
  } catch (err) {
    logTest('Fetch Doctors Directory', false, err.message);
  }

  // 3. Dynamic Availability Retrieval
  const testDate = '2026-11-15'; // Future date
  let selectedSlot;
  try {
    const availRes = await api.get(`/appointments/doctors/${doctorId}/availability?date=${testDate}`);
    const data = availRes.data.data;
    if (data.slots && data.slots.length > 0) {
      selectedSlot = data.slots.find((s) => s.status === 'AVAILABLE') || data.slots[0];
      logTest('Dynamic Availability Check', availRes.data.success && data.available !== false, `Slots generated: ${data.slots.length}. Selected: ${selectedSlot.startTime}`);
    } else {
      logTest('Dynamic Availability Check', false, 'No slots returned.');
    }
  } catch (err) {
    logTest('Dynamic Availability Check', false, err.message);
  }

  // 4. Hold Slot Reservation
  let slotHoldId;
  try {
    const holdRes = await api.post('/appointments/hold', {
      doctorId,
      date: testDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    });
    slotHoldId = holdRes.data.data.slotHold?._id || holdRes.data.data.appointment?._id;
    logTest('SlotHold Creation', holdRes.data.success && !!slotHoldId, `SlotHold ID: ${slotHoldId}`);
  } catch (err) {
    logTest('SlotHold Creation', false, err.response?.data?.error?.message || err.message);
  }

  // 5. Confirm Appointment
  let appointmentId;
  try {
    const confirmRes = await api.post('/appointments/confirm', {
      slotHoldId: slotHoldId,
    });
    appointmentId = confirmRes.data.data.appointment._id;
    logTest('Appointment Confirmation (SlotHold -> Appointment)', confirmRes.data.success && !!appointmentId, `Appointment ID: ${appointmentId}, Status: ${confirmRes.data.data.appointment.status}`);
  } catch (err) {
    logTest('Appointment Confirmation', false, err.response?.data?.error?.message || err.message);
  }

  // 6. Submit Symptoms AI Pipeline
  try {
    const symptomRes = await api.post('/ai/pre-visit', {
      appointmentId: appointmentId,
      symptoms: 'High fever 102F, severe sore throat, body pain for 3 days.',
    });
    logTest('Submit Pre-Visit Symptoms', symptomRes.data.success, `SymptomReport ID: ${symptomRes.data.data.symptomReport._id}`);
  } catch (err) {
    logTest('Submit Pre-Visit Symptoms', false, err.response?.data?.error?.message || err.message);
  }

  // 7. Doctor Login & Operational Workflow
  clearCookies();
  let doctorApp;
  try {
    await api.post('/auth/login', {
      email: 'doctor@careflow.com',
      password: 'password123',
    });

    const docApptsRes = await api.get('/appointments');
    doctorApp = docApptsRes.data.data.appointments.find((a) => a._id === appointmentId);
    logTest('Doctor Sees Patient Appointment', !!doctorApp, `Found appointment ${appointmentId} in doctor dashboard.`);
  } catch (err) {
    logTest('Doctor Sees Patient Appointment', false, err.message);
  }

  // 8. Doctor Submits Consultation Notes (Clinical Notes, Diagnosis, Prescription, Follow-up)
  try {
    const visitRes = await api.post('/ai/post-visit', {
      appointmentId: appointmentId,
      clinicalNotes: 'Pharyngeal erythema observed. Tonsillar hypertrophy grade II.',
      diagnosis: 'Acute Streptococcal Pharyngitis',
      followUp: 'Return in 5 days if throat pain does not resolve.',
      prescription: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days' },
        { name: 'Paracetamol', dosage: '650mg', frequency: 'Twice daily as needed', duration: '3 days' },
      ],
    });

    const visitNote = visitRes.data.data.visitNote;
    const hasDiagnosis = visitNote.diagnosis === 'Acute Streptococcal Pharyngitis';
    const hasFollowUp = visitNote.followUp === 'Return in 5 days if throat pain does not resolve.';
    const rxCount = visitNote.prescription?.length === 2;

    logTest('Doctor Consultation Submission & Field Persistence', visitRes.data.success && hasDiagnosis && hasFollowUp && rxCount, `Diagnosis: "${visitNote.diagnosis}", Prescription items: ${visitNote.prescription?.length}`);
  } catch (err) {
    logTest('Doctor Consultation Submission', false, err.response?.data?.error?.message || err.message);
  }

  // 9. Doctor Leave Management & Availability Blocking
  const dayOffset = Math.floor(Math.random() * 20) + 1;
  const leaveTestDate = `2026-12-${dayOffset.toString().padStart(2, '0')}`;
  try {
    const leaveRes = await api.post('/doctors/me/leave', {
      date: leaveTestDate,
      reason: 'Medical Conference in Mumbai',
    });
    logTest('Doctor Apply Leave (/api/doctors/me/leave)', leaveRes.data.success, `Leave created for ${leaveTestDate}`);
  } catch (err) {
    logTest('Doctor Apply Leave', false, err.response?.data?.error?.message || err.message);
  }

  // 10. Patient Checks Availability for Leave Date
  clearCookies();
  try {
    const leaveAvailRes = await api.get(`/appointments/doctors/${doctorId}/availability?date=${leaveTestDate}`);
    const data = leaveAvailRes.data.data;
    const isBlocked = data.available === false && data.reason === 'DOCTOR_ON_LEAVE' && data.slots.length === 0;
    logTest('Leave Blocks Patient Availability Check', isBlocked, `available: ${data.available}, reason: "${data.reason}", slots: ${data.slots.length}`);
  } catch (err) {
    logTest('Leave Blocks Patient Availability Check', false, err.message);
  }

  // 11. Verify Patient Previous Visits & Reconstructed History
  try {
    await api.post('/auth/login', {
      email: patientEmail,
      password: 'Password123!',
    });

    const historyRes = await api.get(`/appointments/${appointmentId}`);
    const app = historyRes.data.data.appointment;
    const hasHistory = app.status === 'COMPLETED' && !!app.visitNoteId?.diagnosis && !!app.visitNoteId?.prescription;
    logTest('Patient Previous Visits Reconstruction', historyRes.data.success && hasHistory, `Status: ${app.status}, Diagnosis: "${app.visitNoteId?.diagnosis}", Rx: ${app.visitNoteId?.prescription?.length} items`);
  } catch (err) {
    logTest('Patient Previous Visits Reconstruction', false, err.message);
  }

  // 12. Notifications Persistence & Retrieval
  try {
    const notifRes = await api.get('/appointments/notifications');
    const notifs = notifRes.data.data.notifications;
    logTest('Patient Notifications Retrieval', notifRes.data.success && notifs.length > 0, `Received ${notifs.length} notification(s). Latest: ${notifs[0]?.type}`);
  } catch (err) {
    logTest('Patient Notifications Retrieval', false, err.message);
  }

  // 13. JWT Token Blacklist on Logout
  try {
    await api.post('/auth/logout');
    // Try using the logged out session
    let rejected = false;
    try {
      await api.get('/auth/me');
    } catch (authErr) {
      rejected = authErr.response?.status === 401;
    }
    logTest('JWT Blacklist Revocation on Logout', rejected, 'Revoked token correctly returned 401 Unauthorized.');
  } catch (err) {
    logTest('JWT Blacklist Revocation on Logout', false, err.message);
  }

  console.log('\n==================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`SUMMARY: ${passedCount}/${results.length} TESTS PASSED.`);
  console.log('==================================================');
}

runPhase3Audit();
