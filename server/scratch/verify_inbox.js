const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'tenant@test.com',
      password: 'password'
    });
    const token = loginRes.data.token;
    console.log('Logged in successfully');

    const roomsRes = await axios.get('http://localhost:5000/api/rooms');
    const roomId = roomsRes.data[0].id;
    console.log('Room ID:', roomId);

    const roomDetailRes = await axios.get(`http://localhost:5000/api/rooms/${roomId}`);
    console.log('Room Detail hostId:', roomDetailRes.data.hostId);

    try {
      const convRes = await axios.get('http://localhost:5000/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Conversations Status:', convRes.status);
      console.log('Conversations Count:', convRes.data.length);
    } catch (err) {
      console.error('Conversations API Error:', err.response?.status, err.response?.data);
    }

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

test();
