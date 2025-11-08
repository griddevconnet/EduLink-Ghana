// Test if backend deployment is complete and JWT includes school
const axios = require('axios');

async function testBackend() {
  try {
    console.log('🧪 Testing backend JWT generation...\n');
    
    // Try to login
    const response = await axios.post('https://edulink-backend-07ac.onrender.com/api/auth/login', {
      phone: '+233542722720',
      password: 'Sena@251011'
    });
    
    const token = response.data.data.token;
    console.log('✅ Login successful!\n');
    
    // Decode token
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('🔍 NEW JWT Token Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');
    
    if (payload.school) {
      console.log('✅ ✅ ✅ SUCCESS! Token now has school field:', payload.school);
      console.log('🎉 Backend deployment is COMPLETE!');
      console.log('\n📱 NOW log out and log back in on your app to get this new token!');
    } else {
      console.log('❌ Token still missing school field');
      console.log('⏰ Backend deployment might not be complete yet. Wait a bit longer.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBackend();
