import { Awaitable } from './collect';
import { IPackageConfigFactory } from './single';
import Package from '@lerna/package';
import Project from '@lerna/project';
import { getFactory } from './read';
import { isFactory } from './factory';
import path from 'path';
import readPkgUp from 'read-pkg-up';

type DelegatedToProjectOptions = {
  cwd: string | ((commandOptions?: any) => string);
  configFile: string | ((proj: Project) => Awaitable<string>);
};

const defaultDelegatedToProjectOptions: DelegatedToProjectOptions = {
  cwd: () => process.cwd(),
  configFile: 'rollup.config.js',
};

export const delegated = (
  opts: Partial<DelegatedToProjectOptions>,
): IPackageConfigFactory => {
  const options: DelegatedToProjectOptions = {
    ...defaultDelegatedToProjectOptions,
    ...opts,
  };

  const withPackage = (project: Project, pkg: Package) => {
    throw new Error(
      `Recursive config loop detected. Package ${pkg.name} (${
        pkg.location
      }) is delegating to project (${
        project.rootPath
      }) which in turn is calling delegating factory from package again.`,
    );
  };

  const factory = (async (commandOptions?: any) => {
    const cwd =
      typeof options.cwd === 'string'
        ? options.cwd
        : options.cwd(commandOptions);
    const project = new Project(cwd);
    const pkgInfo = await readPkgUp({ cwd });
    const pkg = new Package(
      pkgInfo.pkg,
      path.dirname(pkgInfo.path),
      project.rootPath,
    );

    const factory = await getFactory(project, {
      configFile: options.configFile,
    });
    if (!isFactory(factory)) {
      throw new Error(
        `In order for delegating to work, root config must expose an IConfigFactory`,
      );
    }

    return await factory.withPackage(project, pkg, commandOptions);
  }) as IPackageConfigFactory;

  Object.defineProperties(factory, {
    withPackage: { value: withPackage },
  });

  return factory;
};
