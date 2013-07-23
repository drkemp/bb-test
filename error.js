#!/usr/bin/env node
var writer =require('./src/build/makers/error_writer');
var argv = require('optimist')
	.default('p','')
	.default('s','HEAD')
	.default('f','unspecified')
	.default('d','no details')
	.argv
;

// writer(platform, sha, failure, details);
writer(argv.p, argv.s, argv.f, argv.d);

