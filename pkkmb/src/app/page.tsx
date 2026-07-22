import { redirect } from "next/navigation";

export default function Home() {
  // Secara default arahkan pengunjung ke halaman login
  // Halaman login akan otomatis mendeteksi jika user sudah login dan mengarahkannya ke dashboard.
  redirect("/login");
}
