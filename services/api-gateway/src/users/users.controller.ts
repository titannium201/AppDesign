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

import { User as PrismaUser, Prisma } from '@prisma/client';

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
    targetEvent: user.targetEvent ? JSON.parse(user.targetEvent) : undefined,
    injuryHistory: user.injuryHistory ? JSON.parse(user.injuryHistory) : undefined,
    currentDiscomfort: (user.currentDiscomfort as UserProfileResponse['currentDiscomfort']) ?? undefined,
    sleepQuality: (user.sleepQuality as UserProfileResponse['sleepQuality']) ?? undefined,
    runningExperience: (user.runningExperience as UserProfileResponse['runningExperience']) ?? undefined,
    watchBrands: user.watchBrands ? JSON.parse(user.watchBrands) : undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
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

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.validateCredentials(dto.email, dto.password);
    return {
      accessToken: this.authService.signToken({ sub: user.id, email: user.email }),
      user: toProfileResponse(user),
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req: { user: { userId: string } }): Promise<UserProfileResponse> {
    const user = await this.usersService.findById(req.user.userId);
    return toProfileResponse(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateProfile(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const data: Prisma.UserUpdateInput = {
      name: dto.nickname,
      nickname: dto.nickname,
      gender: dto.gender,
      age: dto.age,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      sportType: dto.sportType,
      weeklyMileageKm: dto.weeklyMileageKm,
      trainingTypes: dto.trainingTypes ? JSON.stringify(dto.trainingTypes) : undefined,
      intervalConfig: dto.intervalConfig ? JSON.stringify(dto.intervalConfig) : undefined,
      bestRace: dto.bestRace ? JSON.stringify(dto.bestRace) : undefined,
      targetEvent: dto.targetEvent ? JSON.stringify(dto.targetEvent) : undefined,
      injuryHistory: dto.injuryHistory ? JSON.stringify(dto.injuryHistory) : undefined,
      currentDiscomfort: dto.currentDiscomfort,
      sleepQuality: dto.sleepQuality,
      runningExperience: dto.runningExperience,
      watchBrands: dto.watchBrands ? JSON.stringify(dto.watchBrands) : undefined,
    };
    const user = await this.usersService.updateProfile(req.user.userId, data);
    return toProfileResponse(user);
  }
}
