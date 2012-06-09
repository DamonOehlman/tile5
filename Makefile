SHELL := /bin/bash

build:
	@interleave --wrap oldschool src/T5.js --output dist/tile5.js
	@interleave src/engines --path dist/engines
	@../bake-js/bin/bake dist/tile5.js --refresh --output demos/_demogen/js

test:
	@mocha --reporter spec

.PHONY: test