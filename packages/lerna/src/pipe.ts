import {
  Awaitable,
  ConfigError,
  ConfigType,
  IConfigContext,
  IConfigPipe,
  RollupConfigFactoryPipe,
  fromPipeFunction,
} from '@yolodev/rollup-config-core';
import {
  IPackageConfigContext,
  IProjectConfigContext,
  isPackageContext,
  isProjectContext,
  withProject,
} from './context';

import Project from '@lerna/project';
import { collect } from './collect';

const _projectPipe: unique symbol = Symbol.for('rollup-config:project-pipe');
const _packagePipe: unique symbol = Symbol.for('rollup-config:project-pipe');

export type RollupProjectConfigFactoryPipe = (
  context: IProjectConfigContext,
) => Awaitable<ConfigType | ConfigError>;

export type RollupPackageConfigFactoryPipe = (
  context: IPackageConfigContext,
) => Awaitable<ConfigType | ConfigError>;

export interface IRollupProjectPipe extends IConfigPipe {
  readonly [_projectPipe]: true;
}

export interface IRollupPackagePipe extends IRollupProjectPipe {
  readonly [_packagePipe]: true;
}

export const createPackagePipe = (
  configPipe: RollupConfigFactoryPipe,
  projectConfigPipe: RollupProjectConfigFactoryPipe,
  packageConfigPipe: RollupPackageConfigFactoryPipe,
): IRollupPackagePipe => {
  const pipe = fromPipeFunction(context => {
    if (isPackageContext(context)) {
      return packageConfigPipe(context);
    } else if (isProjectContext(context)) {
      return projectConfigPipe(context);
    } else {
      return configPipe(context);
    }
  });

  Object.defineProperties(pipe, {
    [_projectPipe]: { value: true },
    [_packagePipe]: { value: true },
  });

  return pipe as IRollupPackagePipe;
};

export const fromPackage = (
  packageConfigPipe: RollupPackageConfigFactoryPipe,
): IRollupPackagePipe => {
  const projectConfigPipe: RollupProjectConfigFactoryPipe = (
    context: IProjectConfigContext,
  ) => collect(context, packageConfigPipe);

  const configPipe: RollupConfigFactoryPipe = (context: IConfigContext) => {
    const project = new Project();
    const projectContext = withProject(context, project);

    return projectConfigPipe(projectContext);
  };

  return createPackagePipe(configPipe, projectConfigPipe, packageConfigPipe);
};
