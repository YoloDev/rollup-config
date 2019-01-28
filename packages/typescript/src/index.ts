import {
  IConfigContext,
  createMiddleware,
  createPipe,
} from '@yolodev/rollup-config-core';
import { IsExternal, RollupWatchOptions } from 'rollup';
import {
  NameKind,
  addPlugins,
  createNameFactory,
  createNamed,
} from '@yolodev/rollup-config-utils';

import path from 'path';
import typescriptPlugin from 'rollup-plugin-typescript2';

const createTypescriptPlugin = (
  _opts: TypescriptOptions,
  context: IConfigContext,
) =>
  typescriptPlugin({
    cacheRoot: path.resolve(context.root, '.rpt2_cache'),
    tsconfigOverride: {
      include: [
        path.join(path.resolve(context.cwd, 'src'), '**', '*.ts'),
        path.join(path.resolve(context.cwd, 'src'), '**', '*.tsx'),
      ],
      compilerOptions: {
        rootDir: path.resolve(context.cwd, 'src'),
        mapRoot: path.resolve(context.cwd, 'dist'),
      },
    },
  });

type TypescriptOptions = {
  condition: (options: RollupWatchOptions) => boolean;
};

const defaultTypescriptOptions: TypescriptOptions = {
  condition: () => true,
};

export const typescript = (opts: Partial<TypescriptOptions> = {}) => {
  const options = { ...defaultTypescriptOptions, ...opts };
  const optsName = createNamed((kind = NameKind.Simple) => {
    if (kind === NameKind.Compact || kind === NameKind.Simple)
      return JSON.stringify(options);
    return JSON.stringify(options, null, 2);
  });
  const nameFactory = createNameFactory('typescript', [optsName]);

  return createMiddleware(nameFactory, innerPipe =>
    createPipe(nameFactory, async (cmdOpts, inner, context) => {
      const plugin = createTypescriptPlugin(options, context);

      const innerResult = await innerPipe(cmdOpts, inner, context);
      return addPlugins(innerResult, [plugin], options.condition);
    }),
  );
};

export default typescript;
