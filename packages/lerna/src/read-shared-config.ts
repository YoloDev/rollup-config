import {
  Awaitable,
  ConfigError,
  ConfigType,
  getConfigFile,
  isConfigError,
} from '@yolodev/rollup-config-core';
import { Package, Project, ProjectConfigError } from './types';
import { fixPaths, fs } from '@yolodev/rollup-config-utils';

import { IPackageConfigContext } from './context';
import path from 'path';

export type SharedConfigOptions = {
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultSharedConfigOptions: SharedConfigOptions = {
  configFile: 'rollup.lerna.js',
};

class ProjectConfigFileNotFoundError extends ProjectConfigError {
  readonly configFile: string;

  constructor(project: Project, configFile: string) {
    super(
      project,
      `Config file ${configFile} for project ${project.manifest.name} (${
        project.rootPath
      }) not found`,
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

export const readSharedConfig = (opts: Partial<SharedConfigOptions>) => async (
  context: IPackageConfigContext,
): Promise<ConfigType | ConfigError> => {
  const options: SharedConfigOptions = {
    ...defaultSharedConfigOptions,
    ...opts,
  };

  const configFile =
    typeof options.configFile === 'string'
      ? path.resolve(context.project.rootPath, options.configFile)
      : await options.configFile(context.project);

  if (!(await fs.exists(configFile))) {
    return new ProjectConfigFileNotFoundError(context.project, configFile);
  }

  const configFileContent = await getConfigFile(configFile);
  if (typeof configFileContent === 'function') {
    return fixResult(
      await configFileContent(
        context.package,
        context.project,
        context.commandOptions,
      ),
      context.package,
    );
  } else {
    return fixResult(configFileContent, context.package);
  }
};
