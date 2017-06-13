const POSTER_STYLES = [
  {
    id: 'sharp',
    upperCaseLabels: true,
    labels: ['header'],
    name: 'Sharp',
  },
  {
    id: 'classic',
    allowedMapStyles: ['bw', 'gray'],
    upperCaseLabels: true,
    labels: ['header', 'smallHeader', 'text'],
    addLines: true,
    // Remember: order matters. First match is used
    labelRules: [
      {
        label: 'header',
        minLength: 19,
        svgAttributes: {
          'font-size': 160,
          'letter-spacing': 20,
        },
      },
      {
        label: 'header',
        minLength: 15,
        svgAttributes: {
          'font-size': 180,
          'letter-spacing': 30,
        },
      },
      {
        label: 'header',
        minLength: 11,
        svgAttributes: {
          'font-size': 200,
          'letter-spacing': 40,
        },
      },
      {
        label: 'header',
        minLength: 0,
        svgAttributes: {
          'font-size': 240,
          'letter-spacing': 50,
        },
      }
    ],
    name: 'Classic',
  },
  {
    id: 'classicsans',
    allowedMapStyles: ['bw', 'gray'],
    upperCaseLabels: true,
    labels: ['header', 'smallHeader', 'text'],
    addLines: true,
    // Remember: order matters. First match is used
    labelRules: [
      {
        label: 'header',
        minLength: 19,
        svgAttributes: {
          'font-size': 160,
          'letter-spacing': 20,
        },
      },
      {
        label: 'header',
        minLength: 15,
        svgAttributes: {
          'font-size': 180,
          'letter-spacing': 30,
        },
      },
      {
        label: 'header',
        minLength: 11,
        svgAttributes: {
          'font-size': 200,
          'letter-spacing': 40,
        },
      },
      {
        label: 'header',
        minLength: 0,
        svgAttributes: {
          'font-size': 240,
          'letter-spacing': 50,
        },
      }
    ],
    name: 'Sans',
  },
  {
    id: 'bw',
    allowedMapStyles: ['bw', 'gray', 'black'],
    upperCaseLabels: true,
    labels: ['header', 'smallHeader', 'text'],
    name: 'Modern',
  },
  {
    id: 'pacific',
    upperCaseLabels: false,
    labels: ['header'],
    name: 'Pacific',
  },
  {
    id: 'summer',
    upperCaseLabels: true,
    labels: ['header'],
    name: 'Summer',
  },
  {
    id: 'round',
    upperCaseLabels: true,
    labels: ['header'],
    name: 'Round',
  },
];

const MAP_STYLES = [
  {
    id: 'bw',
    color: '#fff',
    labelColor: '#000',
    type: 'raster',
    name: 'White',
  },
  {
    id: 'gray',
    color: '#ddd',
    labelColor: '#000',
    type: 'raster',
    name: 'Gray',
  },
  {
    id: 'black',
    color: '#000',
    labelColor: '#000',
    type: 'raster',
    name: 'Black',
  },
  {
    id: 'petrol',
    color: '#4b7b8f',
    labelColor: '#4b7b8f',
    type: 'raster',
    name: 'Petrol',
  },
  {
    id: 'iceberg',
    color: '#94D5E0',
    labelColor: '#94D5E0',
    type: 'raster',
    name: 'Iceberg',
  },
  {
    id: 'marshmellow',
    color: '#FFB8D4',
    labelColor: '#FFB8D4',
    type: 'raster',
    name: 'Marshmellow',
  },
  {
    id: 'copper',
    color: '#DE8E65',
    labelColor: '#DE8E65',
    type: 'raster',
    name: 'Copper',
  },
  {
    id: 'madang',
    color: '#BDECB6',
    labelColor: '#BDECB6',
    type: 'raster',
    name: 'Madang',
  }
];

module.exports = {
  POSTER_STYLES,
  MAP_STYLES,
};
