// Douglas-Peucker & Geo Coordinate Utilities for Walk GPS & Shapeify

export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp?: number;
  altitude?: number;
  speed?: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Calculates distance between two latitude/longitude points in kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates perpendicular distance from a point to a line segment
 */
function perpendicularDistance(point: ScreenPoint, lineStart: ScreenPoint, lineEnd: ScreenPoint): number {
  let dx = lineEnd.x - lineStart.x;
  let dy = lineEnd.y - lineStart.y;

  // Normalize
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag > 0) {
    dx /= mag;
    dy /= mag;
  }

  const pvx = point.x - lineStart.x;
  const pvy = point.y - lineStart.y;

  // Get dot product (projected distance along line)
  const pvdot = dx * pvx + dy * pvy;

  // Scale line vector
  const dsx = pvdot * dx;
  const dsy = pvdot * dy;

  // Subtract this from pv to get perpendicular vector
  const ax = pvx - dsx;
  const ay = pvy - dsy;

  return Math.sqrt(ax * ax + ay * ay);
}

/**
 * Douglas-Peucker Polyline Simplification Algorithm
 * Reduces noisy GPS jitter points while preserving key turn vertices.
 * @param points Array of screen or 2D coordinates
 * @param tolerance Epsilon distance threshold for simplification (e.g., 2.0 to 5.0)
 */
export function douglasPeucker(points: ScreenPoint[], tolerance: number = 2.5): ScreenPoint[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    // Recursive step
    const recResults1 = douglasPeucker(points.slice(0, index + 1), tolerance);
    const recResults2 = douglasPeucker(points.slice(index), tolerance);

    // Concat results (remove duplicate joint point)
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}

/**
 * Converts array of Lat/Lng coordinates into normalized [0, 100] SVG viewBox coordinate space
 */
export function geoPathToSvgCoords(coords: GeoPoint[], padding: number = 10): ScreenPoint[] {
  if (coords.length === 0) return [];
  if (coords.length === 1) return [{ x: 50, y: 50 }];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const c of coords) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lng < minLng) minLng = c.lng;
    if (c.lng > maxLng) maxLng = c.lng;
  }

  const latSpan = maxLat - minLat || 0.0001;
  const lngSpan = maxLng - minLng || 0.0001;

  const targetSize = 100 - padding * 2;

  return coords.map((c) => {
    // Normalize into 0..targetSize and flip Y axis because latitude goes up north while SVG Y goes down
    const normX = ((c.lng - minLng) / lngSpan) * targetSize + padding;
    const normY = (1 - (c.lat - minLat) / latSpan) * targetSize + padding;
    return {
      x: Math.round(normX * 10) / 10,
      y: Math.round(normY * 10) / 10,
    };
  });
}

/**
 * Generates an SVG path 'd' string with smooth cubic/quadratic curves (Catmull-Rom or Bezier spline)
 */
export function pointsToSmoothSvgPath(points: ScreenPoint[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;

    if (i === 0) {
      d += ` Q ${curr.x},${curr.y} ${midX},${midY}`;
    } else {
      d += ` Q ${curr.x},${curr.y} ${midX},${midY}`;
    }
  }

  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;

  return d;
}

/**
 * Calorie calculation formula for dogs:
 * Standard METS ~ 3.5 to 4.0 kcal/kg/hour based on dog weight & walk distance
 */
export function calculatePetWalkCalories(weightKg: number, distanceKm: number): number {
  // Approximate: dog weight (kg) * distance (km) * 0.75 + human handling ~ approx
  const petCal = Math.round(weightKg * distanceKm * 0.85);
  return Math.max(8, petCal);
}
