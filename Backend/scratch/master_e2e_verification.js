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
const logTest = (step, name, passed, details = '') => {
  results.push({ step, name, passed, details });
  console.log(`[STEP ${step.toString().padStart(2, '0')}] ${passed ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '— ' + details : ''}`);
};

async function runMasterVerification() {
  console.log('==================================================');
  console.log(' CAREFLOW MASTER FRESH ACCOUNT E2E VERIFICATION');
  console.log('==================================================\n');

  const timeId = Date.now();
  const docEmail = `doctor_master_${timeId}@careflow.com`;
  const patientEmail = `patient_master_${timeId}@careflow.com`;
  const docName = `Dr. Dynamic Specialist ${timeId}`;
  const patientName = `Master Test Patient ${timeId}`;

  // 1. Admin Login
  let adminAuth;
  try {
    const adminRes = await api.post('/auth/login', {
      email: 'admin@careflow.com',
      password: 'password123',
    });
    adminAuth = adminRes.data;
    logTest(1, 'Admin Login', adminAuth.success, `Logged in as Admin: ${adminAuth.data.user.name}`);
  } catch (err) {
    logTest(1, 'Admin Login', false, err.message);
  }

  // 2. Admin Creates Brand New Doctor
  let doctorProfileId;
  try {
    const createDocRes = await api.post('/admin/doctors', {
      name: docName,
      email: docEmail,
      password: 'DoctorPassword123!',
      specialization: 'Neurology',
      qualification: 'MD Neurology',
      experience: 8,
      slotDuration: 30,
      workingHours: { start: '10:00', end: '14:00' },
    });
    doctorProfileId = createDocRes.data.data.doctor.id || createDocRes.data.data.doctor._id;
    logTest(2, 'Admin Create New Doctor', createDocRes.data.success && !!doctorProfileId, `Doctor Profile ID: ${doctorProfileId}`);
  } catch (err) {
    logTest(2, 'Admin Create New Doctor', false, err.response?.data?.error?.message || err.message);
  }

  // 3. New Patient Registration
  clearCookies();
  let patientUserId;
  try {
    const regRes = await api.post('/auth/register', {
      name: patientName,
      email: patientEmail,
      password: 'PatientPassword123!',
      role: 'patient',
    });
    patientUserId = regRes.data.data.user.id;
    logTest(3, 'New Patient Registration', regRes.data.success && regRes.data.data.user.role === 'patient', `Patient User ID: ${patientUserId}`);
  } catch (err) {
    logTest(3, 'New Patient Registration', false, err.message);
  }

  // 4. Patient Finds New Doctor & Dynamic Availability
  const futureDay = Math.floor(Math.random() * 15) + 10;
  const bookingDate = `2026-12-${futureDay.toString().padStart(2, '0')}`;
  let selectedSlot;
  try {
    const availRes = await api.get(`/appointments/doctors/${doctorProfileId}/availability?date=${bookingDate}`);
    const slots = availRes.data.data.slots;
    selectedSlot = slots.find((s) => s.status === 'AVAILABLE') || slots[0];
    logTest(4, 'Dynamic Availability Calculation', availRes.data.success && slots.length === 8, `Slots generated: ${slots.length}. Selected: ${selectedSlot.startTime}–${selectedSlot.endTime}`);
  } catch (err) {
    logTest(4, 'Dynamic Availability Calculation', false, err.message);
  }

  // 5. Patient Holds Slot (SlotHold)
  let slotHoldId;
  try {
    const holdRes = await api.post('/appointments/hold', {
      doctorId: doctorProfileId,
      date: bookingDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    });
    slotHoldId = holdRes.data.data.slotHold?._id || holdRes.data.data.appointment?._id;
    logTest(5, 'SlotHold Creation', holdRes.data.success && !!slotHoldId, `SlotHold ID: ${slotHoldId}`);
  } catch (err) {
    logTest(5, 'SlotHold Creation', false, err.response?.data?.error?.message || err.message);
  }

  // 6. Patient Confirms Appointment (Sending slotHoldId)
  let appointmentId;
  try {
    const confirmRes = await api.post('/appointments/confirm', {
      slotHoldId: slotHoldId,
    });
    appointmentId = confirmRes.data.data.appointment._id;
    logTest(6, 'Appointment Confirmation (slotHoldId -> Appointment)', confirmRes.data.success && !!appointmentId, `Appointment ID: ${appointmentId}`);
  } catch (err) {
    logTest(6, 'Appointment Confirmation', false, err.response?.data?.error?.message || err.message);
  }

  // 7. Patient Submits Symptoms (Triggers Real Gemini 3.6 Flash)
  let symptomReportId;
  let urgencyLevel;
  try {
    const symptomRes = await api.post('/ai/pre-visit', {
      appointmentId: appointmentId,
      symptoms: 'Severe right-sided pulsating migraine with visual aura and nausea for 2 days.',
    });
    symptomReportId = symptomRes.data.data.symptomReport._id;
    urgencyLevel = symptomRes.data.data.symptomReport.aiSummary?.urgency;
    logTest(7, 'Pre-Visit Gemini 3.6 Flash AI Analysis', symptomRes.data.success && !!symptomReportId, `Report ID: ${symptomReportId}, AI Urgency: "${urgencyLevel}"`);
  } catch (err) {
    logTest(7, 'Pre-Visit Gemini 3.6 Flash AI Analysis', false, err.response?.data?.error?.message || err.message);
  }

  // 8. New Doctor Login
  clearCookies();
  try {
    const docLoginRes = await api.post('/auth/login', {
      email: docEmail,
      password: 'DoctorPassword123!',
    });
    logTest(8, 'New Doctor Login', docLoginRes.data.success, `Logged in as Doctor: ${docLoginRes.data.data.user.name}`);
  } catch (err) {
    logTest(8, 'New Doctor Login', false, err.message);
  }

  // 9. Doctor Sees Assigned Patient Appointment & Pre-Visit Brief
  try {
    const docApptDetail = await api.get(`/appointments/${appointmentId}`);
    const app = docApptDetail.data.data.appointment;
    const hasBrief = !!app.symptomReportId?.aiSummary?.chiefComplaint && app.symptomReportId?.aiSummary?.suggestedQuestions?.length > 0;
    logTest(9, 'Doctor Sees Patient & Pre-Visit AI Brief', docApptDetail.data.success && hasBrief, `Chief Complaint: "${app.symptomReportId?.aiSummary?.chiefComplaint}", Questions count: ${app.symptomReportId?.aiSummary?.suggestedQuestions?.length}`);
  } catch (err) {
    logTest(9, 'Doctor Sees Patient & Pre-Visit AI Brief', false, err.message);
  }

  // 10. Doctor Completes Consultation (Clinical Notes, Diagnosis, Prescription, Follow-up)
  try {
    const visitRes = await api.post('/ai/post-visit', {
      appointmentId: appointmentId,
      clinicalNotes: 'Classic migraine with aura diagnosed. Neurological exam intact.',
      diagnosis: 'Migraine with Aura (ICD-10 G43.1)',
      followUp: 'Return if migraine frequency exceeds twice per week.',
      prescription: [
        { name: 'Sumatriptan', dosage: '50mg', frequency: 'Once at onset of headache', duration: 'As needed' },
        { name: 'Ondansetron', dosage: '4mg', frequency: 'Once for nausea', duration: 'As needed' },
      ],
    });

    const note = visitRes.data.data.visitNote;
    const hasPatientSummary = !!note.patientSummary?.summary;
    logTest(10, 'Doctor Finalize Consultation & Gemini Post-Visit Explainer', visitRes.data.success && hasPatientSummary, `Diagnosis saved: "${note.diagnosis}", AI Explainer Length: ${note.patientSummary?.summary?.length}`);
  } catch (err) {
    logTest(10, 'Doctor Finalize Consultation', false, err.response?.data?.error?.message || err.message);
  }

  // 11. Doctor Applies Leave
  const leaveDate = '2026-12-28';
  try {
    const leaveRes = await api.post('/doctors/me/leave', {
      date: leaveDate,
      reason: 'Neurology World Congress',
    });
    logTest(11, 'Doctor Apply Leave (/api/doctors/me/leave)', leaveRes.data.success, `Leave date: ${leaveDate}`);
  } catch (err) {
    logTest(11, 'Doctor Apply Leave', false, err.response?.data?.error?.message || err.message);
  }

  // 12. Patient Checks Availability for Doctor Leave Date
  clearCookies();
  try {
    const leaveAvail = await api.get(`/appointments/doctors/${doctorProfileId}/availability?date=${leaveDate}`);
    const data = leaveAvail.data.data;
    const blocked = data.available === false && data.reason === 'DOCTOR_ON_LEAVE' && data.slots.length === 0;
    logTest(12, 'Leave Shield Blocks Booking', blocked, `available: ${data.available}, reason: "${data.reason}"`);
  } catch (err) {
    logTest(12, 'Leave Shield Blocks Booking', false, err.message);
  }

  // 13. Patient Logs In & Reconstructs Visit History
  try {
    await api.post('/auth/login', {
      email: patientEmail,
      password: 'PatientPassword123!',
    });
    const historyRes = await api.get(`/appointments/${appointmentId}`);
    const app = historyRes.data.data.appointment;
    const reconstructed = app.status === 'COMPLETED' && app.visitNoteId?.diagnosis === 'Migraine with Aura (ICD-10 G43.1)' && app.visitNoteId?.prescription?.length === 2;
    logTest(13, 'Patient Previous Visit History Reconstruction', historyRes.data.success && reconstructed, `Diagnosis: "${app.visitNoteId?.diagnosis}", Rx: ${app.visitNoteId?.prescription?.length} items`);
  } catch (err) {
    logTest(13, 'Patient Previous Visit History Reconstruction', false, err.message);
  }

  // 14. Patient Notification Feed Retrieval
  try {
    const notifRes = await api.get('/appointments/notifications');
    const notifs = notifRes.data.data.notifications;
    logTest(14, 'Patient Notifications Feed', notifRes.data.success && notifs.length > 0, `Notifications count: ${notifs.length}. Types: ${notifs.map((n) => n.type).join(', ')}`);
  } catch (err) {
    logTest(14, 'Patient Notifications Feed', false, err.message);
  }

  // 15. Admin Deactivates Patient Account
  clearCookies();
  try {
    await api.post('/auth/login', {
      email: 'admin@careflow.com',
      password: 'password123',
    });
    const toggleRes = await api.patch(`/admin/users/${patientUserId}/status`);
    logTest(15, 'Admin Deactivate User Account', toggleRes.data.success && toggleRes.data.data.user.isActive === false, `User ${patientEmail} isActive: ${toggleRes.data.data.user.isActive}`);
  } catch (err) {
    logTest(15, 'Admin Deactivate User Account', false, err.message);
  }

  // 16. Deactivated Patient Login Attempt (Shield Verification)
  clearCookies();
  let loginBlocked = false;
  try {
    await api.post('/auth/login', {
      email: patientEmail,
      password: 'PatientPassword123!',
    });
  } catch (err) {
    loginBlocked = err.response?.status === 403 && err.response?.data?.error?.code === 'ACCOUNT_DEACTIVATED';
  }
  logTest(16, 'Deactivated User Login Shield', loginBlocked, 'Deactivated account correctly blocked with 403 ACCOUNT_DEACTIVATED.');

  // 17. Admin Reactivates Patient Account & Patient Logout Revocation Test
  clearCookies();
  try {
    await api.post('/auth/login', {
      email: 'admin@careflow.com',
      password: 'password123',
    });
    await api.patch(`/admin/users/${patientUserId}/status`);

    clearCookies();
    await api.post('/auth/login', {
      email: patientEmail,
      password: 'PatientPassword123!',
    });
    await api.post('/auth/logout');

    let revokedBlocked = false;
    try {
      await api.get('/auth/me');
    } catch (err) {
      revokedBlocked = err.response?.status === 401;
    }
    logTest(17, 'JWT Blacklist Revocation on Logout', revokedBlocked, 'Revoked token correctly returned 401 REVOKED_TOKEN.');
  } catch (err) {
    logTest(17, 'JWT Blacklist Revocation on Logout', false, err.message);
  }

  console.log('\n==================================================');
  const passed = results.filter((r) => r.passed).length;
  console.log(` MASTER VERIFICATION SUMMARY: ${passed}/${results.length} STEPS PASSED.`);
  console.log('==================================================');
}

runMasterVerification();
