import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'miguel-abad-swiss-balloon-portfolio-secret-2026';

export function signAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAdmin(req, res, next) {
  try {
    const cookieToken = req.cookies?.admin_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
