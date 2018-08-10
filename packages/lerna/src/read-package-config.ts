import * as fs from './fs';

import {
  Awaitable,
  ConfigContext,
  ConfigError,
  ConfigType,
  Package,
  PackageConfigError,
  Project,
  isConfigError,
} from './types';

import { fixPaths } from './fix-paths';
import { getConfigFile } from './get-config';
import { isFactory } from './factory';
import path from 'path';

export type PerPackageOptions = {
  configFile: string | ((pkg: Package) => Awaitable<string>);
};

const defaultPerPackageOptions: PerPackageOptions = {
  configFile: 'rollup.config.js',
};

class PackageConfigFileNotFoundError extends PackageConfigError {
  readonly configFile: string;

  constructor(project: Project, pkg: Package, configFile: string) {
    super(
      project,
      pkg,
      `Config file ${configFile} for package ${pkg.name} not found`,
    );

    this.configFile = configFile;
    Object.defineProperty(this, 'configFile', { value: configFile });
  }
}

const fixResult = (
  result: ConfigType | ConfigError,
  pkg: Package,
): ConfigType | ConfigError => {
  if (isConfigError(result)) {
    return result;
  }

  return fixPaths(result, pkg.location);
};

export const readPackageConfig = (opts: Partial<PerPackageOptions>) => async (
  context: ConfigContext,
  project: Project,
  pkg: Package,
  commandOptions: any,
): Promise<ConfigType | ConfigError> => {
  const options: PerPackageOptions = { ...defaultPerPackageOptions, ...opts };
  const configFile =
    typeof options.configFile === 'string'
      ? path.resolve(pkg.location, options.configFile)
      : await options.configFile(pkg);

  if (!(await fs.exists(configFile))) {
    return new PackageConfigFileNotFoundError(project, pkg, configFile);
  }

  const configFileContent = await getConfigFile(configFile);
  if (isFactory(configFileContent)) {
    return fixResult(
      await configFileContent.fromPackage(
        context,
        project,
        pkg,
        commandOptions,
      ),
      pkg,
    );
  } else if (typeof configFileContent === 'function') {
    return fixResult(await configFileContent(commandOptions), pkg);
  } else {
    return fixResult(configFileContent, pkg);
  }
};
