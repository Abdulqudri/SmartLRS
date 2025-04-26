import { IsDate, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  token: string;

  @IsString()
  userId: string;

  @IsDate()
  expiryDate: Date;
}
