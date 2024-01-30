import { getCooked } from '@bablr/agast-helpers';

export * from './builders.generated.js';

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

export const reifyExpression = (node) => {
  if (!node) return null;

  if (!['Instruction', 'String'].includes(node.language)) {
    return node;
  }

  switch (node.type) {
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

    case 'String':
      return node.properties.content ? getCooked(node.properties.content) : '';

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

  if (!['Instruction', 'String'].includes(node.language)) {
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
        return [getCooked(attr.properties.key), reifyExpression(attr.properties.value)];
      } else if (attr.type === 'BooleanAttribute') {
        return [getCooked(attr.properties.key), true];
      } else {
        throw new Error();
      }
    }),
  );
};
