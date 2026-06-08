import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';

export default function LanguageRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

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
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto px-2 md:px-6">
      {/* Top Header Controls */}
      <div className="flex items-center gap-4 py-4">
        <button 
          onClick={handleLeaveRoom}
          className="flex items-center gap-2 text-sm font-bold text-gray-655 dark:text-gray-300 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Rooms</span>
        </button>
        <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700"></div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Active Room: <span className="text-orange-500">{roomName}</span></h2>
      </div>
      
      {/* Jitsi Meeting Panel */}
      <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-gray-150 dark:border-gray-750 shadow-inner min-h-[450px]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black z-10 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mb-1"></div>
            <span className="text-sm font-bold">Connecting to practice room...</span>
          </div>
        )}
        <JitsiMeeting
            domain="meet.jit.si"
            roomName={`LearnProof-LiveRoom-${roomName}`}
            configOverwrite={{
                startWithAudioMuted: false,
                disableModeratorIndicator: true,
                startScreenSharing: false,
                enableEmailInStats: false,
                // Skip the pre-join lobby screen — join directly
                prejoinPageEnabled: false,
                // Skip the welcome page
                welcomePageLoggedIn: false,
                // Disable the mobile app promotion nag
                disableDeepLinking: true,
                // Use Jitsi's built-in P2P for mobile compat
                p2p: { enabled: true },
            }}
            interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                // Hide the app download banner on mobile
                MOBILE_APP_PROMO: false,
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
            }}
            userInfo={{
                displayName: user.name || user.email?.split('@')[0],
                email: user.email
            }}
            onApiReady={(externalApi) => {
                setLoading(false);
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
