// jscs:disable maximumLineLength

'use strict';

var Node = require('../node/basic-node');
var NodeType = require('../node/node-types');
var TokenType = require('../token-types');

var tokens = undefined;
var tokensLength = undefined;
var pos = undefined;

var contexts = {
  'arguments': function () {
    return checkArguments(pos) && getArguments();
  },
  'atkeyword': function () {
    return checkAtkeyword(pos) && getAtkeyword();
  },
  'atrule': function () {
    return checkAtrule(pos) && getAtrule();
  },
  'block': function () {
    return checkBlock(pos) && getBlock();
  },
  'brackets': function () {
    return checkBrackets(pos) && getBrackets();
  },
  'class': function () {
    return checkClass(pos) && getClass();
  },
  'combinator': function () {
    return checkCombinator(pos) && getCombinator();
  },
  'commentML': function () {
    return checkCommentML(pos) && getCommentML();
  },
  'commentSL': function () {
    return checkCommentSL(pos) && getCommentSL();
  },
  'condition': function () {
    return checkCondition(pos) && getCondition();
  },
  'conditionalStatement': function () {
    return checkConditionalStatement(pos) && getConditionalStatement();
  },
  'declaration': function () {
    return checkDeclaration(pos) && getDeclaration();
  },
  'declDelim': function () {
    return checkDeclDelim(pos) && getDeclDelim();
  },
  'default': function () {
    return checkDefault(pos) && getDefault();
  },
  'delim': function () {
    return checkDelim(pos) && getDelim();
  },
  'dimension': function () {
    return checkDimension(pos) && getDimension();
  },
  'expression': function () {
    return checkExpression(pos) && getExpression();
  },
  'extend': function () {
    return checkExtend(pos) && getExtend();
  },
  'function': function () {
    return checkFunction(pos) && getFunction();
  },
  'global': function () {
    return checkGlobal(pos) && getGlobal();
  },
  'ident': function () {
    return checkIdent(pos) && getIdent();
  },
  'important': function () {
    return checkImportant(pos) && getImportant();
  },
  'include': function () {
    return checkInclude(pos) && getInclude();
  },
  'interpolation': function () {
    return checkInterpolation(pos) && getInterpolation();
  },
  'loop': function () {
    return checkLoop(pos) && getLoop();
  },
  'mixin': function () {
    return checkMixin(pos) && getMixin();
  },
  'namespace': function () {
    return checkNamespace(pos) && getNamespace();
  },
  'number': function () {
    return checkNumber(pos) && getNumber();
  },
  'operator': function () {
    return checkOperator(pos) && getOperator();
  },
  'optional': function () {
    return checkOptional(pos) && getOptional();
  },
  'parentheses': function () {
    return checkParentheses(pos) && getParentheses();
  },
  'parentselector': function () {
    return checkParentSelector(pos) && getParentSelector();
  },
  'percentage': function () {
    return checkPercentage(pos) && getPercentage();
  },
  'placeholder': function () {
    return checkPlaceholder(pos) && getPlaceholder();
  },
  'progid': function () {
    return checkProgid(pos) && getProgid();
  },
  'property': function () {
    return checkProperty(pos) && getProperty();
  },
  'propertyDelim': function () {
    return checkPropertyDelim(pos) && getPropertyDelim();
  },
  'pseudoc': function () {
    return checkPseudoc(pos) && getPseudoc();
  },
  'pseudoe': function () {
    return checkPseudoe(pos) && getPseudoe();
  },
  'ruleset': function () {
    return checkRuleset(pos) && getRuleset();
  },
  's': function () {
    return checkS(pos) && getS();
  },
  'selector': function () {
    return checkSelector(pos) && getSelector();
  },
  'shash': function () {
    return checkShash(pos) && getShash();
  },
  'string': function () {
    return checkString(pos) && getString();
  },
  'stylesheet': function () {
    return checkStylesheet(pos) && getStylesheet();
  },
  'unary': function () {
    return checkUnary(pos) && getUnary();
  },
  'uri': function () {
    return checkUri(pos) && getUri();
  },
  'value': function () {
    return checkValue(pos) && getValue();
  },
  'variable': function () {
    return checkVariable(pos) && getVariable();
  },
  'variableslist': function () {
    return checkVariablesList(pos) && getVariablesList();
  },
  'vhash': function () {
    return checkVhash(pos) && getVhash();
  }
};

/**
 * Stop parsing and display error
 * @param {Number=} i Token's index number
 */
function throwError(i) {
  var ln = i ? tokens[i].ln : tokens[pos].ln;

  throw { line: ln, syntax: 'scss' };
}

/**
 * @param {Object} exclude
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkExcluding(exclude, i) {
  var start = i;

  while (i < tokensLength) {
    if (exclude[tokens[i++].type]) break;
  }

  return i - start - 2;
}

/**
 * @param {Number} start
 * @param {Number} finish
 * @returns {String}
 */
function joinValues(start, finish) {
  var s = '';

  for (var i = start; i < finish + 1; i++) {
    s += tokens[i].value;
  }

  return s;
}

/**
 * @param {Number} start
 * @param {Number} num
 * @returns {String}
 */
function joinValues2(start, num) {
  if (start + num - 1 >= tokensLength) return;

  var s = '';

  for (var i = 0; i < num; i++) {
    s += tokens[start + i].value;
  }

  return s;
}

function getLastPosition(content, line, column, colOffset) {
  return typeof content === 'string' ? getLastPositionForString(content, line, column, colOffset) : getLastPositionForArray(content, line, column, colOffset);
}

function getLastPositionForString(content, line, column, colOffset) {
  var position = [];

  if (!content) {
    position = [line, column];
    if (colOffset) position[1] += colOffset - 1;
    return position;
  }

  var lastLinebreak = content.lastIndexOf('\n');
  var endsWithLinebreak = lastLinebreak === content.length - 1;
  var splitContent = content.split('\n');
  var linebreaksCount = splitContent.length - 1;
  var prevLinebreak = linebreaksCount === 0 || linebreaksCount === 1 ? -1 : content.length - splitContent[linebreaksCount - 1].length - 2;

  // Line:
  var offset = endsWithLinebreak ? linebreaksCount - 1 : linebreaksCount;
  position[0] = line + offset;

  // Column:
  if (endsWithLinebreak) {
    offset = prevLinebreak !== -1 ? content.length - prevLinebreak : content.length - 1;
  } else {
    offset = linebreaksCount !== 0 ? content.length - lastLinebreak - column - 1 : content.length - 1;
  }
  position[1] = column + offset;

  if (!colOffset) return position;

  if (endsWithLinebreak) {
    position[0]++;
    position[1] = colOffset;
  } else {
    position[1] += colOffset;
  }

  return position;
}

function getLastPositionForArray(content, line, column, colOffset) {
  var position;

  if (content.length === 0) {
    position = [line, column];
  } else {
    var c = content[content.length - 1];
    if (c.hasOwnProperty('end')) {
      position = [c.end.line, c.end.column];
    } else {
      position = getLastPosition(c.content, line, column);
    }
  }

  if (!colOffset) return position;

  if (tokens[pos - 1].type !== 'Newline') {
    position[1] += colOffset;
  } else {
    position[0]++;
    position[1] = 1;
  }

  return position;
}

function newNode(type, content, line, column, end) {
  if (!end) end = getLastPosition(content, line, column);
  return new Node({
    type: type,
    content: content,
    start: {
      line: line,
      column: column
    },
    end: {
      line: end[0],
      column: end[1]
    },
    syntax: 'scss'
  });
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkAny(i) {
  return checkBrackets(i) || checkParentheses(i) || checkString(i) || checkVariablesList(i) || checkVariable(i) || checkPlaceholder(i) || checkPercentage(i) || checkDimension(i) || checkNumber(i) || checkUri(i) || checkExpression(i) || checkFunction(i) || checkInterpolation(i) || checkIdent(i) || checkClass(i) || checkUnary(i);
}

/**
 * @returns {Array}
 */
function getAny() {
  if (checkBrackets(pos)) return getBrackets();else if (checkParentheses(pos)) return getParentheses();else if (checkString(pos)) return getString();else if (checkVariablesList(pos)) return getVariablesList();else if (checkVariable(pos)) return getVariable();else if (checkPlaceholder(pos)) return getPlaceholder();else if (checkPercentage(pos)) return getPercentage();else if (checkDimension(pos)) return getDimension();else if (checkNumber(pos)) return getNumber();else if (checkUri(pos)) return getUri();else if (checkExpression(pos)) return getExpression();else if (checkFunction(pos)) return getFunction();else if (checkInterpolation(pos)) return getInterpolation();else if (checkIdent(pos)) return getIdent();else if (checkClass(pos)) return getClass();else if (checkUnary(pos)) return getUnary();
}

/**
 * Check if token is part of mixin's arguments.
 * @param {Number} i Token's index number
 * @returns {Number} Length of arguments
 */
function checkArguments(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength || tokens[i].type !== TokenType.LeftParenthesis) return 0;

  i++;

  while (i < tokens[start].right) {
    if (l = checkArgument(i)) i += l;else return 0;
  }

  return tokens[start].right - start + 1;
}

/**
 * Check if token is valid to be part of arguments list
 * @param {Number} i Token's index number
 * @returns {Number} Length of argument
 */
function checkArgument(i) {
  return checkBrackets(i) || checkParentheses(i) || checkDeclaration(i) || checkFunction(i) || checkVariablesList(i) || checkVariable(i) || checkSC(i) || checkDelim(i) || checkDeclDelim(i) || checkString(i) || checkPercentage(i) || checkDimension(i) || checkNumber(i) || checkUri(i) || checkInterpolation(i) || checkIdent(i) || checkVhash(i) || checkOperator(i) || checkUnary(i);
}

/**
 * @returns {Array} Node that is part of arguments list
 */
function getArgument() {
  if (checkBrackets(pos)) return getBrackets();else if (checkParentheses(pos)) return getParentheses();else if (checkDeclaration(pos)) return getDeclaration();else if (checkFunction(pos)) return getFunction();else if (checkVariablesList(pos)) return getVariablesList();else if (checkVariable(pos)) return getVariable();else if (checkSC(pos)) return getSC();else if (checkDelim(pos)) return getDelim();else if (checkDeclDelim(pos)) return getDeclDelim();else if (checkString(pos)) return getString();else if (checkPercentage(pos)) return getPercentage();else if (checkDimension(pos)) return getDimension();else if (checkNumber(pos)) return getNumber();else if (checkUri(pos)) return getUri();else if (checkInterpolation(pos)) return getInterpolation();else if (checkIdent(pos)) return getIdent();else if (checkVhash(pos)) return getVhash();else if (checkOperator(pos)) return getOperator();else if (checkUnary(pos)) return getUnary();
}

/**
 * Check if token is part of an @-word (e.g. `@import`, `@include`)
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkAtkeyword(i) {
  var l;

  // Check that token is `@`:
  if (i >= tokensLength || tokens[i++].type !== TokenType.CommercialAt) return 0;

  return (l = checkIdentOrInterpolation(i)) ? l + 1 : 0;
}

/**
 * Get node with @-word
 * @returns {Array} `['atkeyword', ['ident', x]]` where `x` is
 *      an identifier without
 *      `@` (e.g. `import`, `include`)
 */
function getAtkeyword() {
  var startPos = pos;
  var x = undefined;

  pos++;

  x = getIdentOrInterpolation();

  var token = tokens[startPos];
  return newNode(NodeType.AtkeywordType, x, token.ln, token.col);
}

/**
 * Check if token is a part of an @-rule
 * @param {Number} i Token's index number
 * @returns {Number} Length of @-rule
 */
function checkAtrule(i) {
  var l;

  if (i >= tokensLength) return 0;

  // If token already has a record of being part of an @-rule,
  // return the @-rule's length:
  if (tokens[i].atrule_l !== undefined) return tokens[i].atrule_l;

  // If token is part of an @-rule, save the rule's type to token:
  if (l = checkKeyframesRule(i)) tokens[i].atrule_type = 4;else if (l = checkAtruler(i)) tokens[i].atrule_type = 1; // @-rule with ruleset
  else if (l = checkAtruleb(i)) tokens[i].atrule_type = 2; // Block @-rule
    else if (l = checkAtrules(i)) tokens[i].atrule_type = 3; // Single-line @-rule
      else return 0;

  // If token is part of an @-rule, save the rule's length to token:
  tokens[i].atrule_l = l;

  return l;
}

/**
 * Get node with @-rule
 * @returns {Array}
 */
function getAtrule() {
  switch (tokens[pos].atrule_type) {
    case 1:
      return getAtruler(); // @-rule with ruleset
    case 2:
      return getAtruleb(); // Block @-rule
    case 3:
      return getAtrules(); // Single-line @-rule
    case 4:
      return getKeyframesRule();
  }
}

/**
 * Check if token is part of a block @-rule
 * @param {Number} i Token's index number
 * @returns {Number} Length of the @-rule
 */
function checkAtruleb(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (l = checkTsets(i)) i += l;

  if (l = checkBlock(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with a block @-rule
 * @returns {Array} `['atruleb', ['atkeyword', x], y, ['block', z]]`
 */
function getAtruleb() {
  var startPos = pos;
  var x = undefined;

  x = [getAtkeyword()].concat(getTsets()).concat([getBlock()]);

  var token = tokens[startPos];
  return newNode(NodeType.AtruleType, x, token.ln, token.col);
}

/**
 * Check if token is part of an @-rule with ruleset
 * @param {Number} i Token's index number
 * @returns {Number} Length of the @-rule
 */
function checkAtruler(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (l = checkTsets(i)) i += l;

  if (i < tokensLength && tokens[i].type === TokenType.LeftCurlyBracket) i++;else return 0;

  if (l = checkAtrulers(i)) i += l;

  if (i < tokensLength && tokens[i].type === TokenType.RightCurlyBracket) i++;else return 0;

  return i - start;
}

/**
 * Get node with an @-rule with ruleset
 * @returns {Array} ['atruler', ['atkeyword', x], y, z]
 */
function getAtruler() {
  var startPos = pos;
  var x = undefined;

  x = [getAtkeyword()].concat(getTsets());

  x.push(getAtrulers());

  var token = tokens[startPos];
  return newNode(NodeType.AtruleType, x, token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkAtrulers(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  while (l = checkRuleset(i) || checkAtrule(i) || checkSC(i)) {
    i += l;
  }

  if (i < tokensLength) tokens[i].atrulers_end = 1;

  return i - start;
}

/**
 * @returns {Array} `['atrulers', x]`
 */
function getAtrulers() {
  var startPos = pos;
  var x = undefined;
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;
  pos++;

  x = getSC();

  while (!tokens[pos].atrulers_end) {
    if (checkSC(pos)) x = x.concat(getSC());else if (checkAtrule(pos)) x.push(getAtrule());else if (checkRuleset(pos)) x.push(getRuleset());
  }

  x = x.concat(getSC());

  var end = getLastPosition(x, line, column, 1);
  pos++;

  return newNode(NodeType.BlockType, x, token.ln, token.col, end);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkAtrules(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (l = checkTsets(i)) i += l;

  return i - start;
}

/**
 * @returns {Array} `['atrules', ['atkeyword', x], y]`
 */
function getAtrules() {
  var startPos = pos;
  var x = undefined;

  x = [getAtkeyword()].concat(getTsets());

  var token = tokens[startPos];
  return newNode(NodeType.AtruleType, x, token.ln, token.col);
}

/**
 * Check if token is part of a block (e.g. `{...}`).
 * @param {Number} i Token's index number
 * @returns {Number} Length of the block
 */
function checkBlock(i) {
  return i < tokensLength && tokens[i].type === TokenType.LeftCurlyBracket ? tokens[i].right - i + 1 : 0;
}

/**
 * Get node with a block
 * @returns {Array} `['block', x]`
 */
function getBlock() {
  var startPos = pos;
  var end = tokens[pos].right;
  var x = [];
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  pos++;

  while (pos < end) {
    if (checkBlockdecl(pos)) x = x.concat(getBlockdecl());else throwError();
  }

  var end_ = getLastPosition(x, line, column, 1);
  pos = end + 1;

  return newNode(NodeType.BlockType, x, token.ln, token.col, end_);
}

/**
 * Check if token is part of a declaration (property-value pair)
 * @param {Number} i Token's index number
 * @returns {Number} Length of the declaration
 */
function checkBlockdecl(i) {
  var l;

  if (i >= tokensLength) return 0;

  if (l = checkBlockdecl1(i)) tokens[i].bd_type = 1;else if (l = checkBlockdecl2(i)) tokens[i].bd_type = 2;else if (l = checkBlockdecl3(i)) tokens[i].bd_type = 3;else if (l = checkBlockdecl4(i)) tokens[i].bd_type = 4;else return 0;

  return l;
}

/**
 * @returns {Array}
 */
function getBlockdecl() {
  switch (tokens[pos].bd_type) {
    case 1:
      return getBlockdecl1();
    case 2:
      return getBlockdecl2();
    case 3:
      return getBlockdecl3();
    case 4:
      return getBlockdecl4();
  }
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkBlockdecl1(i) {
  var start = i;
  var l = undefined;

  if (l = checkSC(i)) i += l;

  if (l = checkConditionalStatement(i)) tokens[i].bd_kind = 1;else if (l = checkInclude(i)) tokens[i].bd_kind = 2;else if (l = checkExtend(i)) tokens[i].bd_kind = 4;else if (l = checkLoop(i)) tokens[i].bd_kind = 3;else if (l = checkAtrule(i)) tokens[i].bd_kind = 6;else if (l = checkRuleset(i)) tokens[i].bd_kind = 7;else if (l = checkDeclaration(i)) tokens[i].bd_kind = 5;else return 0;

  i += l;

  if (i < tokensLength && (l = checkDeclDelim(i))) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  return i - start;
}

/**
 * @returns {Array}
 */
function getBlockdecl1() {
  var sc = getSC();
  var x = undefined;

  switch (tokens[pos].bd_kind) {
    case 1:
      x = getConditionalStatement();
      break;
    case 2:
      x = getInclude();
      break;
    case 3:
      x = getLoop();
      break;
    case 4:
      x = getExtend();
      break;
    case 5:
      x = getDeclaration();
      break;
    case 6:
      x = getAtrule();
      break;
    case 7:
      x = getRuleset();
      break;
  }

  return sc.concat([x]).concat([getDeclDelim()]).concat(getSC());
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkBlockdecl2(i) {
  var start = i;
  var l = undefined;

  if (l = checkSC(i)) i += l;

  if (l = checkConditionalStatement(i)) tokens[i].bd_kind = 1;else if (l = checkInclude(i)) tokens[i].bd_kind = 2;else if (l = checkExtend(i)) tokens[i].bd_kind = 4;else if (l = checkLoop(i)) tokens[i].bd_kind = 3;else if (l = checkAtrule(i)) tokens[i].bd_kind = 6;else if (l = checkRuleset(i)) tokens[i].bd_kind = 7;else if (l = checkDeclaration(i)) tokens[i].bd_kind = 5;else return 0;

  i += l;

  if (l = checkSC(i)) i += l;

  return i - start;
}

/**
 * @returns {Array}
 */
function getBlockdecl2() {
  var sc = getSC();
  var x = undefined;

  switch (tokens[pos].bd_kind) {
    case 1:
      x = getConditionalStatement();
      break;
    case 2:
      x = getInclude();
      break;
    case 3:
      x = getLoop();
      break;
    case 4:
      x = getExtend();
      break;
    case 5:
      x = getDeclaration();
      break;
    case 6:
      x = getAtrule();
      break;
    case 7:
      x = getRuleset();
      break;
  }

  return sc.concat([x]).concat(getSC());
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkBlockdecl3(i) {
  var start = i;
  var l = undefined;

  if (l = checkSC(i)) i += l;

  if (l = checkDeclDelim(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  return i - start;
}

/**
 * @returns {Array} `[s0, ['declDelim'], s1]` where `s0` and `s1` are
 *      are optional whitespaces.
 */
function getBlockdecl3() {
  return getSC().concat([getDeclDelim()]).concat(getSC());
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkBlockdecl4(i) {
  return checkSC(i);
}

/**
 * @returns {Array}
 */
function getBlockdecl4() {
  return getSC();
}

/**
 * Check if token is part of text inside square brackets, e.g. `[1]`
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkBrackets(i) {
  if (i >= tokensLength || tokens[i].type !== TokenType.LeftSquareBracket) return 0;

  return tokens[i].right - i + 1;
}

/**
 * Get node with text inside parentheses or square brackets (e.g. `(1)`)
 * @return {Node}
 */
function getBrackets() {
  var startPos = pos;
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  pos++;

  var tsets = getTsets();

  var end = getLastPosition(tsets, line, column, 1);
  pos++;

  return newNode(NodeType.BracketsType, tsets, token.ln, token.col, end);
}

/**
 * Check if token is part of a class selector (e.g. `.abc`)
 * @param {Number} i Token's index number
 * @returns {Number} Length of the class selector
 */
function checkClass(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (tokens[i].class_l) return tokens[i].class_l;

  if (tokens[i++].type !== TokenType.FullStop) return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with a class selector
 * @returns {Array} `['class', ['ident', x]]` where x is a class's
 *      identifier (without `.`, e.g. `abc`).
 */
function getClass() {
  var startPos = pos;
  var x = [];

  pos++;

  x = x.concat(getIdentOrInterpolation());

  var token = tokens[startPos];
  return newNode(NodeType.ClassType, x, token.ln, token.col);
}

function checkCombinator(i) {
  if (i >= tokensLength) return 0;

  var l = undefined;
  if (l = checkCombinator1(i)) tokens[i].combinatorType = 1;else if (l = checkCombinator2(i)) tokens[i].combinatorType = 2;else if (l = checkCombinator3(i)) tokens[i].combinatorType = 3;

  return l;
}

function getCombinator() {
  var type = tokens[pos].combinatorType;
  if (type === 1) return getCombinator1();
  if (type === 2) return getCombinator2();
  if (type === 3) return getCombinator3();
}
/**
 * (1) `||`
 */
function checkCombinator1(i) {
  if (tokens[i].type === TokenType.VerticalLine && tokens[i + 1].type === TokenType.VerticalLine) return 2;else return 0;
}

function getCombinator1() {
  var type = NodeType.CombinatorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = '||';

  pos += 2;
  return newNode(type, content, line, column);
}

/**
 * (1) `>`
 * (2) `+`
 * (3) `~`
 */
function checkCombinator2(i) {
  var type = tokens[i].type;
  if (type === TokenType.PlusSign || type === TokenType.GreaterThanSign || type === TokenType.Tilde) return 1;else return 0;
}

function getCombinator2() {
  var type = NodeType.CombinatorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = tokens[pos++].value;

  return newNode(type, content, line, column);
}

/**
 * (1) `/panda/`
 */
function checkCombinator3(i) {
  var start = i;

  if (tokens[i].type === TokenType.Solidus) i++;else return 0;

  var l = undefined;
  if (l = checkIdent(i)) i += l;else return 0;

  if (tokens[i].type === TokenType.Solidus) i++;else return 0;

  return i - start;
}

function getCombinator3() {
  var type = NodeType.CombinatorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;

  // Skip `/`.
  pos++;
  var ident = getIdent();

  // Skip `/`.
  pos++;

  var content = '/' + ident.content + '/';

  return newNode(type, content, line, column);
}

/**
 * Check if token is a multiline comment.
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is a multiline comment, otherwise `0`
 */
function checkCommentML(i) {
  return i < tokensLength && tokens[i].type === TokenType.CommentML ? 1 : 0;
}

/**
 * Get node with a multiline comment
 * @returns {Array} `['commentML', x]` where `x`
 *      is the comment's text (without `/*` and `* /`).
 */
function getCommentML() {
  var startPos = pos;
  var s = tokens[pos].value.substring(2);
  var l = s.length;
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  if (s.charAt(l - 2) === '*' && s.charAt(l - 1) === '/') s = s.substring(0, l - 2);

  var end = getLastPosition(s, line, column, 2);
  if (end[0] === line) end[1] += 2;
  pos++;

  return newNode(NodeType.CommentMLType, s, token.ln, token.col, end);
}

/**
 * Check if token is part of a single-line comment.
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is a single-line comment, otherwise `0`
 */
function checkCommentSL(i) {
  return i < tokensLength && tokens[i].type === TokenType.CommentSL ? 1 : 0;
}

/**
 * Get node with a single-line comment.
 * @returns {Array} `['commentSL', x]` where `x` is comment's message
 *      (without `//`)
 */
function getCommentSL() {
  var startPos = pos;
  var x = undefined;
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  x = tokens[pos++].value.substring(2);
  var end = getLastPosition(x, line, column + 2);

  return newNode(NodeType.CommentSLType, x, token.ln, token.col, end);
}

/**
 * Check if token is part of a condition
 * (e.g. `@if ...`, `@else if ...` or `@else ...`).
 * @param {Number} i Token's index number
 * @returns {Number} Length of the condition
 */
function checkCondition(i) {
  var start = i;
  var l = undefined;
  var _i = undefined;
  var s = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (['if', 'else'].indexOf(tokens[start + 1].value) < 0) return 0;

  while (i < tokensLength) {
    if (l = checkBlock(i)) break;

    s = checkSC(i);
    _i = i + s;

    if (l = _checkCondition(_i)) i += l + s;else break;
  }

  return i - start;
}

function _checkCondition(i) {
  return checkVariable(i) || checkNumber(i) || checkInterpolation(i) || checkIdent(i) || checkOperator(i) || checkCombinator(i) || checkString(i);
}

/**
 * Get node with a condition.
 * @returns {Array} `['condition', x]`
 */
function getCondition() {
  var startPos = pos;
  var x = [];
  var s;
  var _pos;

  x.push(getAtkeyword());

  while (pos < tokensLength) {
    if (checkBlock(pos)) break;

    s = checkSC(pos);
    _pos = pos + s;

    if (!_checkCondition(_pos)) break;

    if (s) x = x.concat(getSC());
    x.push(_getCondition());
  }

  var token = tokens[startPos];
  return newNode(NodeType.ConditionType, x, token.ln, token.col);
}

function _getCondition() {
  if (checkVariable(pos)) return getVariable();
  if (checkNumber(pos)) return getNumber();
  if (checkInterpolation(pos)) return getInterpolation();
  if (checkIdent(pos)) return getIdent();
  if (checkOperator(pos)) return getOperator();
  if (checkCombinator(pos)) return getCombinator();
  if (checkString(pos)) return getString();
}

/**
 * Check if token is part of a conditional statement
 * (e.g. `@if ... {} @else if ... {} @else ... {}`).
 * @param {Number} i Token's index number
 * @returns {Number} Length of the condition
 */
function checkConditionalStatement(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkCondition(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkBlock(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with a condition.
 * @returns {Array} `['condition', x]`
 */
function getConditionalStatement() {
  var startPos = pos;
  var x = [];

  x.push(getCondition());
  x = x.concat(getSC());
  x.push(getBlock());

  var token = tokens[startPos];
  return newNode(NodeType.ConditionalStatementType, x, token.ln, token.col);
}

/**
 * Check if token is part of a declaration (property-value pair)
 * @param {Number} i Token's index number
 * @returns {Number} Length of the declaration
 */
function checkDeclaration(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkProperty(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkPropertyDelim(i)) i++;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkValue(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with a declaration
 * @returns {Array} `['declaration', ['property', x], ['propertyDelim'],
 *       ['value', y]]`
 */
function getDeclaration() {
  var startPos = pos;
  var x = [];

  x.push(getProperty());
  x = x.concat(getSC());
  x.push(getPropertyDelim());
  x = x.concat(getSC());
  x.push(getValue());

  var token = tokens[startPos];
  return newNode(NodeType.DeclarationType, x, token.ln, token.col);
}

/**
 * Check if token is a semicolon
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is a semicolon, otherwise `0`
 */
function checkDeclDelim(i) {
  return i < tokensLength && tokens[i].type === TokenType.Semicolon ? 1 : 0;
}

/**
 * Get node with a semicolon
 * @returns {Array} `['declDelim']`
 */
function getDeclDelim() {
  var startPos = pos++;

  var token = tokens[startPos];
  return newNode(NodeType.DeclDelimType, ';', token.ln, token.col);
}

/**
 * Check if token if part of `!default` word.
 * @param {Number} i Token's index number
 * @returns {Number} Length of the `!default` word
 */
function checkDefault(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength || tokens[i++].type !== TokenType.ExclamationMark) return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].value === 'default') {
    tokens[start].defaultEnd = i;
    return i - start + 1;
  } else {
    return 0;
  }
}

/**
 * Get node with a `!default` word
 * @returns {Array} `['default', sc]` where `sc` is optional whitespace
 */
function getDefault() {
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = joinValues(pos, token.defaultEnd);

  pos = token.defaultEnd + 1;

  return newNode(NodeType.DefaultType, content, line, column);
}

/**
 * Check if token is a comma
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is a comma, otherwise `0`
 */
function checkDelim(i) {
  return i < tokensLength && tokens[i].type === TokenType.Comma ? 1 : 0;
}

/**
 * Get node with a comma
 * @returns {Array} `['delim']`
 */
function getDelim() {
  var startPos = pos;

  pos++;

  var token = tokens[startPos];
  return newNode(NodeType.DelimType, ',', token.ln, token.col);
}

/**
 * Check if token is part of a number with dimension unit (e.g. `10px`)
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkDimension(i) {
  var ln = checkNumber(i);
  var li = undefined;

  if (i >= tokensLength || !ln || i + ln >= tokensLength) return 0;

  return (li = checkNmName2(i + ln)) ? ln + li : 0;
}

/**
 * Get node of a number with dimension unit
 * @returns {Array} `['dimension', ['number', x], ['ident', y]]` where
 *      `x` is a number converted to string (e.g. `'10'`) and `y` is
 *      a dimension unit (e.g. `'px'`).
 */
function getDimension() {
  var startPos = pos;
  var x = [getNumber()];
  var token = tokens[pos];
  var ident = newNode(NodeType.IdentType, getNmName2(), token.ln, token.col);

  x.push(ident);

  token = tokens[startPos];
  return newNode(NodeType.DimensionType, x, token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkExpression(i) {
  var start = i;

  if (i >= tokensLength || tokens[i++].value !== 'expression' || i >= tokensLength || tokens[i].type !== TokenType.LeftParenthesis) return 0;

  return tokens[i].right - start + 1;
}

/**
 * @returns {Array}
 */
function getExpression() {
  var startPos = pos;
  var e;
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  pos++;

  e = joinValues(pos + 1, tokens[pos].right - 1);
  var end = getLastPosition(e, line, column, 1);
  if (end[0] === line) end[1] += 11;
  pos = tokens[pos].right + 1;

  return newNode(NodeType.ExpressionType, e, token.ln, token.col, end);
}

function checkExtend(i) {
  var l = 0;

  if (l = checkExtend1(i)) tokens[i].extend_child = 1;else if (l = checkExtend2(i)) tokens[i].extend_child = 2;

  return l;
}

function getExtend() {
  var type = tokens[pos].extend_child;

  if (type === 1) return getExtend1();else if (type === 2) return getExtend2();
}

/**
 * Checks if token is part of an extend with `!optional` flag.
 * @param {Number} i
 */
function checkExtend1(i) {
  var start = i;
  var l;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (tokens[start + 1].value !== 'extend') return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkSelectorsGroup(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkOptional(i)) i += l;else return 0;

  return i - start;
}

function getExtend1() {
  var startPos = pos;
  var x = [].concat([getAtkeyword()], getSC(), getSelectorsGroup(), getSC(), [getOptional()]);

  var token = tokens[startPos];
  return newNode(NodeType.ExtendType, x, token.ln, token.col);
}

/**
 * Checks if token is part of an extend without `!optional` flag.
 * @param {Number} i
 */
function checkExtend2(i) {
  var start = i;
  var l;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (tokens[start + 1].value !== 'extend') return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkSelectorsGroup(i)) i += l;else return 0;

  return i - start;
}

function getExtend2() {
  var startPos = pos;
  var x = [].concat([getAtkeyword()], getSC(), getSelectorsGroup());
  var token = tokens[startPos];
  return newNode(NodeType.ExtendType, x, token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkFunction(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  return i < tokensLength && tokens[i].type === TokenType.LeftParenthesis ? tokens[i].right - start + 1 : 0;
}

/**
 * @returns {Array}
 */
function getFunction() {
  var startPos = pos;
  var x = getIdentOrInterpolation();
  var body = undefined;

  body = getArguments();

  x.push(body);

  var token = tokens[startPos];
  return newNode(NodeType.FunctionType, x, token.ln, token.col);
}

/**
 * @returns {Array}
 */
function getArguments() {
  var startPos = pos;
  var x = [];
  var body = undefined;
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  pos++;

  while (pos < tokensLength && tokens[pos].type !== TokenType.RightParenthesis) {
    if (checkDeclaration(pos)) x.push(getDeclaration());else if (checkArgument(pos)) {
      body = getArgument();
      if (typeof body.content === 'string') x.push(body);else x = x.concat(body);
    } else if (checkClass(pos)) x.push(getClass());else throwError();
  }

  var end = getLastPosition(x, line, column, 1);
  pos++;

  return newNode(NodeType.ArgumentsType, x, token.ln, token.col, end);
}

/**
 * Check if token is part of an identifier
 * @param {Number} i Token's index number
 * @returns {Number} Length of the identifier
 */
function checkIdent(i) {
  var start = i;
  var interpolations = [];
  var wasIdent = undefined;
  var wasInt = false;
  var l = undefined;

  if (i >= tokensLength) return 0;

  // Check if token is part of an identifier starting with `_`:
  if (tokens[i].type === TokenType.LowLine) return checkIdentLowLine(i);

  if (tokens[i].type === TokenType.HyphenMinus && tokens[i + 1].type === TokenType.DecimalNumber) return 0;

  // If token is a character, `-`, `$` or `*`, skip it & continue:
  if (l = _checkIdent(i)) i += l;else return 0;

  // Remember if previous token's type was identifier:
  wasIdent = tokens[i - 1].type === TokenType.Identifier;

  while (i < tokensLength) {
    l = _checkIdent(i);

    if (!l) break;

    wasIdent = true;
    i += l;
  }

  if (!wasIdent && !wasInt && tokens[start].type !== TokenType.Asterisk) return 0;

  tokens[start].ident_last = i - 1;
  if (interpolations.length) tokens[start].interpolations = interpolations;

  return i - start;
}

function _checkIdent(i) {
  if (tokens[i].type === TokenType.HyphenMinus || tokens[i].type === TokenType.Identifier || tokens[i].type === TokenType.DollarSign || tokens[i].type === TokenType.LowLine || tokens[i].type === TokenType.DecimalNumber || tokens[i].type === TokenType.Asterisk) return 1;
  return 0;
}

/**
 * Check if token is part of an identifier starting with `_`
 * @param {Number} i Token's index number
 * @returns {Number} Length of the identifier
 */
function checkIdentLowLine(i) {
  var start = i;

  if (i++ >= tokensLength) return 0;

  for (; i < tokensLength; i++) {
    if (tokens[i].type !== TokenType.HyphenMinus && tokens[i].type !== TokenType.DecimalNumber && tokens[i].type !== TokenType.LowLine && tokens[i].type !== TokenType.Identifier) break;
  }

  // Save index number of the last token of the identifier:
  tokens[start].ident_last = i - 1;

  return i - start;
}

/**
 * Get node with an identifier
 * @returns {Array} `['ident', x]` where `x` is identifier's name
 */
function getIdent() {
  var startPos = pos;
  var x = joinValues(pos, tokens[pos].ident_last);

  pos = tokens[pos].ident_last + 1;

  var token = tokens[startPos];
  return newNode(NodeType.IdentType, x, token.ln, token.col);
}

function checkIdentOrInterpolation(i) {
  var start = i;
  var l = undefined;

  while (i < tokensLength) {
    if (l = checkInterpolation(i) || checkIdent(i)) i += l;else break;
  }

  return i - start;
}

function getIdentOrInterpolation() {
  var x = [];

  while (pos < tokensLength) {
    if (checkInterpolation(pos)) x.push(getInterpolation());else if (checkIdent(pos)) x.push(getIdent());else break;
  }

  return x;
}

/**
 * Check if token is part of `!important` word
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkImportant(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength || tokens[i++].type !== TokenType.ExclamationMark) return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].value === 'important') {
    tokens[start].importantEnd = i;
    return i - start + 1;
  } else {
    return 0;
  }
}

/**
 * Get node with `!important` word
 * @returns {Array} `['important', sc]` where `sc` is optional whitespace
 */
function getImportant() {
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = joinValues(pos, token.importantEnd);

  pos = token.importantEnd + 1;

  return newNode(NodeType.ImportantType, content, line, column);
}

/**
 * Check if token is part of an included mixin (`@include` or `@extend`
 *      directive).
 * @param {Number} i Token's index number
 * @returns {Number} Length of the included mixin
 */
function checkInclude(i) {
  var l;

  if (i >= tokensLength) return 0;

  if (l = checkInclude1(i)) tokens[i].include_type = 1;else if (l = checkInclude2(i)) tokens[i].include_type = 2;else if (l = checkInclude3(i)) tokens[i].include_type = 3;else if (l = checkInclude4(i)) tokens[i].include_type = 4;

  return l;
}

/**
 * Check if token is part of `!global` word
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkGlobal(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength || tokens[i++].type !== TokenType.ExclamationMark) return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].value === 'global') {
    tokens[start].globalEnd = i;
    return i - start + 1;
  } else {
    return 0;
  }
}

/**
 * Get node with `!global` word
 */
function getGlobal() {
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = joinValues(pos, token.globalEnd);

  pos = token.globalEnd + 1;

  return newNode(NodeType.GlobalType, content, line, column);
}

/**
 * Get node with included mixin
 * @returns {Array} `['include', x]`
 */
function getInclude() {
  switch (tokens[pos].include_type) {
    case 1:
      return getInclude1();
    case 2:
      return getInclude2();
    case 3:
      return getInclude3();
    case 4:
      return getInclude4();
  }
}

/**
 * Check if token is part of an included mixin like `@include nani(foo) {...}`
 * @param {Number} i Token's index number
 * @returns {Number} Length of the include
 */
function checkInclude1(i) {
  var start = i;
  var l = undefined;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (tokens[start + 1].value !== 'include') return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkArguments(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkBlock(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with included mixin like `@include nani(foo) {...}`
 * @returns {Array} `['include', ['atkeyword', x], sc, ['selector', y], sc,
 *      ['arguments', z], sc, ['block', q], sc` where `x` is `include` or
 *      `extend`, `y` is mixin's identifier (selector), `z` are arguments
 *      passed to the mixin, `q` is block passed to the mixin and `sc`
 *      are optional whitespaces
 */
function getInclude1() {
  var startPos = pos;
  var x = [].concat(getAtkeyword(), getSC(), getIdentOrInterpolation(), getSC(), getArguments(), getSC(), getBlock());

  var token = tokens[startPos];
  return newNode(NodeType.IncludeType, x, token.ln, token.col);
}

/**
 * Check if token is part of an included mixin like `@include nani(foo)`
 * @param {Number} i Token's index number
 * @returns {Number} Length of the include
 */
function checkInclude2(i) {
  var start = i;
  var l = undefined;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (tokens[start + 1].value !== 'include') return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkArguments(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with included mixin like `@include nani(foo)`
 * @returns {Array} `['include', ['atkeyword', x], sc, ['selector', y], sc,
 *      ['arguments', z], sc]` where `x` is `include` or `extend`, `y` is
 *      mixin's identifier (selector), `z` are arguments passed to the
 *      mixin and `sc` are optional whitespaces
 */
function getInclude2() {
  var startPos = pos;
  var x = [].concat(getAtkeyword(), getSC(), getIdentOrInterpolation(), getSC(), getArguments());

  var token = tokens[startPos];
  return newNode(NodeType.IncludeType, x, token.ln, token.col);
}

/**
 * Check if token is part of an included mixin with a content block passed
 *      as an argument (e.g. `@include nani {...}`)
 * @param {Number} i Token's index number
 * @returns {Number} Length of the mixin
 */
function checkInclude3(i) {
  var start = i;
  var l = undefined;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (tokens[start + 1].value !== 'include') return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkBlock(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with an included mixin with a content block passed
 *      as an argument (e.g. `@include nani {...}`)
 * @returns {Array} `['include', x]`
 */
function getInclude3() {
  var startPos = pos;
  var x = [].concat(getAtkeyword(), getSC(), getIdentOrInterpolation(), getSC(), getBlock());

  var token = tokens[startPos];
  return newNode(NodeType.IncludeType, x, token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkInclude4(i) {
  var start = i;
  var l = undefined;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (tokens[start + 1].value !== 'include') return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  return i - start;
}

/**
 * @returns {Array} `['include', x]`
 */
function getInclude4() {
  var startPos = pos;
  var x = [].concat(getAtkeyword(), getSC(), getIdentOrInterpolation());

  var token = tokens[startPos];
  return newNode(NodeType.IncludeType, x, token.ln, token.col);
}

/**
 * Check if token is part of an interpolated variable (e.g. `#{$nani}`).
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkInterpolation(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (tokens[i].type !== TokenType.NumberSign || !tokens[i + 1] || tokens[i + 1].type !== TokenType.LeftCurlyBracket) return 0;

  i += 2;

  if (l = checkSC(i)) i += l;

  if (l = checkVariable(i)) tokens[i].interpolation_child = 1;else if (l = checkFunction(i)) tokens[i].interpolation_child = 2;else return 0;

  i += l;

  if (l = checkSC(i)) i += l;

  return tokens[i].type === TokenType.RightCurlyBracket ? i - start + 1 : 0;
}

/**
 * Get node with an interpolated variable
 * @returns {Array} `['interpolation', x]`
 */
function getInterpolation() {
  var startPos = pos;
  var x = [];
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  // Skip `#{`:
  pos += 2;

  x = x.concat(getSC());

  var childType = tokens[pos].interpolation_child;
  if (childType === 1) x.push(getVariable());else if (childType === 2) x.push(getFunction());

  x = x.concat(getSC());

  var end = getLastPosition(x, line, column, 1);

  // Skip `}`:
  pos++;

  return newNode(NodeType.InterpolationType, x, token.ln, token.col, end);
}

function checkKeyframesBlock(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkKeyframesSelector(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkBlock(i)) i += l;else return 0;

  return i - start;
}

function getKeyframesBlock() {
  var type = NodeType.RulesetType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [].concat([getKeyframesSelector()], getSC(), [getBlock()]);

  return newNode(type, content, line, column);
}

function checkKeyframesBlocks(i) {
  var start = i;
  var l = undefined;

  if (i < tokensLength && tokens[i].type === TokenType.LeftCurlyBracket) i++;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkKeyframesBlock(i)) i += l;else return 0;

  while (tokens[i].type !== TokenType.RightCurlyBracket) {
    if (l = checkSC(i)) i += l;else if (l = checkKeyframesBlock(i)) i += l;else break;
  }

  if (i < tokensLength && tokens[i].type === TokenType.RightCurlyBracket) i++;else return 0;

  return i - start;
}

function getKeyframesBlocks() {
  var type = NodeType.BlockType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];
  var keyframesBlocksEnd = token.right;

  // Skip `{`.
  pos++;

  while (pos < keyframesBlocksEnd) {
    if (checkSC(pos)) content = content.concat(getSC());else if (checkKeyframesBlock(pos)) content.push(getKeyframesBlock());
  }

  var end = getLastPosition(content, line, column, 1);

  // Skip `}`.
  pos++;

  return newNode(type, content, line, column, end);
}

/**
 * Check if token is part of a @keyframes rule.
 * @param {Number} i Token's index number
 * @return {Number} Length of the @keyframes rule
 */
function checkKeyframesRule(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  var atruleName = joinValues2(i - l, l);
  if (atruleName.indexOf('keyframes') === -1) return 0;

  if (l = checkSC(i)) i += l;else return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkKeyframesBlocks(i)) i += l;else return 0;

  return i - start;
}

/**
 * @return {Node}
 */
function getKeyframesRule() {
  var type = NodeType.AtruleType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [].concat([getAtkeyword()], getSC(), getIdentOrInterpolation(), getSC(), [getKeyframesBlocks()]);

  return newNode(type, content, line, column);
}

function checkKeyframesSelector(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkIdent(i)) {
    // Valid selectors are only `from` and `to`.
    var selector = joinValues2(i, l);
    if (selector !== 'from' && selector !== 'to') return 0;

    i += l;
    tokens[start].keyframesSelectorType = 1;
  } else if (l = checkPercentage(i)) {
    i += l;
    tokens[start].keyframesSelectorType = 2;
  } else if (l = checkInterpolation(i)) {
    i += l;
    tokens[start].keyframesSelectorType = 3;
  } else {
    return 0;
  }

  return i - start;
}

function getKeyframesSelector() {
  var keyframesSelectorType = NodeType.KeyframesSelectorType;
  var selectorType = NodeType.SelectorType;

  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  if (token.keyframesSelectorType === 1) {
    content.push(getIdent());
  } else if (token.keyframesSelectorType === 2) {
    content.push(getPercentage());
  } else {
    content.push(getInterpolation());
  }

  var keyframesSelector = newNode(keyframesSelectorType, content, line, column);
  return newNode(selectorType, [keyframesSelector], line, column);
}

/**
 * Check if token is part of a loop.
 * @param {Number} i Token's index number
 * @returns {Number} Length of the loop
 */
function checkLoop(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkAtkeyword(i)) i += l;else return 0;

  if (['for', 'each', 'while'].indexOf(tokens[start + 1].value) < 0) return 0;

  while (i < tokensLength) {
    if (l = checkBlock(i)) {
      i += l;
      break;
    } else if (l = checkVariable(i) || checkNumber(i) || checkInterpolation(i) || checkIdent(i) || checkSC(i) || checkOperator(i) || checkCombinator(i) || checkString(i)) i += l;else return 0;
  }

  return i - start;
}

/**
 * Get node with a loop.
 * @returns {Array} `['loop', x]`
 */
function getLoop() {
  var startPos = pos;
  var x = [];

  x.push(getAtkeyword());

  while (pos < tokensLength) {
    if (checkBlock(pos)) {
      x.push(getBlock());
      break;
    } else if (checkVariable(pos)) x.push(getVariable());else if (checkNumber(pos)) x.push(getNumber());else if (checkInterpolation(pos)) x.push(getInterpolation());else if (checkIdent(pos)) x.push(getIdent());else if (checkOperator(pos)) x.push(getOperator());else if (checkCombinator(pos)) x.push(getCombinator());else if (checkSC(pos)) x = x.concat(getSC());else if (checkString(pos)) x.push(getString());
  }

  var token = tokens[startPos];
  return newNode(NodeType.LoopType, x, token.ln, token.col);
}

/**
 * Check if token is part of a mixin
 * @param {Number} i Token's index number
 * @returns {Number} Length of the mixin
 */
function checkMixin(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if ((l = checkAtkeyword(i)) && tokens[i + 1].value === 'mixin') i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkArguments(i)) i += l;

  if (l = checkSC(i)) i += l;

  if (l = checkBlock(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with a mixin
 * @returns {Array} `['mixin', x]`
 */
function getMixin() {
  var startPos = pos;
  var x = [getAtkeyword()];

  x = x.concat(getSC());

  if (checkIdentOrInterpolation(pos)) x = x.concat(getIdentOrInterpolation());

  x = x.concat(getSC());

  if (checkArguments(pos)) x.push(getArguments());

  x = x.concat(getSC());

  if (checkBlock(pos)) x.push(getBlock());

  var token = tokens[startPos];
  return newNode(NodeType.MixinType, x, token.ln, token.col);
}

/**
 * Check if token is a namespace sign (`|`)
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is `|`, `0` if not
 */
function checkNamespace(i) {
  return i < tokensLength && tokens[i].type === TokenType.VerticalLine ? 1 : 0;
}

/**
 * Get node with a namespace sign
 * @returns {Array} `['namespace']`
 */
function getNamespace() {
  var startPos = pos;

  pos++;

  var token = tokens[startPos];
  return newNode(NodeType.NamespaceType, '|', token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkNmName2(i) {
  if (tokens[i].type === TokenType.Identifier) return 1;else if (tokens[i].type !== TokenType.DecimalNumber) return 0;

  i++;

  return i < tokensLength && tokens[i].type === TokenType.Identifier ? 2 : 1;
}

/**
 * @returns {String}
 */
function getNmName2() {
  var s = tokens[pos].value;

  if (tokens[pos++].type === TokenType.DecimalNumber && pos < tokensLength && tokens[pos].type === TokenType.Identifier) s += tokens[pos++].value;

  return s;
}

/**
 * Check if token is part of a number
 * @param {Number} i Token's index number
 * @returns {Number} Length of number
 */
function checkNumber(i) {
  if (i >= tokensLength) return 0;

  if (tokens[i].number_l) return tokens[i].number_l;

  // `10`:
  if (i < tokensLength && tokens[i].type === TokenType.DecimalNumber && (!tokens[i + 1] || tokens[i + 1] && tokens[i + 1].type !== TokenType.FullStop)) return tokens[i].number_l = 1, tokens[i].number_l;

  // `10.`:
  if (i < tokensLength && tokens[i].type === TokenType.DecimalNumber && tokens[i + 1] && tokens[i + 1].type === TokenType.FullStop && (!tokens[i + 2] || tokens[i + 2].type !== TokenType.DecimalNumber)) return tokens[i].number_l = 2, tokens[i].number_l;

  // `.10`:
  if (i < tokensLength && tokens[i].type === TokenType.FullStop && tokens[i + 1].type === TokenType.DecimalNumber) return tokens[i].number_l = 2, tokens[i].number_l;

  // `10.10`:
  if (i < tokensLength && tokens[i].type === TokenType.DecimalNumber && tokens[i + 1] && tokens[i + 1].type === TokenType.FullStop && tokens[i + 2] && tokens[i + 2].type === TokenType.DecimalNumber) return tokens[i].number_l = 3, tokens[i].number_l;

  return 0;
}

/**
 * Get node with number
 * @returns {Array} `['number', x]` where `x` is a number converted
 *      to string.
 */
function getNumber() {
  var s = '';
  var startPos = pos;
  var l = tokens[pos].number_l;

  for (var j = 0; j < l; j++) {
    s += tokens[pos + j].value;
  }

  pos += l;

  var token = tokens[startPos];
  return newNode(NodeType.NumberType, s, token.ln, token.col);
}

/**
 * Check if token is an operator (`/`, `%`, `,`, `:` or `=`).
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is an operator, otherwise `0`
 */
function checkOperator(i) {
  if (i >= tokensLength) return 0;

  switch (tokens[i].type) {
    case TokenType.Solidus:
    case TokenType.PercentSign:
    case TokenType.Comma:
    case TokenType.Colon:
    case TokenType.EqualsSign:
    case TokenType.EqualitySign:
    case TokenType.InequalitySign:
    case TokenType.LessThanSign:
    case TokenType.GreaterThanSign:
    case TokenType.Asterisk:
      return 1;
  }

  return 0;
}

/**
 * Get node with an operator
 * @returns {Array} `['operator', x]` where `x` is an operator converted
 *      to string.
 */
function getOperator() {
  var startPos = pos;
  var x = tokens[pos++].value;

  var token = tokens[startPos];
  return newNode(NodeType.OperatorType, x, token.ln, token.col);
}

/**
 * Check if token is part of `!optional` word
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkOptional(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength || tokens[i++].type !== TokenType.ExclamationMark) return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].value === 'optional') {
    tokens[start].optionalEnd = i;
    return i - start + 1;
  } else {
    return 0;
  }
}

/**
 * Get node with `!optional` word
 */
function getOptional() {
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = joinValues(pos, token.optionalEnd);

  pos = token.optionalEnd + 1;

  return newNode(NodeType.OptionalType, content, line, column);
}

/**
 * Check if token is part of text inside parentheses, e.g. `(1)`
 * @param {Number} i Token's index number
 * @return {Number}
 */
function checkParentheses(i) {
  if (i >= tokensLength || tokens[i].type !== TokenType.LeftParenthesis) return 0;

  return tokens[i].right - i + 1;
}

/**
 * Get node with text inside parentheses, e.g. `(1)`
 * @return {Node}
 */
function getParentheses() {
  var type = NodeType.ParenthesesType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;

  pos++;

  var tsets = getTsets();
  var end = getLastPosition(tsets, line, column, 1);
  pos++;

  return newNode(type, tsets, line, column, end);
}

/**
 * Check if token is a parent selector (`&`).
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkParentSelector(i) {
  return i < tokensLength && tokens[i].type === TokenType.Ampersand ? 1 : 0;
}

/**
 * Get node with a parent selector
 */
function getParentSelector() {
  var startPos = pos;

  pos++;

  var token = tokens[startPos];
  return newNode(NodeType.ParentSelectorType, '&', token.ln, token.col);
}

function checkParentSelectorExtension(i) {
  if (i >= tokensLength) return 0;

  var start = i;
  var l = undefined;

  while (i < tokensLength) {
    if (l = checkNumber(i) || checkIdent(i)) i += l;else break;
  }

  return i - start;
}

function getParentSelectorExtension() {
  var type = NodeType.ParentSelectorExtensionType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  while (pos < tokensLength) {
    if (checkNumber(pos)) content.push(getNumber());else if (checkIdent(pos)) content.push(getIdent());else break;
  }

  return newNode(type, content, line, column);
}

function checkParentSelectorWithExtension(i) {
  if (i >= tokensLength) return 0;

  var start = i;
  var l = undefined;

  if (l = checkParentSelector(i)) i += l;else return 0;

  if (l = checkParentSelectorExtension(i)) i += l;

  return i - start;
}

function getParentSelectorWithExtension() {
  var content = [getParentSelector()];

  if (checkParentSelectorExtension(pos)) content.push(getParentSelectorExtension());

  return content;
}

/**
 * Check if token is part of a number with percent sign (e.g. `10%`)
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkPercentage(i) {
  var x;

  if (i >= tokensLength) return 0;

  x = checkNumber(i);

  if (!x || i + x >= tokensLength) return 0;

  return tokens[i + x].type === TokenType.PercentSign ? x + 1 : 0;
}

/**
 * Get node of number with percent sign
 * @returns {Array} `['percentage', ['number', x]]` where `x` is a number
 *      (without percent sign) converted to string.
 */
function getPercentage() {
  var startPos = pos;
  var x = [getNumber()];
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  var end = getLastPosition(x, line, column, 1);
  pos++;

  return newNode(NodeType.PercentageType, x, token.ln, token.col, end);
}

/**
 * Check if token is part of a placeholder selector (e.g. `%abc`).
 * @param {Number} i Token's index number
 * @returns {Number} Length of the selector
 */
function checkPlaceholder(i) {
  var l;

  if (i >= tokensLength) return 0;

  if (tokens[i].placeholder_l) return tokens[i].placeholder_l;

  if (tokens[i].type === TokenType.PercentSign && (l = checkIdentOrInterpolation(i + 1))) {
    tokens[i].placeholder_l = l + 1;
    return l + 1;
  } else return 0;
}

/**
 * Get node with a placeholder selector
 * @returns {Array} `['placeholder', ['ident', x]]` where x is a placeholder's
 *      identifier (without `%`, e.g. `abc`).
 */
function getPlaceholder() {
  var startPos = pos;

  pos++;

  var x = getIdentOrInterpolation();

  var token = tokens[startPos];
  return newNode(NodeType.PlaceholderType, x, token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkProgid(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (joinValues2(i, 6) === 'progid:DXImageTransform.Microsoft.') i += 6;else return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].type === TokenType.LeftParenthesis) {
    tokens[start].progid_end = tokens[i].right;
    i = tokens[i].right + 1;
  } else return 0;

  return i - start;
}

/**
 * @returns {Array}
 */
function getProgid() {
  var startPos = pos;
  var progid_end = tokens[pos].progid_end;
  var x = joinValues(pos, progid_end);

  pos = progid_end + 1;

  var token = tokens[startPos];
  return newNode(NodeType.ProgidType, x, token.ln, token.col);
}

/**
 * Check if token is part of a property
 * @param {Number} i Token's index number
 * @returns {Number} Length of the property
 */
function checkProperty(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkVariable(i) || checkIdentOrInterpolation(i)) i += l;else return 0;

  return i - start;
}

/**
 * Get node with a property
 * @returns {Array} `['property', x]`
 */
function getProperty() {
  var startPos = pos;
  var x = [];

  if (checkVariable(pos)) {
    x.push(getVariable());
  } else {
    x = x.concat(getIdentOrInterpolation());
  }

  var token = tokens[startPos];
  return newNode(NodeType.PropertyType, x, token.ln, token.col);
}

/**
 * Check if token is a colon
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is a colon, otherwise `0`
 */
function checkPropertyDelim(i) {
  return i < tokensLength && tokens[i].type === TokenType.Colon ? 1 : 0;
}

/**
 * Get node with a colon
 * @returns {Array} `['propertyDelim']`
 */
function getPropertyDelim() {
  var startPos = pos;

  pos++;

  var token = tokens[startPos];
  return newNode(NodeType.PropertyDelimType, ':', token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkPseudo(i) {
  return checkPseudoe(i) || checkPseudoc(i);
}

/**
 * @returns {Array}
 */
function getPseudo() {
  if (checkPseudoe(pos)) return getPseudoe();
  if (checkPseudoc(pos)) return getPseudoc();
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkPseudoe(i) {
  var l;

  if (i >= tokensLength || tokens[i++].type !== TokenType.Colon || i >= tokensLength || tokens[i++].type !== TokenType.Colon) return 0;

  return (l = checkIdentOrInterpolation(i)) ? l + 2 : 0;
}

/**
 * @returns {Array}
 */
function getPseudoe() {
  var startPos = pos;

  pos += 2;

  var x = getIdentOrInterpolation();

  var token = tokens[startPos];
  return newNode(NodeType.PseudoeType, x, token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkPseudoc(i) {
  var l;

  if (i >= tokensLength || tokens[i].type !== TokenType.Colon) return 0;

  if (l = checkPseudoClass3(i)) tokens[i].pseudoClassType = 3;else if (l = checkPseudoClass4(i)) tokens[i].pseudoClassType = 4;else if (l = checkPseudoClass5(i)) tokens[i].pseudoClassType = 5;else if (l = checkPseudoClass1(i)) tokens[i].pseudoClassType = 1;else if (l = checkPseudoClass2(i)) tokens[i].pseudoClassType = 2;else if (l = checkPseudoClass6(i)) tokens[i].pseudoClassType = 6;else return 0;

  return l;
}

/**
 * @returns {Array}
 */
function getPseudoc() {
  var childType = tokens[pos].pseudoClassType;
  if (childType === 1) return getPseudoClass1();
  if (childType === 2) return getPseudoClass2();
  if (childType === 3) return getPseudoClass3();
  if (childType === 4) return getPseudoClass4();
  if (childType === 5) return getPseudoClass5();
  if (childType === 6) return getPseudoClass6();
}

/**
 * (-) `:not(panda)`
 */
function checkPseudoClass1(i) {
  var start = i;

  // Skip `:`.
  i++;

  if (i >= tokensLength) return 0;

  var l = undefined;
  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (i >= tokensLength || tokens[i].type !== TokenType.LeftParenthesis) return 0;

  var right = tokens[i].right;

  // Skip `(`.
  i++;

  if (l = checkSelectorsGroup(i)) i += l;else return 0;

  if (i !== right) return 0;

  return right - start + 1;
}

/**
 * (-) `:not(panda)`
 */
function getPseudoClass1() {
  var type = NodeType.PseudocType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  // Skip `:`.
  pos++;

  content = content.concat(getIdentOrInterpolation());

  {
    var _type = NodeType.ArgumentsType;
    var _token = tokens[pos];
    var _line = _token.ln;
    var _column = _token.col;

    // Skip `(`.
    pos++;

    var selectors = getSelectorsGroup();
    var end = getLastPosition(selectors, _line, _column, 1);
    var args = newNode(_type, selectors, _line, _column, end);
    content.push(args);

    // Skip `)`.
    pos++;
  }

  return newNode(type, content, line, column);
}

/**
 * (1) `:nth-child(odd)`
 * (2) `:nth-child(even)`
 * (3) `:lang(de-DE)`
 */
function checkPseudoClass2(i) {
  var start = i;
  var l = 0;

  // Skip `:`.
  i++;

  if (i >= tokensLength) return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (i >= tokensLength || tokens[i].type !== TokenType.LeftParenthesis) return 0;

  var right = tokens[i].right;

  // Skip `(`.
  i++;

  if (l = checkSC(i)) i += l;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (i !== right) return 0;

  return i - start + 1;
}

function getPseudoClass2() {
  var type = NodeType.PseudocType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  // Skip `:`.
  pos++;

  content = content.concat(getIdentOrInterpolation());

  var l = tokens[pos].ln;
  var c = tokens[pos].col;
  var value = [];

  // Skip `(`.
  pos++;

  value = value.concat(getSC()).concat(getIdentOrInterpolation()).concat(getSC());

  var end = getLastPosition(value, l, c, 1);
  var args = newNode(NodeType.ArgumentsType, value, l, c, end);
  content.push(args);

  // Skip `)`.
  pos++;

  return newNode(type, content, line, column);
}

/**
 * (-) `:nth-child(-3n + 2)`
 */
function checkPseudoClass3(i) {
  var start = i;
  var l = 0;

  // Skip `:`.
  i++;

  if (i >= tokensLength) return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (i >= tokensLength || tokens[i].type !== TokenType.LeftParenthesis) return 0;

  var right = tokens[i].right;

  // Skip `(`.
  i++;

  if (l = checkSC(i)) i += l;

  if (l = checkUnary(i)) i += l;
  if (i >= tokensLength) return 0;
  if (tokens[i].type === TokenType.DecimalNumber) i++;

  if (i >= tokensLength) return 0;
  if (tokens[i].value === 'n') i++;else return 0;

  if (l = checkSC(i)) i += l;

  if (i >= tokensLength) return 0;
  if (tokens[i].value === '+' || tokens[i].value === '-') i++;else return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].type === TokenType.DecimalNumber) i++;else return 0;

  if (l = checkSC(i)) i += l;

  if (i !== right) return 0;

  return i - start + 1;
}

function getPseudoClass3() {
  var type = NodeType.PseudocType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;

  // Skip `:`.
  pos++;

  var content = getIdentOrInterpolation();

  var l = tokens[pos].ln;
  var c = tokens[pos].col;
  var value = [];

  // Skip `(`.
  pos++;

  if (checkUnary(pos)) value.push(getUnary());
  if (checkNumber(pos)) value.push(getNumber());

  {
    var _l = tokens[pos].ln;
    var _c = tokens[pos].col;
    var _content = tokens[pos].value;
    var ident = newNode(NodeType.IdentType, _content, _l, _c);
    value.push(ident);
    pos++;
  }

  value = value.concat(getSC());
  if (checkUnary(pos)) value.push(getUnary());
  value = value.concat(getSC());
  if (checkNumber(pos)) value.push(getNumber());
  value = value.concat(getSC());

  var end = getLastPosition(value, l, c, 1);
  var args = newNode(NodeType.ArgumentsType, value, l, c, end);
  content.push(args);

  // Skip `)`.
  pos++;

  return newNode(type, content, line, column);
}

/**
 * (-) `:nth-child(-3n)`
 */
function checkPseudoClass4(i) {
  var start = i;
  var l = 0;

  // Skip `:`.
  i++;

  if (i >= tokensLength) return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (i >= tokensLength) return 0;
  if (tokens[i].type !== TokenType.LeftParenthesis) return 0;

  var right = tokens[i].right;

  // Skip `(`.
  i++;

  if (l = checkSC(i)) i += l;

  if (l = checkUnary(i)) i += l;
  if (tokens[i].type === TokenType.DecimalNumber) i++;

  if (tokens[i].value === 'n') i++;else return 0;

  if (l = checkSC(i)) i += l;

  if (i !== right) return 0;

  return i - start + 1;
}

function getPseudoClass4() {
  var type = NodeType.PseudocType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;

  // Skip `:`.
  pos++;

  var content = getIdentOrInterpolation();

  var l = tokens[pos].ln;
  var c = tokens[pos].col;
  var value = [];

  // Skip `(`.
  pos++;

  value = value.concat(getSC());

  if (checkUnary(pos)) value.push(getUnary());
  if (checkNumber(pos)) value.push(getNumber());
  if (checkIdent(pos)) value.push(getIdent());
  value = value.concat(getSC());

  var end = getLastPosition(value, l, c, 1);
  var args = newNode(NodeType.ArgumentsType, value, l, c, end);
  content.push(args);

  // Skip `)`.
  pos++;

  return newNode(type, content, line, column);
}

/**
 * (-) `:nth-child(+8)`
 */
function checkPseudoClass5(i) {
  var start = i;
  var l = 0;

  // Skip `:`.
  i++;

  if (i >= tokensLength) return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  if (i >= tokensLength) return 0;
  if (tokens[i].type !== TokenType.LeftParenthesis) return 0;

  var right = tokens[i].right;

  // Skip `(`.
  i++;

  if (l = checkSC(i)) i += l;

  if (l = checkUnary(i)) i += l;
  if (tokens[i].type === TokenType.DecimalNumber) i++;else return 0;

  if (l = checkSC(i)) i += l;

  if (i !== right) return 0;

  return i - start + 1;
}

function getPseudoClass5() {
  var type = NodeType.PseudocType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;

  // Skip `:`.
  pos++;

  var content = getIdentOrInterpolation();

  var l = tokens[pos].ln;
  var c = tokens[pos].col;
  var value = [];

  // Skip `(`.
  pos++;

  if (checkUnary(pos)) value.push(getUnary());
  if (checkNumber(pos)) value.push(getNumber());
  value = value.concat(getSC());

  var end = getLastPosition(value, l, c, 1);
  var args = newNode(NodeType.ArgumentsType, value, l, c, end);
  content.push(args);

  // Skip `)`.
  pos++;

  return newNode(type, content, line, column);
}

/**
 * (-) `:checked`
 */
function checkPseudoClass6(i) {
  var start = i;
  var l = 0;

  // Skip `:`.
  i++;

  if (i >= tokensLength) return 0;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  return i - start;
}

function getPseudoClass6() {
  var type = NodeType.PseudocType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;

  // Skip `:`.
  pos++;

  var content = getIdentOrInterpolation();

  return newNode(type, content, line, column);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkRuleset(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkSelectorsGroup(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkBlock(i)) i += l;else return 0;

  return i - start;
}

function getRuleset() {
  var type = NodeType.RulesetType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  content = content.concat(getSelectorsGroup());
  content = content.concat(getSC());
  content.push(getBlock());

  return newNode(type, content, line, column);
}

/**
 * Check if token is marked as a space (if it's a space or a tab
 *      or a line break).
 * @param {Number} i
 * @returns {Number} Number of spaces in a row starting with the given token.
 */
function checkS(i) {
  return i < tokensLength && tokens[i].ws ? tokens[i].ws_last - i + 1 : 0;
}

/**
 * Get node with spaces
 * @returns {Array} `['s', x]` where `x` is a string containing spaces
 */
function getS() {
  var startPos = pos;
  var x = joinValues(pos, tokens[pos].ws_last);

  pos = tokens[pos].ws_last + 1;

  var token = tokens[startPos];
  return newNode(NodeType.SType, x, token.ln, token.col);
}

/**
 * Check if token is a space or a comment.
 * @param {Number} i Token's index number
 * @returns {Number} Number of similar (space or comment) tokens
 *      in a row starting with the given token.
 */
function checkSC(i) {
  if (i >= tokensLength) return 0;

  var l = undefined;
  var lsc = 0;

  while (i < tokensLength) {
    if (!(l = checkS(i)) && !(l = checkCommentML(i)) && !(l = checkCommentSL(i))) break;
    i += l;
    lsc += l;
  }

  return lsc || 0;
}

/**
 * Get node with spaces and comments
 * @returns {Array} Array containing nodes with spaces (if there are any)
 *      and nodes with comments (if there are any):
 *      `[['s', x]*, ['comment', y]*]` where `x` is a string of spaces
 *      and `y` is a comment's text (without `/*` and `* /`).
 */
function getSC() {
  var sc = [];

  if (pos >= tokensLength) return sc;

  while (pos < tokensLength) {
    if (checkS(pos)) sc.push(getS());else if (checkCommentML(pos)) sc.push(getCommentML());else if (checkCommentSL(pos)) sc.push(getCommentSL());else break;
  }

  return sc;
}

/**
 * Check if token is part of a hexadecimal number (e.g. `#fff`) inside
 *      a simple selector
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkShash(i) {
  var l;

  if (i >= tokensLength || tokens[i].type !== TokenType.NumberSign) return 0;

  return (l = checkIdentOrInterpolation(i + 1)) ? l + 1 : 0;
}

/**
 * Get node with a hexadecimal number (e.g. `#fff`) inside a simple
 *      selector
 * @returns {Array} `['shash', x]` where `x` is a hexadecimal number
 *      converted to string (without `#`, e.g. `fff`)
 */
function getShash() {
  var startPos = pos;
  var token = tokens[startPos];

  pos++;

  var x = getIdentOrInterpolation();

  return newNode(NodeType.ShashType, x, token.ln, token.col);
}

/**
 * Check if token is part of a string (text wrapped in quotes)
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is part of a string, `0` if not
 */
function checkString(i) {
  return i < tokensLength && (tokens[i].type === TokenType.StringSQ || tokens[i].type === TokenType.StringDQ) ? 1 : 0;
}

/**
 * Get string's node
 * @returns {Array} `['string', x]` where `x` is a string (including
 *      quotes).
 */
function getString() {
  var startPos = pos;
  var x = tokens[pos++].value;

  var token = tokens[startPos];
  return newNode(NodeType.StringType, x, token.ln, token.col);
}

/**
 * Validate stylesheet: it should consist of any number (0 or more) of
 * rulesets (sets of rules with selectors), @-rules, whitespaces or
 * comments.
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkStylesheet(i) {
  var start = i;
  var l = undefined;

  while (i < tokensLength) {
    if (l = checkSC(i) || checkDeclaration(i) || checkDeclDelim(i) || checkInclude(i) || checkExtend(i) || checkMixin(i) || checkLoop(i) || checkConditionalStatement(i) || checkAtrule(i) || checkRuleset(i)) i += l;else throwError(i);
  }

  return i - start;
}

/**
 * @returns {Array} `['stylesheet', x]` where `x` is all stylesheet's
 *      nodes.
 */
function getStylesheet() {
  var startPos = pos;
  var x = [];

  while (pos < tokensLength) {
    if (checkSC(pos)) x = x.concat(getSC());else if (checkRuleset(pos)) x.push(getRuleset());else if (checkInclude(pos)) x.push(getInclude());else if (checkExtend(pos)) x.push(getExtend());else if (checkMixin(pos)) x.push(getMixin());else if (checkLoop(pos)) x.push(getLoop());else if (checkConditionalStatement(pos)) x.push(getConditionalStatement());else if (checkAtrule(pos)) x.push(getAtrule());else if (checkDeclaration(pos)) x.push(getDeclaration());else if (checkDeclDelim(pos)) x.push(getDeclDelim());else throwError();
  }

  var token = tokens[startPos];
  return newNode(NodeType.StylesheetType, x, token.ln, token.col);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkTset(i) {
  return checkVhash(i) || checkOperator(i) || checkAny(i) || checkSC(i) || checkInterpolation(i);
}

/**
 * @returns {Array}
 */
function getTset() {
  if (checkVhash(pos)) return getVhash();else if (checkOperator(pos)) return getOperator();else if (checkAny(pos)) return getAny();else if (checkSC(pos)) return getSC();else if (checkInterpolation(pos)) return getInterpolation();
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkTsets(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  while (l = checkTset(i)) {
    i += l;
  }

  return i - start;
}

/**
 * @returns {Array}
 */
function getTsets() {
  var x = [];
  var t = undefined;

  while (t = getTset()) {
    if (typeof t.content === 'string') x.push(t);else x = x.concat(t);
  }

  return x;
}

/**
 * Check if token is an unary (arithmetical) sign (`+` or `-`)
 * @param {Number} i Token's index number
 * @returns {Number} `1` if token is an unary sign, `0` if not
 */
function checkUnary(i) {
  return i < tokensLength && (tokens[i].type === TokenType.HyphenMinus || tokens[i].type === TokenType.PlusSign) ? 1 : 0;
}

/**
 * Get node with an unary (arithmetical) sign (`+` or `-`)
 * @returns {Array} `['unary', x]` where `x` is an unary sign
 *      converted to string.
 */
function getUnary() {
  var startPos = pos;
  var x = tokens[pos++].value;

  var token = tokens[startPos];
  return newNode(NodeType.OperatorType, x, token.ln, token.col);
}

/**
 * Check if token is part of URI (e.g. `url('/css/styles.css')`)
 * @param {Number} i Token's index number
 * @returns {Number} Length of URI
 */
function checkUri(i) {
  var start = i;

  if (i >= tokensLength || tokens[i++].value !== 'url' || i >= tokensLength || tokens[i].type !== TokenType.LeftParenthesis) return 0;

  return tokens[i].right - start + 1;
}

/**
 * Get node with URI
 * @returns {Array} `['uri', x]` where `x` is URI's nodes (without `url`
 *      and braces, e.g. `['string', ''/css/styles.css'']`).
 */
function getUri() {
  var startPos = pos;
  var uriExcluding = {};
  var uri = undefined;
  var token = undefined;
  var l = undefined;
  var raw = undefined;

  pos += 2;

  uriExcluding[TokenType.Space] = 1;
  uriExcluding[TokenType.Tab] = 1;
  uriExcluding[TokenType.Newline] = 1;
  uriExcluding[TokenType.LeftParenthesis] = 1;
  uriExcluding[TokenType.RightParenthesis] = 1;

  if (checkUri1(pos)) {
    uri = [].concat(getSC()).concat([getString()]).concat(getSC());
  } else {
    uri = [].concat(getSC());
    l = checkExcluding(uriExcluding, pos);
    token = tokens[pos];
    raw = newNode(NodeType.RawType, joinValues(pos, pos + l), token.ln, token.col);

    uri.push(raw);

    pos += l + 1;

    uri = uri.concat(getSC());
  }

  token = tokens[startPos];
  var line = token.ln;
  var column = token.col;
  var end = getLastPosition(uri, line, column, 1);
  pos++;

  return newNode(NodeType.UriType, uri, token.ln, token.col, end);
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkUri1(i) {
  var start = i;
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].type !== TokenType.StringDQ && tokens[i].type !== TokenType.StringSQ) return 0;

  i++;

  if (l = checkSC(i)) i += l;

  return i - start;
}

/**
 * Check if token is part of a value
 * @param {Number} i Token's index number
 * @returns {Number} Length of the value
 */
function checkValue(i) {
  var start = i;
  var l = undefined;
  var s = undefined;
  var _i = undefined;

  while (i < tokensLength) {
    if (checkDeclDelim(i)) break;

    s = checkSC(i);
    _i = i + s;

    if (l = _checkValue(_i)) i += l + s;
    if (!l || checkBlock(i - l)) break;
  }

  return i - start;
}

/**
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function _checkValue(i) {
  return checkInterpolation(i) || checkVariable(i) || checkVhash(i) || checkBlock(i) || checkAtkeyword(i) || checkOperator(i) || checkImportant(i) || checkGlobal(i) || checkDefault(i) || checkProgid(i) || checkAny(i);
}

/**
 * @returns {Array}
 */
function getValue() {
  var startPos = pos;
  var x = [];
  var _pos = undefined;
  var s = undefined;

  while (pos < tokensLength) {
    s = checkSC(pos);
    _pos = pos + s;

    if (checkDeclDelim(_pos)) break;

    if (!_checkValue(_pos)) break;

    if (s) x = x.concat(getSC());
    x.push(_getValue());

    if (checkBlock(_pos)) break;
  }

  var token = tokens[startPos];
  return newNode(NodeType.ValueType, x, token.ln, token.col);
}

/**
 * @returns {Array}
 */
function _getValue() {
  if (checkInterpolation(pos)) return getInterpolation();else if (checkVariable(pos)) return getVariable();else if (checkVhash(pos)) return getVhash();else if (checkBlock(pos)) return getBlock();else if (checkAtkeyword(pos)) return getAtkeyword();else if (checkOperator(pos)) return getOperator();else if (checkImportant(pos)) return getImportant();else if (checkGlobal(pos)) return getGlobal();else if (checkDefault(pos)) return getDefault();else if (checkProgid(pos)) return getProgid();else if (checkAny(pos)) return getAny();
}

/**
 * Check if token is part of a variable
 * @param {Number} i Token's index number
 * @returns {Number} Length of the variable
 */
function checkVariable(i) {
  var l;

  if (i >= tokensLength || tokens[i].type !== TokenType.DollarSign) return 0;

  return (l = checkIdent(i + 1)) ? l + 1 : 0;
}

/**
 * Get node with a variable
 * @returns {Array} `['variable', ['ident', x]]` where `x` is
 *      a variable name.
 */
function getVariable() {
  var startPos = pos;
  var x = [];

  pos++;

  x.push(getIdent());

  var token = tokens[startPos];
  return newNode(NodeType.VariableType, x, token.ln, token.col);
}

/**
 * Check if token is part of a variables list (e.g. `$values...`).
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkVariablesList(i) {
  var d = 0; // Number of dots
  var l = undefined;

  if (i >= tokensLength) return 0;

  if (l = checkVariable(i)) i += l;else return 0;

  while (i < tokensLength && tokens[i].type === TokenType.FullStop) {
    d++;
    i++;
  }

  return d === 3 ? l + d : 0;
}

/**
 * Get node with a variables list
 * @returns {Array} `['variableslist', ['variable', ['ident', x]]]` where
 *      `x` is a variable name.
 */
function getVariablesList() {
  var startPos = pos;
  var x = getVariable();
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  var end = getLastPosition([x], line, column, 3);
  pos += 3;

  return newNode(NodeType.VariablesListType, [x], token.ln, token.col, end);
}

/**
 * Check if token is part of a hexadecimal number (e.g. `#fff`) inside
 *      some value
 * @param {Number} i Token's index number
 * @returns {Number}
 */
function checkVhash(i) {
  var l;

  if (i >= tokensLength || tokens[i].type !== TokenType.NumberSign) return 0;

  return (l = checkNmName2(i + 1)) ? l + 1 : 0;
}

/**
 * Get node with a hexadecimal number (e.g. `#fff`) inside some value
 * @returns {Array} `['vhash', x]` where `x` is a hexadecimal number
 *      converted to string (without `#`, e.g. `'fff'`).
 */
function getVhash() {
  var startPos = pos;
  var x = undefined;
  var token = tokens[startPos];
  var line = token.ln;
  var column = token.col;

  pos++;

  x = getNmName2();
  var end = getLastPosition(x, line, column + 1);
  return newNode(NodeType.VhashType, x, token.ln, token.col, end);
}

module.exports = function (_tokens, context) {
  tokens = _tokens;
  tokensLength = tokens.length;
  pos = 0;

  return contexts[context]();
};

function checkSelectorsGroup(i) {
  if (i >= tokensLength) return 0;

  var start = i;
  var l = undefined;

  if (l = checkSelector(i)) i += l;else return 0;

  while (i < tokensLength) {
    var sb = checkSC(i);
    var c = checkDelim(i + sb);
    if (!c) break;
    var sa = checkSC(i + sb + c);
    if (l = checkSelector(i + sb + c + sa)) i += sb + c + sa + l;else break;
  }

  tokens[start].selectorsGroupEnd = i;
  return i - start;
}

function getSelectorsGroup() {
  var selectorsGroup = [];
  var selectorsGroupEnd = tokens[pos].selectorsGroupEnd;

  selectorsGroup.push(getSelector());

  while (pos < selectorsGroupEnd) {
    selectorsGroup = selectorsGroup.concat(getSC());
    selectorsGroup.push(getDelim());
    selectorsGroup = selectorsGroup.concat(getSC());
    selectorsGroup.push(getSelector());
  }

  return selectorsGroup;
}

function checkSelector(i) {
  var l;

  if (l = checkSelector1(i)) tokens[i].selectorType = 1;else if (l = checkSelector2(i)) tokens[i].selectorType = 2;

  return l;
}

function getSelector() {
  var selectorType = tokens[pos].selectorType;
  if (selectorType === 1) return getSelector1();else return getSelector2();
}

/**
 * Checks for selector which starts with a compound selector.
 */
function checkSelector1(i) {
  if (i >= tokensLength) return 0;

  var start = i;
  var l = undefined;

  if (l = checkCompoundSelector(i)) i += l;else return 0;

  while (i < tokensLength) {
    var s = checkSC(i);
    var c = checkCombinator(i + s);
    if (!s && !c) break;
    if (c) {
      i += s + c;
      s = checkSC(i);
    }

    if (l = checkCompoundSelector(i + s)) i += s + l;else break;
  }

  tokens[start].selectorEnd = i;
  return i - start;
}

function getSelector1() {
  var type = NodeType.SelectorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var selectorEnd = token.selectorEnd;
  var content = getCompoundSelector();

  while (pos < selectorEnd) {
    if (checkSC(pos)) content = content.concat(getSC());else if (checkCombinator(pos)) content.push(getCombinator());else if (checkCompoundSelector(pos)) content = content.concat(getCompoundSelector());
  }

  return newNode(type, content, line, column);
}

/**
 * Checks for a selector that starts with a combinator.
 */
function checkSelector2(i) {
  if (i >= tokensLength) return 0;

  var start = i;
  var l = undefined;

  if (l = checkCombinator(i)) i += l;else return 0;

  while (i < tokensLength) {
    var sb = checkSC(i);
    if (l = checkCompoundSelector(i + sb)) i += sb + l;else break;

    var sa = checkSC(i);
    if (l = checkCombinator(i)) i += sa + l;else break;
  }

  tokens[start].selectorEnd = i;
  return i - start;
}

function getSelector2() {
  var type = NodeType.SelectorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var selectorEnd = token.selectorEnd;
  var content = [getCombinator()];

  while (pos < selectorEnd) {
    if (checkSC(pos)) content = content.concat(getSC());else if (checkCombinator(pos)) content.push(getCombinator());else if (checkCompoundSelector(pos)) content = content.concat(getCompoundSelector());
  }

  return newNode(type, content, line, column);
}

function checkCompoundSelector(i) {
  var l = undefined;

  if (l = checkCompoundSelector1(i)) {
    tokens[i].compoundSelectorType = 1;
  } else if (l = checkCompoundSelector2(i)) {
    tokens[i].compoundSelectorType = 2;
  }

  return l;
}

function getCompoundSelector() {
  var type = tokens[pos].compoundSelectorType;
  if (type === 1) return getCompoundSelector1();
  if (type === 2) return getCompoundSelector2();
}

function checkCompoundSelector1(i) {
  if (i >= tokensLength) return 0;

  var start = i;

  var l = undefined;
  if (l = checkTypeSelector(i) || checkPlaceholder(i) || checkParentSelectorWithExtension(i)) i += l;else return 0;

  while (i < tokensLength) {
    var _l2 = checkShash(i) || checkClass(i) || checkAttributeSelector(i) || checkPseudo(i) || checkPlaceholder(i);
    if (_l2) i += _l2;else break;
  }

  tokens[start].compoundSelectorEnd = i;

  return i - start;
}

function getCompoundSelector1() {
  var sequence = [];
  var compoundSelectorEnd = tokens[pos].compoundSelectorEnd;

  if (checkTypeSelector(pos)) sequence.push(getTypeSelector());else if (checkPlaceholder(pos)) sequence.push(getPlaceholder());else if (checkParentSelectorWithExtension(pos)) sequence = sequence.concat(getParentSelectorWithExtension());

  while (pos < compoundSelectorEnd) {
    if (checkShash(pos)) sequence.push(getShash());else if (checkClass(pos)) sequence.push(getClass());else if (checkAttributeSelector(pos)) sequence.push(getAttributeSelector());else if (checkPseudo(pos)) sequence.push(getPseudo());else if (checkPlaceholder(pos)) sequence.push(getPlaceholder());
  }

  return sequence;
}

function checkCompoundSelector2(i) {
  if (i >= tokensLength) return 0;

  var start = i;

  while (i < tokensLength) {
    var l = checkShash(i) || checkClass(i) || checkAttributeSelector(i) || checkPseudo(i) || checkPlaceholder(i);
    if (l) i += l;else break;
  }

  tokens[start].compoundSelectorEnd = i;

  return i - start;
}

function getCompoundSelector2() {
  var sequence = [];
  var compoundSelectorEnd = tokens[pos].compoundSelectorEnd;

  while (pos < compoundSelectorEnd) {
    if (checkShash(pos)) sequence.push(getShash());else if (checkClass(pos)) sequence.push(getClass());else if (checkAttributeSelector(pos)) sequence.push(getAttributeSelector());else if (checkPseudo(pos)) sequence.push(getPseudo());else if (checkPlaceholder(pos)) sequence.push(getPlaceholder());
  }

  return sequence;
}

function checkTypeSelector(i) {
  if (i >= tokensLength) return 0;

  var start = i;
  var l = undefined;

  if (l = checkNamePrefix(i)) i += l;

  if (tokens[i].type === TokenType.Asterisk) i++;else if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  return i - start;
}

function getTypeSelector() {
  var type = NodeType.TypeSelectorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  if (checkNamePrefix(pos)) content.push(getNamePrefix());
  if (checkIdentOrInterpolation(pos)) content = content.concat(getIdentOrInterpolation());

  return newNode(type, content, line, column);
}

function checkAttributeSelector(i) {
  var l = undefined;
  if (l = checkAttributeSelector1(i)) tokens[i].attributeSelectorType = 1;else if (l = checkAttributeSelector2(i)) tokens[i].attributeSelectorType = 2;

  return l;
}

function getAttributeSelector() {
  var type = tokens[pos].attributeSelectorType;
  if (type === 1) return getAttributeSelector1();else return getAttributeSelector2();
}

/**
 * (1) `[panda=nani]`
 * (2) `[panda='nani']`
 * (3) `[panda='nani' i]`
 *
 */
function checkAttributeSelector1(i) {
  var start = i;

  if (tokens[i].type === TokenType.LeftSquareBracket) i++;else return 0;

  var l = undefined;
  if (l = checkSC(i)) i += l;

  if (l = checkAttributeName(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkAttributeMatch(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkAttributeValue(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (l = checkAttributeFlags(i)) {
    i += l;
    if (l = checkSC(i)) i += l;
  }

  if (tokens[i].type === TokenType.RightSquareBracket) i++;else return 0;

  return i - start;
}

function getAttributeSelector1() {
  var type = NodeType.AttributeSelectorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  // Skip `[`.
  pos++;

  content = content.concat(getSC());
  content.push(getAttributeName());
  content = content.concat(getSC());
  content.push(getAttributeMatch());
  content = content.concat(getSC());
  content.push(getAttributeValue());
  content = content.concat(getSC());

  if (checkAttributeFlags(pos)) {
    content.push(getAttributeFlags());
    content = content.concat(getSC());
  }

  // Skip `]`.
  pos++;

  var end = getLastPosition(content, line, column, 1);
  return newNode(type, content, line, column, end);
}

/**
 * (1) `[panda]`
 */
function checkAttributeSelector2(i) {
  var start = i;

  if (tokens[i].type === TokenType.LeftSquareBracket) i++;else return 0;

  var l = undefined;
  if (l = checkSC(i)) i += l;

  if (l = checkAttributeName(i)) i += l;else return 0;

  if (l = checkSC(i)) i += l;

  if (tokens[i].type === TokenType.RightSquareBracket) i++;else return 0;

  return i - start;
}

function getAttributeSelector2() {
  var type = NodeType.AttributeSelectorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  // Skip `[`.
  pos++;

  content = content.concat(getSC());
  content.push(getAttributeName());
  content = content.concat(getSC());

  // Skip `]`.
  pos++;

  var end = getLastPosition(content, line, column, 1);
  return newNode(type, content, line, column, end);
}

function checkAttributeName(i) {
  var start = i;
  var l = undefined;

  if (l = checkNamePrefix(i)) i += l;

  if (l = checkIdentOrInterpolation(i)) i += l;else return 0;

  return i - start;
}

function getAttributeName() {
  var type = NodeType.AttributeNameType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  if (checkNamePrefix(pos)) content.push(getNamePrefix());
  content = content.concat(getIdentOrInterpolation());

  return newNode(type, content, line, column);
}

function checkAttributeMatch(i) {
  var l = undefined;
  if (l = checkAttributeMatch1(i)) tokens[i].attributeMatchType = 1;else if (l = checkAttributeMatch2(i)) tokens[i].attributeMatchType = 2;

  return l;
}

function getAttributeMatch() {
  var type = tokens[pos].attributeMatchType;
  if (type === 1) return getAttributeMatch1();else return getAttributeMatch2();
}

function checkAttributeMatch1(i) {
  var start = i;

  var type = tokens[i].type;
  if (type === TokenType.Tilde || type === TokenType.VerticalLine || type === TokenType.CircumflexAccent || type === TokenType.DollarSign || type === TokenType.Asterisk) i++;else return 0;

  if (tokens[i].type === TokenType.EqualsSign) i++;else return 0;

  return i - start;
}

function getAttributeMatch1() {
  var type = NodeType.AttributeMatchType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = tokens[pos].value + tokens[pos + 1].value;
  pos += 2;

  return newNode(type, content, line, column);
}

function checkAttributeMatch2(i) {
  if (tokens[i].type === TokenType.EqualsSign) return 1;else return 0;
}

function getAttributeMatch2() {
  var type = NodeType.AttributeMatchType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = '=';

  pos++;
  return newNode(type, content, line, column);
}

function checkAttributeValue(i) {
  return checkString(i) || checkIdentOrInterpolation(i);
}

function getAttributeValue() {
  var type = NodeType.AttributeValueType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  if (checkString(pos)) content.push(getString());else content = content.concat(getIdentOrInterpolation());

  return newNode(type, content, line, column);
}

function checkAttributeFlags(i) {
  return checkIdentOrInterpolation(i);
}

function getAttributeFlags() {
  var type = NodeType.AttributeFlagsType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = getIdentOrInterpolation();

  return newNode(type, content, line, column);
}

function checkNamePrefix(i) {
  if (i >= tokensLength) return 0;

  var l = undefined;
  if (l = checkNamePrefix1(i)) tokens[i].namePrefixType = 1;else if (l = checkNamePrefix2(i)) tokens[i].namePrefixType = 2;

  return l;
}

function getNamePrefix() {
  var type = tokens[pos].namePrefixType;
  if (type === 1) return getNamePrefix1();else return getNamePrefix2();
}

/**
 * (1) `panda|`
 * (2) `panda<comment>|`
 */
function checkNamePrefix1(i) {
  var start = i;
  var l = undefined;

  if (l = checkNamespacePrefix(i)) i += l;else return 0;

  if (l = checkCommentML(i)) i += l;

  if (l = checkNamespaceSeparator(i)) i += l;else return 0;

  return i - start;
}

function getNamePrefix1() {
  var type = NodeType.NamePrefixType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];

  content.push(getNamespacePrefix());

  if (checkCommentML(pos)) content.push(getCommentML());

  content.push(getNamespaceSeparator());

  return newNode(type, content, line, column);
}

/**
 * (1) `|`
 */
function checkNamePrefix2(i) {
  return checkNamespaceSeparator(i);
}

function getNamePrefix2() {
  var type = NodeType.NamePrefixType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [getNamespaceSeparator()];

  return newNode(type, content, line, column);
}

/**
 * (1) `*`
 * (2) `panda`
 */
function checkNamespacePrefix(i) {
  if (i >= tokensLength) return 0;

  var l = undefined;

  if (tokens[i].type === TokenType.Asterisk) return 1;else if (l = checkIdentOrInterpolation(i)) return l;else return 0;
}

function getNamespacePrefix() {
  var type = NodeType.NamespacePrefixType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = [];
  if (checkIdentOrInterpolation(pos)) content = content.concat(getIdentOrInterpolation());

  return newNode(type, content, line, column);
}

/**
 * (1) `|`
 */
function checkNamespaceSeparator(i) {
  if (i >= tokensLength) return 0;

  if (tokens[i].type === TokenType.VerticalLine) return 1;else return 0;
}

function getNamespaceSeparator() {
  var type = NodeType.NamespaceSeparatorType;
  var token = tokens[pos];
  var line = token.ln;
  var column = token.col;
  var content = '|';

  pos++;
  return newNode(type, content, line, column);
}