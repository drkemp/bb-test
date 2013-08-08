var path = require ('path');
var shell = require('shelljs');
var fs = require('fs');
var couch = require('./src/couchdb/interface');

var config = require('./config');
var android  = require('./src/build/makers/android');
var ios  = require('./src/build/makers/ios');

// this assumes that you start it in the sandbox

var TEST_DIR=process.cwd();
var BRANCH='HEAD';
var TOOL_DIR=path.join(TEST_DIR,'medic');
var MSPEC_DIR=path.join(TEST_DIR,'mobilespec');
var TEST_OK=true;

//records a success in the couchdb
function success(platform,sha,component,details) {
    var doc= { 
         mobilespec:details,
         sha:sha,
         platform:platform,
         version:component,
         timestamp:Math.round(Math.floor((new Date()).getTime() / 1000)),
         model:''
    };

    // fire off to couch
    var doc_id_array = [doc.platform, sha];
    doc_id_array = doc_id_array.map(encodeURIComponent);
    var doc_id = doc_id_array.join('__');
    couch.mobilespec_results.clobber(doc_id, doc, function(resp) {
        if (resp.error) {
            console.error('[COUCH ERROR] Saving doc with id ' + doc_id);
        }
    });
}

// records an error in the couch db
function error(platform,sha,failure,details) {
    var doc = {
        sha:sha,
        timestamp:(new Date().getTime() / 1000),
        platform:platform.toLowerCase(),
        failure:failure,
        details:details
    };

    // fire off to couch
    var doc_id_array = [doc.platform, sha];
    doc_id_array = doc_id_array.map(encodeURIComponent);
    var doc_id = doc_id_array.join('__');
    couch.build_errors.clobber(doc_id, doc, function(resp) {
        if (resp.error) {
            console.error('[COUCH ERROR] Saving doc with id ' + doc_id);
        }
    });
}

// runs a command in a directory and handles errors, etc.
function trythis(dir, cmd, sha, platform, operation) {
  if(TEST_OK) {
    shell.echo(platform+': '+operation);
    shell.pushd(dir);
    var cmdobj = shell.exec(cmd);
    if(cmdobj.code!=0){
      error(platform, 'HEAD', 'Error in '+operation, cmdobj.output)
      TEST_OK=false;
    }
    shell.popd();
  } else {
    shell.echo('Skipping due to previous errors: '+platform+': '+operation);
  }
}

// clear out the test snadbox prior to a test run
function cleanSandbox() {
   shell.cd(TEST_DIR);
   shell.echo(' ==== Cleaning up ====');
   shell.rm('-rf','cordova-*');
   shell.rm('-rf','mobilespec');
}

//puts text into a file
function writefile(target,text){
   shell.echo(text).to(target);
}
// this re-invokes the command with more handles
// ShellJS opens a lot of file handles, and the default on OS X is too small.
var ulimit = shell.exec('ulimit -S -n');
if (ulimit && ulimit.output.trim() < 2000) {
      shell.exec('/bin/bash -c \'ulimit -S -n 4096; exec "' + process.argv[0] + '" "' + process.argv.slice(1).join('" "') + '" --ulimit\'');
      return;
}

cleanSandbox();

trythis(TEST_DIR, 'git clone https://github.com/apache/cordova-coho.git',BRANCH,'coho','git clone');
trythis(path.join(TEST_DIR,'cordova-coho'),'npm install', BRANCH, 'npm', 'coho npm install');

trythis(TEST_DIR,'./cordova-coho/coho repo-clone -r plugins -r mobile-spec -r android -r ios -r cli -r js',BRANCH,'coho','loading repos');
if(TEST_OK) {
  success('coho',BRANCH,'repo clone','ok');
}
trythis(path.join(TEST_DIR,'cordova-cli'), 'npm install',BRANCH,'coho','coho npm install');

trythis(TEST_DIR,'./cordova-cli/bin/cordova create mobilespec org.apache.mobilespec mobilespec',BRANCH,'Cli','Create Mobilespec');
if(TEST_OK) {
  writefile(path.join(MSPEC_DIR,'.cordova','config.json'),
'{\
  "id":"org.apache.mobilespec",\
  "name":"mobilespec",\
  "lib": {\
    "android": {\
      "uri": "'+TEST_DIR+'/cordova-android",\
      "version": "dev",\
      "id": "cordova-android-dev"\
    },\
    "ios": {\
      "uri": "'+TEST_DIR+'/cordova-ios",\
      "version": "dev",\
      "id": "cordova-ios-dev"\
    }\
  }\
}');
}
trythis(MSPEC_DIR,'../cordova-cli/bin/cordova platform add android ios',BRANCH,'Cli','platform add');
//dirty hack
//var cmd = 'patch '+path.join(TEST_DIR,'cordova-cli','node_modules','plugman','src','install.js')+' -i '+path.join(TOOL_DIR,'install.patch');
//shell.exec(cmd);

trythis(MSPEC_DIR,'../cordova-cli/bin/cordova -d plugin add ../cordova-mobile-spec/dependencies-plugin',BRANCH,'Cli','plugin add');

// hook up the mobilespec project
if(TEST_OK){
  shell.rm('-r',path.join(MSPEC_DIR,'www'));
  shell.exec('ln -s '+path.join(TEST_DIR,'cordova-mobile-spec')+' '+path.join(MSPEC_DIR,'www'));
}
// get the latest cordova-js going
trythis(path.join(TEST_DIR,'cordova-js'),'npm install',BRANCH,'JS','npm install');
trythis(path.join(TEST_DIR,'cordova-js'),'grunt',BRANCH,'JS','grunt');

if(TEST_OK){
  success('cordova-js',BRANCH,'build','ok');
  shell.pushd(MSPEC_DIR);
  shell.cp('-f', '../cordova-js/pkg/cordova.ios.js','platforms/ios/www/cordova.js');
  shell.cp('-f', '../cordova-js/pkg/cordova.android.js','platforms/android/assets/www/cordova.js');
  shell.popd();
}

trythis(MSPEC_DIR,'../cordova-cli/bin/cordova prepare',BRANCH,'Cli','prepare');

// call the builder for the requested platform
shell.echo('++++ calling android prepare');

var output_location = path.join(MSPEC_DIR,'platforms','android');
android(output_location, BRANCH,'', config.app.entry, function(err){
  shell.echo('Android test prepare failed')
});

shell.echo('++++ back from android prepare');

trythis(MSPEC_DIR, '../cordova-cli/bin/cordova compile android',BRANCH,'Cli','build android');

// trythis(MSPEC_DIR, '../cordova-cli/bin/cordova compile ios', BRANCH,'Cli','build ios');

trythis(MSPEC_DIR, './platforms/android/cordova/run --device',BRANCH,'Cli','deploy android');

if(TEST_OK){
   success('Testrun',BRANCH,'complete','ok');
}

