import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, AuthResponseDto } from './dto';
import { UserResponseDto } from '../users/dto';
import { UserDocument } from '../users/schemas/user.schema';

/**
 * Authentication Service
 * 
 * Handles authentication business logic including:
 * - Credential validation
 * - JWT token generation
 * - Password hashing
 * - Login orchestration
 * 
 * Security Features:
 * - Uses bcrypt for password hashing and comparison
 * - Generates JWT tokens with expiration
 * - Validates account status before login
 * - Generic error messages (prevents user enumeration)
 * - Constant-time password comparison
 * 
 * Dependencies:
 * - JwtService: Generates and validates JWT tokens
 * - UsersService: Accesses user data from database
 */
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  /**
   * Validate user credentials
   * 
   * @param email - User email address
   * @param password - Plain text password
   * @returns User document (without password) or null if invalid
   * 
   * Process:
   * 1. Find user by email (including password field)
   * 2. Check if user exists
   * 3. Check if account is active
   * 4. Compare password with bcrypt (constant-time)
   * 5. Return user without password
   * 
   * Security:
   * - Returns null for all failure cases (generic response)
   * - Uses bcrypt.compare for constant-time comparison
   * - Checks account status (isActive)
   * - Never exposes why validation failed
   * 
   * Usage:
   *   const user = await authService.validateUser(email, password);
   *   if (!user) {
   *     throw new UnauthorizedException('Invalid credentials');
   *   }
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    // Find user with password field included
    const user = await this.usersService.findByEmail(email, true);

    // User not found - return null
    if (!user) {
      return null;
    }

    // Account is inactive - return null
    if (!user.isActive) {
      return null;
    }

    // Compare password using bcrypt (constant-time comparison)
    const isPasswordValid = await user.comparePassword(password);

    // Password doesn't match - return null
    if (!isPasswordValid) {
      return null;
    }

    // Valid credentials - return user
    // Note: Password field will be excluded by schema transform
    return user;
  }

  /**
   * Handle user login
   * 
   * @param loginDto - Login credentials (email, password)
   * @returns Authentication response with JWT token and user data
   * @throws UnauthorizedException if credentials are invalid
   * 
   * Process:
   * 1. Validate credentials
   * 2. Generate JWT access token
   * 3. Update last login timestamp
   * 4. Return standardized response with token and user data
   * 
   * Security:
   * - Generic error message (doesn't reveal why login failed)
   * - JWT token has expiration (configured in .env)
   * - User password never included in response
   * 
   * Usage:
   *   const response = await authService.login({ email, password });
   *   // Response: { success: true, data: { token, user } }
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Validate credentials
    const user = await this.validateUser(email, password);

    if (!user) {
      // Generic error message for security
      // Doesn't reveal whether email exists or password is wrong
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT access token
    const payload = {
      sub: user._id.toString(), // Subject (user ID)
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    // Update last login timestamp (fire and forget)
    // No need to await as it doesn't affect response
    this.usersService.updateLastLogin(user._id.toString());

    // Map user document to response DTO
    const userResponse: UserResponseDto = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };

    // Return standardized response
    return {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse,
      },
    };
  }

  /**
   * Hash password with bcrypt
   * 
   * @param password - Plain text password
   * @returns Hashed password
   * 
   * Process:
   * 1. Generate salt with configured rounds
   * 2. Hash password with salt
   * 3. Return bcrypt hash
   * 
   * Configuration:
   * - SALT_ROUNDS = 10 (industry standard)
   * - Takes ~100ms to hash (prevents brute force)
   * - Higher rounds = more secure but slower
   * 
   * Usage:
   *   // In seed script
   *   const hashedPassword = await authService.hashPassword('password123');
   *   await usersService.create({ ..., password: hashedPassword });
   * 
   * Security:
   * - Salt is automatically included in hash
   * - Each hash is unique even for same password
   * - One-way function (cannot reverse)
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }
}
