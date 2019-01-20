import {
  Awaitable,
  ConfigError,
  IConfigContext,
  createMiddleware,
  createPipe,
} from '@yolodev/rollup-config-core';
import { IsExternal, RollupWatchOptions } from 'rollup';
import {
  NameKind,
  addExternal,
  createNameFactory,
  createNamed,
  fs,
} from '@yolodev/rollup-config-utils';

import builtins from 'builtin-modules';
import path from 'path';

const createExternal = async (
  opts: ExternalDepsOptions,
  context: IConfigContext,
): Promise<IsExternal> => {
  const file =
    typeof opts.packageFile === 'string'
      ? path.resolve(context.cwd, opts.packageFile)
      : await opts.packageFile(context);
  if (!(await fs.exists(file))) {
    throw new PackageFileNotFound(file, context);
  }

  const pkg = require(file);
  const map = new Map<string, string[]>();

  const addDep = (type: string) => (name: string) => {
    const existing = map.get(name);
    if (existing) {
      existing.push(type);
    } else {
      map.set(name, [type]);
    }
  };

  if (opts.builtins) {
    builtins.forEach(addDep('builtins'));
  }

  if (opts.dependencies && pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach(addDep('dependencies'));
  }

  if (opts.devDependencies && pkg.devDependencies) {
    Object.keys(pkg.devDependencies).forEach(addDep('devDependencies'));
  }

  if (opts.peerDependencies && pkg.peerDependencies) {
    Object.keys(pkg.peerDependencies).forEach(addDep('peerDependencies'));
  }

  if (opts.optionalDependencies && pkg.optionalDependencies) {
    Object.keys(pkg.optionalDependencies).forEach(
      addDep('optionalDependencies'),
    );
  }

  const deps = [...map.entries()];

  return (id: string): boolean | void => {
    if (id.startsWith('.')) {
      return false;
    }

    if (deps.some(dep => dep[0] === id || id.startsWith(dep[0] + '/'))) {
      return true;
    }

    return void 0;
  };
};

type ExternalDepsOptions = {
  builtins: boolean;
  dependencies: boolean;
  devDependencies: boolean;
  peerDependencies: boolean;
  optionalDependencies: boolean;
  packageFile: string | ((context: IConfigContext) => Awaitable<string>);
  condition: (options: RollupWatchOptions) => boolean;
};

const defaultExternalDepsOptions: ExternalDepsOptions = {
  builtins: true,
  dependencies: true,
  devDependencies: false,
  peerDependencies: true,
  optionalDependencies: true,
  packageFile: 'package.json',
  condition: () => true,
};

class PackageFileNotFound extends ConfigError {
  readonly packageFile: string;

  constructor(packageFile: string, context: IConfigContext) {
    super(`Package file ${packageFile} not found`, context);

    this.packageFile = packageFile;
    Object.defineProperty(this, 'packageFile', { value: packageFile });
  }
}

export const externalDeps = (opts: Partial<ExternalDepsOptions> = {}) => {
  const options = { ...defaultExternalDepsOptions, ...opts };
  const optsName = createNamed((kind = NameKind.Simple) => {
    if (kind === NameKind.Compact || kind === NameKind.Simple)
      return JSON.stringify(options);
    return JSON.stringify(options, null, 2);
  });
  const nameFactory = createNameFactory('externalDep', [optsName]);

  return createMiddleware(nameFactory, innerPipe =>
    createPipe(nameFactory, async (cmdOpts, inner, context) => {
      const external = await createExternal(options, context);

      const innerResult = await innerPipe(cmdOpts, inner, context);
      return addExternal(innerResult, external, options.condition);
    }),
  );
};

export default externalDeps;
