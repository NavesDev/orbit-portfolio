'use client';

import { useEffect, useRef } from 'react';

import { REDUCED_MOTION_QUERY } from '../../constants/media-queries';
import { drawField } from '../../lib/particles/draw';
import type { Dot, FieldSize, Pointer } from '../../lib/particles/field';
import { buildDots, stepDots } from '../../lib/particles/field';
import * as CANVAS_CONSTANTS from './constants/particle-field';
import styles from './particle-field.module.css';

function sizeCanvas(canvas: HTMLCanvasElement, size: FieldSize): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');

  if (context === null) {
    return null;
  }

  const ratio = Math.min(
    window.devicePixelRatio || CANVAS_CONSTANTS.DEFAULT_PIXEL_RATIO,
    CANVAS_CONSTANTS.MAX_PIXEL_RATIO,
  );

  canvas.width = size.width * ratio;
  canvas.height = size.height * ratio;
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
  context.setTransform(
    ratio,
    CANVAS_CONSTANTS.NO_SKEW,
    CANVAS_CONSTANTS.NO_SKEW,
    ratio,
    CANVAS_CONSTANTS.CANVAS_ORIGIN,
    CANVAS_CONSTANTS.CANVAS_ORIGIN,
  );

  return context;
}

function pointerWithin(rect: DOMRect, clientX: number, clientY: number): Pointer {
  const inside =
    clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;

  return inside ? { x: clientX - rect.left, y: clientY - rect.top } : null;
}

/**
 * The hero's interactive field (FR-03, FR-04).
 *
 * **The whole point of this component is the cleanup.** The prototype starts a
 * `requestAnimationFrame` loop and never cancels it, so the loop outlives
 * whatever it was drawing; FR-04 exists to correct exactly that, and the
 * component test asserts the cancellation rather than the pixels.
 *
 * Everything the loop needs lives in refs, not state: a field that re-rendered
 * React on every frame would defeat the purpose of drawing to a canvas at all.
 *
 * The pointer is tracked on `window` rather than on the canvas, which sits
 * under the headline and takes no pointer events. Listening on the element
 * would freeze the field the moment the pointer crossed the text.
 *
 * `aria-hidden`: a dot grid has nothing to say to a screen reader, and naming
 * it would only add noise to the first thing announced on the page — the same
 * reasoning as `ScrollProgress`.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<Pointer>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    const host = canvas.parentElement ?? canvas;
    let dots: Dot[] = [];
    let size: FieldSize = CANVAS_CONSTANTS.EMPTY_SIZE;
    let context: CanvasRenderingContext2D | null = null;
    let frame: number | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    /*
     * `canvasRef.current` is read again rather than closed over: a hoisted
     * function declaration cannot see the null check above it, and a rebuild
     * triggered by a late resize is the case where the ref really can be gone.
     */
    function build(): void {
      const element = canvasRef.current;

      if (element === null) {
        return;
      }

      const rect = host.getBoundingClientRect();

      size = { width: rect.width, height: rect.height };
      context = sizeCanvas(element, size);
      dots = buildDots(size, Math.random);
    }

    function paint(elapsedMs: number): void {
      if (context === null) {
        return;
      }

      stepDots(dots, pointerRef.current);
      drawField(context, dots, pointerRef.current, size, elapsedMs);
    }

    function tick(elapsedMs: number): void {
      paint(elapsedMs);
      frame = requestAnimationFrame(tick);
    }

    function trackPointer(clientX: number, clientY: number): void {
      pointerRef.current = pointerWithin(host.getBoundingClientRect(), clientX, clientY);
    }

    function handleMouseMove(event: MouseEvent): void {
      trackPointer(event.clientX, event.clientY);
    }

    function handleTouchMove(event: TouchEvent): void {
      const touch = event.touches[0];

      if (touch !== undefined) {
        trackPointer(touch.clientX, touch.clientY);
      }
    }

    function releasePointer(): void {
      pointerRef.current = null;
    }

    function handleResize(): void {
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = setTimeout(build, CANVAS_CONSTANTS.RESIZE_SETTLE_MS);
    }

    build();

    /*
     * A visitor who asked for less motion gets the field drawn once and left
     * alone: the network still reads as a network, and nothing moves under
     * them — including on pointer move, which is why those listeners are not
     * attached at all rather than attached and ignored.
     */
    const wantsReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (wantsReducedMotion) {
      paint(CANVAS_CONSTANTS.FIRST_FRAME_MS);
    } else {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', releasePointer);
      window.addEventListener('blur', releasePointer);
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }

      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', releasePointer);
      window.removeEventListener('blur', releasePointer);
    };
  }, []);

  return (
    <div className={styles.field} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
