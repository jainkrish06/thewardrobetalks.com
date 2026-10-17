const assert = require('assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Config Fallbacks
const AUTH_SECRET = 'local_auth_secret_secure_key_12345';

console.log('Starting Administrative JWT & Security Suite Tests...');

// 1. Password Verification Test
function testPasswordHashing() {
  console.log('\n--- Test 1: Bcrypt Password Hashing ---');
  const rawPassword = 'wardrobe@2025';
  const hashed = bcrypt.hashSync(rawPassword, 10);
  
  assert.ok(bcrypt.compareSync(rawPassword, hashed), 'Password comparison failed.');
  assert.ok(!bcrypt.compareSync('wrong_pass', hashed), 'Password matched incorrect string.');
  console.log('✓ Password hashing and verification passed.');
}

// 2. JWT Verification and Payload Decode Test
function testJWTTokenLifecycle() {
  console.log('\n--- Test 2: JWT Issuance and Payload Decodes ---');
  const payload = {
    id: 'user-uuid-12345',
    email: 'admin@wardrobetalks.com',
    role: 'SUPER_ADMIN'
  };

  const token = jwt.sign(payload, AUTH_SECRET, { expiresIn: '1h' });
  assert.ok(typeof token === 'string', 'Issued token is invalid.');

  const decoded = jwt.verify(token, AUTH_SECRET);
  assert.strictEqual(decoded.id, payload.id, 'User ID payload mismatch.');
  assert.strictEqual(decoded.email, payload.email, 'Email payload mismatch.');
  assert.strictEqual(decoded.role, payload.role, 'Role payload mismatch.');
  console.log('✓ Token validation and verification passed.');
}

// 3. Role Checking Auth Verification
function testRoleAccess() {
  console.log('\n--- Test 3: Role Permission Checkers ---');
  
  const verifyRole = (role, allowedRoles) => {
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      throw new Error('FORBIDDEN');
    }
    return true;
  };

  // Content manager checks
  assert.ok(verifyRole('SUPER_ADMIN', ['SUPER_ADMIN', 'CONTENT_MANAGER']), 'Super Admin should access content.');
  assert.ok(verifyRole('CONTENT_MANAGER', ['SUPER_ADMIN', 'CONTENT_MANAGER']), 'Content Manager should access content.');
  
  assert.throws(() => {
    verifyRole('INQUIRY_MANAGER', ['SUPER_ADMIN', 'CONTENT_MANAGER']);
  }, /FORBIDDEN/, 'Inquiry manager must be forbidden from accessing content pages.');

  // Inquiry manager checks
  assert.ok(verifyRole('INQUIRY_MANAGER', ['SUPER_ADMIN', 'INQUIRY_MANAGER']), 'Inquiry Manager should access inquiries.');
  assert.throws(() => {
    verifyRole('CONTENT_MANAGER', ['SUPER_ADMIN', 'INQUIRY_MANAGER']);
  }, /FORBIDDEN/, 'Content manager must be forbidden from accessing inquiries.');

  console.log('✓ Role authorization rules passed.');
}

// 4. File Type MIME Verification
function testMimeValidation() {
  console.log('\n--- Test 4: File Type MIME Filter Verification ---');
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];

  const validateFile = (mimeType, size) => {
    if (size > 10 * 1024 * 1024) throw new Error('LIMIT_EXCEEDED');
    if (!allowedMimeTypes.includes(mimeType)) throw new Error('INVALID_TYPE');
    return true;
  };

  assert.ok(validateFile('image/webp', 500000), 'Standard image validation failed.');
  assert.ok(validateFile('image/jpeg', 8000000), 'Standard image size validation failed.');
  
  assert.throws(() => {
    validateFile('image/webp', 12 * 1024 * 1024);
  }, /LIMIT_EXCEEDED/, 'Large image size limit bypassed.');

  assert.throws(() => {
    validateFile('application/javascript', 50000);
  }, /INVALID_TYPE/, 'Dangerous script file upload allowed.');

  console.log('✓ File attachment filter verification passed.');
}

// Runner
try {
  testPasswordHashing();
  testJWTTokenLifecycle();
  testRoleAccess();
  testMimeValidation();
  console.log('\n=======================================');
  console.log('All Administrative Security Tests Passed!');
  console.log('=======================================');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Security suite failure:', err.message);
  process.exit(1);
}
