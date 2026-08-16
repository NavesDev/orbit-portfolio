import type { Dot, FieldSize, Pointer } from './field';
import { linkDistanceFor, proximityAt } from './field';

/**
 * Painting for the hero field.
 *
 * Split from `field.ts` because the two are tested differently: the physics
 * are asserted directly, while canvas pixels are explicitly not tested
 * (`docs/testing.md`). Keeping them apart means the untested half is only the
 * half that draws.
 *
 * The base colour is `--blue` from `tokens.css`. A canvas cannot read a custom
 * property, so the value is restated here as numbers the painting can
 * interpolate — named, and pointing at the token it mirrors.
 */
const BASE_COLOUR = { red: 37, green: 106, blue: 191 } as const;

/** How far the colour travels towards a lighter cyan as the pointer nears. */
const PROXIMITY_COLOUR_SHIFT = { red: 25, green: 90, blue: 50 } as const;

/** A link's strength where the two dots touch, before distance fades it out. */
const FULL_LINK_STRENGTH = 1;
const LINK_BASE_ALPHA = 0.14;
const LINK_PROXIMITY_ALPHA = 0.4;
const LINK_MAX_ALPHA = 0.5;
/** Below this the line is invisible and drawing it is pure cost. */
const LINK_MIN_VISIBLE_ALPHA = 0.012;
const LINK_WIDTH = 1;

const NODE_BASE_ALPHA = 0.18;
const NODE_PROXIMITY_ALPHA = 0.55;
const NODE_BREATHE_ALPHA = 0.05;
const NODE_MAX_ALPHA = 0.7;
const NODE_BASE_RADIUS = 1.4;
const NODE_PROXIMITY_RADIUS = 2.2;

/** How fast the dots breathe, in radians per millisecond. */
const BREATHE_RATE = 0.0012;
const BREATHE_AMPLITUDE = 0.5;
const BREATHE_OFFSET = 0.5;

const MIDPOINT_DIVISOR = 2;
const FULL_ARC_RADIANS = Math.PI * 2;
const ARC_START_RADIANS = 0;
const ORIGIN = 0;
const NO_PROXIMITY = 0;

function distanceToPointer(x: number, y: number, pointer: Pointer): number {
  return pointer === null ? Number.POSITIVE_INFINITY : Math.hypot(x - pointer.x, y - pointer.y);
}

function colourAt(proximity: number, alpha: number): string {
  const red = Math.round(BASE_COLOUR.red + proximity * PROXIMITY_COLOUR_SHIFT.red);
  const green = Math.round(BASE_COLOUR.green + proximity * PROXIMITY_COLOUR_SHIFT.green);
  const blue = Math.round(BASE_COLOUR.blue + proximity * PROXIMITY_COLOUR_SHIFT.blue);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawLinks(
  context: CanvasRenderingContext2D,
  dots: readonly Dot[],
  pointer: Pointer,
  size: FieldSize,
): void {
  const linkDistance = linkDistanceFor(size);

  for (let i = ORIGIN; i < dots.length; i += 1) {
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

      const midX = (a.x + b.x) / MIDPOINT_DIVISOR;
      const midY = (a.y + b.y) / MIDPOINT_DIVISOR;
      const proximity =
        pointer === null ? NO_PROXIMITY : proximityAt(distanceToPointer(midX, midY, pointer));
      const alpha = Math.min(
        LINK_MAX_ALPHA,
        (FULL_LINK_STRENGTH - distance / linkDistance) * LINK_BASE_ALPHA +
          proximity * LINK_PROXIMITY_ALPHA,
      );

      if (alpha < LINK_MIN_VISIBLE_ALPHA) {
        continue;
      }

      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.strokeStyle = colourAt(proximity, alpha);
      context.lineWidth = LINK_WIDTH;
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
      pointer === null ? NO_PROXIMITY : proximityAt(distanceToPointer(dot.x, dot.y, pointer));
    const breathe =
      Math.sin(elapsedMs * BREATHE_RATE + dot.pulse) * BREATHE_AMPLITUDE + BREATHE_OFFSET;
    const alpha = Math.min(
      NODE_MAX_ALPHA,
      NODE_BASE_ALPHA + proximity * NODE_PROXIMITY_ALPHA + breathe * NODE_BREATHE_ALPHA,
    );

    context.beginPath();
    context.arc(
      dot.x,
      dot.y,
      NODE_BASE_RADIUS + proximity * NODE_PROXIMITY_RADIUS,
      ARC_START_RADIANS,
      FULL_ARC_RADIANS,
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
  context.clearRect(ORIGIN, ORIGIN, size.width, size.height);
  drawLinks(context, dots, pointer, size);
  drawNodes(context, dots, pointer, elapsedMs);
}
