// Quick JWT decoder to check if token has school field
const newToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBkZjY3ZTA5ODM1NDdlYWJjNDFkMWIiLCJyb2xlIjoidGVhY2hlciIsInBob25lIjoiKzIzMzU0MjcyMjcyMCIsInNjaG9vbCI6IjY5MGUxNzBkYmJkZDk5MWQwZTI2Mzk3OSIsImlhdCI6MTc2MjYwNTM2OSwiZXhwIjoxNzYzMjEwMTY5fQ.K1pE2odTsjQQxqEO1VbDD06H0xcHpRiG7UIi-50hIlY";

// Decode JWT (without verification)
const parts = newToken.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('🔍 NEW JWT Token Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('');

if (payload.school) {
  console.log('✅ ✅ ✅ Token HAS school field:', payload.school);
  console.log('School in payload:', payload.school);
  console.log('Expected school: 690e170dbbdd991d0e263979');
  console.log('Match:', payload.school === '690e170dbbdd991d0e263979');
} else {
  console.log('\n❌ Token MISSING school field!');
}
