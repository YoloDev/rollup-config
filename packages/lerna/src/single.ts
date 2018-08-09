import { Awaitable, ConfigType } from './collect';

import Package from '@lerna/package';
import Project from '@lerna/project';
import path from 'path';
import readPkgUp from 'read-pkg-up';

export type WithProjectFactory = (
  project: Project,
  pkg: Package,
  commandOptions?: any,
) => Awaitable<ConfigType>;

export type WithProjectOptions = {
  cwd: string | ((commandOptions?: any) => string);
};

const defaultWithProjectOptions: WithProjectOptions = {
  cwd: () => process.cwd(),
};

export interface IPackageConfigFactory {
  (commandOptions?: any): Awaitable<ConfigType>;
  withPackage(
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ): Awaitable<ConfigType>;
}

export const single = (
  fromPackage: WithProjectFactory,
  opts: Partial<WithProjectOptions>,
): IPackageConfigFactory => {
  const options: WithProjectOptions = { ...defaultWithProjectOptions, ...opts };

  const withPackage = fromPackage;
  const factory = (async (commandOptions?: any) => {
    const cwd =
      typeof options.cwd === 'string'
        ? options.cwd
        : options.cwd(commandOptions);
    const project = new Project(cwd);
    const pkgInfo = await readPkgUp({ cwd });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      project.rootPath,
    );

    return await fromPackage(project, pkg, commandOptions);
  }) as IPackageConfigFactory;

  Object.defineProperties(factory, {
    withPackage: { value: withPackage },
  });

  return factory;
};
