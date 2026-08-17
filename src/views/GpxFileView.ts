import { FileView, TFile, WorkspaceLeaf } from 'obsidian';
import type GpxViewerPlugin from '../main';
import { parseGpx } from '../gpx/parser';
import { calculateStats, GpxStats } from '../gpx/stats';
import { GpxData } from '../gpx/models';
import { formatDistance, formatElevation } from '../gpx/units';
import { MapRenderer } from './MapRenderer';
import { getSourceLink } from '../external/sourceLink';
import { ElevationChart } from './ElevationChart';

export const VIEW_TYPE_GPX = 'gpx-file-view';

export class GpxFileView extends FileView {
	private mapRenderer: MapRenderer | null = null;
	private elevationChart: ElevationChart | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: GpxViewerPlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_GPX;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'GPX';
	}

	getIcon(): string {
		return 'map';
	}

	async onLoadFile(file: TFile): Promise<void> {
		await this.render(file);
	}

	async onUnloadFile(file: TFile): Promise<void> {
		this.cleanup();
		await super.onUnloadFile(file);
	}

	onunload(): void {
		this.cleanup();
	}

	private cleanup(): void {
		this.mapRenderer?.destroy();
		this.mapRenderer = null;
		this.elevationChart?.destroy();
		this.elevationChart = null;
	}

	private async render(file: TFile): Promise<void> {
		this.cleanup();
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('gpx-viewer-file-view');

		const cache = this.plugin.gpxFileCache;
		const cached = cache.get(file.path, file.stat.mtime);

		let data: GpxData;
		let stats: GpxStats;
		if (cached) {
			({ data, stats } = cached);
		} else {
			let content: string;
			try {
				content = await this.app.vault.read(file);
			} catch (error) {
				this.renderError(
					contentEl,
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
					contentEl,
					error instanceof Error ? error.message : 'Ungültige GPX-Datei.',
				);
				return;
			}

			stats = calculateStats(data.points);
			cache.set(file.path, file.stat.mtime, { data, stats });
		}

		const { tileUrl, tileAttribution, units, showElevationChart } =
			this.plugin.settings;

		const mapEl = contentEl.createDiv();
		this.mapRenderer = new MapRenderer({
			container: mapEl,
			data,
			compact: false,
			tileUrl,
			attribution: tileAttribution,
		});

		this.renderStats(contentEl, stats);
		this.renderSourceLink(contentEl, data);

		if (showElevationChart) {
			const chartEl = contentEl.createDiv();
			this.elevationChart = new ElevationChart({
				container: chartEl,
				points: data.points,
				units,
			});
		}
	}

	private renderStats(container: HTMLElement, stats: GpxStats): void {
		const { units } = this.plugin.settings;
		const statsEl = container.createDiv({ cls: 'gpx-viewer-stats' });
		statsEl.createSpan({
			text: `Distanz: ${formatDistance(stats.distanceKm, units)}`,
		});
		statsEl.createSpan({
			text: `Anstieg: ${formatElevation(stats.elevationGainM, units)}`,
		});
		statsEl.createSpan({
			text: `Abstieg: ${formatElevation(stats.elevationLossM, units)}`,
		});
	}

	private renderSourceLink(container: HTMLElement, data: GpxData): void {
		const sourceLink = getSourceLink(data);
		if (!sourceLink) return;

		container.createEl('a', {
			cls: 'gpx-viewer-source-link',
			text: 'Auf Originaldienst öffnen',
			href: sourceLink,
			attr: { target: '_blank', rel: 'noopener' },
		});
	}

	private renderError(container: HTMLElement, message: string): void {
		container.createDiv({ cls: 'gpx-viewer-error', text: message });
	}
}
