#!/usr/bin/env node

const path = require('path');
const { inspect } = require('util');
const { getConfigFile, createContext } = require('@yolodev/rollup-config-core');

const main = async () => {
  const context = createContext();
  const config = await getConfigFile(
    path.resolve('./rollup.config.js'),
    context,
  );

  const result = await config({}, [], context);
  console.log(
    inspect(result, {
      showHidden: false,
      depth: 10,
      colors: true,
      compact: false,
      getters: 'get',
    }),
  );
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
