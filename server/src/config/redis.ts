import Redis from 'ioredis';

let redisClient: Redis;

export const connectRedis = async (): Promise<Redis> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready to accept connections');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });

    await redisClient.connect();
    return redisClient;

  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

// Redis utility functions
export const redisSet = async (key: string, value: any, ttl?: number): Promise<void> => {
  const client = getRedisClient();
  const serializedValue = JSON.stringify(value);

  if (ttl) {
    await client.setex(key, ttl, serializedValue);
  } else {
    await client.set(key, serializedValue);
  }
};

export const redisGet = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  const value = await client.get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`Error parsing Redis value for key ${key}:`, error);
    return null;
  }
};

export const redisDel = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};

export const redisExists = async (key: string): Promise<boolean> => {
  const client = getRedisClient();
  const exists = await client.exists(key);
  return exists === 1;
};