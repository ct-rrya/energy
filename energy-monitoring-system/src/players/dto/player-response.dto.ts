import { ApiProperty } from '@nestjs/swagger';

export class PlayerProfileDto {
  @ApiProperty({ example: 'eco_player_9b1deb4d3b7d4bf9' })
  playerId: string;

  @ApiProperty({ example: 'EcoWarrior42' })
  username: string;

  @ApiProperty({ example: '2026-10-23T06:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-23T06:05:00.000Z' })
  lastActiveAt: Date;

  @ApiProperty({ example: 120 })
  xp?: number;

  @ApiProperty({ example: 2 })
  level?: number;

  @ApiProperty({ example: ['mission_piezo_intro'] })
  completedMissions?: string[];

  @ApiProperty({ example: [{ badgeId: 'first_steps', unlockedAt: '2026-10-23T06:05:00.000Z' }] })
  badges?: Array<{ badgeId: string; unlockedAt: Date }>;
}

export class GuestPlayerSessionResponseDto {
  @ApiProperty()
  player: PlayerProfileDto;

  @ApiProperty({
    description: 'Unpredictable random session token for browser recognition',
    example: 'd41d8cd98f00b204e9800998ecf8427e...',
  })
  sessionToken: string;
}
