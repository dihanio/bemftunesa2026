export enum PkkmbPermission {
  // Monitoring & System
  MONITORING_READ = 'pkkmb.monitoring.read',
  AUDIT_READ = 'pkkmb.audit.read',
  SETTINGS_MANAGE = 'pkkmb.settings.manage',

  // Role & Permission Management
  ROLES_READ = 'pkkmb.roles.read',
  ROLES_MANAGE = 'pkkmb.roles.manage',
  PERMISSIONS_READ = 'pkkmb.permissions.read',
  USERS_MANAGE = 'pkkmb.users.manage',

  // Announcements (Sie Humas)
  ANNOUNCEMENT_READ = 'pkkmb.announcement.read',
  ANNOUNCEMENT_CREATE = 'pkkmb.announcement.create',
  ANNOUNCEMENT_UPDATE = 'pkkmb.announcement.update',
  ANNOUNCEMENT_DELETE = 'pkkmb.announcement.delete',
  ANNOUNCEMENT_PUBLISH = 'pkkmb.announcement.publish',
  ANNOUNCEMENT_BROADCAST = 'pkkmb.announcement.broadcast',

  // Schedules (Sie Acara)
  SCHEDULE_READ = 'pkkmb.schedule.read',
  SCHEDULE_CREATE = 'pkkmb.schedule.create',
  SCHEDULE_UPDATE = 'pkkmb.schedule.update',
  SCHEDULE_DELETE = 'pkkmb.schedule.delete',
  SCHEDULE_PUBLISH = 'pkkmb.schedule.publish',

  // Grading & Tasks (Sie Penilaian)
  GRADING_READ_ALL = 'pkkmb.grading.read_all',
  GRADING_READ_OWN = 'pkkmb.grading.read_own',
  GRADING_CREATE = 'pkkmb.grading.create',
  GRADING_UPDATE = 'pkkmb.grading.update',
  GRADING_EXPORT = 'pkkmb.grading.export',
  GRADING_STATISTICS = 'pkkmb.grading.statistics',

  TASK_READ = 'pkkmb.task.read',
  TASK_CREATE = 'pkkmb.task.create',
  TASK_UPDATE = 'pkkmb.task.update',
  TASK_DELETE = 'pkkmb.task.delete',
  TASK_SUBMIT = 'pkkmb.task.submit',

  // Groups & Mentoring (Sie Pendamping / Mentor)
  GROUP_READ_ALL = 'pkkmb.group.read_all',
  GROUP_READ_OWN = 'pkkmb.group.read_own',
  GROUP_CREATE = 'pkkmb.group.create',
  GROUP_UPDATE = 'pkkmb.group.update',
  GROUP_ASSIGN_MENTOR = 'pkkmb.group.assign_mentor',

  ATTENDANCE_SESSION_CREATE = 'pkkmb.attendance.session_create',
  ATTENDANCE_CHECKIN = 'pkkmb.attendance.checkin',

  // Registration & Operator
  REGISTRATION_VERIFY = 'pkkmb.registration.verify',
  REGISTRATION_CHECKIN = 'pkkmb.registration.checkin',
  REGISTRATION_EDIT_BIODATA = 'pkkmb.registration.edit_biodata',
  REGISTRATION_UPLOAD_DOCUMENT = 'pkkmb.registration.upload_document',
  REGISTRATION_MANAGE = 'pkkmb.registration.manage',

  // Group publish
  GROUP_PUBLISH = 'pkkmb.group.publish',

  // Profile
  PROFILE_READ_OWN = 'pkkmb.profile.read_own',
  PROFILE_UPDATE_OWN = 'pkkmb.profile.update_own',
  PROFILE_READ_ALL = 'pkkmb.profile.read_all',

  // Super Admin Wildcard Permission
  MANAGE_ALL = 'manage:all',
}
