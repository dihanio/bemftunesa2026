import HermesEditorialExperience from "@/components/landing/HermesEditorialExperience";

export const metadata = {
  title: "PKKMB FT UNESA 2026 — Interactive Editorial Experience",
  description:
    "Pengalaman sinematik editorial berbasis scroll untuk Mahasiswa Baru Fakultas Teknik Universitas Negeri Surabaya.",
};

export default function Home() {
  return (
    <main className="bg-[#040507] text-[#FAFAFA] selection:bg-[#D4AF37]/30">
      <HermesEditorialExperience />
    </main>
  );
}
