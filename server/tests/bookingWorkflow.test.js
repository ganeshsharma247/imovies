const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedDatabase } = require('../seed/seeder');
const { signToken } = require('../src/utils/jwt');
const { User, Show, Booking } = require('../src/models');

test('Batch B — Seat Reservation, Concurrency Double-Booking Protection & Workflow', async (t) => {
  await connectDB();
  await seedDatabase({ log: false });

  t.after(async () => {
    await disconnectDB();
  });

  // Setup test users & tokens
  const userA = await User.findOne({ email: 'user@imovies.com' });
  const userB = await User.findOne({ email: 'sarah@imovies.com' });
  assert.ok(userA && userB);

  const tokenA = signToken(userA);
  const tokenB = signToken(userB);

  // Pick a future show scheduled for tomorrow (well outside the 2-hour cancellation cutoff)
  const targetShow = await Show.findOne({
    status: 'scheduled',
    startTime: { $gt: new Date(Date.now() + 12 * 3600000) },
  });
  assert.ok(targetShow, 'Should find a scheduled show for tomorrow');
  const showId = targetShow._id.toString();

  // Find two available seats
  const availableSeat1 = targetShow.seats.find((s) => s.status === 'available');
  assert.ok(availableSeat1, 'Must have at least one available seat');
  const targetSeatId = availableSeat1.seatId;

  let winningToken = tokenA;

  // 1. CONCURRENCY DOUBLE-BOOKING PROTECTION TEST
  await t.test('Double-Booking Prevention: simultaneous requests for the exact same seat resolve race-free', async () => {
    // Both User A and User B attempt to lock targetSeatId at the EXACT same millisecond
    const [resA, resB] = await Promise.all([
      makeRequest('POST', '/api/v1/bookings/lock-seats', { showId, seatIds: [targetSeatId] }, tokenA),
      makeRequest('POST', '/api/v1/bookings/lock-seats', { showId, seatIds: [targetSeatId] }, tokenB),
    ]);

    const statuses = [resA.status, resB.status];

    // Assert: Exactly ONE request succeeds with 200, and the other receives 409 Conflict
    assert.ok(
      statuses.includes(200) && statuses.includes(409),
      `Expected one 200 OK and one 409 Conflict, received: [${statuses.join(', ')}]`
    );

    winningToken = resA.status === 200 ? tokenA : tokenB;

    const conflictRes = resA.status === 409 ? resA : resB;
    const conflictBody = JSON.parse(conflictRes.body);
    assert.equal(conflictBody.success, false);
    assert.match(conflictBody.message, /no longer available/i);
  });

  // 2. SEAT LOCK TTL & VERIFICATION
  await t.test('Seats map endpoint reflects active lock state', async () => {
    const res = await makeRequest('GET', `/api/v1/shows/${showId}/seats`, null, tokenA);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);

    const seat = body.data.seats.find((s) => s.seatId === targetSeatId);
    assert.ok(seat);
    assert.equal(seat.status, 'locked');
  });

  // 3. BOOKING CONFIRMATION & QR CODE TICKET GENERATION
  let createdBookingId = '';
  let createdBookingRef = '';

  await t.test('POST /api/v1/bookings/confirm: commits lock, charges mock payment, generates QR ticket', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/bookings/confirm',
      {
        showId,
        seatIds: [targetSeatId],
        paymentMethod: 'card_mock',
        cardLastFour: '4242',
      },
      winningToken
    );

    assert.equal(res.status, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.booking);
    assert.ok(body.data.booking.bookingReference.startsWith('IMV-'));
    assert.equal(body.data.booking.status, 'confirmed');
    assert.equal(body.data.booking.paymentStatus, 'paid');
    assert.ok(body.data.booking.qrCodeData.startsWith('data:image/png;base64,'), 'QR code must be a valid Data URL');

    createdBookingId = body.data.booking._id;
    createdBookingRef = body.data.booking.bookingReference;

    // Verify seat is permanently booked in the show
    const refreshedShow = await Show.findById(showId);
    const bookedSeat = refreshedShow.seats.find((s) => s.seatId === targetSeatId);
    assert.equal(bookedSeat.status, 'booked');
    assert.equal(bookedSeat.bookingId.toString(), createdBookingId);
  });

  // 4. USER BOOKING HISTORY
  await t.test('GET /api/v1/bookings/my-bookings: retrieves user booking history with pagination', async () => {
    const res = await makeRequest('GET', '/api/v1/bookings/my-bookings', null, winningToken);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.bookings.length >= 1);
    const match = body.data.bookings.find((b) => b._id === createdBookingId);
    assert.ok(match, 'Recently confirmed booking must appear in my-bookings');
    assert.equal(match.bookingReference, createdBookingRef);
  });

  // 5. BOOKING DETAILS BY ID
  await t.test('GET /api/v1/bookings/:id: retrieves detailed ticket data', async () => {
    const res = await makeRequest('GET', `/api/v1/bookings/${createdBookingId}`, null, winningToken);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.booking._id, createdBookingId);
    assert.ok(body.data.booking.movie.title);
    assert.ok(body.data.booking.theatre.name);
  });

  // 6. BOOKING CANCELLATION & SEAT RELEASE
  await t.test('POST /api/v1/bookings/:id/cancel: cancels booking and releases seats back to available', async () => {
    const res = await makeRequest(
      'POST',
      `/api/v1/bookings/${createdBookingId}/cancel`,
      { reason: 'Customer schedule change' },
      winningToken
    );

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.status, 'cancelled');

    // Verify seat is released back to 'available' in the show
    const refreshedShow = await Show.findById(showId);
    const releasedSeat = refreshedShow.seats.find((s) => s.seatId === targetSeatId);
    assert.equal(releasedSeat.status, 'available');
    assert.equal(releasedSeat.bookingId, null);
  });
});

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;

      const headers = {};
      if (payload) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(payload);
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers,
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

      if (payload) req.write(payload);
      req.end();
    });
  });
}
