import { App, PluginSettingTab, Setting } from 'obsidian';
import type GpxViewerPlugin from './main';
import { Units } from './gpx/units';
import { DEFAULT_TILE_URL, DEFAULT_ATTRIBUTION } from './views/mapDefaults';

export interface GpxViewerSettings {
	tileUrl: string;
	tileAttribution: string;
	units: Units;
	showElevationChart: boolean;
}

export const DEFAULT_SETTINGS: GpxViewerSettings = {
	tileUrl: DEFAULT_TILE_URL,
	tileAttribution: DEFAULT_ATTRIBUTION,
	units: 'metric',
	showElevationChart: true,
};

export class GpxViewerSettingTab extends PluginSettingTab {
	plugin: GpxViewerPlugin;

	constructor(app: App, plugin: GpxViewerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Tile-URL-Vorlage')
			.setDesc(
				'URL-Vorlage für die Kartenkacheln, z. B. https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_TILE_URL)
					.setValue(this.plugin.settings.tileUrl)
					.onChange(async (value) => {
						this.plugin.settings.tileUrl = value || DEFAULT_TILE_URL;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Kartenattribution')
			.setDesc('Attributionstext für die Kartenkacheln.')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_ATTRIBUTION)
					.setValue(this.plugin.settings.tileAttribution)
					.onChange(async (value) => {
						this.plugin.settings.tileAttribution =
							value || DEFAULT_ATTRIBUTION;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Einheiten')
			.setDesc('Maßeinheiten für Distanz und Höhe.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('metric', 'Metrisch (km, m)')
					.addOption('imperial', 'Imperial (mi, ft)')
					.setValue(this.plugin.settings.units)
					.onChange(async (value) => {
						this.plugin.settings.units = value as Units;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Höhenprofil anzeigen')
			.setDesc(
				'Zeigt ein Höhenprofil-Diagramm in der Vollansicht und in Embeds.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showElevationChart)
					.onChange(async (value) => {
						this.plugin.settings.showElevationChart = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
