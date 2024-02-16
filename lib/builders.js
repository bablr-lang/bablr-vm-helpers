import { i, spam } from '@bablr/boot/shorthand.macro';
import { spread } from '@bablr/agast-helpers/template';
import * as t from '@bablr/agast-helpers/shorthand';

const { getPrototypeOf, freeze } = Object;

export const buildTerminalProps = (matcher) => {
  const { attributes, value } = matcher.properties;

  return buildObject({ value, attributes });
};

export const buildSpace = () => {
  return t.t_node('Comment', null, [t.t_node('Space', 'Space', t.lit(' '))]);
};

export const buildIdentifier = (name) => {
  return t.node('Instruction', 'Identifier', [t.lit(name)]);
};

export const buildCall = (verb, ...args) => {
  return t.node('Instruction', 'Call', [t.ref`verb`, t.ref`arguments`], {
    verb: buildIdentifier(verb),
    arguments: buildTuple(args),
  });
};

export const buildSpamMatcher = (type) => {
  return spam`<${type}>`;
};

export const buildProperty = (key, value) => {
  return t.node(
    'Instruction',
    'Property',
    [t.ref`key`, t.ref`mapOperator`, buildSpace(), t.ref`value`],
    {
      key: buildIdentifier(key),
      mapOperator: t.s_node('Instruction', 'Punctuator', ':'),
      value: buildExpression(value),
    },
  );
};

export const buildString = (value) => {
  const terminals = [];
  let lit = '';

  for (const chr of value) {
    if (chr === "'") {
      if (lit) terminals.push(freeze({ type: 'Literal', value: lit }));

      terminals.push(
        t.e_node('String', 'Escape', [t.ref`escape`, t.ref`escapee`], {
          escape: t.s_node('String', 'Punctuator', '\\'),
          escapee: t.node('String', 'Literal', [t.lit`'`]),
        }),
      );
    } else if (chr === '\\') {
      if (lit) terminals.push({ type: 'Literal', value: lit });

      terminals.push(
        t.e_node('String', 'Escape', [t.ref`escape`, t.ref`escapee`], {
          escape: t.s_node('String', 'Punctuator', '\\'),
          escapee: t.node('String', 'Literal', [t.lit('\\')]),
        }),
      );
    } else {
      lit += chr;
    }
  }

  if (lit) terminals.push(freeze({ type: 'Literal', value: lit }));

  return i.Expression`'${terminals}'`;
};

export const buildBoolean = (value) => {
  return value ? i.Expression`true` : i.Expression`false`;
};

export const buildNull = () => {
  return i.Expression`null`;
};

function* interleave(elements, buildSeparator) {
  for (const element of elements) {
    yield element;
    yield buildSeparator();
  }
}

export const buildArray = (elements) => {
  return i.Expression`[${spread(interleave(elements, buildSpace))}]`;
};

export const buildTuple = (values) => {
  return i.Expression`(${spread(interleave(values, buildSpace))})`;
};

export const buildObject = (properties) => {
  return i.Expression`{${spread(
    Object.entries(properties).map(([key, value]) => buildProperty(key, value)),
  )}}`;
};

export const buildAttributes = (attributes) => {
  return Object.entries(attributes)
    .flatMap(([key, value]) => [buildAttribute(key, value), buildSpace])
    .slice(0, -1);
};

export const buildAttribute = (key, value) => {
  return t.node('CSTML', 'Attribute', [t.ref`key`, t.ref`mapOperator`, t.ref`value`], {
    key: buildIdentifier(key),
    mapOperator: t.s_node('CSTML', 'Punctuator', '='),
    value: buildExpression(value),
  });
};

export const buildExpression = (expr) => {
  if (expr == null) return buildNull();

  switch (typeof expr) {
    case 'boolean':
      return buildBoolean(expr);
    case 'string':
      return buildString(expr);
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
