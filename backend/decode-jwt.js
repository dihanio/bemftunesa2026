/**
 * Decode JWT payload to see what's actually in it
 */

// Latest JWT payload from logs (middle part of JWT)
const payloadBase64 = 'eyJzdWIiOiI2YTRjNzkzYzYxNjYzNTllMGFkNGY3YjUiLCJlbWFpbCI6ImRpaGEuMjMyMTJAbWhzLnVuZXNhLmFjLmlkIiwiaWF0IjoxNzgzNTI3OTUyLCJleHAiOjE3ODM1Mjc5NTl9';

// Decode base64 to get payload
const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
const payload = JSON.parse(payloadJson);

console.log('=== JWT PAYLOAD ===');
console.log(JSON.stringify(payload, null, 2));
console.log('\n=== Checking for role field ===');
console.log('Has "sub" field:', 'sub' in payload);
console.log('Has "email" field:', 'email' in payload);
console.log('Has "role" field:', 'role' in payload);
console.log('Has "activeRoleId" field:', 'activeRoleId' in payload);
console.log('\n=== All payload keys ===');
console.log(Object.keys(payload).join(', '));
