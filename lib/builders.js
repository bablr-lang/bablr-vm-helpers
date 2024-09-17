// import { i } from '@bablr/boot/shorthand.macro';
import {
  interpolateArray,
  interpolateArrayChildren,
  interpolateString,
} from '@bablr/agast-helpers/template';
import { isNull } from '@bablr/agast-helpers/tree';
import { buildLiteral as buildLiteralTag } from '@bablr/agast-helpers/builders';
import * as t from '@bablr/agast-helpers/shorthand';
import * as l from './languages.js';

const { getPrototypeOf } = Object;
const { isArray } = Array;

const when = (condition, value) => (condition ? value : { *[Symbol.iterator]() {} });

const isString = (val) => typeof val === 'string';
const isBoolean = (val) => typeof val === 'boolean';

function* repeat(times, ...values) {
  for (let i = 0; i < times; i++) for (const value of values) yield value;
}

export const buildReference = (name, isArray) => {
  return t.node(
    l.CSTML,
    'ReferenceTag',
    [t.ref`name`, ...when(isArray, [t.ref`arrayOperatorToken`]), t.ref`sigilToken`],
    {
      name: buildIdentifier(name),
      sigilToken: t.s_node(l.CSTML, 'Punctuator', ':'),
    },
  );
};

export const buildGap = () => {
  return t.node(l.CSTML, 'GapTag', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.CSTML, 'Punctuator', '<//>'),
  });
};

export const buildShift = () => {
  return t.node(l.CSTML, 'ShiftTag', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.CSTML, 'Punctuator', '^^^'),
  });
};

export const buildFlags = (flags = {}) => {
  const { intrinsic = null, token = null, escape = null, trivia = null, expression = null } = flags;

  if ((trivia && escape) || (expression && (trivia || escape))) {
    throw new Error('invalid flags');
  }

  return t.node(
    l.CSTML,
    'Flags',
    [
      ...when(trivia, [t.ref`triviaToken`]),
      ...when(intrinsic, [t.ref`intrinsicToken`]),
      ...when(token, [t.ref`tokenToken`]),
      ...when(escape, [t.ref`escapeToken`]),
      ...when(expression, [t.ref`expressionToken`]),
    ],
    {
      triviaToken: trivia ? t.s_node(l.CSTML, 'Punctuator', '#') : t.null_node(),
      intrinsicToken: intrinsic ? t.s_node(l.CSTML, 'Punctuator', '~') : t.null_node(),
      tokenToken: token ? t.s_node(l.CSTML, 'Punctuator', '*') : t.null_node(),
      escapeToken: escape ? t.s_node(l.CSTML, 'Punctuator', '@') : t.null_node(),
      expressionToken: expression ? t.s_node(l.CSTML, 'Punctuator', '+') : t.null_node(),
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
      [
        t.ref`openToken`,
        t.ref`flags`,
        ...when(language_, [t.ref`language`, t.ref`languageSeparator`]),
        ...when(type, [t.ref`type`]),
        ...when(intrinsicValue, [t.embedded(buildSpace()), t.ref`intrinsicValue`]),
        ...when(attributes_.length, [t.embedded(buildSpace())]),
        t.ref`attributes[]`,
        t.arr(),
        ...interpolateArrayChildren(attributes_, t.ref`attributes[]`, t.embedded(buildSpace())),
        ...when(!type, [t.embedded(buildSpace())]),
        t.ref`selfClosingTagToken`,
        t.ref`closeToken`,
      ],
      {
        openToken: t.s_node(l.CSTML, 'Punctuator', '<'),
        flags: buildFlags(flags),
        language: language_ ? buildLanguage(language_) : t.null_node(),
        languageSeparator: language_ && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
        type: type ? buildIdentifier(type) : t.null_node(),
        intrinsicValue: intrinsicValue ? buildString(intrinsicValue) : t.null_node(),
        attributes: attributes_,
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
    [
      t.ref`openToken`,
      t.ref`flags`,
      ...when(language_, [t.ref`language`, t.ref`languageSeparator`]),
      ...when(type, [t.ref`type`]),
      ...when(attributes_.length, [t.embedded(buildSpace())]),
      t.ref`attributes[]`,
      t.arr(),
      ...interpolateArrayChildren(attributes_, t.ref`attributes[]`, t.embedded(buildSpace())),
      t.ref`closeToken`,
    ],
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '<'),
      flags: buildFlags(flags),
      language: language_ && type ? buildLanguage(language_) : t.null_node(),
      languageSeparator: language_ && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
      type: type ? buildIdentifier(type) : t.null_node(),
      attributes: attributes_,
      closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildDoctypeTag = (attributes) => {
  const attributes_ = buildAttributes(attributes);

  return t.node(
    l.CSTML,
    'DoctypeTag',
    [
      t.ref`openToken`,
      t.ref`version`,
      t.ref`versionSeparator`,
      t.ref`doctype`,
      ...when(attributes_.length, [t.embedded(buildSpace())]),
      t.ref`attributes[]`,
      t.arr(),
      ...interpolateArrayChildren(attributes_, t.ref`attributes[]`, t.embedded(buildSpace())),
      t.ref`closeToken`,
    ],
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '<!'),
      version: t.s_node(l.CSTML, 'PositiveInteger', '0'),
      versionSeparator: t.s_node(l.CSTML, 'Punctuator', ':'),
      doctype: t.s_node(l.CSTML, 'Keyword', 'cstml'),
      attributes: attributes_,
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
    [
      t.ref`segments[]`,
      t.arr(),
      ...repeat(segments.length, t.ref`segments[]`, t.ref`separators`),
    ].slice(0, -1),
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
    [
      t.ref`openToken`,
      ...when(language, [t.ref`language`]),
      ...when(type && language, [t.ref`languageSeparator`]),
      ...when(type, [t.ref`type`]),
      t.ref`closeToken`,
    ],
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '</'),
      language: language ? buildLanguage(language) : t.null_node(),
      languageSeparator: language && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
      type: type ? buildIdentifier(type) : t.null_node(),
      closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};

export const buildLiteral = (value) => {
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
    [t.ref`digits[]`, t.arr(), ...digits.map((d) => t.ref`digits[]`)],
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
    return t.node(l.CSTML, 'String', [t.ref`openToken`, t.ref`content`, t.ref`closeToken`], {
      openToken: t.s_node(l.CSTML, 'Punctuator', '"'),
      content: interpolateString(buildLiteralTag(value)),
      closeToken: t.s_node(l.CSTML, 'Punctuator', '"'),
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
            tags.push(buildLiteralTag(lit));
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
              [
                t.ref`sigilToken`,
                t.ref`digits[]`,
                t.arr(),
                ...[...hexDigits].map((d) => t.ref`digits[]`),
              ],
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
      tags.push(buildLiteralTag(lit));
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

  if (lit) tags.push(buildLiteralTag(lit));
  lit = '';

  return t.node(l.CSTML, 'String', [t.ref`openToken`, t.ref`content`, t.ref`closeToken`], {
    openToken: t.s_node(l.CSTML, 'Punctuator', "'"),
    content: interpolateString(tags),
    closeToken: t.s_node(l.CSTML, 'Punctuator', "'"),
  });
};

export const buildBoolean = (value) => {
  return t.node(l.Instruction, 'Boolean', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.Instruction, 'Keyword', value ? 'true' : 'false'),
  });
};

export const buildNull = () => {
  return t.node(l.Instruction, 'Null', [t.ref`sigilToken`], {
    sigilToken: t.s_node(l.Instruction, 'Keyword', 'null'),
  });
};

export const buildArray = (elements) => {
  return t.node(
    l.Instruction,
    'Array',
    [
      t.ref`openToken`,
      t.ref`elements[]`,
      t.arr(),
      ...interpolateArrayChildren(
        elements,
        t.ref`elements[]`,
        t.embedded(
          t.t_node(l.Comment, null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]),
        ),
      ),
      t.ref`closeToken`,
    ],
    {
      openToken: t.s_node(l.Instruction, 'Punctuator', '['),
      elements: [...interpolateArray(elements)],
      closeToken: t.s_node(l.Instruction, 'Punctuator', ']'),
    },
  );
};

export const buildTuple = (values) => {
  return t.node(
    l.Instruction,
    'Tuple',
    [
      t.ref`openToken`,
      t.ref`values[]`,
      t.arr(),
      ...interpolateArrayChildren(
        values,
        t.ref`values[]`,
        t.embedded(
          t.t_node(l.Comment, null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]),
        ),
      ),
      t.ref`closeToken`,
    ],
    {
      openToken: t.s_node(l.Instruction, 'Punctuator', '('),
      values: [...interpolateArray(values)],
      closeToken: t.s_node(l.Instruction, 'Punctuator', ')'),
    },
  );
};

export const buildObject = (properties) => {
  return t.node(
    l.Instruction,
    'Object',
    [
      t.ref`openToken`,
      t.ref`properties[]`,
      t.arr(),
      ...interpolateArrayChildren(
        Object.entries(properties).map(([key, value]) => buildProperty(key, value)),
        t.ref`properties[]`,
        t.embedded(
          t.t_node(l.Comment, null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]),
        ),
      ),
      t.ref`closeToken`,
    ],
    {
      openToken: t.s_node(l.Instruction, 'Punctuator', '{'),
      properties: [
        ...interpolateArray(
          Object.entries(properties).map(([key, value]) => buildProperty(key, value)),
        ),
      ],
      closeToken: t.s_node(l.Instruction, 'Punctuator', '}'),
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
  return t.node(l.CSTML, 'BooleanAttribute', [...when(!value, [t.ref`negateToken`]), t.ref`key`], {
    negateToken: !value ? t.s_node(l.CSTML, 'Puncutator', '!') : t.null_node(),
    key: buildIdentifier(key),
  });
};

export const buildAttribute = (key, value) => {
  return isBoolean(value) ? buildBooleanAttribute(key, value) : buildMappingAttribute(key, value);
};

export const buildExpression = (expr) => {
  if (isNull(expr)) return buildNull();

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
  return Object.entries(attributes).map(({ 0: key, 1: value }) => buildAttribute(key, value));
};

export const buildNodeMatcher = (flags, language, type, attributes = {}) => {
  const attributes_ = buildAttributes(attributes);

  let language_ = !language || language.length === 0 ? null : language;

  const flags_ = buildFlags(flags);

  return t.node(
    l.Spamex,
    'NodeMatcher',
    [
      t.ref`openToken`,
      ...when(flags_, [t.ref`flags`]),
      ...when(language_, [t.ref`language`, t.ref`languageSeparator`]),
      t.ref`type`,
      ...when(attributes_.length, [t.embedded(buildSpace())]),
      t.ref`attributes[]`,
      t.arr(),
      ...interpolateArrayChildren(attributes_, t.ref`attributes[]`, t.embedded(buildSpace())),
      t.ref`closeToken`,
    ],
    {
      openToken: t.s_node(l.CSTML, 'Punctuator', '<'),
      language: buildLanguage(language_),
      languageSeparator: language_ && type ? t.s_node(l.CSTML, 'Punctuator', ':') : t.null_node(),
      flags: flags_,
      type: buildIdentifier(type),
      attributes: attributes_,
      closeToken: t.s_node(l.CSTML, 'Punctuator', '>'),
    },
  );
};
