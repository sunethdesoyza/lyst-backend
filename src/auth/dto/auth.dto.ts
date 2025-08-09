import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Firebase ID token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class LoginWithCredentialsDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Firebase refresh token',
    example: 'AMf-vBz...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RegisterUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  displayName?: string;
}

export class VerifyTokenDto {
  @ApiProperty({
    description: 'Firebase ID token to verify',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Firebase user UID',
    example: 'user123456789',
  })
  uid: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    description: 'User email verification status',
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'User last sign-in timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  lastSignInTime: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Authentication success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Firebase ID token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  idToken: string;

  @ApiProperty({
    description: 'Firebase refresh token',
    example: 'AMf-vBz...',
    required: false,
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'Token expiration time',
    example: '2024-01-01T01:00:00.000Z',
  })
  expiresAt: string;
}

export class TokenVerificationResponseDto {
  @ApiProperty({
    description: 'Token verification success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Decoded token information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Token expiration time',
    example: '2024-01-01T01:00:00.000Z',
  })
  expiresAt: string;

  @ApiProperty({
    description: 'Token issuer',
    example: 'https://securetoken.google.com/your-project-id',
  })
  issuer: string;
}

export class CredentialsLoginResponseDto {
  @ApiProperty({
    description: 'Authentication success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Firebase ID token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  idToken: string;

  @ApiProperty({
    description: 'Firebase refresh token',
    example: 'AMf-vBz...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time',
    example: '2024-01-01T01:00:00.000Z',
  })
  expiresAt: string;
} 