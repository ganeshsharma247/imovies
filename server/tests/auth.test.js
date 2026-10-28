const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');

test('Phase 3 — Core Authentication & Role-Based Authorization', async (t) => {
  await connectDB();

  t.after(async () => {
    // Clean up test users
    await User.deleteMany({ email: /auth_test_/ });
    await disconnectDB();
  });

  const timestamp = Date.now();
  const testEmail = `auth_test_user_${timestamp}@example.com`;
  const testPassword = 'StrongPassword123!';
  let userToken = '';
  let adminToken = '';

  // 1. REGISTRATION TESTS
  await t.test('POST /api/v1/auth/register: successfully registers new user and returns JWT', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Auth Test User',
      email: testEmail,
      password: testPassword,
      phone: '+1-555-0199',
    });

    assert.equal(res.status, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.token, 'Must return JWT token');
    assert.equal(body.data.user.email, testEmail);
    assert.equal(body.data.user.role, 'user');
    assert.equal(body.data.user.password, undefined, 'Must not expose password hash');

    userToken = body.data.token;
  });

  await t.test('POST /api/v1/auth/register: rejects duplicate email with 409 Conflict', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Duplicate User',
      email: testEmail,
      password: 'AnotherPassword123!',
    });

    assert.equal(res.status, 409);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /already exists/i);
  });

  await t.test('POST /api/v1/auth/register: rejects invalid input with 400 Bad Request', async () => {
    // Short password and invalid email
    const res = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'A', // too short
      email: 'not-an-email',
      password: '123', // too short
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.ok(body.errors.length >= 3, 'Must report all validation errors');
  });

  await t.test('POST /api/v1/auth/register: rejects self-assigned admin role', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Hacker User',
      email: `auth_test_hacker_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'admin',
    });

    assert.equal(res.status, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Validation failed/);
  });

  // 2. LOGIN TESTS
  await t.test('POST /api/v1/auth/login: successfully authenticates valid user', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: testPassword,
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.token, 'Must return JWT token');
    assert.equal(body.data.user.email, testEmail);
    assert.equal(body.data.user.password, undefined);
  });

  await t.test('POST /api/v1/auth/login: rejects incorrect password with 401', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: 'WrongPassword!',
    });

    assert.equal(res.status, 401);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Invalid email or password/);
  });

  await t.test('POST /api/v1/auth/login: rejects non-existent email with 401', async () => {
    const res = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'nonexistent@example.com',
      password: 'Password123!',
    });

    assert.equal(res.status, 401);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Invalid email or password/);
  });

  // 3. PROTECTED ROUTE TESTS (GET /api/v1/auth/me)
  await t.test('GET /api/v1/auth/me: retrieves current user profile with valid token', async () => {
    const res = await makeRequest('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${userToken}`,
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, testEmail);
    assert.equal(body.data.user.password, undefined);
  });

  await t.test('GET /api/v1/auth/me: rejects requests with missing token (401)', async () => {
    const res = await makeRequest('GET', '/api/v1/auth/me');

    assert.equal(res.status, 401);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Authentication required/);
  });

  await t.test('GET /api/v1/auth/me: rejects requests with invalid / tampered token (401)', async () => {
    const res = await makeRequest('GET', '/api/v1/auth/me', null, {
      Authorization: 'Bearer invalid_tampered_jwt_token',
    });

    assert.equal(res.status, 401);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Invalid authentication token/);
  });

  // 4. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
  await t.test('RBAC: regular user is forbidden from admin route (403)', async () => {
    const res = await makeRequest('GET', '/api/v1/auth/admin-check', null, {
      Authorization: `Bearer ${userToken}`,
    });

    assert.equal(res.status, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Access forbidden.*Required role: admin/);
  });

  await t.test('RBAC: admin user is granted access to admin route (200)', async () => {
    // Create an admin user directly
    const adminEmail = `auth_test_admin_${timestamp}@example.com`;
    const adminUser = new User({
      name: 'System Admin',
      email: adminEmail,
      password: 'AdminPassword123!',
      role: 'admin',
    });
    await adminUser.save();

    // Login as admin
    const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
      email: adminEmail,
      password: 'AdminPassword123!',
    });
    const loginBody = JSON.parse(loginRes.body);
    adminToken = loginBody.data.token;

    // Access admin route
    const res = await makeRequest('GET', '/api/v1/auth/admin-check', null, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.role, 'admin');
    assert.equal(body.data.verified, true);
  });

  // 5. PROFILE UPDATE TESTS
  await t.test('PUT /api/v1/auth/profile: updates user name and phone', async () => {
    const res = await makeRequest(
      'PUT',
      '/api/v1/auth/profile',
      { name: 'Updated Name', phone: '+1-555-9999' },
      { Authorization: `Bearer ${userToken}` }
    );

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.user.name, 'Updated Name');
    assert.equal(body.data.user.phone, '+1-555-9999');
  });

  await t.test('PUT /api/v1/auth/profile: fails password change if currentPassword is wrong', async () => {
    const res = await makeRequest(
      'PUT',
      '/api/v1/auth/profile',
      { currentPassword: 'WrongPassword!', newPassword: 'BrandNewPassword123!' },
      { Authorization: `Bearer ${userToken}` }
    );

    assert.equal(res.status, 401);
    const body = JSON.parse(res.body);
    assert.match(body.message, /Current password verification failed/);
  });

  await t.test('PUT /api/v1/auth/profile: succeeds password change with correct currentPassword', async () => {
    const res = await makeRequest(
      'PUT',
      '/api/v1/auth/profile',
      { currentPassword: testPassword, newPassword: 'BrandNewPassword123!' },
      { Authorization: `Bearer ${userToken}` }
    );

    assert.equal(res.status, 200);

    // Verify login with new password
    const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: 'BrandNewPassword123!',
    });
    assert.equal(loginRes.status, 200);
  });
});

// Helper to make test HTTP requests to Express app
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;

      const reqHeaders = { ...headers };
      if (payload) {
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let resBody = '';
          res.on('data', (chunk) => (resBody += chunk));
          res.on('end', () => {
            server.close(() => {
              resolve({ status: res.statusCode, headers: res.headers, body: resBody });
            });
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}
