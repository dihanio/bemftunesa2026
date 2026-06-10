import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/auth.decorator';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { WorkflowService } from './workflow.service';

@ApiTags('IMS - Workflow Engine')
@Controller('ims/workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @RequirePermissions('workflow.read')
  @ApiOperation({ summary: 'List workflow definitions' })
  async listDefinitions() {
    return this.workflowService.listDefinitions();
  }

  @Post()
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Create or update workflow definition JSON' })
  async upsertDefinition(@Body() body: any, @GetUser() user: any) {
    return this.workflowService.upsertDefinition(body, user.userId);
  }

  @Post('instances')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Start workflow instance for an entity' })
  async startInstance(@Body() body: any, @GetUser() user: any) {
    return this.workflowService.startInstance({
      ...body,
      actorId: user.userId,
    });
  }

  @Patch('instances/:id/transition')
  @RequirePermissions('workflow.manage')
  @ApiOperation({
    summary: 'Transition workflow instance by configured action',
  })
  async transition(
    @Param('id') id: string,
    @Body() body: { action: string; note?: string },
    @GetUser() user: any,
  ) {
    return this.workflowService.transition(id, {
      ...body,
      actorId: user.userId,
    });
  }
}
