function validateRegister(req, res, next) {
  const { email, password, name } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  next();
}

function validateRoom(req, res, next) {
  const { title, price, location, lat, lng } = req.body;
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Property title is required.' });
  }
  if (price === undefined || isNaN(price) || Number(price) <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive price.' });
  }
  if (!location || location.trim().length === 0) {
    return res.status(400).json({ error: 'Location description is required.' });
  }
  if (lat && isNaN(lat)) {
    return res.status(400).json({ error: 'Latitude must be a valid number.' });
  }
  if (lng && isNaN(lng)) {
    return res.status(400).json({ error: 'Longitude must be a valid number.' });
  }
  next();
}

function validateMessage(req, res, next) {
  const { receiverId, content } = req.body;
  if (!receiverId || isNaN(receiverId)) {
    return res.status(400).json({ error: 'Invalid recipient specified.' });
  }
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }
  next();
}

module.exports = {
  validateRegister,
  validateRoom,
  validateMessage
};
