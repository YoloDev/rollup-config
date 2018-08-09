declare module '@lerna/package' {
  import { Result } from 'npm-package-arg';

  export type DependencyMap = {
    readonly [name: string]: string;
  };

  export type BinMap = {
    readonly [name: string]: string;
  };

  export type ScriptMap = {
    readonly [name: string]: string;
  };

  export default class Package {
    constructor(pkg: any, location: string, rootPath?: string);
    readonly name: string;
    readonly location: string;
    readonly private: boolean;
    readonly resolved: Result;
    version: string;
    readonly dependencies: DependencyMap | void;
    readonly devDependencies: DependencyMap | void;
    readonly optionalDependencies: DependencyMap | void;
    readonly peerDependencies: DependencyMap | void;
    readonly bin: BinMap;
    readonly scripts: ScriptMap;
    readonly manifestLocation: string;
    readonly nodeModulesLocation: string;
    readonly binLocation: string;
    readonly tarball: string;
    get(name: string): any;
    set(name: string, value: any): Package;
    toJSON(): any;
    serialize(): Promise<void>;
  }
}
