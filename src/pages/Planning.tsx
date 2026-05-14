import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import logo from '@/assets/logo.png';
import { fetchMapZones, type MapZone } from '@/lib/mapZones';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const MAP_BOUNDS: L.LatLngBoundsExpression = [[0, 0], [256, 256]];

function getZoneBounds(zone: MapZone): L.LatLngBounds | null {
  if (!zone.geometry || Object.keys(zone.geometry).length === 0) return null;
  if (zone.shape_type === 'circle' && zone.geometry.center) {
    const center = L.latLng(zone.geometry.center[0], zone.geometry.center[1]);
    return center.toBounds(zone.geometry.radius * 2);
  } else if (zone.shape_type === 'rectangle' && zone.geometry.bounds) {
    return L.latLngBounds(zone.geometry.bounds as [number, number][]);
  } else if (zone.geometry.latlngs) {
    return L.latLngBounds(zone.geometry.latlngs as [number, number][]);
  }
  return null;
}

export default function Planning() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    fetchMapZones().then(setZones);
  }, []);

  useEffect(() => {
    document.title = 'FlashWorld - Planning';
    return () => { document.title = 'FlashWorld - Légal'; };
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: 2,
      maxZoom: 3,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[-50, -50], [306, 400]],
      maxBoundsViscosity: 0.9,
    });

    L.imageOverlay('/images/gtav-map.png', MAP_BOUNDS).addTo(map);
    L.imageOverlay('/images/cayo-perico.png', [[-50, 200], [50, 300]] as L.LatLngBoundsExpression).addTo(map);
    map.setView([128, 128], 3);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const zonesLayer = L.layerGroup().addTo(map);
    zonesLayerRef.current = zonesLayer;
    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
      zonesLayerRef.current = null;
    };
  }, []);

  // Render zones
  useEffect(() => {
    const layer = zonesLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    zones.forEach((zone) => {
      const color = zone.color || '#7c3aed';
      const shapeOptions = { color, weight: 2, opacity: 0.8, fillColor: color, fillOpacity: 0.25 };

      let shape: L.Layer | null = null;

      if (zone.shape_type === 'circle' && zone.geometry.center) {
        shape = L.circle(zone.geometry.center as [number, number], {
          ...shapeOptions,
          radius: zone.geometry.radius,
        });
      } else if (zone.shape_type === 'rectangle' && zone.geometry.bounds) {
        shape = L.rectangle(zone.geometry.bounds as L.LatLngBoundsExpression, shapeOptions);
      } else if (zone.geometry.latlngs) {
        shape = L.polygon(zone.geometry.latlngs as [number, number][], shapeOptions);
      }

      if (shape) {
        shape.bindTooltip(zone.name, {
          permanent: false,
          direction: 'center',
          className: 'zone-tooltip',
        });
        shape.on('click', (e: any) => { L.DomEvent.stopPropagation(e); });
        layer.addLayer(shape);
      }
    });
  }, [zones]);

  const flyToZone = useCallback((zone: MapZone) => {
    const map = leafletMap.current;
    if (!map) return;
    const bounds = getZoneBounds(zone);
    if (bounds) {
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 3, duration: 0.6 });
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-black/70 backdrop-blur-md border-b border-white/10 px-6 py-3 z-[1000] flex items-center gap-3 relative">
        <img src={logo} alt="FlashWorld" className="h-7 w-7 rounded-full object-cover" />
        <h1 className="text-sm font-bold text-white tracking-wide">FlashWorld</h1>
        <span className="text-xs text-white/30">|</span>
        <span className="text-xs text-white/60 font-medium">Planning Évènement</span>
      </div>

      {/* Map + overlay panel */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" style={{ background: '#0FA7D1' }} />

        {/* Zone list panel */}
        <div className="absolute top-3 right-3 z-[1000] w-56">
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
            {/* Panel header */}
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-white">Évènement</span>
              </div>
              {panelOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              )}
            </button>

            {/* Zone list */}
            {panelOpen && (
              <div className="border-t border-white/10 max-h-64 overflow-y-auto">
                {zones.length === 0 ? (
                  <p className="text-xs text-white/40 px-4 py-3">Aucun évènement</p>
                ) : (
                  zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => flyToZone(zone)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left group"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-xs text-white/80 group-hover:text-white truncate transition-colors">
                        {zone.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
