import builtins from 'builtin-modules';
import path from 'path';
import typescript from 'rollup-plugin-typescript2';

const isExternal = pkg => {
  const deps = Object.keys(
    Object.assign(
      {},
      pkg.optionalDependencies || {},
      pkg.peerDependencies || {},
      pkg.dependencies || {},
    ),
  );

  return id => {
    if (id.startsWith('.')) {
      return { result: false, reason: 'starts-with-dot' };
    }

    if (builtins.includes(id)) {
      return { result: true, reason: 'builtin' };
    }

    if (deps.some(dep => dep === id || id.startsWith(dep + '/'))) {
      return { result: true, reason: 'configured-dep' };
    }

    return { result: false, reason: 'fallthrough' };
  };
};

const binSafeName = ({ name, scope }) =>
  scope ? name.substring(scope.length + 1) : name;

export default pkg => {
  debugger;
  const safeName = binSafeName(pkg.resolved);
  const isPkgExternal = isExternal(pkg);
  const external = id => {
    const { result } = isPkgExternal(id);
    return result;
  };

  return {
    input: './src/index.ts',
    output: [
      {
        format: 'cjs',
        file: `./dist/${safeName}.js`,
        exports: 'named',
        sourcemap: true,
      },
      {
        format: 'es',
        file: `./dist/${safeName}.esm.js`,
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        cacheRoot: path.resolve(__dirname, '.rpt2_cache'),
      }),
    ],
    external,
  };
};
