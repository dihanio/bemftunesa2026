import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('search')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(
    @Query('q') query: string,
    @Query('cabinetPeriod') cabinetPeriod?: string
  ) {
    const results = await this.searchService.globalSearch(query, cabinetPeriod);
    return {
      success: true,
      data: results
    };
  }
}
