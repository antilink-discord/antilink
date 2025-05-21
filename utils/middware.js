import 'dotenv/config';
export function verifyApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.API_SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API key' });
  }

  next(); //
}