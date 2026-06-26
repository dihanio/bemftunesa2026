"use client";

import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Search, Activity, Archive, FileText, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import api from "@/lib/api";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workflowsRes, summaryRes] = await Promise.all([
        api.get("/workflow-management"),
        api.get("/workflow-management/summary")
      ]);
      
      setWorkflows(workflowsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'published': return <Badge className="bg-green-500">Published</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'deprecated': return <Badge variant="destructive">Deprecated</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Management</h2>
          <p className="text-muted-foreground">
            Manage workflow definitions, stages, and transition logic across all document types.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Workflows
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{summary?.total || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              All workflow definitions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Published
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{summary?.published || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Active in production
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Drafts
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{summary?.draft || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Under development
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Deprecated
            </CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{summary?.deprecated || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Legacy definitions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Registry</CardTitle>
              <CardDescription>View and manage your organization's workflow patterns.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search workflows..."
                className="pl-8 bg-background"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stages</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No workflows found.
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((wf) => (
                  <TableRow key={wf._id}>
                    <TableCell className="font-medium">{wf.code}</TableCell>
                    <TableCell>{wf.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{wf.documentType}</Badge>
                    </TableCell>
                    <TableCell>v{wf.version}</TableCell>
                    <TableCell>{getStatusBadge(wf.status)}</TableCell>
                    <TableCell>{wf.stages?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/workflows/${wf._id}`}>
                        <Button variant="ghost" size="sm">Manage</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
