import { Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	GpxViewerSettings,
	GpxViewerSettingTab,
} from './settings';
import { GpxFileView, VIEW_TYPE_GPX } from './views/GpxFileView';
import { GpxFileCache } from './cache/gpxFileCache';
import { createGpxEmbedProcessor } from './embed/gpxEmbedProcessor';

export default class GpxViewerPlugin extends Plugin {
	settings!: GpxViewerSettings;
	gpxFileCache = new GpxFileCache();

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_GPX, (leaf) => new GpxFileView(leaf, this));
		this.registerExtensions(['gpx'], VIEW_TYPE_GPX);

		this.registerMarkdownPostProcessor(createGpxEmbedProcessor(this));

		this.addSettingTab(new GpxViewerSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<GpxViewerSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
