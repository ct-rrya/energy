import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreateGuestPlayerDto } from './dto/create-guest-player.dto';
import {
  GuestPlayerSessionResponseDto,
  PlayerProfileDto,
} from './dto/player-response.dto';
import { PlayerSessionGuard } from './guards/player-session.guard';
import { CurrentPlayer } from './decorators/current-player.decorator';
import { Player } from './schemas/player.schema';

@ApiTags('Guest Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  /**
   * POST /api/players/guest
   * Create a new guest player profile
   */
  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new guest player',
    description:
      'Creates a guest player with a unique username. Generates an unguessable session token for browser recognition.',
  })
  @ApiResponse({
    status: 201,
    description: 'Player profile created successfully',
    type: GuestPlayerSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid username format or prohibited language',
  })
  @ApiResponse({
    status: 409,
    description: 'Username is already taken',
  })
  async createGuestPlayer(
    @Body() dto: CreateGuestPlayerDto,
  ): Promise<GuestPlayerSessionResponseDto> {
    return this.playersService.createGuestPlayer(dto);
  }

  /**
   * GET /api/players/me
   * Retrieve currently authenticated guest player profile
   */
  @Get('me')
  @UseGuards(PlayerSessionGuard)
  @ApiOperation({
    summary: 'Get current player profile',
    description:
      'Validates the session token from headers and returns the player profile.',
  })
  @ApiHeader({
    name: 'X-Guest-Session',
    description: 'Guest player session token',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Current player profile returned',
    type: PlayerProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing guest player session',
  })
  async getProfile(
    @CurrentPlayer() player: Player,
  ): Promise<PlayerProfileDto> {
    return this.playersService.getProfile(player);
  }

  /**
   * POST /api/players/logout
   * Terminate active guest player session
   */
  @Post('logout')
  @UseGuards(PlayerSessionGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End guest player session',
    description:
      'Invalidates the active session token on the backend while preserving the player record.',
  })
  @ApiResponse({
    status: 200,
    description: 'Guest session terminated',
  })
  async logout(@Req() req: any): Promise<{ success: boolean; message: string }> {
    const token = req.playerSessionToken;
    return this.playersService.logout(token);
  }
}
