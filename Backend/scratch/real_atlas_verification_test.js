import axios from 'axios';

const runTest = async () => {
  const backendUrl = 'http://localhost:5000/api';
  const timestamp = Date.now();
  const testEmail = `careflow.dbtest.${timestamp}@example.com`;

  console.log(`Registering patient: ${testEmail}`);

  try {
    const res = await axios.post(`${backendUrl}/auth/login`, {}); // dummy
  } catch (err) {}

  try {
    const registerRes = await axios.post(`${backendUrl}/auth/register`, {
      name: 'Atlas Test User',
      email: testEmail,
      password: 'password123'
    });

    console.log('Registration Response:', JSON.stringify(registerRes.data, null, 2));

    const verifyRes = await axios.get(`${backendUrl}/health/database`);
    console.log('Database Status & Counts:', JSON.stringify(verifyRes.data, null, 2));

  } catch (error) {
    console.error('Test execution failed:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  }
};

runTest();
