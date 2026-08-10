import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { AuthResponse, UserProfileResponse } from '@app/shared';
import { User as PrismaUser } from '@prisma/client';

function toProfileResponse(user: PrismaUser): UserProfileResponse {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname ?? user.name ?? undefined,
    gender: (user.gender as UserProfileResponse['gender']) ?? undefined,
    age: user.age ?? undefined,
    heightCm: user.heightCm ?? undefined,
    weightKg: user.weightKg ?? undefined,
    sportType: (user.sportType as UserProfileResponse['sportType']) ?? undefined,
    weeklyMileageKm: user.weeklyMileageKm ?? undefined,
    trainingTypes: user.trainingTypes ? JSON.parse(user.trainingTypes) : undefined,
    intervalConfig: user.intervalConfig ? JSON.parse(user.intervalConfig) : undefined,
    bestRace: user.bestRace ? JSON.parse(user.bestRace) : undefined,
    targetEvent: (user.targetEvent as UserProfileResponse['targetEvent']) ?? undefined,
    injuryHistory: user.injuryHistory ? JSON.parse(user.injuryHistory) : undefined,
    currentDiscomfort: (user.currentDiscomfort as UserProfileResponse['currentDiscomfort']) ?? undefined,
    sleepQuality: (user.sleepQuality as UserProfileResponse['sleepQuality']) ?? undefined,
    runningExperience: (user.runningExperience as UserProfileResponse['runningExperience']) ?? undefined,
    watchBrands: user.watchBrands ? JSON.parse(user.watchBrands) : undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

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
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(
      dto.email,
      dto.password,
      dto.nickname,
    );
    return {
      accessToken: this.authService.signToken({ sub: user.id, email: user.email }),
      user: toProfileResponse(user),
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.validateCredentials(
      dto.email,
      dto.password,
    );
    return {
      accessToken: this.authService.signToken({ sub: user.id, email: user.email }),
      user: toProfileResponse(user),
    };
  }

  @Post('refresh')
  refresh(@Body() _dto: RefreshTokenDto) {
    throw new UnauthorizedException('Refresh not implemented in P0');
  }
}
