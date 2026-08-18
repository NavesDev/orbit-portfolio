/**
 * Painting for the hero field.
 *
 * Split from `field.ts` because the two are tested differently: the physics
 * are asserted directly, while canvas pixels are explicitly not tested
 * (`docs/testing.md`). Keeping them apart means the untested half is only the
 * half that draws. The colours and opacities it paints with are in
 * `constants/paint.ts`.
 */

import * as PAINT_CONSTANTS from './constants/paint';
import type { Dot, FieldSize, Pointer } from './field';
import { linkDistanceFor, proximityAt } from './field';

function distanceToPointer(x: number, y: number, pointer: Pointer): number {
  return pointer === null ? Number.POSITIVE_INFINITY : Math.hypot(x - pointer.x, y - pointer.y);
}

function colourAt(proximity: number, alpha: number): string {
  const red = Math.round(
    PAINT_CONSTANTS.BASE_COLOUR.red + proximity * PAINT_CONSTANTS.PROXIMITY_COLOUR_SHIFT.red,
  );
  const green = Math.round(
    PAINT_CONSTANTS.BASE_COLOUR.green + proximity * PAINT_CONSTANTS.PROXIMITY_COLOUR_SHIFT.green,
  );
  const blue = Math.round(
    PAINT_CONSTANTS.BASE_COLOUR.blue + proximity * PAINT_CONSTANTS.PROXIMITY_COLOUR_SHIFT.blue,
  );

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawLinks(
  context: CanvasRenderingContext2D,
  dots: readonly Dot[],
  pointer: Pointer,
  size: FieldSize,
): void {
  const linkDistance = linkDistanceFor(size);

  for (let i = PAINT_CONSTANTS.ORIGIN; i < dots.length; i += 1) {
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

      const midX = (a.x + b.x) / PAINT_CONSTANTS.MIDPOINT_DIVISOR;
      const midY = (a.y + b.y) / PAINT_CONSTANTS.MIDPOINT_DIVISOR;
      const proximity =
        pointer === null
          ? PAINT_CONSTANTS.NO_PROXIMITY
          : proximityAt(distanceToPointer(midX, midY, pointer));
      const alpha = Math.min(
        PAINT_CONSTANTS.LINK_MAX_ALPHA,
        (PAINT_CONSTANTS.FULL_LINK_STRENGTH - distance / linkDistance) *
          PAINT_CONSTANTS.LINK_BASE_ALPHA +
          proximity * PAINT_CONSTANTS.LINK_PROXIMITY_ALPHA,
      );

      if (alpha < PAINT_CONSTANTS.LINK_MIN_VISIBLE_ALPHA) {
        continue;
      }

      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.strokeStyle = colourAt(proximity, alpha);
      context.lineWidth = PAINT_CONSTANTS.LINK_WIDTH;
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
      pointer === null
        ? PAINT_CONSTANTS.NO_PROXIMITY
        : proximityAt(distanceToPointer(dot.x, dot.y, pointer));
    const breathe =
      Math.sin(elapsedMs * PAINT_CONSTANTS.BREATHE_RATE + dot.pulse) *
        PAINT_CONSTANTS.BREATHE_AMPLITUDE +
      PAINT_CONSTANTS.BREATHE_OFFSET;
    const alpha = Math.min(
      PAINT_CONSTANTS.NODE_MAX_ALPHA,
      PAINT_CONSTANTS.NODE_BASE_ALPHA +
        proximity * PAINT_CONSTANTS.NODE_PROXIMITY_ALPHA +
        breathe * PAINT_CONSTANTS.NODE_BREATHE_ALPHA,
    );

    context.beginPath();
    context.arc(
      dot.x,
      dot.y,
      PAINT_CONSTANTS.NODE_BASE_RADIUS + proximity * PAINT_CONSTANTS.NODE_PROXIMITY_RADIUS,
      PAINT_CONSTANTS.ARC_START_RADIANS,
      PAINT_CONSTANTS.FULL_ARC_RADIANS,
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
  context.clearRect(PAINT_CONSTANTS.ORIGIN, PAINT_CONSTANTS.ORIGIN, size.width, size.height);
  drawLinks(context, dots, pointer, size);
  drawNodes(context, dots, pointer, elapsedMs);
}
