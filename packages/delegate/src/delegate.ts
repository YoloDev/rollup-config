import {
  Awaitable,
  ConfigError,
  IConfigContext,
  IConfigPipe,
  RollupConfigFactoryPipe,
  fromPipeFunction,
  getConfigFile,
  isConfigPipe,
} from '@yolodev/rollup-config-core';
import { isDelegatedContext, withDelegations } from './context';

import { fs } from '@yolodev/rollup-config-utils';

type DelegatedToOptions = {
  configFile: string | ((context: IConfigContext) => Awaitable<string>);
};

const defaultDelegatedToProjectOptions: DelegatedToOptions = {
  configFile: 'rollup.config.js',
};

class CircularConfigDelegationError extends ConfigError {
  readonly delegatedTo: string;
  readonly path: ReadonlyArray<string>;

  constructor(delegatedTo: string, path: ReadonlyArray<string>) {
    super(
      `Circular config delegation detected: ${[...path, delegatedTo]
        .map(n => `'${n}'`)
        .join(' -> ')}`,
    );

    this.delegatedTo = delegatedTo;
    Object.defineProperty(this, 'delegatedTo', { value: delegatedTo });

    const arrCopy = Object.freeze([...path]);
    this.path = arrCopy;
    Object.defineProperty(this, 'path', { value: arrCopy });
  }
}

class DelegatedConfigNotFoundError extends ConfigError {
  readonly configFile: string;

  constructor(configFile: string) {
    super(`Config file '${configFile}' was not found.`);

    this.configFile = configFile;
    Object.defineProperty(this, 'configFile', { value: configFile });
  }
}

class DelegatedConfigIsNotValidError extends ConfigError {
  readonly configFile: string;

  constructor(configFile: string) {
    super(
      `Config file '${configFile}' is not a valid configuration pipe. It needs to have a default export that is a IConfigPipe.`,
    );

    this.configFile = configFile;
    Object.defineProperty(this, 'configFile', { value: configFile });
  }
}

export const delegate = (opts: Partial<DelegatedToOptions>): IConfigPipe => {
  const options: DelegatedToOptions = {
    ...defaultDelegatedToProjectOptions,
    ...opts,
  };

  const pipe: RollupConfigFactoryPipe = async (context: IConfigContext) => {
    const delegateTo =
      typeof options.configFile === 'string'
        ? options.configFile
        : await options.configFile(context);

    let newDelegatedFrom = [delegateTo];
    if (isDelegatedContext(context)) {
      const { delegatedFrom } = context;
      if (delegatedFrom.includes(delegateTo)) {
        return new CircularConfigDelegationError(delegateTo, delegatedFrom);
      }

      newDelegatedFrom = [...delegatedFrom, delegateTo];
    }

    const delegatedContext = withDelegations(context, newDelegatedFrom);

    if (!(await fs.exists(delegateTo))) {
      return new DelegatedConfigNotFoundError(delegateTo);
    }

    const config = await getConfigFile(delegateTo);
    if (!isConfigPipe(config)) {
      return new DelegatedConfigIsNotValidError(delegateTo);
    }

    return await config.withContext(delegatedContext);
  };

  return fromPipeFunction(pipe);
};
