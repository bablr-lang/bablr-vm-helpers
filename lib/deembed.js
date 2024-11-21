import { EmbeddedExpression, EmbeddedTag } from '@bablr/agast-helpers/symbols';

const { isArray } = Array;
const isString = (val) => typeof val === 'string';
const isNumber = (val) => typeof val === 'number';

export const deembedExpression = (expr) => {
  if (isString(expr) || expr == null || typeof expr === 'boolean' || isNumber(expr)) {
    return expr;
  } else if (isArray(expr)) {
    return expr.map((value) => deembedExpression(value));
  } else if (typeof expr === 'object') {
    return Object.fromEntries(
      Object.entries(expr.value).map(({ 0: key, 1: value }) => [key, deembedExpression(value)]),
    );
  } else {
    throw new Error();
  }
};

export const getEmbeddedExpression = (expr) => {
  if (!expr) return expr;
  if (expr.type !== EmbeddedExpression) throw new Error();
  return expr.value;
};

export const getEmbeddedTag = (expr) => {
  if (!expr) return expr;
  if (expr.type !== EmbeddedTag) throw new Error();
  return expr.value;
};
