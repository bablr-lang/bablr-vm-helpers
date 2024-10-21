// import { i } from '@bablr/boot/shorthand.macro';
import { interpolateFragmentChildren, interpolateString } from '@bablr/agast-helpers/template';
import { getRoot, isNull } from '@bablr/agast-helpers/tree';
import { buildLiteralTag as agastBuildLiteralTag } from '@bablr/agast-helpers/builders';
import * as t from '@bablr/agast-helpers/shorthand';
import * as btree from '@bablr/agast-helpers/btree';
import * as l from './languages.js';

const { getPrototypeOf, freeze } = Object;
const { isArray } = Array;

const when = (condition, value) => (condition ? value : { *[Symbol.iterator]() {} });

const isString = (val) => typeof val === 'string';
const isBoolean = (val) => typeof val === 'boolean';

function* repeat(times, ...values) {
  for (let i = 0; i < times; i++) for (const value of values) yield value;
}

function* concat(...iterables) {
  for (const iterable of iterables) yield* iterable;
}

export const buildSeparatedListChildren = (list, ref, sep) => {
  const children = [];
  let first = true;
  for (const _ of list) {
    if (!first && sep) {
      children.push(freeze({ ...sep }));
    }
    children.push(freeze({ ...ref }));
    first = false;
  }
  return children;
};

export const buildReferenceTag = (name, isArray, hasGap) => {
  return t.node(
    l.CSTML,
    'ReferenceTag',
    btree.fromValues(
      concat(
        [t.ref`name`],
        when(isArray, [t.ref`arrayOperatorToken`]),
        when(hasGap, [t.ref`hasGapToken`]),
        [t.ref`sigilToken`],
      ),
    ),
    {
      name: buildIdentifier(name),
      arrayOperatorToken: isArray ? t.s_node(l.CSTML, 'Punctuator', '[]') : t.null_node(),
      hasGapToken: hasGap ? t.s_node(l.CSTML, 'Punctuator', '$') : t.null_node(),
      sigilToken: t.s_node(l.CSTML, 'Punctuator', ':'),
    },
  );
};

export const buildGapTag = () => {
  return t.node(l.CSTML, 'GapTag', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.CSTML, 'Punctuator', '<//>'),
  });
};

export const buildShiftTag = () => {
  return t.node(l.CSTML, 'ShiftTag', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.CSTML, 'Punctuator', '^^^'),
  });
};

export const buildFlags = (flags = {}) => {
  const { token = null, escape = null, trivia = null, expression = null, hasGap = null } = flags;

  if ((trivia && escape) || (expression && (trivia || escape))) {
    throw new Error('invalid flags');
  }

  return t.node(
    l.CSTML,
    'Flags',
    btree.fromValues(
      concat(
        when(trivia, [t.ref`triviaToken`]),
        when(token, [t.ref`tokenToken`]),
        when(escape, [t.ref`escapeToken`]),
        when(expression, [t.ref`expressionToken`]),
        when(hasGap, [t.ref`hasGapToken`]),
      ),
    ),
    {
      triviaToken: trivia ? t.s_node(l.CSTML, 'Punctuator', '#') : t.null_node(),
      tokenToken: token ? t.s_node(l.CSTML, 'Punctuator', '*') : t.null_node(),
      escapeToken: escape ? t.s_node(l.CSTML, 'Punctuator', '@') : t.null_node(),
      expressionToken: expression ? t.s_node(l.CSTML, 'Punctuator', '+') : t.null_node(),
      hasGapToken: hasGap ? t.s_node(l.CSTML, 'Punctuator', '$') : t.null_node(),
    },
  );
};

export const buildSpamMatcher = (type = null, value = null, attributes = {}) => {
  return buildFullyQualifiedSpamMatcher({}, null, type, value, attributes);
};

export const buildFullyQualifiedSpamMatcher = (
  flags,
  language,
  type,
  intrinsicValue,
  attributes = {},
) => {
  const attributes_ = buildAttributes(attributes);

  let language_;

  if (isString(language)) {
    language_ = language;
  } else {
    let lArr = isString(language) ? language : language ? [...language] : [];

    language_ = lArr.length === 0 ? null : lArr;
  }

  return t.node(l.Spamex, 'NodeMatcher', [t.ref`open`], {
    open: t.node(
      l.Spamex,
      'NodeMatcher',
      btree.fromValues(
        concat(
          [t.ref`openToken`, t.ref`flags`],
          when(language_, [t.ref`language`, t.ref`languageSeparator`]),
          when(type, [t.ref`type`]),
          when(intrinsicValue, [t.embedded(buildSpace()), t.ref`intrinsicValue`]),
          when(attributes_.length, [t.embedded(buildSpace())]),
          interpolateFragmentChildren(attributes_, t.ref`attributes[]`),
          when(!type, [t.embedded(buildSpace())]),
          [t.ref`selfClosingTagToken`, t.ref`closeToken`],
        ),
      ),
      {
        openToken: t.s_node(l.CSTML, 'Punctuator', '<'),
        flags: buildFlags(flags),
        language: language_ ? buildLanguage(language_) : t.null_node(),
        languageSeparator: language_ && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
        type: type ? buildIdentifier(type) : t.null_node(),
        intrinsicValue: intrinsicValue ? buildString(intrinsicValue) : t.null_node(),
        attributes: attributes_.properties['.'],
        selfClosingTagToken: t.s_node(l.CSTML, 'Punctuator', '/'),
        closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
      },
    ),
  });
};

export const buildNodeOpenTag = (flags, language, type = null, attributes = {}) => {
  const attributes_ = buildAttributes(attributes);

  let language_ = !language || language.length === 0 ? null : language;

  return t.node(
    l.CSTML,
    'OpenNodeTag',
    btree.fromValues(
      concat(
        [t.ref`openToken`, t.ref`flags`],
        when(language_, [t.ref`language`, t.ref`languageSeparator`]),
        when(type, [t.ref`type`]),
        when(attributes_.length, [t.embedded(buildSpace())]),
        interpolateFragmentChildren(attributes_, t.ref`attributes[]`),
        [t.ref`closeToken`],
      ),
    ),
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '<'),
      flags: buildFlags(flags),
      language: language_ && type ? buildLanguage(language_) : t.null_node(),
      languageSeparator: language_ && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
      type: type ? buildIdentifier(type) : t.null_node(),
      attributes: attributes_.properties['.'],
      closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildDoctypeTag = (attributes) => {
  const attributes_ = buildAttributes(attributes);

  return t.node(
    l.CSTML,
    'DoctypeTag',
    btree.fromValues(
      concat(
        [t.ref`openToken`, t.ref`version`, t.ref`versionSeparator`, t.ref`doctype`],
        when(attributes_.length, [t.embedded(buildSpace())]),
        interpolateFragmentChildren(attributes_, t.ref`attributes[]`),
        [t.ref`closeToken`],
      ),
    ),
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '<!'),
      version: t.s_node(l.CSTML, 'PositiveInteger', '0'),
      versionSeparator: t.s_node(l.CSTML, 'Punctuator', ':'),
      doctype: t.s_node(l.CSTML, 'Keyword', 'cstml'),
      attributes: attributes_.properties['.'],
      closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildIdentifierPath = (path) => {
  const path_ = isString(path) ? [path] : [...path];
  const segments = path_.map((name) => buildIdentifier(name));
  const separators = path_.slice(0, -1).map((_) => t.s_node(l.CSTML, 'Punctuator', '.'));

  if (!path_.length) {
    return null;
  }

  return t.node(
    l.CSTML,
    'IdentifierPath',
    btree.fromValues(
      concat(
        [t.ref`segments[]`, t.arr()],
        repeat(segments.length - 1, t.ref`segments[]`, t.ref`separators[]`),
        [t.ref`segments[]`],
      ),
    ),
    {
      segments,
      separators,
    },
  );
};

export const buildLanguage = (language) => {
  return language && isString(language) && language.startsWith('https://')
    ? buildString(language)
    : buildIdentifierPath(language);
};

export const buildNodeCloseTag = (type, language) => {
  return t.node(
    l.CSTML,
    'CloseNodeTag',
    btree.fromValues(
      concat(
        [t.ref`openToken`],
        when(language, [t.ref`language`]),
        when(type && language, [t.ref`languageSeparator`]),
        when(type, [t.ref`type`]),
        [t.ref`closeToken`],
      ),
    ),
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '</'),
      language: language ? buildLanguage(language) : t.null_node(),
      languageSeparator: language && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
      type: type ? buildIdentifier(type) : t.null_node(),
      closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildLiteralTag = (value) => {
  return t.node(l.CSTML, 'LiteralTag', [t.ref`value`], { value });
};

export const buildTerminalProps = (matcher) => {
  const { attributes, value } = matcher.properties;

  return buildObject({ value, attributes });
};

export const buildSpace = () => {
  return t.t_node(l.Comment, null, [t.embedded(t.t_node(l.Space, 'Space', [t.lit(' ')]))]);
};

export const buildIdentifier = (name) => {
  return t.s_node(l.Instruction, 'Identifier', name);
};

export const buildKeyword = (name) => {
  return t.s_node(l.Instruction, 'Identifier', name);
};

export const buildCall = (verb, ...args) => {
  return t.node(l.Instruction, 'Call', [t.ref`verb`, t.ref`arguments`], {
    verb: buildIdentifier(verb),
    arguments: buildTuple(args),
  });
};

export const buildProperty = (key, value) => {
  return t.node(
    l.Instruction,
    'Property',
    btree.from(t.ref`key`, t.ref`mapOperator`, t.embedded(buildSpace()), t.ref`value`),
    {
      key: buildIdentifier(key),
      mapOperator: t.s_node(l.Instruction, 'Punctuator', ':'),
      value: buildExpression(value),
    },
  );
};

const escapables = {
  '\r': 'r',
  '\n': 'n',
  '\t': 't',
  '\0': '0',
};

export const buildDigit = (value) => {
  return t.s_node(l.CSTML, 'Digit', value);
};

export const buildInteger = (value, base = 10) => {
  const digits = value.toString(base).split('');

  return t.node(
    l.CSTML,
    'Integer',
    btree.fromValues(
      concat(
        [t.ref`digits[]`, t.arr()],
        digits.map(() => t.ref`digits[]`),
      ),
    ),
    {
      digits: digits.map((digit) => buildDigit(digit)),
    },
  );
};

export const buildInfinity = (value) => {
  let sign;
  if (value === Infinity) {
    sign = '+';
  } else if (value === -Infinity) {
    sign = '-';
  } else {
    throw new Error();
  }

  return t.node(l.CSTML, 'Infinity', [t.ref`sign`, t.ref`value`], {
    sign: t.s_node(l.CSTML, 'Punctuator', sign),
    value: t.s_node(l.CSTML, 'Keyword', 'Infinity'),
  });
};

export const buildNumber = (value) => {
  if (Number.isFinite(value)) {
    return buildInteger(value);
  } else {
    return buildInfinity(value);
  }
};

export const buildString = (value) => {
  const pieces = isArray(value) ? value : [value];
  const tags = [];
  let lit = '';

  if (pieces.length === 1 && pieces[0] === "'") {
    return t.node(
      l.CSTML,
      'String',
      btree.from(t.ref`openToken`, t.ref`content`, t.ref`closeToken`),
      {
        openToken: t.s_node(l.CSTML, 'Punctuator', '"'),
        content: interpolateString(agastBuildLiteralTag(value)),
        closeToken: t.s_node(l.CSTML, 'Punctuator', '"'),
      },
    );
  }

  for (const piece of pieces) {
    if (isString(piece)) {
      const value = piece;

      for (const chr of value) {
        if (
          chr === '\\' ||
          chr === "'" ||
          chr === '\n' ||
          chr === '\r' ||
          chr === '\t' ||
          chr === '\0' ||
          chr.charCodeAt(0) < 32
        ) {
          if (lit) {
            tags.push(agastBuildLiteralTag(lit));
            lit = '';
          }

          let value;

          if (escapables[chr]) {
            value = t.node(l.CSTML, 'EscapeCode', [t.ref`sigilToken`], {
              sigilToken: buildKeyword(escapables[chr]),
              digits: t.null_node(),
            });
          } else if (chr.charCodeAt(0) < 32) {
            const hexDigits = chr.charCodeAt(0).toString(16).padStart(4, '0');
            value = t.node(
              l.CSTML,
              'EscapeCode',
              btree.fromValues(
                concat(
                  [t.ref`sigilToken`, t.ref`digits[]`, t.arr()],
                  [...hexDigits].map((d) => t.ref`digits[]`),
                ),
              ),
              {
                sigilToken: buildKeyword('u'),
                digits: [...hexDigits].map((digit) => buildDigit(digit)),
              },
            );
          } else {
            value = buildKeyword(chr);
          }

          tags.push(
            t.buildEmbeddedNode(
              t.e_node(
                l.CSTML,
                'EscapeSequence',
                [t.ref`escape`, t.ref`value`],
                {
                  escape: t.s_node(l.CSTML, 'Punctuator', '\\'),
                  value,
                },
                { cooked: chr },
              ),
            ),
          );
        } else {
          lit += chr;
        }
      }
    } else {
      tags.push(agastBuildLiteralTag(lit));
      lit = '';

      if (piece == null) {
        throw new Error('not implemented');
      } else if (isString(piece.type)) {
        tags.push(piece);
      } else {
        throw new Error();
      }
    }
  }

  if (lit) tags.push(agastBuildLiteralTag(lit));
  lit = '';

  return t.node(
    l.CSTML,
    'String',
    btree.from(t.ref`openToken`, t.ref`content`, t.ref`closeToken`),
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', "'"),
      content: interpolateString(tags),
      closeToken: t.s_node(l.CSTML, 'Punctuator', "'"),
    },
  );
};

export const buildBoolean = (value) => {
  return t.node(l.Instruction, 'Boolean', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.Instruction, 'Keyword', value ? 'true' : 'false'),
  });
};

export const buildNullTag = () => {
  return t.node(l.Instruction, 'Null', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.Instruction, 'Keyword', 'null'),
  });
};

export const buildArray = (elements) => {
  const elements_ = buildArrayElements(elements);
  return t.node(
    l.Instruction,
    'Array',
    btree.fromValues(
      concat([t.ref`openToken`], interpolateFragmentChildren(elements_, t.ref`elements[]`), [
        t.ref`closeToken`,
      ]),
    ),
    {
      openToken: t.s_node(l.Instruction, 'Punctuator', '['),
      elements: elements_.properties['.'],
      closeToken: t.s_node(l.Instruction, 'Punctuator', ']'),
    },
  );
};

export const buildArrayElements = (values) => {
  return buildSpaceSeparatedList(values.map((value) => buildExpression(value)));
};

export const buildTupleValues = buildArrayElements;

export const buildTuple = (values) => {
  const values_ = buildTupleValues(values);
  return t.node(
    l.Instruction,
    'Tuple',
    btree.fromValues(
      concat([t.ref`openToken`], interpolateFragmentChildren(values_, t.ref`values[]`), [
        t.ref`closeToken`,
      ]),
    ),
    {
      openToken: t.s_node(l.Instruction, 'Punctuator', '('),
      values: values_.properties['.'],
      closeToken: t.s_node(l.Instruction, 'Punctuator', ')'),
    },
  );
};

export const buildSpaceSeparatedList = (values) => {
  return t.frag(
    btree.fromValues(
      concat(
        [t.ref`.`, t.arr()],
        buildSeparatedListChildren(values, t.ref`.`, t.embedded(buildSpace())),
      ),
    ),
    {
      ['.']: values,
    },
  );
};

export const buildObjectProperties = (properties) => {
  return buildSpaceSeparatedList(
    Object.entries(properties).map(({ 0: key, 1: value }) => buildProperty(key, value)),
  );
};

export const buildObject = (properties) => {
  const properties_ = buildObjectProperties(properties);
  return t.node(
    l.Instruction,
    'Object',
    btree.fromValues(
      concat([t.ref`openToken`], interpolateFragmentChildren(properties_, t.ref`properties[]`), [
        t.ref`closeToken`,
      ]),
    ),
    {
      openToken: t.s_node(l.Instruction, 'Punctuator', '{'),
      properties: properties_.properties['.'],
      closeToken: t.s_node(l.Instruction, 'Punctuator', '}'),
    },
    {},
  );
};

export const buildMappingAttribute = (key, value) => {
  return t.node(
    l.CSTML,
    'MappingAttribute',
    btree.from(t.ref`key`, t.ref`mapOperator`, t.ref`value`),
    {
      key: buildIdentifier(key),
      mapOperator: t.s_node(l.CSTML, 'Punctuator', '='),
      value: buildExpression(value),
    },
  );
};

export const buildBooleanAttribute = (key, value) => {
  return t.node(l.CSTML, 'BooleanAttribute', [...when(!value, [t.ref`negateToken`]), t.ref`key`], {
    negateToken: !value ? t.s_node(l.CSTML, 'Puncutator', '!') : t.null_node(),
    key: buildIdentifier(key),
  });
};

export const buildAttribute = (key, value) => {
  return isBoolean(value) ? buildBooleanAttribute(key, value) : buildMappingAttribute(key, value);
};

export const buildPattern = (alternatives, flags) => {
  return t.node(
    l.Regex,
    'Pattern',
    btree.fromValues(
      concat([t.ref`openToken`], interpolateFragmentChildren(alternatives, t.ref`alternatives[]`), [
        t.ref`closeToken`,
        t.ref`flags`,
      ]),
    ),
    {
      openToken: t.s_node(l.Regex, 'Punctuator', '/'),
      separators: alternatives.properties.separators,
      alternatives: alternatives.properties['.'],
      closeToken: t.s_node(l.Regex, 'Punctuator', '/'),
      flags: buildFlags(flags),
    },
  );
};

export const buildAlternative = (elements) => {
  const elementsArray = getRoot(elements);
  return t.node(
    l.Regex,
    'Alternative',
    btree.fromValues(interpolateFragmentChildren(elements, t.ref`elements[]`), {
      elements: elementsArray,
    }),
    { elements: elementsArray },
  );
};

export const buildAlternatives = (alternatives = {}) => {
  return t.frag(
    btree.fromValues(
      concat(
        [t.ref`.[]`, t.arr(), t.ref`separators[]`, t.arr()],
        buildSeparatedListChildren(alternatives, t.ref`.[]`, t.ref`separators[]`),
      ),
    ),
    {
      ['.']: alternatives,
      separators: alternatives.slice(0, -1).map((alt) => t.s_node(l.Regex, 'Punctuator', '|')),
    },
  );
};

export const buildElements = (elements) => {
  return t.frag(
    btree.fromValues(
      concat(
        [t.ref`.[]`, t.arr()],
        elements.map((el) => t.ref`.[]`),
      ),
    ),
    {
      ['.']: elements,
    },
  );
};

export const buildExpression = (expr) => {
  if (isNull(expr)) return buildNullTag();

  switch (typeof expr) {
    case 'boolean':
      return buildBoolean(expr);
    case 'string':
      return buildString(expr);
    case 'number':
      return buildInteger(expr);
    case 'object': {
      switch (getPrototypeOf(expr)) {
        case Array.prototype:
          return buildArray(expr);
        case Object.prototype:
          if (expr.type && expr.language && expr.children && expr.properties) {
            return expr;
          }
          return buildObject(expr);
        default:
          throw new Error();
      }
    }
    default:
      throw new Error();
  }
};

export const buildAttributes = (attributes = {}) => {
  const attributes_ = Object.entries(attributes).map(({ 0: key, 1: value }) =>
    buildAttribute(key, value),
  );

  return t.frag(
    btree.fromValues(
      [t.ref`.[]`, t.arr()],
      buildSeparatedListChildren(attributes_, t.ref`.[]`, t.embedded(buildSpace())),
    ),
    {
      ['.']: attributes_,
    },
  );
};

export const buildNodeMatcher = (flags, language, type, attributes) => {
  let language_ = !language || language.length === 0 ? null : language;

  const flags_ = buildFlags(flags);

  return t.node(
    l.Spamex,
    'NodeMatcher',
    btree.fromValues(
      concat(
        [t.ref`openToken`],
        when(flags_, [t.ref`flags`]),
        when(language_, [t.ref`language`, t.ref`languageSeparator`]),
        [t.ref`type`],
        when(attributes.length, [t.embedded(buildSpace())]),
        [...btree.traverse(attributes.children)].slice(1, -1),
        [t.ref`closeToken`],
      ),
    ),
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '<'),
      language: buildLanguage(language_),
      languageSeparator: language_ && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
      flags: flags_,
      type: buildIdentifier(type),
      attributes: attributes.properties.attributes,
      closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};
