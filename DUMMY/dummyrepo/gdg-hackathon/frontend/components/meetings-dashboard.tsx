import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Trash2, Loader2 } from 'lucide-react';

export interface Meeting {
  id: string;
  person_id: string;
  person_name: string;
  time: string;
  date: string;
  location?: string;
  notes?: string;
  created_at: string;
}

interface MeetingsDashboardProps {
  personId?: string;
  onMeetingSelect?: (meeting: Meeting) => void;
}

export default function MeetingsDashboard({
  personId,
  onMeetingSelect,
}: MeetingsDashboardProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      setIsLoading(true);
      try {
        const url = personId
          ? `http://localhost:8000/meetings/${personId}`
          : 'http://localhost:8000/meetings';

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMeetings(data.meetings || []);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMeetings, 30000);
    return () => clearInterval(interval);
  }, [personId]);

  const handleDeleteMeeting = async (id: string) => {
    setDeletingId(id);
    try {
      // In production, add DELETE endpoint
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: dateStr.includes('-') ? 'numeric' : undefined,
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'TBD';
    // Handle HH:MM format
    if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
      return timeStr;
    }
    return timeStr;
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-100">
          📅 Scheduled Meetings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Meetings List */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400 ml-2">Loading meetings...</span>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No meetings scheduled</p>
              <p className="text-xs mt-1">Extracted meetings will appear here</p>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-gradient-to-r from-slate-700/50 to-slate-700/30 border border-slate-600 rounded-lg p-3 hover:border-slate-500 transition-colors cursor-pointer group"
                onClick={() => onMeetingSelect?.(meeting)}
              >
                {/* Person Name */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-100 text-sm">
                    {meeting.person_name}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMeeting(meeting.id);
                    }}
                    disabled={deletingId === meeting.id}
                  >
                    {deletingId === meeting.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Meeting Details */}
                <div className="space-y-1 text-xs text-slate-300">
                  {/* Date and Time */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      <span>{formatDate(meeting.date || meeting.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-400" />
                      <span>{formatTime(meeting.time)}</span>
                    </div>
                  </div>

                  {/* Location */}
                  {meeting.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-400" />
                      <span>{meeting.location}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {meeting.notes && (
                    <div className="mt-2 p-2 bg-slate-800/50 rounded text-slate-300 border-l-2 border-slate-600">
                      <p className="text-xs italic">{meeting.notes}</p>
                    </div>
                  )}
                </div>

                {/* Created Time */}
                <div className="mt-2 text-xs text-slate-500">
                  Added {new Date(meeting.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50 text-xs text-slate-400">
        {meetings.length > 0 && (
          <p>Click a meeting to view details • Swipe to delete</p>
        )}
      </div>
    </div>
  );
}
