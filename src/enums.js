const POSTER_SIZES = [
  {
    type: 'cm',
    id: '30x40cm',
    label: '30 x 40 cm',
  },
  {
    type: 'cm',
    id: '50x70cm',
    label: '50 x 70 cm',
  },
  {
    type: 'cm',
    id: '70x100cm',
    label: '70 x 100 cm',
  },
  {
    type: 'inch',
    id: '12x18inch',
    label: '12 x 18 inch',
  },
  {
    type: 'inch',
    id: '18x24inch',
    label: '18 x 24 inch',
  },
  {
    type: 'inch',
    id: '24x36inch',
    label: '24 x 36 inch',
  },
];

const POSTER_SIZE_TYPES = [
  { id: 'cm', label: 'EU', description: 'Metric sizes' },
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
