import {
  Body, Controller, Get, Param, Post, Put, Delete,
  Request, UseGuards, Query, Res, HttpStatus
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuratService } from './surat.service';
import { WorkflowAction } from '../../schemas/workflow-instance.schema';
import {
  CreateSuratDraftDto, UploadDocumentVersionDto, SuratQueryDto, AiGenerateDto, AiReviseDto, WorkflowActionDto
} from './dto/surat-api.dto';

@Controller('ims/surat')
@UseGuards(JwtAuthGuard)
export class SuratController {
  constructor(
    private readonly suratService: SuratService,
  ) {}

  // ==========================================
  // DRAFT & CRUD
  // ==========================================

  @Post()
  create(@Body() dto: CreateSuratDraftDto, @Request() req) {
    return this.suratService.createDraft(dto, req.user._id);
  }

  @Get()
  findAll(@Query() query: SuratQueryDto) {
    return this.suratService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suratService.findOne(id);
  }

  @Post(':id/version')
  uploadNewVersion(@Param('id') id: string, @Body() dto: UploadDocumentVersionDto, @Request() req) {
    return this.suratService.uploadNewVersion(id, dto, req.user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.suratService.softDelete(id, req.user._id);
  }

  // ==========================================
  // TEMPLATE VALIDATION
  // ==========================================

  @Post(':id/validate')
  validate(@Param('id') id: string) {
    return this.suratService.validatePlaceholders(id);
  }

  // ==========================================
  // AI
  // ==========================================
  // WORKFLOW
  // ==========================================

  private buildUserContext(req: any) {
    return {
      id: req.user._id,
      roles: req.user.roles || [req.user.role], // accommodate legacy setup
      department: req.user.department,
      organization: 'BEM FT UNESA'
    };
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Request() req) {
    return this.suratService.executeWorkflowAction(id, WorkflowAction.SUBMIT, this.buildUserContext(req));
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: WorkflowActionDto, @Request() req) {
    return this.suratService.executeWorkflowAction(id, WorkflowAction.APPROVE, this.buildUserContext(req), dto);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: WorkflowActionDto, @Request() req) {
    return this.suratService.executeWorkflowAction(id, WorkflowAction.REJECT, this.buildUserContext(req), dto);
  }

  @Post(':id/request-revision')
  requestRevision(@Param('id') id: string, @Body() dto: WorkflowActionDto, @Request() req) {
    return this.suratService.executeWorkflowAction(id, WorkflowAction.REQUEST_REVISION, this.buildUserContext(req), dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: WorkflowActionDto, @Request() req) {
    return this.suratService.executeWorkflowAction(id, WorkflowAction.CANCEL, this.buildUserContext(req), dto);
  }

  // ==========================================
  // NUMBERING, EXPORT, ETC
  // ==========================================

  @Post(':id/generate-number')
  generateNumber(@Param('id') id: string) {
    return this.suratService.generateLetterNumber(id);
  }

  @Post(':id/sign')
  sign(@Param('id') id: string) {
    // Stub
    return { success: true, message: 'Signed' };
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @Request() req) {
    return this.suratService.executeWorkflowAction(id, WorkflowAction.PUBLISH, this.buildUserContext(req));
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    const surat = await this.suratService.findOne(id);
    const workflow = surat.workflowInstance as any;
    return workflow.history || [];
  }

  @Get(':id/workflow')
  async getWorkflowState(@Param('id') id: string) {
    const surat = await this.suratService.findOne(id);
    const workflow = surat.workflowInstance as any;
    return {
      currentState: workflow.currentState,
      currentStageId: workflow.currentStageId,
      currentApprovers: workflow.currentApprovers
    };
  }

  /**
   * Returns available workflow actions for the current user on this surat.
   * Frontend uses this to render dynamic action buttons instead of hardcoding state logic.
   */
  @Get(':id/available-actions')
  async getAvailableActions(@Param('id') id: string, @Request() req) {
    return this.suratService.getAvailableActions(id, this.buildUserContext(req));
  }

  /**
   * Generic workflow action endpoint. Frontend sends the action keyword
   * and the Workflow Engine resolves the transition dynamically.
   */
  @Post(':id/workflow-action')
  executeGenericWorkflowAction(
    @Param('id') id: string,
    @Body() body: { action: string; comment?: string },
    @Request() req
  ) {
    return this.suratService.executeWorkflowAction(
      id,
      body.action as any,
      this.buildUserContext(req),
      { comment: body.comment }
    );
  }
}
