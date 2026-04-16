import { useState, useEffect, useRef } from 'react';

/**
 * Hook to track user behavior for bot detection.
 * Tracks: form fill duration (ms), click speed (ms), and mouse movement distance.
 */
export const useBehaviorTracker = () => {
  const startTime = useRef(Date.now());
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);
  const firstClickTime = useRef(0);
  const clickSpeeds = useRef([]);
  const mouseDistance = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const mouseMovements = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (lastMousePos.current.x !== 0 || lastMousePos.current.y !== 0) {
        const dist = Math.sqrt(
          Math.pow(e.clientX - lastMousePos.current.x, 2) + 
          Math.pow(e.clientY - lastMousePos.current.y, 2)
        );
        mouseDistance.current += dist;
        if (mouseMovements.current.length < 50) {
          mouseMovements.current.push(Math.round(dist));
        }
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = () => {
      const now = Date.now();
      if (firstClickTime.current === 0) {
        firstClickTime.current = now;
      }
      if (lastClickTime.current !== 0) {
        const speed = now - lastClickTime.current;
        clickSpeeds.current.push(speed);
      }
      lastClickTime.current = now;
      clickCount.current += 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []); // Only attach once per mount

  const getBehaviorData = () => {
    const speeds = clickSpeeds.current;
    const avgClickSpeed = speeds.length > 0 
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length 
      : 0;

    return {
      form_fill_duration: Date.now() - startTime.current, // Returns MILLISECONDS
      click_speed_ms: Math.round(avgClickSpeed),
      behavior_metrics: {
        mouse_distance: Math.round(mouseDistance.current),
        click_count: clickCount.current,
        time_to_first_click: firstClickTime.current ? firstClickTime.current - startTime.current : 0,
        mouse_movements: mouseMovements.current,
        mouseDistance: Math.round(mouseDistance.current),
        clickCount: clickCount.current
      }
    };
  };

  return { getBehaviorData };
};
