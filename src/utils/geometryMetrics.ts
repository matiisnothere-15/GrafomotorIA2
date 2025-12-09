export type Pt = { x: number; y: number };

// Compute overall orientation angle (0..180) of a polyline based on endpoints
export function orientationDeg(points: Pt[]): number | null {
  if (!points || points.length < 2) return null;
  const first = points[0];
  let last = points[points.length - 1];
  // Find a last point sufficiently far to avoid zero-length
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    if (Math.abs(p.x - first.x) + Math.abs(p.y - first.y) > 1e-6) { last = p; break; }
  }
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return null;
  let a = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
  a = (a + 360) % 360; // 0..360
  if (a > 180) a -= 180; // 0..180, orientation without direction
  return a;
}

// Compute curvature per vertex using turning angle over segment length, return mean and std
export function curvatureStats(points: Pt[]): { mean: number; std: number } | null {
  if (!points || points.length < 3) return null;
  const curvs: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const v1x = p1.x - p0.x; const v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x; const v2y = p2.y - p1.y;
    const l1 = Math.hypot(v1x, v1y); const l2 = Math.hypot(v2x, v2y);
    if (l1 < 1e-9 || l2 < 1e-9) continue;
    // turning angle between v1 and v2
    const dot = (v1x * v2x + v1y * v2y) / (l1 * l2);
    const cosT = Math.max(-1, Math.min(1, dot));
    const theta = Math.acos(cosT); // 0..pi
    const avgLen = (l1 + l2) / 2;
    const k = theta / Math.max(1e-6, avgLen); // curvature ~ angle per unit length
    curvs.push(k);
  }
  if (!curvs.length) return null;
  const mean = curvs.reduce((a, b) => a + b, 0) / curvs.length;
  const varc = curvs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / curvs.length;
  return { mean, std: Math.sqrt(varc) };
}

// Simple circle fit (Kasa method) returning center, radius, and RMS error of radial residuals
export function fitCircle(points: Pt[]): { cx: number; cy: number; r: number; rms: number } | null {
  if (!points || points.length < 3) return null;
  let sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0, sumX3 = 0, sumY3 = 0, sumXXY = 0, sumYYX = 0;
  const n = points.length;
  for (const p of points) {
    const x = p.x, y = p.y;
    const xx = x * x, yy = y * y;
    sumX += x; sumY += y; sumXX += xx; sumYY += yy; sumXY += x * y;
    sumX3 += xx * x; sumY3 += yy * y; sumXXY += xx * y; sumYYX += yy * x;
  }
  const C = n * sumXX - sumX * sumX;
  const D = n * sumXY - sumX * sumY;
  const E = n * sumYY - sumY * sumY;
  const G = 0.5 * (n * (sumXXY + sumY3) - sumY * (sumXX + sumYY));
  const F = 0.5 * (n * (sumX3 + sumYYX) - sumX * (sumXX + sumYY));
  const denom = C * E - D * D;
  if (Math.abs(denom) < 1e-9) return null;
  const cx = (F * E - D * G) / denom;
  const cy = (C * G - D * F) / denom;
  const r = Math.sqrt((sumXX + sumYY - 2 * cx * sumX - 2 * cy * sumY) / n + cx * cx + cy * cy);
  // RMS radial error
  let err2 = 0;
  for (const p of points) {
    const dr = Math.hypot(p.x - cx, p.y - cy) - r;
    err2 += dr * dr;
  }
  const rms = Math.sqrt(err2 / n);
  return { cx, cy, r, rms };
}

export function isClosed(points: Pt[], tol = 5): boolean {
  if (!points || points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return Math.hypot(last.x - first.x, last.y - first.y) <= tol;
}

// Bundle recommended extras comparing model vs patient
export function computeExtras(model: Pt[], patient: Pt[]) {
  const angModel = orientationDeg(model);
  const angPatient = orientationDeg(patient);
  const angDelta = (angModel != null && angPatient != null) ? Math.abs(angPatient - angModel) : null;
  const curvM = curvatureStats(model);
  const curvP = curvatureStats(patient);
  const closedM = isClosed(model);
  const fitP = closedM ? fitCircle(patient) : null;
  return {
    orientation_deg_model: angModel,
    orientation_deg_patient: angPatient,
    orientation_delta_deg: angDelta,
    curvature_model: curvM,
    curvature_patient: curvP,
    circle_fit_patient: fitP,
  };
}
