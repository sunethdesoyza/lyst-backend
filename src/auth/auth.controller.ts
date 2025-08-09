import { Controller, Post, Get, Put, Delete, Body, Param, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { 
  LoginDto, 
  UserResponseDto, 
  RegisterUserDto, 
  VerifyTokenDto, 
  RefreshTokenDto,
  AuthResponseDto,
  TokenVerificationResponseDto 
} from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Login with Firebase token',
    description: 'Authenticate user with Firebase ID token and return user information'
  })
  @ApiBody({
    description: 'Firebase ID token for authentication',
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Login with Firebase token',
        value: {
          idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or expired token' 
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      console.log('Received login request with body:', loginDto);
      console.log('Token from request:', loginDto.idToken);
      
      const decodedToken = await this.authService.verifyToken(loginDto.idToken);
      const userData = await this.authService.getUserData(decodedToken.uid);
      
      return {
        success: true,
        user: {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified,
          createdAt: userData.metadata.creationTime,
          lastSignInTime: userData.metadata.lastSignInTime,
        },
        idToken: loginDto.idToken,
        expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'Register new user',
    description: 'Create a new user account with email and password'
  })
  @ApiBody({
    description: 'User registration information',
    type: RegisterUserDto,
    examples: {
      example1: {
        summary: 'Register new user',
        value: {
          email: 'user@example.com',
          password: 'password123',
          displayName: 'John Doe'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input or user already exists' 
  })
  async register(@Body() registerDto: RegisterUserDto): Promise<UserResponseDto> {
    try {
      const userRecord = await this.authService.createUser(
        registerDto.email,
        registerDto.password,
        registerDto.displayName
      );
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  @Post('verify')
  @ApiOperation({ 
    summary: 'Verify Firebase token',
    description: 'Verify a Firebase ID token and return decoded information'
  })
  @ApiBody({
    description: 'Firebase ID token to verify',
    type: VerifyTokenDto,
    examples: {
      example1: {
        summary: 'Verify token',
        value: {
          idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token verified successfully',
    type: TokenVerificationResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or expired token' 
  })
  async verifyToken(@Body() verifyDto: VerifyTokenDto): Promise<TokenVerificationResponseDto> {
    try {
      const decodedToken = await this.authService.verifyToken(verifyDto.idToken);
      const userData = await this.authService.getUserData(decodedToken.uid);
      
      return {
        success: true,
        user: {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified,
          createdAt: userData.metadata.creationTime,
          lastSignInTime: userData.metadata.lastSignInTime,
        },
        expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
        issuer: decodedToken.iss,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Refresh Firebase token',
    description: 'Refresh a Firebase ID token using refresh token (Note: This should be handled on client side)'
  })
  @ApiBody({
    description: 'Firebase refresh token',
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Refresh token',
        value: {
          refreshToken: 'AMf-vBz...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Token refresh should be handled on client side' 
  })
  async refreshToken(@Body() refreshDto: RefreshTokenDto) {
    try {
      const result = await this.authService.refreshToken(refreshDto.refreshToken);
      return {
        success: true,
        message: 'Token refresh should be handled on the client side with Firebase Auth SDK',
        ...result
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  @Get('user/:uid')
  @UseGuards(AuthGuard('firebase'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user information',
    description: 'Retrieve user information by UID (requires authentication)'
  })
  @ApiParam({
    name: 'uid',
    description: 'Firebase user UID',
    example: 'user123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User information retrieved successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async getUser(@Param('uid') uid: string): Promise<UserResponseDto> {
    try {
      const userData = await this.authService.getUserData(uid);
      
      return {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        emailVerified: userData.emailVerified,
        createdAt: userData.metadata.creationTime,
        lastSignInTime: userData.metadata.lastSignInTime,
      };
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  @Get('users')
  @UseGuards(AuthGuard('firebase'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'List users',
    description: 'List all users in the Firebase project (requires authentication)'
  })
  @ApiQuery({
    name: 'maxResults',
    description: 'Maximum number of users to return',
    required: false,
    type: Number,
    example: 100
  })
  @ApiQuery({
    name: 'nextPageToken',
    description: 'Next page token for pagination',
    required: false,
    type: String
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  async listUsers(
    @Query('maxResults') maxResults?: number,
    @Query('nextPageToken') nextPageToken?: string
  ) {
    try {
      const result = await this.authService.listUsers(maxResults, nextPageToken);
      return {
        success: true,
        users: result.users.map(user => ({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          createdAt: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        })),
        nextPageToken: result.pageToken,
      };
    } catch (error) {
      console.error('List users error:', error);
      throw error;
    }
  }

  @Delete('user/:uid')
  @UseGuards(AuthGuard('firebase'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete user',
    description: 'Delete a user account by UID (requires authentication)'
  })
  @ApiParam({
    name: 'uid',
    description: 'Firebase user UID',
    example: 'user123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async deleteUser(@Param('uid') uid: string) {
    try {
      await this.authService.deleteUser(uid);
      return {
        success: true,
        message: `User ${uid} deleted successfully`
      };
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  @Post('user/:uid/revoke-tokens')
  @UseGuards(AuthGuard('firebase'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Revoke user refresh tokens',
    description: 'Revoke all refresh tokens for a user (requires authentication)'
  })
  @ApiParam({
    name: 'uid',
    description: 'Firebase user UID',
    example: 'user123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Refresh tokens revoked successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async revokeUserTokens(@Param('uid') uid: string) {
    try {
      await this.authService.revokeRefreshTokens(uid);
      return {
        success: true,
        message: `Refresh tokens for user ${uid} revoked successfully`
      };
    } catch (error) {
      console.error('Revoke tokens error:', error);
      throw error;
    }
  }
} 