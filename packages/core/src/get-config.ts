import { ConfigError } from './error';
import { IConfigContext } from './context';
import path from 'path';
import { rollup } from 'rollup';

const _configCache: unique symbol = Symbol.for('rollup-config:config-cache');

class ReadConfigFileError extends ConfigError {
  readonly configFile: string;

  constructor(configFile: string, context: IConfigContext, innerError: Error) {
    super(
      `Failed to load configuration file ${configFile}`,
      context,
      innerError,
    );

    this.configFile = configFile;
    Object.defineProperty(this, 'configFile', {
      value: configFile,
      enumerable: true,
    });
  }
}

const readConfigFile = async (configFile: string): Promise<any> => {
  const bundle = await rollup({
    input: configFile,
    treeshake: false,
    external: id =>
      (id[0] !== '.' && !path.isAbsolute(id)) ||
      id.slice(-5, id.length) === '.json',
  });

  const {
    output: [{ code }],
  } = await bundle.generate({ format: 'cjs' });
  const defaultLoader = require.extensions['.js'];
  require.extensions['.js'] = (module, filename) => {
    if (filename === configFile) {
      (module as any)._compile(code, filename);
    } else {
      defaultLoader(module, filename);
    }
  };

  delete require.cache[configFile];
  let configFileContent = await require(configFile);
  require.extensions['.js'] = defaultLoader;

  if (configFileContent.__esModule) {
    configFileContent = configFileContent.default;
  }

  return await configFileContent;
};

const configCache = (() => {
  let cache = (global as any)[_configCache];
  if (!cache) {
    cache = new Map<string, Promise<any>>();
    (global as any)[_configCache] = cache;
  }

  return cache as Map<string, Promise<any>>;
})();

export const getConfigFile = (
  configFile: string,
  context: IConfigContext,
): Promise<any> => {
  let cached = configCache.get(configFile);
  if (!cached) {
    cached = readConfigFile(configFile).catch(e =>
      Promise.reject(new ReadConfigFileError(configFile, context, e)),
    );
    configCache.set(configFile, cached);
  }

  return cached;
};
