'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface DiagnosisFormProps {
  repair: any;
  onUpdate: () => void;
}

export function DiagnosisForm({ repair, onUpdate }: DiagnosisFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    diagnosisNotes: repair.diagnosisNotes || '',
    estimatedCost: repair.estimatedCost || 0,
    estimatedDuration: repair.estimatedDuration || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisNotes: formData.diagnosisNotes,
          estimatedCost: parseFloat(formData.estimatedCost.toString()),
          estimatedDuration: formData.estimatedDuration,
          status: repair.status === 'pending' ? 'diagnosed' : repair.status,
          diagnosedAt: repair.diagnosedAt || new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update diagnosis');

      toast({
        title: 'Diagnosis updated',
        description: 'Repair diagnosis has been saved',
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnosis & Quote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosisNotes">Diagnosis Notes</Label>
            <Textarea
              id="diagnosisNotes"
              placeholder="Detailed diagnosis findings..."
              value={formData.diagnosisNotes}
              onChange={(e) => setFormData({ ...formData, diagnosisNotes: e.target.value })}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost (RWF)</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration</Label>
              <Input
                id="estimatedDuration"
                placeholder="e.g., 2-3 days"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Diagnosis'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
