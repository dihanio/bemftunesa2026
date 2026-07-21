# Changelog

All notable changes to the BEM FT UNESA Web Platform will be documented in this file.

## [Unreleased]

### Added
- Added fallback data parsing mechanism in `Galeri` and `Oprec` pages (and their detail layout pages) to gracefully handle varying API response structures (`res.data` vs `res.data.data` etc.) ensuring all FE features safely receive BE data.
- Replaced the previous "Mars Fakultas Teknik UNESA" anthem with the official "Hymne Teknik" in the *Tentang Kami* (`/tentang`) page.
- Added `images.remotePatterns` configuration in `next.config.ts` to whitelist image optimization requests for `localhost` and global `https` endpoints, fixing the `400 Bad Request` images bug on the frontend.
- Added rigorous `PermissionsGuard` and `@RequiredPermissions` to core backend controllers (`GalleryController`, `RecruitmentController`, `ContentController`) to enforce granular Role-Based Access Control (RBAC).
- Created a placeholder `Galeri` CMS page in IMS and added it to the `navigationRegistry` configuration to structure feature management for content publishing.
- Applied required role-based restrictions (`super-admin`, `kabem`, `wakabem`, `kadep`, `staf`, etc.) directly into the `navigationRegistry` for the Publikasi & Eksternal module.

### Changed
- **UI Redesign**: Simplified and modernized the entire user interface by removing visual clutter. Removed the excessive use of decorative icons across all cards, navigation tabs, and content sections (News, Gallery, Stats, About, Structure) to create a more professional and minimalist aesthetic.
- **Background Update**: Replaced the previous grid background with a subtle, modern radial gradient background in `layout.tsx` to reduce the "boxy" feel and improve visual aesthetics.
- **Navbar Layout**: Fixed vertical alignment of the BEM FT UNESA logo and text in `Navbar.tsx` by enforcing exact dimensions (`40x40`) and tightening the line-height for a polished look.
- **IMS Navigation Permissions**: Shifted IMS (CMS) module from purely role-based gating to granular permission-based gating (e.g., `content:read`, `gallery:read`, `aspiration:read`) in `navigation-registry.ts` to allow finer control over feature access.
- **Backend Seeds**: Updated `seed-roles-and-org.ts` in the backend to explicitly seed granular permissions (`manage:all`, `content:*`, `gallery:*`, etc.) into the `Permission` collection and assign them properly to organizational roles (Kominfo, Kadep, dll).

### Fixed
- Fixed TypeScript build failures (`Type error: Property 'data' does not exist`) by correctly typing response objects in `frontend/src/lib/api.ts`.
- Fixed `Cannot read properties of undefined (reading 'data')` crashes when rendering `/galeri` and `/oprec` pages.
- Restored missing files and uncommitted frontend code that inadvertently caused application errors after reverting the UI redesign.
