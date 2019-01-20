import CustomError from 'es6-error';
import { ErrorType } from './types';
import { IConfigContext } from './context';

const _error = Symbol.for('rollup-config:error');

export class ConfigError extends CustomError {
  readonly context: IConfigContext;
  readonly innerError: Error | null;

  constructor(
    msg: string,
    context: IConfigContext,
    innerError: Error | null = null,
  ) {
    super(msg);

    this.innerError = innerError;
    Object.defineProperty(this, 'innerError', {
      value: innerError,
      enumerable: true,
    });

    this.context = context;
    Object.defineProperty(this, 'context', {
      value: context,
      enumerable: true,
    });
  }
}
Object.defineProperty(ConfigError.prototype, _error, { value: true });

export class AggregatedConfigError extends ConfigError {
  readonly errors: ReadonlyArray<ConfigError>;

  constructor(
    errors: ReadonlyArray<ConfigError>,
    context: IConfigContext,
    message: string = 'One or more errors occured.',
  ) {
    // TODO: Compose error messages
    super(message, context, errors[0]);

    const arrCopy = Object.freeze([...errors]);
    this.errors = arrCopy;
    Object.defineProperty(this, 'errors', { value: arrCopy, enumerable: true });
  }
}

export const isConfigError = (o: any): o is ConfigError =>
  Boolean(o && o[_error]);

export const toError = (e: ErrorType, ctx: IConfigContext) =>
  e.length === 0 ? null : new AggregatedConfigError(e, ctx);
