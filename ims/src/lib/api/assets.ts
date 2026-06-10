import { api } from "@bemft/api-client";

export interface Asset {
  _id: string;
  name: string;
  code: string;
  stock: number;
  condition: "Good" | "Broken" | "Maintenance";
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetLoan {
  _id: string;
  assetId: string | { _id: string; name: string; code: string };
  borrowerId: string | { _id: string; name: string; nim: string; role: string };
  quantity: number;
  loanDate: string;
  returnDate?: string;
  status: "Requested" | "Approved" | "Borrowed" | "Returned" | "Rejected";
  createdAt: string;
  updatedAt: string;
}

export const assetsService = {
  // Ambil daftar barang/aset BEM
  listAssets: async (query?: any) => {
    return api.get<{ data: Asset[]; meta: any }>("/ims/assets", query);
  },

  // Tambah data aset baru
  createAsset: async (data: Partial<Asset>) => {
    return api.post<{ data: Asset; message: string }>("/ims/assets", data);
  },

  // Ambil daftar log peminjaman barang
  listLoans: async (query?: any) => {
    return api.get<{ data: AssetLoan[]; meta: any }>("/ims/asset-loans", query);
  },

  // Ajukan peminjaman barang baru
  createLoan: async (data: Partial<AssetLoan>) => {
    return api.post<{ data: AssetLoan; message: string }>(
      "/ims/asset-loans",
      data,
    );
  },

  // Ganti status approval/reject/returned peminjaman
  updateLoanStatus: async (loanId: string, status: AssetLoan["status"]) => {
    return api.patch<{ data: AssetLoan; message: string }>(
      `/ims/asset-loans/${loanId}/status`,
      {
        status,
      },
    );
  },
};
