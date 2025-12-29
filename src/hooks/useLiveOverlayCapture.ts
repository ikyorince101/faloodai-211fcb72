import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { speakText } from '@/utils/audioUtils';

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

export const useLiveOverlayCapture = (sessionId: string | null, speakFeedback: boolean) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [coachingSuggestions, setCoachingSuggestions] = useState<CoachingSuggestion[]>([]);
  const [rubricScores, setRubricScores] = useState<RubricScore[]>([]);
  const [answerDraft, setAnswerDraft] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'interviewer' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chunked audio collection
  const audioChunksRef = useRef<Blob[]>([]);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const recentTranscriptsRef = useRef<string[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Monitor amplitude for silence detection
  const monitorAmplitude = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const update = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedAmplitude = average / 255;
      
      setAmplitude(normalizedAmplitude);

      // Detect speech vs silence
      if (normalizedAmplitude > 0.05) {
        lastSpeechTimeRef.current = Date.now();
        setCurrentSpeaker('user'); // Simplified: assume user is speaking
      } else if (Date.now() - lastSpeechTimeRef.current > 2000) {
        setCurrentSpeaker(null);
      }
      
      animationRef.current = requestAnimationFrame(update);
    };
    
    update();
  }, []);

  // Process audio chunk - transcribe and get coaching
  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (!user || !sessionId || audioBlob.size < 1000) return;

    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}.webm`;
      const filePath = `${user.id}/audio/live-overlay/${sessionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, audioBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      // Transcribe
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioPath: filePath }
      });

      if (transcriptError || !transcriptData?.transcript) {
        console.error('Transcription error:', transcriptError);
        return;
      }

      const transcriptText = transcriptData.transcript;
      
      // Skip if transcription is essentially empty
      if (transcriptText.length < 10 || transcriptText === '[inaudible]' || transcriptText === '[No speech detected]') {
        return;
      }

      // Determine speaker (simplified heuristic - could be improved with more sophisticated analysis)
      const isQuestion = transcriptText.includes('?') || 
                         transcriptText.toLowerCase().includes('tell me') ||
                         transcriptText.toLowerCase().includes('describe') ||
                         transcriptText.toLowerCase().includes('explain');
      const speaker: 'user' | 'interviewer' = isQuestion ? 'interviewer' : 'user';

      // Add to transcripts
      const newEntry: TranscriptEntry = {
        id: generateId(),
        speaker,
        text: transcriptText,
        timestamp: new Date(),
      };
      setTranscripts(prev => [...prev, newEntry]);

      // Store in recent transcripts for context
      recentTranscriptsRef.current = [...recentTranscriptsRef.current.slice(-10), transcriptText];

      // Save practice event
      await supabase.from('practice_events').insert({
        session_id: sessionId,
        event_type: 'user_response',
        transcript_text: transcriptText,
        audio_url: filePath,
        feedback: { speaker },
      });

      // If this looks like a user response, get coaching
      if (speaker === 'user' && transcriptText.length > 50) {
        const recentContext = recentTranscriptsRef.current.join('\n');
        
        const { data: coachingData, error: coachingError } = await supabase.functions.invoke('coach-answer', {
          body: {
            transcript: transcriptText,
            question: 'Live Practice - Interview Question',
            followUps: [],
            competencies: ['structure', 'specificity', 'impact'],
            mode: 'behavioral',
            difficulty: 'medium',
          }
        });

        if (!coachingError && coachingData) {
          // Add coaching suggestions
          const suggestions: CoachingSuggestion[] = [];
          
          if (coachingData.strengths?.length) {
            coachingData.strengths.slice(0, 2).forEach((s: string) => {
              suggestions.push({
                id: generateId(),
                text: s,
                type: 'strength',
                timestamp: new Date(),
              });
            });
          }

          if (coachingData.improvements?.length) {
            coachingData.improvements.slice(0, 2).forEach((s: string) => {
              suggestions.push({
                id: generateId(),
                text: s,
                type: 'improvement',
                timestamp: new Date(),
              });
            });
          }

          if (suggestions.length > 0) {
            setCoachingSuggestions(prev => [...prev, ...suggestions]);

            // Speak the first improvement if enabled
            if (speakFeedback && coachingData.spokenFeedback) {
              speakText(coachingData.spokenFeedback);
            }
          }

          // Update rubric scores
          if (coachingData.rubric) {
            setRubricScores(coachingData.rubric);
          }

          // Update answer draft
          if (coachingData.retryConstraints?.length) {
            setAnswerDraft(coachingData.retryConstraints.join('\n'));
          }

          // Save coaching event
          await supabase.from('practice_events').insert({
            session_id: sessionId,
            event_type: 'ai_feedback',
            feedback: {
              overallFeedback: coachingData.overallFeedback,
              strengths: coachingData.strengths,
              improvements: coachingData.improvements,
            },
            rubric: coachingData.rubric?.reduce((acc: Record<string, number>, r: RubricScore) => ({ ...acc, [r.dimension]: r.score }), {}),
          });
        }
      }
    } catch (err) {
      console.error('Error processing audio chunk:', err);
    }
  }, [user, sessionId, speakFeedback]);

  // Start chunking audio
  const startChunking = useCallback(() => {
    // Collect chunks every 10 seconds
    chunkIntervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current?.state === 'recording' && audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        processAudioChunk(blob);
      }
    }, 10000);
  }, [processAudioChunk]);

  const startCapture = useCallback(async () => {
    try {
      // Request display media with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      mediaStreamRef.current = stream;

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check if we got audio
      const audioTracks = stream.getAudioTracks();
      let audioStream = stream;

      if (audioTracks.length === 0) {
        // Fallback to microphone
        console.log('No display audio, falling back to microphone');
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream = micStream;
        } catch (micError) {
          console.error('Microphone fallback failed:', micError);
          setError('Could not capture audio. Please ensure microphone access is granted.');
        }
      }

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second

      setIsRecording(true);
      monitorAmplitude();
      startChunking();

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture();
      });

    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to start screen capture');
      throw err;
    }
  }, [monitorAmplitude, startChunking]);

  const stopCapture = useCallback(() => {
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Stop chunk interval
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
    }

    // Process remaining chunks
    if (audioChunksRef.current.length > 0) {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      processAudioChunk(blob);
      audioChunksRef.current = [];
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }

    // Stop media stream
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setAmplitude(0);
    setCurrentSpeaker(null);
  }, [processAudioChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    videoRef,
    isRecording,
    amplitude,
    transcripts,
    coachingSuggestions,
    rubricScores,
    answerDraft,
    currentSpeaker,
    startCapture,
    stopCapture,
    error,
  };
};
