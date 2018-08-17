import {
  Awaitable,
  ConfigError,
  ConfigType,
  isConfigError,
  withCwd,
} from '@yolodev/rollup-config-core';
import {
  IPackageConfigContext,
  IProjectConfigContext,
  withPackage,
} from './context';
import {
  Package,
  PackageConfigError,
  Project,
  ProjectConfigError,
} from './types';
import { fixPaths, toArray } from '@yolodev/rollup-config-utils';

import { RollupWatchOptions } from 'rollup';

class PackageConfigEmptyError extends PackageConfigError {
  constructor(project: Project, pkg: Package) {
    super(project, pkg, `Package ${pkg.name} returned an empty configuration`);
  }
}

class ProjectConfigEmptyError extends ProjectConfigError {
  constructor(project: Project) {
    super(
      project,
      `Project ${project.manifest.name} (${
        project.rootPath
      }) returned an empty configuration`,
    );
  }
}

// TODO: Message should contain child errors?
class ProjectConfigAggregatedError extends ProjectConfigError {
  readonly errors: ReadonlyArray<ConfigError>;

  constructor(project: Project, errors: ReadonlyArray<ConfigError>) {
    super(
      project,
      `Project ${project.manifest.name} (${
        project.rootPath
      }) had configuration errors`,
      errors[0],
    );

    const arrCopy = Object.freeze([...errors]);
    this.errors = arrCopy;
    Object.defineProperty(this, 'errors', { value: arrCopy, enumerable: true });
  }
}

export interface CollectOptions {
  bail: boolean;
  failIfPackageIsEmpty: boolean;
  failIfProjectIsEmpty: boolean;
  failIfProjectHasErrors: boolean;
}

const defaultCollectOptions: CollectOptions = {
  bail: true,
  failIfPackageIsEmpty: true,
  failIfProjectIsEmpty: true,
  failIfProjectHasErrors: false,
};

export const collect = async (
  context: IProjectConfigContext,
  collector: (
    context: IPackageConfigContext,
  ) => Awaitable<ConfigType | ConfigError>,
  opts: Partial<CollectOptions> = {},
): Promise<ReadonlyArray<RollupWatchOptions> | ConfigError> => {
  const options: CollectOptions = { ...defaultCollectOptions, ...opts };
  const errors: ConfigError[] = [];
  const result: RollupWatchOptions[] = [];
  const { project } = context;

  for (const pkg of await project.getPackages()) {
    const pkgContext = withCwd(withPackage(context, pkg), pkg.location);
    const pkgConfig = await collector(pkgContext);
    if (isConfigError(pkgConfig)) {
      if (options.bail) {
        return pkgConfig;
      } else {
        errors.push(pkgConfig);
      }
    } else {
      const arr = toArray(fixPaths(pkgConfig, pkg.location));
      if (arr.length === 0 && options.failIfPackageIsEmpty) {
        return new PackageConfigEmptyError(project, pkg);
      } else {
        result.push(...arr);
      }
    }
  }

  if (result.length === 0 && options.failIfProjectIsEmpty) {
    return new ProjectConfigEmptyError(project);
  }

  if (errors.length > 0 && options.failIfProjectHasErrors) {
    return new ProjectConfigAggregatedError(project, errors);
  }

  return result;
};
