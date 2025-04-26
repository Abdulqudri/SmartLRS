import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Types } from 'mongoose';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    let userId: Types.ObjectId;
    try {
      userId = new Types.ObjectId(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid user ID');
    }
    const user = await this.userService.findOneById(userId);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { userId: userId, email: payload.email, role: payload.role };
  }
}
