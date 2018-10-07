const assert = require('assert');
const common = require('../src/index');

describe('cssTransformStringToTranslates', () => {
  it('scale(1.2) translate(10.21, 100)', () => {
    const str = 'scale(1.2) translate(10.21, 100)';
    const parts = common.cssTransformStringToTranslates(str);

    assert.deepStrictEqual(parts, {
      translateX: 10.21,
      translateY: 100,
    });
  });

  // Order doesn't matter in this implementation, translateX or Y are always
  // preferred
  it('scale(1.2) translateX(-100) translate(10.21, 100)', () => {
    const str = 'scale(1.2) translateX(-100) translate(10.21, 100)';
    const parts = common.cssTransformStringToTranslates(str);

    assert.deepStrictEqual(parts, {
      translateX: -100,
      translateY: 100,
    });
  });

  it('scale(1.2) translateX(-100) translateY(89) translate(10.21, 100)', () => {
    const str = 'scale(1.2) translateX(-100) translateY(89) translate(10.21, 100)';
    const parts = common.cssTransformStringToTranslates(str);

    assert.deepStrictEqual(parts, {
      translateX: -100,
      translateY: 89,
    });
  });

  it('scale(1.2) translateX(invalid) translateY(89)', () => {
    const str = 'scale(1.2) translateX(invalid) translateY(89)';
    const parts = common.cssTransformStringToTranslates(str);

    assert.deepStrictEqual(parts, {
      translateY: 89,
    });
  });
});

describe('POSTER_STYLES', () => {
  it('has 7 poster styles', () => {
    assert.strictEqual(common.POSTER_STYLES.length, 7);
  });

  it('getPosterStyle()', () => {
    const style = common.getPosterStyle('sharp');
    assert.deepStrictEqual(style, {
      id: 'sharp',
      upperCaseLabels: true,
      labels: ['header'],
      name: 'Sharp',
    });
  });
});

describe('MAP_STYLES', () => {
  it('has 9 map styles', () => {
    assert.strictEqual(common.MAP_STYLES.length, 9);
  });

  it('getMapStyle()', () => {
    const style = common.getMapStyle('madang');
    assert.deepStrictEqual(style, {
      id: 'madang',
      color: '#A7E19E',
      labelColor: '#A7E19E',
      type: 'raster',
      name: 'Madang',
    });
  });
});

describe('POSTER_SIZES', () => {
  it('has 6 poster sizes', () => {
    assert.strictEqual(common.POSTER_SIZES.length, 6);
  });
});

describe('POSTER_ORIENTATIONS', () => {
  it('has 2 poster orientations', () => {
    assert.strictEqual(common.POSTER_ORIENTATIONS.length, 2);
  });
});

describe('createProductId', () => {
  it('basic', () => {
    const id = common.createProductId({
      posterStyle: 'sharp',
      mapStyle: 'copper',
      orientation: 'portrait',
      size: '30x40cm',
      cityId: '28.801L-81.273',
    });

    assert.strictEqual(id, '0/SHARP/DE8E65/P/30X40CM/0/28.801L-81.273');
  });
});

