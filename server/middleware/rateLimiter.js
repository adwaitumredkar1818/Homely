const ipRequestCounts = new Map();

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipRequestCounts.has(ip)) {
      ipRequestCounts.set(ip, []);
    }

    const requests = ipRequestCounts.get(ip).filter(timestamp => now - timestamp < windowMs);
    
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const effectiveMax = isDev ? 10000 : max;

    if (requests.length >= effectiveMax) {
      return res.status(429).json({ error: message });
    }

    requests.push(now);
    ipRequestCounts.set(ip, requests);
    next();
  };
}

module.exports = rateLimiter;
