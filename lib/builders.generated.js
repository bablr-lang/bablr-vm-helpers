import { interpolateString as _interpolateString } from "@bablr/agast-helpers/template";
import { interpolateArrayChildren as _interpolateArrayChildren } from "@bablr/agast-helpers/template";
import { interpolateArray as _interpolateArray } from "@bablr/agast-helpers/template";
import * as _l from "@bablr/agast-vm-helpers/languages";
import * as _t from "@bablr/agast-helpers/shorthand";
import { interpolateArrayChildren } from '@bablr/agast-helpers/template';
import * as t from '@bablr/agast-helpers/shorthand';
import * as l from './languages.js';
const {
  getPrototypeOf,
  freeze
} = Object;
export const when = (condition, value) => condition ? value : {
  *[Symbol.iterator]() {}
};
export const buildReference = (pathName, pathIsArray) => {
  return t.node(l.CSTML, 'Reference', [t.ref`name`, ...when(pathIsArray, [t.ref`arrayOperator`])], {
    name: buildIdentifier(pathName),
    arrayOperator: pathIsArray ? t.s_node(l.CSTML, 'Punctuator', '[]') : null
  });
};
export const buildGap = () => {
  return t.node(l.CSTML, 'Gap', [t.ref`value`], {
    value: t.s_node(l.CSTML, 'Punctuator', '<//>')
  });
};
export const buildNodeFlags = (flags = {}) => {
  const {
    token = null,
    escape = null,
    trivia = null
  } = flags;
  if (!(token || escape || trivia)) {
    return null;
  }
  return t.node(l.CSTML, 'NodeFlags', [...when(token, [t.ref`token`]), ...when(trivia, [t.ref`trivia`]), ...when(escape, [t.ref`escape`])], {
    token: token && t.s_node(l.CSTML, 'Punctuator', '*'),
    trivia: trivia && t.s_node(l.CSTML, 'Punctuator', '#'),
    escape: escape && t.s_node(l.CSTML, 'Punctuator', '@')
  });
};
export const buildNodeOpenTag = (flags, language, type, attributes = {}) => {
  const attributes_ = Object.entries(attributes).map(({
    0: key,
    1: value
  }) => buildAttribute(key, value));
  const flags_ = buildNodeFlags(flags);
  return t.node(l.CSTML, 'OpenNodeTag', [t.ref`open`, ...when(flags_, [t.ref`flags`]), ...when(language, [t.ref`language`, t.ref`languageSeparator`]), t.ref`type`, ...when(attributes_.length, [t.embedded(buildSpace())]), ...interpolateArrayChildren(attributes, t.ref`attributes[]`, t.embedded(buildSpace())), t.ref`close`], {
    open: t.s_node(l.CSTML, 'Punctuator', '<'),
    language: language && (language.startsWith('https://') ? buildString(language) : buildIdentifier(language)),
    languageSeparator: language && type && t.s_node(l.CSTML, 'Punctuator', ':'),
    flags: flags_,
    type: buildIdentifier(type),
    attributes: attributes_,
    close: t.s_node(l.CSTML, 'Punctuator', '>')
  });
};
export const buildDoctypeTag = language => {
  if (!language.startsWith('https://')) {
    throw new Error();
  }
  return t.node(l.CSTML, 'DoctypeTag', [t.ref`open`, t.ref`doctype`, t.embedded(buildSpace()), t.ref`language`, t.ref`close`], {
    open: t.s_node(l.CSTML, 'Punctuator', '<!'),
    doctype: t.s_node(l.CSTML, 'Keyword', 'cstml'),
    language: buildString(language),
    attributes: null,
    close: t.s_node(l.CSTML, 'Punctuator', '>')
  });
};
export const buildFragmentFlags = (flags = {}) => {
  const {
    escape = null,
    trivia = null
  } = flags;
  if (!(escape || trivia)) {
    return null;
  }
  return t.node(l.CSTML, 'NodeFlags', [...when(trivia, [t.ref`trivia`]), ...when(escape, [t.ref`escape`])], {
    trivia: trivia && t.s_node(l.CSTML, 'Punctuator', '#'),
    escape: escape && t.s_node(l.CSTML, 'Punctuator', '@')
  });
};
export const buildFragmentOpenTag = flags => {
  return t.node(l.CSTML, 'OpenFragmentTag', [t.ref`open`, ...when(flags, [t.ref`flags`]), t.ref`close`], {
    open: t.s_node(l.CSTML, 'Punctuator', '<'),
    flags: buildFragmentFlags(flags),
    close: t.s_node(l.CSTML, 'Punctuator', '>')
  });
};
export const buildNodeCloseTag = (type, language) => {
  return t.node(l.CSTML, 'CloseNodeTag', [t.ref`open`, ...when(language, [t.ref`language`]), ...when(type && language, [t.ref`languageSeparator`]), ...when(type, [t.ref`type`]), t.ref`close`], {
    open: t.s_node(l.CSTML, 'Punctuator', '</'),
    language: type && buildString(language),
    languageSeparator: language && type ? t.s_node(l.CSTML, 'Punctuator', ':') : null,
    type: type && buildIdentifier(type),
    close: t.s_node(l.CSTML, 'Punctuator', '>')
  });
};
export const buildFragmentCloseTag = () => {
  return t.node(l.CSTML, 'CloseFragmentTag', [t.ref`open`, t.ref`close`], {
    open: t.s_node(l.CSTML, 'Punctuator', '</'),
    close: t.s_node(l.CSTML, 'Punctuator', '>')
  });
};
export const buildLiteral = value => {
  return t.node(l.CSTML, 'Literal', [t.ref`value`], {
    value: buildString(value)
  });
};
export const buildTerminalProps = matcher => {
  const {
    attributes,
    value
  } = matcher.properties;
  return buildObject({
    value,
    attributes
  });
};
export const buildSpace = () => {
  return t.t_node(l.Comment, null, [t.embedded(t.t_node(l.Space, 'Space', [t.lit(' ')]))]);
};
export const buildIdentifier = name => {
  return t.node(l.Instruction, 'Identifier', [t.lit(name)]);
};
export const buildCall = (verb, ...args) => {
  return t.node(l.Instruction, 'Call', [t.ref`verb`, t.ref`arguments`], {
    verb: buildIdentifier(verb),
    arguments: buildTuple(args)
  });
};
export const buildSpamMatcher = type => {
  return t.node(l.Spamex, 'NodeMatcher', [t.ref`open`, t.ref`type`, t.ref`close`], {
    open: t.s_node(l.Spamex, 'Punctuator', '<'),
    language: null,
    languageSeparator: null,
    type: buildIdentifier(type),
    close: t.s_node(l.Spamex, 'Punctuator', '>')
  });
};
export const buildFullyQualifiedSpamMatcher = (language, type) => {
  return t.node(l.Spamex, 'NodeMatcher', [t.ref`open`, t.ref`type`, t.ref`close`], {
    open: t.s_node(l.Spamex, 'Punctuator', '<'),
    language: buildString(language),
    languageSeparator: t.s_node(l.Spamex, 'Punctuator', ':'),
    type: buildIdentifier(type),
    close: t.s_node(l.Spamex, 'Punctuator', '>')
  });
};
export const buildProperty = (key, value) => {
  return t.node(l.Instruction, 'Property', [t.ref`key`, t.ref`mapOperator`, t.embedded(buildSpace()), t.ref`value`], {
    key: buildIdentifier(key),
    mapOperator: t.s_node(l.Instruction, 'Punctuator', ':'),
    value: buildExpression(value)
  });
};
export const buildString = value => {
  const terminals = [];
  let lit = '';
  if (value === "'") {
    return _t.node(_l.CSTML, "String", [_t.ref`open`, _t.ref`content`, _t.ref`close`], {
      open: _t.s_node(_l.CSTML, "Punctuator", "\""),
      content: _interpolateString(freeze({
        type: 'Literal',
        value
      })),
      close: _t.s_node(_l.CSTML, "Punctuator", "\"")
    }, {});
  }
  for (const chr of value) {
    if (chr === "'") {
      if (lit) terminals.push(freeze({
        type: 'Literal',
        value: lit
      }));
      terminals.push(t.buildEmbedded(t.e_node(l.CSTML, 'Escape', [t.ref`escape`, t.ref`escapee`], {
        escape: t.s_node(l.CSTML, 'Punctuator', '\\'),
        escapee: t.node(l.CSTML, 'Literal', [t.lit`'`])
      }, {
        cooked: chr
      })));
    } else if (chr === '\\') {
      if (lit) terminals.push({
        type: 'Literal',
        value: lit
      });
      terminals.push(t.buildEmbedded(t.e_node(l.CSTML, 'Escape', [t.ref`escape`, t.ref`escapee`], {
        escape: t.s_node(l.CSTML, 'Punctuator', '\\'),
        escapee: t.node(l.CSTML, 'Literal', [t.lit('\\')])
      }, {
        cooked: chr
      })));
    } else {
      lit += chr;
    }
  }
  if (lit) terminals.push(freeze({
    type: 'Literal',
    value: lit
  }));
  return _t.node(_l.CSTML, "String", [_t.ref`open`, _t.ref`content`, _t.ref`close`], {
    open: _t.s_node(_l.CSTML, "Punctuator", "'"),
    content: _interpolateString(terminals),
    close: _t.s_node(_l.CSTML, "Punctuator", "'")
  }, {});
};
export const buildBoolean = value => {
  return value ? _t.node(_l.Instruction, "Boolean", [_t.ref`value`], {
    value: _t.s_node(_l.Instruction, "Keyword", "true")
  }, {}) : _t.node(_l.Instruction, "Boolean", [_t.ref`value`], {
    value: _t.s_node(_l.Instruction, "Keyword", "false")
  }, {});
};
export const buildNull = () => {
  return _t.node(_l.Instruction, "Null", [_t.ref`value`], {
    value: _t.s_node(_l.Instruction, "Keyword", "null")
  }, {});
};
export const buildArray = elements => {
  return _t.node(_l.Instruction, "Array", [_t.ref`open`, ..._interpolateArrayChildren(elements, _t.ref`elements[]`, _t.embedded(_t.t_node(_l.Comment, null, [_t.embedded(_t.t_node('Space', 'Space', [_t.lit(' ')]))]))), _t.ref`close`], {
    open: _t.s_node(_l.Instruction, "Punctuator", "["),
    elements: [..._interpolateArray(elements)],
    close: _t.s_node(_l.Instruction, "Punctuator", "]")
  }, {});
};
export const buildTuple = values => {
  return _t.node(_l.Instruction, "Tuple", [_t.ref`open`, ..._interpolateArrayChildren(values, _t.ref`values[]`, _t.embedded(_t.t_node(_l.Comment, null, [_t.embedded(_t.t_node('Space', 'Space', [_t.lit(' ')]))]))), _t.ref`close`], {
    open: _t.s_node(_l.Instruction, "Punctuator", "("),
    values: [..._interpolateArray(values)],
    close: _t.s_node(_l.Instruction, "Punctuator", ")")
  }, {});
};
export const buildObject = properties => {
  return _t.node(_l.Instruction, "Object", [_t.ref`open`, ..._interpolateArrayChildren(Object.entries(properties).map(([key, value]) => buildProperty(key, value)), _t.ref`properties[]`, _t.embedded(_t.t_node(_l.Comment, null, [_t.embedded(_t.t_node('Space', 'Space', [_t.lit(' ')]))]))), _t.ref`close`], {
    open: _t.s_node(_l.Instruction, "Punctuator", "{"),
    properties: [..._interpolateArray(Object.entries(properties).map(([key, value]) => buildProperty(key, value)))],
    close: _t.s_node(_l.Instruction, "Punctuator", "}")
  }, {});
};
export const buildAttribute = (key, value) => {
  return t.node(l.CSTML, 'MappingAttribute', [t.ref`key`, t.ref`mapOperator`, t.ref`value`], {
    key: buildIdentifier(key),
    mapOperator: t.s_node(l.CSTML, 'Punctuator', '='),
    value: buildExpression(value)
  });
};
export const buildExpression = expr => {
  if (expr == null) return buildNull();
  switch (typeof expr) {
    case 'boolean':
      return buildBoolean(expr);
    case 'string':
      return buildString(expr);
    case 'object':
      {
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
