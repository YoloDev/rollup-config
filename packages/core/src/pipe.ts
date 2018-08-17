import { Awaitable, ConfigType, RollupConfigFactory } from './types';
import { ConfigError, isConfigError } from './error';
import { IConfigContext, createContext } from './context';

import { fixPaths } from '@yolodev/rollup-config-utils';

const _pipe: unique symbol = Symbol.for('rollup-config:pipe');

export type RollupConfigFactoryPipe = (
  context: IConfigContext,
) => Awaitable<ConfigType | ConfigError>;

export interface IConfigPipe extends RollupConfigFactory {
  readonly withContext: RollupConfigFactoryPipe;
  readonly [_pipe]: true;
}

export const createConfigPipe = (
  rollupFactory: RollupConfigFactory,
  configPipe: RollupConfigFactoryPipe,
): IConfigPipe => {
  const part = ((commandOptions?: any) =>
    rollupFactory(commandOptions)) as IConfigPipe;
  Object.defineProperties(part, {
    withContext: { value: configPipe, configurable: false },
    [_pipe]: { value: true, configurable: false },
  });

  return part;
};

export const isConfigPipe = (o: any): o is IConfigPipe =>
  Boolean(o && o[_pipe]);

export const fromPipeFunction = (
  configPipe: RollupConfigFactoryPipe,
): IConfigPipe => {
  const factory: RollupConfigFactory = async (commandOptions?: any) => {
    const context = createContext(commandOptions);
    const result = await configPipe(context);
    if (isConfigError(result)) {
      throw result;
    }

    return fixPaths(result, context.cwd);
  };

  return createConfigPipe(factory, configPipe);
};
