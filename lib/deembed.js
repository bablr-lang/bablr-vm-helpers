import {
  EmbeddedNode,
  EmbeddedObject,
  EmbeddedTag,
  EmbeddedMatcher,
  EmbeddedRegex,
} from '@bablr/agast-helpers/symbols';

export const getEmbeddedObject = (expr) => {
  if (!expr) return expr;
  if (expr.type !== EmbeddedObject) throw new Error();
  return expr.value;
};

export const getEmbeddedNode = (expr) => {
  if (!expr) return expr;
  if (expr.type !== EmbeddedNode) throw new Error();
  return expr.value;
};

export const getEmbeddedMatcher = (expr) => {
  if (!expr) return expr;
  if (expr.type !== EmbeddedMatcher) throw new Error();
  return expr.value;
};

export const getEmbeddedRegex = (expr) => {
  if (!expr) return expr;
  if (expr.type !== EmbeddedRegex) throw new Error();
  return expr.value;
};

export const getEmbeddedTag = (expr) => {
  if (expr.type !== EmbeddedTag) throw new Error();
  const tag = expr.value;
  return tag;
};
