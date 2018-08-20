import { PerPackageOptions } from './read-package-config';
import { SharedConfigOptions } from './read-shared-config';
import { choose } from '@yolodev/rollup-config-core';
import { fromPackage } from './pipe';
import { perPackage } from './per-package';
import { shared } from './shared';

export type ConventionalConfigOptions = {
  readonly perPackage: Partial<PerPackageOptions>;
  readonly shared: Partial<SharedConfigOptions>;
};

const defaultConventionalConfigOptions: ConventionalConfigOptions = Object.freeze(
  {
    perPackage: {},
    shared: {},
  },
);

export const conventional = (opts: Partial<ConventionalConfigOptions> = {}) => {
  const options = { ...opts, ...defaultConventionalConfigOptions };
  const perPackagePipe = choose(
    perPackage(options.perPackage),
    shared(options.shared),
  );

  return fromPackage(perPackagePipe.withContext);
};
