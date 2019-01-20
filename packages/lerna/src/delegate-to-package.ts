import { Awaitable, createMiddleware } from '@yolodev/rollup-config-core';
import {
  NameKind,
  createNameFactory,
  createNamed,
} from '@yolodev/rollup-config-utils';

import { Package } from './types';
import { createPackagePipe } from './pipe';
import { delegate } from '@yolodev/rollup-config-delegate';

export type DelegateToPackageOptions = {
  configFile: string | ((pkg: Package) => Awaitable<string>);
};

const defaultPerPackageOptions: DelegateToPackageOptions = {
  configFile: 'rollup.config.js',
};

export const delegateToPackage = (
  opts: Partial<DelegateToPackageOptions> = {},
) => {
  const options = { ...defaultPerPackageOptions, ...opts };
  const optsName = createNamed((kind = NameKind.Simple) => {
    if (kind === NameKind.Simple)
      return typeof options.configFile === 'string'
        ? options.configFile
        : '<config-file-fn>';
    if (kind === NameKind.Compact) return JSON.stringify(options);
    return JSON.stringify(options, null, 2);
  });
  const nameFactory = createNameFactory('delegateToPackage', [optsName]);

  return createMiddleware(nameFactory, innerPipe =>
    createPackagePipe(nameFactory, async (cmdOpts, inner, context) => {
      const { package: pkg } = context;
      const configFile =
        typeof options.configFile === 'string'
          ? options.configFile
          : await options.configFile(pkg);

      return await delegate({ configFile })(innerPipe)(cmdOpts, inner, context);
    }),
  );
};
