import {
  CommonConfigOptions,
  PerPackageOptions,
  readCommonConfig,
  readPackageConfig,
} from './read';
import { WithProjectFactory, WithProjectOptions, single } from './single';

import Package from '@lerna/package';
import Project from '@lerna/project';
import { createFactory } from './factory';

export { delegated } from './delegated';

export const perPackage = (options: Partial<PerPackageOptions> = {}) => {
  const getConfig = readPackageConfig(options);
  return createFactory((project: Project, pkg: Package, commandOptions?: any) =>
    getConfig(project, pkg, commandOptions),
  );
};

export const common = (options: Partial<CommonConfigOptions> = {}) => {
  const getConfig = readCommonConfig(options);
  return createFactory((project: Project, pkg: Package, commandOptions?: any) =>
    getConfig(project, pkg, commandOptions),
  );
};

export const withProject = (
  factory: WithProjectFactory,
  options: Partial<WithProjectOptions> = {},
) => {
  return single(factory, options);
};
