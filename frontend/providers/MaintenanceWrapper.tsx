"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { api } from "@bemft/api-client";

interface Settings {
  maintenanceMode: boolean;
  publicAspirationFlow: boolean;
}

export function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
