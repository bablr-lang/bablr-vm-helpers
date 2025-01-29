import { EmbeddedObject } from '@bablr/agast-helpers/symbols';

export const getEmbeddedObject = (expr) => {
  if (!expr) return expr;
  if (expr.type !== EmbeddedObject) throw new Error();
  return expr.value;
};

export const getEmbeddedTag = (embeddedTags) => {
  const tags = embeddedTags.value;
  if (tags.length !== 1) throw new Error();
  return tags[0];
};
