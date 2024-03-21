import { Coroutine } from '@bablr/coroutine';
import { reifyExpression } from '@bablr/agast-vm-helpers';
import { printExpression } from '@bablr/agast-helpers/print';

export function* runSync(evaluator) {
  let co = new Coroutine(evaluator());

  co.advance();

  while (!co.done) {
    let returnValue = undefined;
    const sourceInstr = co.value;
    const instr = reifyExpression(sourceInstr);

    const { verb, arguments: { 0: arg } = [] } = instr;

    switch (verb) {
      case 'resolve':
        throw new Error('runSync cannot resolve promises');

      case 'emit':
        yield sourceInstr.properties.arguments.properties.values[0];
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
    const sourceInstr = co.value;
    const instr = reifyExpression(sourceInstr);

    const { verb, arguments: { 0: arg } = [] } = instr;

    switch (verb) {
      case 'resolve':
        returnValue = await arg;
        break;

      case 'emit':
        yield sourceInstr.properties.arguments.properties.values[0];
        break;

      default:
        throw new Error(`Unexpected call {verb: ${printExpression(verb)}}`);
    }

    co.advance(returnValue);
  }
}
