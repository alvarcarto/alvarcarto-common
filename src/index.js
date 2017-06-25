const _ = require('lodash');
const styles = require('./styles');
const enums = require('./enums');

const TRANSLATE_REGEX = /\.*translate\((.*)\)/i;
const TRANSLATE_X_REGEX = /\.*translateX\((.*)\)/i;
const TRANSLATE_Y_REGEX = /\.*translateY\((.*)\)/i;

function getMapStyle(id) {
  const found = _.find(styles.MAP_STYLES, { id });
  if (!found) {
    throw new Error(`No such map style: ${id}`);
  }
  return found;
}

function getPosterStyle(id) {
  const found = _.find(styles.POSTER_STYLES, { id });
  if (!found) {
    throw new Error(`No such poster style: ${id}`);
  }
  return found;
}

function cssTransformStringToTranslates(transformStr) {
  const obj = {
    translateX: 0,
    translateY: 0,
  };

  const translateExec = TRANSLATE_REGEX.exec(transformStr);
  if (translateExec && _.isString(translateExec[1])) {
    const translate = translateExec[1];
    const parts = translate.split(',');

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
  const posterLook = getPosterStyle(mapItem.posterStyle);

  const labelRule = _.find(posterLook.labelRules, (rule) => {
    const mapItemAttr = HEADER_MAPPING[rule.label];
    const str = mapItem[mapItemAttr];
    return str.length >= rule.minLength;
  });

  if (labelRule) {
    const ruleTargetEl = el.getElementById(labelRule.label);
    if (!ruleTargetEl.originalAttributes) {
      ruleTargetEl.originalAttributes = _.reduce(labelRule.svgAttributes, (memo, val, key) => {
        return _.extend({}, memo, { [key]: ruleTargetEl.getAttribute(key) });
      }, {});
    }

    _.forEach(labelRule.svgAttributes, (val, key) => {
      if (_.isPlainObject(val) && val.type === 'factor') {
        const originalVal = parseFloat(ruleTargetEl.originalAttributes[key]);
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
    default:
      return 6;
  }
}

module.exports = {
  addOrUpdateLines,
  cssTransformStringToTranslates,
  posterSizeToMiddleLineStrokeWidth,
  changeDynamicAttributes,
  getMapStyle,
  getPosterStyle,
  MAP_STYLES: styles.MAP_STYLES,
  POSTER_STYLES: styles.POSTER_STYLES,
  POSTER_SIZES: enums.POSTER_SIZES,
  POSTER_ORIENTATIONS: enums.POSTER_ORIENTATIONS,
};
