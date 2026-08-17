import { GpxData } from '../gpx/models';
import { GpxStats } from '../gpx/stats';

export interface CachedGpxFile {
	data: GpxData;
	stats: GpxStats;
}

function cacheKey(path: string, mtime: number): string {
	return `${path}::${mtime}`;
}

export class GpxFileCache {
	private cache = new Map<string, CachedGpxFile>();

	get(path: string, mtime: number): CachedGpxFile | undefined {
		return this.cache.get(cacheKey(path, mtime));
	}

	set(path: string, mtime: number, value: CachedGpxFile): void {
		this.cache.set(cacheKey(path, mtime), value);
	}
}
