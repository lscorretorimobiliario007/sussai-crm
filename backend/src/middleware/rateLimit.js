const buckets = new Map();

/**
 * In-memory rate limiter (MVP). Suitable for single-instance deploys.
 * windowMs: window size; max: max requests per key in the window.
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 30, keyPrefix = "rl" } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ erro: "Muitas tentativas. Tente novamente em instantes." });
    }

    return next();
  };
}

// Periodic cleanup to avoid unbounded Map growth
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}, 60 * 1000).unref?.();
