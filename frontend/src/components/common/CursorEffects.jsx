import React, { useEffect, useRef } from 'react';

/**
 * Lightweight desktop pointer effects: a soft spotlight, trailing orb,
 * and a brief ripple on clicks. Hidden on touch devices and when reduced
 * motion is requested.
 */
export default function CursorEffects() {
  const glowRef = useRef(null);
  const dotRef = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ x: -200, y: -200 });
  const trailRef = useRef({ x: -200, y: -200 });
  const visibleRef = useRef(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || coarsePointer) return undefined;

    let active = true;
    const onMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      visibleRef.current = true;
      document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
      if (glowRef.current) glowRef.current.style.opacity = '1';
      if (dotRef.current) dotRef.current.style.opacity = '1';
    };
    const onLeave = () => {
      visibleRef.current = false;
      if (glowRef.current) glowRef.current.style.opacity = '0';
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };
    const onClick = (event) => {
      const ripple = document.createElement('span');
      ripple.className = 'sportiq-cursor-ripple';
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    const animate = () => {
      if (!active) return;
      const target = pointerRef.current;
      const trail = trailRef.current;
      trail.x += (target.x - trail.x) * 0.18;
      trail.y += (target.y - trail.y) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) translate(-50%, -50%)`;
        dotRef.current.style.opacity = visibleRef.current ? '1' : '0';
      }
      frameRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    window.addEventListener('click', onClick);
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      active = false;
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('click', onClick);
      document.querySelectorAll('.sportiq-cursor-ripple').forEach((node) => node.remove());
      document.documentElement.style.removeProperty('--pointer-x');
      document.documentElement.style.removeProperty('--pointer-y');
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="sportiq-cursor-glow" aria-hidden="true" />
      <div ref={dotRef} className="sportiq-cursor-dot" aria-hidden="true" />
    </>
  );
}
