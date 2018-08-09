declare module '@lerna/project' {
  import Package from '@lerna/package';

  export default class Project {
    static readonly PACKAGE_GLOB: string;
    static readonly LICENSE_GLOB: string;
    static getPackages(cwd?: string): Promise<ReadonlyArray<Package>>;

    constructor(cwd?: string);
    readonly config: any;
    readonly rootConfigLocation: string;
    readonly rootPath: string;
    version: string;
    readonly packageConfigs: ReadonlyArray<string>;
    readonly packageParentDirs: ReadonlyArray<string>;
    readonly manifest: Package;
    readonly licensePath: string | void;
    getPackages(): Promise<ReadonlyArray<Package>>;
    isIndependent(): boolean;
  }
}
