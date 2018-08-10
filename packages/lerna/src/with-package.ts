import {
  Awaitable,
  ConfigContext,
  ConfigType,
  FromPackageFactory,
  FromProjectFactory,
  FromRollupFactory,
  IConfigFactory,
  Package,
  Project,
} from './types';

import { createFactory } from './factory';
import path from 'path';
import readPkgUp from 'read-pkg-up';

export type WithPackageFactory = (
  project: Project,
  pkg: Package,
  commandOptions?: any,
) => Awaitable<ConfigType>;

export type WithPackageOptions = {
  cwd: string | ((commandOptions?: any) => string);
};

const defaultWithProjectOptions: WithPackageOptions = {
  cwd: () => process.cwd(),
};

export const withPackageInfo = (
  fromPackage: WithPackageFactory,
  opts: Partial<WithPackageOptions>,
): IConfigFactory => {
  const options: WithPackageOptions = { ...defaultWithProjectOptions, ...opts };

  const fromRollupFactory: FromRollupFactory = async (commandOptions?: any) => {
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
  };

  const fromProjectFactory: FromProjectFactory = async (
    context: ConfigContext,
    project: Project,
    commandOptions?: any,
  ) => {
    const cwd =
      typeof options.cwd === 'string'
        ? options.cwd
        : options.cwd(commandOptions);

    const pkgInfo = await readPkgUp({ cwd });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      project.rootPath,
    );

    return await fromPackage(project, pkg, commandOptions);
  };

  const fromPackageFactory: FromPackageFactory = async (
    context: ConfigContext,
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ) => fromPackage(project, pkg, commandOptions);

  return createFactory(
    fromRollupFactory,
    fromProjectFactory,
    fromPackageFactory,
  );
};
