import Bull from 'bull';

export const categorizeQueue = new Bull('categorize', {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
  },
});