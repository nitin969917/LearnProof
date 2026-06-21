import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';

const RoomLoadingSpinner = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black z-50 gap-4">
    <div className="relative flex items-center justify-center">
      {/* Premium pulsing and spinning rings */}
      <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-orange-500/20 opacity-75"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>
    <div className="flex flex-col items-center text-center px-4 animate-pulse">
      <span className="text-base font-black uppercase tracking-widest text-orange-500">Connecting</span>
      <span className="text-xs text-gray-400 font-bold mt-1">Initializing secure practice room...</span>
    </div>
  </div>
);

export default function LanguageRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!user) return null;

  const handleLeaveRoom = async () => {
     try {
        await socialApi.delete(`/language-rooms/by-name/${roomName}`);
     } catch(err) {
        console.error('Failed to auto-delete room on exit', err);
     }
     navigate('/dashboard/live-rooms');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-4 h-12 bg-gray-900 border-b border-gray-800 text-white z-20">
        <button 
          onClick={handleLeaveRoom}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-300 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Leave Room</span>
        </button>
        <h2 className="text-xs md:text-sm font-bold text-gray-300">
          Practice Room: <span className="text-orange-500">{roomName}</span>
        </h2>
        <div className="w-16"></div> {/* spacer to center roomName */}
      </div>
      
      {/* Jitsi Meeting Panel */}
      <div className="flex-1 bg-black overflow-hidden relative">
        {loading && <RoomLoadingSpinner />}
        <JitsiMeeting
            domain="meet.element.io"
            roomName={`LearnProof-LiveRoom-${roomName}`}
            spinner={RoomLoadingSpinner}
            configOverwrite={{
                disableDeepLinking: true,
                prejoinConfig: {
                    enabled: false
                },
                startWithAudioMuted: false,
                disableModeratorIndicator: true,
                startScreenSharing: true,
                enableEmailInStats: false
            }}
            interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
            }}
            userInfo={{
                displayName: user.name || user.email?.split('@')[0],
                email: user.email
            }}
            onApiReady={(externalApi) => {
                // Listen for videoConferenceJoined to dynamically dismiss the spinner when interface loads
                externalApi.addListener('videoConferenceJoined', () => {
                    setLoading(false);
                });

                // Safety backup timeout in case signaling takes too long
                timeoutRef.current = setTimeout(() => {
                    setLoading(false);
                }, 7500);

                externalApi.addListener('readyToClose', handleLeaveRoom);
            }}
            getIFrameRef={(iframeRef) => {
                iframeRef.style.height = '100%';
                iframeRef.style.width = '100%';
            }}
        />
      </div>
    </div>
  );
}
