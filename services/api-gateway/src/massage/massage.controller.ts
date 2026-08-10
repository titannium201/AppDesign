import {
  Controller,
  Get,
  Post,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MassageService } from './massage.service';
import { MassageRecommendationResponse } from '@app/shared';

@Controller('massage')
@UseGuards(AuthGuard('jwt'))
export class MassageController {
  constructor(private readonly massageService: MassageService) {}

  @Get('recommendation/:scanId')
  recommend(
    @Request() req: { user: { userId: string } },
    @Param('scanId') scanId: string,
  ): MassageRecommendationResponse {
    return this.massageService.recommend(req.user.userId, scanId);
  }

  @Post('start/:scanId')
  start(
    @Request() req: { user: { userId: string } },
    @Param('scanId') scanId: string,
  ): { success: boolean } {
    return this.massageService.start(req.user.userId, scanId);
  }
}
