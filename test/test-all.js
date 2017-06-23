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
  it('has 8 poster styles', () => {
    assert.strictEqual(common.MAP_STYLES.length, 8);
  });

  it('getMapStyle()', () => {
    const style = common.getMapStyle('madang');
    assert.deepStrictEqual(style, {
      id: 'madang',
      color: '#a7e19e',
      labelColor: '#a7e19e',
      type: 'raster',
      name: 'Madang',
    });
  });
});
