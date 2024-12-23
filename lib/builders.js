// import { i } from '@bablr/boot/shorthand.macro';
import { interpolateFragment, buildFilledGapFunction } from '@bablr/agast-helpers/template';
import { isNull, treeFromStreamSync as treeFromStream } from '@bablr/agast-helpers/tree';
import { buildLiteralTag as agastBuildLiteralTag } from '@bablr/agast-helpers/builders';
import * as t from '@bablr/agast-helpers/shorthand';
import * as l from './languages.js';
import { concat } from './iterable.js';

const { getPrototypeOf, freeze, hasOwn } = Object;
const { isArray } = Array;

const when = (condition, value) => (condition ? value : { *[Symbol.iterator]() {} });

const isString = (val) => typeof val === 'string';
const isBoolean = (val) => typeof val === 'boolean';

export const buildReferenceTag = (
  name,
  isArray = false,
  flags = t.referenceFlags,
  index = null,
) => {
  let expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'ReferenceTag'),
      t.ref`name`,
      gap(name ? buildIdentifier(name) : buildNullNode()),
      t.ref`openIndexToken`,
      gap(isArray ? buildToken(l.CSTML, 'Punctuator', '[') : buildNullNode()),
      t.ref`index`,
      gap(index || buildNullNode()),
      t.ref`closeIndexToken`,
      gap(isArray ? buildToken(l.CSTML, 'Punctuator', ']') : buildNullNode()),
      t.ref`flags`,
      gap(flags ? buildReferenceFlags(flags) : buildNullNode()),
      t.ref`sigilToken`,
      gap(buildToken(l.CSTML, 'Punctuator', ':')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildGapTag = () => {
  let expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'ShiftTag'),
      t.ref`sigilToken`,
      gap(buildToken(l.CSTML, 'Punctuator', '<//>')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildShiftTag = () => {
  let expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'ShiftTag'),
      t.ref`sigilToken`,
      gap(buildToken(l.CSTML, 'Punctuator', '^^^')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildReferenceFlags = (flags = {}) => {
  const { expression = null, hasGap = null } = flags;
  let expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'ReferenceFlags'),
      t.ref`expressionToken`,
      gap(expression ? buildToken(l.CSTML, 'Punctuator', '+') : buildNullNode()),
      t.ref`hasGapToken`,
      gap(hasGap ? buildToken(l.CSTML, 'Punctuator', '$') : buildNullNode()),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildNodeFlags = (flags = {}) => {
  const { token = null, hasGap = null } = flags;
  let expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'NodeFlags'),
      t.ref`triviaToken`,
      gap(token ? buildToken(l.CSTML, 'Punctuator', '*') : buildNullNode()),
      t.ref`hasGapToken`,
      gap(hasGap ? buildToken(l.CSTML, 'Punctuator', '$') : buildNullNode()),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildSpamMatcher = (type = null, value = null, attributes = {}) => {
  return buildOpenNodeMatcher(t.nodeFlags, null, type, value, attributes);
};

export const buildOpenNodeMatcher = (flags, language, type, intrinsicValue, attributes = {}) => {
  const expressions = [];
  const attributes_ = buildAttributes(attributes);
  const gap = buildFilledGapFunction(expressions);

  let language_;

  if (!type) throw new Error();

  if (isString(language)) {
    language_ = language;
  } else {
    let lArr = isString(language) ? language : language ? [...language] : [];

    language_ = lArr.length === 0 ? null : lArr;
  }

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.Spamex, 'OpenNodeMatcher');
      yield t.ref`openToken`;
      yield gap(buildToken(l.CSTML, 'Punctuator', '<'));
      yield t.ref`flags`;
      yield gap(buildNodeFlags(flags));
      yield t.ref`language`;
      yield gap(language_ ? buildLanguage(language_) : buildNullNode());
      yield t.ref`languageSeparator`;
      yield gap(language_ && type ? buildToken(l.CSTML, 'Punctuator', ':') : buildNullNode());
      yield t.ref`type`;
      yield gap(['?', ' '].includes(type) ? buildPunctuator(l.CSTML, type) : buildIdentifier(type));

      yield* when(intrinsicValue, buildSpace().children);

      yield t.ref`intrinsicValue`;
      yield gap(intrinsicValue ? buildString(intrinsicValue) : buildNullNode());

      yield* when(attributes_.properties['.'].length, buildSpace().children);
      yield* interpolateFragment(attributes_, t.ref`attributes[]`, expressions);

      yield t.ref`selfClosingTagToken`;
      yield gap(buildToken(l.CSTML, 'Punctuator', '/'));
      yield t.ref`closeToken`;
      yield gap(buildToken(l.CSTML, 'Punctuator', '>'));
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

export const buildBasicNodeMatcher = (open) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [t.nodeOpen(t.nodeFlags, l.Spamex, 'BasicNodeMatcher'), t.ref`open`, gap(open), t.nodeClose()],
    { expressions },
  );
};

export const buildNullNode = () => {
  return treeFromStream([buildNullTag()]);
};

export const buildToken = (language, type, value, attributes = {}) => {
  return treeFromStream([
    t.nodeOpen(t.tokenFlags, language, type, attributes),
    t.lit(value),
    t.nodeClose(),
  ]);
};

export const buildPunctuator = (language, value, attributes = {}) => {
  return buildToken(language, 'Punctuator', value, attributes);
};

export const buildNodeOpenTag = (flags, language, type = null, attributes = {}) => {
  const attributes_ = buildAttributes(attributes);
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  let language_ = !language || language.length === 0 ? null : language;

  return treeFromStream(
    (function* () {
      yield t.ref`openToken`;
      yield gap(buildPunctuator(l.CSTML, '<'));
      yield t.ref`flags`;
      yield gap(buildNodeFlags(flags));
      yield t.ref`language`;
      yield gap(language_ && type ? buildLanguage(language_) : buildNullNode());
      yield t.ref`languageSeparator`;
      yield gap(language_ && type ? buildPunctuator(l.CSTML, ':') : buildNullNode());
      yield t.ref`type`;
      yield gap(type ? buildIdentifier(type) : buildNullNode());
      yield* when(attributes_.properties['.'].length, [t.ref`#`, gap(buildSpace())]);
      yield* interpolateFragment(attributes_, t.ref`attributes[]`, expressions);
      yield t.ref`closeToken`;
      yield gap(buildPunctuator(l.CSTML, '>'));
    })(),
    { expressions },
  );
};

export const buildDoctypeTag = (attributes) => {
  const attributes_ = buildAttributes(attributes);
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.CSTML, 'DoctypeTag');
      yield t.ref`openToken`;
      yield gap(buildPunctuator(l.CSTML, 'Punctuator', '<!'));
      yield t.ref`version`;
      yield gap(buildToken(l.CSTML, 'PositiveInteger', '0'));
      yield t.ref`versionSeparator`;
      yield gap(buildPunctuator(l.CSTML, 'Punctuator', ':'));
      yield t.ref`doctype`;
      yield gap(buildKeyword(l.CSTML, 'cstml'));
      yield t.nodeClose();

      yield* when(attributes_.properties['.'].length, buildSpace().children);
      yield* interpolateFragment(attributes_, t.ref`attributes[]`, expressions);

      yield t.ref`closeToken`;
      yield gap(buildToken(l.CSTML, 'Punctuator', '>'));
    })(),
    { expressions },
  );
};

export const buildIdentifierPath = (path) => {
  const path_ = isString(path) ? [path] : [...path];
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  if (!path_.length) {
    return null;
  }

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.CSTML, 'IdentifierPath');
      yield t.ref`segments[]`;
      yield t.arr();
      yield t.ref`separators[]`;
      yield t.arr();

      yield* path_
        .flatMap((name) => [
          t.ref`segments[]`,
          gap(buildIdentifier(name)),
          t.ref`separators[]`,
          gap(buildToken(l.CSTML, 'Punctuator', '.')),
        ])
        .slice(0, -1);

      yield t.nodeClose();
    })(),
    { expressions },
  );
};

export const buildLanguage = (language) => {
  return language && isString(language) && language.startsWith('https://')
    ? buildString(language)
    : buildIdentifierPath(language);
};

export const buildNodeCloseTag = (type, language) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'CloseNodeTag'),
      t.ref`openToken`,
      gap(buildToken(l.CSTML, 'Punctuator', '</')),
      t.ref`language`,
      t.gap(language ? buildLanguage(language) : buildNullNode()),
      t.ref`languageSeparator`,
      gap(language && type ? buildToken(l.CSTML, 'Punctuator', ':') : buildNullNode()),
      t.ref`type`,
      gap(type ? buildIdentifier(type) : buildNullNode()),
      t.ref`closeToken`,
      gap(buildToken(l.CSTML, 'Punctuator', '>')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildLiteralTag = (value) => {
  return treeFromStream([
    t.nodeOpen(t.nodeFlags, l.Instruction, 'LiteralTag'),
    t.ref`value`,
    t.lit(value),
    t.nodeClose(),
  ]);
};

export const buildTerminalProps = (matcher) => {
  const { attributes, value } = matcher.properties;

  return buildObject({ value, attributes });
};

export const buildSpace = () => {
  return buildToken(l.Space, 'Space', ' ');
};

export const buildIdentifier = (name) => {
  if (!/^[a-zA-Z]+$/.test(name)) throw new Error();

  return buildToken(l.Instruction, 'Identifier', name);
};

export const buildKeyword = (name) => {
  return buildToken(l.Instruction, 'Keyword', name);
};

export const buildCall = (verb, args) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.Instruction, 'Call'),
      t.ref`verb`,
      gap(verb),
      t.ref`arguments`,
      gap(args),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildProperty = (key, value) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.Instruction, 'Property');
      yield t.ref`key`;
      yield gap(key);
      yield t.ref`mapOperator`;
      yield gap(buildToken(l.Instruction, 'Punctuator', ':'));
      yield t.ref`#`;
      yield gap(buildSpace());
      yield t.ref`value`;
      yield gap(value);
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

const escapables = {
  '\r': 'r',
  '\n': 'n',
  '\t': 't',
  '\0': '0',
};

export const buildDigit = (value) => {
  return buildToken(l.CSTML, 'Digit', value);
};

export const buildInteger = (value, base = 10) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  const digits = value.toString(base).split('');

  return treeFromStream(
    concat(
      [t.nodeOpen(t.nodeFlags, l.CSTML, 'Integer'), t.ref`digits[]`, t.arr()],
      digits.flatMap((digit) => [t.ref`digits[]`, gap(buildDigit(digit))]),
      [t.nodeClose()],
    ),

    { expressions },
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

  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'Infinity'),
      t.ref`sign`,
      gap(buildToken(l.CSTML, 'Punctuator', sign)),
      t.ref`value`,
      gap(buildToken(l.CSTML, 'Keyword', 'Infinity')),
      t.nodeClose(),
    ],
    { expressions },
  );
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
  let lit = '';

  if (pieces.length === 1 && pieces[0] === "'") {
    const expressions = [];
    const gap = buildFilledGapFunction(expressions);
    return treeFromStream(
      [
        t.nodeOpen(t.nodeFlags, l.CSTML, 'String'),
        t.ref`openToken`,
        gap(buildToken(l.CSTML, 'Punctuator', '"')),
        t.ref`content`,
        gap(buildToken(l.CSTML, 'StringContent', value)),
        t.ref`closeToken`,
        gap(buildToken(l.CSTML, 'Punctuator', '"')),
        t.nodeClose(),
      ],
      { expressions },
    );
  }

  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.CSTML, 'String');
      yield t.ref`openToken`;
      const tok = buildToken(l.CSTML, 'Punctuator', "'");
      yield gap(tok);
      yield t.ref`content`;
      yield t.nodeOpen(t.tokenFlags, l.CSTML, 'StringContent');

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
                yield agastBuildLiteralTag(lit);
                lit = '';
              }

              let value;

              if (escapables[chr]) {
                const expressions = [];
                const gap = buildFilledGapFunction(expressions);

                value = treeFromStream(
                  [
                    t.nodeOpen(t.nodeFlags, l.CSTML, 'EscapeCode'),
                    t.ref`sigilToken`,
                    gap(buildKeyword(escapables[chr])),
                    t.ref`digits[]`,
                    t.arr(),
                    t.nodeClose(),
                  ],
                  { expressions },
                );
              } else if (chr.charCodeAt(0) < 32) {
                const hexDigits = chr.charCodeAt(0).toString(16).padStart(4, '0');
                const expressions = [];
                const gap = buildFilledGapFunction(expressions);

                value = treeFromStream(
                  [
                    t.nodeOpen(t.nodeFlags, l.CSTML, 'EscapeCode'),
                    t.ref`sigilToken`,
                    gap(buildKeyword('u')),
                    t.ref`digits[]`,
                    t.arr(),
                    [...hexDigits].flatMap((digit) => [t.ref`digits[]`, gap(buildDigit(digit))]),
                    t.nodeClose(),
                  ],
                  { expressions },
                );
              } else {
                value = buildKeyword(chr);
              }

              yield t.ref`@`;
              yield t.nodeOpen(t.nodeFlags, l.CSTML, 'EscapeSequence', { cooked: chr });
              yield t.ref`escape`;
              yield gap(buildToken(l.CSTML, 'Punctuator', '\\'));
              yield t.ref`value`;
              yield gap(value);
              yield t.nodeClose();
            } else {
              lit += chr;
            }
          }
        } else {
          yield agastBuildLiteralTag(lit);
          lit = '';

          if (piece == null) {
            throw new Error('not implemented');
          } else if (isString(piece.type)) {
            yield piece;
          } else {
            throw new Error();
          }
        }
      }

      if (lit) yield agastBuildLiteralTag(lit);
      lit = '';

      yield t.nodeClose();
      yield t.ref`closeToken`;
      yield gap(buildToken(l.CSTML, 'Punctuator', "'"));
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

export const buildBoolean = (value) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.Instruction, 'Boolean'),
      t.ref`sigilToken`,
      gap(buildToken(l.Instruction, 'Keyword', value ? 'true' : 'false')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildNull = () => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.Instruction, 'Null'),
      t.ref`sigilToken`,
      gap(buildToken(l.Instruction, 'Keyword', 'null')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildNullTag = () => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'NullTag'),
      t.ref`sigilToken`,
      gap(buildToken(l.CSTML, 'Keyword', 'null')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildArray = (elements) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.Instruction, 'Array');
      yield t.ref`openToken`;
      yield gap(buildToken(l.Instruction, 'Punctuator', '['));
      yield* interpolateFragment(elements, t.ref`elements[]`, expressions);
      yield t.ref`closeToken`;
      yield gap(buildToken(l.Instruction, 'Punctuator', ']'));
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

export const buildArrayElements = (values) => {
  const expressions = [];
  return treeFromStream(
    (function* () {
      yield t.doctype({ 'bablr-language': l.Instruction });
      yield t.fragOpen(t.nodeFlags);
      yield* buildSpaceSeparatedList(values, t.ref`.[]`, expressions);
      yield t.fragClose();
    })(),
    { expressions },
  );
};

export const buildTupleValues = buildArrayElements;

export const buildTuple = (values) => {
  const expressions = [];
  const gap_ = buildFilledGapFunction(expressions);
  const gap = (...args) => {
    return gap_(...args);
  };

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.Instruction, 'Tuple');
      yield t.ref`openToken`;
      yield gap(buildToken(l.Instruction, 'Punctuator', '('));
      yield* interpolateFragment(values, t.ref`values[]`, expressions);
      yield t.ref`closeToken`;
      yield gap(buildToken(l.Instruction, 'Punctuator', ')'));
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

export function* buildSpaceSeparatedList(values, ref, expressions) {
  const gap = buildFilledGapFunction(expressions);

  if (!ref.value.isArray) throw new Error();

  yield freeze({ ...ref });
  yield t.arr();

  let first = true;
  for (const value of values) {
    if (!first) {
      yield t.buildReferenceTag('#', false);
      yield gap(buildSpace());
    }
    yield freeze({ ...ref });
    yield gap(value || buildNullNode());
    first = false;
  }
}

export const buildObjectProperties = (properties) => {
  const expressions = [];

  return treeFromStream(
    concat(
      [t.doctype({ 'bablr-language': l.Instruction }), t.fragOpen(t.nodeFlags)],
      buildSpaceSeparatedList(properties, t.ref`properties[]`, expressions),
      [t.fragClose()],
    ),
    { expressions },
  );
};

export const buildObject = (properties) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.Instruction, 'Object');
      yield t.ref`openToken`;
      yield gap(buildToken(l.Instruction, 'Punctuator', '{'));

      yield* interpolateFragment(properties, t.ref`properties[]`, expressions);

      yield t.ref`closeToken`;
      yield gap(buildToken(l.Instruction, 'Punctuator', '}'));
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

export const buildMappingAttribute = (key, value) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'MappingAttribute'),
      t.ref`key`,
      gap(buildIdentifier(key)),
      t.ref`mapOperator`,
      gap(buildToken(l.CSTML, 'Punctuator', '=')),
      t.ref`value`,
      gap(buildExpression(value)),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildBooleanAttribute = (key, value) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.CSTML, 'BooleanAttribute'),
      t.ref`negateToken`,
      gap(!value ? buildPunctuator(l.CSTML, '!') : buildNullNode()),
      t.ref`key`,
      gap(buildIdentifier(key)),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildAttribute = (key, value) => {
  return isBoolean(value) ? buildBooleanAttribute(key, value) : buildMappingAttribute(key, value);
};

export const buildPattern = (alternatives, flags) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.Regex, 'Pattern');
      yield t.ref`openToken`;
      yield gap(buildToken(l.Regex, 'Punctuator', '/'));

      yield* interpolateFragment(alternatives, t.ref`alternatives[]`, expressions);

      yield t.ref`closeToken`;
      yield gap(buildToken(l.Regex, 'Punctuator', '/'));
      yield t.ref`flags`;
      yield gap(flags || buildReferenceFlags());
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

const flagCharacters = {
  global: 'g',
  ignoreCase: 'i',
  multiline: 'm',
  dotAll: 's',
  unicode: 'u',
  sticky: 'y',
};

export const buildRegexFlags = (flags = '') => {
  let expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.nodeOpen(t.nodeFlags, l.Regex, 'Flags');

      for (const { 0: name, 1: chr } of Object.entries(flagCharacters)) {
        yield t.buildReferenceTag(name + 'Token');

        yield gap(flags.includes(chr) ? buildToken(l.CSTML, 'Punctuator', chr) : buildNullNode());
      }
      yield t.nodeClose();
    })(),
    { expressions },
  );
};

export const buildAlternative = (elements) => {
  const expressions = [];

  return treeFromStream(
    concat(
      [t.nodeOpen(t.nodeFlags, l.Regex, 'Alternative')],
      interpolateFragment(elements, t.ref`elements[]`, expressions),
      [t.nodeClose()],
    ),
    { expressions },
  );
};

export const buildAlternatives = (alternatives = []) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    (function* () {
      yield t.doctype({ 'bablr-language': l.Regex });
      yield t.fragOpen(t.nodeFlags);
      yield t.ref`.[]`;
      yield t.arr();
      yield t.ref`separators[]`;
      yield t.arr();

      yield* alternatives
        .flatMap((alt) => [
          t.ref`.[]`,
          gap(alt),
          t.ref`separators[]`,
          gap(buildPunctuator(l.Regex, '|')),
        ])
        .slice(0, -2);

      yield t.fragClose();
    })(),
    { expressions },
  );
};

export const buildRegexGap = () => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.Regex, 'Gap'),
      t.ref`escapeToken`,
      gap(buildToken(l.Regex, 'Punctuator', '\\')),
      t.ref`value`,
      gap(buildToken(l.Regex, 'Keyword', 'g')),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildElements = (elements) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    concat(
      [t.doctype({ 'bablr-language': l.Regex }), t.fragOpen(t.nodeFlags), t.ref`.[]`, t.arr()],
      elements.flatMap((el) => [t.ref`.[]`, gap(el)]),
      [t.fragClose()],
    ),
    { expressions },
  );
};

export const buildExpression = (expr) => {
  if (isNull(expr)) return buildNullTag();

  switch (typeof expr) {
    case 'symbol':
    case 'boolean':
      return buildBoolean(expr);
    case 'string':
      return buildString(expr);
    case 'number':
      return buildInteger(expr);
    case 'object': {
      switch (getPrototypeOf(expr)) {
        case Array.prototype:
          return buildArray(buildArrayElements(expr));
        case Object.prototype:
          if (
            hasOwn(expr, 'type') &&
            hasOwn(expr, 'language') &&
            hasOwn(expr, 'children') &&
            hasOwn(expr, 'properties')
          ) {
            return expr;
          }
          return buildObject(
            buildObjectProperties(
              Object.entries(expr).map((e) => buildProperty(buildIdentifier(e[0]), e[1])),
            ),
          );
        default:
          throw new Error();
      }
    }
    default:
      throw new Error();
  }
};

export const buildAttributes = (attributes) => {
  const attributes_ = Object.entries(attributes).map(({ 0: key, 1: value }) =>
    buildAttribute(key, value),
  );
  const expressions = [];

  return treeFromStream(
    (function* () {
      yield t.doctype({ 'bablr-language': l.CSTML });
      yield t.fragOpen(t.nodeFlags);
      yield* buildSpaceSeparatedList(attributes_, t.ref`.[]`, expressions);
      yield t.fragClose();
    })(),
    { expressions },
  );
};

export const buildPropertyMatcher = (refMatcher, nodeMatcher) => {
  const expressions = [];
  const gap = buildFilledGapFunction(expressions);

  return treeFromStream(
    [
      t.nodeOpen(t.nodeFlags, l.Spamex, 'PropertyMatcher'),
      t.ref`refMatcher`,
      gap(refMatcher || buildNullNode()),
      t.ref`nodeMatcher`,
      gap(nodeMatcher),
      t.nodeClose(),
    ],
    { expressions },
  );
};

export const buildGapNodeMatcher = () => {
  return buildToken(l.Spamex, 'GapNodeMatcher', '<//>');
};
