// import { createClient } from 'redis';
// import dotenv from 'dotenv';
// dotenv.config();

// const redisClient = createClient({
//     url: process.env.REDIS_URL || 'redis://localhost:6379'
// });

// redisClient.on('error', (err) => console.log('Redis Client Error', err));

// (async () => {
//     await redisClient.connect();
//     console.log('Connected to Redis');
// })();

// export default redisClient;
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false
  }
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis (Upstash)');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error', err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
})();

export default redisClient;
