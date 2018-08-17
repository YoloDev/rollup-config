import { RollupWatchOptions } from 'rollup';

export type ConfigType = RollupWatchOptions | ReadonlyArray<RollupWatchOptions>;
export type Awaitable<T> = T | Promise<T>;

export type RollupConfigFactory = (
  commandOptions?: any,
) => Awaitable<ConfigType>;
