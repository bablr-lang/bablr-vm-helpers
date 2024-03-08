import { interpolateString as _interpolateString } from "@bablr/agast-helpers/template";
import { interpolateArrayChildren as _interpolateArrayChildren } from "@bablr/agast-helpers/template";
import { interpolateArray as _interpolateArray } from "@bablr/agast-helpers/template";
import * as _t from "@bablr/agast-helpers/shorthand";
import { interpolateArrayChildren } from '@bablr/agast-helpers/template';
import * as t from '@bablr/agast-helpers/shorthand';
const {
  getPrototypeOf,
  freeze
} = Object;
export const when = (condition, value) => condition ? value : {
  *[Symbol.iterator]() {}
};
export const buildReference = (pathName, pathIsArray) => {
  return t.node('CSTML', 'Reference', [t.ref`name`, ...when(pathIsArray, [t.ref`arrayOperator`])], {
    name: buildIdentifier(pathName),
    arrayOperator: pathIsArray ? t.s_node('CSTML', 'Punctuator', '[]') : null
  });
};
export const buildGap = () => {
  return t.node('CSTML', 'Gap', [t.ref`value`], {
    value: t.s_node('CSTML', 'Punctuator', '<//>')
  });
};
export const buildNodeFlags = (flags = {}) => {
  const {
    syntactic = null,
    escape = null,
    trivia = null
  } = flags;
  if (!(syntactic || escape || trivia)) {
    return null;
  }
  return t.node('CSTML', 'NodeFlags', [...when(syntactic, [t.ref`syntactic`]), ...when(trivia, [t.ref`trivia`]), ...when(escape, [t.ref`escape`])], {
    syntactic: syntactic && t.s_node('CSTML', 'Punctuator', '*'),
    trivia: trivia && t.s_node('CSTML', 'Punctuator', '#'),
    escape: escape && t.s_node('CSTML', 'Punctuator', '@')
  });
};
export const buildNodeOpenTag = (flags, type, attributes = []) => {
  const flags_ = buildNodeFlags(flags);
  return t.node('CSTML', 'OpenNodeTag', [t.ref`open`, ...when(flags_, [t.ref`flags`]), t.ref`type`, ...when(attributes.length, [t.embedded(buildSpace())]), ...interpolateArrayChildren(attributes, t.ref`attributes[]`, t.embedded(buildSpace())), t.ref`close`], {
    open: t.s_node('CSTML', 'Punctuator', '<'),
    flags: flags_,
    type: buildIdentifier(type),
    attributes: Object.entries(attributes).map(({
      0: key,
      1: value
    }) => buildAttribute(key, value)),
    close: t.s_node('CSTML', 'Punctuator', '>')
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
  return t.node('CSTML', 'NodeFlags', [...when(trivia, [t.ref`trivia`]), ...when(escape, [t.ref`escape`])], {
    trivia: trivia && t.s_node('CSTML', 'Punctuator', '#'),
    escape: escape && t.s_node('CSTML', 'Punctuator', '@')
  });
};
export const buildFragmentOpenTag = flags => {
  return t.node('CSTML', 'OpenFragmentTag', [t.ref`open`, ...when(flags, [t.ref`flags`]), t.ref`close`], {
    open: t.s_node('CSTML', 'Punctuator', '<'),
    flags: buildFragmentFlags(flags),
    close: t.s_node('CSTML', 'Punctuator', '>')
  });
};
export const buildNodeCloseTag = type => {
  return t.node('CSTML', 'CloseNodeTag', [t.ref`open`, ...when(type, [t.ref`type`]), t.ref`close`], {
    open: t.s_node('CSTML', 'Punctuator', '</'),
    type: type && buildIdentifier(type),
    close: t.s_node('CSTML', 'Punctuator', '>')
  });
};
export const buildFragmentCloseTag = () => {
  return t.node('CSTML', 'CloseFragmentTag', [t.ref`open`, t.ref`close`], {
    open: t.s_node('CSTML', 'Punctuator', '</'),
    close: t.s_node('CSTML', 'Punctuator', '>')
  });
};
export const buildLiteral = value => {
  return _t.node("CSTML", "Literal", [_t.ref`value`], {
    value: _t.node("String", "String", [_t.ref`open`, _t.ref`content`, _t.ref`close`], {
      open: _t.s_node("String", "Punctuator", "'"),
      content: _interpolateString(t.lit(value)),
      close: _t.s_node("String", "Punctuator", "'")
    }, {})
  }, {});
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
  return t.t_node('Comment', null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]);
};
export const buildIdentifier = name => {
  return t.node('Instruction', 'Identifier', [t.lit(name)]);
};
export const buildCall = (verb, ...args) => {
  return t.node('Instruction', 'Call', [t.ref`verb`, t.ref`arguments`], {
    verb: buildIdentifier(verb),
    arguments: buildTuple(args)
  });
};
export const buildSpamMatcher = type => {
  return _t.node("Spamex", "NodeMatcher", [_t.ref`open`, _t.ref`type`, _t.ref`close`], {
    open: _t.s_node("Spamex", "Punctuator", "<"),
    type: type,
    close: _t.s_node("Spamex", "Punctuator", ">")
  }, {});
};
export const buildProperty = (key, value) => {
  return t.node('Instruction', 'Property', [t.ref`key`, t.ref`mapOperator`, t.embedded(buildSpace()), t.ref`value`], {
    key: buildIdentifier(key),
    mapOperator: t.s_node('Instruction', 'Punctuator', ':'),
    value: buildExpression(value)
  });
};
export const buildString = value => {
  const terminals = [];
  let lit = '';
  for (const chr of value) {
    if (chr === "'") {
      if (lit) terminals.push(freeze({
        type: 'Literal',
        value: lit
      }));
      terminals.push(t.e_node('String', 'Escape', [t.ref`escape`, t.ref`escapee`], {
        escape: t.s_node('String', 'Punctuator', '\\'),
        escapee: t.node('String', 'Literal', [t.lit`'`])
      }));
    } else if (chr === '\\') {
      if (lit) terminals.push({
        type: 'Literal',
        value: lit
      });
      terminals.push(t.e_node('String', 'Escape', [t.ref`escape`, t.ref`escapee`], {
        escape: t.s_node('String', 'Punctuator', '\\'),
        escapee: t.node('String', 'Literal', [t.lit('\\')])
      }));
    } else {
      lit += chr;
    }
  }
  if (lit) terminals.push(freeze({
    type: 'Literal',
    value: lit
  }));
  return _t.node("String", "String", [_t.ref`open`, _t.ref`content`, _t.ref`close`], {
    open: _t.s_node("String", "Punctuator", "'"),
    content: _interpolateString(terminals),
    close: _t.s_node("String", "Punctuator", "'")
  }, {});
};
export const buildBoolean = value => {
  return value ? _t.node("Instruction", "Boolean", [_t.ref`value`], {
    value: _t.s_node("Instruction", "Keyword", "true")
  }, {}) : _t.node("Instruction", "Boolean", [_t.ref`value`], {
    value: _t.s_node("Instruction", "Keyword", "false")
  }, {});
};
export const buildNull = () => {
  return _t.node("Instruction", "Null", [_t.ref`value`], {
    value: _t.s_node("Instruction", "Keyword", "null")
  }, {});
};
export const buildArray = elements => {
  return _t.node("Instruction", "Array", [_t.ref`open`, ..._interpolateArrayChildren(elements, _t.ref`elements[]`, t.embedded(t.t_node('Comment', null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]))), _t.ref`close`], {
    open: _t.s_node("Instruction", "Punctuator", "["),
    elements: [..._interpolateArray(elements)],
    close: _t.s_node("Instruction", "Punctuator", "]")
  }, {});
};
export const buildTuple = values => {
  return _t.node("Instruction", "Tuple", [_t.ref`open`, ..._interpolateArrayChildren(values, _t.ref`values[]`, t.embedded(t.t_node('Comment', null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]))), _t.ref`close`], {
    open: _t.s_node("Instruction", "Punctuator", "("),
    values: [..._interpolateArray(values)],
    close: _t.s_node("Instruction", "Punctuator", ")")
  }, {});
};
export const buildObject = properties => {
  return _t.node("Instruction", "Object", [_t.ref`open`, ..._interpolateArrayChildren(Object.entries(properties).map(([key, value]) => buildProperty(key, value)), _t.ref`properties[]`, t.embedded(t.t_node('Comment', null, [t.embedded(t.t_node('Space', 'Space', [t.lit(' ')]))]))), _t.ref`close`], {
    open: _t.s_node("Instruction", "Punctuator", "{"),
    properties: [..._interpolateArray(Object.entries(properties).map(([key, value]) => buildProperty(key, value)))],
    close: _t.s_node("Instruction", "Punctuator", "}")
  }, {});
};
export const buildAttribute = (key, value) => {
  return t.node('CSTML', 'MappingAttribute', [t.ref`key`, t.ref`mapOperator`, t.ref`value`], {
    key: buildIdentifier(key),
    mapOperator: t.s_node('CSTML', 'Punctuator', '='),
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
