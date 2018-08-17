import {
  Awaitable,
  IConfigContext,
  IConfigPipe,
  RollupConfigFactoryPipe,
  withCwd,
} from '@yolodev/rollup-config-core';
import {
  IPackageConfigContext,
  IProjectConfigContext,
  withPackage,
  withProject,
} from './context';
import { Package, PackageConfigError, Project } from './types';
import {
  RollupPackageConfigFactoryPipe,
  RollupProjectConfigFactoryPipe,
  createPackagePipe,
} from './pipe';

import { delegate } from '@yolodev/rollup-config-delegate';
import path from 'path';
import readPkgUp from 'read-pkg-up';

type DelegatedToProjectOptions = {
  packageDir: string | ((dirname: string) => Awaitable<string>);
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultDelegatedToProjectOptions: DelegatedToProjectOptions = {
  packageDir: (dirname: string) => dirname,
  configFile: 'rollup.config.js',
};

export const delegateToProject = (
  opts: Partial<DelegatedToProjectOptions>,
): IConfigPipe => {
  const options: DelegatedToProjectOptions = {
    ...defaultDelegatedToProjectOptions,
    ...opts,
  };

  const packageConfigPipe: RollupPackageConfigFactoryPipe = async (
    context: IPackageConfigContext,
  ) => {
    const configFile =
      typeof options.configFile === 'string'
        ? path.resolve(context.project.rootPath, options.configFile)
        : await options.configFile(context.project);

    return await delegate({ configFile }).withContext(context);
  };

  const configPipe: RollupConfigFactoryPipe = async (
    context: IConfigContext,
  ) => {
    const packageDir =
      typeof options.packageDir === 'string'
        ? path.resolve(context.cwd, options.packageDir)
        : await options.packageDir(context.cwd);

    const project = new Project(packageDir);
    const pkgInfo = await readPkgUp({ cwd: packageDir });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      project.rootPath,
    );

    const packageContext = withCwd(
      withPackage(withProject(context, project), pkg),
      packageDir,
    );

    return await packageConfigPipe(packageContext);
  };

  const projectConfigPipe: RollupProjectConfigFactoryPipe = async (
    context: IProjectConfigContext,
  ) => {
    const packageDir =
      typeof options.packageDir === 'string'
        ? path.resolve(context.cwd, options.packageDir)
        : await options.packageDir(context.cwd);

    const pkgInfo = await readPkgUp({ cwd: packageDir });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      context.project.rootPath,
    );

    const packageContext = withCwd(withPackage(context, pkg), packageDir);

    return await packageConfigPipe(packageContext);
  };

  return createPackagePipe(configPipe, projectConfigPipe, packageConfigPipe);
};
