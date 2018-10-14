const POSTER_SIZES = [
  {
    type: 'cm',
    id: '30x40cm',
    label: '30 x 40 cm',
    physicalDimensions: { width: 30, height: 40, unit: 'cm' },
  },
  {
    type: 'cm',
    id: '50x70cm',
    label: '50 x 70 cm',
    physicalDimensions: { width: 50, height: 70, unit: 'cm' },
  },
  {
    type: 'cm',
    id: '70x100cm',
    label: '70 x 100 cm',
    physicalDimensions: { width: 70, height: 100, unit: 'cm' },
  },
  {
    type: 'inch',
    id: '12x18inch',
    label: '12 x 18"',
    physicalDimensions: { width: 12, height: 18, unit: 'inch' },
  },
  {
    type: 'inch',
    id: '18x24inch',
    label: '18 x 24"',
    physicalDimensions: { width: 18, height: 24, unit: 'inch' },
  },
  {
    type: 'inch',
    id: '24x36inch',
    label: '24 x 36"',
    physicalDimensions: { width: 24, height: 36, unit: 'inch' },
  },
];

const POSTER_SIZE_TYPES = [
  { id: 'cm', label: 'Europe', description: 'Metric sizes' },
  { id: 'inch', label: 'US', description: 'Inch sizes' },
];

const POSTER_ORIENTATIONS = [
  { id: 'portrait' },
  { id: 'landscape' },
];

module.exports = {
  POSTER_SIZES,
  POSTER_SIZE_TYPES,
  POSTER_ORIENTATIONS,
};
