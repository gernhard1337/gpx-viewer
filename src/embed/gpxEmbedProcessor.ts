import {
	App,
	MarkdownPostProcessor,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	TFile,
} from 'obsidian';
import type GpxViewerPlugin from '../main';
import { parseGpx } from '../gpx/parser';
import { calculateStats, GpxStats } from '../gpx/stats';
import { GpxData } from '../gpx/models';
import { formatDistance, formatElevation } from '../gpx/units';
import { MapRenderer } from '../views/MapRenderer';
import { ElevationChart } from '../views/ElevationChart';

class GpxEmbedRenderChild extends MarkdownRenderChild {
	private mapRenderer: MapRenderer | null = null;
	private elevationChart: ElevationChart | null = null;

	constructor(
		containerEl: HTMLElement,
		private app: App,
		private file: TFile,
		private plugin: GpxViewerPlugin,
	) {
		super(containerEl);
	}

	onload(): void {
		void this.render();
	}

	private async render(): Promise<void> {
		this.containerEl.addClass('gpx-viewer-embed');

		const cache = this.plugin.gpxFileCache;
		const cached = cache.get(this.file.path, this.file.stat.mtime);

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
			cache.set(this.file.path, this.file.stat.mtime, { data, stats });
		}

		const { tileUrl, tileAttribution, units, showElevationChart } =
			this.plugin.settings;

		const mapEl = this.containerEl.createDiv();
		this.mapRenderer = new MapRenderer({
			container: mapEl,
			data,
			compact: true,
			tileUrl,
			attribution: tileAttribution,
		});

		this.containerEl.createDiv({
			cls: 'gpx-viewer-embed-stats',
			text: `${formatDistance(stats.distanceKm, units)} · ${formatElevation(stats.elevationGainM, units)} ↑ · ${formatElevation(stats.elevationLossM, units)} ↓`,
		});

		if (showElevationChart) {
			const chartEl = this.containerEl.createDiv({
				cls: 'gpx-viewer-elevation-chart-compact',
			});
			this.elevationChart = new ElevationChart({
				container: chartEl,
				points: data.points,
				units,
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
	plugin: GpxViewerPlugin,
): MarkdownPostProcessor {
	const { app } = plugin;

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

			ctx.addChild(new GpxEmbedRenderChild(wrapper, app, file, plugin));
		});
	};
}
