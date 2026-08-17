/**
 * Painting for the hero field.
 *
 * Split from `field.ts` because the two are tested differently: the physics
 * are asserted directly, while canvas pixels are explicitly not tested
 * (`docs/testing.md`). Keeping them apart means the untested half is only the
 * half that draws. The colours and opacities it paints with are in
 * `constants/paint.ts`.
 */

import * as PAINT from './constants/paint';
import type { Dot, FieldSize, Pointer } from './field';
import { linkDistanceFor, proximityAt } from './field';

function distanceToPointer(x: number, y: number, pointer: Pointer): number {
  return pointer === null ? Number.POSITIVE_INFINITY : Math.hypot(x - pointer.x, y - pointer.y);
}

function colourAt(proximity: number, alpha: number): string {
  const red = Math.round(PAINT.BASE_COLOUR.red + proximity * PAINT.PROXIMITY_COLOUR_SHIFT.red);
  const green = Math.round(PAINT.BASE_COLOUR.green + proximity * PAINT.PROXIMITY_COLOUR_SHIFT.green);
  const blue = Math.round(PAINT.BASE_COLOUR.blue + proximity * PAINT.PROXIMITY_COLOUR_SHIFT.blue);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawLinks(
  context: CanvasRenderingContext2D,
  dots: readonly Dot[],
  pointer: Pointer,
  size: FieldSize,
): void {
  const linkDistance = linkDistanceFor(size);

  for (let i = PAINT.ORIGIN; i < dots.length; i += 1) {
    const a = dots[i];

    if (a === undefined) {
      continue;
    }

    for (let j = i + 1; j < dots.length; j += 1) {
      const b = dots[j];

      if (b === undefined) {
        continue;
      }

      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance > linkDistance) {
        continue;
      }

      const midX = (a.x + b.x) / PAINT.MIDPOINT_DIVISOR;
      const midY = (a.y + b.y) / PAINT.MIDPOINT_DIVISOR;
      const proximity =
        pointer === null ? PAINT.NO_PROXIMITY : proximityAt(distanceToPointer(midX, midY, pointer));
      const alpha = Math.min(
        PAINT.LINK_MAX_ALPHA,
        (PAINT.FULL_LINK_STRENGTH - distance / linkDistance) * PAINT.LINK_BASE_ALPHA +
          proximity * PAINT.LINK_PROXIMITY_ALPHA,
      );

      if (alpha < PAINT.LINK_MIN_VISIBLE_ALPHA) {
        continue;
      }

      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.strokeStyle = colourAt(proximity, alpha);
      context.lineWidth = PAINT.LINK_WIDTH;
      context.stroke();
    }
  }
}

function drawNodes(
  context: CanvasRenderingContext2D,
  dots: readonly Dot[],
  pointer: Pointer,
  elapsedMs: number,
): void {
  for (const dot of dots) {
    const proximity =
      pointer === null ? PAINT.NO_PROXIMITY : proximityAt(distanceToPointer(dot.x, dot.y, pointer));
    const breathe =
      Math.sin(elapsedMs * PAINT.BREATHE_RATE + dot.pulse) * PAINT.BREATHE_AMPLITUDE + PAINT.BREATHE_OFFSET;
    const alpha = Math.min(
      PAINT.NODE_MAX_ALPHA,
      PAINT.NODE_BASE_ALPHA + proximity * PAINT.NODE_PROXIMITY_ALPHA + breathe * PAINT.NODE_BREATHE_ALPHA,
    );

    context.beginPath();
    context.arc(
      dot.x,
      dot.y,
      PAINT.NODE_BASE_RADIUS + proximity * PAINT.NODE_PROXIMITY_RADIUS,
      PAINT.ARC_START_RADIANS,
      PAINT.FULL_ARC_RADIANS,
    );
    context.fillStyle = colourAt(proximity, alpha);
    context.fill();
  }
}

/** Repaints the whole field: links first, so the nodes sit on top of them. */
export function drawField(
  context: CanvasRenderingContext2D,
  dots: readonly Dot[],
  pointer: Pointer,
  size: FieldSize,
  elapsedMs: number,
): void {
  context.clearRect(PAINT.ORIGIN, PAINT.ORIGIN, size.width, size.height);
  drawLinks(context, dots, pointer, size);
  drawNodes(context, dots, pointer, elapsedMs);
}
