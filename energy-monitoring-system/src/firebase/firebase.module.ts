import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * Firebase Module
 *
 * Provides Firebase Admin SDK integration for real-time updates.
 * Marked as @Global so FirebaseService is available everywhere without imports.
 *
 * Usage:
 * ```typescript
 * constructor(private firebaseService: FirebaseService) {}
 *
 * await this.firebaseService.pushLatestReading({
 *   voltage: 5.2,
 *   current: 0.15,
 *   ...
 * });
 * ```
 */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
