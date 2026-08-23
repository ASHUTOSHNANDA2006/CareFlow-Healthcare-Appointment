import axios from 'axios';
import http from 'http';
import https from 'https';
import { connectDB } from '../src/config/db.js';

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

async function runLifecycleE2E() {
  console.log('==================================================');
  console.log(' CAREFLOW FULL APPOINTMENT LIFECYCLE E2E TEST SUITE');
  console.log(' Target Database: MongoDB Atlas (REAL_ATLAS)');
  console.log(' AI Model: Google GenAI gemini-3.6-flash');
  console.log('==================================================\n');

  await connectDB();

  const timeId = Date.now();
  const docEmail = `doc_life_${timeId}@careflow.com`;
  const docName = `Dr. Lifecycle Specialist ${timeId}`;
  const patAEmail = `patA_life_${timeId}@careflow.com`;
  const patAName = `Patient Alpha ${timeId}`;
  const patBEmail = `patB_life_${timeId}@careflow.com`;
  const patBName = `Patient Beta ${timeId}`;

  // 1. Fresh Patient A Registration
  clearCookies();
  let patAUserId;
  try {
    const regA = await api.post('/auth/register', { name: patAName, email: patAEmail, password: 'Password123!', role: 'patient' });
    patAUserId = regA.data.data.user.id;
    logTest(1, 'Fresh Patient A Registration', regA.data.success && regA.data.data.user.role === 'patient', `User ID: ${patAUserId}`);
  } catch (err) {
    logTest(1, 'Fresh Patient A Registration', false, err.message);
  }

  // 2. Fresh Patient B Registration
  clearCookies();
  let patBUserId;
  try {
    const regB = await api.post('/auth/register', { name: patBName, email: patBEmail, password: 'Password123!', role: 'patient' });
    patBUserId = regB.data.data.user.id;
    logTest(2, 'Fresh Patient B Registration', regB.data.success && regB.data.data.user.role === 'patient', `User ID: ${patBUserId}`);
  } catch (err) {
    logTest(2, 'Fresh Patient B Registration', false, err.message);
  }

  // 3. Admin Login & Create Doctor Profile
  clearCookies();
  let doctorProfileId;
  try {
    await api.post('/auth/login', { email: 'admin@careflow.com', password: 'password123' });
    const createDoc = await api.post('/admin/doctors', {
      name: docName,
      email: docEmail,
      password: 'DoctorPassword123!',
      specialization: 'Cardiology',
      qualification: 'MD Cardiology',
      experience: 12,
      slotDuration: 30,
      workingHours: { start: '10:00', end: '14:00' },
    });
    doctorProfileId = createDoc.data.data.doctor.id || createDoc.data.data.doctor._id;
    logTest(3, 'Admin Create Doctor Profile', createDoc.data.success && !!doctorProfileId, `Doctor Profile ID: ${doctorProfileId}`);
  } catch (err) {
    logTest(3, 'Admin Create Doctor Profile', false, err.message);
  }

  // 4. Patient A Query Availability
  clearCookies();
  await api.post('/auth/login', { email: patAEmail, password: 'Password123!' });
  const testDate1 = '2026-12-20';
  let slot1000;
  try {
    const availRes1 = await api.get(`/appointments/doctors/${doctorProfileId}/availability?date=${testDate1}`);
    slot1000 = availRes1.data.data.slots.find((s) => s.startTime === '10:00');
    logTest(4, 'Patient A Query Dynamic Availability', availRes1.data.success && slot1000.status === 'AVAILABLE', `Date: ${testDate1}, Slot 10:00 status: ${slot1000.status}`);
  } catch (err) {
    logTest(4, 'Patient A Query Dynamic Availability', false, err.message);
  }

  // 5. Patient A Hold Slot & Confirm Appointment
  let appt1Id;
  try {
    const holdRes1 = await api.post('/appointments/hold', { doctorId: doctorProfileId, date: testDate1, startTime: '10:00', endTime: '10:30' });
    const hold1Id = holdRes1.data.data.slotHold._id;
    const confirmRes1 = await api.post('/appointments/confirm', { slotHoldId: hold1Id });
    appt1Id = confirmRes1.data.data.appointment._id;
    logTest(5, 'Patient A Hold Slot & Confirm Appointment', confirmRes1.data.success && !!appt1Id, `Appt 1 ID: ${appt1Id}, Status: ${confirmRes1.data.data.appointment.status}`);
  } catch (err) {
    logTest(5, 'Patient A Hold Slot & Confirm Appointment', false, err.message);
  }

  // 6. Patient A Submit Symptoms (Pre-Visit AI)
  try {
    const sympRes = await api.post('/ai/pre-visit', {
      appointmentId: appt1Id,
      symptoms: 'Chest tightness and shortness of breath during mild exertion.',
    });
    const report = sympRes.data.data.symptomReport;
    const urgency = report.aiSummary?.urgency;
    logTest(6, 'Patient A Gemini Pre-Visit AI Analysis', sympRes.data.success && !!urgency, `Urgency: "${urgency}", Chief Complaint: "${report.aiSummary?.chiefComplaint}"`);
  } catch (err) {
    logTest(6, 'Patient A Gemini Pre-Visit AI Analysis', false, err.message);
  }

  // 7. Doctor Logs In & Views Assigned Appointments
  clearCookies();
  try {
    await api.post('/auth/login', { email: docEmail, password: 'DoctorPassword123!' });
    const docAppts = await api.get('/appointments');
    const foundAppt = docAppts.data.data.appointments.find((a) => a._id === appt1Id);
    logTest(7, 'Doctor View Assigned Appointments', docAppts.data.success && !!foundAppt, `Found Appt 1 for Patient A`);
  } catch (err) {
    logTest(7, 'Doctor View Assigned Appointments', false, err.message);
  }

  // 8. Doctor Rejects Appointment 1
  try {
    const rejectRes = await api.patch(`/appointments/${appt1Id}/status`, { status: 'REJECTED', reason: 'Emergency surgery scheduled' });
    logTest(8, 'Doctor Reject Appointment 1', rejectRes.data.success && rejectRes.data.data.appointment.status === 'REJECTED', `Status updated to REJECTED`);
  } catch (err) {
    logTest(8, 'Doctor Reject Appointment 1', false, err.message);
  }

  // 9. Verify Released Slot 10:00 becomes AVAILABLE again
  clearCookies();
  await api.post('/auth/login', { email: patBEmail, password: 'Password123!' });
  try {
    const availRes2 = await api.get(`/appointments/doctors/${doctorProfileId}/availability?date=${testDate1}`);
    const releasedSlot = availRes2.data.data.slots.find((s) => s.startTime === '10:00');
    logTest(9, 'Slot Released & Re-query Availability', availRes2.data.success && releasedSlot.status === 'AVAILABLE', `Slot 10:00 status: ${releasedSlot.status}`);
  } catch (err) {
    logTest(9, 'Slot Released & Re-query Availability', false, err.message);
  }

  // 10. Patient B Books the Released Slot
  let appt2Id;
  try {
    const holdRes2 = await api.post('/appointments/hold', { doctorId: doctorProfileId, date: testDate1, startTime: '10:00', endTime: '10:30' });
    const hold2Id = holdRes2.data.data.slotHold._id;
    const confirmRes2 = await api.post('/appointments/confirm', { slotHoldId: hold2Id });
    appt2Id = confirmRes2.data.data.appointment._id;
    logTest(10, 'Patient B Books Released Slot', confirmRes2.data.success && !!appt2Id, `Appt 2 ID: ${appt2Id}`);
  } catch (err) {
    logTest(10, 'Patient B Books Released Slot', false, err.message);
  }

  // 11. Patient B Cancels Appointment 2
  try {
    const cancelRes = await api.patch(`/appointments/${appt2Id}/status`, { status: 'CANCELLED' });
    logTest(11, 'Patient B Cancel Appointment 2', cancelRes.data.success && cancelRes.data.data.appointment.status === 'CANCELLED', `Status updated to CANCELLED`);
  } catch (err) {
    logTest(11, 'Patient B Cancel Appointment 2', false, err.message);
  }

  // 12. Patient A Books New Slot for Date 2 (2026-12-22)
  clearCookies();
  await api.post('/auth/login', { email: patAEmail, password: 'Password123!' });
  const testDate2 = '2026-12-22';
  let appt3Id;
  try {
    const holdRes3 = await api.post('/appointments/hold', { doctorId: doctorProfileId, date: testDate2, startTime: '11:00', endTime: '11:30' });
    const hold3Id = holdRes3.data.data.slotHold._id;
    const confirmRes3 = await api.post('/appointments/confirm', { slotHoldId: hold3Id });
    appt3Id = confirmRes3.data.data.appointment._id;
    await api.post('/ai/pre-visit', { appointmentId: appt3Id, symptoms: 'Persistent fatigue and hypertension.' });
    logTest(12, 'Patient A Books Appointment 3 for Date 2', confirmRes3.data.success && !!appt3Id, `Appt 3 ID: ${appt3Id}`);
  } catch (err) {
    logTest(12, 'Patient A Books Appointment 3 for Date 2', false, err.message);
  }

  // 13. Doctor Accept Appointment 3
  clearCookies();
  await api.post('/auth/login', { email: docEmail, password: 'DoctorPassword123!' });
  try {
    const acceptRes = await api.patch(`/appointments/${appt3Id}/status`, { status: 'CONFIRMED' });
    logTest(13, 'Doctor Accept Appointment 3', acceptRes.data.success && acceptRes.data.data.appointment.status === 'CONFIRMED', `Status: CONFIRMED`);
  } catch (err) {
    logTest(13, 'Doctor Accept Appointment 3', false, err.message);
  }

  // 14. Doctor Complete Consultation for Appointment 3 (Post-Visit AI)
  let visitNoteId;
  try {
    const visitRes = await api.post('/ai/post-visit', {
      appointmentId: appt3Id,
      clinicalNotes: 'Mild hypertension diagnosed. Prescribed Amlodipine.',
      diagnosis: 'Essential Hypertension (ICD-10 I10)',
      followUp: 'Follow up in 2 weeks.',
      prescription: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '14 days' }],
    });
    visitNoteId = visitRes.data.data.visitNote._id;
    const patientSummary = visitRes.data.data.visitNote.patientSummary;
    logTest(14, 'Doctor Complete Consultation & Gemini Post-Visit Explainer', visitRes.data.success && !!patientSummary?.summary, `VisitNote ID: ${visitNoteId}, AI Explainer Length: ${patientSummary?.summary?.length}`);
  } catch (err) {
    logTest(14, 'Doctor Complete Consultation', false, err.message);
  }

  // 15. Doctor Edit Consultation Notes (New Requested Capability)
  try {
    const editRes = await api.put(`/ai/post-visit/${visitNoteId}`, {
      clinicalNotes: 'Mild hypertension with stress factor. Prescribed Amlodipine and lifestyle modification.',
      diagnosis: 'Essential Primary Hypertension (ICD-10 I10)',
      prescription: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily in the morning', duration: '14 days' },
      ],
    });
    const updatedNote = editRes.data.data.visitNote;
    logTest(15, 'Doctor Edit Consultation Notes (/api/ai/post-visit/:id)', editRes.data.success && updatedNote.diagnosis.includes('Primary'), `Updated Diagnosis: "${updatedNote.diagnosis}"`);
  } catch (err) {
    logTest(15, 'Doctor Edit Consultation Notes', false, err.message);
  }

  // 16. Patient A Reconstructs Completed Visit & History
  clearCookies();
  await api.post('/auth/login', { email: patAEmail, password: 'Password123!' });
  try {
    const patApptRes = await api.get(`/appointments/${appt3Id}`);
    const apptData = patApptRes.data.data.appointment;
    const hasNote = apptData.visitNoteId?.diagnosis.includes('Primary') && !!apptData.visitNoteId?.patientSummary?.summary;
    logTest(16, 'Patient A Reconstruct History & View Updated Visit Note', patApptRes.data.success && hasNote, `Diagnosis: "${apptData.visitNoteId?.diagnosis}", Rx: ${apptData.visitNoteId?.prescription?.length} items`);
  } catch (err) {
    logTest(16, 'Patient A Reconstruct History', false, err.message);
  }

  // 17. Patient Notification Feed Verification & Mark As Read
  let notifId;
  try {
    const notifRes = await api.get('/appointments/notifications');
    const notifs = notifRes.data.data.notifications;
    notifId = notifs[0]?._id;
    logTest(17, 'Patient Notification Feed Retrieval', notifRes.data.success && notifs.length > 0, `Count: ${notifs.length}. First Notif Type: "${notifs[0]?.type}"`);
  } catch (err) {
    logTest(17, 'Patient Notification Feed Retrieval', false, err.message);
  }

  // 18. Patient Mark Notification as Read
  try {
    const readRes = await api.patch(`/appointments/notifications/${notifId}/read`);
    logTest(18, 'Patient Mark Notification as Read', readRes.data.success && readRes.data.data.notification.isRead === true, `isRead: ${readRes.data.data.notification.isRead}`);
  } catch (err) {
    logTest(18, 'Patient Mark Notification as Read', false, err.message);
  }

  // 19. Security Guard: Patient B attempts to update Patient A's appointment
  clearCookies();
  await api.post('/auth/login', { email: patBEmail, password: 'Password123!' });
  let unauthorizedBlocked = false;
  try {
    await api.patch(`/appointments/${appt3Id}/status`, { status: 'CANCELLED' });
  } catch (err) {
    unauthorizedBlocked = err.response?.status === 403;
  }
  logTest(19, 'Security Guard: Patient B Access Patient A Appointment', unauthorizedBlocked, 'Cross-user modification correctly blocked with 403 FORBIDDEN.');

  // 20. Invalid State Machine Transition Guard: Attempt COMPLETED -> CONFIRMED
  clearCookies();
  await api.post('/auth/login', { email: docEmail, password: 'DoctorPassword123!' });
  let invalidStateBlocked = false;
  try {
    await api.patch(`/appointments/${appt3Id}/status`, { status: 'CONFIRMED' });
  } catch (err) {
    invalidStateBlocked = err.response?.status === 400 && err.response?.data?.error?.code === 'INVALID_STATE_TRANSITION';
  }
  logTest(20, 'State Machine Guard: Block COMPLETED -> CONFIRMED Transition', invalidStateBlocked, 'Invalid transition correctly blocked with 400 INVALID_STATE_TRANSITION.');

  console.log('\n==================================================');
  const passed = results.filter((r) => r.passed).length;
  console.log(` LIFECYCLE SUMMARY: ${passed}/${results.length} STEPS PASSED.`);
  console.log('==================================================');
  process.exit(0);
}

runLifecycleE2E();
