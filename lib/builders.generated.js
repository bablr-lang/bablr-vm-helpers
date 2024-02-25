import { interpolateString as _interpolateString } from "@bablr/agast-helpers/template";
import { interpolateArrayChildren as _interpolateArrayChildren } from "@bablr/agast-helpers/template";
import { interpolateArray as _interpolateArray } from "@bablr/agast-helpers/template";
import * as _t from "@bablr/agast-helpers/shorthand";
import * as t from '@bablr/agast-helpers/shorthand';
const {
  getPrototypeOf,
  freeze
} = Object;
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
  return t.node('CSTML', 'Attribute', [t.ref`key`, t.ref`mapOperator`, t.ref`value`], {
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
