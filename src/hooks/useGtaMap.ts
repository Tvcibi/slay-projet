import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapZone } from '@/lib/mapZones';

const MAP_BOUNDS: L.LatLngBoundsExpression = [[0, 0], [256, 256]];

interface UseGtaMapOptions {
  container: HTMLDivElement | null;
  zones?: MapZone[];
  editable?: boolean;
  onZoneCreated?: (zone: { shape_type: string; geometry: any }) => void;
}

export function useGtaMap({ container, zones = [], editable = false, onZoneCreated }: UseGtaMapOptions) {
  const mapRef = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const drawControlRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      crs: L.CRS.Simple,
      minZoom: 2,
      maxZoom: 3,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[-50, -50], [306, 400]],
      maxBoundsViscosity: 0.9,
    });

    L.imageOverlay('/images/gtav-map.png', MAP_BOUNDS).addTo(map);
    // Cayo Perico island – bottom-right area
    L.imageOverlay('/images/cayo-perico.png', [[-50, 200], [50, 300]] as L.LatLngBoundsExpression).addTo(map);
    map.setView([128, 128], 3);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const zonesLayer = L.layerGroup().addTo(map);
    zonesLayerRef.current = zonesLayer;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      zonesLayerRef.current = null;
    };
  }, [container]);

  // Setup draw controls for admin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !editable) return;

    import('leaflet-draw').then(() => {
      import('leaflet-draw/dist/leaflet.draw.css');

      // French translations for draw toolbar
      (L as any).drawLocal.draw.toolbar.actions = { title: 'Annuler le dessin', text: 'Annuler' };
      (L as any).drawLocal.draw.toolbar.finish = { title: 'Terminer le dessin', text: 'Terminer' };
      (L as any).drawLocal.draw.toolbar.undo = { title: 'Supprimer le dernier point', text: 'Supprimer le dernier point' };
      (L as any).drawLocal.draw.toolbar.buttons = { polygon: 'Dessiner un polygone' };
      (L as any).drawLocal.draw.handlers.polygon.tooltip = {
        start: 'Cliquez pour commencer à dessiner.',
        cont: 'Cliquez pour continuer.',
        end: 'Cliquez sur le premier point pour terminer.',
      };
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new (L.Control as any).Draw({
        position: 'topleft',
        draw: {
          polyline: false,
          marker: false,
          circlemarker: false,
          rectangle: false,
          circle: false,
          polygon: {
            allowIntersection: false,
            shapeOptions: { color: '#7c3aed', weight: 2, opacity: 0.8, fillOpacity: 0.3 },
          },
        },
        edit: false,
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        const layerType = e.layerType;

        let geometry: any;
        let shape_type: string;

        if (layerType === 'circle') {
          const center = layer.getLatLng();
          geometry = { center: [center.lat, center.lng], radius: layer.getRadius() };
          shape_type = 'circle';
        } else if (layerType === 'rectangle') {
          const bounds = layer.getBounds();
          geometry = {
            bounds: [
              [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
              [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
            ],
          };
          shape_type = 'rectangle';
        } else {
          const latlngs = layer.getLatLngs()[0];
          geometry = { latlngs: latlngs.map((ll: L.LatLng) => [ll.lat, ll.lng]) };
          shape_type = 'polygon';
        }

        onZoneCreated?.({ shape_type, geometry });
      });
    });

    return () => {
      if (drawControlRef.current && map) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [editable, mapRef.current]);

  // Render zones
  const renderZones = useCallback(() => {
    const layer = zonesLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    zones.forEach((zone) => {
      const color = zone.color || '#7c3aed';
      const options = { color, weight: 2, opacity: 0.8, fillColor: color, fillOpacity: 0.25 };

      let shape: L.Layer | null = null;

      if (zone.shape_type === 'circle' && zone.geometry.center) {
        shape = L.circle(zone.geometry.center as [number, number], {
          ...options,
          radius: zone.geometry.radius,
        });
      } else if (zone.shape_type === 'rectangle' && zone.geometry.bounds) {
        shape = L.rectangle(zone.geometry.bounds as L.LatLngBoundsExpression, options);
      } else if (zone.geometry.latlngs) {
        shape = L.polygon(zone.geometry.latlngs as [number, number][], options);
      }

      if (shape) {
        (shape as any).options.interactive = true;
        shape.bindTooltip(zone.name, {
          permanent: false,
          direction: 'center',
          className: 'zone-tooltip',
        });
        shape.on('click', (e) => { L.DomEvent.stopPropagation(e); });
        layer.addLayer(shape);
      }
    });
  }, [zones]);

  useEffect(() => {
    renderZones();
  }, [renderZones]);

  return { map: mapRef.current };
}
