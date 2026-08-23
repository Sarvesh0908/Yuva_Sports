import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ganpati_bappa_morya_mandal_secure_jwt_secret_2026';

export async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'लॉगिन करणे आवश्यक आहे / Unauthorized. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await db.get('SELECT id, name, email, mobile, role, status FROM users WHERE id = ?', [decoded.id]);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'वापरकर्ता अवैध किंवा निष्क्रिय आहे / User is invalid or inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'सत्र संपले आहे किंवा अवैध टोकन आहे / Invalid or expired token.' });
  }
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
