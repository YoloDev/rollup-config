import { CommonConfigOptions, readCommonConfig } from './read-common-config';
import { ConfigContext, Package, Project } from './types';
import { PerPackageOptions, readPackageConfig } from './read-package-config';

import { fromPackage } from './factory';

export { delegated } from './delegated';
export { withPackageInfo } from './with-package';

export const perPackage = (options: Partial<PerPackageOptions> = {}) => {
  const getConfig = readPackageConfig(options);
  return fromPackage(
    (
      context: ConfigContext,
      project: Project,
      pkg: Package,
      commandOptions?: any,
    ) => getConfig(context, project, pkg, commandOptions),
  );
};

export const common = (options: Partial<CommonConfigOptions> = {}) => {
  const getConfig = readCommonConfig(options);
  return fromPackage(
    (
      context: ConfigContext,
      project: Project,
      pkg: Package,
      commandOptions?: any,
    ) => getConfig(context, project, pkg, commandOptions),
  );
};
