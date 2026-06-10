import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorator';
import { AssetsService } from './assets.service';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - Assets & Inventaris')
@Controller('ims')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('assets')
  @ApiOperation({ summary: 'List barang/aset BEM' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listAssets(@Query() query: any) {
    return this.assetsService.listAssets(query);
  }

  @Post('assets')
  @Roles('Sekretaris')
  @ApiOperation({ summary: 'Input data aset baru' })
  async createAsset(@Body() body: any) {
    return this.assetsService.createAsset(body);
  }

  @Get('asset-loans')
  @ApiOperation({ summary: 'List log peminjaman barang' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listLoans(@Query() query: any) {
    return this.assetsService.listLoans(query);
  }

  @Post('asset-loans')
  @ApiOperation({ summary: 'Pengajuan pinjam barang' })
  async createLoan(@Body() body: any) {
    return this.assetsService.createLoan(body);
  }

  @Patch('asset-loans/:id/status')
  @Roles('Sekretaris')
  @ApiOperation({ summary: 'Approve/Reject peminjaman' })
  async updateLoanStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.assetsService.updateLoanStatus(id, body.status);
  }
}
