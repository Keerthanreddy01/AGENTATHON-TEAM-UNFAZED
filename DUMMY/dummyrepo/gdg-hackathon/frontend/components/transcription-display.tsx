import { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react';

export interface ExtractedMeeting {
  id?: string;
  person_id?: string;
  person_name?: string;
  name?: string;
  time?: string;
  date?: string;
  location?: string;
  intent?: string;
  confidence?: number;
}

export interface TranscriptionResult {
  text: string;
  intent: {
    type: string;
    confidence: number;
  };
  meeting: ExtractedMeeting | null;
  timestamp: string;
}

interface TranscriptionDisplayProps {
  currentTranscription?: string;
  onTranscriptionUpdate?: (text: string) => void;
  onMeetingSave?: (meeting: ExtractedMeeting) => void;
}

export default function TranscriptionDisplay({
  currentTranscription = '',
  onTranscriptionUpdate,
  onMeetingSave,
}: TranscriptionDisplayProps) {
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savingMeetingId, setSavingMeetingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        setTimeout(() => {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        }, 0);
      }
    }
  }, [transcriptions]);

  // Process new transcription
  useEffect(() => {
    if (!currentTranscription) return;

    const processTranscription = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch('http://localhost:8000/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentTranscription,
            session_id: `session_${Date.now()}`,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const transcriptionResult: TranscriptionResult = {
            text: currentTranscription,
            intent: result.intent || { type: 'unknown', confidence: 0 },
            meeting: result.meeting || null,
            timestamp: new Date().toISOString(),
          };
          setTranscriptions((prev) => [transcriptionResult, ...prev].slice(0, 20));
          onTranscriptionUpdate?.(currentTranscription);
        }
      } catch (error) {
        console.error('Error processing transcription:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processTranscription();
  }, [currentTranscription, onTranscriptionUpdate]);

  const handleSaveMeeting = async (meeting: ExtractedMeeting) => {
    if (!meeting) return;

    setSavingMeetingId(meeting.id || 'temp');
    try {
      const response = await fetch('http://localhost:8000/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: meeting.person_id || 'unknown',
          person_name: meeting.person_name || meeting.name || 'Unknown Person',
          time: meeting.time || '',
          date: meeting.date || '',
          location: meeting.location || '',
          notes: `Extracted from transcription at ${new Date().toISOString()}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onMeetingSave?.(result.meeting);

        // Update transcription with saved meeting ID
        setTranscriptions((prev) =>
          prev.map((t) =>
            t.meeting?.person_name === meeting.person_name
              ? {
                  ...t,
                  meeting: { ...t.meeting, id: result.meeting_id },
                }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Error saving meeting:', error);
    } finally {
      setSavingMeetingId(null);
    }
  };

  const handleDeleteTranscription = (index: number) => {
    setTranscriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      meeting_request: 'bg-blue-100 text-blue-800',
      greeting: 'bg-green-100 text-green-800',
      farewell: 'bg-gray-100 text-gray-800',
      question: 'bg-purple-100 text-purple-800',
      statement: 'bg-yellow-100 text-yellow-800',
    };
    return colors[intent] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-100">
          Transcription Monitor
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isProcessing && 'Processing...'}
          {!isProcessing && `${transcriptions.length} transcriptions`}
        </p>
      </div>

      {/* Transcriptions List */}
      <ScrollArea ref={scrollRef} className="flex-1 w-full">
        <div className="p-3 space-y-2">
          {transcriptions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No transcriptions yet</p>
              <p className="text-xs mt-1">Speak near your device to begin</p>
            </div>
          ) : (
            transcriptions.map((transcription, index) => (
              <div
                key={index}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 space-y-2 hover:bg-slate-700/70 transition-colors"
              >
                {/* Transcription Text */}
                <div className="text-sm text-slate-100">
                  <p className="font-mono text-xs text-slate-400 mb-1">
                    {new Date(transcription.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-slate-200">{transcription.text}</p>
                </div>

                {/* Intent Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${getIntentColor(
                      transcription.intent.type
                    )}`}
                  >
                    {transcription.intent.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {(transcription.intent.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Meeting Detection */}
                {transcription.meeting ? (
                  <div className="bg-blue-900/30 border border-blue-700/50 rounded p-2 space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-300">
                          📅 Meeting Detected
                        </p>
                        {transcription.meeting.person_name && (
                          <p className="text-xs text-slate-300 mt-1">
                            <span className="text-slate-400">Person:</span>{' '}
                            {transcription.meeting.person_name}
                          </p>
                        )}
                        {transcription.meeting.time && (
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-400">Time:</span>{' '}
                            {transcription.meeting.time}
                          </p>
                        )}
                        {transcription.meeting.date && (
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-400">Date:</span>{' '}
                            {transcription.meeting.date}
                          </p>
                        )}
                        {transcription.meeting.location && (
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-400">Location:</span>{' '}
                            {transcription.meeting.location}
                          </p>
                        )}
                      </div>
                      {transcription.meeting.id ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Saved</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="text-xs h-7 px-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleSaveMeeting(transcription.meeting!)}
                          disabled={savingMeetingId === transcription.meeting.person_name}
                        >
                          {savingMeetingId ===
                          transcription.meeting.person_name ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    No meeting information detected
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-slate-400 hover:text-slate-300"
                    onClick={() => handleDeleteTranscription(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Status */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50 text-xs text-slate-400">
        {isProcessing && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing transcription...
          </div>
        )}
        {!isProcessing && transcriptions.length > 0 && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Ready for new input
          </div>
        )}
      </div>
    </div>
  );
}
