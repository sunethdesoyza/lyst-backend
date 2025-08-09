import { Injectable, UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
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

  async createUser(email: string, password: string, displayName?: string): Promise<admin.auth.UserRecord> {
    try {
      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }

      if (password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long');
      }

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      console.log('Successfully created new user:', userRecord.uid);
      return userRecord;
    } catch (error) {
      console.error('User creation error:', error);
      
      if (error.code === 'auth/email-already-exists') {
        throw new BadRequestException('User with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        throw new BadRequestException('Invalid email format');
      } else if (error.code === 'auth/weak-password') {
        throw new BadRequestException('Password is too weak');
      }
      throw new InternalServerErrorException(`Error creating user: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string }> {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      // Note: Firebase Admin SDK doesn't directly support refresh token exchange
      // This would typically be done on the client side with Firebase Auth SDK
      // For server-side refresh, you'd need to implement custom logic or use Firebase Auth REST API
      
      throw new BadRequestException('Token refresh should be handled on the client side with Firebase Auth SDK');
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      if (!uid) {
        throw new BadRequestException('User ID is required');
      }

      await admin.auth().deleteUser(uid);
      console.log('Successfully deleted user:', uid);
    } catch (error) {
      console.error('User deletion error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new BadRequestException('User not found');
      }
      throw new InternalServerErrorException(`Error deleting user: ${error.message}`);
    }
  }

  async updateUser(uid: string, updates: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      if (!uid) {
        throw new BadRequestException('User ID is required');
      }

      const userRecord = await admin.auth().updateUser(uid, updates);
      console.log('Successfully updated user:', uid);
      return userRecord;
    } catch (error) {
      console.error('User update error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new BadRequestException('User not found');
      } else if (error.code === 'auth/email-already-exists') {
        throw new BadRequestException('Email already in use by another user');
      }
      throw new InternalServerErrorException(`Error updating user: ${error.message}`);
    }
  }

  async listUsers(maxResults?: number, nextPageToken?: string): Promise<admin.auth.ListUsersResult> {
    try {
      const listUsersResult = await admin.auth().listUsers(maxResults, nextPageToken);
      return listUsersResult;
    } catch (error) {
      console.error('List users error:', error);
      throw new InternalServerErrorException(`Error listing users: ${error.message}`);
    }
  }

  async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    try {
      if (!uid) {
        throw new BadRequestException('User ID is required');
      }

      await admin.auth().setCustomUserClaims(uid, customClaims);
      console.log('Successfully set custom claims for user:', uid);
    } catch (error) {
      console.error('Set custom claims error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new BadRequestException('User not found');
      }
      throw new InternalServerErrorException(`Error setting custom claims: ${error.message}`);
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      if (!uid) {
        throw new BadRequestException('User ID is required');
      }

      await admin.auth().revokeRefreshTokens(uid);
      console.log('Successfully revoked refresh tokens for user:', uid);
    } catch (error) {
      console.error('Revoke refresh tokens error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new BadRequestException('User not found');
      }
      throw new InternalServerErrorException(`Error revoking refresh tokens: ${error.message}`);
    }
  }
} 