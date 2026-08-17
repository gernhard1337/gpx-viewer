export type Units = 'metric' | 'imperial';

const KM_TO_MI = 0.621371;
const M_TO_FT = 3.28084;

export function convertDistanceKm(km: number, units: Units): number {
	return units === 'imperial' ? km * KM_TO_MI : km;
}

export function convertElevationM(m: number, units: Units): number {
	return units === 'imperial' ? m * M_TO_FT : m;
}

export function distanceUnitLabel(units: Units): string {
	return units === 'imperial' ? 'mi' : 'km';
}

export function elevationUnitLabel(units: Units): string {
	return units === 'imperial' ? 'ft' : 'm';
}

export function formatDistance(km: number, units: Units): string {
	return `${convertDistanceKm(km, units).toFixed(2)} ${distanceUnitLabel(units)}`;
}

export function formatElevation(m: number, units: Units): string {
	return `${Math.round(convertElevationM(m, units))} ${elevationUnitLabel(units)}`;
}
