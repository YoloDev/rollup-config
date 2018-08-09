import { readCommonConfig, readPackageConfig } from './read';

import Project from '@lerna/project';
import { collect } from './collect';

export const perPackage = (commandOptions?: any) => {
  const project = new Project();
  return collect(project, readPackageConfig(commandOptions));
};

export const common = (commandOptions?: any) => {
  const project = new Project();
  return collect(project, readCommonConfig(project, commandOptions));
};
