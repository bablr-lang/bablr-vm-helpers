export function* concat(...iterables) {
  for (const iterable of iterables) yield* iterable;
}

export const reduce = (reducer, values, initial) => {
  let acc = initial;

  for (const value of values) {
    acc = reducer(acc, value);
  }

  return acc;
};

export function* takeWhile(fn, iterable) {
  for (const value of iterable) {
    if (fn(value)) {
      yield value;
    } else {
      break;
    }
  }
}

export function* map(fn, iterable) {
  for (const value of iterable) {
    yield fn(value);
  }
}
