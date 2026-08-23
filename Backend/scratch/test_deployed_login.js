import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Sending login request to Render backend...');
    const res = await axios.post(
      'https://careflow-healthcare-appointment.onrender.com/api/auth/login',
      {
        email: 'patient@careflow.com',
        password: 'password123',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      }
    );
    console.log('Status code:', res.status);
    console.log('Response body:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Network/Connection error:', err.message);
  }
};

testLogin();
