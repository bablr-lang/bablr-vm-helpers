import { sourceTextFor, getCooked, isNull, nodeFlags } from '@bablr/agast-helpers/tree';
import * as btree from '@bablr/agast-helpers/btree';
import * as sym from '@bablr/agast-helpers/symbols';
import { buildNodeCloseTag, buildLiteralTag, buildDoctypeTag } from '@bablr/agast-helpers/builders';
import {
  DoctypeTag,
  OpenNodeTag,
  OpenFragmentTag,
  CloseFragmentTag,
  CloseNodeTag,
  ReferenceTag,
  ShiftTag,
  GapTag,
  NullTag,
  ArrayTag,
  LiteralTag,
} from '@bablr/agast-helpers/symbols';

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
      return { success: 'fail', failure: 'none' };

    default:
      throw new Error('invalid match verb');
  }
};

export const shouldBranch = (effects) => {
  return effects ? effects.success === 'none' || effects.failure === 'none' : false;
};

const reifyFlags = (flags) => {
  let { triviaToken, escapeToken, tokenToken, expressionToken, hasGapToken } = flags.properties;

  return {
    token: !!reifyExpression(tokenToken),
    escape: !!reifyExpression(escapeToken),
    trivia: !!reifyExpression(triviaToken),
    expression: !!reifyExpression(expressionToken),
    hasGap: !!reifyExpression(hasGapToken),
  };
};

export const reifyLanguage = (language) => {
  const value = reifyExpression(language);

  return typeof value === 'string' && !value.startsWith('https://') ? [value] : value;
};

export const reifyProperties = (properties = []) => {
  const built = {};
  for (const property of btree.traverse(properties)) {
    switch (property.type) {
      case 'Property': {
        let { reference, value } = property.properties;

        reference = reifyExpression(reference);
        value = reifyExpression(value);

        if (reference.value.isArray) {
          built[reference.value.name] ||= [];
          built[reference.value.name].push(value);
        } else {
          built[reference.value.name] = value;
        }
        break;
      }
      default:
        throw new Error();
    }
  }
  return built;
};

export const buildFragmentChildren = (node) => {
  let { open, children = [], close } = node.properties;

  let built = [];

  open = reifyExpression(open);
  close = reifyExpression(close);

  built = btree.push(built, open);

  for (const child of btree.traverse(children)) {
    if (child.type !== 'Property') throw new Error('umimplemented');

    let { reference } = child.properties;

    reference = reifyExpression(reference);

    built = btree.push(built, reference);
  }

  built = btree.push(built, close);

  return built;
};

export const buildChildren = (node) => {
  let { open, children = [], close } = node.properties;

  const selfClosing = !!open.properties.selfClosingTagToken;
  const { intrinsicValue } = open.properties;
  let built = [];

  open = reifyExpression(open);
  close = reifyExpression(close);

  if (selfClosing) {
    built = btree.push(built, open);
    if (intrinsicValue) {
      built = btree.push(built, buildLiteralTag(intrinsicValue));
    }
    built = btree.push(built, buildNodeCloseTag());
  } else {
    built = btree.push(built, open);
    for (const child of btree.traverse(children)) {
      if (child.type !== 'Property') throw new Error('umimplemented');

      let { reference } = child.properties;

      reference = reifyExpression(reference);

      built = btree.push(built, reference);
    }

    built = btree.push(built, close);
  }

  return built;
};

export const reifyExpression = (node) => {
  if (node instanceof Promise) throw new Error();

  if (!node || node.type === sym.null) return null;

  if (!node.type) {
    node = node.properties['.'];
  }

  if (node.language === 'https://bablr.org/languages/core/en/cstml') {
    switch (node.type?.description || node.type) {
      case 'Document': {
        let { doctype, tree } = node.properties;

        doctype = reifyExpression(doctype);
        tree = reifyExpression(tree);

        let { attributes } = doctype.value;
        let { properties } = tree;

        return {
          flags: nodeFlags,
          language: attributes['bablr-language'],
          type: null,
          children: btree.addAt(
            0,
            buildFragmentChildren(node.properties.tree),
            buildDoctypeTag(attributes),
          ),
          properties,
          attributes,
        };
      }

      case 'Node': {
        let { open, children } = node.properties;

        open = reifyExpression(open);

        let { flags, language, type, attributes } = open.value;

        const properties = reifyProperties(children);

        return {
          flags,
          language,
          type,
          children: buildChildren(node),
          properties,
          attributes,
        };
      }

      case 'Fragment': {
        let { open, children } = node.properties;

        open = reifyExpression(open);

        let { flags } = open.value;

        const properties = reifyProperties(children);

        return {
          flags,
          language: null,
          type: null,
          children: buildChildren(node),
          properties,
          attributes: {},
        };
      }

      case 'DoctypeTag': {
        let { doctype, version, attributes } = node.properties;
        return {
          type: DoctypeTag,
          value: {
            doctype: getCooked(doctype),
            version: parseInt(sourceTextFor(version), 10),
            attributes: reifyAttributes(attributes),
          },
        };
      }

      case 'ReferenceTag': {
        let { name, arrayOperatorToken, hasGapToken } = node.properties;

        name = reifyExpression(name);

        return {
          type: ReferenceTag,
          value: { name, isArray: !isNull(arrayOperatorToken), hasGap: !isNull(hasGapToken) },
        };
      }

      case 'LiteralTag': {
        let { value } = node.properties;

        return { type: LiteralTag, value: getCooked(value.properties.content) };
      }
      case 'Identifier': {
        return getCooked(node);
      }
      case 'IdentifierPath': {
        return node.properties.segments.map((segment) => reifyExpression(segment));
      }

      case 'OpenNodeTag': {
        let { flags, language, type, attributes } = node.properties;

        flags = reifyFlags(flags);
        language = reifyLanguage(language);
        type = reifyExpression(type);
        attributes = reifyAttributes(attributes);

        return {
          type: OpenNodeTag,
          value: { flags, language, type, attributes },
        };
      }

      case 'CloseNodeTag': {
        let { language, type } = node.properties;

        language = reifyLanguage(language);
        type = reifyExpression(type);

        return { type: CloseNodeTag, value: { language, type } };
      }

      case 'OpenFragmentTag': {
        let { flags } = node.properties;

        flags = reifyFlags(flags);

        return {
          type: OpenFragmentTag,
          value: { flags },
        };
      }

      case 'CloseFragmentTag': {
        return { type: CloseFragmentTag, value: undefined };
      }

      case 'Integer': {
        let { digits } = node.properties;
        return parseInt(digits.map((digit) => getCooked(digit)).join(''), 10);
      }

      case 'Infinity': {
        return node.properties.sign === '-' ? -Infinity : Infinity;
      }

      case 'Punctuator': {
        return getCooked(node);
      }

      case 'String':
        return node.properties.content ? getCooked(node.properties.content) : '';

      case 'GapTag':
        return { type: GapTag, value: undefined };

      case 'ArrayTag':
        return { type: ArrayTag, value: undefined };

      case 'NullTag':
        return { type: NullTag, value: undefined };

      case 'ShiftTag':
        return { type: ShiftTag, value: undefined };

      default:
        throw new Error();
    }
  }

  if (
    ![
      'https://bablr.org/languages/core/en/bablr-vm-instruction',
      'https://bablr.org/languages/core/en/cstml',
      'https://bablr.org/languages/core/en/spamex',
    ].includes(node.language)
  ) {
    return node;
  }

  switch (node.type) {
    case 'NodeMatcher':
      let { flags, language, type, attributes, intrinsicValue } = node.properties.open.properties;

      flags = reifyFlags(flags);
      language = reifyLanguage(language);
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
        [...btree.traverse(properties)].map(({ properties: { key, value } }) => [
          getCooked(key),
          reifyExpression(value),
        ]),
      );
    }

    case 'Tuple': {
      const { values = [] } = node.properties;

      return [...btree.traverse(values)].map((el) => reifyExpression(el));
    }

    case 'Array': {
      const { elements = [] } = node.properties;

      return [...btree.traverse(elements)].map((el) => reifyExpression(el));
    }

    case 'LiteralTag':
    case 'Identifier':
      return getCooked(node);

    case 'Boolean': {
      // prettier-ignore
      switch (getCooked(node.properties.sigilToken)) {
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
  if (!node || node.type === sym.null) return null;

  if (
    ![
      'https://bablr.org/languages/core/en/bablr-vm-instruction',
      'https://bablr.org/languages/core/en/cstml',
    ].includes(node.language)
  ) {
    return node;
  }

  switch (node.type) {
    case 'Object': {
      const { properties } = node.properties;

      return Object.fromEntries(
        [...btree.traverse(properties)].map(({ properties: { key, value } }) => [
          getCooked(key),
          value,
        ]),
      );
    }

    case 'Array':
      return [...btree.traverse(node.properties.elements)];

    case 'Tuple':
      return [...btree.traverse(node.properties.values)];

    default:
      return reifyExpression(node);
  }
};

export const reifyAttributes = (attributes) => {
  if (attributes == null) return {};

  return Object.fromEntries(
    [...btree.traverse(attributes)].map((attr) => {
      if (attr.type === 'MappingAttribute') {
        return [reifyExpression(attr.properties.key), reifyExpression(attr.properties.value)];
      } else if (attr.type === 'BooleanAttribute') {
        return [reifyExpression(attr.properties.key), isNull(attr.properties.negateToken)];
      } else {
        throw new Error();
      }
    }),
  );
};
