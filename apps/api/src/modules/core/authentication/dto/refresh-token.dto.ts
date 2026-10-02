import { IsString, IsUUID, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
