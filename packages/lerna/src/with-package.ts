import {
  Awaitable,
  ConfigType,
  createMiddleware,
  createPipe,
  withCwd,
} from '@yolodev/rollup-config-core';
import {
  IPackageConfigContext,
  IProjectConfigContext,
  isPackageContext,
  isProjectContext,
  withPackage,
  withProject,
} from './context';
import {
  NameKind,
  createNameFactory,
  createNamed,
  fixPaths,
} from '@yolodev/rollup-config-utils';
import { Package, Project } from './types';

import path from 'path';
import readPkgUp from 'read-pkg-up';

export type WithPackageFactory = (
  pkg: Package,
  project: Project,
  commandOptions?: any,
) => Awaitable<ConfigType>;

export type WithPackageOptions = {
  packageDir: string | ((dirname: string) => Awaitable<string>);
};

const defaultWithProjectOptions: WithPackageOptions = {
  packageDir: (dirname: string) => dirname,
};

export const withPackageInfo = (opts: Partial<WithPackageOptions> = {}) => {
  const options = { ...defaultWithProjectOptions, ...opts };
  const optsName = createNamed((kind = NameKind.Simple) => {
    if (kind === NameKind.Compact || kind === NameKind.Simple)
      return JSON.stringify(options);
    return JSON.stringify(options, null, 2);
  });
  const nameFactory = createNameFactory('withPackageInfo', [optsName]);

  return createMiddleware(nameFactory, innerPipe =>
    createPipe(nameFactory, async (cmdOpts, inner, context) => {
      let packageDir: string | null = null;
      let projectContext: IProjectConfigContext;
      let packageContext: IPackageConfigContext;

      if (!isProjectContext(context)) {
        packageDir =
          typeof options.packageDir === 'string'
            ? path.resolve(context.cwd, options.packageDir)
            : await options.packageDir(context.cwd);

        const project = new Project(packageDir);
        projectContext = withProject(context, project);
      } else {
        projectContext = context;
      }

      if (!isPackageContext(context)) {
        if (packageDir === null) {
          packageDir =
            typeof options.packageDir === 'string'
              ? path.resolve(projectContext.cwd, options.packageDir)
              : await options.packageDir(projectContext.cwd);
        }

        const pkgInfo = await readPkgUp({ cwd: packageDir });
        const pkg = new Package(
          pkgInfo.pkg,
          path.dirname(pkgInfo.path),
          projectContext.project.rootPath,
        );

        packageContext = withCwd(withPackage(projectContext, pkg), packageDir);
      } else {
        packageContext = context;
      }

      return fixPaths(
        await innerPipe(cmdOpts, inner, packageContext),
        packageContext.cwd,
      );
    }),
  );
};
