import {
  Awaitable,
  ConfigContext,
  ConfigError,
  ConfigType,
  Package,
  PackageConfigError,
  Project,
  ProjectConfigError,
  isConfigError,
} from './types';

import { RollupWatchOptions } from 'rollup';
import { toArray } from './utils';

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
    );

    const arrCopy = Object.freeze([...errors]);
    this.errors = arrCopy;
    Object.defineProperty(this, 'errors', { value: arrCopy });
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
  context: ConfigContext,
  project: Project,
  collector: (
    context: ConfigContext,
    pkg: Package,
  ) => Awaitable<ConfigType | ConfigError>,
  opts: Partial<CollectOptions> = {},
): Promise<ReadonlyArray<RollupWatchOptions> | ConfigError> => {
  const options: CollectOptions = { ...defaultCollectOptions, ...opts };
  const errors: ConfigError[] = [];
  const result: RollupWatchOptions[] = [];

  for (const pkg of await project.getPackages()) {
    const pkgConfig = await collector(context, pkg);
    if (isConfigError(pkgConfig)) {
      if (options.bail) {
        return pkgConfig;
      } else {
        errors.push(pkgConfig);
      }
    } else {
      const arr = toArray(pkgConfig);
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
