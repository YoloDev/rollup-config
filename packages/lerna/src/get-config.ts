import path from 'path';
import { rollup } from 'rollup';

const readConfigFile = async (configFile: string): Promise<any> => {
  const bundle = await rollup({
    input: configFile,
    external: id =>
      (id[0] !== '.' && !path.isAbsolute(id)) ||
      id.slice(-5, id.length) === '.json',
  });

  const { code } = await bundle.generate({ format: 'cjs' });
  const defaultLoader = require.extensions['.js'];
  require.extensions['.js'] = (module, filename) => {
    if (filename === configFile) {
      (module as any)._compile(code, filename);
    } else {
      defaultLoader(module, filename);
    }
  };

  delete require.cache[configFile];
  let configFileContent = require(configFile);
  require.extensions['.js'] = defaultLoader;

  if (configFileContent.__esModule) {
    configFileContent = configFileContent.default;
  }

  return await configFileContent;
};

const configCache = new Map<string, Promise<any>>();
export const getConfigFile = (configFile: string): Promise<any> => {
  let cached = configCache.get(configFile);
  if (!cached) {
    cached = readConfigFile(configFile);
    configCache.set(configFile, cached);
  }

  return cached;
};
