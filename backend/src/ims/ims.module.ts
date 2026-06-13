import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { ProkerController } from './proker/proker.controller';
import { ProkerService } from './proker/proker.service';
import { PointsController } from './points/points.controller';
import { PointsService } from './points/points.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsService } from './documents/documents.service';
import { ProposalsController } from './proposals/proposals.controller';
import { ProposalsService } from './proposals/proposals.service';
import { LpjController } from './lpj/lpj.controller';
import { LpjService } from './lpj/lpj.service';
import { CommitteesController } from './committees/committees.controller';
import { CommitteesService } from './committees/committees.service';
import { AssetsController } from './assets/assets.controller';
import { AssetsService } from './assets/assets.service';
import { MeetingsController } from './meetings/meetings.controller';
import { MeetingsService } from './meetings/meetings.service';
import { PartnershipsController } from './partnerships/partnerships.controller';
import { PartnershipsService } from './partnerships/partnerships.service';
import { CmsController } from './cms/cms.controller';
import { CmsService } from './cms/cms.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { WikiController } from './wiki/wiki.controller';
import { WikiService } from './wiki/wiki.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PermissionsModule, NotificationsModule, UploadModule],
  controllers: [
    ProkerController,
    PointsController,
    DocumentsController,
    ProposalsController,
    LpjController,
    CommitteesController,
    AssetsController,
    MeetingsController,
    PartnershipsController,
    CmsController,
    UsersController,
    DashboardController,
    WikiController,
  ],
  providers: [
    ProkerService,
    PointsService,
    DocumentsService,
    ProposalsService,
    LpjService,
    CommitteesService,
    AssetsService,
    MeetingsService,
    PartnershipsService,
    CmsService,
    UsersService,
    DashboardService,
    WikiService,
  ],
  exports: [
    ProkerService,
    PointsService,
    DocumentsService,
    ProposalsService,
    LpjService,
    CommitteesService,
    AssetsService,
    MeetingsService,
    PartnershipsService,
    CmsService,
    UsersService,
    DashboardService,
    WikiService,
  ],
})
export class ImsModule {}
