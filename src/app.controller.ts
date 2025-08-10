import { Controller, Get, Res, Req, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
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
  getFirebaseConfig(@Req() req: Request) {
    // Validate request source
    if (!this.isValidRequest(req)) {
      throw new UnauthorizedException('Access Denied');
    }

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

  @Get('openapi.json')
  @ApiOperation({ summary: 'Get OpenAPI specification as JSON' })
  @ApiResponse({ 
    status: 200, 
    description: 'OpenAPI specification in JSON format for AI tools and API clients',
    schema: {
      type: 'object',
      description: 'Complete OpenAPI 3.0 specification document'
    }
  })
  getOpenApiSpec(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Return the OpenAPI specification structure with link to actual spec
    res.json({
      openapi: '3.0.0',
      info: {
        title: 'Lyst API',
        description: 'Comprehensive list management API with Firebase authentication and user-specific categories',
        version: '1.0.0',
        contact: {
          name: 'Lyst API',
          description: 'List management API with user-specific categories'
        }
      },
      servers: [
        {
          url: '/',
          description: 'Default server'
        }
      ],
      paths: {
        '/api': {
          get: {
            summary: 'Swagger UI',
            description: 'Interactive API documentation interface'
          }
        },
        '/api-spec': {
          get: {
            summary: 'OpenAPI Specification (JSON)',
            description: 'Complete machine-readable API specification for AI tools'
          }
        },
        '/openapi.json': {
          get: {
            summary: 'OpenAPI Information',
            description: 'This endpoint - API information and links'
          }
        }
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'Firebase authentication endpoints'
        },
        {
          name: 'Lists',
          description: 'List management operations'
        },
        {
          name: 'Categories',
          description: 'User-specific category management'
        },
        {
          name: 'Health',
          description: 'Application health checks'
        }
      ],
      ai_tools: {
        note: 'For AI tools: Download the complete specification from /api-spec',
        download_url: '/api-spec',
        format: 'application/json',
        authentication: 'None required for specification download'
      }
    });
  }

  @Get('swagger.json')
  @ApiOperation({ summary: 'Get Swagger specification as JSON' })
  @ApiResponse({ 
    status: 200, 
    description: 'Complete Swagger/OpenAPI specification in JSON format for AI tools and API clients',
    schema: {
      type: 'object',
      description: 'Full Swagger specification document'
    }
  })
  getSwaggerSpec(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Return comprehensive API information with links to actual specification
    res.json({
      message: 'Swagger specification available',
      swagger_ui: '/api',
      openapi_spec: '/openapi.json',
      swagger_json: '/swagger.json',
      api_spec_download: '/api-spec',
      description: 'This API provides comprehensive list management with Firebase authentication',
      version: '1.0',
      contact: {
        name: 'Lyst API',
        description: 'List management API with user-specific categories'
      },
      endpoints: {
        auth: '/auth/*',
        lists: '/lists/*',
        categories: '/categories/*',
        health: '/health'
      },
      ai_tools: {
        note: 'For AI tools: Download the complete specification from /api-spec',
        download_url: '/api-spec',
        format: 'application/json',
        authentication: 'None required for specification download',
        usage: 'Use this endpoint to get the machine-readable API specification for analysis'
      }
    });
  }

  @Get('api-json')
  @ApiOperation({ summary: 'Get API information' })
  @ApiResponse({ 
    status: 200, 
    description: 'API information and documentation links',
    schema: {
      type: 'object',
      description: 'API information for AI tools and developers'
    }
  })
  getApiInfo(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Return a reference to the Swagger documentation
    res.json({
      message: 'OpenAPI specification available',
      swagger_ui: '/api',
      openapi_spec: '/openapi.json',
      description: 'This API provides comprehensive list management with Firebase authentication',
      version: '1.0',
      contact: {
        name: 'Lyst API',
        description: 'List management API with user-specific categories'
      },
      endpoints: {
        auth: '/auth/*',
        lists: '/lists/*',
        categories: '/categories/*',
        health: '/health'
      }
    });
  }

  @Get('api-spec')
  @ApiOperation({ summary: 'Get OpenAPI specification as JSON (Public)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Complete OpenAPI specification in JSON format for AI tools and API clients (No authentication required)',
    schema: {
      type: 'object',
      description: 'Full OpenAPI specification document'
    }
  })
  getApiSpec(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Return comprehensive API information with links to actual specification
    res.json({
      message: 'OpenAPI specification available',
      swagger_ui: '/api',
      openapi_spec: '/openapi.json',
      swagger_json: '/swagger.json',
      api_spec_download: '/api-spec',
      description: 'This API provides comprehensive list management with Firebase authentication',
      version: '1.0',
      contact: {
        name: 'Lyst API',
        description: 'List management API with user-specific categories'
      },
      endpoints: {
        auth: '/auth/*',
        lists: '/lists/*',
        categories: '/categories/*',
        health: '/health'
      },
      ai_tools: {
        note: 'For AI tools: This endpoint provides API information. Use /api for full Swagger spec.',
        swagger_url: '/api',
        format: 'application/json',
        authentication: 'Required for most endpoints, but not for this info endpoint'
      }
    });
  }

  private isValidRequest(req: Request): boolean {
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referer');
    const origin = req.get('Origin');
    
    // Block obvious API testing tools
    if (!userAgent || userAgent.includes('curl') || userAgent.includes('Postman')) {
      console.log('❌ Blocked request from API testing tool:', userAgent);
      return false;
    }
    
    // Check referer if present
    if (referer && !referer.includes('lyst.sunethdesoyza.live')) {
      console.log('❌ Blocked request with invalid referer:', referer);
      return false;
    }
    
    // Check origin if present
    if (origin && origin !== 'https://lyst.sunethdesoyza.live') {
      console.log('❌ Blocked request with invalid origin:', origin);
      return false;
    }
    
    console.log('✅ Valid request from:', { userAgent, referer, origin });
    return true;
  }
} 