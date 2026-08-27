import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * Users Module
 * 
 * Manages user-related functionality including:
 * - User schema and database model
 * - User service (database operations)
 * - User controller (API endpoints)
 * 
 * Architecture:
 * - Schema: Defines User structure in MongoDB
 * - Service: Handles database operations
 * - Controller: Handles HTTP requests (profile endpoints)
 * 
 * Exports:
 * - UsersService: Used by AuthModule for authentication
 * - Can be imported by other modules that need user data
 */
@Module({
  imports: [
    // Register User schema with Mongoose
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export for use in AuthModule
})
export class UsersModule {}
