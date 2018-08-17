import { PerPackageOptions, readPackageConfig } from './read-package-config';

import { fromPackage } from './pipe';

export const perPackage = (options: Partial<PerPackageOptions> = {}) => {
  const getConfig = readPackageConfig(options);

  return fromPackage(getConfig);
};
