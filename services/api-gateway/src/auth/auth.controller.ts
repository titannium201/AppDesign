import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';

/**
 * 认证控制器（M1 注册登录）
 *
 * 兼容 /api/v1/auth 路径，实际逻辑委托 UsersService。
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    const user = this.usersService.create(dto.email, dto.password, dto.nickname);
    return {
      accessToken: this.authService.signToken(user as any),
      user,
    };
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    const user = this.usersService.validateCredentials(dto.email, dto.password);
    return {
      accessToken: this.authService.signToken(user as any),
      user,
    };
  }

  @Post('refresh')
  refresh(@Body() _dto: RefreshTokenDto) {
    throw new UnauthorizedException('Refresh not implemented in P0');
  }
}
