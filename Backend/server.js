import app from './src/app.js';
import { config } from './src/config/env.js';
import { connectDB } from './src/config/db.js';

// Connect Database
connectDB();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${process.env.NODE_ENV || 'development'} mode`);
});
