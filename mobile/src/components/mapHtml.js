// The map page shown inside the app (WebView on phones, iframe on web).
// Leaflet + OpenStreetMap, as planned in the midterm (C2). Leaflet is built in, only map tiles are downloaded.
// Markers are drawn on a canvas, so 100+ markers stay fast (R10).
import { statusColors } from '../lib/theme';
import { ASTANA } from '../lib/config';
import { LEAFLET_CSS, LEAFLET_JS } from './leafletAssets';

export const mapHtml = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${LEAFLET_CSS}</style>
<style>
  html, body, #map { height: 100%; margin: 0; background: #e5e7eb; }
  .pin { width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: #1E3A8A;
         transform: rotate(-45deg); border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.4); }
</style>
</head><body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
  var COLORS = ${JSON.stringify(statusColors)};
  function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else window.parent.postMessage(s, '*');
  }
  var map = L.map('map', { preferCanvas: true, zoomControl: false }).setView([${ASTANA.lat}, ${ASTANA.lng}], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  var markers = L.layerGroup().addTo(map);
  var pin = null;
  var pickMode = false;

  function setMarkers(list) {
    markers.clearLayers();
    list.forEach(function (r) {
      L.circleMarker([r.lat, r.lng], {
        radius: 9, color: '#ffffff', weight: 2, fillColor: COLORS[r.status] || '#6b7280', fillOpacity: 0.95
      }).on('click', function (e) {
        L.DomEvent.stopPropagation(e);
        send({ type: 'marker', id: r.id });
      }).addTo(markers);
    });
  }

  function setPin(lat, lng, pan) {
    if (!pin) {
      // Own pin icon: Leaflet's default icon needs image files that are not embedded
      var icon = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [32, 32], iconAnchor: [16, 34] });
      pin = L.marker([lat, lng], { icon: icon, interactive: false }).addTo(map);
    }
    else pin.setLatLng([lat, lng]);
    if (pan) map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }

  map.on('click', function (e) {
    if (pickMode) {
      setPin(e.latlng.lat, e.latlng.lng, false);
      send({ type: 'pick', lat: e.latlng.lat, lng: e.latlng.lng });
    } else {
      send({ type: 'mapTap' });
    }
  });

  // Commands from the app
  window.receive = function (msg) {
    if (msg.type === 'markers') setMarkers(msg.markers);
    if (msg.type === 'pickMode') pickMode = msg.value;
    if (msg.type === 'pin') setPin(msg.lat, msg.lng, msg.pan);
    if (msg.type === 'center') map.setView([msg.lat, msg.lng], msg.zoom || map.getZoom());
  };
  window.addEventListener('message', function (e) {
    try { var m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; if (m && m.type) window.receive(m); } catch (err) {}
  });
  send({ type: 'ready' });
</script>
</body></html>`;
