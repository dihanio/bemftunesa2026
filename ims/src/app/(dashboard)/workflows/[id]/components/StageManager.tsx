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
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StageManager({ stages, onChange, readOnly }: { stages: any[], onChange: (stages: any[]) => void, readOnly: boolean }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    order: 0,
    expectedDuration: 0,
  });

  const handleEdit = (stage: any) => {
    setEditingStage(stage);
    setFormData({
      id: stage.id,
      name: stage.name,
      description: stage.description || "",
      order: stage.order,
      expectedDuration: stage.expectedDuration || 0,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingStage(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      order: stages.length,
      expectedDuration: 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(stages.filter(s => s.id !== id));
  };

  const handleSave = () => {
    if (editingStage) {
      onChange(stages.map(s => s.id === editingStage.id ? { ...s, ...formData } : s));
    } else {
      onChange([...stages, { ...formData }]);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Stages ({stages.length})</h3>
        {!readOnly && (
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Stage
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SLA (hours)</TableHead>
              {!readOnly && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No stages defined
                </TableCell>
              </TableRow>
            ) : (
              stages.sort((a, b) => a.order - b.order).map((stage) => (
                <TableRow key={stage.id}>
                  <TableCell>{stage.order}</TableCell>
                  <TableCell className="font-mono text-xs">{stage.id}</TableCell>
                  <TableCell className="font-medium">{stage.name}</TableCell>
                  <TableCell>{stage.expectedDuration || 0}</TableCell>
                  {!readOnly && (
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(stage)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(stage.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit Stage' : 'Create Stage'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id">Stage ID</Label>
              <Input 
                id="id" 
                value={formData.id} 
                onChange={(e) => setFormData({...formData, id: e.target.value})} 
                disabled={!!editingStage}
                placeholder="e.g. draft, review, approved"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Draft, Review Sekretaris"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="order">Order</Label>
                <Input 
                  id="order" 
                  type="number" 
                  value={formData.order} 
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expectedDuration">SLA (Hours)</Label>
                <Input 
                  id="expectedDuration" 
                  type="number" 
                  value={formData.expectedDuration} 
                  onChange={(e) => setFormData({...formData, expectedDuration: parseInt(e.target.value) || 0})} 
                />
              </div>
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
