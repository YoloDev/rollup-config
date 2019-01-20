import { ConfigError } from './error';
import { IConfigContext } from './context';
import { Named } from '@yolodev/rollup-config-utils';
import { RollupWatchOptions } from 'rollup';

export const _middleware = Symbol.for('rollup-config:middleware');
export const _pipe = Symbol.for('rollup-config:pipe');

export type ConfigType = RollupWatchOptions | ReadonlyArray<RollupWatchOptions>;
export type ErrorType = ReadonlyArray<ConfigError>;
export type Awaitable<T> = T | Promise<T>;

export type RollupConfigFunction = (
  commandOptions: any,
  inner: ConfigType,
  context: IConfigContext,
) => Awaitable<ConfigType>;

export type RollupConfigPipe = RollupConfigFunction &
  Named & {
    readonly [_pipe]: true;
    readonly name: string;
  };

export type RollupConfigMiddleware = Named & {
  readonly [_middleware]: true;
  readonly name: string;
  (
    inner?: RollupConfigPipe | RollupConfigFunction | ConfigType,
  ): RollupConfigPipe;
};
