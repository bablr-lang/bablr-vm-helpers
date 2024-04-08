import { getCooked } from '@bablr/agast-helpers/tree';
import { buildLiteral } from '@bablr/agast-helpers/builders';

export * from './builders.js';
export * from './run.js';

export const effectsFor = (verb) => {
  // prettier-ignore
  switch (verb) {
    case 'eat': return { success: 'eat', failure: 'fail' };
    case 'eatMatch': return { success: 'eat', failure: 'none' };
    case 'match': return { success: 'none', failure: 'none' };
    case 'guard': return { success: 'none', failure: 'fail' };
    default: throw new Error('invalid match verb')
  }
};

export const shouldBranch = (effects) => {
  return effects ? effects.success === 'none' || effects.failure === 'none' : false;
};

const reifyNodeFlags = (flags) => {
  let { token, escape, trivia } = flags?.properties || {};

  return { token: !!token, escape: !!escape, trivia: !!trivia };
};

export const reifyLanguage = (language) => {
  const value = reifyExpression(language);

  if (typeof value === 'string' && !value.startsWith('https://')) {
    throw new Error('bad language');
  }

  return value;
};

export const reifyExpression = (node) => {
  if (!node) return null;

  if (node.language === 'https://bablr.org/languages/offical/cstml') {
    switch (node.type) {
      case 'DoctypeTag': {
        let { doctype, language } = node.properties;
        return {
          type: 'DoctypeTag',
          value: { doctype: getCooked(doctype), language: reifyLanguage(language) },
        };
      }

      case 'Reference': {
        let { name: pathName, arrayOperator } = node.properties;

        pathName = reifyExpression(pathName);

        return { type: 'Reference', value: { pathName, pathIsArray: !!arrayOperator } };
      }

      case 'Literal': {
        let { value } = node.properties;

        return { type: 'Literal', value: getCooked(value.properties.content) };
      }

      case 'OpenFragmentTag': {
        let { flags } = node.properties;
        let { escape, trivia } = flags?.properties || {};

        flags = { escape: !!escape, trivia: !!trivia };

        return { type: 'OpenFragmentTag', value: { flags } };
      }

      case 'CloseFragmentTag': {
        return { type: 'CloseFragmentTag', value: {} };
      }

      case 'IdentifierPath': {
        return node.properties.segments.map((segment) => reifyExpression(segment));
      }

      case 'OpenNodeTag': {
        let { flags, language, type, attributes } = node.properties;

        flags = reifyNodeFlags(flags);
        language = reifyLanguage(language);
        type = reifyExpression(type);
        attributes = reifyAttributes(attributes);

        return { type: 'OpenNodeTag', value: { flags, language, type, attributes } };
      }

      case 'CloseNodeTag': {
        let { language, type } = node.properties;

        language = reifyLanguage(language);
        type = reifyExpression(type);

        return { type: 'CloseNodeTag', value: { language, type } };
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
      let { flags, language, type, attributes, value } = node.properties;

      flags = reifyNodeFlags(flags);
      language = reifyExpression(language);
      type = reifyExpression(type);
      attributes = reifyAttributes(attributes);
      value = reifyExpression(value);

      const children = value && flags.token ? [buildLiteral(value)] : [];

      return { flags, language, type, children, properties: {}, attributes };

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
      const { values } = node.properties;

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
        return [reifyExpression(attr.properties.key), true];
      } else {
        throw new Error();
      }
    }),
  );
};
