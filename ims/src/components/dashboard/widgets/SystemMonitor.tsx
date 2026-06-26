"use client";

import React from 'react';
import { Activity, Cpu, Database, Network } from 'lucide-react';

export function SystemMonitor({ metrics }: { metrics?: any }) {
  const cpuStr = metrics?.cpuUsage || '0%';
  const memStr = metrics?.memoryUsage || '0%';
  
  const cpuVal = parseInt(cpuStr.replace('%', '')) || 0;
  const memVal = parseInt(memStr.replace('%', '')) || 0;
  
  const dbStatus = metrics?.dbSize ? `Online (${metrics.dbSize})` : 'Online';
  const errorRate = metrics?.errorRate || '0%';

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Sistem Telemetri
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Online
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="bg-background/40 border border-sage/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2 z-10">
            <Cpu className="w-4 h-4 text-sage" />
            <span className="text-xs text-foreground/50">CPU Usage</span>
          </div>
          <span className="text-2xl font-mono font-bold text-foreground z-10">{cpuStr}</span>
          <div 
            className="absolute bottom-0 left-0 h-1 bg-sage transition-all duration-1000 ease-in-out opacity-50"
            style={{ width: `${cpuVal}%` }}
          />
        </div>

        <div className="bg-background/40 border border-sage/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2 z-10">
            <Activity className="w-4 h-4 text-accent-blue" />
            <span className="text-xs text-foreground/50">Memory</span>
          </div>
          <span className="text-2xl font-mono font-bold text-foreground z-10">{memStr}</span>
          <div 
            className="absolute bottom-0 left-0 h-1 bg-accent-blue transition-all duration-1000 ease-in-out opacity-50"
            style={{ width: `${memVal}%` }}
          />
        </div>

        <div className="bg-background/40 border border-sage/5 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-foreground/50" />
            <span className="text-xs text-foreground/50">Database</span>
          </div>
          <span className="text-sm font-mono font-bold text-emerald-400">{dbStatus}</span>
        </div>

        <div className="bg-background/40 border border-sage/5 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-foreground/50" />
            <span className="text-xs text-foreground/50">Error Rate</span>
          </div>
          <span className="text-sm font-mono font-bold text-foreground">{errorRate}</span>
        </div>
      </div>
    </div>
  );
}
