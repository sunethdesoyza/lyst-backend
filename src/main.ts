import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { FirebaseService } from './config/firebase.config';
import { AuthExceptionFilter } from './auth/filters/auth-exception.filter';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'debug', 'log', 'verbose'],
    });
    
    const configService = app.get(ConfigService);
    const firebaseService = app.get(FirebaseService);
    
    // Try to initialize Firebase, but don't fail if it doesn't work
    try {
      await firebaseService.initializeApp();
    } catch (error) {
      logger.warn('Firebase initialization failed, but application will continue');
    }
    
    // Enable CORS
    app.enableCors();
    
    // Serve static files
    app.useStaticAssets(join(__dirname, '..', 'public'));
    
    // Setup validation pipe
    app.useGlobalPipes(new ValidationPipe());
    
    // Setup Swagger
    const config = new DocumentBuilder()
      .setTitle('Lyst API')
      .setDescription('The Lyst API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
      
    const document = SwaggerModule.createDocument(app, config);
    
    // Configure Swagger UI options
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        deepLinking: true,
        defaultModelsExpandDepth: -1,
        defaultModelExpandDepth: 3,
        defaultModelRendering: 'model',
        displayOperationId: false,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        },
        requestSnippets: {
          generators: {
            curl_bash: {
              title: 'cURL (bash)',
              syntax: 'bash'
            }
          },
          defaultExpanded: true,
          languages: null
        }
      }
    });
    
    app.useGlobalFilters(new AuthExceptionFilter());
    
    const port = configService.get<number>('PORT', 3000);
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    
    await app.listen(port);
    logger.log(`🚀 Application is running in ${nodeEnv} mode on: http://localhost:${port}`);
    logger.log(`🔐 Login Interface available at: http://localhost:${port}`);
    logger.log(`📚 Swagger documentation is available at: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap(); 