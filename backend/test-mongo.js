// Quick MongoDB Connection Test
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://nexus_coder:Sena251011@cluster0.dfyc8cy.mongodb.net/edulink?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔌 Testing MongoDB connection...');
console.log('📍 URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! MongoDB connected!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('');
    console.log('🎉 Your MongoDB is working perfectly!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ FAILED! MongoDB connection error:');
    console.error('');
    console.error('Error:', err.message);
    console.error('');
    console.error('Common fixes:');
    console.error('1. Check password is correct: Sena251011');
    console.error('2. Check IP whitelist (0.0.0.0/0)');
    console.error('3. Check user has read/write permissions');
    process.exit(1);
  });
