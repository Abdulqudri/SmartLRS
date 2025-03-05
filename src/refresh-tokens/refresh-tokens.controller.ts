import { Controller } from '@nestjs/common';
import { RefreshTokensService } from './refresh-tokens.service';

@Controller('refresh-tokens')
export class RefreshTokensController {
  constructor(private readonly refreshTokensService: RefreshTokensService) {}
}
