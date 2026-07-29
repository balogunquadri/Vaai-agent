import { Router, Request, Response, NextFunction } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createInsforgeClient, logger } from '@vaai/shared';
import { AuthToken, User } from '@vaai/types';

const router = Router();

// Extend Express request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function getInsforgeClient() {
  return createInsforgeClient(
    process.env.INSFORGE_URL || '',
    process.env.INSFORGE_API_KEY || ''
  );
}

function generateTokens(userId: string, email: string) {
  const secret = process.env.AUTH_JWT_SECRET || 'default-secret';
  const accessToken = jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

function verifyToken(token: string): any {
  try {
    const secret = process.env.AUTH_JWT_SECRET || 'default-secret';
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

/**
 * POST /auth/register
 * Create a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const insforge = getInsforgeClient();

    // Check if user already exists
    const { data: existing, error: checkError } = await insforge
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (checkError) {
      logger.error(checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const { data: newUser, error: createError } = await insforge
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: firstName || null,
        last_name: lastName || null,
        role: 'user',
      })
      .select();

    if (createError || !newUser || newUser.length === 0) {
      logger.error(createError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const user = newUser[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Authenticate user with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const insforge = getInsforgeClient();

    // Find user
    const { data: users, error } = await insforge
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (error) {
      logger.error(error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const passwordValid = await bcryptjs.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Update last login
    await insforge
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    res.json({
      token: accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const insforge = getInsforgeClient();

    // Verify user still exists
    const { data: users, error } = await insforge
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.userId)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email
    );

    res.json({
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    });
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * Middleware to verify JWT token
 */
export function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  next();
}

/**
 * POST /auth/logout
 * Logout user (client-side token deletion in practice)
 */
router.post('/logout', (req: Request, res: Response) => {
  // Token invalidation could be done with a blacklist or Redis
  // For now, client-side deletion is sufficient
  res.json({ success: true });
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', verifyAuth, async (req: Request, res: Response) => {
  try {
    const insforge = getInsforgeClient();

    const { data: users, error } = await insforge
      .from('users')
      .select('id, email, first_name, last_name, role, created_at')
      .eq('id', req.userId)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put('/profile', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName } = req.body;

    const insforge = getInsforgeClient();

    const { data: updated, error } = await insforge
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
      })
      .eq('id', req.userId)
      .select();

    if (error) {
      logger.error(error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    const user = updated?.[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

/**
 * POST /auth/change-password
 * Change user password
 */
router.post('/change-password', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
      });
    }

    const insforge = getInsforgeClient();

    // Get current password hash
    const { data: users, error } = await insforge
      .from('users')
      .select('password_hash')
      .eq('id', req.userId)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    const passwordValid = await bcryptjs.compare(
      currentPassword,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await insforge
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', req.userId);

    if (updateError) {
      logger.error(updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

export default router;
