import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full bg-[#06130b] border-t border-white/10 rounded-t-[40px] md:rounded-t-[60px] pt-16 pb-8 relative z-10 text-gray-300">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-1">
          {/* Logo side by side with Brand Text */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <Image
                src="/logobemft.png"
                alt="Logo BEM FT"
                width={56}
                height={56}
                className="object-contain drop-shadow-md"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase font-sans leading-tight mb-1">
                BEM FT UNESA
              </h2>
              <span className="text-[9px] tracking-widest text-[#10b981] uppercase font-semibold leading-none">
                Kabinet Danadyaksa
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Wadah aspirasi dan inovasi mahasiswa Fakultas Teknik Universitas
            Negeri Surabaya. Sinergi Nyata, Teknik Berdaya.
          </p>
          <div className="flex gap-4 items-center mt-2">
            <a
              href="#"
              className="text-xs font-mono tracking-widest text-gray-400 hover:text-[#10b981] uppercase transition-colors"
            >
              Instagram
            </a>
            <span className="text-gray-700 font-mono text-[10px]">—</span>
            <a
              href="mailto:bemft@unesa.ac.id"
              className="text-xs font-mono tracking-widest text-gray-400 hover:text-[#10b981] uppercase transition-colors"
            >
              Email
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">
            Navigasi
          </h3>
          <ul className="space-y-3 text-xs font-bold uppercase tracking-wider">
            <li>
              <Link href="/" className="hover:text-[#10b981] transition-colors">
                Beranda
              </Link>
            </li>
            <li>
              <Link
                href="/tentang"
                className="hover:text-[#10b981] transition-colors"
              >
                Tentang Kami
              </Link>
            </li>
            <li>
              <Link
                href="/struktur"
                className="hover:text-[#10b981] transition-colors"
              >
                Struktur Organisasi
              </Link>
            </li>
            <li>
              <Link
                href="/proker"
                className="hover:text-[#10b981] transition-colors"
              >
                Program Kerja
              </Link>
            </li>
            <li>
              <Link
                href="/berita"
                className="hover:text-[#10b981] transition-colors"
              >
                Berita & Artikel
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">
            Layanan Portal
          </h3>
          <ul className="space-y-3 text-xs font-bold uppercase tracking-wider">
            <li>
              <a
                href="https://oprec.bemftunesa.org"
                className="hover:text-[#10b981] transition-colors"
              >
                BEM FT Shop
              </a>
            </li>
            <li>
              <a
                href="https://ims.bemftunesa.org"
                className="hover:text-[#10b981] transition-colors"
              >
                Portal PKKMB
              </a>
            </li>
            <li>
              <a
                href={
                  process.env.NEXT_PUBLIC_OPREC_URL ||
                  "https://oprec.bemftunesa.org"
                }
                className="hover:text-[#10b981] transition-colors"
              >
                Open Recruitment
              </a>
            </li>
            <li>
              <Link
                href="/aspirasi"
                className="hover:text-[#10b981] transition-colors"
              >
                Kotak Aspirasi
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">
            Sekretariat
          </h3>
          <ul className="space-y-6 text-xs">
            <li className="leading-relaxed">
              <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                {"// ALAMAT"}
              </span>
              <span className="text-gray-300">
                A11.02.01, Fakultas Teknik,
                <br />
                Universitas Negeri Surabaya,
                <br />
                Ketintang, Surabaya.
              </span>
            </li>
            <li>
              <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                {"// KONTAK"}
              </span>
              <span className="font-mono tracking-tighter text-gray-300">
                +62 812-3456-7890
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-left space-y-1">
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            © {new Date().getFullYear()} BEM FT UNESA. Hak Cipta Dilindungi.
          </p>
          <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">
            Didesain & Dikembangkan oleh Departemen Riset dan Teknologi.
          </p>
        </div>
        <div className="flex gap-8">
          <Link
            href="/privacy"
            className="text-[9px] font-mono text-gray-700 hover:text-[#10b981] transition-colors uppercase tracking-widest"
          >
            Kebijakan Privasi
          </Link>
          <Link
            href="/terms"
            className="text-[9px] font-mono text-gray-700 hover:text-[#10b981] transition-colors uppercase tracking-widest"
          >
            Syarat & Ketentuan
          </Link>
        </div>
      </div>
    </footer>
  );
}
