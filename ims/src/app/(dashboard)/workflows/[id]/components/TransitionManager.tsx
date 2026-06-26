"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TransitionManager({ transitions, stages, onChange, readOnly }: { transitions: any[], stages: any[], onChange: (transitions: any[]) => void, readOnly: boolean }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransition, setEditingTransition] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    action: "",
    fromStage: "",
    toStage: "",
    priority: 0,
    conditionsStr: "[]",
  });

  const handleEdit = (transition: any) => {
    setEditingTransition(transition);
    setFormData({
      id: transition.id,
      name: transition.name,
      action: transition.action,
      fromStage: transition.fromStage,
      toStage: transition.toStage,
      priority: transition.priority || 0,
      conditionsStr: JSON.stringify(transition.conditions || [], null, 2),
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTransition(null);
    setFormData({
      id: "",
      name: "",
      action: "",
      fromStage: "",
      toStage: "",
      priority: 0,
      conditionsStr: "[]",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(transitions.filter(t => t.id !== id));
  };

  const handleSave = () => {
    let conditions = [];
    try {
      conditions = JSON.parse(formData.conditionsStr);
    } catch (e) {
      alert("Invalid conditions JSON");
      return;
    }
    
    const transitionData = {
      id: formData.id,
      name: formData.name,
      action: formData.action,
      fromStage: formData.fromStage,
      toStage: formData.toStage,
      priority: formData.priority,
      conditions
    };

    if (editingTransition) {
      onChange(transitions.map(t => t.id === editingTransition.id ? { ...t, ...transitionData } : t));
    } else {
      onChange([...transitions, transitionData]);
    }
    setIsDialogOpen(false);
  };

  const getStageName = (id: string) => {
    const stage = stages.find(s => s.id === id);
    return stage ? stage.name : id;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Transitions ({transitions.length})</h3>
        {!readOnly && (
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Transition
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID / Name</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Priority</TableHead>
              {!readOnly && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No transitions defined
                </TableCell>
              </TableRow>
            ) : (
              transitions.map((transition) => (
                <TableRow key={transition.id}>
                  <TableCell>
                    <div className="font-medium">{transition.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{transition.id}</div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-secondary px-2 py-1 rounded text-xs font-medium">
                      {transition.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>{getStageName(transition.fromStage)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span>{getStageName(transition.toStage)}</span>
                    </div>
                    {transition.conditions?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        + {transition.conditions.length} conditions
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{transition.priority || 0}</TableCell>
                  {!readOnly && (
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(transition)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(transition.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTransition ? 'Edit Transition' : 'Create Transition'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="id">Transition ID</Label>
                <Input 
                  id="id" 
                  value={formData.id} 
                  onChange={(e) => setFormData({...formData, id: e.target.value})} 
                  disabled={!!editingTransition}
                  placeholder="e.g. submit_draft"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="action">Action Keyword</Label>
                <Input 
                  id="action" 
                  value={formData.action} 
                  onChange={(e) => setFormData({...formData, action: e.target.value})} 
                  placeholder="e.g. SUBMIT, APPROVE"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Submit to Reviewer"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fromStage">From Stage</Label>
                <Select value={formData.fromStage} onValueChange={(val: string) => setFormData({...formData, fromStage: val})}>
                  <SelectTrigger id="fromStage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name} ({stage.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="toStage">To Stage</Label>
                <Select value={formData.toStage} onValueChange={(val: string) => setFormData({...formData, toStage: val})}>
                  <SelectTrigger id="toStage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name} ({stage.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Evaluation Priority</Label>
              <Input 
                id="priority" 
                type="number" 
                value={formData.priority} 
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} 
              />
              <p className="text-xs text-muted-foreground">Higher number = evaluated first when multiple transitions share the same action</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conditions">Conditions (JSON Array)</Label>
              <textarea 
                id="conditions" 
                className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                value={formData.conditionsStr} 
                onChange={(e) => setFormData({...formData, conditionsStr: e.target.value})} 
                placeholder="[]"
              />
              <p className="text-xs text-muted-foreground">Example: {`[{"type": "HasRoleCondition", "params": {"role": "reviewer"}}]`}</p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
