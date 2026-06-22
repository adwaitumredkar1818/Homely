const ipRequestCounts = new Map();

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipRequestCounts.has(ip)) {
      ipRequestCounts.set(ip, []);
    }

    const requests = ipRequestCounts.get(ip).filter(timestamp => now - timestamp < windowMs);
    
    if (requests.length >= max) {
      return res.status(429).json({ error: message });
    }

    requests.push(now);
    ipRequestCounts.set(ip, requests);
    next();
  };
}

module.exports = rateLimiter;
