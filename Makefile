SHELL := /bin/bash

build:
	@`npm bin`/interleave --wrap oldschool src/T5.js --output dist/tile5.js
	@`npm bin`/interleave src/engines --path dist/engines
	@`npm bin`/interleave src/plugins --path dist/plugins
	@`npm bin`/interleave src/plugins/layers --path dist/plugins/layers
	@../bake-js/bin/bake dist/tile5.js --refresh --output demos/_demogen/js
	@../bake-js/bin/bake dist/tile5.js --output test

test:
	@mocha --reporter spec

.PHONY: test
