const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedDatabase } = require('../seed/seeder');
const { signToken } = require('../src/utils/jwt');
const { User, Movie, Theatre, Show } = require('../src/models');

test('Batch C & D — Admin Dashboard & Operations with Strict RBAC', async (t) => {
  await connectDB();
  await seedDatabase({ log: false });

  t.after(async () => {
    await disconnectDB();
  });

  const adminUser = await User.findOne({ role: 'admin' });
  const regularUser = await User.findOne({ role: 'user' });
  assert.ok(adminUser && regularUser);

  const adminToken = signToken(adminUser);
  const userToken = signToken(regularUser);

  // 1. RBAC SECURITY GUARD
  await t.test('Regular user is rejected with 403 Forbidden on all admin routes', async () => {
    const res = await makeRequest('GET', '/api/v1/admin/stats', null, userToken);
    assert.equal(res.status, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.match(body.message, /Access forbidden.*Required role: admin/);
  });

  // 2. ADMIN STATS
  await t.test('GET /api/v1/admin/stats: retrieves aggregated platform KPIs', async () => {
    const res = await makeRequest('GET', '/api/v1/admin/stats', null, adminToken);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.stats);
    assert.ok(body.data.stats.activeMovies >= 6);
    assert.ok(body.data.stats.activeTheatres >= 3);
    assert.ok(body.data.stats.activeShows > 0);
  });

  // 3. ADMIN MOVIE CRUD
  let createdMovieId = '';
  await t.test('POST /api/v1/admin/movies: creates a new movie', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/admin/movies',
      {
        title: 'Solar Flare 2099',
        description: 'Earth struggles to survive unprecedented solar storms.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
        genre: ['Sci-Fi', 'Action'],
        language: ['English'],
        durationMinutes: 130,
        releaseDate: new Date(),
        certification: 'PG-13',
        status: 'coming_soon',
      },
      adminToken
    );

    assert.equal(res.status, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.data.movie.title, 'Solar Flare 2099');
    createdMovieId = body.data.movie._id;
  });

  await t.test('PUT /api/v1/admin/movies/:id: updates movie fields', async () => {
    const res = await makeRequest(
      'PUT',
      `/api/v1/admin/movies/${createdMovieId}`,
      { status: 'now_showing', rating: 8.5 },
      adminToken
    );

    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.movie.status, 'now_showing');
    assert.equal(body.data.movie.rating, 8.5);
  });

  // 4. ADMIN SHOW CREATION WITH AUTOMATIC SEAT MATRIX
  await t.test('POST /api/v1/admin/shows: creates show and generates full seat layout', async () => {
    const theatre = await Theatre.findOne();
    assert.ok(theatre);
    const screen = theatre.screens[0];

    // Pick a future time without conflict
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 5);
    startTime.setHours(15, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(18, 0, 0, 0);

    const res = await makeRequest(
      'POST',
      '/api/v1/admin/shows',
      {
        movie: createdMovieId,
        theatre: theatre._id,
        screenName: screen.name,
        startTime,
        endTime,
        tierPricing: { silver: 15, gold: 22, platinum: 30 },
      },
      adminToken
    );

    assert.equal(res.status, 201);
    const body = JSON.parse(res.body);
    assert.ok(body.data.show.seats.length > 0);
    assert.equal(body.data.show.seats[0].status, 'available');
  });

  // 5. ADMIN BOOKINGS AUDIT
  await t.test('GET /api/v1/admin/bookings: retrieves platform-wide bookings audit', async () => {
    const res = await makeRequest('GET', '/api/v1/admin/bookings?page=1&limit=10', null, adminToken);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body.data.bookings));
    assert.ok(body.data.pagination.totalCount >= 1);
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
