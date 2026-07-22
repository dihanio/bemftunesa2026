import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

/**
 * WorkspaceMember embedded sub-document.
 */
export class WorkspaceMember {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer',
  })
  role: string;

  @Prop({ default: () => new Date() })
  joinedAt: Date;
}

/**
 * Workspace is the Aggregate Root for organizing files by team, committee, or individual.
 *
 * Hierarchy: Tenant (future) -> Organization -> Workspace -> Folders/Files
 *
 * In v1, tenantId defaults to a global constant since only BEM FT UNESA uses the system.
 * The field exists so multi-tenancy can be activated later without a schema migration.
 */
@Schema({ timestamps: true, collection: 'workspaces' })
export class Workspace {
  @Prop({ required: true, default: 'default' })
  tenantId: string; // ponytail: flat string for now; upgrade to ObjectId ref when multi-tenant is real

  @Prop({
    required: true,
    enum: ['personal', 'organization', 'department', 'committee', 'event'],
    default: 'organization',
  })
  type: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description: string;

  @Prop()
  icon: string;

  /** Link to existing Department (optional, only for type=department). */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Department',
    default: null,
  })
  departmentId: Types.ObjectId | null;

  /** Creator / initial admin. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [WorkspaceMember], default: [] })
  members: WorkspaceMember[];

  // ── Quota ──────────────────────────────────────────────
  @Prop({ default: 0 })
  quotaUsedBytes: number;

  /** -1 = unlimited (global default read from Settings) */
  @Prop({ default: -1 })
  quotaLimitBytes: number;

  // ── Lifecycle ──────────────────────────────────────────
  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ default: null })
  archivedAt: Date | null;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

WorkspaceSchema.index({ slug: 1 }, { unique: true });
WorkspaceSchema.index({ tenantId: 1, type: 1 });
WorkspaceSchema.index({ ownerId: 1 });
WorkspaceSchema.index({ 'members.userId': 1 });
