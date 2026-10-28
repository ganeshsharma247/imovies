const { connectDB, disconnectDB, getDBStatus } = require('../src/config/db');
const {
  User,
  Movie,
  Theatre,
  Show,
  Booking,
  Payment,
  Notification,
} = require('../src/models');

const SEED_USERS = [
  {
    name: 'Admin Director',
    email: 'admin@imovies.com',
    password: 'AdminPassword123!',
    role: 'admin',
    phone: '+1-555-010-0001',
  },
  {
    name: 'Alex Johnson',
    email: 'user@imovies.com',
    password: 'UserPassword123!',
    role: 'user',
    phone: '+1-555-010-0002',
  },
  {
    name: 'Sarah Connor',
    email: 'sarah@imovies.com',
    password: 'SarahPassword123!',
    role: 'user',
    phone: '+1-555-010-0003',
  },
];

const SEED_MOVIES = [
  {
    title: 'Cosmic Odyssey: Andromeda',
    description:
      'In the deep expanse of uncharted space, a rogue astronaut crew discovers a dormant alien megastructure capable of bending spacetime, triggering an interstellar race for survival.',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    genre: ['Sci-Fi', 'Adventure', 'Mystery'],
    language: ['English'],
    durationMinutes: 148,
    releaseDate: new Date('2026-10-15'),
    certification: 'PG-13',
    status: 'now_showing',
    rating: 8.9,
    director: 'Elena Vance',
    cast: ['Marcus Kane', 'Aria Sterling', 'David Chen'],
  },
  {
    title: 'Shadow Protocol: Blackout',
    description:
      'When an elite espionage unit is disavowed following a catastrophic cyber-attack on Geneva, operative Noah Drake must navigate betrayal across Europe before midnight.',
    posterUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    genre: ['Action', 'Thriller'],
    language: ['English'],
    durationMinutes: 126,
    releaseDate: new Date('2026-10-20'),
    certification: 'UA',
    status: 'now_showing',
    rating: 8.2,
    director: 'Vikram Seth',
    cast: ['Noah Drake', 'Svetlana Rostova', 'Julian Cross'],
  },
  {
    title: 'Cyberpunk Neon 2099',
    description:
      'A synthetic detective with failing memory implants is hired by a mega-corporation heiress to track down an elusive consciousness thief operating in New Shibuya.',
    posterUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=1600&q=80',
    genre: ['Sci-Fi', 'Action', 'Crime'],
    language: ['English', 'Japanese'],
    durationMinutes: 135,
    releaseDate: new Date('2026-10-01'),
    certification: 'A',
    status: 'now_showing',
    rating: 8.7,
    director: 'Kenji Takahashi',
    cast: ['Ren Amamiya', 'Chloe Decker', 'Tatsuya Endo'],
  },
  {
    title: 'Chronicles of Eldoria',
    description:
      'When the celestial sun-crystal fractures into five elemental shards, an orphaned beast-whisperer must unite rival elven clans before the eternal twilight devours the realm.',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    genre: ['Fantasy', 'Adventure'],
    language: ['English'],
    durationMinutes: 154,
    releaseDate: new Date('2026-11-15'),
    certification: 'PG-13',
    status: 'coming_soon',
    rating: 9.1,
    director: 'Guillermo Moreno',
    cast: ['Liam O’Connor', 'Seraphina Vale', 'Thorne Blackwood'],
  },
  {
    title: 'Velocity: Apex Horizon',
    description:
      'Underground electric supercar racers risk everything in a high-stakes, 3000-mile transcontinental sprint across the Alps pursued by Interpol and rival syndicates.',
    posterUrl:
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    genre: ['Action', 'Thriller'],
    language: ['English', 'Italian'],
    durationMinutes: 118,
    releaseDate: new Date('2026-10-25'),
    certification: 'UA',
    status: 'now_showing',
    rating: 7.8,
    director: 'Mateo Rossi',
    cast: ['Dom Torelli', 'Leila Vance', 'Jax Cooper'],
  },
  {
    title: 'Whispering Pines',
    description:
      'A quiet botanist retreat turns into an eerie puzzle when a remote mountain lake begins reflecting memories that never happened.',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    genre: ['Drama', 'Mystery'],
    language: ['English'],
    durationMinutes: 104,
    releaseDate: new Date('2026-11-20'),
    certification: 'PG',
    status: 'coming_soon',
    rating: 8.0,
    director: 'Claire Dupont',
    cast: ['Hannah Wells', 'Arthur Pendelton'],
  },
];

const SEED_THEATRES = [
  {
    name: 'IMovies Grand Royale - Downtown',
    city: 'Metropolis',
    state: 'NY',
    address: '450 Broadway Avenue, Downtown Cinema District',
    location: { type: 'Point', coordinates: [-73.9851, 40.7488] },
    amenities: ['IMAX', 'Dolby Atmos', 'Recliners', 'Cafeteria', 'Valet Parking'],
    screens: [
      {
        screenNumber: 1,
        name: 'Screen 1 - IMAX Laser 3D',
        format: 'IMAX 3D',
        totalSeats: 48,
        seatLayout: {
          rows: [
            { rowLabel: 'A', tier: 'silver', seatsCount: 8 },
            { rowLabel: 'B', tier: 'silver', seatsCount: 8 },
            { rowLabel: 'C', tier: 'gold', seatsCount: 8 },
            { rowLabel: 'D', tier: 'gold', seatsCount: 8 },
            { rowLabel: 'E', tier: 'platinum', seatsCount: 8 },
            { rowLabel: 'F', tier: 'platinum', seatsCount: 8 },
          ],
        },
      },
      {
        screenNumber: 2,
        name: 'Screen 2 - Dolby Atmos Premium',
        format: 'Dolby Cinema',
        totalSeats: 40,
        seatLayout: {
          rows: [
            { rowLabel: 'A', tier: 'silver', seatsCount: 8 },
            { rowLabel: 'B', tier: 'silver', seatsCount: 8 },
            { rowLabel: 'C', tier: 'gold', seatsCount: 8 },
            { rowLabel: 'D', tier: 'platinum', seatsCount: 8 },
            { rowLabel: 'E', tier: 'platinum', seatsCount: 8 },
          ],
        },
      },
    ],
  },
  {
    name: 'IMovies Horizon CinePlex - Westside',
    city: 'San Francisco',
    state: 'CA',
    address: '880 Market Street, Union Square West',
    location: { type: 'Point', coordinates: [-122.4074, 37.7858] },
    amenities: ['Dolby Atmos', '4DX', 'Recliners', 'Cafeteria'],
    screens: [
      {
        screenNumber: 1,
        name: 'Screen 1 - 4DX Extreme',
        format: '4DX',
        totalSeats: 36,
        seatLayout: {
          rows: [
            { rowLabel: 'A', tier: 'silver', seatsCount: 6 },
            { rowLabel: 'B', tier: 'silver', seatsCount: 6 },
            { rowLabel: 'C', tier: 'gold', seatsCount: 6 },
            { rowLabel: 'D', tier: 'gold', seatsCount: 6 },
            { rowLabel: 'E', tier: 'platinum', seatsCount: 6 },
            { rowLabel: 'F', tier: 'platinum', seatsCount: 6 },
          ],
        },
      },
    ],
  },
  {
    name: 'IMovies CineDome - Uptown Galleria',
    city: 'Chicago',
    state: 'IL',
    address: '120 North Michigan Avenue',
    location: { type: 'Point', coordinates: [-87.6244, 41.8842] },
    amenities: ['IMAX', 'Dolby Atmos', 'Recliners', 'Valet Parking'],
    screens: [
      {
        screenNumber: 1,
        name: 'Screen 1 - Grand Premiere',
        format: '2D',
        totalSeats: 40,
        seatLayout: {
          rows: [
            { rowLabel: 'A', tier: 'silver', seatsCount: 8 },
            { rowLabel: 'B', tier: 'silver', seatsCount: 8 },
            { rowLabel: 'C', tier: 'gold', seatsCount: 8 },
            { rowLabel: 'D', tier: 'gold', seatsCount: 8 },
            { rowLabel: 'E', tier: 'platinum', seatsCount: 8 },
          ],
        },
      },
    ],
  },
];

// Helper to construct seat inventory from screen layout and pricing
function generateSeatsForScreen(screen, tierPricing) {
  const seats = [];
  for (const row of screen.seatLayout.rows) {
    for (let i = 1; i <= row.seatsCount; i++) {
      const seatId = `${row.rowLabel}-${i}`;
      const price = tierPricing[row.tier] || tierPricing.silver;
      seats.push({
        seatId,
        row: row.rowLabel,
        number: i,
        tier: row.tier,
        price,
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
        bookingId: null,
      });
    }
  }
  return seats;
}

/**
 * Safe, idempotent seeder function
 */
async function seedDatabase(options = { log: true }) {
  const { log } = options;
  const dbStatus = getDBStatus();

  if (log) {
    console.log(`\n=================================================`);
    console.log(`🌱 IMovies Seed Script Initializing`);
    console.log(`📡 Database mode: ${dbStatus.isInMemory ? 'In-Memory (Ephemeral)' : 'External / Persistent'}`);
    if (dbStatus.isInMemory) {
      console.log(`ℹ️  Note: Data persists in memory only for the duration of the current node process.`);
    } else {
      console.log(`ℹ️  Note: Data will be persisted in MongoDB at ${dbStatus.host}.`);
    }
    console.log(`=================================================`);
  }

  // 1. Clean existing seed data (Idempotent cleanup based on deterministic keys)
  const seedEmails = SEED_USERS.map((u) => u.email);
  const seedMovieTitles = SEED_MOVIES.map((m) => m.title);
  const seedTheatreNames = SEED_THEATRES.map((t) => t.name);

  // Find existing seed IDs to cascade clean shows/bookings
  const existingUsers = await User.find({ email: { $in: seedEmails } }).select('_id');
  const existingUserIds = existingUsers.map((u) => u._id);

  const existingTheatres = await Theatre.find({ name: { $in: seedTheatreNames } }).select('_id');
  const existingTheatreIds = existingTheatres.map((t) => t._id);

  const existingMovies = await Movie.find({ title: { $in: seedMovieTitles } }).select('_id');
  const existingMovieIds = existingMovies.map((m) => m._id);

  // Remove cascading records
  await Notification.deleteMany({ recipient: { $in: existingUserIds } });
  await Payment.deleteMany({ user: { $in: existingUserIds } });
  await Booking.deleteMany({ user: { $in: existingUserIds } });
  await Show.deleteMany({ theatre: { $in: existingTheatreIds } });
  await Theatre.deleteMany({ name: { $in: seedTheatreNames } });
  await Movie.deleteMany({ title: { $in: seedMovieTitles } });
  await User.deleteMany({ email: { $in: seedEmails } });

  if (log) console.log('🧹 Cleaned prior seed records.');

  // 2. Seed Users (with hashed passwords via pre-save hook)
  const createdUsers = [];
  for (const userData of SEED_USERS) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);
  }
  if (log) console.log(`👤 Seeded ${createdUsers.length} Users (1 Admin, 2 Regular Users).`);

  // 3. Seed Movies
  const createdMovies = await Movie.insertMany(SEED_MOVIES);
  if (log) console.log(`🎬 Seeded ${createdMovies.length} Movies.`);

  // 4. Seed Theatres
  const createdTheatres = [];
  for (const theatreData of SEED_THEATRES) {
    const theatre = new Theatre(theatreData);
    await theatre.save();
    createdTheatres.push(theatre);
  }
  if (log) console.log(`🏛️  Seeded ${createdTheatres.length} Theatres with multi-screen layouts.`);

  // 5. Seed Shows
  // Create shows for now_showing movies in the theatres for Today, Tomorrow, and Day after
  const createdShows = [];
  const nowShowingMovies = createdMovies.filter((m) => m.status === 'now_showing');
  const baseDate = new Date();
  baseDate.setHours(10, 0, 0, 0);

  const tierPricing = {
    silver: 12.5,
    gold: 18.0,
    platinum: 25.0,
  };

  for (const theatre of createdTheatres) {
    for (const screen of theatre.screens) {
      // Pick movies for this screen
      for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        for (let slot = 0; slot < 2; slot++) {
          const movieIndex = (dayOffset + slot) % nowShowingMovies.length;
          const movie = nowShowingMovies[movieIndex];

          const startTime = new Date(baseDate);
          startTime.setDate(startTime.getDate() + dayOffset);
          startTime.setHours(14 + slot * 4, 0, 0, 0); // 14:00 and 18:00 slots

          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + movie.durationMinutes + 20); // Movie duration + 20 min interval

          const seats = generateSeatsForScreen(screen, tierPricing);

          const show = new Show({
            movie: movie._id,
            theatre: theatre._id,
            screenName: screen.name,
            startTime,
            endTime,
            tierPricing,
            seats,
            status: 'scheduled',
          });

          await show.save();
          createdShows.push(show);
        }
      }
    }
  }
  if (log) console.log(`🎟️  Seeded ${createdShows.length} Shows with fully initialized seat inventories.`);

  // 6. Seed a sample Booking, Payment, and Notification for testing relational integrity
  const demoUser = createdUsers.find((u) => u.email === 'user@imovies.com');
  const sampleShow = createdShows[0];
  const sampleMovie = createdMovies.find((m) => m._id.toString() === sampleShow.movie.toString());
  const sampleTheatre = createdTheatres.find((t) => t._id.toString() === sampleShow.theatre.toString());

  // Mark 2 seats as booked in the show
  const bookedSeat1 = sampleShow.seats[10]; // Row B
  const bookedSeat2 = sampleShow.seats[11];
  bookedSeat1.status = 'booked';
  bookedSeat2.status = 'booked';

  const subTotal = bookedSeat1.price + bookedSeat2.price;
  const convenienceFee = 2.5;
  const tax = +(subTotal * 0.1).toFixed(2);
  const totalAmount = subTotal + convenienceFee + tax;

  const sampleBooking = new Booking({
    bookingReference: 'IMV-7X9K2P',
    user: demoUser._id,
    show: sampleShow._id,
    movie: sampleMovie._id,
    theatre: sampleTheatre._id,
    seats: [
      {
        seatId: bookedSeat1.seatId,
        row: bookedSeat1.row,
        number: bookedSeat1.number,
        tier: bookedSeat1.tier,
        price: bookedSeat1.price,
      },
      {
        seatId: bookedSeat2.seatId,
        row: bookedSeat2.row,
        number: bookedSeat2.number,
        tier: bookedSeat2.tier,
        price: bookedSeat2.price,
      },
    ],
    pricing: {
      subTotal,
      convenienceFee,
      tax,
      totalAmount,
    },
    status: 'confirmed',
    paymentStatus: 'paid',
    qrCodeData: `IMOVIES:BOOKING:IMV-7X9K2P:${demoUser._id}:${sampleShow._id}`,
  });
  await sampleBooking.save();

  // Attach bookingId to booked seats in show
  bookedSeat1.bookingId = sampleBooking._id;
  bookedSeat2.bookingId = sampleBooking._id;
  await sampleShow.save();

  // Create sample Payment (STRICT: No card number / CVV stored)
  const samplePayment = new Payment({
    booking: sampleBooking._id,
    user: demoUser._id,
    transactionId: 'TXN-9874561230-MOCK',
    amount: totalAmount,
    currency: 'USD',
    method: 'card_mock',
    paymentGateway: 'mock_gateway',
    status: 'succeeded',
    safeDetails: {
      lastFourDigits: '4242',
      cardBrand: 'Visa',
      maskedIdentifier: 'Visa ending in 4242',
    },
    paidAt: new Date(),
  });
  await samplePayment.save();

  sampleBooking.payment = samplePayment._id;
  await sampleBooking.save();

  // Create sample Notification
  const sampleNotification = new Notification({
    recipient: demoUser._id,
    title: 'Booking Confirmed!',
    message: `Your tickets for "${sampleMovie.title}" at ${sampleTheatre.name} have been confirmed. Booking Ref: IMV-7X9K2P.`,
    type: 'booking_confirmation',
    metadata: {
      bookingId: sampleBooking._id,
      showId: sampleShow._id,
      movieId: sampleMovie._id,
    },
  });
  await sampleNotification.save();

  if (log) {
    console.log(`💳 Seeded sample confirmed Booking (Ref: IMV-7X9K2P) and Payment record.`);
    console.log(`🔔 Seeded sample Notification for ${demoUser.email}.`);
    console.log(`✨ Database seeding completed successfully!`);
    console.log(`=================================================\n`);
  }

  return {
    usersCount: createdUsers.length,
    moviesCount: createdMovies.length,
    theatresCount: createdTheatres.length,
    showsCount: createdShows.length,
    bookingsCount: 1,
    paymentsCount: 1,
    notificationsCount: 1,
  };
}

// If run directly via CLI (e.g. `node seed/seeder.js` or `npm run seed`)
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase({ log: true });
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('❌ Seeding failed with error:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedDatabase,
  SEED_USERS,
  SEED_MOVIES,
  SEED_THEATRES,
};
