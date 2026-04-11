const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.post('http://localhost:5000/api/v1/auth/register', {
      email: 'test' + Date.now() + '@test.com',
      password: 'password',
      fullName: 'Test Name',
      phone: '0' + Date.now().toString().slice(0, 9)
    });
    console.log('Register Success:', res.data);
  } catch (err) {
    console.log('Register Error:', err.response?.data || err.message);
  }

  try {
    const res = await axios.get('http://localhost:5000/api/v1/rooms');
    console.log('Rooms Success:', res.data.length ? 'got data' : res.data);
  } catch (err) {
    console.log('Rooms Error:', err.response?.data || err.message);
  }
}
testApi();
