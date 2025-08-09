import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDto, UserResponseDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with Firebase token' })
  @ApiBody({
    description: 'Firebase ID token for authentication',
    type: LoginDto,
    examples: {
      example1: {
        value: {
          idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or expired token' 
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('Received login request with body:', loginDto);
      console.log('Token from request:', loginDto.idToken);
      
      const decodedToken = await this.authService.verifyToken(loginDto.idToken);
      const userData = await this.authService.getUserData(decodedToken.uid);
      
      return {
        user: {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
        },
        token: loginDto.idToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
} 