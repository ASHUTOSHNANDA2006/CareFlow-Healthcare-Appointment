import axios from 'axios';
import http from 'http';
import https from 'https';
import { getDoctorSlotsForDate, formatTime, parseTime, getNowInTimezone } from '../src/services/appointment/slot.service.js';
import { connectDB } from '../src/config/db.js';
import Leave from '../src/models/Leave.js';
import SlotHold from '../src/models/SlotHold.js';
import Appointment from '../src/models/Appointment.js';

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
const logTest = (num, name, expected, actual, passed, details = '') => {
  results.push({ num, name, expected, actual, passed, details });
  console.log(`[TEST ${num.toString().padStart(2, '0')}] ${passed ? '✅ PASS' : '❌ FAIL'}: ${name} | Expected: ${expected} | Actual: ${actual} ${details ? '— ' + details : ''}`);
};

async function runTimeAwareTests() {
  console.log('==================================================');
  console.log(' TIME-AWARE APPOINTMENT AVAILABILITY TEST SUITE');
  console.log(' Configured Timezone: Asia/Kolkata');
  console.log('==================================================\n');

  await connectDB();

  // Login as admin to get a doctor profile
  await api.post('/auth/login', { email: 'admin@careflow.com', password: 'password123' });
  const docsRes = await api.get('/doctors');
  const doctor = docsRes.data.data.doctors[0];
  const doctorId = doctor._id;

  const { dateStr: todayDateStr, timeStr: currentTimeStr } = getNowInTimezone('Asia/Kolkata');
  console.log(`[System Clock Info] Current Date: ${todayDateStr}, Current Time: ${currentTimeStr} (Asia/Kolkata)`);
  console.log(`[Doctor Info] Name: ${doctor.name}, Working Hours: ${doctor.workingHours.start} – ${doctor.workingHours.end}, Duration: ${doctor.slotDuration} mins\n`);

  // Ensure no conflicting leaves on today's test date
  const todayDateObj = new Date(todayDateStr);
  todayDateObj.setUTCHours(0, 0, 0, 0);
  await Leave.deleteMany({ doctorId, date: todayDateObj });

  // Helper for mock time calculations
  const mockNow = (timeStr) => ({ dateStr: todayDateStr, timeStr });

  // TEST 1: Current time 08:00, Today's 09:00 slot -> Expected: AVAILABLE
  try {
    const slots1 = await getDoctorSlotsForDate(doctorId, todayDateStr, mockNow('08:00'));
    const slot0900 = slots1.find((s) => s.startTime === '09:00');
    const isAvail = slot0900 && slot0900.status === 'AVAILABLE';
    logTest(1, "Current time 08:00, Today 09:00 slot", 'AVAILABLE', isAvail ? 'AVAILABLE' : (slot0900 ? slot0900.status : 'FILTERED_OUT'), isAvail);
  } catch (err) {
    logTest(1, "Current time 08:00, Today 09:00 slot", 'AVAILABLE', err.message, false);
  }

  // TEST 2: Current time 09:01, Today's 09:00 slot -> Expected: NOT AVAILABLE (Filtered out)
  try {
    const slots2 = await getDoctorSlotsForDate(doctorId, todayDateStr, mockNow('09:01'));
    const slot0900 = slots2.find((s) => s.startTime === '09:00');
    const isFiltered = !slot0900;
    logTest(2, "Current time 09:01, Today 09:00 slot", 'NOT AVAILABLE (FILTERED_OUT)', isFiltered ? 'NOT AVAILABLE (FILTERED_OUT)' : 'AVAILABLE', isFiltered);
  } catch (err) {
    logTest(2, "Current time 09:01, Today 09:00 slot", 'NOT AVAILABLE', err.message, false);
  }

  // TEST 3: Current time 09:29, Today's 09:30 slot -> Expected: AVAILABLE
  try {
    const slots3 = await getDoctorSlotsForDate(doctorId, todayDateStr, mockNow('09:29'));
    const slot0930 = slots3.find((s) => s.startTime === '09:30');
    const isAvail = slot0930 && slot0930.status === 'AVAILABLE';
    logTest(3, "Current time 09:29, Today 09:30 slot", 'AVAILABLE', isAvail ? 'AVAILABLE' : (slot0930 ? slot0930.status : 'FILTERED_OUT'), isAvail);
  } catch (err) {
    logTest(3, "Current time 09:29, Today 09:30 slot", 'AVAILABLE', err.message, false);
  }

  // TEST 4: Current time 09:30, Today's 09:30 slot -> Expected: AVAILABLE
  try {
    const slots4 = await getDoctorSlotsForDate(doctorId, todayDateStr, mockNow('09:30'));
    const slot0930 = slots4.find((s) => s.startTime === '09:30');
    const isAvail = slot0930 && slot0930.status === 'AVAILABLE';
    logTest(4, "Current time 09:30, Today 09:30 slot", 'AVAILABLE', isAvail ? 'AVAILABLE' : (slot0930 ? slot0930.status : 'FILTERED_OUT'), isAvail);
  } catch (err) {
    logTest(4, "Current time 09:30, Today 09:30 slot", 'AVAILABLE', err.message, false);
  }

  // TEST 5: Current time 09:31, Today's 09:30 slot -> Expected: NOT AVAILABLE (Filtered out)
  try {
    const slots5 = await getDoctorSlotsForDate(doctorId, todayDateStr, mockNow('09:31'));
    const slot0930 = slots5.find((s) => s.startTime === '09:30');
    const isFiltered = !slot0930;
    logTest(5, "Current time 09:31, Today 09:30 slot", 'NOT AVAILABLE (FILTERED_OUT)', isFiltered ? 'NOT AVAILABLE (FILTERED_OUT)' : 'AVAILABLE', isFiltered);
  } catch (err) {
    logTest(5, "Current time 09:31, Today 09:30 slot", 'NOT AVAILABLE', err.message, false);
  }

  // TEST 6: Yesterday 10:00 slot -> Expected: NOT AVAILABLE (PAST_DATE)
  try {
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const availRes6 = await api.get(`/appointments/doctors/${doctorId}/availability?date=${yesterdayDate}`);
    const isPastDate = availRes6.data.data.available === false && availRes6.data.data.reason === 'PAST_DATE';
    logTest(6, "Yesterday date query", 'available: false, reason: PAST_DATE', `available: ${availRes6.data.data.available}, reason: ${availRes6.data.data.reason}`, isPastDate);
  } catch (err) {
    logTest(6, "Yesterday date query", 'NOT AVAILABLE', err.message, false);
  }

  // TEST 7: Tomorrow 09:00 slot -> Expected: AVAILABLE
  try {
    const futureDate = '2026-12-29';
    // Clear leave on futureDate if exists
    const futureDateObj = new Date(futureDate);
    futureDateObj.setUTCHours(0, 0, 0, 0);
    await Leave.deleteMany({ doctorId, date: futureDateObj });

    const availRes7 = await api.get(`/appointments/doctors/${doctorId}/availability?date=${futureDate}`);
    const slot0900 = availRes7.data.data.slots.find((s) => s.startTime === '09:00');
    const isAvail = slot0900 && slot0900.status === 'AVAILABLE';
    logTest(7, "Tomorrow/Future 09:00 slot query", 'AVAILABLE', isAvail ? 'AVAILABLE' : (slot0900 ? slot0900.status : 'FILTERED_OUT'), isAvail);
  } catch (err) {
    logTest(7, "Tomorrow/Future 09:00 slot query", 'AVAILABLE', err.message, false);
  }

  // TEST 8: Doctor Leave Shield query -> Expected: DOCTOR_ON_LEAVE
  try {
    const leaveDate = '2026-12-25';
    try {
      await api.post(`/admin/doctors/${doctorId}/leave`, { date: leaveDate, reason: 'Holiday leave' });
    } catch { /* already exists */ }
    const leaveRes = await api.get(`/appointments/doctors/${doctorId}/availability?date=${leaveDate}`);
    const isLeave = leaveRes.data.data.available === false && leaveRes.data.data.reason === 'DOCTOR_ON_LEAVE';
    logTest(8, "Doctor Leave Shield query", 'available: false, reason: DOCTOR_ON_LEAVE', `available: ${leaveRes.data.data.available}, reason: ${leaveRes.data.data.reason}`, isLeave);
  } catch (err) {
    logTest(8, "Doctor Leave Shield query", 'DOCTOR_ON_LEAVE', err.message, false);
  }

  // TEST 9: Race Condition: POST /appointments/hold for past slot -> Expected: HTTP 400 PAST_TIME_SLOT
  clearCookies();
  // Register patient
  await api.post('/auth/register', {
    name: 'Time Test Patient',
    email: `timetest_${Date.now()}@careflow.com`,
    password: 'Password123!',
    role: 'patient',
  });

  try {
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    await api.post('/appointments/hold', {
      doctorId,
      date: yesterdayDate,
      startTime: '09:00',
      endTime: '09:30',
    });
    logTest(9, "Race condition: hold past slot", 'HTTP 400 PAST_TIME_SLOT', 'ACCEPTED (200)', false);
  } catch (err) {
    const isRejected = err.response?.status === 400 && err.response?.data?.error?.code === 'PAST_TIME_SLOT';
    logTest(9, "Race condition: hold past slot", 'HTTP 400 PAST_TIME_SLOT', `HTTP ${err.response?.status} ${err.response?.data?.error?.code}`, isRejected);
  }

  // TEST 10: Existing booked slot -> Expected: status: CONFIRMED
  try {
    const testDate = '2026-12-27';
    const testDateObj = new Date(testDate);
    testDateObj.setUTCHours(0, 0, 0, 0);
    await SlotHold.deleteMany({ doctorId, date: testDateObj });
    await Appointment.deleteMany({ doctorId, date: testDateObj });

    const holdRes = await api.post('/appointments/hold', { doctorId, date: testDate, startTime: '10:00', endTime: '10:30' });
    const holdId = holdRes.data.data.slotHold._id;
    await api.post('/appointments/confirm', { slotHoldId: holdId });

    const availRes10 = await api.get(`/appointments/doctors/${doctorId}/availability?date=${testDate}`);
    const slot1000 = availRes10.data.data.slots.find((s) => s.startTime === '10:00');
    const isBooked = slot1000 && slot1000.status === 'CONFIRMED';
    logTest(10, "Existing booked slot query", 'status: CONFIRMED', `status: ${slot1000 ? slot1000.status : 'NOT_FOUND'}`, isBooked);
  } catch (err) {
    logTest(10, "Existing booked slot query", 'CONFIRMED', err.message, false);
  }

  // TEST 11: Active SlotHold -> Expected: status: HELD
  try {
    const testDate = '2026-12-29';
    const testDateObj = new Date(testDate);
    testDateObj.setUTCHours(0, 0, 0, 0);
    await SlotHold.deleteMany({ doctorId, date: testDateObj });
    await Appointment.deleteMany({ doctorId, date: testDateObj });

    await api.post('/appointments/hold', { doctorId, date: testDate, startTime: '11:00', endTime: '11:30' });
    const availRes11 = await api.get(`/appointments/doctors/${doctorId}/availability?date=${testDate}`);
    const slot1100 = availRes11.data.data.slots.find((s) => s.startTime === '11:00');
    const isHeld = slot1100 && slot1100.status === 'HELD';
    logTest(11, "Active SlotHold query", 'status: HELD', `status: ${slot1100 ? slot1100.status : 'NOT_FOUND'}`, isHeld);
  } catch (err) {
    logTest(11, "Active SlotHold query", 'HELD', err.message, false);
  }

  console.log('\n==================================================');
  const passed = results.filter((r) => r.passed).length;
  console.log(` SUMMARY: ${passed}/${results.length} TIME-AWARE TESTS PASSED.`);
  console.log('==================================================');
  process.exit(0);
}

runTimeAwareTests();
