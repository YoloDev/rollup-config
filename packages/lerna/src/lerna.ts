import {
  DelegateToPackageOptions,
  delegateToPackage,
} from './delegate-to-package';
import {
  NameKind,
  createNameFactory,
  createNamed,
} from '@yolodev/rollup-config-utils';
import {
  choose,
  createMiddleware,
  passThrough,
} from '@yolodev/rollup-config-core';

import { createPackagePipe } from './pipe';

export type ConventionalConfigOptions = {
  readonly perPackage: Partial<DelegateToPackageOptions>;
};

const defaultConventionalConfigOptions: ConventionalConfigOptions = Object.freeze(
  {
    perPackage: {},
  },
);

export const lerna = (opts: Partial<ConventionalConfigOptions> = {}) => {
  const options = { ...defaultConventionalConfigOptions, ...opts };
  const optsName = createNamed((kind = NameKind.Simple) => {
    if (kind === NameKind.Compact || kind === NameKind.Simple)
      return JSON.stringify(options);
    return JSON.stringify(options, null, 2);
  });
  const nameFactory = createNameFactory('lerna', [optsName]);

  const innerMw = choose(delegateToPackage(options.perPackage), passThrough);

  return createMiddleware(nameFactory, innerPipe =>
    createPackagePipe(nameFactory, async (cmdOpts, inner, context) => {
      return await innerMw(innerPipe)(cmdOpts, inner, context);
    }),
  );
};
