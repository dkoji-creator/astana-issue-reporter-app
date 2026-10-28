// Browser version of the map: the same Leaflet page inside an iframe
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { mapHtml } from './mapHtml';
import { useMapBridge } from './useMapBridge';

const LeafletMap = forwardRef(function LeafletMap(props, ref) {
  const frameRef = useRef(null);
  const post = (msg) => frameRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*');
  const { onMessage, center } = useMapBridge(props, post);
  useImperativeHandle(ref, () => ({ center }));

  useEffect(() => {
    const listener = (e) => {
      if (e.source === frameRef.current?.contentWindow) onMessage(e.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onMessage]);

  return (
    <View style={[{ flex: 1 }, props.style]}>
      <iframe ref={frameRef} title="map" srcDoc={mapHtml} style={{ border: 0, width: '100%', height: '100%' }} />
    </View>
  );
});

export default LeafletMap;
