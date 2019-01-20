import { AggregatedConfigError, ConfigError, isConfigError } from './error';

import { IConfigContext } from './context';
import { RollupConfigMiddleware } from './types';
import { createMiddleware } from './middleware';
import { createNameFactory } from '@yolodev/rollup-config-utils';
import { createPipe } from './pipe';

class EmptyChooseError extends ConfigError {
  constructor(context: IConfigContext) {
    super('choose() was called with no arguments', context);
  }
}

class AllChoicesFailedError extends AggregatedConfigError {
  constructor(errors: ReadonlyArray<ConfigError>, context: IConfigContext) {
    super(errors, context, 'All choices failed');
  }
}

export const choose = (...mws: RollupConfigMiddleware[]) => {
  const nameFactory = createNameFactory('choose', mws);

  return createMiddleware(nameFactory, innerPipe =>
    createPipe(nameFactory, async (cmdOpts, inner, context) => {
      if (mws.length === 0) {
        throw new EmptyChooseError(context);
      }

      const errors: ConfigError[] = [];

      for (const mw of mws) {
        const mwPipe = mw(innerPipe);
        try {
          return await mwPipe(cmdOpts, inner, context);
        } catch (e) {
          if (!isConfigError(e)) {
            throw e;
          }

          errors.push(e);
        }
      }

      throw new AllChoicesFailedError(errors, context);
    }),
  );
};
