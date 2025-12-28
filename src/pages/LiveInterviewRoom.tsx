import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Pause, Play, SkipForward, RotateCcw, X, Save, Volume2, Loader2, Check } from 'lucide-react';
import { useMotion } from '@/contexts/MotionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateStory } from '@/hooks/useStories';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder, speakText } from '@/utils/audioUtils';
import { toast } from 'sonner';

interface InterviewQuestion {
  id: number;
  question: string;
  competencies: string[];
  followUps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface RubricScore {
  dimension: string;
  score: number; // 0-5 scale
  feedback: string;
}

interface CoachingFeedback {
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  rubric: RubricScore[];
  overallScore: number; // 0-100 percentage
  spokenFeedback: string;
  writtenFeedback?: string[];
  retryConstraints?: string[];
}

interface QuestionState {
  transcript: string;
  feedback: CoachingFeedback | null;
  audioUrl: string | null;
  status: 'pending' | 'recording' | 'processing' | 'complete';
}

const LiveInterviewRoom: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { intensity } = useMotion();
  const createStory = useCreateStory();

  // Session state
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});
  const [sessionId] = useState(searchParams.get('session') || '');
  const [mode] = useState('behavioral');
  const [difficulty] = useState('medium');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Current question state
  const currentQuestion = questions[currentIndex];
  const currentState = questionStates[currentIndex] || { 
    transcript: '', 
    feedback: null, 
    audioUrl: null, 
    status: 'pending' 
  };

  // Load questions from sessionStorage (generated in InterviewPractice) or use fallback
  useEffect(() => {
    if (!sessionId) return;

    const storedQuestions = sessionStorage.getItem(`session-${sessionId}-questions`);
    if (storedQuestions) {
      try {
        const parsed = JSON.parse(storedQuestions);
        setQuestions(parsed);
        // Clean up after loading
        sessionStorage.removeItem(`session-${sessionId}-questions`);
        return;
      } catch (e) {
        console.error('Failed to parse stored questions:', e);
      }
    }

    // Fallback: use mock questions if no stored plan
    const mockQuestions: InterviewQuestion[] = [
      {
        id: 1,
        question: "Tell me about a time when you had to lead a team through a challenging project with tight deadlines.",
        competencies: ["leadership", "time-management", "problem-solving"],
        followUps: ["What was the biggest obstacle?", "How did you motivate your team?", "What would you do differently?"],
        difficulty: "medium"
      },
      {
        id: 2,
        question: "Describe a situation where you had to influence stakeholders without having direct authority over them.",
        competencies: ["influence", "communication", "stakeholder-management"],
        followUps: ["What approach did you take?", "How did you build trust?", "What was the outcome?"],
        difficulty: "medium"
      },
      {
        id: 3,
        question: "Tell me about a time when you failed at something. How did you handle it?",
        competencies: ["resilience", "self-awareness", "growth-mindset"],
        followUps: ["What did you learn?", "How did it change your approach?", "Would you make the same decision again?"],
        difficulty: "hard"
      }
    ];
    setQuestions(mockQuestions);
  }, [sessionId]);

  const updateQuestionState = useCallback((index: number, updates: Partial<QuestionState>) => {
    setQuestionStates(prev => ({
      ...prev,
      [index]: { ...prev[index], ...updates }
    }));
  }, []);

  const startRecording = async () => {
    try {
      recorderRef.current = new AudioRecorder(setAmplitude);
      await recorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      updateQuestionState(currentIndex, { status: 'recording' });
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const pauseRecording = () => {
    recorderRef.current?.pause();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    recorderRef.current?.resume();
    setIsPaused(false);
  };

  const stopAndProcess = async () => {
    if (!recorderRef.current || !user) return;

    setIsRecording(false);
    setIsPaused(false);
    setIsProcessing(true);
    updateQuestionState(currentIndex, { status: 'processing' });

    try {
      // Stop recording
      const audioBlob = await recorderRef.current.stop();
      recorderRef.current = null;
      setAmplitude(0);

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-q${currentIndex}.webm`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, audioBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio');
      }

      const audioUrl = filePath;
      updateQuestionState(currentIndex, { audioUrl });

      // Transcribe
      toast.info('Transcribing...');
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioPath: filePath }
      });

      if (transcriptError) {
        console.error('Transcription error:', transcriptError);
      }

      const transcript = transcriptData?.transcript || '[Transcription unavailable]';
      updateQuestionState(currentIndex, { transcript });

      // Get coaching feedback
      toast.info('Analyzing your answer...');
      const { data: coachingData, error: coachingError } = await supabase.functions.invoke('coach-answer', {
        body: {
          transcript,
          question: currentQuestion.question,
          followUps: currentQuestion.followUps,
          competencies: currentQuestion.competencies,
          mode,
          difficulty,
        }
      });

      if (coachingError) {
        console.error('Coaching error:', coachingError);
      }

      const feedback = coachingData as CoachingFeedback;
      updateQuestionState(currentIndex, { feedback, status: 'complete' });

      // Save practice event to database
      if (sessionId) {
        await supabase.from('practice_events').insert({
          session_id: sessionId,
          event_type: 'ai_feedback',
          question_text: currentQuestion.question,
          transcript_text: transcript,
          audio_url: audioUrl,
          feedback: { 
            overallFeedback: feedback?.overallFeedback,
            strengths: feedback?.strengths,
            improvements: feedback?.improvements,
          },
          rubric: feedback?.rubric?.reduce((acc, r) => ({ ...acc, [r.dimension]: r.score }), {}),
        });
      }

      // Speak the feedback
      if (feedback?.spokenFeedback) {
        setIsSpeaking(true);
        await speakText(feedback.spokenFeedback);
        setIsSpeaking(false);
      }

      toast.success('Feedback ready!');
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process answer');
      updateQuestionState(currentIndex, { status: 'pending' });
    } finally {
      setIsProcessing(false);
    }
  };

  const retryQuestion = () => {
    updateQuestionState(currentIndex, { 
      transcript: '', 
      feedback: null, 
      audioUrl: null, 
      status: 'pending' 
    });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (!isRecording && !isProcessing) {
      setCurrentIndex(index);
    }
  };

  const saveToStoryBank = async () => {
    if (!currentState.transcript || !currentQuestion) return;

    try {
      await createStory.mutateAsync({
        title: currentQuestion.question.substring(0, 50) + '...',
        situation: currentState.transcript,
        task: null,
        action: null,
        result: currentState.feedback?.overallFeedback || null,
        tags: currentQuestion.competencies,
        metrics: [],
      });
      toast.success('Saved to Story Bank!');
    } catch (error) {
      toast.error('Failed to save story');
    }
  };

  const endSession = async () => {
    if (sessionId) {
      await supabase.from('practice_sessions').update({ status: 'completed' }).eq('id', sessionId);
      navigate(`/session-debrief?session=${sessionId}`);
    } else {
      navigate('/interview-practice');
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up">
      <div className="grid lg:grid-cols-[60px_1fr_350px] gap-4 min-h-[calc(100vh-8rem)]">
        {/* Left: Question Timeline Beads */}
        <div className="flex lg:flex-col items-center gap-2 p-2">
          {questions.map((_, index) => {
            const state = questionStates[index];
            const isComplete = state?.status === 'complete';
            const isCurrent = index === currentIndex;
            
            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                disabled={isRecording || isProcessing}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCurrent 
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                    : isComplete 
                      ? 'bg-success/20 text-success border-2 border-success' 
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : index + 1}
              </button>
            );
          })}
        </div>

        {/* Center: Question + Recording */}
        <div className="space-y-6">
          {/* Current Question Card */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{currentQuestion.difficulty}</Badge>
              {currentQuestion.competencies.map(comp => (
                <Badge key={comp} variant="secondary" className="text-xs">
                  {comp}
                </Badge>
              ))}
            </div>
            <h2 className="text-2xl font-medium text-foreground leading-relaxed">
              {currentQuestion.question}
            </h2>
            {currentQuestion.followUps.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Follow-up probes:</p>
                <ul className="space-y-1">
                  {currentQuestion.followUps.map((fu, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">→</span>
                      {fu}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Practice Pulse Orb */}
          <div className="flex justify-center py-8">
            <div 
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-100 ${
                isRecording && !isPaused
                  ? 'bg-destructive/20'
                  : isProcessing
                    ? 'bg-primary/20'
                    : 'bg-accent/20'
              }`}
              style={{
                transform: isRecording && !isPaused ? `scale(${1 + amplitude * 0.5})` : 'scale(1)',
                boxShadow: isRecording && !isPaused 
                  ? `0 0 ${30 + amplitude * 50}px hsl(var(--destructive) / ${0.3 + amplitude * 0.4})` 
                  : undefined
              }}
            >
              {isProcessing ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : isRecording ? (
                <Mic className={`w-12 h-12 ${isPaused ? 'text-muted-foreground' : 'text-destructive'}`} />
              ) : isSpeaking ? (
                <Volume2 className="w-12 h-12 text-accent animate-pulse" />
              ) : (
                <Mic className="w-12 h-12 text-accent" />
              )}
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording && !isProcessing && currentState.status !== 'complete' && (
              <Button onClick={startRecording} size="lg" className="gap-2 bg-gradient-aurora text-background">
                <Mic className="w-5 h-5" />
                Record Answer
              </Button>
            )}
            
            {isRecording && (
              <>
                {isPaused ? (
                  <Button onClick={resumeRecording} variant="outline" size="lg" className="gap-2">
                    <Play className="w-5 h-5" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={pauseRecording} variant="outline" size="lg" className="gap-2">
                    <Pause className="w-5 h-5" />
                    Pause
                  </Button>
                )}
                <Button onClick={stopAndProcess} size="lg" className="gap-2 bg-success text-success-foreground">
                  <Check className="w-5 h-5" />
                  Done
                </Button>
              </>
            )}

            {currentState.status === 'complete' && (
              <>
                <Button onClick={retryQuestion} variant="outline" size="lg" className="gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Retry
                </Button>
                {currentIndex < questions.length - 1 && (
                  <Button onClick={nextQuestion} size="lg" className="gap-2">
                    <SkipForward className="w-5 h-5" />
                    Next Question
                  </Button>
                )}
              </>
            )}

            <Button onClick={endSession} variant="ghost" size="lg" className="gap-2 text-destructive">
              <X className="w-5 h-5" />
              End
            </Button>
          </div>
        </div>

        {/* Right: Transcript + Feedback */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {/* Transcript */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Your Answer</h3>
            <Textarea
              value={currentState.transcript}
              onChange={(e) => updateQuestionState(currentIndex, { transcript: e.target.value })}
              placeholder={isRecording ? 'Recording...' : isProcessing ? 'Transcribing...' : 'Your transcript will appear here...'}
              rows={6}
              className="text-sm"
              disabled={isRecording || isProcessing}
            />
          </div>

          {/* Feedback */}
          {currentState.feedback && (
            <div className={`glass-card p-4 space-y-4 ${intensity === 'magical' ? 'animate-fade-in-up' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Feedback</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${
                    currentState.feedback.overallScore >= 80 ? 'text-success' :
                    currentState.feedback.overallScore >= 60 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {currentState.feedback.overallScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {currentState.feedback.overallFeedback}
              </p>

              {/* Rubric Scores - 0-5 scale */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-foreground">Rubric (0-5)</h4>
                {currentState.feedback.rubric.map((r, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{r.dimension}</span>
                      <span className={`font-medium ${
                        r.score >= 4 ? 'text-success' : r.score >= 3 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {r.score}/5
                      </span>
                    </div>
                    <Progress value={(r.score / 5) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-medium text-success mb-1">Strengths</h4>
                  <ul className="space-y-1">
                    {currentState.feedback.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-success">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-warning mb-1">Improve</h4>
                  <ul className="space-y-1">
                    {currentState.feedback.improvements.slice(0, 2).map((imp, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-warning">→</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Written Feedback */}
              {currentState.feedback.writtenFeedback && currentState.feedback.writtenFeedback.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <h4 className="text-xs font-medium text-foreground mb-2">Detailed Feedback</h4>
                  <ul className="space-y-1">
                    {currentState.feedback.writtenFeedback.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-primary">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Retry Constraints */}
              {currentState.feedback.retryConstraints && currentState.feedback.retryConstraints.length > 0 && (
                <div className="bg-accent/20 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-accent mb-2">Retry Suggestions</h4>
                  <ul className="space-y-1">
                    {currentState.feedback.retryConstraints.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save to Story Bank */}
              <Button 
                onClick={saveToStoryBank} 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                disabled={createStory.isPending}
              >
                <Save className="w-4 h-4" />
                Save to Story Bank
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveInterviewRoom;
