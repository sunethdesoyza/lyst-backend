import * as admin from 'firebase-admin';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeApp();
  }

  async initializeApp() {
    if (this.initialized) {
      this.logger.debug('Firebase Admin already initialized');
      return admin;
    }

    try {
      this.logger.debug('Initializing Firebase Admin...');
      
      if (!admin.apps.length) {
        this.logger.debug('No Firebase app exists, creating new one...');
        
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

        this.logger.debug(`Project ID: ${projectId}`);
        this.logger.debug(`Client Email: ${clientEmail}`);

        if (!projectId || !privateKey || !clientEmail) {
          throw new Error('Missing required Firebase configuration');
        }

        // Clean up the private key
        privateKey = privateKey
          .replace(/\\n/g, '\n')
          .replace(/"/g, '')
          .trim();

        this.logger.debug('Private Key cleaned and ready to use');

        const credential = admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        });

        admin.initializeApp({
          credential,
          projectId,
        });
        
        this.logger.log('Firebase Admin initialized successfully');
        
        // Test the initialization
        await this.testFirebaseConnection();
      } else {
        this.logger.debug('Firebase app already exists');
      }
      
      this.initialized = true;
      return admin;
    } catch (error) {
      this.logger.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }

  private async testFirebaseConnection() {
    try {
      this.logger.debug('Testing Firebase connection...');
      // Create a test token and verify it
      const testToken = await admin.auth().createCustomToken('test-user');
      this.logger.debug('Firebase connection test successful');
    } catch (error) {
      this.logger.error('Firebase connection test failed:', error);
      throw error;
    }
  }
} 