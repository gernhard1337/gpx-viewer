import {
	App,
	MarkdownPostProcessor,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	TFile,
} from 'obsidian';
import { parseGpx } from '../gpx/parser';
import { calculateStats, GpxStats } from '../gpx/stats';
import { GpxData } from '../gpx/models';
import { MapRenderer } from '../views/MapRenderer';
import { DEFAULT_TILE_URL, DEFAULT_ATTRIBUTION } from '../views/mapDefaults';
import { GpxFileCache } from '../cache/gpxFileCache';
import { ElevationChart } from '../views/ElevationChart';

// TODO(step 8): read from plugin settings instead of this constant.
const SHOW_ELEVATION_CHART = true;

class GpxEmbedRenderChild extends MarkdownRenderChild {
	private mapRenderer: MapRenderer | null = null;
	private elevationChart: ElevationChart | null = null;

	constructor(
		containerEl: HTMLElement,
		private app: App,
		private file: TFile,
		private cache: GpxFileCache,
	) {
		super(containerEl);
	}

	async onload(): Promise<void> {
		this.containerEl.addClass('gpx-viewer-embed');

		const cached = this.cache.get(this.file.path, this.file.stat.mtime);

		let data: GpxData;
		let stats: GpxStats;
		if (cached) {
			({ data, stats } = cached);
		} else {
			let content: string;
			try {
				content = await this.app.vault.cachedRead(this.file);
			} catch (error) {
				this.renderError(
					`Datei konnte nicht gelesen werden: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
				return;
			}

			try {
				data = parseGpx(content);
			} catch (error) {
				this.renderError(
					error instanceof Error ? error.message : 'Ungültige GPX-Datei.',
				);
				return;
			}

			stats = calculateStats(data.points);
			this.cache.set(this.file.path, this.file.stat.mtime, { data, stats });
		}

		const mapEl = this.containerEl.createDiv();
		this.mapRenderer = new MapRenderer({
			container: mapEl,
			data,
			compact: true,
			tileUrl: DEFAULT_TILE_URL,
			attribution: DEFAULT_ATTRIBUTION,
		});

		this.containerEl.createDiv({
			cls: 'gpx-viewer-embed-stats',
			text: `${stats.distanceKm.toFixed(2)} km · ${Math.round(stats.elevationGainM)} m ↑ · ${Math.round(stats.elevationLossM)} m ↓`,
		});

		if (SHOW_ELEVATION_CHART) {
			const chartEl = this.containerEl.createDiv({
				cls: 'gpx-viewer-elevation-chart-compact',
			});
			this.elevationChart = new ElevationChart({
				container: chartEl,
				points: data.points,
			});
		}
	}

	onunload(): void {
		this.mapRenderer?.destroy();
		this.mapRenderer = null;
		this.elevationChart?.destroy();
		this.elevationChart = null;
	}

	private renderError(message: string): void {
		this.containerEl.createDiv({ cls: 'gpx-viewer-error', text: message });
	}
}

export function createGpxEmbedProcessor(
	app: App,
	cache: GpxFileCache,
): MarkdownPostProcessor {
	return (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const embeds = el.querySelectorAll<HTMLElement>('.internal-embed[src]');

		embeds.forEach((embedEl) => {
			const src = embedEl.getAttribute('src');
			if (!src || !src.toLowerCase().endsWith('.gpx')) return;

			const file = app.metadataCache.getFirstLinkpathDest(
				src,
				ctx.sourcePath,
			);
			if (!(file instanceof TFile)) return;

			const wrapper = document.createElement('div');
			embedEl.replaceWith(wrapper);

			ctx.addChild(new GpxEmbedRenderChild(wrapper, app, file, cache));
		});
	};
}
