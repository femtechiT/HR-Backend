import jwt, { SignOptions } from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback_jwt_secret';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '2h';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

interface TokenPayload {
  userId: number;
  email: string;
  role: number; // Changed from string to number to match the usage
}

class JwtUtil {
  static generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as any };
    return jwt.sign(payload, JWT_REFRESH_SECRET, options);
  }

  static verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}

export default JwtUtil;