import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from './settings';
import { GpxFileView, VIEW_TYPE_GPX } from './views/GpxFileView';
import { GpxFileCache } from './cache/gpxFileCache';
import { createGpxEmbedProcessor } from './embed/gpxEmbedProcessor';

export default class GpxViewerPlugin extends Plugin {
	settings!: MyPluginSettings;
	gpxFileCache = new GpxFileCache();

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_GPX,
			(leaf) => new GpxFileView(leaf, this.gpxFileCache),
		);
		this.registerExtensions(['gpx'], VIEW_TYPE_GPX);

		this.registerMarkdownPostProcessor(
			createGpxEmbedProcessor(this.app, this.gpxFileCache),
		);

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
