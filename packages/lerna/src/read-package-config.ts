import {
  Awaitable,
  ConfigError,
  ConfigType,
  getConfigFile,
  isConfigError,
  isConfigPipe,
} from '@yolodev/rollup-config-core';
import { Package, PackageConfigError, Project } from './types';
import { fixPaths, fs } from '@yolodev/rollup-config-utils';

import { IPackageConfigContext } from './context';
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
  context: IPackageConfigContext,
): Promise<ConfigType | ConfigError> => {
  const options: PerPackageOptions = { ...defaultPerPackageOptions, ...opts };
  const configFile =
    typeof options.configFile === 'string'
      ? path.resolve(context.package.location, options.configFile)
      : await options.configFile(context.package);

  if (!(await fs.exists(configFile))) {
    return new PackageConfigFileNotFoundError(
      context.project,
      context.package,
      configFile,
    );
  }

  const configFileContent = await getConfigFile(configFile);
  if (isConfigPipe(configFileContent)) {
    return fixResult(
      await configFileContent.withContext(context),
      context.package,
    );
  } else if (typeof configFileContent === 'function') {
    return fixResult(
      await configFileContent(context.commandOptions),
      context.package,
    );
  } else {
    return fixResult(configFileContent, context.package);
  }
};
