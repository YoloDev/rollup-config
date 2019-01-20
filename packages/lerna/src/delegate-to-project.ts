import {
  Awaitable,
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

import { delegate } from '@yolodev/rollup-config-delegate';
import path from 'path';
import readPkgUp from 'read-pkg-up';

type DelegatedToProjectOptions = {
  packageDir: string | ((dirname: string) => Awaitable<string>);
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultDelegatedToProjectOptions: DelegatedToProjectOptions = {
  packageDir: (dirname: string) => dirname,
  configFile: 'rollup.config.js',
};

export const delegateToProject = (
  opts: Partial<DelegatedToProjectOptions> = {},
) => {
  const options = { ...defaultDelegatedToProjectOptions, ...opts };
  const optsName = createNamed((kind = NameKind.Simple) => {
    if (kind === NameKind.Simple)
      return typeof options.configFile === 'string'
        ? options.configFile
        : '<config-file-fn>';
    if (kind === NameKind.Compact) return JSON.stringify(options);
    return JSON.stringify(options, null, 2);
  });
  const nameFactory = createNameFactory('delegateToProject', [optsName]);

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

      const configFile =
        typeof options.configFile === 'string'
          ? path.resolve(packageContext.project.rootPath, options.configFile)
          : await options.configFile(packageContext.project);

      return fixPaths(
        await delegate({ configFile })(innerPipe)(
          cmdOpts,
          inner,
          packageContext,
        ),
        packageContext.cwd,
      );
    }),
  );
};
