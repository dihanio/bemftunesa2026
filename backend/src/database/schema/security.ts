import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;
export type PermissionDocument = HydratedDocument<Permission>;
export type UserRoleDocument = HydratedDocument<UserRole>;
export type UserPermissionDocument = HydratedDocument<UserPermission>;
export type RolePermissionDocument = HydratedDocument<RolePermission>;
export type AuditLogDocument = HydratedDocument<AuditLog>;
export type WorkflowDefinitionDocument =
  HydratedDocument<WorkflowDefinitionRecord>;
export type WorkflowInstanceDocument = HydratedDocument<WorkflowInstanceRecord>;

const ScopeSchema = {
  type: {
    type: String,
    enum: ['global', 'department', 'event', 'committee', 'proker', 'own'],
    default: 'global',
  },
  id: { type: String },
};

@Schema({ timestamps: true, collection: 'permissions' })
export class Permission {
  @Prop({ required: true, unique: true, index: true })
  key!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, default: 'ims' })
  app!: string;

  @Prop({ default: false })
  requiresMfa!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, unique: true, index: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isStatic!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

@Schema({ timestamps: true, collection: 'role_permissions' })
export class RolePermission {
  @Prop({ required: true, index: true })
  roleId!: string;

  @Prop({ required: true, index: true })
  permission!: string;

  @Prop({ type: String, enum: ['allow', 'deny'], default: 'allow' })
  effect!: 'allow' | 'deny';

  @Prop({ type: ScopeSchema })
  scope?: { type: string; id?: string };
}

export const RolePermissionSchema =
  SchemaFactory.createForClass(RolePermission);
RolePermissionSchema.index({
  roleId: 1,
  permission: 1,
  'scope.type': 1,
  'scope.id': 1,
});

@Schema({ timestamps: true, collection: 'user_roles' })
export class UserRole {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  roleId!: string;

  @Prop({ type: ScopeSchema })
  scope?: { type: string; id?: string };

  @Prop()
  startsAt?: Date;

  @Prop()
  endsAt?: Date;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole);
UserRoleSchema.index({ userId: 1, roleId: 1, isActive: 1 });

@Schema({ timestamps: true, collection: 'user_permissions' })
export class UserPermission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  permission!: string;

  @Prop({ type: String, enum: ['allow', 'deny'], default: 'allow' })
  effect!: 'allow' | 'deny';

  @Prop({ type: ScopeSchema })
  scope?: { type: string; id?: string };

  @Prop()
  reason?: string;

  @Prop()
  expiresAt?: Date;
}

export const UserPermissionSchema =
  SchemaFactory.createForClass(UserPermission);
UserPermissionSchema.index({ userId: 1, permission: 1 });

@Schema({ timestamps: true, collection: 'user_sessions' })
export class UserSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  refreshTokenHash!: string;

  @Prop({
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active',
  })
  status!: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  trustedDeviceId?: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  revokedAt?: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

@Schema({ timestamps: true, collection: 'trusted_devices' })
export class TrustedDevice {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true, index: true })
  fingerprintHash!: string;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  expiresAt?: Date;
}

export const TrustedDeviceSchema = SchemaFactory.createForClass(TrustedDevice);

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  actorId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  category!: string;

  @Prop({ required: true, index: true })
  action!: string;

  @Prop()
  targetType?: string;

  @Prop({ type: String })
  targetId?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

@Schema({ timestamps: true, collection: 'workflow_definitions' })
export class WorkflowDefinitionRecord {
  @Prop({ required: true, index: true })
  key!: string;

  @Prop({ required: true })
  version!: number;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  entity!: string;

  @Prop({ required: true })
  initialStep!: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  steps!: Record<string, unknown>[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  transitions!: Record<string, unknown>[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const WorkflowDefinitionSchema = SchemaFactory.createForClass(
  WorkflowDefinitionRecord,
);
WorkflowDefinitionSchema.index({ key: 1, version: 1 }, { unique: true });

@Schema({ timestamps: true, collection: 'workflow_instances' })
export class WorkflowInstanceRecord {
  @Prop({ required: true, index: true })
  definitionKey!: string;

  @Prop({ required: true })
  definitionVersion!: number;

  @Prop({ required: true, index: true })
  entityType!: string;

  @Prop({ required: true, index: true })
  entityId!: string;

  @Prop({ required: true })
  currentStep!: string;

  @Prop({
    type: String,
    enum: [
      'draft',
      'running',
      'revision',
      'approved',
      'rejected',
      'archived',
      'cancelled',
    ],
    default: 'running',
  })
  status!: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  history!: Record<string, unknown>[];
}

export const WorkflowInstanceSchema = SchemaFactory.createForClass(
  WorkflowInstanceRecord,
);
WorkflowInstanceSchema.index({ entityType: 1, entityId: 1 });

@Schema({ timestamps: true, collection: 'feature_flags' })
export class FeatureFlag {
  @Prop({ required: true, unique: true, index: true })
  key!: string;

  @Prop({ default: false })
  enabled!: boolean;

  @Prop()
  description?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  conditions?: Record<string, unknown>;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);

@Schema({ timestamps: true, collection: 'document_versions' })
export class DocumentVersion {
  @Prop({ required: true, index: true })
  entityType!: string;

  @Prop({ required: true, index: true })
  entityId!: string;

  @Prop({ required: true })
  version!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  snapshot!: Record<string, unknown>;

  @Prop()
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const DocumentVersionSchema =
  SchemaFactory.createForClass(DocumentVersion);
DocumentVersionSchema.index({ entityType: 1, entityId: 1, version: -1 });
