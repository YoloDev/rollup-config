import {
  ConfigError,
  isConfigError,
} from '@yolodev/rollup-config-core/src/error';
import { IConfigPipe, fromPipeFunction } from './pipe';

import { RollupWatchOptions } from 'rollup';
import { toArray } from '@yolodev/rollup-config-utils';

class EmptyCombineError extends ConfigError {
  constructor() {
    super('choose() was called with no arguments');
  }
}

export const combine = (...pipes: IConfigPipe[]): IConfigPipe =>
  fromPipeFunction(async context => {
    if (pipes.length === 0) {
      return new EmptyCombineError();
    }

    let results: RollupWatchOptions[] = [];
    for (const pipe of pipes) {
      const result = await pipe.withContext(context);
      if (isConfigError(result)) {
        return result;
      } else {
        results.push(...toArray(result));
      }
    }

    return results;
  });
