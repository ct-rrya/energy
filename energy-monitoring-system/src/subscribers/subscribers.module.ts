import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';
import { Subscriber, SubscriberSchema } from './schemas/subscriber.schema';

/**
 * Subscribers Module
 *
 * Manages Facebook Messenger subscribers.
 *
 * Features:
 * - Subscribe/unsubscribe users
 * - Track last interaction
 * - Notification preferences
 * - Active subscriber queries
 *
 * Exported For:
 * - Messenger Module (commands)
 * - Notifications Module (targeting)
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Subscriber.name,
        schema: SubscriberSchema,
      },
    ]),
  ],
  controllers: [SubscribersController],
  providers: [SubscribersService],
  exports: [SubscribersService],
})
export class SubscribersModule {}
