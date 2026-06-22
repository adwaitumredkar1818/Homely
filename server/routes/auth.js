const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma, JWT_SECRET } = require('../config');
const { validateRegister } = require('../middleware/validator');

router.post('/register', validateRegister, async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'TENANT'
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

const resetTokens = new Map();

// Request Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User with this email does not exist.' });

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    resetTokens.set(token, email);

    setTimeout(() => resetTokens.delete(token), 10 * 60 * 1000);

    res.json({ 
      success: true, 
      message: 'Demo recovery token generated.', 
      token 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!resetTokens.has(token)) {
      return res.status(400).json({ error: 'Invalid or expired recovery token.' });
    }

    const email = resetTokens.get(token);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    resetTokens.delete(token);
    res.json({ success: true, message: 'Password has been successfully updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
