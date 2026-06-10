import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UsePipes,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AwardPointsSchema } from './points.dto';

@ApiTags('IMS - Reward Points')
@Controller('ims/points')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get()
  @Roles('Kadep', 'Staff')
  @ApiOperation({ summary: 'Daftar semua riwayat poin' })
  async getAllPoints() {
    return this.pointsService.getAllPoints();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Leaderboard fungsionaris' })
  async leaderboard() {
    return this.pointsService.getLeaderboard();
  }

  @Get('me')
  @Roles('Staff')
  @ApiOperation({ summary: 'Riwayat poin saya' })
  async myPoints(@Request() req: any) {
    return this.pointsService.getUserPoints(req.user.userId);
  }

  @Get('user/:id')
  @Roles('Kadep')
  @ApiOperation({ summary: 'Riwayat poin user tertentu' })
  async userPoints(@Param('id') id: string) {
    return this.pointsService.getUserPoints(id);
  }

  @Post()
  @Roles('Kadep')
  @ApiOperation({ summary: 'Award / deduct points' })
  @UsePipes(new ZodValidationPipe(AwardPointsSchema))
  async awardPoints(@Body() body: any, @Request() req: any) {
    return this.pointsService.awardPoints(body, req.user.userId);
  }
}
