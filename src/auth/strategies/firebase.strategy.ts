import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase') {
  private readonly logger = new Logger(FirebaseAuthStrategy.name);

  constructor() {
    super();
    this.logger.log('FirebaseAuthStrategy initialized');
  }

  async validate(req: any): Promise<any> {
    try {
      this.logger.debug('Starting token validation...');
      
      const authHeader = req.headers.authorization;
      this.logger.debug(`Authorization header: ${authHeader?.substring(0, 20)}...`);

      if (!authHeader) {
        this.logger.warn('No Authorization header found');
        throw new UnauthorizedException({
          message: 'No Authorization header found',
          error: 'Missing Authorization Header',
        });
      }

      // Extract token whether it's prefixed with Bearer or not
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.split('Bearer ')[1] 
        : authHeader;

      this.logger.debug(`Token length: ${token.length}`);
      this.logger.debug(`Token first 10 chars: ${token.substring(0, 10)}...`);
      this.logger.debug(`Token last 10 chars: ${token.substring(token.length - 10)}...`);

      try {
        this.logger.debug('Attempting to verify token with Firebase Admin...');
        const decodedToken = await admin.auth().verifyIdToken(token, true);
        this.logger.debug(`Token decoded successfully: ${JSON.stringify(decodedToken)}`);
        this.logger.debug(`Token expiration: ${new Date(decodedToken.exp * 1000).toISOString()}`);
        this.logger.debug(`Current time: ${new Date().toISOString()}`);
        
        return {
          uid: decodedToken.uid,
          email: decodedToken.email,
        };
      } catch (firebaseError) {
        this.logger.error(`Firebase token validation failed: ${firebaseError.message}`);
        this.logger.error(`Firebase error code: ${firebaseError.code}`);
        this.logger.error(`Firebase error stack: ${firebaseError.stack}`);
        
        if (firebaseError.code === 'auth/id-token-expired') {
          throw new UnauthorizedException({
            message: 'Authentication token has expired',
            error: 'Token Expired',
          });
        }
        
        if (firebaseError.code === 'auth/argument-error') {
          throw new UnauthorizedException({
            message: 'Invalid authentication token format',
            error: 'Invalid Token Format',
          });
        }
        
        throw new UnauthorizedException({
          message: 'Invalid authentication token',
          error: 'Invalid Token',
          details: firebaseError.message,
        });
      }
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }
} 