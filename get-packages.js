#!/usr/bin/env node

const Project = require('@lerna/project');

const main = async () => {
  const project = new Project();
  const packages = await project.getPackages();

  console.log(JSON.stringify(packages.map(p => p.location), null, 2));
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
