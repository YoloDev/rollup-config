import {
  CommonConfigOptions,
  PerPackageOptions,
  readCommonConfig,
  readPackageConfig,
} from './read';

import Project from '@lerna/project';
import { collect } from './collect';

export const perPackage = (options: Partial<PerPackageOptions> = {}) => (
  commandOptions?: any,
) => {
  const project = new Project();
  return collect(project, readPackageConfig(options, commandOptions));
};

export const common = (options: Partial<CommonConfigOptions> = {}) => (
  commandOptions?: any,
) => {
  const project = new Project();
  return collect(project, readCommonConfig(options, project, commandOptions));
};
