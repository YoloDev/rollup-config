import CustomError from 'es6-error';
import Package from '@lerna/package';
import Project from '@lerna/project';
import { RollupWatchOptions } from 'rollup';

const _error = Symbol.for('rollup:error');

export type ConfigType = RollupWatchOptions | ReadonlyArray<RollupWatchOptions>;
export type Awaitable<T> = T | Promise<T>;

export type ConfigContext = {
  readonly delegated: ReadonlyArray<string>;
};

export class ConfigError extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}
Object.defineProperty(ConfigError.prototype, _error, { value: true });

export class ProjectConfigError extends ConfigError {
  readonly project: Project;

  constructor(project: Project, msg: string) {
    super(msg);

    this.project = project;
    Object.defineProperty(this, 'project', { value: project });
  }
}

export class PackageConfigError extends ProjectConfigError {
  readonly package: Package;

  constructor(project: Project, pkg: Package, msg: string) {
    super(project, msg);

    this.package = pkg;
    Object.defineProperty(this, 'package', { value: pkg });
  }
}

export type FromRollupFactory = (commandOptions?: any) => Awaitable<ConfigType>;
export type FromProjectFactory = (
  context: ConfigContext,
  project: Project,
  commandOptions?: any,
) => Awaitable<ConfigType | ConfigError>;

export type FromPackageFactory = (
  context: ConfigContext,
  project: Project,
  pkg: Package,
  commandOptions?: any,
) => Awaitable<ConfigType | ConfigError>;

export interface IConfigFactory extends FromRollupFactory {
  fromProject: FromProjectFactory;
  fromPackage: FromPackageFactory;
}

export const defaultContext: ConfigContext = Object.freeze({
  delegated: Object.freeze([]),
});

export const isConfigError = (o: any): o is ConfigError => o && o[_error];

export { Package, Project };
