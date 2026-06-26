import {
  Body, Controller, Delete, Get, Param,
  Post, Put, Query, Request, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RapatService } from './rapat.service';
import {
  CreateRapatDto, ManualAttendDto, QrAttendDto, UpdateRapatDto,
} from './dto/rapat.dto';

@Controller('ims/rapat')
@UseGuards(JwtAuthGuard)
export class RapatController {
  constructor(private readonly rapatService: RapatService) {}

  @Get()
  findAll(@Query('cabinetPeriod') cabinetPeriod: string): Promise<any[]> {
    return this.rapatService.findAll(cabinetPeriod);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.rapatService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRapatDto, @Request() req) {
    return this.rapatService.create(dto, req.user._id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRapatDto) {
    return this.rapatService.update(id, dto);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.rapatService.startRapat(id);
  }

  @Post(':id/end')
  end(@Param('id') id: string) {
    return this.rapatService.endRapat(id);
  }

  @Get(':id/qr-token')
  getQrToken(@Param('id') id: string) {
    return this.rapatService.getQrToken(id);
  }

  @Post(':id/attend/qr')
  attendByQr(
    @Param('id') id: string,
    @Body() dto: QrAttendDto,
    @Request() req,
  ) {
    return this.rapatService.attendByQr(
      id, dto, req.user._id, req.user.name,
    );
  }

  @Post(':id/attend/manual')
  attendManual(
    @Param('id') id: string,
    @Body() dto: ManualAttendDto,
    @Request() req,
  ) {
    return this.rapatService.attendManual(id, dto, req.user._id);
  }

  @Delete(':id/attendees/:userId')
  removeAttendee(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.rapatService.removeAttendee(id, userId);
  }
}
