import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Instagram / iOS style swipeable in-app notification toast.
 * - Swipe UP to dismiss with smooth physics and downward elastic resistance.
 * - Tap to navigate to destination (distinguishes tap vs drag).
 * - Click '✕' icon to dismiss immediately.
 */
export default function SwipeableNotificationToast({
  t,
  avatar,
  avatarBadge,
  fallbackInitial = 'U',
  fallbackGradient = 'from-[#FF5100] to-orange-400',
  title,
  body,
  tag = 'now',
  tagColor = 'text-[#FF5100]',
  borderColor = 'border-orange-200/80 dark:border-gray-700/80',
  onClick,
  onDismiss,
}) {
  const dragStarted = useRef(false);

  const handleDismiss = () => {
    toast.dismiss(t.id);
    if (onDismiss) onDismiss();
  };

  const handleDragEnd = (_, info) => {
    // Dismiss if dragged upward by more than 20px or flicked upward with velocity
    if (info.offset.y < -20 || info.velocity.y < -150) {
      handleDismiss();
    }
    // Prevent accidental click triggering right after drag release
    setTimeout(() => {
      dragStarted.current = false;
    }, 60);
  };

  return (
    <motion.div
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.85, bottom: 0.05 }}
      onDragStart={() => {
        dragStarted.current = true;
      }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 0.98, opacity: 0.92 }}
      animate={t.visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -40, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onClick={() => {
        if (!dragStarted.current && onClick) {
          toast.dismiss(t.id);
          onClick();
        }
      }}
      className={`relative max-w-sm w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-2xl pt-3.5 pb-3 px-3.5 flex items-center gap-3 border ${borderColor} cursor-pointer hover:border-orange-400 dark:hover:border-orange-500/50 active:scale-[0.99] select-none touch-none z-50`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Visual pill handle indicating swipe-up capability */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-300/80 dark:bg-gray-600/80 rounded-full" />

      {/* Avatar / Icon */}
      <div className="relative shrink-0">
        {typeof avatar === 'string' && avatar ? (
          <img
            src={avatar}
            alt={typeof title === 'string' ? title : 'User'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/20"
          />
        ) : React.isValidElement(avatar) ? (
          avatar
        ) : (
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-tr ${fallbackGradient} text-white font-black flex items-center justify-center text-sm shadow-xs`}
          >
            {fallbackInitial}
          </div>
        )}
        {avatarBadge}
      </div>

      {/* Main Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-black text-gray-900 dark:text-white truncate">
            {title}
          </p>
          {tag && (
            <span className={`text-[10px] font-black uppercase tracking-wider ${tagColor}`}>
              {tag}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium mt-0.5">
          {body}
        </p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
