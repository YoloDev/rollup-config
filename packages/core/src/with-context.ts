import { Awaitable, ConfigType, RollupConfigFactory } from './types';
import { IConfigContext, createContext } from './context';
import { IConfigPipe, createConfigPipe } from './pipe';

export const withContext = (
  fn: (context: IConfigContext) => Awaitable<ConfigType>,
): IConfigPipe => {
  const rollupFactory: RollupConfigFactory = (commandOptions?: any) =>
    fn(createContext(commandOptions));

  return createConfigPipe(rollupFactory, fn);
};
