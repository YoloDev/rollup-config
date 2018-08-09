import { Awaitable, ConfigType } from './collect';
import { InputOption, OutputOptions, RollupWatchOptions, rollup } from 'rollup';

import Package from '@lerna/package';
import Project from '@lerna/project';
import { mapObj } from './utils';
import path from 'path';

const mapInput = (location: string) => (input: InputOption): InputOption => {
  if (typeof input === 'string') {
    return path.resolve(location, input);
  }

  if (Array.isArray(input)) {
    return input.map(input => path.resolve(location, input));
  }

  return Object.keys(input).reduce(
    (ret, name) => ({ ...ret, [name]: path.resolve(location, input[name]) }),
    {},
  );
};

const mapOutput = (location: string) => (
  output: OutputOptions | OutputOptions[] | undefined,
): OutputOptions | OutputOptions[] | undefined => {
  if (typeof output === 'undefined') {
    return void 0;
  }

  if (Array.isArray(output)) {
    return output.map(mapOutput(location) as (
      output: OutputOptions,
    ) => OutputOptions);
  }

  return mapObj(output, {
    file: (name: string | undefined) =>
      typeof name === 'undefined' ? name : path.resolve(location, name),
  });
};

const fixPaths = (
  conf: RollupWatchOptions,
  location: string,
): RollupWatchOptions => {
  return mapObj(conf, {
    input: mapInput(location),
    output: mapOutput(location),
  });
};

const fixAllPaths = (
  confs: RollupWatchOptions | ReadonlyArray<RollupWatchOptions>,
  location: string,
) =>
  Array.isArray(confs)
    ? confs.map(c => fixPaths(c, location))
    : fixPaths(confs as RollupWatchOptions, location);

type Factory = (
  project: Project,
  pkg: Package,
  commandOptions: any,
) => Awaitable<ConfigType>;

export type PerPackageOptions = {
  configFile: string | ((pkg: Package) => Awaitable<string>);
};

const defaultPerPackageOptions: PerPackageOptions = {
  configFile: 'rollup.config.js',
};

export const readPackageConfig = (opts: Partial<PerPackageOptions>) => async (
  project: Project,
  pkg: Package,
  commandOptions: any,
): Promise<ConfigType> => {
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
    if (typeof configFileContent.withPackage === 'function') {
      return fixAllPaths(
        await configFileContent.withPackage(project, pkg, commandOptions),
        pkg.location,
      );
    }

    return fixAllPaths(await configFileContent(commandOptions), pkg.location);
  }

  return configFileContent;
};

export type CommonConfigOptions = {
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultCommonConfigOptions: CommonConfigOptions = {
  configFile: 'rollup.lerna.js',
};

export const getFactory = async (
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

export const readCommonConfig = (opts: Partial<CommonConfigOptions>) => {
  const options: CommonConfigOptions = {
    ...defaultCommonConfigOptions,
    ...opts,
  };

  let factory: Factory | null = null;
  return async (
    project: Project,
    pkg: Package,
    commandOptions?: any,
  ): Promise<ConfigType> => {
    if (factory === null) {
      factory = await getFactory(project, options);
    }

    return fixAllPaths(
      await factory(project, pkg, commandOptions),
      pkg.location,
    );
  };
};
