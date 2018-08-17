import { ConfigError } from '@yolodev/rollup-config-core';
import Package from '@lerna/package';
import Project from '@lerna/project';

export class ProjectConfigError extends ConfigError {
  readonly project: Project;

  constructor(project: Project, msg: string, innerError: Error | null = null) {
    super(msg, innerError);

    this.project = project;
    Object.defineProperty(this, 'project', {
      value: project,
      enumerable: true,
    });
  }
}

export class PackageConfigError extends ProjectConfigError {
  readonly package: Package;

  constructor(
    project: Project,
    pkg: Package,
    msg: string,
    innerError: Error | null = null,
  ) {
    super(project, msg, innerError);

    this.package = pkg;
    Object.defineProperty(this, 'package', {
      value: pkg,
      enumerable: true,
    });
  }
}

export { Package, Project };
