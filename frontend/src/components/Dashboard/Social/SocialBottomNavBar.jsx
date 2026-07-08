import { Fragment } from 'react';
import { Home, Search, Users, MessageSquare, User, Globe, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';

/**
 * SocialBottomNavBar
 * Rendered by DashboardLayout when the user navigated to live-rooms from
 * the Social Hub so the Social Hub bottom bar stays visible consistently.
 */
export default function SocialBottomNavBar() {
  const navigate = useNavigate();
  const totalUnreadCount = useSocialMessageStore((state) => state.totalUnreadCount);

  const tabs = [
    { id: 'feed',     icon: MessageCircle,label: 'Feed' },
    { id: 'discover', icon: Search,       label: 'Discover' },
    { id: 'friends',  icon: Users,        label: 'Friends' },
    { id: 'chat',     icon: MessageSquare,label: 'Chats', badge: totalUnreadCount > 0 ? totalUnreadCount : null },
    { id: 'profile',  icon: User,         label: 'Profile' },
  ];

  const goToTab = (tabId) => {
    // Clear social source so back navigation is clean
    sessionStorage.setItem('nav_source', 'social');
    // Navigate back to social with the correct tab pre-selected
    localStorage.setItem('social_active_tab', tabId);
    navigate('/dashboard/social', { state: { from: 'social' } });
  };

  const isLiveRoomsActive = () => {
    return window.location.pathname.startsWith('/dashboard/live-rooms');
  };

  return (
    <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[370px] xs:w-[415px] sm:w-[490px] md:w-[560px] max-w-[95vw] z-50 lg:hidden bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="flex items-stretch justify-around h-16 px-3.5 relative">
        {/* Main App Home Button */}
        <button
          onClick={() => {
            sessionStorage.removeItem('nav_source');
            navigate('/dashboard');
          }}
          className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-550 touch-manipulation select-none outline-none focus:outline-none cursor-pointer"
        >
          <motion.div
            whileTap={{ scale: 0.88 }}
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
            <div className="text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300 flex flex-col items-center justify-center">
              <Home size={22} strokeWidth={2} />
              <span className="text-[9.5px] font-bold mt-1 tracking-wide leading-none">Home</span>
            </div>
          </motion.div>
        </button>

        {tabs.map((tab, idx) => {
          const Icon = tab.icon;

          return (
            <Fragment key={tab.id}>
              <button
                onClick={() => goToTab(tab.id)}
                className="relative flex flex-col items-center justify-center flex-1 h-full py-2 text-gray-400 dark:text-gray-550 touch-manipulation select-none outline-none focus:outline-none cursor-pointer"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="flex flex-col items-center justify-center w-full h-full relative"
                >
                  <div className="text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300 flex flex-col items-center justify-center">
                    <Icon size={22} strokeWidth={2} />
                    <span className="text-[9.5px] font-bold mt-1 tracking-wide leading-none">{tab.label}</span>
                  </div>
                  <span className="sr-only">{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute top-0.5 right-2 text-[9px] font-black rounded-full min-w-[15px] h-[15px] px-1 flex items-center justify-center bg-orange-500 text-white shadow-md z-20">
                      {tab.badge}
                    </span>
                  )}
                </motion.div>
              </button>

              {/* Live Rooms Globe icon — active when on live-rooms page */}
              {idx === 3 && (
                <button
                  onClick={() => {
                    sessionStorage.setItem('nav_source', 'social');
                    navigate('/dashboard/live-rooms', { state: { from: 'social' } });
                  }}
                  className="relative flex flex-col items-center justify-center flex-1 h-full py-2 touch-manipulation select-none outline-none focus:outline-none cursor-pointer"
                >
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    className="flex flex-col items-center justify-center w-full h-full relative"
                  >
                    <div className={`transition-all duration-300 flex flex-col items-center justify-center ${isLiveRoomsActive() ? 'scale-110 text-orange-600 dark:text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400'}`}>
                      <Globe size={22} strokeWidth={isLiveRoomsActive() ? 2.5 : 2} />
                      <span className="text-[9.5px] font-bold mt-1 tracking-wide leading-none">Rooms</span>
                    </div>
                    <span className="sr-only">Live Rooms</span>
                  </motion.div>
                </button>
              )}
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
