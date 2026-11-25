export const AQI_SCALE = [
  { key: 'good', label: 'Good', range: '0–50', min: 0, max: 50, color: '#22A06B' },
  { key: 'satisfactory', label: 'Satisfactory', range: '51–100', min: 51, max: 100, color: '#7CB342' },
  { key: 'moderate', label: 'Moderate', range: '101–200', min: 101, max: 200, color: '#F2C14E' },
  { key: 'poor', label: 'Poor', range: '201–300', min: 201, max: 300, color: '#F08A3C' },
  { key: 'very-poor', label: 'Very Poor', range: '301–400', min: 301, max: 400, color: '#E05252' },
  { key: 'severe', label: 'Severe', range: '401–500', min: 401, max: 500, color: '#8E2A2A' },
];

export function categoryFor(value) {
  if (!Number.isFinite(Number(value))) return null;
  return AQI_SCALE.find((category) => Number(value) >= category.min && Number(value) <= category.max) || AQI_SCALE[5];
}

export const POLLUTANT_ORDER = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'];

export function pollutantTone(concentration, standard) {
  if (!Number.isFinite(Number(concentration)) || !Number.isFinite(Number(standard)) || standard <= 0) {
    return 'good';
  }
  const ratio = Number(concentration) / Number(standard);
  if (ratio > 1.5) return 'danger';
  if (ratio > 1) return 'warn';
  return 'good';
}
