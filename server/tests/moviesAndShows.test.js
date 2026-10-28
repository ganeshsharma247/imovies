const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedDatabase } = require('../seed/seeder');
const { checkScheduleConflict } = require('../src/controllers/showController');
const { Movie, Theatre, Show } = require('../src/models');

test('Batch A — Movies, Theatres, Shows & Discovery API', async (t) => {
  await connectDB();
  await seedDatabase({ log: false });

  t.after(async () => {
    await disconnectDB();
  });

  let sampleMovieId = '';
  let sampleTheatreId = '';
  let sampleShowId = '';

  // Setup references from seeded database
  const firstShow = await Show.findOne();
  sampleShowId = firstShow._id.toString();
  sampleMovieId = firstShow.movie.toString();

  // 1. MOVIES ENDPOINTS
  await t.test('GET /api/v1/movies: lists movies with pagination metadata', async () => {
    const res = await makeRequest('GET', '/api/v1/movies?page=1&limit=4');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.movies));
    assert.equal(body.data.movies.length, 4);
    assert.equal(body.data.pagination.page, 1);
    assert.equal(body.data.pagination.limit, 4);
    assert.ok(body.data.pagination.totalCount >= 6);
  });

  await t.test('GET /api/v1/movies?status=now_showing: filters by status', async () => {
    const res = await makeRequest('GET', '/api/v1/movies?status=now_showing');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.movies.every((m) => m.status === 'now_showing'));
  });

  await t.test('GET /api/v1/movies?genre=Sci-Fi: filters by genre', async () => {
    const res = await makeRequest('GET', '/api/v1/movies?genre=Sci-Fi');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.movies.length > 0);
    assert.ok(body.data.movies.some((m) => m.genre.includes('Sci-Fi')));
  });

  await t.test('GET /api/v1/movies?search=Cosmic: searches by keyword', async () => {
    const res = await makeRequest('GET', '/api/v1/movies?search=Cosmic');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.movies.length >= 1);
    assert.match(body.data.movies[0].title, /Cosmic Odyssey/i);
  });

  await t.test('GET /api/v1/movies/:id: returns movie details', async () => {
    const res = await makeRequest('GET', `/api/v1/movies/${sampleMovieId}`);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.movie._id, sampleMovieId);
    assert.ok(body.data.movie.title);
  });

  // 2. THEATRES ENDPOINTS
  await t.test('GET /api/v1/theatres: lists all theatres', async () => {
    const res = await makeRequest('GET', '/api/v1/theatres');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.theatres.length >= 3);
    sampleTheatreId = body.data.theatres[0]._id;
  });

  await t.test('GET /api/v1/theatres?city=Metropolis: filters theatres by city', async () => {
    const res = await makeRequest('GET', '/api/v1/theatres?city=Metropolis');
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.theatres.length >= 1);
    assert.equal(body.data.theatres[0].city, 'Metropolis');
  });

  // 3. SHOWTIMES & SEATS
  await t.test('GET /api/v1/movies/:id/shows: retrieves showtimes for movie', async () => {
    const res = await makeRequest('GET', `/api/v1/movies/${sampleMovieId}/shows`);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.shows.length > 0);
    assert.ok(body.data.shows[0].theatre);
    sampleShowId = body.data.shows[0]._id;
  });

  await t.test('GET /api/v1/shows/:id: retrieves show details with pricing', async () => {
    const res = await makeRequest('GET', `/api/v1/shows/${sampleShowId}`);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.data.show._id, sampleShowId);
    assert.ok(body.data.show.tierPricing.silver > 0);
  });

  await t.test('GET /api/v1/shows/:id/seats: retrieves seat layout with statuses', async () => {
    const res = await makeRequest('GET', `/api/v1/shows/${sampleShowId}/seats`);
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data.seats.length > 0);
    assert.ok(body.data.availableCount >= 0);
    const firstSeat = body.data.seats[0];
    assert.ok(firstSeat.seatId);
    assert.ok(firstSeat.row);
    assert.ok(firstSeat.price > 0);
    assert.ok(['available', 'locked', 'booked'].includes(firstSeat.status));
  });

  // 4. SCHEDULE CONFLICT VALIDATION
  await t.test('checkScheduleConflict: detects overlapping showtimes on the same screen', async () => {
    const existingShow = await Show.findById(sampleShowId);
    assert.ok(existingShow);

    // Overlapping window
    const overlapStart = new Date(existingShow.startTime.getTime() + 15 * 60 * 1000);
    const overlapEnd = new Date(existingShow.endTime.getTime() + 60 * 60 * 1000);

    const conflict = await checkScheduleConflict(
      existingShow.theatre,
      existingShow.screenName,
      overlapStart,
      overlapEnd
    );

    assert.ok(conflict, 'Must identify schedule conflict on same screen');
    assert.equal(conflict._id.toString(), existingShow._id.toString());

    // Non-overlapping window far in the future (no shows scheduled)
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 10);
    futureStart.setHours(10, 0, 0, 0);
    const futureEnd = new Date(futureStart);
    futureEnd.setHours(13, 0, 0, 0);

    const noConflict = await checkScheduleConflict(
      existingShow.theatre,
      existingShow.screenName,
      futureStart,
      futureEnd
    );
    assert.equal(noConflict, null, 'Must report no conflict for non-overlapping times');
  });
});

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            server.close(() => {
              resolve({ status: res.statusCode, headers: res.headers, body });
            });
          });
        }
      );
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.end();
    });
  });
}
