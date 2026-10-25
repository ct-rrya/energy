import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Player } from '../schemas/player.schema';

export const CurrentPlayer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Player => {
    const request = ctx.switchToHttp().getRequest();
    return request.player;
  },
);
