import {
  Awaitable,
  ConfigType,
  IConfigContext,
  IConfigPipe,
  RollupConfigFactoryPipe,
} from '@yolodev/rollup-config-core';
import {
  IPackageConfigContext,
  IProjectConfigContext,
  withPackage,
  withProject,
} from './context';
import { Package, Project } from './types';
import {
  RollupPackageConfigFactoryPipe,
  RollupProjectConfigFactoryPipe,
  createPackagePipe,
} from './pipe';

import path from 'path';
import readPkgUp from 'read-pkg-up';

export type WithPackageFactory = (
  pkg: Package,
  project: Project,
  commandOptions?: any,
) => Awaitable<ConfigType>;

export type WithPackageOptions = {};

const defaultWithProjectOptions: WithPackageOptions = {};

export const withPackageInfo = (
  fromPackage: WithPackageFactory,
  opts: Partial<WithPackageOptions>,
): IConfigPipe => {
  const options: WithPackageOptions = { ...defaultWithProjectOptions, ...opts };

  const packageConfigPipe: RollupPackageConfigFactoryPipe = (
    context: IPackageConfigContext,
  ) => fromPackage(context.package, context.project, context.commandOptions);

  const projectConfigPipe: RollupProjectConfigFactoryPipe = async (
    context: IProjectConfigContext,
  ) => {
    const { cwd } = context;
    const pkgInfo = await readPkgUp({ cwd });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      context.project.rootPath,
    );

    const pkgContext = withPackage(context, pkg);
    return await packageConfigPipe(pkgContext);
  };

  const configPipe: RollupConfigFactoryPipe = async (
    context: IConfigContext,
  ) => {
    const { cwd } = context;
    const project = new Project(cwd);
    const projectContext = withProject(context, project);

    const pkgInfo = await readPkgUp({ cwd });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      project.rootPath,
    );

    const pkgContext = withPackage(projectContext, pkg);
    return await packageConfigPipe(pkgContext);
  };

  return createPackagePipe(configPipe, projectConfigPipe, packageConfigPipe);
};
