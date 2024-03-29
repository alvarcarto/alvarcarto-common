const _ = require('lodash');
const styles = require('./styles');
const enums = require('./enums');

const TRANSLATE_REGEX = /\.*translate\((.*)\)/i;
const TRANSLATE_X_REGEX = /\.*translateX\((.*)\)/i;
const TRANSLATE_Y_REGEX = /\.*translateY\((.*)\)/i;
const INCH_IN_CM = 2.54;

function getMaterial(id) {
  const found = _.find(styles.POSTER_MATERIALS, { id });
  if (!found) {
    throw new Error(`No such poster material: ${id}`);
  }
  return found;
}

function getMaterials() {
  return styles.POSTER_MATERIALS;
}

function getMapStyles() {
  return styles.MAP_STYLES;
}

function getPosterSizes(materialId) {
  const material = getMaterial(materialId);
  return _.filter(enums.POSTER_SIZES, size => _.includes(material.allowedPosterSizes, size.id));
}

function getPosterStyles(materialId) {
  const material = getMaterial(materialId);
  const filtered = _.filter(
    styles.POSTER_STYLES,
    style => _.includes(material.allowedPosterStyles, style.id)
  );
  return _.map(filtered, (s) => {
    if (materialId === 'plywood') {
      return _.extend({}, s, { allowedMapStyles: s.allowedPlywoodMapStyles });
    }

    return s;
  });
}

function getPosterSize(id) {
  const found = _.find(enums.POSTER_SIZES, { id });
  if (!found) {
    throw new Error(`No such poster size: ${id}`);
  }
  return found;
}

function getPosterSizeType(id) {
  const found = _.find(enums.POSTER_SIZE_TYPES, { id });
  if (!found) {
    throw new Error(`No such poster size type: ${id}`);
  }
  return found;
}

function getMapStyle(id) {
  const found = _.find(styles.MAP_STYLES, { id });
  if (!found) {
    const style = _.find(styles.MAP_STYLES, { id: 'default' });
    return _.merge({}, style, { id });
  }

  return found;
}

function getPosterStyle(id, materialId) {
  const found = _.find(getPosterStyles(materialId), { id });
  if (!found) {
    throw new Error(`No such poster style: ${id}`);
  }
  return found;
}

function resolveOrientation(dimensions, orientation) {
  if (orientation === 'landscape') {
    return _.merge({}, dimensions, {
      width: dimensions.height,
      height: dimensions.width,
    });
  }

  return dimensions;
}

function getPosterPhysicalDimensionsInCm(sizeId, orientation) {
  const size = getPosterSize(sizeId);
  const width = size.physicalDimensions.width;
  const height = size.physicalDimensions.height;

  if (size.type === 'cm') {
    return resolveOrientation({
      width,
      height,
    }, orientation);
  }

  return resolveOrientation({
    width: width * INCH_IN_CM,
    height: height * INCH_IN_CM,
  }, orientation);
}

function getPosterPhysicalDimensions(sizeId, orientation) {
  const dimensions = getPosterSize(sizeId).physicalDimensions;
  return resolveOrientation(dimensions, orientation);
}

function findClosestSizeForOtherSizeType(currentSizeId, newSizeType) {
  const currentSize = getPosterSize(currentSizeId);
  if (currentSize.type === newSizeType) {
    return currentSize;
  }

  // The default dimensions are in portrait mode
  const currentDimensions = getPosterPhysicalDimensionsInCm(currentSizeId, 'portrait');
  const relevantPosterSizes = _.filter(enums.POSTER_SIZES, size => size.type === newSizeType);
  const closest = _.minBy(relevantPosterSizes, (size) => {
    const comparisonDimensions = getPosterPhysicalDimensionsInCm(size.id, 'portrait');
    const widthDiff = Math.abs(comparisonDimensions.width - currentDimensions.width);
    const heightDiff = Math.abs(comparisonDimensions.height - currentDimensions.height);
    return widthDiff + heightDiff;
  });

  return closest;
}

function cssTransformStringToTranslates(transformStr) {
  const obj = {
    translateX: 0,
    translateY: 0,
  };

  const translateExec = TRANSLATE_REGEX.exec(transformStr);
  if (translateExec && _.isString(translateExec[1])) {
    const translate = translateExec[1];
    // Might be e.g. translate(10, 20) or translate(10 20) (IE)
    // parseFloat stops parsing to a comma, so splitting with
    // space should be enough
    const parts = translate.split(' ');

    if (_.isArray(parts) && _.isString(parts[0])) {
      obj.translateX = parseFloat(parts[0]);
    }

    if (_.isArray(parts) && _.isString(parts[1])) {
      obj.translateY = parseFloat(parts[1]);
    }
  }

  const translateXExec = TRANSLATE_X_REGEX.exec(transformStr);
  if (translateXExec && _.isString(translateXExec[1])) {
    obj.translateX = parseFloat(translateXExec[1]);
  }

  const translateYExec = TRANSLATE_Y_REGEX.exec(transformStr);
  if (translateYExec && _.isString(translateYExec[1])) {
    obj.translateY = parseFloat(translateYExec[1]);
  }

  return _.pickBy(obj, _.isFinite);
}

// Returns the sum of transforms applied in `svgElem`'s whole parent tree
//
// Let's go through what happens when one does getFinalBBox(rect) for the
// SVG example document:
//
//  g (id: #a)
//  |
//   - g (id: #b)
//     |
//     - rect
//
// 1. Get transforms for rect
// 2. Get transforms for #b
// 3. Get transforms for #a
// 4. Sum the values together
function getSvgElementPosition(svgElem) {
  const traversal = [];
  let current = svgElem;
  while (current && current.tagName !== 'svg') {
    const pos = {
      x: 0,
      y: 0,
      translateX: 0,
      translateY: 0,
    };

    if (current.getAttribute('x')) {
      pos.x = parseFloat(current.getAttribute('x'));
    }
    if (current.getAttribute('y')) {
      pos.y = parseFloat(current.getAttribute('y'));
    }

    const transformStr = current.getAttribute('transform');
    const transform = cssTransformStringToTranslates(transformStr);
    pos.translateX = transform.translateX;
    pos.translateY = transform.translateY;

    traversal.push(pos);
    current = current.parentNode;
  }

  return _.reduce(traversal, (memo, obj) => {
    const translateX = _.isFinite(obj.translateX) ? obj.translateX : 0;
    const translateY = _.isFinite(obj.translateY) ? obj.translateY : 0;

    return {
      x: memo.x + (obj.x + translateX),
      y: memo.y + (obj.y + translateY),
    };
  }, {
    x: 0,
    y: 0,
  });
}

function _getSvgMinSideLength(svg) {
  const svgWidth = parseInt(svg.getAttribute('width'), 10);
  const svgHeight = parseInt(svg.getAttribute('height'), 10);
  return Math.min(svgWidth, svgHeight);
}

function _getRightLinePath(svg, textInfo, opts) {
  const { position, bbox, fontSize } = textInfo;
  const sideWidth = _getSvgMinSideLength(svg);
  const x = position.x + (bbox.width / 2) + (opts.paddingBetweenLineAndText * sideWidth);
  const y = position.y - (fontSize / 2) + ((1.0 - opts.fontCapHeightRatio) * fontSize);
  return `M${x},${y} L${x + (opts.lineLength * sideWidth)},${y}`;
}

function _getLeftLinePath(svg, textInfo, opts) {
  const { position, bbox, fontSize } = textInfo;
  const sideWidth = _getSvgMinSideLength(svg);
  const x = position.x - (bbox.width / 2) - (opts.paddingBetweenLineAndText * sideWidth);
  const y = position.y - (fontSize / 2) + ((1.0 - opts.fontCapHeightRatio) * fontSize);
  return `M${x},${y} L${x - (opts.lineLength * sideWidth)},${y}`;
}

function _getFirstTspan(textNode) {
  const tspanList = textNode.getElementsByTagName('tspan');
  if (tspanList.length < 1) {
    throw new Error(`Unexpected amount of tspan elements found: ${tspanList.length}`);
  }

  return tspanList.item(0);
}

function updateLines(svg, textEl, leftEl, rightEl, opts = {}) {
  const textInfo = {
    fontSize: parseFloat(textEl.getAttribute('font-size')),
    position: getSvgElementPosition(_getFirstTspan(textEl)),
    bbox: opts.getBBoxForSvgElement(textEl),
  };

  leftEl.setAttribute('d', _getLeftLinePath(svg, textInfo, opts));
  rightEl.setAttribute('d', _getRightLinePath(svg, textInfo, opts));

  _.forEach(opts.svgAttributes, (val, key) => {
    leftEl.setAttribute(key, val);
    rightEl.setAttribute(key, val);
  });
}

function removeLines(leftEl, rightEl) {
  leftEl.parentNode.removeChild(leftEl);
  rightEl.parentNode.removeChild(rightEl);
}

function addOrUpdateLines(doc, svg, textEl, _opts = {}) {
  const opts = _.merge({
    // This ratio defines what is the font cap height's ratio to the font size
    // (font size is assumed to equal the bounding box height of the text)
    // Exact value could be calculated also: https://github.com/sebdesign/cap-height
    // This value is of course different between fonts
    // I don't know if it even can be approximated with a ratio from font size
    // but this sounds better than a fixed value. Compared to fixed value, ratio
    // *could* work when resizing the font
    fontCapHeightRatio: 0.8,
    // These values are relative values to SVG canvas width
    paddingBetweenLineAndText: 150 / 3543,
    lineLength: 280 / 3543,
    leftLineId: 'small-header-left-line',
    rightLineId: 'small-header-right-line',
    svgAttributes: {
      stroke: '#000000',
      'stroke-width': '6px',
      'stroke-linecap': 'square',
    },
  }, _opts);

  let leftLineEl = doc.getElementById(opts.leftLineId);
  if (!leftLineEl) {
    leftLineEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(leftLineEl);
  }
  leftLineEl.setAttribute('id', opts.leftLineId);

  let rightLineEl = doc.getElementById(opts.rightLineId);
  if (!rightLineEl) {
    rightLineEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(rightLineEl);
  }
  rightLineEl.setAttribute('id', opts.rightLineId);

  const text = _getFirstTspan(textEl).textContent;
  if (!text || text === ' ') {
    return removeLines(leftLineEl, rightLineEl);
  }

  updateLines(svg, textEl, leftLineEl, rightLineEl, opts);
  if (opts.debugLines) {
    const bbox = opts.getBBoxForSvgElement(textEl);
    const pos = getSvgElementPosition(_getFirstTspan(textEl));
    const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', pos.x - (bbox.width / 2));
    rect.setAttribute('y', pos.y - bbox.height);
    rect.setAttribute('width', bbox.width);
    rect.setAttribute('height', bbox.height);
    rect.setAttribute('stroke', 'red');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('fill', 'none');
    svg.appendChild(rect);
  }
}

const HEADER_MAPPING = {
  header: 'labelHeader',
  smallHeader: 'labelSmallHeader',
  text: 'labelText',
};

function changeDynamicAttributes(el, mapItem) {
  const posterLook = getPosterStyle(mapItem.posterStyle, mapItem.material);

  const labelRule = _.find(posterLook.labelRules, (rule) => {
    const mapItemAttr = HEADER_MAPPING[rule.label];
    const str = mapItem[mapItemAttr];
    return str.length >= rule.minLength;
  });

  if (labelRule) {
    const ruleTargetEl = el.getElementById(labelRule.label);
    if (ruleTargetEl.getAttribute('originals-saved') !== 'true') {
      _.forEach(labelRule.svgAttributes, (val, key) => {
        const newVal = ruleTargetEl.getAttribute(key);
        ruleTargetEl.setAttribute(`original-${key}`, newVal);
      });

      ruleTargetEl.setAttribute('originals-saved', 'true');
    }

    _.forEach(labelRule.svgAttributes, (val, key) => {
      if (_.isPlainObject(val) && val.type === 'factor') {
        const originalVal = parseFloat(ruleTargetEl.getAttribute(`original-${key}`));
        const newVal = val.value * originalVal;
        ruleTargetEl.setAttribute(key, newVal);
      } else {
        ruleTargetEl.setAttribute(key, val);
      }
    });
  }
}

function posterSizeToMiddleLineStrokeWidth(size) {
  switch (size) {
    case '30x40cm':
      return 6;
    case '50x70cm':
      return 9;
    case '70x100cm':
      return 12;
    case '12x18inch':
      return 6;
    case '18x24inch':
      return 9;
    case '24x36inch':
      return 12;
    default:
      return 6;
  }
}

function createProductId(posterInfo) {
  const mapStyle = getMapStyle(posterInfo.mapStyle);

  // 0/SHARP/FFFFFF/50X70C/0/60.169/24.935
  return [
    0,  // ID version 0
    posterInfo.posterStyle.toUpperCase(),
    _.trimStart(mapStyle.color, '#').toUpperCase(),
    posterInfo.orientation[0].toUpperCase(),
    posterInfo.size.toUpperCase(),
    0, // Paper weight, 0 -> Printmotor's default
    posterInfo.cityId,
  ].join('/');
}

module.exports = {
  addOrUpdateLines,
  cssTransformStringToTranslates,
  posterSizeToMiddleLineStrokeWidth,
  changeDynamicAttributes,
  getMapStyle,
  getMapStyles,
  getMaterial,
  getMaterials,
  getPosterStyle,
  getPosterStyles,
  getPosterSizeType,
  getPosterSize,
  getPosterSizes,
  resolveOrientation,
  getPosterPhysicalDimensions,
  getPosterPhysicalDimensionsInCm,
  findClosestSizeForOtherSizeType,
  createProductId,
  MAP_STYLES: styles.MAP_STYLES,
  POSTER_MATERIALS: styles.POSTER_MATERIALS,
  POSTER_STYLES: styles.POSTER_STYLES,
  POSTER_SIZES: enums.POSTER_SIZES,
  POSTER_SIZE_TYPES: enums.POSTER_SIZE_TYPES,
  POSTER_ORIENTATIONS: enums.POSTER_ORIENTATIONS,
};
