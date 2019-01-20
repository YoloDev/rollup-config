# `@yolodev/rollup-config-lerna`

Config for lerna based monorepos that builds all packages using a single rollup bundler.

## Usage

Currently two different "modes" is supported in rollup-config-lerna, with more planned for
later. The first mode (`perPackage` mode) uses a separate `rollup.config.js` in each package. To use this,
put a `rollup.config.js` in the root directory (next to `lerna.json`) with the following
content:

```js
// rollup.config.js
import { perPackage } from '@yolodev/rollup-config-lerna';

export default perPackage();
```

This mode will fail if any of the packages does not have a `rollup.config.js`.

The second mode currently support is using a common config file for all modules. To use this mode,
first create a `rollup.lerna.js` file in the root folder (next to `lerna.json`), and put something
like the following in it:

```js
// rollup.lerna.js
export default (project, pkg, cmdOpts) => {
  return {
    input: './src/index.js',
    output: {
      file: './dist/index.js',
      format: 'cjs',
    },
    plugins: [],
  };
};
```

Then, in `rollup.config.js` put the following:

```js
// rollup.config.js
import { common } from '@yolodev/rollup-config-lerna';

export default common();
```
