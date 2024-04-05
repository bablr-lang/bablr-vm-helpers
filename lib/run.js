import { Coroutine } from '@bablr/coroutine';
import { reifyExpression } from '@bablr/agast-vm-helpers';
import { printExpression } from '@bablr/agast-helpers/print';

export function* runSync(evaluator) {
  let co = new Coroutine(evaluator());

  co.advance();

  while (!co.done) {
    let returnValue = undefined;
    const instr = co.value;

    const { verb, arguments: { 0: arg } = [] } = instr;

    switch (verb) {
      case 'resolve':
        throw new Error('runSync cannot resolve promises');

      case 'emit':
        yield arg;
        break;

      default:
        throw new Error(`Unexpected call {verb: ${printExpression(verb)}}`);
    }

    co.advance(returnValue);
  }
}

export async function* runAsync(evaluator) {
  let co = new Coroutine(evaluator());

  co.advance();

  while (!co.done) {
    let returnValue;
    const instr = co.value;

    const { verb, arguments: { 0: arg } = [] } = instr;

    switch (verb) {
      case 'resolve':
        returnValue = await arg;
        break;

      case 'emit':
        yield arg;
        break;

      default:
        throw new Error(`Unexpected call {verb: ${printExpression(verb)}}`);
    }

    co.advance(returnValue);
  }
}
