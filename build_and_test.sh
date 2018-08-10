#!/bin/bash -e

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

function build-packages-from-root() {
	for file in $(find packages -name rollup.config.js); do
		npx rollup -c "$file"
		npx rollup -c "$file"
	done
}

# First bootstrap the build
build-with-bootstrap

# The build using the build package twice, to make sure the output is valid
build-from-root
build-from-root

# Build all of the modules separately (if they have rollup.config.js defined) - twice
build-from-packages
build-from-packages

# Build all packages with cwd being root - twice
build-packages-from-root
build-packages-from-root
