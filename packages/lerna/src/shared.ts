import { SharedConfigOptions, readSharedConfig } from './read-shared-config';

import { fromPackage } from './pipe';

export const shared = (options: Partial<SharedConfigOptions> = {}) => {
  const getConfig = readSharedConfig(options);

  return fromPackage(getConfig);
};
