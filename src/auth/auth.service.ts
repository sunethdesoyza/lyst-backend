import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      
      console.log('Received token:', token);
      console.log('Token length:', token.length);
      console.log('Token type:', typeof token);
      
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token has expired');
      } else if (error.code === 'auth/invalid-id-token') {
        throw new UnauthorizedException('Invalid token');
      } else if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException('Invalid token format');
      }
      throw new InternalServerErrorException(`Error verifying token: ${error.message}`);
    }
  }

  async getUserData(uid: string): Promise<admin.auth.UserRecord> {
    try {
      if (!uid) {
        throw new UnauthorizedException('No user ID provided');
      }
      
      return await admin.auth().getUser(uid);
    } catch (error) {
      console.error('User data fetch error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new UnauthorizedException('User not found');
      }
      throw new InternalServerErrorException(`Error fetching user data: ${error.message}`);
    }
  }
} 