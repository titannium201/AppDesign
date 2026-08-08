import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        'ti-recovery-demo-secret-change-in-production',
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{ userId: string; email: string }> {
    return { userId: payload.sub, email: payload.email };
  }
}
