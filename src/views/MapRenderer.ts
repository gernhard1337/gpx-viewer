import L from 'leaflet';
import { GpxData, TrackPoint } from '../gpx/models';

export interface MapRendererOptions {
	container: HTMLElement;
	data: GpxData;
	compact: boolean;
	tileUrl: string;
	attribution: string;
}

function toLatLng(point: TrackPoint): L.LatLngTuple {
	return [point.lat, point.lon];
}

function dotIcon(className: string): L.DivIcon {
	return L.divIcon({
		className: `gpx-viewer-marker ${className}`,
		iconSize: [14, 14],
	});
}

const START_ICON = dotIcon('gpx-viewer-marker-start');
const END_ICON = dotIcon('gpx-viewer-marker-end');
const WAYPOINT_ICON = dotIcon('gpx-viewer-marker-waypoint');

export class MapRenderer {
	private map: L.Map;

	constructor(options: MapRendererOptions) {
		const { container, data, compact, tileUrl, attribution } = options;

		container.classList.add(
			'gpx-viewer-map',
			compact ? 'gpx-viewer-map-compact' : 'gpx-viewer-map-full',
		);

		this.map = L.map(container, {
			zoomControl: !compact,
			scrollWheelZoom: !compact,
			attributionControl: !compact,
		});

		L.tileLayer(tileUrl, { attribution }).addTo(this.map);

		this.drawTrack(data);
		this.fitToTrack(data.points);
	}

	private drawTrack(data: GpxData): void {
		const { points, waypoints } = data;

		if (points.length > 0) {
			const latLngs = points.map(toLatLng);
			L.polyline(latLngs, { color: '#3388ff', weight: 4 }).addTo(this.map);

			const firstPoint = points[0];
			const lastPoint = points[points.length - 1];
			if (firstPoint) {
				L.marker(toLatLng(firstPoint), { icon: START_ICON }).addTo(this.map);
			}
			if (lastPoint && lastPoint !== firstPoint) {
				L.marker(toLatLng(lastPoint), { icon: END_ICON }).addTo(this.map);
			}
		}

		for (const waypoint of waypoints) {
			const marker = L.marker([waypoint.lat, waypoint.lon], {
				icon: WAYPOINT_ICON,
			}).addTo(this.map);
			if (waypoint.name) {
				marker.bindTooltip(waypoint.name);
			}
		}
	}

	private fitToTrack(points: TrackPoint[]): void {
		if (points.length === 0) {
			this.map.setView([0, 0], 2);
			return;
		}

		if (points.length === 1) {
			const point = points[0];
			if (point) this.map.setView(toLatLng(point), 14);
			return;
		}

		const bounds = L.latLngBounds(points.map(toLatLng));
		this.map.fitBounds(bounds, { padding: [20, 20] });
	}

	destroy(): void {
		this.map.remove();
	}
}
