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
    const style = common.getPosterStyle('sharp', 'paper');
    assert.deepStrictEqual(style, {
      id: 'sharp',
      upperCaseLabels: true,
      allowedMapStyles: ['bw', 'gray', 'black', 'petrol', 'pure-white'],
      allowedPlywoodMapStyles: ['bw', 'gray', 'black-plywood-transparent'],
      labels: ['header'],
      name: 'Sharp',
    });
  });

  it('getPosterStyle()', () => {
    const style = common.getPosterStyle('sharp', 'plywood');
    assert.deepStrictEqual(style, {
      id: 'sharp',
      upperCaseLabels: true,
      allowedMapStyles: ['bw', 'gray', 'black-plywood-transparent'],
      allowedPlywoodMapStyles: ['bw', 'gray', 'black-plywood-transparent'],
      labels: ['header'],
      name: 'Sharp',
    });
  });
});

describe('MAP_STYLES', () => {
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

  it('getMapStyle() should return default', () => {
    const style = common.getMapStyle('not-existing');
    assert.deepStrictEqual(style, {
      id: 'not-existing',
      color: '#000000',
      labelColor: '#000000',
      type: 'raster',
      name: 'Default black (for internal use)',
    });
  });
});

describe('POSTER_SIZES', () => {
  it('has 6 poster sizes', () => {
    assert.strictEqual(common.POSTER_SIZES.length, 6);
  });

  it('getPosterSize should return correct size', () => {
    const size = common.getPosterSize('12x18inch');
    assert.deepStrictEqual(size, {
      id: '12x18inch',
      type: 'inch',
      label: '12 x 18"',
      physicalDimensions: { width: 12, height: 18, unit: 'inch' },
    });
  });

  it('has 2 poster size types', () => {
    assert.strictEqual(common.POSTER_SIZE_TYPES.length, 2);
  });

  it('getPosterPhysicalDimensions should return correct', () => {
    const dimensions = common.getPosterPhysicalDimensions('30x40cm', 'portrait');
    assert.deepStrictEqual(dimensions, {
      width: 30,
      height: 40,
      unit: 'cm',
    });

    const dimensions2 = common.getPosterPhysicalDimensions('30x40cm', 'landscape');
    assert.deepStrictEqual(dimensions2, {
      width: 40,
      height: 30,
      unit: 'cm',
    });

    const dimensions3 = common.getPosterPhysicalDimensions('24x36inch', 'landscape');
    assert.deepStrictEqual(dimensions3, {
      width: 36,
      height: 24,
      unit: 'inch',
    });
  });

  it('getPosterSizeType should return correct size type', () => {
    const size = common.getPosterSizeType('inch');
    assert.deepStrictEqual(size, {
      id: 'inch',
      label: 'US (inch)',
      description: 'Inch sizes',
    });
  });

  it('findClosestSizeForOtherSizeType should return correct size', () => {
    const newSize = common.findClosestSizeForOtherSizeType('30x40cm', 'inch');
    assert.deepStrictEqual(newSize, {
      id: '12x18inch',
      type: 'inch',
      label: '12 x 18"',
      physicalDimensions: { width: 12, height: 18, unit: 'inch' },
    });

    const newSize2 = common.findClosestSizeForOtherSizeType('50x70cm', 'inch');
    assert.deepStrictEqual(newSize2, {
      id: '18x24inch',
      type: 'inch',
      label: '18 x 24"',
      physicalDimensions: { width: 18, height: 24, unit: 'inch' },
    });

    const newSize3 = common.findClosestSizeForOtherSizeType('70x100cm', 'inch');
    assert.deepStrictEqual(newSize3, {
      id: '24x36inch',
      type: 'inch',
      label: '24 x 36"',
      physicalDimensions: { width: 24, height: 36, unit: 'inch' },
    });

    const newSize4 = common.findClosestSizeForOtherSizeType('12x18inch', 'cm');
    assert.deepStrictEqual(newSize4, {
      id: '30x40cm',
      type: 'cm',
      label: '30 x 40 cm',
      physicalDimensions: { width: 30, height: 40, unit: 'cm' },
    });

    const newSize5 = common.findClosestSizeForOtherSizeType('18x24inch', 'cm');
    assert.deepStrictEqual(newSize5, {
      id: '50x70cm',
      type: 'cm',
      label: '50 x 70 cm',
      physicalDimensions: { width: 50, height: 70, unit: 'cm' },
    });

    const newSize6 = common.findClosestSizeForOtherSizeType('24x36inch', 'cm');
    assert.deepStrictEqual(newSize6, {
      id: '70x100cm',
      type: 'cm',
      label: '70 x 100 cm',
      physicalDimensions: { width: 70, height: 100, unit: 'cm' },
    });
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

