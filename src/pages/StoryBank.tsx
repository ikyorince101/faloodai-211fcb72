import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Search, Sparkles, X, Star, Edit2, Trash2 } from 'lucide-react';
import { useStories, useCreateStory, useUpdateStory, useDeleteStory, Story } from '@/hooks/useStories';
import { useMotion } from '@/contexts/MotionContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StoryFormData {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  metrics: string[];
}

const emptyForm: StoryFormData = {
  title: '',
  situation: '',
  task: '',
  action: '',
  result: '',
  tags: [],
  metrics: [],
};

const StoryBank: React.FC = () => {
  const { data: stories = [], isLoading } = useStories();
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();
  const { intensity } = useMotion();

  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState<StoryFormData>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [metricInput, setMetricInput] = useState('');
  const [showConstellation, setShowConstellation] = useState(false);

  // Extract all unique tags from stories
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    stories.forEach(story => {
      const storyTags = story.tags as string[] | null;
      storyTags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [stories]);

  // Filter stories
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = search === '' || 
        story.title.toLowerCase().includes(search.toLowerCase()) ||
        story.situation?.toLowerCase().includes(search.toLowerCase()) ||
        story.action?.toLowerCase().includes(search.toLowerCase()) ||
        story.result?.toLowerCase().includes(search.toLowerCase());
      
      const storyTags = story.tags as string[] | null;
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => storyTags?.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  }, [stories, search, selectedTags]);

  const handleOpenCreate = () => {
    setEditingStory(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (story: Story) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      situation: story.situation || '',
      task: story.task || '',
      action: story.action || '',
      result: story.result || '',
      tags: (story.tags as string[]) || [],
      metrics: (story.metrics as string[]) || [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingStory) {
        await updateStory.mutateAsync({
          id: editingStory.id,
          title: formData.title,
          situation: formData.situation || null,
          task: formData.task || null,
          action: formData.action || null,
          result: formData.result || null,
          tags: formData.tags,
          metrics: formData.metrics,
        });
        toast.success('Story updated');
      } else {
        await createStory.mutateAsync({
          title: formData.title,
          situation: formData.situation || null,
          task: formData.task || null,
          action: formData.action || null,
          result: formData.result || null,
          tags: formData.tags,
          metrics: formData.metrics,
        });
        toast.success('Story created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save story');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStory.mutateAsync(id);
      toast.success('Story deleted');
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addMetric = () => {
    if (metricInput.trim() && !formData.metrics.includes(metricInput.trim())) {
      setFormData({ ...formData, metrics: [...formData.metrics, metricInput.trim()] });
      setMetricInput('');
    }
  };

  const removeMetric = (metric: string) => {
    setFormData({ ...formData, metrics: formData.metrics.filter(m => m !== metric) });
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Constellation view logic
  const constellationData = useMemo(() => {
    if (!showConstellation) return null;
    
    const nodes = filteredStories.map((story, i) => {
      const angle = (i / filteredStories.length) * Math.PI * 2;
      const radius = 120 + Math.random() * 60;
      return {
        id: story.id,
        title: story.title,
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        tags: (story.tags as string[]) || [],
      };
    });

    const connections: { from: string; to: string; tag: string }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sharedTags = nodes[i].tags.filter(t => nodes[j].tags.includes(t));
        if (sharedTags.length > 0) {
          connections.push({ from: nodes[i].id, to: nodes[j].id, tag: sharedTags[0] });
        }
      }
    }

    return { nodes, connections };
  }, [filteredStories, showConstellation]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Story Bank</h1>
          <p className="text-muted-foreground">Save STAR stories once, reuse for resumes and interviews.</p>
        </div>
        <div className="flex items-center gap-2">
          {intensity === 'magical' && (
            <Button
              variant={showConstellation ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowConstellation(!showConstellation)}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Constellation
            </Button>
          )}
          <Button onClick={handleOpenCreate} className="gap-2 bg-gradient-aurora text-background">
            <Plus className="w-4 h-4" /> Add Story
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Constellation View */}
      {showConstellation && constellationData && filteredStories.length > 0 && (
        <div className="glass-card p-4 overflow-hidden">
          <svg viewBox="0 0 400 400" className="w-full h-80">
            {/* Connections */}
            {constellationData.connections.map((conn, i) => {
              const from = constellationData.nodes.find(n => n.id === conn.from);
              const to = constellationData.nodes.find(n => n.id === conn.to);
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  opacity="0.3"
                  className="animate-pulse"
                />
              );
            })}
            {/* Stars */}
            {constellationData.nodes.map(node => (
              <g key={node.id} className="cursor-pointer" onClick={() => {
                const story = stories.find(s => s.id === node.id);
                if (story) handleOpenEdit(story);
              }}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill="hsl(var(--primary))"
                  className="animate-pulse"
                />
                <Star
                  x={node.x - 6}
                  y={node.y - 6}
                  width={12}
                  height={12}
                  className="text-background fill-current"
                />
                <text
                  x={node.x}
                  y={node.y + 20}
                  textAnchor="middle"
                  className="text-xs fill-foreground"
                >
                  {node.title.length > 15 ? node.title.slice(0, 15) + '...' : node.title}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* List View */}
      {!showConstellation && (
        <>
          {isLoading ? (
            <div className="glass-card p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {stories.length === 0 ? 'No stories yet' : 'No matching stories'}
              </h3>
              <p className="text-muted-foreground">
                {stories.length === 0 
                  ? 'Add your first STAR story to build your narrative library.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStories.map(story => {
                const storyTags = (story.tags as string[]) || [];
                const storyMetrics = (story.metrics as string[]) || [];
                return (
                  <div
                    key={story.id}
                    className={`glass-card p-4 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${
                      intensity === 'magical' ? 'animate-breathe' : ''
                    }`}
                    onClick={() => handleOpenEdit(story)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{story.title}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(story); }}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(story.id); }}
                          className="p-1 hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    {story.situation && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {story.situation}
                      </p>
                    )}
                    {storyTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {storyTags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {storyTags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{storyTags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    {storyMetrics.length > 0 && (
                      <div className="text-xs text-primary">
                        📊 {storyMetrics.length} metric{storyMetrics.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStory ? 'Edit Story' : 'Add Story'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Led cross-functional team to launch new product"
              />
            </div>
            <div>
              <Label htmlFor="situation">Situation</Label>
              <Textarea
                id="situation"
                value={formData.situation}
                onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                placeholder="Describe the context and challenge..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="task">Task</Label>
              <Textarea
                id="task"
                value={formData.task}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                placeholder="What was your specific responsibility..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Textarea
                id="action"
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                placeholder="What steps did you take..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="result">Result</Label>
              <Textarea
                id="result"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                placeholder="What was the outcome..."
                rows={2}
              />
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Metrics</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={metricInput}
                  onChange={(e) => setMetricInput(e.target.value)}
                  placeholder="e.g., 25% increase in revenue"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMetric())}
                />
                <Button type="button" variant="outline" onClick={addMetric}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.metrics.map(metric => (
                  <Badge key={metric} variant="outline" className="gap-1">
                    📊 {metric}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeMetric(metric)} />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createStory.isPending || updateStory.isPending}>
                {editingStory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryBank;
