import { Awaitable, ConfigType } from './collect';

import Package from '@lerna/package';
import Project from '@lerna/project';
import path from 'path';
import { rollup } from 'rollup';

type Factory = (pkg: Package, commandOptions: any) => Awaitable<ConfigType>;

export type PerPackageOptions = {
  configFile: string | ((pkg: Package) => Awaitable<string>);
};

const defaultPerPackageOptions: PerPackageOptions = {
  configFile: 'rollup.config.js',
};

export const readPackageConfig = (
  opts: Partial<PerPackageOptions>,
  commandOptions: any,
) => async (pkg: Package): Promise<ConfigType> => {
  const options: PerPackageOptions = { ...defaultPerPackageOptions, ...opts };

  const configFile =
    typeof options.configFile === 'string'
      ? path.resolve(pkg.location, options.configFile)
      : await options.configFile(pkg);

  const bundle = await rollup({
    input: configFile,
    external: id =>
      (id[0] !== '.' && !path.isAbsolute(id)) ||
      id.slice(-5, id.length) === '.json',
  });

  const { code } = await bundle.generate({ format: 'cjs' });
  // temporarily override require
  const defaultLoader = require.extensions['.js'];
  require.extensions['.js'] = (module, filename) => {
    if (filename === configFile) {
      (module as any)._compile(code, filename);
    } else {
      defaultLoader(module, filename);
    }
  };
  delete require.cache[configFile];
  const configFileContent = await require(configFile);
  require.extensions['.js'] = defaultLoader;

  if (typeof configFileContent === 'function') {
    return await configFileContent(commandOptions);
  }

  return configFileContent;
};

export type CommonConfigOptions = {
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultCommonConfigOptions: CommonConfigOptions = {
  configFile: 'rollup.lerna.js',
};

const getFactory = async (
  project: Project,
  options: CommonConfigOptions,
): Promise<Factory> => {
  const configFile =
    typeof options.configFile === 'string'
      ? path.resolve(project.rootPath, options.configFile)
      : await options.configFile(project);

  const bundle = await rollup({
    input: configFile,
    external: id =>
      (id[0] !== '.' && !path.isAbsolute(id)) ||
      id.slice(-5, id.length) === '.json',
  });

  const { code } = await bundle.generate({ format: 'cjs' });
  // temporarily override require
  const defaultLoader = require.extensions['.js'];
  require.extensions['.js'] = (module, filename) => {
    if (filename === configFile) {
      (module as any)._compile(code, filename);
    } else {
      defaultLoader(module, filename);
    }
  };
  delete require.cache[configFile];
  const configFileContent = await require(configFile);
  require.extensions['.js'] = defaultLoader;

  if (typeof configFileContent !== 'function') {
    return () => configFileContent;
  } else {
    return configFileContent;
  }
};

export const readCommonConfig = (
  opts: Partial<CommonConfigOptions>,
  project: Project,
  commandOptions?: any,
) => {
  const options: CommonConfigOptions = {
    ...defaultCommonConfigOptions,
    ...opts,
  };

  let factory: Factory | null = null;
  return async (pkg: Package): Promise<ConfigType> => {
    if (factory === null) {
      factory = await getFactory(project, options);
    }

    return factory(pkg, commandOptions);
  };
};
