import { api } from "@bemft/api-client";

export interface Meeting {
  _id: string;
  title: string;
  prokerId?: string;
  date: string;
  location?: string;
  qrCodeUrl?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  meetingId: string;
  userId: string;
  attendedAt: string;
}

export interface MeetingNote {
  _id: string;
  meetingId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export const meetingsService = {
  // Ambil daftar rapat
  list: async (query?: any) => {
    return api.get<{ data: Meeting[]; meta: any }>("/ims/meetings", query);
  },

  // Detail rapat, notulensi & riwayat absensi
  getDetail: async (id: string) => {
    return api.get<{
      data: {
        meeting: Meeting;
        notes: MeetingNote | null;
        attendance: Array<{
          _id: string;
          meetingId: string;
          userId: {
            _id: string;
            name: string;
            nim: string;
            email: string;
            role: string;
          };
          attendedAt: string;
        }>;
      };
    }>(`/ims/meetings/${id}`);
  },

  // Buat agenda rapat baru
  create: async (data: Partial<Meeting>) => {
    return api.post<{ data: Meeting; message: string }>("/ims/meetings", data);
  },

  // Absensi scan QR code
  attend: async (
    meetingId: string,
    userId: string,
    latitude?: number,
    longitude?: number,
  ) => {
    return api.post<{ data: Attendance; message: string }>(
      `/ims/meetings/${meetingId}/attend`,
      {
        userId,
        latitude,
        longitude,
      },
    );
  },

  // Input/Simpan notulensi rapat
  addNotes: async (meetingId: string, content: string, authorId: string) => {
    return api.put<{ data: MeetingNote; message: string }>(
      `/ims/meetings/${meetingId}/notes`,
      {
        content,
        authorId,
      },
    );
  },
};
