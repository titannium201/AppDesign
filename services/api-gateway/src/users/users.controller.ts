import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './users.dto';
import { Public } from '../auth/public.decorator';
import { AuthResponse, UserProfileResponse } from '@app/shared';

function toProfileResponse(user: UserAccountResponse): UserProfileResponse {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    gender: user.gender,
    age: user.age,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    sportType: user.sportType,
    weeklyMileageKm: user.weeklyMileageKm,
    trainingTypes: user.trainingTypes,
    intervalConfig: user.intervalConfig,
    bestRace: user.bestRace,
    targetEvent: user.targetEvent,
    injuryHistory: user.injuryHistory,
    currentDiscomfort: user.currentDiscomfort,
    sleepQuality: user.sleepQuality,
    runningExperience: user.runningExperience,
    watchBrands: user.watchBrands,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

type UserAccountResponse = UserProfileResponse & { passwordHash?: string };

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): AuthResponse {
    const user = this.usersService.create(
      dto.email,
      dto.password,
      dto.nickname,
    );
    return {
      accessToken: this.authService.signToken(user as any),
      user: toProfileResponse(user),
    };
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): AuthResponse {
    const user = this.usersService.validateCredentials(dto.email, dto.password);
    return {
      accessToken: this.authService.signToken(user as any),
      user: toProfileResponse(user),
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req: { user: { userId: string } }): UserProfileResponse {
    const user = this.usersService.findById(req.user.userId);
    return toProfileResponse(user as UserAccountResponse);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateProfile(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateProfileDto,
  ): UserProfileResponse {
    const user = this.usersService.updateProfile(req.user.userId, dto);
    return toProfileResponse(user);
  }
}
