import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PhoneOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import socialApi from '../../../api/socialApi.js';

export default function LanguageRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);
  const hasLeft = useRef(false); // prevent double-navigation

  if (!user) return null;

  const handleLeaveRoom = async () => {
    if (hasLeft.current) return;
    hasLeft.current = true;
    try {
      await socialApi.delete(`/language-rooms/by-name/${roomName}`);
    } catch (err) {
      console.error('Failed to auto-delete room on exit', err);
    }
    navigate('/dashboard/live-rooms');
  };

  // Build Jitsi URL — all config passed as URL hash params so the SDK
  // server-side restrictions are bypassed. We handle navigation ourselves
  // so the post-call JaaS promo page never renders.
  const displayName = user.name || user.email?.split('@')[0] || 'Learner';
  const params = [
    // Skip pre-join lobby screen
    'config.prejoinPageEnabled=false',
    // Disable lobby/moderator waiting room
    'config.lobby.enabled=false',
    'config.membersOnly=false',
    // Don't redirect to close/promo page when call ends
    'config.enableClosePage=false',
    // Disable deep-link to native app on mobile
    'config.disableDeepLinking=true',
    // Don't force display name prompt
    'config.requireDisplayName=false',
    // Hide Jitsi branding
    'config.disableModeratorIndicator=true',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
    'interfaceConfig.MOBILE_APP_PROMO=false',
    'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true',
    // Pre-fill user display name
    `userInfo.displayName=${encodeURIComponent(displayName)}`,
    `userInfo.email=${encodeURIComponent(user.email || '')}`,
  ].join('&');

  const jitsiUrl = `https://meet.jit.si/LearnProof-LiveRoom-${roomName}#${params}`;

  useEffect(() => {
    // Listen for Jitsi postMessage events to detect when user hangs up
    // so we navigate away before the promo page renders
    const handleMessage = (event) => {
      if (event.origin !== 'https://meet.jit.si') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // Jitsi emits these events when the call ends
        if (
          data?.action === 'hangup' ||
          data?.event === 'readyToClose' ||
          data?.event === 'videoConferenceLeft'
        ) {
          handleLeaveRoom();
        }
      } catch (e) {
        // ignore parse errors
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto px-2 md:px-6">
      {/* Top Header Controls */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Rooms</span>
        </button>
        <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700" />
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Active Room: <span className="text-orange-500">{roomName}</span>
        </h2>
        {/* Dedicated Leave button for mobile clarity */}
        <button
          onClick={handleLeaveRoom}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <PhoneOff size={14} />
          <span className="hidden sm:inline">Leave Room</span>
        </button>
      </div>

      {/* Jitsi Meeting Panel — raw iframe bypasses SDK post-call promo page */}
      <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-gray-200 dark:border-gray-700 shadow-inner min-h-[450px]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black z-10 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mb-1" />
            <span className="text-sm font-bold">Connecting to practice room...</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={jitsiUrl}
          title={`Live Room: ${roomName}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          style={{ width: '100%', height: '100%', border: 0 }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
