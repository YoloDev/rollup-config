import {
  ConfigError,
  isConfigError,
} from '@yolodev/rollup-config-core/src/error';
import { IConfigPipe, fromPipeFunction } from './pipe';

class EmptyChooseError extends ConfigError {
  constructor() {
    super('choose() was called with no arguments');
  }
}

class AllChoisesFailedError extends ConfigError {
  readonly errors: ReadonlyArray<ConfigError>;

  constructor(errors: ReadonlyArray<ConfigError>) {
    super('All choose alternatives failed', errors[0]);

    const arrCopy = Object.freeze([...errors]);
    this.errors = arrCopy;
    Object.defineProperty(this, 'errors', { value: arrCopy });
  }
}

export const choose = (...pipes: IConfigPipe[]): IConfigPipe =>
  fromPipeFunction(async context => {
    if (pipes.length === 0) {
      return new EmptyChooseError();
    }

    let errors: ConfigError[] = [];
    for (const pipe of pipes) {
      const result = await pipe.withContext(context);
      if (!isConfigError(result)) {
        return result;
      } else {
        errors.push(result);
      }
    }

    return new AllChoisesFailedError(errors);
  });
