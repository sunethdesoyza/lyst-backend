import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { join } from 'path';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  serveLoginPage(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  @Get('health')
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Get('api/firebase-config')
  @ApiOperation({
    summary: 'Get Firebase configuration',
    description: 'Retrieve Firebase configuration for client-side authentication'
  })
  @ApiResponse({
    status: 200,
    description: 'Firebase configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
        authDomain: { type: 'string' },
        projectId: { type: 'string' },
        storageBucket: { type: 'string' },
        messagingSenderId: { type: 'string' },
        appId: { type: 'string' },
        measurementId: { type: 'string' }
      }
    }
  })
  getFirebaseConfig() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const apiKey = this.configService.get<string>('FIREBASE_API_KEY');
    
    if (!projectId || !apiKey) {
      throw new Error('Firebase configuration not available');
    }

    return {
      apiKey: apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
      messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGING_SENDER_ID', '936036645672'),
      appId: this.configService.get<string>('FIREBASE_APP_ID', '1:936036645672:web:675865f75c539f2aa92e1d'),
      measurementId: this.configService.get<string>('FIREBASE_MEASUREMENT_ID', 'G-P77WVKL62E')
    };
  }
} 