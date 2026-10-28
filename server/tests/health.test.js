const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('Health Check API Route', async (t) => {
  await t.test('GET / should return 200 with API welcome info', async () => {
    // Basic mock request test
    const res = await fetchResponse(app, 'GET', '/');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.version, '1.0.0');
  });

  await t.test('GET /api/v1/health should return health payload', async () => {
    const res = await fetchResponse(app, 'GET', '/api/v1/health');
    assert.ok(res.status === 200 || res.status === 503);
    const body = JSON.parse(res.body);
    assert.ok(body.data);
    assert.equal(body.data.service, 'IMovies Backend API');
  });

  await t.test('GET /unknown-route should return 404 ApiError', async () => {
    const res = await fetchResponse(app, 'GET', '/not-existing');
    assert.equal(res.status, 404);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Endpoint not found/);
  });
});

// Lightweight response helper for testing express app without external agent libraries
function fetchResponse(appInstance, method, url) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const server = http.createServer(appInstance);
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: '127.0.0.1',
        port,
        path: url,
        method,
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          server.close(() => {
            resolve({ status: res.statusCode, headers: res.headers, body });
          });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.end();
    });
  });
}
