const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const {
  User,
  Movie,
  Theatre,
  Show,
  Booking,
  Payment,
  Notification,
} = require('../src/models');
const { seedDatabase } = require('../seed/seeder');

test('Phase 2 — Mongoose Models, Validations, and Seeder', async (t) => {
  // Connect to database before running tests
  await connectDB();

  t.after(async () => {
    await disconnectDB();
  });

  // --- USER MODEL TESTS ---
  await t.test('User Model: enforces required fields, email format, and role enum', async () => {
    const invalidUser = new User({});
    let error;
    try {
      await invalidUser.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error, 'Validation should fail on empty user document');
    assert.ok(error.errors.name, 'Name should be required');
    assert.ok(error.errors.email, 'Email should be required');
    assert.ok(error.errors.password, 'Password should be required');

    // Invalid email format test
    const badEmailUser = new User({
      name: 'Test User',
      email: 'not-an-email',
      password: 'validPassword123',
    });
    await assert.rejects(
      async () => await badEmailUser.validate(),
      /Please provide a valid email address/
    );

    // Invalid role test
    const badRoleUser = new User({
      name: 'Bad Role',
      email: 'badrole@example.com',
      password: 'validPassword123',
      role: 'superadmin',
    });
    await assert.rejects(
      async () => await badRoleUser.validate(),
      /Role must be either user or admin/
    );
  });

  await t.test('User Model: never stores plaintext password, hashes with bcrypt', async () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const plainPassword = 'SecretPassword123!';

    const user = new User({
      name: 'Security Test User',
      email: uniqueEmail,
      password: plainPassword,
      role: 'user',
    });

    await user.save();

    // Directly query database without select to see stored password
    const storedUser = await User.findById(user._id).select('+password');
    assert.notEqual(storedUser.password, plainPassword, 'Stored password must not be plaintext');
    assert.ok(storedUser.password.startsWith('$2'), 'Stored password must be a bcrypt hash');

    // Test comparePassword
    const isMatch = await storedUser.comparePassword(plainPassword);
    assert.equal(isMatch, true, 'comparePassword should return true for correct password');

    const isWrongMatch = await storedUser.comparePassword('WrongPassword!');
    assert.equal(isWrongMatch, false, 'comparePassword should return false for incorrect password');

    // Test toJSON exclusion
    const jsonUser = user.toJSON();
    assert.equal(jsonUser.password, undefined, 'toJSON must not expose password hash');

    // Clean up
    await User.findByIdAndDelete(user._id);
  });

  await t.test('User Model: enforces unique email constraint', async () => {
    const duplicateEmail = `unique_${Date.now()}@example.com`;
    const user1 = new User({
      name: 'User One',
      email: duplicateEmail,
      password: 'Password123!',
    });
    await user1.save();

    const user2 = new User({
      name: 'User Two',
      email: duplicateEmail,
      password: 'Password456!',
    });

    await assert.rejects(
      async () => await user2.save(),
      (err) => err.code === 11000 || /duplicate/i.test(err.message),
      'Should reject duplicate email registration with Mongo duplicate key error'
    );

    await User.deleteMany({ email: duplicateEmail });
  });

  // --- MOVIE MODEL TESTS ---
  await t.test('Movie Model: validates positive duration, certification, and status', async () => {
    const badDurationMovie = new Movie({
      title: 'Bad Movie',
      description: 'Test description',
      posterUrl: 'https://example.com/poster.jpg',
      genre: ['Action'],
      language: ['English'],
      durationMinutes: -10, // Invalid duration
      releaseDate: new Date(),
      certification: 'PG-13',
    });

    await assert.rejects(
      async () => await badDurationMovie.validate(),
      /Duration must be at least 1 minute/
    );

    const badCertMovie = new Movie({
      title: 'Bad Cert Movie',
      description: 'Test description',
      posterUrl: 'https://example.com/poster.jpg',
      genre: ['Action'],
      language: ['English'],
      durationMinutes: 120,
      releaseDate: new Date(),
      certification: 'UNRATED_UNKNOWN', // Invalid certification
    });

    await assert.rejects(
      async () => await badCertMovie.validate(),
      /Invalid certification rating/
    );
  });

  // --- THEATRE MODEL TESTS ---
  await t.test('Theatre Model: calculates totalCapacity automatically from screens', async () => {
    const theatre = new Theatre({
      name: `Grand Multiplex ${Date.now()}`,
      city: 'Boston',
      address: '100 Boylston St',
      screens: [
        {
          screenNumber: 1,
          name: 'Screen 1',
          format: '2D',
          totalSeats: 30,
          seatLayout: { rows: [{ rowLabel: 'A', tier: 'silver', seatsCount: 30 }] },
        },
        {
          screenNumber: 2,
          name: 'Screen 2',
          format: 'IMAX 3D',
          totalSeats: 45,
          seatLayout: { rows: [{ rowLabel: 'A', tier: 'gold', seatsCount: 45 }] },
        },
      ],
    });

    await theatre.save();
    assert.equal(theatre.totalCapacity, 75, 'totalCapacity should automatically equal sum of screen seats (30 + 45 = 75)');

    await Theatre.findByIdAndDelete(theatre._id);
  });

  // --- SHOW MODEL TESTS ---
  await t.test('Show Model: rejects invalid show times where endTime <= startTime', async () => {
    const fakeMovieId = new mongoose.Types.ObjectId();
    const fakeTheatreId = new mongoose.Types.ObjectId();
    const now = new Date();
    const past = new Date(now.getTime() - 3600000); // 1 hour in the past

    const invalidTimeShow = new Show({
      movie: fakeMovieId,
      theatre: fakeTheatreId,
      screenName: 'Screen 1',
      startTime: now,
      endTime: past, // Invalid: endTime is before startTime
      tierPricing: { silver: 10, gold: 15, platinum: 20 },
      seats: [
        { seatId: 'A-1', row: 'A', number: 1, tier: 'silver', price: 10 },
      ],
    });

    await assert.rejects(
      async () => await invalidTimeShow.validate(),
      /Show end time must be chronologically after the start time/
    );
  });

  await t.test('Show Model: detects and rejects duplicate seat IDs within a show', async () => {
    const fakeMovieId = new mongoose.Types.ObjectId();
    const fakeTheatreId = new mongoose.Types.ObjectId();
    const start = new Date();
    const end = new Date(start.getTime() + 7200000);

    const duplicateSeatsShow = new Show({
      movie: fakeMovieId,
      theatre: fakeTheatreId,
      screenName: 'Screen 1',
      startTime: start,
      endTime: end,
      tierPricing: { silver: 10, gold: 15, platinum: 20 },
      seats: [
        { seatId: 'A-1', row: 'A', number: 1, tier: 'silver', price: 10 },
        { seatId: 'A-2', row: 'A', number: 2, tier: 'silver', price: 10 },
        { seatId: 'A-1', row: 'A', number: 1, tier: 'silver', price: 10 }, // Duplicate seatId!
      ],
    });

    await assert.rejects(
      async () => await duplicateSeatsShow.validate(),
      /Duplicate seat identifier detected within show: A-1/
    );
  });

  // --- PAYMENT MODEL SECURITY GUARDRAIL TESTS ---
  await t.test('Payment Model: rejects sensitive cardholder data (cardNumber, CVV)', async () => {
    const fakeBookingId = new mongoose.Types.ObjectId();
    const fakeUserId = new mongoose.Types.ObjectId();

    // Attempting to pass prohibited raw credit card numbers
    const insecurePayment = new Payment({
      booking: fakeBookingId,
      user: fakeUserId,
      transactionId: `TXN-${Date.now()}`,
      amount: 45.0,
      method: 'card_mock',
      cardNumber: '4111222233334444', // Prohibited!
    });

    await assert.rejects(
      async () => await insecurePayment.validate(),
      /Security policy violation: Prohibited sensitive card data field 'cardNumber' detected!/
    );

    // Attempting to pass prohibited CVV
    const insecureCvvPayment = new Payment({
      booking: fakeBookingId,
      user: fakeUserId,
      transactionId: `TXN-${Date.now()}-2`,
      amount: 45.0,
      method: 'card_mock',
      cvv: '123', // Prohibited!
    });

    await assert.rejects(
      async () => await insecureCvvPayment.validate(),
      /Security policy violation: Prohibited sensitive card data field 'cvv' detected!/
    );
  });

  // --- SEEDER IDEMPOTENCY TEST ---
  await t.test('Seeder Idempotency: repeated seeding runs safely without duplicate record crashes', async () => {
    // Run seed cycle 1
    const run1 = await seedDatabase({ log: false });
    assert.ok(run1.usersCount >= 3, 'Seeder must create at least 3 users');
    assert.ok(run1.moviesCount >= 6, 'Seeder must create at least 6 movies');
    assert.ok(run1.theatresCount >= 3, 'Seeder must create at least 3 theatres');
    assert.ok(run1.showsCount > 0, 'Seeder must create shows');

    // Run seed cycle 2 immediately
    const run2 = await seedDatabase({ log: false });
    assert.equal(run2.usersCount, run1.usersCount, 'Second seed run must maintain exact user count');
    assert.equal(run2.moviesCount, run1.moviesCount, 'Second seed run must maintain exact movie count');
    assert.equal(run2.theatresCount, run1.theatresCount, 'Second seed run must maintain exact theatre count');
    assert.equal(run2.showsCount, run1.showsCount, 'Second seed run must maintain exact show count');

    // Verify user count in DB is exactly the expected number (no duplicates)
    const userCount = await User.countDocuments({ email: { $in: ['admin@imovies.com', 'user@imovies.com', 'sarah@imovies.com'] } });
    assert.equal(userCount, 3, 'Should have exactly 3 seeded users, no duplicates');
  });
});
