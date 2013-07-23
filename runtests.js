var path = require ('path');
var writer =require('./src/build/makers/error_writer');
var shell = require('shelljs');
var fs = require('fs');
/* this assumes that you start it in the sandbox

var TEST_DIR=process.cwd();
var BRANCH='HEAD';
var TOOL_DIR=path.join(TEST_DIR,'medic');
var MSPEC_DIR=path.join(TEST_DIR,'mobilespec');


function error(platform,sha,failure,details) {
     writer(platform, sha, failure, details);
)
function trythis(dir, cmd, sha, platform, operation) {
   shell.echo(platform+': '+operation);
   shell.pushd(dir);
   var cmdobj = shell.exec(cmd);
   if(cmdobj.code!=0){
     error(platform, 'HEAD', 'Error in '+operation, cmdobj.output)
     exit(1)
   }
   shell.popd();
}
function cleanSandbox() {
   shell.cd(TEST_DIR);
   shell.echo(' ==== Cleaning up ====');
   shell.rm('-rf','cordova-*');
   shell.rm('-rf',mobilespec);
}
function writejson(target,text){
   shell.echo(text).to(target);
}

trythis(TEST_DIR, 'git clone https://github.com/apache/cordova-coho.git',BRANCH,'coho','git clone');
trythis(path.join(TEST_DIR,'cordova-coho'),'npm install', BRANCH, 'npm', 'coho npm install');

trythis(TEST_DIR,'./cordova-coho/coho repo-clone -r plugins -r mobile-spec -r android -r ios -r cli -r js',BRANCH,'coho','loading repos');
trythis(path.join(TEST_DIR,'cordova-cli'), 'npm install',BRANCH,'coho','coho npm install');

trythis(TEST_DIR,'./cordova-cli/bin/cordova create mobilespec org.apache.mobilespec mobilespec',BRANCH,'Cli','Create Mobilespec');
writefile(path.join(MSPEC_DIR,'.cordova','config.json'),'{
  "id":"org.apache.mobilespec",
  "name":"mobilespec",
  "lib": {
    "android": {
      "uri": "'"$TEST_DIR/cordova-android"'",
      "version": "dev",
      "id": "cordova-android-dev"
    },
    "ios": {
      "uri": "'"$TEST_DIR/cordova-ios"'",
      "version": "dev",
      "id": "cordova-ios-dev"
    }
  }
}');

trythis(MSPEC_DIR,'../cordova-cli/bin/cordova platform add android ios',BRANCH,'Cli','platform add');
trythis(MSPEC_DIR,'../cordova-cli/bin/cordova -d plugin add ../cordova-mobile-spec/dependencies-plugin',BRANCH,'Cli','plugin add');
shell.rm('-r','www');
shell.exec('ln -s ../cordova-mobile-spec www');

trythis(path.join(TEST_DIR,'cordova-js'),'npm install',BRANCH,'JS','npm install');
trythis(path.join(TEST_DIR,'cordova-js'),'grunt',BRANCH,'JS','grunt');

shell.pushd(MSPEC_DIR);
shell.cp('../cordova-js/pkg/cordova.ios.js','platforms/ios/www/cordova.js');
shell.cp('../cordova-js/pkg/cordova.android.js','platforms/android/assets/www/cordova.js');
shell.popd();

trythis(MSPEC_DIR,'../cordova-cli/bin/cordova prepare',BRANCH,'Cli','prepare');

trythis(TOOL_DIR, 'node build.js',BRANCH,'Tester','patching for test');

trythis(MSPEC_DIR, '../cordova-cli/bin/cordova build android',BRANCH,'Cli','build android');

trythis(MSPEC_DIR, '../cordova-cli/bin/cordova build ios', BRANCH,'Cli','build ios');

trythis(MSPEC_DIR, '../cordova-cli/bin/cordova run android',BRANCH,'Cli','deploy android');



