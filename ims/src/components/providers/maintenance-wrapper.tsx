"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@bemft/api-client";

interface Settings {
  maintenanceMode: boolean;
  publicAspirationFlow: boolean;
}

export function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
