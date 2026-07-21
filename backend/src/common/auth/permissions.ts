export enum AppPermission {
  // Letters
  LETTERS_CREATE = 'letters.create',
  LETTERS_READ = 'letters.read',
  LETTERS_UPDATE = 'letters.update',
  LETTERS_DELETE = 'letters.delete',
  LETTERS_REVIEW = 'letters.review',
  LETTERS_APPROVE = 'letters.approve',
  LETTERS_REJECT = 'letters.reject',
  LETTERS_PUBLISH = 'letters.publish',

  // Users & Roles
  USERS_MANAGE = 'users.manage',
  ROLES_MANAGE = 'roles.manage',

  // Settings
  SETTINGS_MANAGE = 'settings.manage',

  // Content
  CONTENT_MANAGE = 'content.manage',
  CONTENT_READ = 'content:read',
  CONTENT_CREATE = 'content:create',
  CONTENT_UPDATE = 'content:update',
  CONTENT_DELETE = 'content:delete',
  CONTENT_PUBLISH = 'content:publish',

  // Gallery
  GALLERY_MANAGE = 'gallery.manage',
  GALLERY_READ = 'gallery:read',
  GALLERY_CREATE = 'gallery:create',
  GALLERY_UPDATE = 'gallery:update',
  GALLERY_DELETE = 'gallery:delete',

  // Recruitment
  RECRUITMENT_MANAGE = 'recruitment.manage',
  RECRUITMENT_READ = 'recruitment:read',
  RECRUITMENT_CREATE = 'recruitment:create',
  RECRUITMENT_UPDATE = 'recruitment:update',
  RECRUITMENT_DELETE = 'recruitment:delete',

  // Organizations
  ORGANIZATIONS_MANAGE = 'organizations.manage',

  // Committees
  COMMITTEES_MANAGE = 'committees.manage',

  // Programs
  PROGRAMS_MANAGE = 'programs.manage',

  // PKKMB
  PKKMB_MANAGE = 'pkkmb.manage',
}
