import * as fs from './fs';

import {
  Awaitable,
  ConfigContext,
  ConfigError,
  ConfigType,
  Package,
  Project,
  ProjectConfigError,
  isConfigError,
} from './types';

import { fixPaths } from './fix-paths';
import { getConfigFile } from './get-config';
import path from 'path';

export type CommonConfigOptions = {
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultCommonConfigOptions: CommonConfigOptions = {
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

export const readCommonConfig = (opts: Partial<CommonConfigOptions>) => async (
  context: ConfigContext,
  project: Project,
  pkg: Package,
  commandOptions: any,
): Promise<ConfigType | ConfigError> => {
  const options: CommonConfigOptions = {
    ...defaultCommonConfigOptions,
    ...opts,
  };

  const configFile =
    typeof options.configFile === 'string'
      ? path.resolve(project.rootPath, options.configFile)
      : await options.configFile(project);

  if (!(await fs.exists(configFile))) {
    return new ProjectConfigFileNotFoundError(project, configFile);
  }

  const configFileContent = await getConfigFile(configFile);
  if (typeof configFileContent === 'function') {
    return fixResult(
      await configFileContent(project, pkg, commandOptions),
      pkg,
    );
  } else {
    return fixResult(configFileContent, pkg);
  }
};
