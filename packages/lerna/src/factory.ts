import { Awaitable, ConfigType, collect } from './collect';

import Package from '@lerna/package';
import Project from '@lerna/project';

export interface IConfigFactory {
  (commandOptions?: any): Awaitable<ConfigType>;
  withProject(project: Project, commandOptions?: any): Awaitable<ConfigType>;
  withPackage(
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ): Awaitable<ConfigType>;
}

export const createFactory = (
  fromPackage: (
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ) => Awaitable<ConfigType>,
): IConfigFactory => {
  const withPackage = (project: Project, pkg: Package, commandOptions?: any) =>
    fromPackage(project, pkg, commandOptions);
  const withProject = (project: Project, commandOptions?: any) =>
    collect(project, pkg => fromPackage(project, pkg, commandOptions));
  const factory = ((commandOptions?: any) =>
    withProject(new Project(), commandOptions)) as IConfigFactory;

  Object.defineProperties(factory, {
    withProject: { value: withProject },
    withPackage: { value: withPackage },
  });

  return factory;
};

export const isFactory = (fn: any): fn is IConfigFactory => {
  return (
    typeof fn === 'function' &&
    typeof fn.withProject === 'function' &&
    typeof fn.withPackage === 'function'
  );
};
