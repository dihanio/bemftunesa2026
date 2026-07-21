import { redirect } from "next/navigation";

export default function Home() {
  // Secara default arahkan pengunjung ke dashboard
  redirect("/dashboard");
}
