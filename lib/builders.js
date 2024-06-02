// import { i } from '@bablr/boot/shorthand.macro';
import {
  interpolateArray,
  interpolateArrayChildren,
  interpolateString,
} from '@bablr/agast-helpers/template';
import * as t from '@bablr/agast-helpers/shorthand';
import * as l from './languages.js';

const { getPrototypeOf, freeze } = Object;
const { isArray } = Array;

const when = (condition, value) => (condition ? value : { *[Symbol.iterator]() {} });

const isString = (val) => typeof val === 'string';
const isBoolean = (val) => typeof val === 'boolean';

function* repeat(times, ...values) {
  for (let i = 0; i < times; i++) for (const value of values) yield value;
}

export const buildReference = (name, isArray) => {
  return t.node(l.CSTML, 'Reference', [t.ref`name`, ...when(isArray, [t.ref`arrayOperator`])], {
    name: buildIdentifier(name),
    arrayOperator: isArray ? t.s_node(l.CSTML, 'Punctuator', '[]') : null,
  });
};

export const buildGap = () => {
  return t.node(l.CSTML, 'Gap', [t.ref`value`], { value: t.s_node(l.CSTML, 'Punctuator', '<//>') });
};

const buildFlags = (flags) => {
  const { token = null, escape = null, trivia = null, expression = null } = flags;

  if ((trivia && escape) || (expression && (trivia || escape))) {
    throw new Error('invalid flags');
  }

  return {
    children: [
      ...when(trivia, [t.ref`triviaFlag`]),
      ...when(token, [t.ref`tokenFlag`]),
      ...when(escape, [t.ref`escapeFlag`]),
      ...when(expression, [t.ref`expressionFlag`]),
    ],
    properties: {
      triviaFlag: trivia && t.s_node(l.CSTML, 'Punctuator', '#'),
      tokenFlag: token && t.s_node(l.CSTML, 'Punctuator', '*'),
      escapeFlag: escape && t.s_node(l.CSTML, 'Punctuator', '@'),
      expressionFlag: expression && t.s_node(l.CSTML, 'Punctuator', '+'),
    },
  };
};

export const buildSpamMatcher = (type, value, attributes = {}) => {
  return buildFullyQualifiedSpamMatcher({}, null, type, value, attributes);
};

export const buildFullyQualifiedSpamMatcher = (
  flags,
  language,
  type,
  intrinsicValue,
  attributes = {},
) => {
  const attributes_ = Object.entries(attributes).map(({ 0: key, 1: value }) =>
    buildAttribute(key, value),
  );

  const lArr = language ? [...language] : [];

  let language_ = lArr.length === 0 ? null : lArr;

  const flags_ = buildFlags(flags);
  return t.node(
    l.Spamex,
    'NodeMatcher',
    [
      t.ref`open`,
      ...flags_.children,
      ...when(language_, [t.ref`language`, t.ref`languageSeparator`]),
      t.ref`type`,
      ...when(intrinsicValue, [t.embedded(buildSpace()), t.ref`intrinsicValue`]),
      ...when(attributes_.length, [t.embedded(buildSpace())]),
      ...interpolateArrayChildren(attributes, t.ref`attributes[]`, t.embedded(buildSpace())),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.CSTML, 'Punctuator', '<'),
      ...flags_.properties,
      language: buildLanguage(language_),
      languageSeparator: language_ && type && t.s_node(l.CSTML, 'Punctuator', ':'),
      type: buildIdentifier(type),
      intrinsicValue: intrinsicValue && buildString(intrinsicValue),
      attributes: attributes_,
      close: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildNodeOpenTag = (flags, language, type, intrinsicValue = null, attributes = {}) => {
  const attributes_ = Object.entries(attributes).map(({ 0: key, 1: value }) =>
    buildAttribute(key, value),
  );

  let language_ = !language || language.length === 0 ? null : language;

  const flags_ = buildFlags(flags);

  return t.node(
    l.CSTML,
    'OpenNodeTag',
    [
      t.ref`open`,
      ...flags_.children,
      ...when(language_, [t.ref`language`, t.ref`languageSeparator`]),
      t.ref`type`,
      ...when(intrinsicValue, [t.embedded(buildSpace()), t.ref`intrinsicValue`]),
      ...when(attributes_.length, [t.embedded(buildSpace())]),
      ...interpolateArrayChildren(attributes_, t.ref`attributes[]`, t.embedded(buildSpace())),
      when(intrinsicValue, [t.embedded(buildSpace), t.ref`selfClosingToken`]),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.CSTML, 'Punctuator', '<'),
      ...flags_.properties,
      language: buildLanguage(language_),
      languageSeparator: language_ && type && t.s_node(l.CSTML, 'Punctuator', ':'),
      type: buildIdentifier(type),
      intrinsicValue: intrinsicValue && buildString(intrinsicValue),
      attributes: attributes_,
      selfClosingToken: intrinsicValue && t.s_node(l.CSTML, 'Punctuator', '/'),
      close: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildDoctypeTag = (attributes) => {
  const attributes_ = Object.entries(attributes).map(({ 0: key, 1: value }) =>
    buildAttribute(key, value),
  );

  return t.node(
    l.CSTML,
    'DoctypeTag',
    [
      t.ref`open`,
      t.ref`version`,
      t.ref`versionSeparator`,
      t.ref`doctype`,
      ...when(attributes_.length, [t.embedded(buildSpace())]),
      ...interpolateArrayChildren(attributes_, t.ref`attributes[]`, t.embedded(buildSpace())),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.CSTML, 'Punctuator', '<!'),
      version: t.s_node(l.CSTML, 'PositiveInteger', '0'),
      versionSeparator: t.s_node(l.CSTML, 'Punctuator', ':'),
      doctype: t.s_node(l.CSTML, 'Keyword', 'cstml'),
      attributes: attributes_,
      close: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildFragmentFlags = (flags = {}) => {
  const { escape = null, trivia = null } = flags;
  if (!(escape || trivia)) {
    return null;
  }

  return t.node(
    l.CSTML,
    'NodeFlags',
    [...when(trivia, [t.ref`trivia`]), ...when(escape, [t.ref`escape`])],
    {
      trivia: trivia && t.s_node(l.CSTML, 'Punctuator', '#'),
      escape: escape && t.s_node(l.CSTML, 'Punctuator', '@'),
    },
  );
};

export const buildFragmentOpenTag = (flags) => {
  return t.node(
    l.CSTML,
    'OpenFragmentTag',
    [t.ref`open`, ...when(flags, [t.ref`flags`]), t.ref`close`],
    {
      open: t.s_node(l.CSTML, 'Punctuator', '<'),
      flags: buildFragmentFlags(flags),
      close: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildIdentifierPath = (path) => {
  const path_ = [...path];
  const segments = path_.map((name) => buildIdentifier(name));
  const separators = path_.slice(0, -1).map((_) => t.s_node(l.CSTML, 'Punctuator', '.'));

  if (!path_.length) {
    return null;
  }

  return t.node(
    l.CSTML,
    'IdentifierPath',
    [...repeat(segments.length, t.ref`segments[]`, t.ref`separators[]`)].slice(0, -1),
    {
      segments,
      separators,
    },
  );
};

export const buildLanguage = (language) => {
  return language && buildIdentifierPath(language);
};

export const buildNodeCloseTag = (type, language) => {
  return t.node(
    l.CSTML,
    'CloseNodeTag',
    [
      t.ref`open`,
      ...when(language, [t.ref`language`]),
      ...when(type && language, [t.ref`languageSeparator`]),
      ...when(type, [t.ref`type`]),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.CSTML, 'Punctuator', '</'),
      language: buildLanguage(language),
      languageSeparator: language && type ? t.s_node(l.CSTML, 'Punctuator', ':') : null,
      type: type && buildIdentifier(type),
      close: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildFragmentCloseTag = () => {
  return t.node(l.CSTML, 'CloseFragmentTag', [t.ref`open`, t.ref`close`], {
    open: t.s_node(l.CSTML, 'Punctuator', '</'),
    close: t.s_node(l.CSTML, 'Punctuator', '>'),
  });
};

export const buildLiteral = (value) => {
  return t.node(l.CSTML, 'Literal', [t.ref`value`], { value });
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
    [t.ref`key`, t.ref`mapOperator`, t.embedded(buildSpace()), t.ref`value`],
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
    digits.map((d) => t.ref`digits[]`),
    { digits: digits.map((digit) => buildDigit(digit)) },
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

const buildLiteralTerminal = (lit) => freeze({ type: 'Literal', value: lit });

export const buildString = (value) => {
  const pieces = isArray(value) ? value : [value];
  const terminals = [];
  let lit = '';

  if (pieces.length === 1 && pieces[0] === "'") {
    return t.node(l.CSTML, 'String', [t.ref`open`, t.ref`content`, t.ref`close`], {
      open: t.s_node(l.CSTML, 'Punctuator', '"'),
      content: interpolateString(
        freeze({
          type: 'Literal',
          value,
        }),
      ),
      close: t.s_node(l.CSTML, 'Punctuator', '"'),
    });
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
            terminals.push(buildLiteralTerminal(lit));
            lit = '';
          }

          let value;

          if (escapables[chr]) {
            value = t.node(l.CSTML, 'EscapeCode', [t.ref`sigilToken`], {
              sigilToken: buildKeyword(escapables[chr]),
              digits: null,
            });
          } else if (chr.charCodeAt(0) < 32) {
            const hexDigits = chr.charCodeAt(0).toString(16).padStart(4, '0');
            value = t.node(
              l.CSTML,
              'EscapeCode',
              [t.ref`sigilToken`, ...[...hexDigits].map((d) => t.ref`digits[]`)],
              {
                sigilToken: buildKeyword('u'),
                digits: [...hexDigits].map((digit) => buildDigit(digit)),
              },
            );
          } else {
            value = buildKeyword(chr);
          }

          terminals.push(
            t.buildEmbedded(
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
      terminals.push(buildLiteralTerminal(lit));
      lit = '';

      if (piece == null) {
        throw new Error('not impelemented');
      } else if (isString(piece.type)) {
        terminals.push(piece);
      } else {
        throw new Error();
      }
    }
  }

  if (lit) terminals.push(buildLiteralTerminal(lit));
  lit = '';

  return t.node(l.CSTML, 'String', [t.ref`open`, t.ref`content`, t.ref`close`], {
    open: t.s_node(l.CSTML, 'Punctuator', "'"),
    content: interpolateString(terminals),
    close: t.s_node(l.CSTML, 'Punctuator', "'"),
  });
};

export const buildBoolean = (value) => {
  return t.node(l.Instruction, 'Boolean', [t.ref`value`], {
    value: t.s_node(l.Instruction, 'Keyword', value ? 'true' : 'false'),
  });
};

export const buildNull = () => {
  return t.node(l.Instruction, 'Null', [t.ref`value`], {
    value: t.s_node(l.Instruction, 'Keyword', 'null'),
  });
};

export const buildArray = (elements) => {
  return t.node(
    l.Instruction,
    'Array',
    [
      t.ref`open`,
      ...interpolateArrayChildren(
        elements,
        t.ref`elements[]`,
        t.embedded(
          t.t_node(l.Comment, null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]),
        ),
      ),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.Instruction, 'Punctuator', '['),
      elements: [...interpolateArray(elements)],
      close: t.s_node(l.Instruction, 'Punctuator', ']'),
    },
  );
};

export const buildTuple = (values) => {
  return t.node(
    l.Instruction,
    'Tuple',
    [
      t.ref`open`,
      ...interpolateArrayChildren(
        values,
        t.ref`values[]`,
        t.embedded(
          t.t_node(l.Comment, null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]),
        ),
      ),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.Instruction, 'Punctuator', '('),
      values: [...interpolateArray(values)],
      close: t.s_node(l.Instruction, 'Punctuator', ')'),
    },
  );
};

export const buildObject = (properties) => {
  return t.node(
    l.Instruction,
    'Object',
    [
      t.ref`open`,
      ...interpolateArrayChildren(
        Object.entries(properties).map(([key, value]) => buildProperty(key, value)),
        t.ref`properties[]`,
        t.embedded(
          t.t_node(l.Comment, null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]),
        ),
      ),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.Instruction, 'Punctuator', '{'),
      properties: [
        ...interpolateArray(
          Object.entries(properties).map(([key, value]) => buildProperty(key, value)),
        ),
      ],
      close: t.s_node(l.Instruction, 'Punctuator', '}'),
    },
    {},
  );
};

export const buildMappingAttribute = (key, value) => {
  return t.node(l.CSTML, 'MappingAttribute', [t.ref`key`, t.ref`mapOperator`, t.ref`value`], {
    key: buildIdentifier(key),
    mapOperator: t.s_node(l.CSTML, 'Punctuator', '='),
    value: buildExpression(value),
  });
};

export const buildBooleanAttribute = (key, value) => {
  return t.node(l.CSTML, 'BooleanAttribute', [...when(!value, [t.ref`negateSigil`]), t.ref`key`], {
    negateSigil: !value ? t.s_node(l.CSTML, 'Puncutator', '!') : null,
    key: buildIdentifier(key),
  });
};

export const buildAttribute = (key, value) => {
  return isBoolean(value) ? buildBooleanAttribute(key, value) : buildMappingAttribute(key, value);
};

export const buildExpression = (expr) => {
  if (expr == null) return buildNull();

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

export const buildNodeMatcher = (flags, language, type, attributes = {}) => {
  const attributes_ = Object.entries(attributes).map(({ 0: key, 1: value }) =>
    buildAttribute(key, value),
  );

  let language_ = !language || language.length === 0 ? null : language;

  const flags_ = buildFlags(flags);

  return t.node(
    l.Spamex,
    'NodeMatcher',
    [
      t.ref`open`,
      ...when(flags_, [t.ref`flags`]),
      ...when(language_, [t.ref`language`, t.ref`languageSeparator`]),
      t.ref`type`,
      ...when(attributes_.length, [t.embedded(buildSpace())]),
      ...interpolateArrayChildren(attributes_, t.ref`attributes[]`, t.embedded(buildSpace())),
      t.ref`close`,
    ],
    {
      open: t.s_node(l.CSTML, 'Punctuator', '<'),
      language: buildLanguage(language_),
      languageSeparator: language_ && type && t.s_node(l.CSTML, 'Punctuator', ':'),
      flags: flags_,
      type: buildIdentifier(type),
      attributes: attributes_,
      close: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};
