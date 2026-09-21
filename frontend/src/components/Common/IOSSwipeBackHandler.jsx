import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const TRIGGER_DISTANCE = 70; // px needed to trigger back
const MAX_EDGE_START = 28;   // px from left edge to begin gesture

const isRootRoute = (pathname) => {
    return (
        pathname === '/' ||
        pathname === '/dashboard' ||
        pathname === '/login' ||
        pathname === '/admin' ||
        pathname === '/admin/dashboard'
    );
};

const triggerHapticFeedback = () => {
    try {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch (_) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
        }
    }
};

const IOSSwipeBackHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [swipeState, setSwipeState] = useState({
        active: false,
        deltaX: 0,
        y: 0,
        triggered: false,
    });

    const startX = useRef(0);
    const startY = useRef(0);
    const isTracking = useRef(false);
    const isGestureActive = useRef(false);
    const hasFiredHaptic = useRef(false);
    const currentPathRef = useRef(location.pathname);

    useEffect(() => {
        currentPathRef.current = location.pathname;
    }, [location.pathname]);

    const handleBackNavigation = () => {
        const path = currentPathRef.current;

        // Specific high-level section overrides for natural hierarchical back
        if (path.startsWith('/dashboard/playlist/') || path.startsWith('/dashboard/roadmap/')) {
            navigate('/dashboard/library');
            return;
        }

        if (path.startsWith('/classroom/')) {
            if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
            } else {
                navigate('/dashboard/library');
            }
            return;
        }

        if (
            path === '/dashboard/library' ||
            path === '/dashboard/explore' ||
            path === '/dashboard/certificates' ||
            path === '/dashboard/quiz' ||
            path === '/dashboard/goals' ||
            path === '/dashboard/inbox' ||
            path === '/dashboard/live-rooms' ||
            path === '/dashboard/social'
        ) {
            navigate('/dashboard');
            return;
        }

        // Standard browser history pop
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else if (!isRootRoute(path)) {
            navigate('/dashboard');
        }
    };

    useEffect(() => {
        const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        if (!isTouchDevice) return;

        const onTouchStart = (e) => {
            if (isRootRoute(currentPathRef.current)) return;
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            // Only start tracking if the touch initiates right at the left edge
            if (touch.clientX <= MAX_EDGE_START) {
                // Avoid interfering with range inputs or sliders
                if (e.target && e.target.closest && e.target.closest('input[type="range"], .no-swipe-back')) {
                    return;
                }
                startX.current = touch.clientX;
                startY.current = touch.clientY;
                isTracking.current = true;
                isGestureActive.current = false;
                hasFiredHaptic.current = false;
            }
        };

        const onTouchMove = (e) => {
            if (!isTracking.current) return;
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - startX.current;
            const deltaY = Math.abs(touch.clientY - startY.current);

            // Determine if the user is swiping horizontally or scrolling vertically
            if (!isGestureActive.current) {
                if (deltaX > 10) {
                    if (deltaX > deltaY * 1.3) {
                        // User is clearly swiping right from the edge
                        isGestureActive.current = true;
                    } else {
                        // User is scrolling vertically, abort tracking
                        isTracking.current = false;
                        return;
                    }
                } else if (deltaY > 15) {
                    // Abort tracking if vertical movement occurs first
                    isTracking.current = false;
                    return;
                }
            }

            if (isGestureActive.current) {
                // Prevent background scrolling while edge-swipe is active
                if (e.cancelable) {
                    e.preventDefault();
                }

                if (deltaX < 0) {
                    setSwipeState({ active: false, deltaX: 0, y: touch.clientY, triggered: false });
                    return;
                }

                const willTrigger = deltaX >= TRIGGER_DISTANCE;
                if (willTrigger && !hasFiredHaptic.current) {
                    triggerHapticFeedback();
                    hasFiredHaptic.current = true;
                } else if (!willTrigger && hasFiredHaptic.current) {
                    hasFiredHaptic.current = false;
                }

                setSwipeState({
                    active: true,
                    deltaX: Math.min(deltaX, 130),
                    y: touch.clientY,
                    triggered: willTrigger,
                });
            }
        };

        const onTouchEnd = () => {
            if (isTracking.current && isGestureActive.current) {
                if (swipeState.triggered || swipeState.deltaX >= TRIGGER_DISTANCE) {
                    triggerHapticFeedback();
                    handleBackNavigation();
                }
            }

            isTracking.current = false;
            isGestureActive.current = false;
            hasFiredHaptic.current = false;
            setSwipeState({ active: false, deltaX: 0, y: 0, triggered: false });
        };

        const onTouchCancel = () => {
            isTracking.current = false;
            isGestureActive.current = false;
            hasFiredHaptic.current = false;
            setSwipeState({ active: false, deltaX: 0, y: 0, triggered: false });
        };

        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('touchcancel', onTouchCancel, { passive: true });

        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchCancel);
        };
    }, [swipeState.triggered, swipeState.deltaX]);

    if (!swipeState.active || isRootRoute(location.pathname)) {
        return null;
    }

    const indicatorY = Math.max(70, Math.min((window.innerHeight || 800) - 90, swipeState.y - 22));
    const indicatorLeft = Math.max(-25, Math.min(swipeState.deltaX * 0.45 - 28, 22));
    const indicatorOpacity = Math.min(swipeState.deltaX / 30, 1);

    return (
        <div
            className="fixed z-[99999] pointer-events-none transition-all duration-75 ease-out select-none flex items-center"
            style={{
                top: `${indicatorY}px`,
                left: `${indicatorLeft}px`,
                opacity: indicatorOpacity,
            }}
        >
            <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl border transition-all duration-200 ${
                    swipeState.triggered
                        ? 'bg-orange-500 border-orange-400 text-white scale-110 shadow-orange-500/50'
                        : 'bg-black/75 dark:bg-white/95 border-white/20 dark:border-black/10 text-white dark:text-gray-900 scale-100 shadow-black/40'
                }`}
            >
                <ArrowLeft
                    size={18}
                    strokeWidth={3}
                    className={`transition-transform duration-200 ${swipeState.triggered ? '-translate-x-0.5' : ''}`}
                />
            </div>
        </div>
    );
};

export default IOSSwipeBackHandler;
