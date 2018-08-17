import { CommonConfigOptions, readSharedConfig } from './read-shared-config';

import { fromPackage } from './pipe';

export const shared = (options: Partial<CommonConfigOptions> = {}) => {
  const getConfig = readSharedConfig(options);

  return fromPackage(getConfig);
};
