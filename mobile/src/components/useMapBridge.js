// Shared logic between the app and the map page: sends markers / pin, receives taps
import { useCallback, useEffect, useRef } from 'react';

export function useMapBridge({ markers, pickMode, pin, onMarkerPress, onPick, onMapTap }, post) {
  const ready = useRef(false);
  const latest = useRef({});
  const postRef = useRef(post);
  // Keep the newest props for the message handler (updated after every render)
  useEffect(() => {
    latest.current = { markers, pickMode, pin, onMarkerPress, onPick, onMapTap };
    postRef.current = post;
  });

  const sendState = useCallback(() => {
    const { markers: m, pickMode: p, pin: pn } = latest.current;
    const send = postRef.current;
    if (m) send({ type: 'markers', markers: m.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, status: r.status })) });
    send({ type: 'pickMode', value: Boolean(p) });
    if (pn) send({ type: 'pin', lat: pn.lat, lng: pn.lng, pan: pn.pan !== false });
  }, []);

  useEffect(() => { if (ready.current) sendState(); }, [markers, pickMode, pin, sendState]);

  const onMessage = useCallback((raw) => {
    let msg;
    try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return; }
    if (!msg || !msg.type) return;
    const h = latest.current;
    if (msg.type === 'ready') { ready.current = true; sendState(); }
    if (msg.type === 'marker') h.onMarkerPress?.(msg.id);
    if (msg.type === 'pick') h.onPick?.({ lat: msg.lat, lng: msg.lng });
    if (msg.type === 'mapTap') h.onMapTap?.();
  }, [sendState]);

  const center = useCallback((lat, lng, zoom) => postRef.current({ type: 'center', lat, lng, zoom }), []);

  return { onMessage, center };
}
