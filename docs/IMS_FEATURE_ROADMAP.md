# IMS Feature Roadmap & Logic Flow Design

**Status:** Design Complete — Ready for Implementation  
**Last Updated:** 2026-06-25  
**Priority Order:** Persuratan → Rapat → Proker → Keuangan → User Management → Monitoring

---

## Implementation Status

| # | Feature | Route | Status | Schema Needed |
|---|---|---|---|---|
| 1 | Persuratan | /surat | 🔴 Not Started | ✅ New (SuratSchema) |
| 2 | Rapat & Absensi | /rapat | 🔴 Not Started | ✅ New (RapatSchema) |
| 3 | Program Kerja (IMS) | /proker | 🔴 Not Started | ♻️ Reuse ProgramSchema |
| 4 | Keuangan & Dana | /keuangan | 🔴 Not Started | ✅ New (KeuanganSchema) |
| 5 | User Management | /settings/users | 🔴 Not Started | ♻️ Reuse UserSchema |
| 6 | Role Management | /settings/roles | 🔴 Not Started | ♻️ Reuse RoleSchema |
| 7 | Monitoring | /settings/monitoring | 🔴 Not Started | ♻️ Reuse AuditLogSchema |
| 8 | Audit Trail | /settings/audit | 🔴 Not Started | ♻️ Reuse AuditLogSchema |

---

## Priority 1: Persuratan (/surat)

### Backend Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/ims/surat | List all letters (filtered by type/cabinet) |
| GET | /api/v1/ims/surat/:id | Letter detail + audit history |
| POST | /api/v1/ims/surat | Upload new letter draft |
| PUT | /api/v1/ims/surat/:id | Update draft (before approval) |
| POST | /api/v1/ims/surat/:id/submit | Lock & submit to Sekretaris |
| POST | /api/v1/ims/surat/:id/approve | Approve + generate PDF stamp |
| POST | /api/v1/ims/surat/:id/reject | Reject with notes |

### Frontend Components
- `page.tsx` — Tabs: Draft / Pending / Approved / Rejected
- `new/page.tsx` — Draft form with file upload
- `[id]/page.tsx` — Detail + status tracker + action buttons
- `LetterNumberGenerator.tsx` — Auto-generates formal index (e.g. 002/A/BEM-FT/VI/2026)

### Data Flow
1. Fungsionaris fills form → clicks "Simpan sebagai Draft"
2. Frontend → `POST /ims/surat` (multipart file upload)
3. Backend uploads file, saves metadata `status: draft`, logs audit trail
4. Fungsionaris clicks "Kirim Review" → `POST /ims/surat/:id/submit`
5. Sekretaris/Kabem gets dashboard notification → approves or rejects
6. On approve: backend generates letter number, stamps PDF, sets `status: approved`

### Schema
```typescript
{
  letterNumber: string;
  title: string;
  type: 'incoming' | 'outgoing';
  category: 'internal' | 'external';
  sender: string;
  recipient: string;
  fileUrl: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  notes?: string;
  submittedBy: ObjectId;
  approvedBy?: ObjectId;
  cabinetPeriod: ObjectId;
}
```

### Permissions
| Action | Roles |
|---|---|
| VIEW | super-admin, kabem, sekretaris, bendahara, kadep |
| CREATE | sekretaris, kadep |
| APPROVE/REJECT | kabem, sekretaris |

### Edge Cases
- Duplicate letter number check
- PDF only, max 5MB
- Department isolation (staff sees own dept only)

---

## Priority 2: Rapat & Absensi (/rapat)

### Backend Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/ims/kepanitiaan/rapat/all | List meetings |
| POST | /api/v1/ims/kepanitiaan/rapat | Schedule new meeting |
| GET | /api/v1/ims/kepanitiaan/rapat/:id | Detail + live attendance count |
| POST | /api/v1/ims/kepanitiaan/rapat/:id/generate-qr | Generate TOTP QR token |
| POST | /api/v1/ims/kepanitiaan/rapat/:id/attend | Record presence (GPS + OTP) |

### Frontend Components
- `page.tsx` — Active meetings board + scan trigger
- `new/page.tsx` — Schedule form with geo-fence pin & radius
- `[id]/page.tsx` — Live QR display (refreshes every 30s) + attendance list
- `AttendanceQRScanner.tsx` — Camera scanner with GPS check before API call

### Data Flow
1. Admin opens `/rapat/[id]` → dynamic QR shown, refreshes every 30s
2. Attendee opens IMS on phone → clicks "Absen Rapat" → grants camera + GPS
3. Phone scans QR → extracts TOTP token + fetches GPS coords
4. Frontend → `POST /attend` with token + coords
5. Backend: validates TOTP age, calculates GPS distance vs fence radius
6. If valid → records attendance; UI refreshes live via polling/Socket.IO

### Schema
```typescript
{
  title: string;
  description?: string;
  scheduledAt: Date;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    radiusInMeters: number;
  };
  qrSecret: string;
  attendees: Array<{
    userId: ObjectId;
    attendedAt: Date;
    latitude: number;
    longitude: number;
    distanceFromTarget: number;
  }>;
  createdBy: ObjectId;
  cabinetPeriod: ObjectId;
}
```

### Permissions
| Action | Roles |
|---|---|
| VIEW + ATTEND | All BEM fungsionaris |
| CREATE | super-admin, kabem, sekretaris, kadep, ketua_panitia |
| EDIT ATTENDANCE | Meeting creator, kadep, super-admin |

### Edge Cases
- Reject if GPS distance > fence radius (anti-spoofing)
- Reject if QR token > 30s old (anti-screenshot)
- Manual check-in by coordinator if no GPS signal

---

## Priority 3: Program Kerja IMS (/proker)

### Backend Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/ims/proker | List all work programs |
| GET | /api/v1/ims/proker/:id | Detail + financial attachments |
| POST | /api/v1/ims/proker | Create new program |
| PUT | /api/v1/ims/proker/:id | Update progress/status/timeline |
| DELETE | /api/v1/ims/proker/:id | Soft delete |

### Frontend Components
- `page.tsx` — Grid by department + status with progress bars
- `new/page.tsx` — Form linking PIC, budget estimate, target outputs
- `ProkerStatusBadge.tsx` — Visual: Planned / Ongoing / Completed / Cancelled

### Data Flow
1. Kadep → "Tambah Proker" → fills form → `POST /ims/proker`
2. Backend creates document using existing ProgramSchema
3. PIC updates progress slider → `PUT /ims/proker/:id`
4. Public frontend `/proker` reflects changes immediately

### Schema
Reuses existing `ProgramSchema` — no new schema needed.

### Permissions
| Action | Roles |
|---|---|
| VIEW | All authenticated members |
| CREATE | super-admin, kabem, sekretaris, kadep |
| UPDATE | PIC, kadep (own dept), super-admin |

### Edge Cases
- Budget must be positive number
- Start date must be before end date
- Progress clamped 0–100

---

## Priority 4: Keuangan & Dana (/keuangan)

### Backend Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/ims/keuangan | Global cash flow ledger |
| GET | /api/v1/ims/keuangan/:id | Transaction detail + receipts |
| POST | /api/v1/ims/keuangan | Record new transaction |
| POST | /api/v1/ims/keuangan/:id/submit | Submit expense for validation |
| POST | /api/v1/ims/keuangan/:id/approve | Approve SPJ/proposal |
| POST | /api/v1/ims/keuangan/:id/reject | Reject with notes |

### Frontend Components
- `page.tsx` — Balance cards + cashflow area chart + ledger list
- `FinanceItemModal.tsx` — Create/edit transaction with receipt upload
- `CashflowSummary.tsx` — Monthly income vs expense area chart

### Data Flow
1. Kadep uploads reimbursement → `POST /keuangan` with receipt + `status: pending`
2. Bendahara sees pending items → audits → clicks "Setujui" or "Tolak"
3. Backend updates status → recalculates cabinet cash metrics
4. Balance cards on dashboard refresh

### Schema
```typescript
{
  cabinetPeriod: ObjectId;
  department?: ObjectId;
  program?: ObjectId;
  title: string;
  description?: string;
  type: 'income' | 'expense';
  amount: number;
  receiptUrl?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  notes?: string;
  recordedBy: ObjectId;
  verifiedBy?: ObjectId;
}
```

### Permissions
| Action | Roles |
|---|---|
| VIEW | super-admin, kabem, sekretaris, bendahara, kadep |
| CREATE | bendahara (general), kadep (SPJ/request) |
| APPROVE/REJECT | bendahara, kabem |

### Edge Cases
- Proker spending cannot exceed approved budget
- Receipt required for expenses above threshold
- No deletion — use reversal/adjusting entry instead

---

## Priority 5: User & Role Management (/settings/users & /settings/roles)

### Backend Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/users | List all users |
| PUT | /api/v1/users/:id/status | Approve / suspend / reactivate |
| PUT | /api/v1/users/:id/roles | Assign role + department + cabinet |
| GET | /api/v1/roles | List roles + permission matrix |

### Frontend Components
- `users/page.tsx` — User table with activation toggles + detail drawer
- `roles/page.tsx` — Permission matrix grid per role
- `UserRoleModal.tsx` — Assign Cabinet Period + Department + Role

### Data Flow
1. New member registers via Google OAuth → `isActive: false`
2. Super Admin opens `/settings/users` → finds user → "Kelola Role"
3. Selects Cabinet Period + Department + Role → `PUT /users/:id/roles`
4. Backend activates account (`isActive: true`), logs assignment
5. User can now log in and access their role-scoped dashboard

### Schema
Reuses existing `UserSchema` — no new schema needed.

### Permissions
| Action | Roles |
|---|---|
| VIEW + EDIT | super-admin only |

### Edge Cases
- Super Admin cannot deactivate their own account
- Assigning "Kadep" removes previous Kadep in same department

---

## Bonus: Monitoring & Audit Trail

### Backend Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/ims/monitoring/health | CPU, memory, DB status, API latency |
| GET | /api/v1/ims/audit-logs | Paginated activity logs |

### Frontend Components
- `monitoring/page.tsx` — Read-only telemetry gauges
- `audit/page.tsx` — Filterable activity log list (by user or entity)

### Data Flow
1. Admin opens `/settings/monitoring`
2. Frontend polls `/health` periodically
3. Backend returns CPU load, memory, DB ping stats
4. On `/settings/audit` → loads from existing AuditLog collection

### Schema
Reuses existing `AuditLogSchema` — no new schema needed.

### Permissions
| Action | Roles |
|---|---|
| VIEW | super-admin only |

### Edge Cases
- Audit results limited to 100 rows per page
- Health endpoint must not expose hardware paths or internal IPs

---

## New Schemas to Create

| Schema | File Location |
|---|---|
| SuratSchema | `backend/src/schemas/surat.schema.ts` |
| RapatSchema | `backend/src/schemas/rapat.schema.ts` |
| KeuanganSchema | `backend/src/schemas/keuangan.schema.ts` |

## Reused Schemas (No Changes Needed)

- `ProgramSchema` → proker
- `UserSchema` → user management
- `RoleSchema` → role management
- `AuditLogSchema` → audit trail
