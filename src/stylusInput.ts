/** Tablet/stylus input adapter for LAB GENRE3D.
 * Browser Pointer Events support Wacom and compatible pen tablets.
 * This module is device-agnostic and does not require a Wacom SDK.
 */
export type StylusSample = {
  x: number; y: number; pressure: number; tiltX: number; tiltY: number;
  twist: number; eraser: boolean; pointerId: number; time: number;
};
export type StylusHandlers = {
  start?: (sample: StylusSample) => void;
  move?: (sample: StylusSample) => void;
  end?: (sample: StylusSample) => void;
};
export type StylusSettings = {
  enabled: boolean; minPressure: number; gamma: number;
  mouseFallbackPressure: number; useEraser: boolean;
};
export const DEFAULT_STYLUS_SETTINGS: StylusSettings = {
  enabled: true, minPressure: 0.02, gamma: 1.25,
  mouseFallbackPressure: 0.5, useEraser: true
};
export function stylusStrength(pressure: number, settings: StylusSettings = DEFAULT_STYLUS_SETTINGS): number {
  const p = Math.max(0, Math.min(1, Number.isFinite(pressure) ? pressure : 0));
  return Math.pow(Math.max(0, (p - settings.minPressure) / (1 - settings.minPressure)), settings.gamma);
}
export function attachStylus(
  element: HTMLElement, handlers: StylusHandlers,
  settings: StylusSettings = DEFAULT_STYLUS_SETTINGS
): () => void {
  const active = new Set<number>();
  const sample = (event: PointerEvent): StylusSample => {
    const rect = element.getBoundingClientRect();
    const pressure = event.pointerType === 'mouse' ? settings.mouseFallbackPressure : event.pressure;
    return {
      x: event.clientX - rect.left, y: event.clientY - rect.top,
      pressure: stylusStrength(pressure, settings),
      tiltX: event.tiltX ?? 0, tiltY: event.tiltY ?? 0,
      twist: event.twist ?? 0,
      eraser: settings.useEraser && (event.button === 5 || (event.buttons & 32) !== 0),
      pointerId: event.pointerId, time: event.timeStamp
    };
  };
  const down = (event: PointerEvent) => {
    if (!settings.enabled || (event.pointerType !== 'pen' && event.pointerType !== 'mouse')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    active.add(event.pointerId);
    try { element.setPointerCapture(event.pointerId); } catch { /* capture optional */ }
    handlers.start?.(sample(event));
  };
  const move = (event: PointerEvent) => {
    if (!active.has(event.pointerId)) return;
    const events = event.getCoalescedEvents?.() ?? [event];
    for (const e of events) handlers.move?.(sample(e));
  };
  const end = (event: PointerEvent) => {
    if (!active.delete(event.pointerId)) return;
    handlers.end?.(sample(event));
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  };
  element.addEventListener('pointerdown', down);
  element.addEventListener('pointermove', move);
  element.addEventListener('pointerup', end);
  element.addEventListener('pointercancel', end);
  return () => {
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerup', end);
    element.removeEventListener('pointercancel', end);
    active.clear();
  };
}
