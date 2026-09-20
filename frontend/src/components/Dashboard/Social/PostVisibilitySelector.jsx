import { useState, useRef, useEffect } from 'react';
import { Globe, Users, Star, Check, ChevronDown } from 'lucide-react';

export const VISIBILITY_OPTIONS = [
  {
    id: 'public',
    label: 'Public',
    description: 'Anyone on LearnProof can see',
    icon: Globe,
    iconColor: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/60',
  },
  {
    id: 'friends',
    label: 'Friends',
    description: 'Only your connections can see',
    icon: Users,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  {
    id: 'close_friends',
    label: 'Close Friends',
    description: 'Only your close friends circle',
    icon: Star,
    iconColor: 'text-amber-500 dark:text-amber-400 fill-amber-400 dark:fill-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/60',
  },
];

export default function PostVisibilitySelector({
  value = 'public',
  onChange,
  placement = 'top',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentOption = VISIBILITY_OPTIONS.find((opt) => opt.id === value) || VISIBILITY_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionId) => {
    if (onChange) {
      onChange(optionId);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 dark:bg-gray-700 dark:hover:bg-gray-650 transition cursor-pointer border border-transparent focus:border-orange-500 focus:outline-none"
        title="Change post visibility"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <CurrentIcon size={14} className={`${currentOption.iconColor} shrink-0`} />
        <span>{currentOption.label}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 ml-0.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            placement === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2'
          } left-0 sm:left-auto sm:right-auto w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
          role="listbox"
        >
          <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-700/60 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Audience
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Who can view</span>
          </div>

          <div className="space-y-1">
            {VISIBILITY_OPTIONS.map((opt) => {
              const isSelected = opt.id === value;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full flex items-center justify-between gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50/80 dark:bg-orange-950/40 text-orange-950 dark:text-orange-100'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-800 dark:text-gray-200'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl ${opt.bgColor} flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <Icon size={16} className={opt.iconColor} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                        {opt.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
