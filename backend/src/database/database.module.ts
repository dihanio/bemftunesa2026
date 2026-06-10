import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as schemas from './schema';

const schemaDefinitions = [
  { name: schemas.User.name, schema: schemas.UserSchema },
  { name: schemas.Department.name, schema: schemas.DepartmentSchema },
  { name: schemas.Proker.name, schema: schemas.ProkerSchema },
  { name: schemas.ProkerMember.name, schema: schemas.ProkerMemberSchema },
  { name: schemas.Committee.name, schema: schemas.CommitteeSchema },
  { name: schemas.Event.name, schema: schemas.EventSchema },
  { name: schemas.Meeting.name, schema: schemas.MeetingSchema },
  { name: schemas.Attendance.name, schema: schemas.AttendanceSchema },
  { name: schemas.MeetingNote.name, schema: schemas.MeetingNoteSchema },
  { name: schemas.BEMDocument.name, schema: schemas.BEMDocumentSchema },
  { name: schemas.Proposal.name, schema: schemas.ProposalSchema },
  { name: schemas.RAB.name, schema: schemas.RABSchema },
  { name: schemas.LPJ.name, schema: schemas.LPJSchema },
  { name: schemas.SPJ.name, schema: schemas.SPJSchema },
  { name: schemas.Applicant.name, schema: schemas.ApplicantSchema },
  {
    name: schemas.RecruitmentScore.name,
    schema: schemas.RecruitmentScoreSchema,
  },
  {
    name: schemas.RecruitmentSchedule.name,
    schema: schemas.RecruitmentScheduleSchema,
  },
  {
    name: schemas.RecruitmentConfig.name,
    schema: schemas.RecruitmentConfigSchema,
  },
  { name: schemas.Product.name, schema: schemas.ProductSchema },
  { name: schemas.ProductVariant.name, schema: schemas.ProductVariantSchema },
  { name: schemas.Order.name, schema: schemas.OrderSchema },
  { name: schemas.OrderItem.name, schema: schemas.OrderItemSchema },
  { name: schemas.ShopConfig.name, schema: schemas.ShopConfigSchema },
  {
    name: schemas.PKKMBParticipant.name,
    schema: schemas.PKKMBParticipantSchema,
  },
  { name: schemas.PKKMBTask.name, schema: schemas.PKKMBTaskSchema },
  { name: schemas.PKKMBSubmission.name, schema: schemas.PKKMBSubmissionSchema },
  {
    name: schemas.PKKMBAnnouncement.name,
    schema: schemas.PKKMBAnnouncementSchema,
  },
  { name: schemas.PKKMBSchedule.name, schema: schemas.PKKMBScheduleSchema },
  { name: schemas.PKKMBGallery.name, schema: schemas.PKKMBGallerySchema },
  { name: schemas.PKKMBConfig.name, schema: schemas.PKKMBConfigSchema },
  { name: schemas.Article.name, schema: schemas.ArticleSchema },
  { name: schemas.Aspiration.name, schema: schemas.AspirationSchema },
  { name: schemas.GalleryAlbum.name, schema: schemas.GalleryAlbumSchema },
  { name: schemas.GalleryPhoto.name, schema: schemas.GalleryPhotoSchema },
  { name: schemas.Activity.name, schema: schemas.ActivitySchema },
  { name: schemas.SiteSetting.name, schema: schemas.SiteSettingSchema },
  { name: schemas.Permission.name, schema: schemas.PermissionSchema },
  { name: schemas.Role.name, schema: schemas.RoleSchema },
  { name: schemas.RolePermission.name, schema: schemas.RolePermissionSchema },
  { name: schemas.UserRole.name, schema: schemas.UserRoleSchema },
  { name: schemas.UserPermission.name, schema: schemas.UserPermissionSchema },
  { name: schemas.UserSession.name, schema: schemas.UserSessionSchema },
  { name: schemas.TrustedDevice.name, schema: schemas.TrustedDeviceSchema },
  { name: schemas.AuditLog.name, schema: schemas.AuditLogSchema },
  {
    name: schemas.WorkflowDefinitionRecord.name,
    schema: schemas.WorkflowDefinitionSchema,
  },
  {
    name: schemas.WorkflowInstanceRecord.name,
    schema: schemas.WorkflowInstanceSchema,
  },
  { name: schemas.FeatureFlag.name, schema: schemas.FeatureFlagSchema },
  { name: schemas.DocumentVersion.name, schema: schemas.DocumentVersionSchema },
  { name: schemas.Notification.name, schema: schemas.NotificationSchema },
  { name: schemas.Point.name, schema: schemas.PointSchema },
  { name: schemas.Asset.name, schema: schemas.AssetSchema },
  { name: schemas.AssetLoan.name, schema: schemas.AssetLoanSchema },
  { name: schemas.Partnership.name, schema: schemas.PartnershipSchema },
  { name: schemas.WikiArticle.name, schema: schemas.WikiArticleSchema },
];

@Global()
@Module({
  imports: [MongooseModule.forFeature(schemaDefinitions)],
  exports: [MongooseModule],
})
export class DatabaseModule {}
