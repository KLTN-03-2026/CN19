import { useState, useEffect, useCallback } from 'react';

const useBotBehavior = () => {
    const [pageLoadTime] = useState(Date.now());
    const [clickCount, setClickCount] = useState(0);
    const [mouseMoveDistance, setMouseMoveDistance] = useState(0);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    const trackClick = useCallback(() => {
        setClickCount(prev => prev + 1);
    }, []);

    const trackMouseMove = useCallback((e) => {
        if (lastPos.x !== 0 && lastPos.y !== 0) {
            const distance = Math.sqrt(
                Math.pow(e.clientX - lastPos.x, 2) + Math.pow(e.clientY - lastPos.y, 2)
            );
            setMouseMoveDistance(prev => prev + distance);
        }
        setLastPos({ x: e.clientX, y: e.clientY });
    }, [lastPos]);

    useEffect(() => {
        window.addEventListener('click', trackClick);
        window.addEventListener('mousemove', trackMouseMove);
        return () => {
            window.removeEventListener('click', trackClick);
            window.removeEventListener('mousemove', trackMouseMove);
        };
    }, [trackClick, trackMouseMove]);

    const getBehaviorData = () => {
        const now = Date.now();
        const durationMs = now - pageLoadTime; 
        
        return {
            form_fill_duration: durationMs,
            click_speed_ms: clickCount > 0 ? Math.round(durationMs / clickCount) : 0,
            behavior_metrics: {
                totalClicks: clickCount,
                mouseDistance: Math.round(mouseMoveDistance),
                isSteadyMouse: mouseMoveDistance > 100 
            }
        };
    };

    return { getBehaviorData };
};

export default useBotBehavior;
