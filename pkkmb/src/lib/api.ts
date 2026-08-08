// NEXT_PUBLIC_API_URL shared across apps may include the trailing /api/v1
// (used by frontend/ims). pkkmb appends /api/v1 itself, so strip it here to
// avoid a doubled prefix (e.g. /api/v1/api/v1/auth/google).
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/api\/v1\/?$/, '');
