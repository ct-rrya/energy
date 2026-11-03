import { useEffect, type RefObject } from 'react';

interface SmoothScrollOptions {
  /** Optional section elements for gentle proximity snapping when scrolling settles */
  snapTargets?: RefObject<(HTMLElement | null)[]>;
  /** Proximity threshold as a fraction of viewport height (default: 0.22) */
  snapProximityRatio?: number;
  /** Lerp damping factor per 60fps frame (default: 0.14) */
  lerpFactor?: number;
}

/**
 * High-performance smooth wheel scroll hook with optional proximity section snapping.
 * - Smooths discrete mouse-wheel ticks via requestAnimationFrame interpolation.
 * - Preserves native OS momentum for high-frequency trackpad gestures.
 * - Respects prefers-reduced-motion and nested scrollable elements.
 */
export function useSmoothScroll(
  containerRef?: RefObject<HTMLElement | null>,
  options: SmoothScrollOptions = {}
) {
  const {
    snapTargets,
    snapProximityRatio = 0.22,
    lerpFactor = 0.14,
  } = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = containerRef?.current ?? null;
    const isWindow = !containerRef;

    const getScrollTop = () => (isWindow ? window.scrollY : el?.scrollTop ?? 0);
    const getMaxScroll = () => {
      if (isWindow) {
        return Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
      }
      return el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
    };
    const setScrollTop = (val: number) => {
      if (isWindow) {
        window.scrollTo({ top: val, behavior: 'instant' as ScrollBehavior });
      } else if (el) {
        el.scrollTop = val;
      }
    };

    let currentY = getScrollTop();
    let targetY = currentY;
    let rafId: number | null = null;
    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTime = performance.now();

    const scheduleProximitySnap = () => {
      if (!snapTargets?.current?.length) return;
      if (snapTimer) clearTimeout(snapTimer);

      snapTimer = setTimeout(() => {
        const sections = snapTargets.current;
        if (!sections) return;
        const viewportH = isWindow
          ? window.innerHeight
          : el?.clientHeight ?? window.innerHeight;
        const thresholdPx = viewportH * snapProximityRatio;
        const scrollPos = getScrollTop();

        let closestTop: number | null = null;
        let minDistance = Infinity;

        for (const sec of sections) {
          if (!sec) continue;
          const secTop = sec.offsetTop;
          const dist = Math.abs(scrollPos - secTop);
          if (dist < thresholdPx && dist < minDistance && dist > 2) {
            minDistance = dist;
            closestTop = secTop;
          }
        }

        if (closestTop !== null) {
          targetY = Math.max(0, Math.min(getMaxScroll(), closestTop));
          startLoop();
        }
      }, 160);
    };

    const tick = (now: number) => {
      const dt = Math.min(32, Math.max(8, now - lastTime));
      lastTime = now;
      const alpha = 1 - Math.pow(1 - lerpFactor, dt / 16.67);

      const diff = targetY - currentY;
      if (Math.abs(diff) > 0.6) {
        currentY += diff * alpha;
        setScrollTop(currentY);
        rafId = requestAnimationFrame(tick);
      } else {
        currentY = targetY;
        setScrollTop(targetY);
        rafId = null;
        scheduleProximitySnap();
      }
    };

    const startLoop = () => {
      if (rafId === null) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const hasNestedScrollable = (target: EventTarget | null, deltaY: number): boolean => {
      let node = target as HTMLElement | null;
      const rootNode = isWindow ? document.body : el;
      while (node && node !== rootNode && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight + 2
        ) {
          const atTop = node.scrollTop <= 0 && deltaY < 0;
          const atBottom =
            node.scrollTop + node.clientHeight >= node.scrollHeight - 1 &&
            deltaY > 0;
          if (!atTop && !atBottom) {
            return true;
          }
        }
        node = node.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (hasNestedScrollable(e.target, e.deltaY)) return;

      // Detect smooth trackpad pixel streams vs stepped wheel ticks
      const isTrackpadStream =
        e.deltaMode === 0 &&
        Math.abs(e.deltaY) < 42 &&
        !Number.isInteger(e.deltaY);

      if (isTrackpadStream) {
        currentY = getScrollTop();
        targetY = currentY;
        scheduleProximitySnap();
        return;
      }

      e.preventDefault();

      if (rafId === null) {
        currentY = getScrollTop();
        targetY = currentY;
      }

      const multiplier = e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? window.innerHeight : 1;
      const deltaPx = e.deltaY * multiplier;

      targetY = Math.max(0, Math.min(getMaxScroll(), targetY + deltaPx));
      if (snapTimer) clearTimeout(snapTimer);
      startLoop();
    };

    const onScroll = () => {
      if (rafId === null) {
        currentY = getScrollTop();
        targetY = currentY;
      }
    };

    const targetNode: HTMLElement | Window = isWindow ? window : (el as HTMLElement);
    if (!targetNode) return;

    targetNode.addEventListener('wheel', onWheel as EventListener, { passive: false });
    targetNode.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      targetNode.removeEventListener('wheel', onWheel as EventListener);
      targetNode.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (snapTimer) clearTimeout(snapTimer);
    };
  }, [containerRef, snapTargets, snapProximityRatio, lerpFactor]);
}

