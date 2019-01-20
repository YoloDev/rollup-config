import {
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

import { Awaitable } from '@yolodev/rollup-config-core/src/types';
import { RollupWatchOptions } from 'rollup';

class PackageConfigEmptyError extends PackageConfigError {
  constructor(context: IPackageConfigContext) {
    super(
      `Package ${context.package.name} returned an empty configuration`,
      context,
    );
  }
}

class ProjectConfigEmptyError extends ProjectConfigError {
  constructor(context: IProjectConfigContext) {
    super(
      `Project ${context.project.manifest.name} (${
        context.project.rootPath
      }) returned an empty configuration`,
      context,
    );
  }
}

// TODO: Message should contain child errors?
class ProjectConfigAggregatedError extends ProjectConfigError {
  readonly errors: ReadonlyArray<ConfigError>;

  constructor(
    errors: ReadonlyArray<ConfigError>,
    context: IProjectConfigContext,
  ) {
    super(
      `Project ${context.project.manifest.name} (${
        context.project.rootPath
      }) had configuration errors`,
      context,
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
  cmdOpts: any,
  inner: ConfigType,
  context: IProjectConfigContext,
  innerPipe: (
    commandOptions: any,
    inner: ConfigType,
    context: IPackageConfigContext,
  ) => Awaitable<ConfigType>,
  opts: Partial<CollectOptions> = {},
) => {
  const options = { ...defaultCollectOptions, ...opts };
  const errors: ConfigError[] = [];
  const results: RollupWatchOptions[] = [];
  const { project } = context;

  for (const pkg of await project.getPackages()) {
    const pkgContext = withCwd(withPackage(context, pkg), pkg.location);
    let result: ConfigType;
    try {
      result = await innerPipe(cmdOpts, inner, pkgContext);
    } catch (e) {
      if (!isConfigError(e)) {
        throw e;
      }

      if (options.bail) {
        throw e;
      }

      errors.push(e);
      continue;
    }

    const arr = toArray(fixPaths(result, pkg.location));
    if (arr.length === 0 && options.failIfPackageIsEmpty) {
      throw new PackageConfigEmptyError(pkgContext);
    }

    results.push(...arr);
  }

  if (results.length === 0 && options.failIfProjectIsEmpty) {
    throw new ProjectConfigEmptyError(context);
  }

  if (errors.length > 0 && options.failIfProjectHasErrors) {
    throw new ProjectConfigAggregatedError(errors, context);
  }

  return results;
};
