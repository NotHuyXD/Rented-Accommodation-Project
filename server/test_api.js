const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin4@rented.vn',
      password: '123456'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error:', err.response ? err.response.data : err.message);
  }
}
test();
