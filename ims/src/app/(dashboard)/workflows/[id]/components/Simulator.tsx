"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayCircle, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export function WorkflowSimulator({ workflowId }: { workflowId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [payload, setPayload] = useState({
    documentData: "{}",
    userRolesByStage: "{}",
    actionsSequence: '["submit"]'
  });

  const handleSimulate = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      let parsedDocData = {};
      let parsedUserRoles = {};
      let parsedActions = [];
      
      try {
        parsedDocData = JSON.parse(payload.documentData);
        parsedUserRoles = JSON.parse(payload.userRolesByStage);
        parsedActions = JSON.parse(payload.actionsSequence);
      } catch (e) {
        window.alert("Invalid JSON format in inputs");
        return;
      }
      
      const res = await api.post(`/workflow-management/${workflowId}/simulate`, {
        documentData: parsedDocData,
        userRolesByStage: parsedUserRoles,
        actionsSequence: parsedActions
      });
      
      setResult(res.data);
    } catch (error: any) {
      window.alert(error.response?.data?.message || "Simulation failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Document Data (JSON)</Label>
          <textarea 
            value={payload.documentData}
            onChange={(e) => setPayload({...payload, documentData: e.target.value})}
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent font-mono h-24"
            placeholder='{"amount": 1000}'
          />
          <p className="text-xs text-muted-foreground">Mock data used to evaluate conditions (e.g. document properties)</p>
        </div>
        
        <div className="space-y-2">
          <Label>User Roles (JSON)</Label>
          <textarea 
            value={payload.userRolesByStage}
            onChange={(e) => setPayload({...payload, userRolesByStage: e.target.value})}
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent font-mono h-24"
            placeholder='{"review_stage": ["reviewer", "admin"]}'
          />
          <p className="text-xs text-muted-foreground">Mock roles injected at specific stages to evaluate permissions</p>
        </div>
        
        <div className="space-y-2">
          <Label>Actions Sequence (JSON Array)</Label>
          <textarea 
            value={payload.actionsSequence}
            onChange={(e) => setPayload({...payload, actionsSequence: e.target.value})}
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent font-mono h-24"
            placeholder='["SUBMIT", "APPROVE"]'
          />
          <p className="text-xs text-muted-foreground">Ordered list of action keywords to simulate</p>
        </div>
        
        <Button onClick={handleSimulate} disabled={loading} className="w-full">
          <PlayCircle className="mr-2 h-4 w-4" /> 
          {loading ? "Running Simulation..." : "Run Simulation"}
        </Button>
      </div>
      
      <div className="border rounded-md p-4 bg-muted/20">
        <h4 className="font-semibold mb-4 border-b pb-2">Simulation Results</h4>
        
        {!result && !loading && (
          <div className="text-center text-muted-foreground py-10">
            Run simulation to see results here
          </div>
        )}
        
        {loading && (
          <div className="text-center text-muted-foreground py-10 animate-pulse">
            Simulating...
          </div>
        )}
        
        {result && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-background p-3 rounded border">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Final Stage</div>
                <div className="font-medium text-lg">{result.finalStageId}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Success</div>
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 inline-block" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-500 inline-block" />
                )}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-semibold mb-2">Execution Log</h5>
              <div className="space-y-2">
                {result.log?.map((entry: any, i: number) => (
                  <div key={i} className="bg-background p-2 rounded border text-sm flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground w-4">{i+1}.</span>
                      <span className="font-mono bg-secondary px-1 rounded text-xs">{entry.action}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{entry.fromStageId} → {entry.toStageId || '?'}</span>
                    </div>
                    {entry.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
