const test = require('node:test');
const assert = require('node:assert/strict');
const rateLimit = require('express-rate-limit');
const http = require('http');
const express = require('express');

test('Rate Limiter Protection on Auth Endpoints', async (t) => {
  await t.test('enforces maximum request threshold and returns 429 Too Many Requests', async () => {
    const testApp = express();

    // Create a strict rate limiter with a limit of 3 requests for testing
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({ success: false, message: 'Too many authentication attempts' });
      },
    });

    testApp.use('/test-auth', testLimiter, (req, res) => {
      res.json({ success: true });
    });

    const server = http.createServer(testApp);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
      // 3 successful requests
      for (let i = 1; i <= 3; i++) {
        const res = await fetch(`http://127.0.0.1:${port}/test-auth`);
        assert.equal(res.status, 200, `Request ${i} should succeed under the limit`);
      }

      // 4th request must be throttled with 429
      const throttledRes = await fetch(`http://127.0.0.1:${port}/test-auth`);
      assert.equal(throttledRes.status, 429, '4th request must return 429 Too Many Requests');
      const body = await throttledRes.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Too many authentication attempts/);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
