import { ProkerList } from "@/components/proker/proker-list";

export default function ProkerPage() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Manajemen Program Kerja
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kelola inisiatif strategis, pantau progres, dan koordinasikan tim
          pelaksana.
        </p>
      </div>

      <ProkerList />
    </div>
  );
}
