// Phone version of the map: Leaflet inside a WebView
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { mapHtml } from './mapHtml';
import { useMapBridge } from './useMapBridge';

const LeafletMap = forwardRef(function LeafletMap(props, ref) {
  const webRef = useRef(null);
  const post = (msg) => webRef.current?.injectJavaScript(`window.receive(${JSON.stringify(msg)}); true;`);
  const { onMessage, center } = useMapBridge(props, post);
  useImperativeHandle(ref, () => ({ center }));

  return (
    <WebView
      ref={webRef}
      style={[styles.map, props.style]}
      originWhitelist={['*']}
      source={{ html: mapHtml, baseUrl: 'https://astana-issue-reporter.local/' }}
      onMessage={(e) => onMessage(e.nativeEvent.data)}
      javaScriptEnabled
      setSupportMultipleWindows={false}
    />
  );
});

const styles = StyleSheet.create({ map: { flex: 1 } });
export default LeafletMap;
