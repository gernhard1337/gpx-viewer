import {
	CategoryScale,
	Chart,
	LinearScale,
	LineController,
	LineElement,
	PointElement,
	Tooltip,
} from 'chart.js';
import { TrackPoint } from '../gpx/models';
import { haversineDistanceKm } from '../gpx/stats';
import {
	Units,
	convertDistanceKm,
	convertElevationM,
	distanceUnitLabel,
	elevationUnitLabel,
} from '../gpx/units';

Chart.register(
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
);

export interface ElevationChartOptions {
	container: HTMLElement;
	points: TrackPoint[];
	units: Units;
}

function cumulativeDistancesKm(points: TrackPoint[]): number[] {
	const distances: number[] = [];
	let total = 0;
	for (let i = 0; i < points.length; i++) {
		if (i > 0) {
			const prev = points[i - 1];
			const curr = points[i];
			if (prev && curr) total += haversineDistanceKm(prev, curr);
		}
		distances.push(total);
	}
	return distances;
}

export class ElevationChart {
	private chart: Chart;

	constructor(options: ElevationChartOptions) {
		const { container, points, units } = options;

		container.classList.add('gpx-viewer-elevation-chart');
		const canvas = document.createElement('canvas');
		container.appendChild(canvas);

		const distances = cumulativeDistancesKm(points).map((km) =>
			convertDistanceKm(km, units),
		);
		const elevations = points.map((point) =>
			point.ele !== undefined ? convertElevationM(point.ele, units) : null,
		);
		const distUnit = distanceUnitLabel(units);
		const eleUnit = elevationUnitLabel(units);

		this.chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: distances.map((d) => d.toFixed(1)),
				datasets: [
					{
						data: elevations,
						borderColor: '#3388ff',
						backgroundColor: 'rgba(51, 136, 255, 0.15)',
						pointRadius: 0,
						fill: true,
						tension: 0.15,
						spanGaps: true,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						title: { display: true, text: `Distanz (${distUnit})` },
					},
					y: {
						title: { display: true, text: `Höhe (${eleUnit})` },
					},
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							title: (items) => `${items[0]?.label ?? '0'} ${distUnit}`,
							label: (item) => `${item.formattedValue} ${eleUnit}`,
						},
					},
				},
			},
		});
	}

	destroy(): void {
		this.chart.destroy();
	}
}
