import CustomError from 'es6-error';

const _error = Symbol.for('rollup-config:error');

export class ConfigError extends CustomError {
  innerError: Error | null;

  constructor(msg: string, innerError: Error | null = null) {
    super(msg);

    this.innerError = innerError;
    Object.defineProperty(this, 'innerError', {
      value: innerError,
      enumerable: true,
    });
  }
}
Object.defineProperty(ConfigError.prototype, _error, { value: true });

export const isConfigError = (o: any): o is ConfigError =>
  Boolean(o && o[_error]);
