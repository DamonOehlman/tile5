SHELL := /bin/bash

build:
	@interleave --wrap oldschool src/T5.js --output dist/tile5.js
	@interleave src/engines --path dist/engines
	@interleave src/plugins --path dist/plugins
	@interleave src/plugins/layers --path dist/plugins/layers
	@../bake-js/bin/bake dist/tile5.js --refresh --output demos/_demogen/js
	@../bake-js/bin/bake dist/tile5.js --output test

test:
	@mocha --reporter spec

.PHONY: test