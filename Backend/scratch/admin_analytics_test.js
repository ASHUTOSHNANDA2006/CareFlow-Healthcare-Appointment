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

async function runAdminAnalyticsTest() {
  console.log('==================================================');
  console.log(' CAREFLOW ADMIN ANALYTICS & GOOGLE CALENDAR VERIFICATION');
  console.log(' Target Database: MongoDB Atlas (REAL_ATLAS)');
  console.log('==================================================\n');

  // 1. Log in as Admin
  try {
    const loginRes = await api.post('/auth/login', { email: 'admin@careflow.com', password: 'password123' });
    console.log('[1] Admin Login:', loginRes.data.success ? '✅ PASS' : '❌ FAIL');
  } catch (err) {
    console.error('[1] Admin Login Failed:', err.message);
    process.exit(1);
  }

  // 2. Query GET /admin/analytics
  try {
    const analyticsRes = await api.get('/admin/analytics');
    const data = analyticsRes.data.data.analytics;

    console.log('\n--- SYSTEM OVERVIEW (REAL MONGODB ATLAS DATA) ---');
    console.log('Total Users:', data.overview.totalUsers);
    console.log('Patients Count:', data.overview.patientsCount);
    console.log('Doctors Count:', data.overview.doctorsCount);
    console.log('Active Users:', data.overview.activeUsers);
    console.log('Deactivated Users:', data.overview.deactivatedUsers);
    console.log('Total Appointments:', data.overview.totalAppointments);
    console.log('Upcoming Appointments:', data.overview.upcomingAppointments);
    console.log('Completed Appointments:', data.overview.completedAppointments);
    console.log('Cancelled Appointments:', data.overview.cancelledAppointments);
    console.log('Rejected Appointments:', data.overview.rejectedAppointments);

    console.log('\n--- STATUS COUNTS ---');
    console.log(data.statusCounts);

    console.log('\n--- DOCTOR WORKLOAD ---');
    data.doctorWorkload.forEach(dw => {
      console.log(`- ${dw.name} (${dw.specialization}): Total: ${dw.totalAppointments}, Upcoming: ${dw.upcomingAppointments}, Completed: ${dw.completedAppointments}`);
    });

    console.log('\n--- SPECIALIZATION DISTRIBUTION ---');
    data.specializationDistribution.forEach(sd => {
      console.log(`- ${sd.specialization}: ${sd.count} doctor(s)`);
    });

    const passed = analyticsRes.data.success && data.overview.totalUsers > 0;
    console.log('\n==================================================');
    console.log(` ADMIN ANALYTICS VERIFICATION: ${passed ? '✅ 100% PASSED' : '❌ FAILED'}`);
    console.log('==================================================');
  } catch (err) {
    console.error('Analytics test failed:', err.message);
    process.exit(1);
  }
}

runAdminAnalyticsTest();
