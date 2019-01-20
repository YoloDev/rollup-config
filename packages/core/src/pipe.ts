import {
  ConfigType,
  RollupConfigFunction,
  RollupConfigPipe,
  _pipe,
} from './types';
import { IConfigContext, addStackFrame, createContext } from './context';
import { NameFactory, NameKind, _named } from '@yolodev/rollup-config-utils';

export const isConfigPipe = (o: any): o is RollupConfigPipe =>
  Boolean(o && o[_pipe]);

export const createPipe = (
  nameFactory: NameFactory,
  fn: RollupConfigFunction,
) => {
  const name = nameFactory(NameKind.Simple);
  const pipe = (async (
    commandOptions: any,
    inner?: ConfigType,
    context?: IConfigContext,
  ) => {
    const innerConfig = inner || [];
    const newContext = addStackFrame(context || createContext(), pipe);

    return await fn(commandOptions, innerConfig, newContext);
  }) as RollupConfigPipe;

  Object.defineProperties(pipe, {
    [_pipe]: { value: true, configurable: false, enumerable: false },
    [_named]: { value: nameFactory, configurable: false, enumerable: false },
    name: { value: name, configurable: true, enumerable: false },
  });

  return pipe;
};

export const empty = createPipe(() => '<empty>', () => []);
