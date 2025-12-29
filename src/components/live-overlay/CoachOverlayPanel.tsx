import React, { useState, useRef, useEffect } from 'react';
import { Pin, PinOff, Volume2, VolumeX, Save, GripVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMotion } from '@/contexts/MotionContext';
import { toast } from 'sonner';
import { useCreateStory } from '@/hooks/useStories';

interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'interviewer';
  text: string;
  timestamp: Date;
}

interface CoachingSuggestion {
  id: string;
  text: string;
  type: 'strength' | 'improvement' | 'tip';
  timestamp: Date;
}

interface RubricScore {
  dimension: string;
  score: number;
  feedback: string;
}

interface CoachOverlayPanelProps {
  transcripts: TranscriptEntry[];
  coachingSuggestions: CoachingSuggestion[];
  rubricScores: RubricScore[];
  answerDraft: string | null;
  isPinned: boolean;
  setIsPinned: (pinned: boolean) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  speakFeedback: boolean;
  setSpeakFeedback: (speak: boolean) => void;
  sessionId: string | null;
}

const CoachOverlayPanel: React.FC<CoachOverlayPanelProps> = ({
  transcripts,
  coachingSuggestions,
  rubricScores,
  answerDraft,
  isPinned,
  setIsPinned,
  opacity,
  setOpacity,
  speakFeedback,
  setSpeakFeedback,
  sessionId,
}) => {
  const { intensity } = useMotion();
  const createStory = useCreateStory();
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [size, setSize] = useState({ width: 380, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const handleSaveHighlight = async () => {
    if (!transcripts.length) {
      toast.error('No transcript to save');
      return;
    }

    try {
      const recentTranscript = transcripts
        .slice(-5)
        .map(t => t.text)
        .join(' ');

      await createStory.mutateAsync({
        title: 'Live Practice Highlight',
        situation: recentTranscript,
        task: null,
        action: null,
        result: coachingSuggestions.length > 0 
          ? coachingSuggestions[coachingSuggestions.length - 1].text 
          : null,
        tags: ['live-practice'],
        metrics: [],
      });

      toast.success('Saved to Story Bank!');
    } catch (error) {
      toast.error('Failed to save highlight');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-success';
    if (score >= 3) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div
      ref={panelRef}
      className="absolute z-30 glass-card border border-primary/30 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        minHeight: size.height,
        opacity: opacity / 100,
        boxShadow: '0 0 40px hsl(var(--primary) / 0.2), 0 0 80px hsl(var(--primary) / 0.1)',
      }}
    >
      {/* Header - Drag Handle */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 ${
          isPinned ? 'cursor-default' : 'cursor-move'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          {!isPinned && <GripVertical className="w-4 h-4 text-muted-foreground" />}
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">FaloodAI Coach</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSpeakFeedback(!speakFeedback)}
            title={speakFeedback ? 'Mute feedback' : 'Speak feedback'}
          >
            {speakFeedback ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin panel' : 'Pin panel'}
          >
            {isPinned ? (
              <Pin className="w-4 h-4 text-primary" />
            ) : (
              <PinOff className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="transcript" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-2">
          <TabsTrigger value="transcript" className="text-xs">Transcript</TabsTrigger>
          <TabsTrigger value="coaching" className="text-xs">Coaching</TabsTrigger>
          <TabsTrigger value="draft" className="text-xs">Answer Draft</TabsTrigger>
          <TabsTrigger value="rubric" className="text-xs">Rubric</TabsTrigger>
        </TabsList>

        {/* Live Transcript Tab */}
        <TabsContent value="transcript" className="m-0 p-0">
          <ScrollArea className="h-[350px]">
            <div className="p-3 space-y-2">
              {transcripts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Transcript will appear here as you speak...
                </p>
              ) : (
                transcripts.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`p-2 rounded-lg text-sm ${
                      entry.speaker === 'user'
                        ? 'bg-primary/10 border-l-2 border-primary'
                        : 'bg-accent/10 border-l-2 border-accent'
                    } ${intensity === 'magical' && idx === transcripts.length - 1 ? 'animate-fade-in-up' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {entry.speaker === 'user' ? 'You' : 'Interviewer'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-foreground">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Coaching Suggestions Tab */}
        <TabsContent value="coaching" className="m-0 p-0">
          <ScrollArea className="h-[350px]">
            <div className="p-3 space-y-2">
              {coachingSuggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Coaching suggestions will appear as you answer questions...
                </p>
              ) : (
                coachingSuggestions.map((suggestion, idx) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg text-sm ${
                      suggestion.type === 'strength'
                        ? 'bg-success/10 border-l-2 border-success'
                        : suggestion.type === 'improvement'
                        ? 'bg-warning/10 border-l-2 border-warning'
                        : 'bg-primary/10 border-l-2 border-primary'
                    } ${intensity === 'magical' && idx === coachingSuggestions.length - 1 ? 'animate-slide-in-left' : ''}`}
                  >
                    <p className="text-foreground">{suggestion.text}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Answer Draft Tab */}
        <TabsContent value="draft" className="m-0 p-0">
          <ScrollArea className="h-[350px]">
            <div className="p-3">
              {answerDraft ? (
                <div className="glass-card p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Suggested Response Structure</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{answerDraft}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  A suggested answer structure will appear after questions are detected...
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Rubric Tab */}
        <TabsContent value="rubric" className="m-0 p-0">
          <ScrollArea className="h-[350px]">
            <div className="p-3 space-y-2">
              {rubricScores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Rubric scores will update as you answer questions...
                </p>
              ) : (
                rubricScores.map((score) => (
                  <div key={score.dimension} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-foreground">{score.dimension}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getScoreColor(score.score)}`}>
                        {score.score}
                      </span>
                      <span className="text-xs text-muted-foreground">/5</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer Controls */}
      <div className="border-t border-border p-3 space-y-3 bg-card/80">
        {/* Opacity Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14">Opacity</span>
          <Slider
            value={[opacity]}
            onValueChange={(val) => setOpacity(val[0])}
            min={50}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{opacity}%</span>
        </div>

        {/* Save Highlight Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveHighlight}
          className="w-full gap-2"
          disabled={transcripts.length === 0}
        >
          <Save className="w-4 h-4" />
          Save Highlight to Story Bank
        </Button>
      </div>
    </div>
  );
};

export default CoachOverlayPanel;
