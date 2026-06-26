import DashboardShell from "@/components/DashboardShell";
import { Hammer } from "lucide-react";

export default function UnderConstructionPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 text-center">
        <div className="w-20 h-20 bg-sage/10 text-sage rounded-2xl flex items-center justify-center mb-6">
          <Hammer className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Sedang Dibangun</h1>
        <p className="text-foreground/60 max-w-md">
          Halaman ini masih dalam tahap pengembangan. Fitur akan segera tersedia pada update berikutnya.
        </p>
      </div>
    </DashboardShell>
  );
}
