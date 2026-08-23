import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment variables.');
  }
  return process.env.JWT_SECRET;
}

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
      return res.status(401).json({
        success: false,
        message: 'लॉगिन करणे आवश्यक आहे / Unauthorized. No token provided.'
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    const { data: user, error } = await db
      .from('users')
      .select('id, name, email, mobile, role, status')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error) throw error;

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'वापरकर्ता अवैध किंवा निष्क्रिय आहे / User is invalid or inactive.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'सत्र संपले आहे किंवा अवैध टोकन आहे / Invalid or expired token.'
    });
  }
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, email: user.email },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}
