// Shared TypeScript types for BEM FT UNESA Digital Ecosystem

export type UserRole =
  | 'superadmin'
  | 'ketua_bem'
  | 'wakil_ketua_bem'
  | 'admin'
  | 'sekretaris' | 'bendahara'
  | 'kadep' | 'wakadep'
  | 'staf' | 'guest';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  departmentId?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  slug: string;
  headId?: string | { _id: string; name: string; role: string; avatar?: string };
  createdAt?: string;
}

export interface NewsItem {
  _id: string;
  slug: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  category: string;
  date: string;
  author: string;
  summary?: string;
  createdAt?: string;
}

export interface ProkerItem {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Archived';
  progress: number;
  startDate?: string;
  endDate?: string;
  budget: {
    allocated: number;
    expended: number;
  };
  departmentId: string | { _id: string; name: string; code?: string };
  pjId: string | { _id: string; name: string; avatar?: string };
  milestones: Array<{
    title: string;
    isCompleted: boolean;
    dueDate?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AspirationItem {
  _id: string;
  ticketId: string;
  name?: string;
  email?: string;
  subject: string;
  message: string;
  category: 'fasilitas' | 'ukt' | 'birokrasi' | 'kesejahteraan' | 'lainnya';
  status: 'pending' | 'processing' | 'resolved';
  response?: {
    message: string;
    respondedBy: string | { _id: string; name: string; role: string };
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgendaItem {
  _id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export interface StatsData {
  departments: number;
  members: number;
  proker: number;
  aspirations: {
    total: number;
    pending: number;
    resolved: number;
  };
}

export interface AspirationInput {
  name?: string;
  email?: string;
  subject: string;
  message: string;
  category: string;
}

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Additional schemas for IMS

export interface SuratItem {
  _id: string;
  nomorSurat?: string;
  perihal: string;
  jenisSurat: 'internal' | 'eksternal' | 'tugas' | 'keterangan';
  fileUrl?: string;
  status: 'draft' | 'waiting_secretary' | 'waiting_chairman' | 'approved' | 'rejected';
  creatorId: string | { _id: string; name: string; role: string };
  history: Array<{
    status: string;
    actorId: string | { _id: string; name: string };
    note?: string;
    updatedAt: string;
  }>;
  signature?: {
    qrCodeUrl: string;
    signedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KeuanganItem {
  _id: string;
  prokerId: string | { _id: string; title: string };
  tipe: 'RAB' | 'LPJ';
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  status: 'draft' | 'pending_treasurer' | 'pending_chairman' | 'approved' | 'rejected';
  approvals: Array<{
    actorId: string | { _id: string; name: string };
    role: 'bendahara' | 'ketua_bem';
    status: 'approved' | 'rejected';
    note?: string;
    updatedAt: string;
  }>;
  receiptsUrls?: string[];
  createdAt: string;
}

export interface RapatItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    radiusMeter: number;
  };
  qrCodeActiveToken?: string;
  notulensi?: string;
  attendance: Array<{
    userId: string | { _id: string; name: string; role: string };
    status: 'present' | 'absent' | 'excused' | 'late';
    registeredAt?: string;
    coordinatesUsed?: {
      latitude: number;
      longitude: number;
    };
  }>;
  createdAt: string;
}

export interface AssetItem {
  _id: string;
  assetCode: string;
  name: string;
  quantity: number;
  condition: 'good' | 'damaged_light' | 'damaged_heavy';
  location: string;
  loans: Array<{
    userId: string | { _id: string; name: string };
    quantity: number;
    loanDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'requested' | 'approved' | 'active' | 'returned' | 'overdue';
  }>;
}
