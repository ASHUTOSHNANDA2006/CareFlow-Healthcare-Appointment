import axios from 'axios';
import User from '../src/models/User.js';
import BlacklistedToken from '../src/models/BlacklistedToken.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const test = async () => {
  await connectDB();
  
  // Clear any existing test data
  await User.deleteMany({ email: 'test_auth@careflow.com' });
  await BlacklistedToken.deleteMany({});

  const backendUrl = 'http://localhost:5000/api/auth';
  const cookieJar = {
    cookies: '',
    setCookie(headers) {
      const setCookieHeader = headers['set-cookie'];
      if (setCookieHeader) {
        this.cookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');
      }
    },
    getHeaders() {
      return this.cookies ? { Cookie: this.cookies } : {};
    }
  };

  try {
    console.log('\n--- 1. Testing Registration ---');
    const regRes = await axios.post(`${backendUrl}/register`, {
      name: 'Test Auth User',
      email: 'test_auth@careflow.com',
      password: 'password123',
      role: 'patient'
    });
    console.log('Registration Status:', regRes.status);
    console.log('Registration Data:', regRes.data);
    cookieJar.setCookie(regRes.headers);

    console.log('\n--- 2. Testing Me Endpoint (Authenticated) ---');
    const meRes = await axios.get(`${backendUrl}/me`, {
      headers: cookieJar.getHeaders()
    });
    console.log('Me Status:', meRes.status);
    console.log('Me Data:', meRes.data);

    console.log('\n--- 3. Testing Logout ---');
    const logoutRes = await axios.post(`${backendUrl}/logout`, {}, {
      headers: cookieJar.getHeaders()
    });
    console.log('Logout Status:', logoutRes.status);
    console.log('Logout Data:', logoutRes.data);

    console.log('\n--- 4. Testing Me Endpoint (After Logout - Should Fail) ---');
    try {
      await axios.get(`${backendUrl}/me`, {
        headers: cookieJar.getHeaders()
      });
      console.error('FAIL: Allowed request with logged out/revoked token.');
    } catch (err) {
      console.log('Success (Expected failure): Status', err.response.status);
      console.log('Error Data:', err.response.data);
    }

    console.log('\n--- 5. Verify token added to MongoDB TTL Blacklist ---');
    const blacklistedCount = await BlacklistedToken.countDocuments();
    console.log('Blacklisted Token Count:', blacklistedCount);
    if (blacklistedCount === 1) {
      console.log('PASS: Token correctly logged in blacklist collection.');
    } else {
      console.error('FAIL: Token not present in blacklist collection.');
    }

  } catch (error) {
    console.error('Test execution failed:', error.message);
    if (error.response) {
      console.error('Response error details:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
  }
};

test();
