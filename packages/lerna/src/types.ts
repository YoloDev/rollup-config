import { IPackageConfigContext, IProjectConfigContext } from './context';

import { ConfigError } from '@yolodev/rollup-config-core';
import Package from '@lerna/package';
import Project from '@lerna/project';

export class ProjectConfigError extends ConfigError {
  readonly project: Project;

  constructor(
    msg: string,
    context: IProjectConfigContext,
    innerError: Error | null = null,
  ) {
    super(msg, context, innerError);

    this.project = context.project;
    Object.defineProperty(this, 'project', {
      value: context.project,
      enumerable: true,
    });
  }
}

export class PackageConfigError extends ProjectConfigError {
  readonly package: Package;

  constructor(
    msg: string,
    context: IPackageConfigContext,
    innerError: Error | null = null,
  ) {
    super(msg, context, innerError);

    this.package = context.package;
    Object.defineProperty(this, 'package', {
      value: context.package,
      enumerable: true,
    });
  }
}

export { Package, Project };
