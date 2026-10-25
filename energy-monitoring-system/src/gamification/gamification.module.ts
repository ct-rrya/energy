import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { PlayersModule } from '../players/players.module';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { OptionalPlayerSessionGuard } from './guards/optional-player-session.guard';

@Module({
  imports: [
    PlayersModule,
    MongooseModule.forFeature([{ name: Player.name, schema: PlayerSchema }]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService, OptionalPlayerSessionGuard],
  exports: [GamificationService, OptionalPlayerSessionGuard],
})
export class GamificationModule {}
