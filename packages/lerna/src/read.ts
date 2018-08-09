import { Awaitable, ConfigType } from './collect';

import Package from '@lerna/package';
import Project from '@lerna/project';
import path from 'path';
import { rollup } from 'rollup';

type Factory = (pkg: Package, commandOptions: any) => Awaitable<ConfigType>;

export const readPackageConfig = (commandOptions: any) => async (
  pkg: Package,
): Promise<ConfigType> => {
  const configFile = path.resolve(pkg.location, 'rollup.config.js');
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

const getFactory = async (project: Project): Promise<Factory> => {
  const configFile = path.resolve(project.rootPath, 'rollup.lerna.js');
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

export const readCommonConfig = (project: Project, commandOptions?: any) => {
  let factory: Factory | null = null;
  return async (pkg: Package): Promise<ConfigType> => {
    if (factory === null) {
      factory = await getFactory(project);
    }

    return factory(pkg, commandOptions);
  };
};
