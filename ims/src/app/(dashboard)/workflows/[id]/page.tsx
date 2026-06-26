"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Copy, PlayCircle, Eye, GitCommit, GitPullRequest, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { StageManager } from "./components/StageManager";
import { TransitionManager } from "./components/TransitionManager";
import { WorkflowSimulator } from "./components/Simulator";

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [activeInstances, setActiveInstances] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, instancesRes] = await Promise.all([
        api.get(`/workflow-management/${params.id}`),
        api.get(`/workflow-management/${params.id}/active-instances`)
      ]);
      setWorkflow(wfRes.data);
      setActiveInstances(instancesRes.data.count || 0);
      
      // Auto-validate draft
      if (wfRes.data.status === 'draft') {
        const valRes = await api.get(`/workflow-management/${params.id}/validate`);
        setValidationResult(valRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch workflow details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async () => {
    try {
      const res = await api.post(`/workflow-management/${params.id}/clone`);
      router.push(`/workflows/${res.data._id}`);
    } catch (error) {
      console.error("Failed to clone workflow:", error);
    }
  };

  const handlePublish = async () => {
    try {
      if (validationResult && !validationResult.isValid) {
        window.alert("Cannot publish: Workflow has validation errors");
        return;
      }
      await api.post(`/workflow-management/${params.id}/publish`);
      window.alert("Workflow published successfully");
      fetchData(); // Refresh to see updated status
    } catch (error) {
      console.error("Failed to publish workflow:", error);
      window.alert("Failed to publish workflow");
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await api.put(`/workflow-management/${params.id}`, workflow);
      window.alert("Draft saved");
      
      // Re-validate
      const valRes = await api.get(`/workflow-management/${params.id}/validate`);
      setValidationResult(valRes.data);
    } catch (error) {
      console.error("Failed to save draft:", error);
      window.alert("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!workflow) return <div>Workflow not found</div>;

  const isReadOnly = workflow.status !== 'draft';

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/workflows">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-3xl font-bold tracking-tight">{workflow.name}</h2>
              <Badge variant={workflow.status === 'published' ? 'default' : 'secondary'} className={workflow.status === 'published' ? 'bg-green-500' : ''}>
                {workflow.status}
              </Badge>
              <Badge variant="outline">v{workflow.version}</Badge>
            </div>
            <p className="text-muted-foreground">
              {workflow.code} • {workflow.documentType}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {workflow.status === 'draft' && (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button 
                onClick={handlePublish} 
                disabled={validationResult && !validationResult.isValid}
                className={validationResult?.isValid ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <PlayCircle className="mr-2 h-4 w-4" /> Publish
              </Button>
            </>
          )}
          {workflow.status !== 'draft' && (
            <Button onClick={handleClone} variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Clone as v{workflow.version + 1}
            </Button>
          )}
        </div>
      </div>

      {validationResult && !validationResult.isValid && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <h4 className="font-semibold">Validation Errors</h4>
            <ul className="list-disc pl-5 text-sm mt-1">
              {validationResult.errors.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {validationResult?.isValid && workflow.status === 'draft' && (
        <div className="bg-green-500/15 border border-green-500 text-green-700 px-4 py-3 rounded-md flex items-center space-x-3">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Workflow is valid and ready to be published.</span>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview"><Eye className="mr-2 h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="stages"><GitCommit className="mr-2 h-4 w-4" /> Stages ({workflow.stages?.length || 0})</TabsTrigger>
          <TabsTrigger value="transitions"><GitPullRequest className="mr-2 h-4 w-4" /> Transitions ({workflow.transitions?.length || 0})</TabsTrigger>
          <TabsTrigger value="simulator"><PlayCircle className="mr-2 h-4 w-4" /> Simulator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Workflow Metadata</CardTitle>
                <CardDescription>Basic information about this workflow definition.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{workflow.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Created At</h4>
                    <p className="text-sm text-muted-foreground">{new Date(workflow.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Last Updated</h4>
                    <p className="text-sm text-muted-foreground">{new Date(workflow.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                  <span className="text-sm font-medium">Active Instances</span>
                  <span className="text-2xl font-bold">{activeInstances}</span>
                </div>
                {activeInstances > 0 && workflow.status === 'published' && (
                  <p className="text-xs text-amber-500">
                    Warning: Changing this published workflow may affect active documents. It is recommended to create a new version instead.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stages">
          <Card>
            <CardHeader>
              <CardTitle>Stages Definition</CardTitle>
              <CardDescription>The states that a document can be in.</CardDescription>
            </CardHeader>
            <CardContent>
              <StageManager 
                stages={workflow.stages || []} 
                onChange={(stages) => setWorkflow({ ...workflow, stages })} 
                readOnly={isReadOnly} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transitions">
          <Card>
            <CardHeader>
              <CardTitle>Transitions Definition</CardTitle>
              <CardDescription>Rules defining how documents move between stages.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransitionManager 
                transitions={workflow.transitions || []} 
                stages={workflow.stages || []}
                onChange={(transitions) => setWorkflow({ ...workflow, transitions })} 
                readOnly={isReadOnly} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Simulator</CardTitle>
              <CardDescription>Test transition logic without modifying real documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowSimulator workflowId={params.id as string} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
