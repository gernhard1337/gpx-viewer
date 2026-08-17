import { GpxData } from '../gpx/models';

export function getSourceLink(data: GpxData): string | undefined {
	return data.sourceLink;
}
