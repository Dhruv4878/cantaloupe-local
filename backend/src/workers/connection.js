require('dotenv').config();

// Prefer standard Redis URL if present (rediss:// for TLS)
const rawUrl = process.env.REDIS_URL;
const hostEnv = process.env.REDIS_HOST;
const portEnv = process.env.REDIS_PORT || '6379';
const userEnv = process.env.REDIS_USERNAME || 'default';
const passEnv =
  process.env.REDIS_PASSWORD ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.UPSTASH_REDIS_PASSWORD;

let redisUrl = rawUrl;

// Treat placeholder values as missing
if (redisUrl && redisUrl.trim().toLowerCase() === 'default') {
  redisUrl = undefined;
}

// If no redis URL provided, but host is set, build a URL
if (!redisUrl && hostEnv) {
  const protocol = process.env.REDIS_TLS === 'true' ? 'rediss' : 'redis';
  const authPart = passEnv ? `${encodeURIComponent(userEnv || 'default')}:${encodeURIComponent(passEnv)}@` : '';
  redisUrl = `${protocol}://${authPart}${hostEnv}:${portEnv}`;
}

// If still no URL, fall back to Upstash REST credentials by constructing a redis URL
if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Upstash REST URL is https://<host>; derive host for rediss://
  try {
    const u = new URL(process.env.UPSTASH_REDIS_REST_URL);
    const host = u.hostname;
    const protocol = 'rediss';
    const authPart = `${encodeURIComponent('default')}:${encodeURIComponent(process.env.UPSTASH_REDIS_REST_TOKEN)}@`;
    redisUrl = `${protocol}://${authPart}${host}:6379`;
  } catch (e) {
    // ignore, will error below
  }
}

// Final validation: require a usable URL
if (!redisUrl) {
  console.warn('[workers] Redis connection not configured. Queue features will be disabled.');
  module.exports = { connection: null };
  return;
}

const connection = {
  url: redisUrl,
  username: userEnv || undefined,
  password: passEnv || undefined,
};

module.exports = { connection };
