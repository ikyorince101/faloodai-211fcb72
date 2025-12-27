import React, { useState } from 'react';
import { InterviewRound, useUpdateRound, useDeleteRound } from '@/hooks/useInterviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Calendar, Edit2, Trash2, Play, Check, X, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InterviewRoundCardProps {
  round: InterviewRound;
  onGeneratePrepPlan: (roundId: string, roundName: string) => void;
  linkedSessionCount: number;
}

const outcomeColors = {
  pending: 'bg-muted text-muted-foreground',
  passed: 'bg-success/20 text-success',
  failed: 'bg-destructive/20 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
  rescheduled: 'bg-warning/20 text-warning',
};

const InterviewRoundCard: React.FC<InterviewRoundCardProps> = ({ 
  round, 
  onGeneratePrepPlan,
  linkedSessionCount 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    round_name: round.round_name,
    round_date: round.round_date ? format(new Date(round.round_date), "yyyy-MM-dd'T'HH:mm") : '',
    outcome: round.outcome || 'pending',
    notes: round.notes || '',
  });

  const updateRound = useUpdateRound();
  const deleteRound = useDeleteRound();

  const handleSave = async () => {
    try {
      await updateRound.mutateAsync({
        id: round.id,
        round_name: editData.round_name,
        round_date: editData.round_date ? new Date(editData.round_date).toISOString() : null,
        outcome: editData.outcome as any,
        notes: editData.notes || null,
      });
      setIsEditing(false);
      toast.success('Round updated');
    } catch (error) {
      toast.error('Failed to update round');
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this interview round?')) {
      try {
        await deleteRound.mutateAsync(round.id);
        toast.success('Round deleted');
      } catch (error) {
        toast.error('Failed to delete round');
      }
    }
  };

  if (isEditing) {
    return (
      <div className="glass-card p-4 space-y-3">
        <Input
          value={editData.round_name}
          onChange={(e) => setEditData(prev => ({ ...prev, round_name: e.target.value }))}
          placeholder="Round name"
          className="font-medium"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="datetime-local"
            value={editData.round_date}
            onChange={(e) => setEditData(prev => ({ ...prev, round_date: e.target.value }))}
          />
          <Select 
            value={editData.outcome} 
            onValueChange={(v) => setEditData(prev => ({ ...prev, outcome: v as typeof prev.outcome }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={editData.notes}
          onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notes, questions asked, etc."
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="gap-1">
            <Check className="w-4 h-4" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            <X className="w-4 h-4" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 hover-halo transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground">{round.round_name}</h4>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", outcomeColors[round.outcome || 'pending'])}>
              {round.outcome || 'pending'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {round.round_date ? format(new Date(round.round_date), 'MMM d, yyyy h:mm a') : 'Not scheduled'}
            </span>
            {linkedSessionCount > 0 && (
              <span className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                {linkedSessionCount} practice session{linkedSessionCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {round.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{round.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8"
            onClick={() => onGeneratePrepPlan(round.id, round.round_name)}
          >
            <Sparkles className="w-4 h-4 text-accent" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoundCard;
