import { choose } from '@yolodev/rollup-config-core';
import { fromPackage } from './pipe';
import { perPackage } from './per-package';
import { shared } from './shared';

// TODO: options
export const smart = () => {
  const perPackagePipe = choose(perPackage(), shared());

  debugger;
  return fromPackage(perPackagePipe.withContext);
};
