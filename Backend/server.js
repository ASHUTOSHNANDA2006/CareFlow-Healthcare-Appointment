import app from './src/app.js';
import { config } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { releaseExpiredHolds } from './src/services/appointment/booking.service.js';

// Connect Database
connectDB();

// Periodically release expired holds (every 1 minute)
setInterval(async () => {
  try {
    const released = await releaseExpiredHolds();
    if (released > 0) {
      console.log(`[Expired holds cleanup] Released ${released} expired slot locks.`);
    }
  } catch (error) {
    console.error('[Expired holds cleanup error]:', error.message);
  }
}, 60000);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${process.env.NODE_ENV || 'development'} mode`);
});
