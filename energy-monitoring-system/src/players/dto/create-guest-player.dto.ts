import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateGuestPlayerDto {
  @ApiProperty({
    description: 'Chosen public player display username',
    example: 'EcoWarrior42',
    minLength: 3,
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores (_), and hyphens (-)',
  })
  username: string;
}
