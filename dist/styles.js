'use strict';

var POSTER_STYLES = [{
  id: 'sharp',
  upperCaseLabels: true,
  labels: ['header'],
  name: 'Sharp'
}, {
  id: 'classic',
  allowedMapStyles: ['bw', 'gray'],
  upperCaseLabels: true,
  labels: ['header', 'smallHeader', 'text'],
  addLines: true,
  // Remember: order matters. First match is used
  labelRules: [{
    label: 'header',
    minLength: 19,
    svgAttributes: {
      'font-size': { type: 'factor', value: 0.65 },
      'letter-spacing': { type: 'factor', value: 0.4 }
    }
  }, {
    label: 'header',
    minLength: 15,
    svgAttributes: {
      'font-size': { type: 'factor', value: 0.75 },
      'letter-spacing': { type: 'factor', value: 0.6 }
    }
  }, {
    label: 'header',
    minLength: 11,
    svgAttributes: {
      'font-size': { type: 'factor', value: 0.85 },
      'letter-spacing': { type: 'factor', value: 0.8 }
    }
  }, {
    label: 'header',
    minLength: 0,
    svgAttributes: {
      'font-size': { type: 'factor', value: 1.0 },
      'letter-spacing': { type: 'factor', value: 1.0 }
    }
  }],
  name: 'Classic'
}, {
  id: 'sans',
  allowedMapStyles: ['bw', 'gray'],
  upperCaseLabels: true,
  labels: ['header', 'smallHeader', 'text'],
  addLines: true,
  // Remember: order matters. First match is used
  labelRules: [{
    label: 'header',
    minLength: 19,
    svgAttributes: {
      'font-size': { type: 'factor', value: 0.65 },
      'letter-spacing': { type: 'factor', value: 0.4 }
    }
  }, {
    label: 'header',
    minLength: 15,
    svgAttributes: {
      'font-size': { type: 'factor', value: 0.75 },
      'letter-spacing': { type: 'factor', value: 0.6 }
    }
  }, {
    label: 'header',
    minLength: 11,
    svgAttributes: {
      'font-size': { type: 'factor', value: 0.85 },
      'letter-spacing': { type: 'factor', value: 0.8 }
    }
  }, {
    label: 'header',
    minLength: 0,
    svgAttributes: {
      'font-size': { type: 'factor', value: 1.0 },
      'letter-spacing': { type: 'factor', value: 1.0 }
    }
  }],
  name: 'Sans'
}, {
  id: 'bw',
  allowedMapStyles: ['bw', 'gray', 'black', 'sunset'],
  upperCaseLabels: true,
  labels: ['header', 'smallHeader', 'text'],
  name: 'Modern'
}, {
  id: 'pacific',
  upperCaseLabels: false,
  labels: ['header'],
  name: 'Pacific'
}, {
  id: 'summer',
  upperCaseLabels: true,
  labels: ['header'],
  name: 'Summer'
}, {
  id: 'round',
  upperCaseLabels: true,
  labels: ['header'],
  name: 'Round'
}];

var MAP_STYLES = [{
  id: 'bw',
  color: '#FFFFFF',
  labelColor: '#000000',
  type: 'raster',
  name: 'White'
}, {
  id: 'gray',
  color: '#DDDDDD',
  labelColor: '#000000',
  type: 'raster',
  name: 'Gray'
}, {
  id: 'black',
  color: '#000000',
  labelColor: '#000000',
  type: 'raster',
  name: 'Black'
}, {
  id: 'contrast-black',
  color: '#000000',
  labelColor: '#000000',
  type: 'raster',
  name: 'Contrast Black'
}, {
  id: 'copper',
  color: '#DE8E65',
  labelColor: '#DE8E65',
  type: 'raster',
  name: 'Copper'
}, {
  id: 'petrol',
  color: '#4B7B8F',
  labelColor: '#4B7B8F',
  type: 'raster',
  name: 'Petrol'
}, {
  id: 'iceberg',
  color: '#94D5E0',
  labelColor: '#94D5E0',
  type: 'raster',
  name: 'Iceberg'
}, {
  id: 'marshmellow',
  color: '#FFB8D4',
  labelColor: '#FFB8D4',
  type: 'raster',
  name: 'Marshmellow'
}, {
  id: 'madang',
  color: '#A7E19E',
  labelColor: '#A7E19E',
  type: 'raster',
  name: 'Madang'
}];

module.exports = {
  POSTER_STYLES: POSTER_STYLES,
  MAP_STYLES: MAP_STYLES
};