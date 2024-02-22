import { Coroutine } from '@bablr/coroutine';
import { reifyExpression } from '@bablr/agast-vm-helpers';
import { printExpression } from '@bablr/agast-helpers/print';

export function* runSync(evaluator) {
  let co = new Coroutine(evaluator);

  co.advance();

  while (!co.done) {
    const {
      verb: verbToken,
      arguments: {
        properties: { values: { 0: arg } = [] },
      },
    } = co.value.properties;

    const verb = reifyExpression(verbToken);

    switch (verb) {
      case 'resolve':
        throw new Error('runSync cannot resolve promises');

      case 'emit':
        yield arg;
        break;

      default:
        throw new Error(`Unexpected call {verb: ${printExpression(verb)}}`);
    }

    co.advance(undefined);
  }
}

export async function* runAsync(evaluator) {
  let co = new Coroutine(evaluator);

  co.advance();

  while (!co.done) {
    let returnValue;
    const {
      verb: verbToken,
      arguments: {
        properties: { values: { 0: arg } = [] },
      },
    } = co.value.properties;

    const verb = reifyExpression(verbToken);

    switch (verb) {
      case 'resolve':
        returnValue = await arg;
        break;

      case 'emit':
        yield arg;
        break;

      default:
        throw new Error();
    }

    co.advance(returnValue);
  }
}
