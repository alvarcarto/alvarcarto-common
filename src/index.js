const _ = require('lodash');
const styles = require('./styles');

const TRANSLATE_REGEX = /\.*translate\((.*)\)/i;
const TRANSLATE_X_REGEX = /\.*translateX\((.*)\)/i;
const TRANSLATE_Y_REGEX = /\.*translateY\((.*)\)/i;

function getMapStyle(id) {
  return _.find(styles.MAP_STYLES, { id });
}

function getPosterStyle(id) {
  return _.find(styles.POSTER_STYLES, { id });
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

function _getRightLinePath(textInfo, opts) {
  const { position, bbox, fontSize } = textInfo;
  const x = position.x + (bbox.width / 2) + opts.paddingBetweenLineAndText;
  const y = position.y - (fontSize / 2) + ((1.0 - opts.fontCapHeightRatio) * fontSize);
  return `M${x},${y} L${x + opts.lineLength},${y}`;
}

function _getLeftLinePath(textInfo, opts) {
  const { position, bbox, fontSize } = textInfo;
  const x = position.x - (bbox.width / 2) - opts.paddingBetweenLineAndText;
  const y = position.y - (fontSize / 2) + ((1.0 - opts.fontCapHeightRatio) * fontSize);
  return `M${x},${y} L${x - opts.lineLength},${y}`;
}

function _getFirstTspan(textNode) {
  const tspanList = textNode.getElementsByTagName('tspan');
  if (tspanList.length < 1) {
    throw new Error(`Unexpected amount of tspan elements found: ${tspanList.length}`);
  }

  return tspanList.item(0);
}

function updateLines(textEl, leftEl, rightEl, opts = {}) {
  const textInfo = {
    fontSize: parseFloat(textEl.getAttribute('font-size')),
    position: getSvgElementPosition(_getFirstTspan(textEl)),
    bbox: opts.getBBoxForSvgElement(textEl),
  };

  leftEl.setAttribute('d', _getLeftLinePath(textInfo, opts));
  rightEl.setAttribute('d', _getRightLinePath(textInfo, opts));

  _.forEach(opts.svgAttributes, (val, key) => {
    leftEl.setAttribute(key, val);
    rightEl.setAttribute(key, val);
  });
}

function addOrUpdateLines(doc, svg, textEl, _opts = {}) {
  const opts = _.merge(_opts, {
    // This ratio defines what is the font cap height's ratio to the font size
    // (font size is assumed to equal the bounding box height of the text)
    // Exact value could be calculated also: https://github.com/sebdesign/cap-height
    // This value is of course different between fonts
    // I don't know if it even can be approximated with a ratio from font size
    // but this sounds better than a fixed value. Compared to fixed value, ratio
    // *could* work when resizing the font
    fontCapHeightRatio: 0.8,
    paddingBetweenLineAndText: 130,
    lineLength: 280,
    leftLineId: 'small-header-left-line',
    rightLineId: 'small-header-right-line',
  });

  let leftLineEl = svg.getElementById(opts.leftLineId);
  if (!leftLineEl) {
    leftLineEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(leftLineEl);
  }
  leftLineEl.setAttribute('id', opts.leftLineId);

  let rightLineEl = svg.getElementById(opts.rightLineId);
  if (!rightLineEl) {
    rightLineEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(rightLineEl);
  }
  rightLineEl.setAttribute('id', opts.rightLineId);

  updateLines(textEl, leftLineEl, rightLineEl, opts);
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
    const ruleTargetEl = el.querySelector(`#${labelRule.label}`);
    _.forEach(labelRule.svgAttributes, (val, key) => {
      ruleTargetEl.setAttribute(key, val);
    });
  }
}

module.exports = {
  addOrUpdateLines,
  cssTransformStringToTranslates,
  changeDynamicAttributes,
  getMapStyle,
  getPosterStyle,
  MAP_STYLES: styles.MAP_STYLES,
  POSTER_STYLES: styles.POSTER_STYLES,
};
