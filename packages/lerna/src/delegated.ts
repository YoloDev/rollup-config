import * as fs from './fs';

import {
  Awaitable,
  ConfigContext,
  FromPackageFactory,
  FromProjectFactory,
  FromRollupFactory,
  IConfigFactory,
  Package,
  PackageConfigError,
  Project,
  defaultContext,
  isConfigError,
} from './types';
import { createFactory, fromPackage, isFactory } from './factory';

import { getConfigFile } from './get-config';
import path from 'path';
import readPkgUp from 'read-pkg-up';

type DelegatedToProjectOptions = {
  cwd: string | ((delegatingFilePath: string, commandOptions?: any) => string);
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultDelegatedToProjectOptions: DelegatedToProjectOptions = {
  cwd: (from: string) => path.dirname(from),
  configFile: 'rollup.config.js',
};

class PackageDelegatedConfigFileNotFoundError extends PackageConfigError {
  readonly configFile: string;

  constructor(project: Project, pkg: Package, configFile: string) {
    super(
      project,
      pkg,
      `Config file ${configFile} delegated to from package ${
        pkg.name
      } not found`,
    );

    this.configFile = configFile;
    Object.defineProperty(this, 'configFile', { value: configFile });
  }
}

class DelegationCycleError extends PackageConfigError {
  readonly path: ReadonlyArray<string>;

  constructor(project: Project, pkg: Package, path: ReadonlyArray<string>) {
    super(
      project,
      pkg,
      `Cyrcle detected in delegation for package ${pkg.name}`,
    );

    const arrCopy = Object.freeze([...path]);
    this.path = arrCopy;
    Object.defineProperty(this, 'path', { value: arrCopy });
  }
}

class InvalidPackageDelegatedConfigFile extends PackageConfigError {
  readonly configFile: string;

  constructor(project: Project, pkg: Package, configFile: string) {
    super(
      project,
      pkg,
      `Config file ${configFile} delegated to from package ${
        pkg.name
      } does not expose a valid configuration to delegate to`,
    );

    this.configFile = configFile;
    Object.defineProperty(this, 'configFile', { value: configFile });
  }
}

export const delegated = (
  filePath: string,
  opts: Partial<DelegatedToProjectOptions>,
): IConfigFactory => {
  const options: DelegatedToProjectOptions = {
    ...defaultDelegatedToProjectOptions,
    ...opts,
  };

  const fromPackage = async (
    context: ConfigContext,
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ) => {
    if (context.delegated.includes(filePath)) {
      return new DelegationCycleError(project, pkg, context.delegated);
    }

    const configFile =
      typeof options.configFile === 'string'
        ? path.resolve(project.rootPath, options.configFile)
        : await options.configFile(project);

    if (!(await fs.exists(configFile))) {
      return new PackageDelegatedConfigFileNotFoundError(
        project,
        pkg,
        configFile,
      );
    }

    const configFileContent = await getConfigFile(configFile);
    if (!isFactory(configFileContent)) {
      return new InvalidPackageDelegatedConfigFile(project, pkg, configFile);
    }

    return configFileContent.fromPackage(
      { ...context, delegated: [...context.delegated, filePath] },
      project,
      pkg,
      commandOptions,
    );
  };

  const fromRollupFactory: FromRollupFactory = async (commandOptions?: any) => {
    const cwd =
      typeof options.cwd === 'string'
        ? options.cwd
        : options.cwd(filePath, commandOptions);

    const project = new Project(cwd);
    const pkgInfo = await readPkgUp({ cwd });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      project.rootPath,
    );

    const result = await fromPackage(
      defaultContext,
      project,
      pkg,
      commandOptions,
    );
    if (isConfigError(result)) {
      throw result;
    }

    return result;
  };

  const fromProjectFactory: FromProjectFactory = async (
    context: ConfigContext,
    project: Project,
    commandOptions?: any,
  ) => {
    const cwd =
      typeof options.cwd === 'string'
        ? options.cwd
        : options.cwd(filePath, commandOptions);

    const pkgInfo = await readPkgUp({ cwd });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      project.rootPath,
    );

    return await fromPackage(context, project, pkg, commandOptions);
  };

  const fromPackageFactory: FromPackageFactory = (
    context: ConfigContext,
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ) => fromPackage(context, project, pkg, commandOptions);

  return createFactory(
    fromRollupFactory,
    fromProjectFactory,
    fromPackageFactory,
  );
};
