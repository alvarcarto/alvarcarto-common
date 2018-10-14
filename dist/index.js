'use strict';

var _ = require('lodash');
var styles = require('./styles');
var enums = require('./enums');

var TRANSLATE_REGEX = /\.*translate\((.*)\)/i;
var TRANSLATE_X_REGEX = /\.*translateX\((.*)\)/i;
var TRANSLATE_Y_REGEX = /\.*translateY\((.*)\)/i;
var INCH_IN_CM = 2.54;

function getPosterSize(id) {
  var found = _.find(enums.POSTER_SIZES, { id: id });
  if (!found) {
    throw new Error('No such poster size: ' + id);
  }
  return found;
}

function getPosterSizeType(id) {
  var found = _.find(enums.POSTER_SIZE_TYPES, { id: id });
  if (!found) {
    throw new Error('No such poster size type: ' + id);
  }
  return found;
}

function getMapStyle(id) {
  var found = _.find(styles.MAP_STYLES, { id: id });
  if (!found) {
    throw new Error('No such map style: ' + id);
  }
  return found;
}

function getPosterStyle(id) {
  var found = _.find(styles.POSTER_STYLES, { id: id });
  if (!found) {
    throw new Error('No such poster style: ' + id);
  }
  return found;
}

function resolveOrientation(dimensions, orientation) {
  if (orientation === 'landscape') {
    return _.merge({}, dimensions, {
      width: dimensions.height,
      height: dimensions.width
    });
  }

  return dimensions;
}

function getPosterPhysicalDimensionsInCm(sizeId, orientation) {
  var size = getPosterSize(sizeId);
  var width = size.physicalDimensions.width;
  var height = size.physicalDimensions.height;

  if (size.type === 'cm') {
    return resolveOrientation({
      width: width,
      height: height
    }, orientation);
  }

  return resolveOrientation({
    width: width * INCH_IN_CM,
    height: height * INCH_IN_CM
  }, orientation);
}

function getPosterPhysicalDimensions(sizeId, orientation) {
  var dimensions = getPosterSize(sizeId).physicalDimensions;
  return resolveOrientation(dimensions, orientation);
}

function findClosestSizeForOtherSizeType(currentSizeId, newSizeType) {
  var currentSize = getPosterSize(currentSizeId);
  if (currentSize.type === newSizeType) {
    return currentSize;
  }

  // The default dimensions are in portrait mode
  var currentDimensions = getPosterPhysicalDimensionsInCm(currentSizeId, 'portrait');
  var relevantPosterSizes = _.filter(enums.POSTER_SIZES, function (size) {
    return size.type === newSizeType;
  });
  var closest = _.minBy(relevantPosterSizes, function (size) {
    var comparisonDimensions = getPosterPhysicalDimensionsInCm(size.id, 'portrait');
    var widthDiff = Math.abs(comparisonDimensions.width - currentDimensions.width);
    var heightDiff = Math.abs(comparisonDimensions.height - currentDimensions.height);
    return widthDiff + heightDiff;
  });

  return closest;
}

function cssTransformStringToTranslates(transformStr) {
  var obj = {
    translateX: 0,
    translateY: 0
  };

  var translateExec = TRANSLATE_REGEX.exec(transformStr);
  if (translateExec && _.isString(translateExec[1])) {
    var translate = translateExec[1];
    // Might be e.g. translate(10, 20) or translate(10 20) (IE)
    // parseFloat stops parsing to a comma, so splitting with
    // space should be enough
    var parts = translate.split(' ');

    if (_.isArray(parts) && _.isString(parts[0])) {
      obj.translateX = parseFloat(parts[0]);
    }

    if (_.isArray(parts) && _.isString(parts[1])) {
      obj.translateY = parseFloat(parts[1]);
    }
  }

  var translateXExec = TRANSLATE_X_REGEX.exec(transformStr);
  if (translateXExec && _.isString(translateXExec[1])) {
    obj.translateX = parseFloat(translateXExec[1]);
  }

  var translateYExec = TRANSLATE_Y_REGEX.exec(transformStr);
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
  var traversal = [];
  var current = svgElem;
  while (current && current.tagName !== 'svg') {
    var pos = {
      x: 0,
      y: 0,
      translateX: 0,
      translateY: 0
    };

    if (current.getAttribute('x')) {
      pos.x = parseFloat(current.getAttribute('x'));
    }
    if (current.getAttribute('y')) {
      pos.y = parseFloat(current.getAttribute('y'));
    }

    var transformStr = current.getAttribute('transform');
    var transform = cssTransformStringToTranslates(transformStr);
    pos.translateX = transform.translateX;
    pos.translateY = transform.translateY;

    traversal.push(pos);
    current = current.parentNode;
  }

  return _.reduce(traversal, function (memo, obj) {
    var translateX = _.isFinite(obj.translateX) ? obj.translateX : 0;
    var translateY = _.isFinite(obj.translateY) ? obj.translateY : 0;

    return {
      x: memo.x + (obj.x + translateX),
      y: memo.y + (obj.y + translateY)
    };
  }, {
    x: 0,
    y: 0
  });
}

function _getSvgMinSideLength(svg) {
  var svgWidth = parseInt(svg.getAttribute('width'), 10);
  var svgHeight = parseInt(svg.getAttribute('height'), 10);
  return Math.min(svgWidth, svgHeight);
}

function _getRightLinePath(svg, textInfo, opts) {
  var position = textInfo.position,
      bbox = textInfo.bbox,
      fontSize = textInfo.fontSize;

  var sideWidth = _getSvgMinSideLength(svg);
  var x = position.x + bbox.width / 2 + opts.paddingBetweenLineAndText * sideWidth;
  var y = position.y - fontSize / 2 + (1.0 - opts.fontCapHeightRatio) * fontSize;
  return 'M' + x + ',' + y + ' L' + (x + opts.lineLength * sideWidth) + ',' + y;
}

function _getLeftLinePath(svg, textInfo, opts) {
  var position = textInfo.position,
      bbox = textInfo.bbox,
      fontSize = textInfo.fontSize;

  var sideWidth = _getSvgMinSideLength(svg);
  var x = position.x - bbox.width / 2 - opts.paddingBetweenLineAndText * sideWidth;
  var y = position.y - fontSize / 2 + (1.0 - opts.fontCapHeightRatio) * fontSize;
  return 'M' + x + ',' + y + ' L' + (x - opts.lineLength * sideWidth) + ',' + y;
}

function _getFirstTspan(textNode) {
  var tspanList = textNode.getElementsByTagName('tspan');
  if (tspanList.length < 1) {
    throw new Error('Unexpected amount of tspan elements found: ' + tspanList.length);
  }

  return tspanList.item(0);
}

function updateLines(svg, textEl, leftEl, rightEl) {
  var opts = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  var textInfo = {
    fontSize: parseFloat(textEl.getAttribute('font-size')),
    position: getSvgElementPosition(_getFirstTspan(textEl)),
    bbox: opts.getBBoxForSvgElement(textEl)
  };

  leftEl.setAttribute('d', _getLeftLinePath(svg, textInfo, opts));
  rightEl.setAttribute('d', _getRightLinePath(svg, textInfo, opts));

  _.forEach(opts.svgAttributes, function (val, key) {
    leftEl.setAttribute(key, val);
    rightEl.setAttribute(key, val);
  });
}

function removeLines(leftEl, rightEl) {
  leftEl.parentNode.removeChild(leftEl);
  rightEl.parentNode.removeChild(rightEl);
}

function addOrUpdateLines(doc, svg, textEl) {
  var _opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var opts = _.merge({
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
      'stroke-linecap': 'square'
    }
  }, _opts);

  var leftLineEl = doc.getElementById(opts.leftLineId);
  if (!leftLineEl) {
    leftLineEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(leftLineEl);
  }
  leftLineEl.setAttribute('id', opts.leftLineId);

  var rightLineEl = doc.getElementById(opts.rightLineId);
  if (!rightLineEl) {
    rightLineEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(rightLineEl);
  }
  rightLineEl.setAttribute('id', opts.rightLineId);

  var text = _getFirstTspan(textEl).textContent;
  if (!text || text === ' ') {
    return removeLines(leftLineEl, rightLineEl);
  }

  updateLines(svg, textEl, leftLineEl, rightLineEl, opts);
  if (opts.debugLines) {
    var bbox = opts.getBBoxForSvgElement(textEl);
    var pos = getSvgElementPosition(_getFirstTspan(textEl));
    var rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', pos.x - bbox.width / 2);
    rect.setAttribute('y', pos.y - bbox.height);
    rect.setAttribute('width', bbox.width);
    rect.setAttribute('height', bbox.height);
    rect.setAttribute('stroke', 'red');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('fill', 'none');
    svg.appendChild(rect);
  }
}

var HEADER_MAPPING = {
  header: 'labelHeader',
  smallHeader: 'labelSmallHeader',
  text: 'labelText'
};

function changeDynamicAttributes(el, mapItem) {
  var posterLook = getPosterStyle(mapItem.posterStyle);

  var labelRule = _.find(posterLook.labelRules, function (rule) {
    var mapItemAttr = HEADER_MAPPING[rule.label];
    var str = mapItem[mapItemAttr];
    return str.length >= rule.minLength;
  });

  if (labelRule) {
    var ruleTargetEl = el.getElementById(labelRule.label);
    if (ruleTargetEl.getAttribute('originals-saved') !== 'true') {
      _.forEach(labelRule.svgAttributes, function (val, key) {
        var newVal = ruleTargetEl.getAttribute(key);
        ruleTargetEl.setAttribute('original-' + key, newVal);
      });

      ruleTargetEl.setAttribute('originals-saved', 'true');
    }

    _.forEach(labelRule.svgAttributes, function (val, key) {
      if (_.isPlainObject(val) && val.type === 'factor') {
        var originalVal = parseFloat(ruleTargetEl.getAttribute('original-' + key));
        var newVal = val.value * originalVal;
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
  var mapStyle = getMapStyle(posterInfo.mapStyle);

  // 0/SHARP/FFFFFF/50X70C/0/60.169/24.935
  return [0, // ID version 0
  posterInfo.posterStyle.toUpperCase(), _.trimStart(mapStyle.color, '#').toUpperCase(), posterInfo.orientation[0].toUpperCase(), posterInfo.size.toUpperCase(), 0, // Paper weight, 0 -> Printmotor's default
  posterInfo.cityId].join('/');
}

module.exports = {
  addOrUpdateLines: addOrUpdateLines,
  cssTransformStringToTranslates: cssTransformStringToTranslates,
  posterSizeToMiddleLineStrokeWidth: posterSizeToMiddleLineStrokeWidth,
  changeDynamicAttributes: changeDynamicAttributes,
  getMapStyle: getMapStyle,
  getPosterStyle: getPosterStyle,
  getPosterSizeType: getPosterSizeType,
  getPosterSize: getPosterSize,
  resolveOrientation: resolveOrientation,
  getPosterPhysicalDimensions: getPosterPhysicalDimensions,
  getPosterPhysicalDimensionsInCm: getPosterPhysicalDimensionsInCm,
  findClosestSizeForOtherSizeType: findClosestSizeForOtherSizeType,
  createProductId: createProductId,
  MAP_STYLES: styles.MAP_STYLES,
  POSTER_STYLES: styles.POSTER_STYLES,
  POSTER_SIZES: enums.POSTER_SIZES,
  POSTER_SIZE_TYPES: enums.POSTER_SIZE_TYPES,
  POSTER_ORIENTATIONS: enums.POSTER_ORIENTATIONS
};