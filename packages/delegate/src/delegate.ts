import {
  Awaitable,
  ConfigError,
  IConfigContext,
  createMiddleware,
  createPipe,
  getConfigFile,
} from '@yolodev/rollup-config-core';
import {
  NameKind,
  createNameFactory,
  createNamed,
  fs,
} from '@yolodev/rollup-config-utils';
import { isDelegatedContext, withDelegations } from './context';

import path from 'path';

type DelegatedToOptions = {
  configFile: string | ((context: IConfigContext) => Awaitable<string>);
};

const defaultDelegatedToOptions: DelegatedToOptions = {
  configFile: 'rollup.config.js',
};

class CircularConfigDelegationError extends ConfigError {
  readonly delegatedTo: string;
  readonly path: ReadonlyArray<string>;

  constructor(
    delegatedTo: string,
    path: ReadonlyArray<string>,
    context: IConfigContext,
  ) {
    super(
      `Circular config delegation detected: ${[...path, delegatedTo]
        .map(n => `'${n}'`)
        .join(' -> ')}`,
      context,
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

  constructor(configFile: string, context: IConfigContext) {
    super(`Config file '${configFile}' was not found.`, context);

    this.configFile = configFile;
    Object.defineProperty(this, 'configFile', { value: configFile });
  }
}

// class DelegatedConfigIsNotValidError extends ConfigError {
//   readonly configFile: string;

//   constructor(configFile: string) {
//     super(
//       `Config file '${configFile}' is not a valid configuration pipe. It needs to have a default export that is a IConfigPipe.`,
//     );

//     this.configFile = configFile;
//     Object.defineProperty(this, 'configFile', { value: configFile });
//   }
// }

export const delegate = (opts: Partial<DelegatedToOptions> = {}) => {
  const options = { ...defaultDelegatedToOptions, ...opts };
  const optsName = createNamed((kind = NameKind.Simple) => {
    if (kind === NameKind.Simple)
      return typeof options.configFile === 'string'
        ? options.configFile
        : '<config-file-fn>';
    if (kind === NameKind.Compact) return JSON.stringify(options);
    return JSON.stringify(options, null, 2);
  });
  const nameFactory = createNameFactory('delegate', [optsName]);

  return createMiddleware(nameFactory, innerPipe =>
    createPipe(nameFactory, async (cmdOpts, inner, context) => {
      const delegateTo = path.resolve(
        context.cwd,
        typeof options.configFile === 'string'
          ? options.configFile
          : await options.configFile(context),
      );

      let newDelegatedFrom = Object.freeze([delegateTo]);
      if (isDelegatedContext(context)) {
        const { delegatedFrom } = context;
        if (delegatedFrom.includes(delegateTo)) {
          throw new CircularConfigDelegationError(
            delegateTo,
            delegatedFrom,
            context,
          );
        }

        newDelegatedFrom = Object.freeze([...delegatedFrom, delegateTo]);
      }

      const delegatedContext = withDelegations(context, newDelegatedFrom);

      if (!(await fs.exists(delegateTo))) {
        throw new DelegatedConfigNotFoundError(delegateTo, delegatedContext);
      }

      const config = await getConfigFile(delegateTo, delegatedContext);
      const innerResult = await innerPipe(cmdOpts, inner, delegatedContext);

      if (typeof config === 'function') {
        return await config(cmdOpts, innerResult, delegatedContext);
      }

      return config;
    }),
  );
};
