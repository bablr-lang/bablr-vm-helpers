import { getCooked } from '@bablr/agast-helpers/tree';

export * from './builders.js';

export const effectsFor = (verb) => {
  switch (verb) {
    case 'eat':
    case 'holdFor':
      return { success: 'eat', failure: 'fail' };

    case 'eatMatch':
    case 'holdForMatch':
      return { success: 'eat', failure: 'none' };

    case 'match':
      return { success: 'none', failure: 'none' };

    case 'guard':
      return { success: 'none', failure: 'fail' };

    default:
      throw new Error('invalid match verb');
  }
};

export const shouldBranch = (effects) => {
  return effects ? effects.success === 'none' || effects.failure === 'none' : false;
};

const reifyFlags = (node) => {
  let { triviaFlag, escapeFlag, tokenFlag, expressionFlag, intrinsicValue } = node.properties || {};

  return {
    token: !!tokenFlag,
    escape: !!escapeFlag,
    trivia: !!triviaFlag,
    intrinsic: !!intrinsicValue,
    expression: !!expressionFlag,
  };
};

export const reifyLanguage = (language) => {
  const value = reifyExpression(language);

  if (typeof value === 'string' && !value.startsWith('https://')) {
    throw new Error('bad language');
  }

  return value;
};

export const reifyExpression = (node) => {
  if (node instanceof Promise) throw new Error();

  if (!node) return null;

  if (node.language === 'https://bablr.org/languages/offical/cstml') {
    switch (node.type) {
      case 'DoctypeTag': {
        let { doctype, version, attributes } = node.properties;
        return {
          type: 'DoctypeTag',
          value: {
            doctype: getCooked(doctype),
            version: parseInt(getCooked(version), 10),
            attributes: reifyAttributes(attributes),
          },
        };
      }

      case 'Reference': {
        let { name, arrayOperator } = node.properties;

        name = reifyExpression(name);

        return { type: 'Reference', value: { name, isArray: !!arrayOperator } };
      }

      case 'Literal': {
        let { value } = node.properties;

        return { type: 'Literal', value: getCooked(value.properties.content) };
      }

      case 'OpenFragmentTag': {
        return { type: 'OpenFragmentTag', value: undefined };
      }

      case 'CloseFragmentTag': {
        return { type: 'CloseFragmentTag', value: {} };
      }

      case 'IdentifierPath': {
        return node.properties.segments.map((segment) => reifyExpression(segment));
      }

      case 'OpenNodeTag': {
        let { language, type, attributes, intrinsicValue } = node.properties;

        let flags = reifyFlags(node);
        language = reifyLanguage(language);
        type = reifyExpression(type);
        attributes = reifyAttributes(attributes);
        intrinsicValue = reifyExpression(intrinsicValue);

        return {
          type: 'OpenNodeTag',
          value: { flags, language, type, intrinsicValue, properties: {}, attributes },
        };
      }

      case 'CloseNodeTag': {
        let { language, type } = node.properties;

        language = reifyLanguage(language);
        type = reifyExpression(type);

        return { type: 'CloseNodeTag', value: { language, type } };
      }

      case 'Integer': {
        let { digits } = node.properties;
        return parseInt(digits.map((digit) => getCooked(digit)).join(''), 10);
      }

      case 'Infinity': {
        return node.properties.sign === '-' ? -Infinity : Infinity;
      }

      case 'String':
        return node.properties.content ? getCooked(node.properties.content) : '';

      case 'Gap':
        return { type: 'Gap', value: undefined };

      default:
        throw new Error();
    }
  }

  if (
    ![
      'https://bablr.org/languages/offical/bablr-vm-instruction',
      'https://bablr.org/languages/offical/cstml',
      'https://bablr.org/languages/offical/spamex',
    ].includes(node.language)
  ) {
    return node;
  }

  switch (node.type) {
    case 'NodeMatcher':
      let { language, type, attributes, intrinsicValue } = node.properties;

      let flags = reifyFlags(node);
      language = reifyExpression(language);
      type = reifyExpression(type);
      attributes = reifyAttributes(attributes);
      intrinsicValue = reifyExpression(intrinsicValue);

      return { flags, language, type, intrinsicValue, attributes };

    case 'Call': {
      const { verb, arguments: args } = node.properties;
      return { verb: reifyExpression(verb), arguments: reifyExpression(args) };
    }

    case 'Object': {
      const { properties } = node.properties;

      return Object.fromEntries(
        properties.map(({ properties: { key, value } }) => [
          getCooked(key),
          reifyExpression(value),
        ]),
      );
    }

    case 'Tuple': {
      const { values = [] } = node.properties;

      return [...values.map((el) => reifyExpression(el))];
    }

    case 'Array': {
      const { elements } = node.properties;

      return [...elements.map((el) => reifyExpression(el))];
    }

    case 'Literal':
    case 'Identifier':
      return getCooked(node);

    case 'Boolean': {
      // prettier-ignore
      switch (getCooked(node.properties.value)) {
        case 'true': return true;
        case 'false': return false;
        default: throw new Error();
      }
    }

    case 'Null':
      return null;

    default:
      throw new Error('bad expression');
  }
};

export const reifyExpressionShallow = (node) => {
  if (!node) return null;

  if (
    ![
      'https://bablr.org/languages/offical/bablr-vm-instruction',
      'https://bablr.org/languages/offical/cstml',
    ].includes(node.language)
  ) {
    return node;
  }

  switch (node.type) {
    case 'Object': {
      const { properties } = node.properties;

      return Object.fromEntries(
        properties.map(({ properties: { key, value } }) => [getCooked(key), value]),
      );
    }

    case 'Array':
      return [...node.properties.elements];

    case 'Tuple':
      return [...node.properties.values];

    default:
      return reifyExpression(node);
  }
};

export const reifyAttributes = (attributes) => {
  if (attributes == null) return {};

  return Object.fromEntries(
    attributes.map((attr) => {
      if (attr.type === 'MappingAttribute') {
        return [reifyExpression(attr.properties.key), reifyExpression(attr.properties.value)];
      } else if (attr.type === 'BooleanAttribute') {
        return [reifyExpression(attr.properties.key), !attr.properties.negateSigil];
      } else {
        throw new Error();
      }
    }),
  );
};
