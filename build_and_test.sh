#!/bin/bash -e

function echoerr() {
	echo "$@" 1>&2
}

function build-with-bootstrap() {
	npx rollup -c ./rollup.bootstrap.js
}

function build-from-root() {
	npx rollup -c ./rollup.config.js
}

function build-from-packages() {
	for file in $(find packages -name rollup.config.js); do
		pushd $(dirname $file)
		file=$(basename $file)
		npx rollup -c "$file"
		npx rollup -c "$file"
		popd
	done
}

function validate-greenkeeper-config() {
	local err=0
	local workspaces=$(yarn workspaces info --json | jq '.data | fromjson | keys | length + 1')
	err=$?
	if [ $err -ne 0 ]; then
		echoerr "$workspaces"
		return err
	fi

	local greenkeeperProjects=$(cat ./greenkeeper.json | jq '.groups | map(.packages) | flatten | length')
	err=$?
	if [ $err -ne 0 ]; then
		echoerr "$greenkeeperProjects"
		return err
	fi

	if [ $workspaces -ne $greenkeeperProjects ]; then
		echoerr "Greenkeeper config is not up to date with workspaces. Found $workspaces workspaces (including root), but greenkeeper is configured for $greenkeeperProjects projects."
		return 1
	fi
}

# First bootstrap the build
echo "Building using bootstrap config"
build-with-bootstrap

# The build using the build package twice, to make sure the output is valid
echo "Building using root lerna config"
build-from-root
build-from-root

# Build all of the modules separately (if they have rollup.config.js defined) - twice
echo "Building from each package leaf directory"
build-from-packages
build-from-packages

# Validate greenkeeper config
echo "Check greenkeeper config"
validate-greenkeeper-config
