var shell        = require('shelljs'),
    path         = require('path'),
    deploy       = require('./ios/deploy'),
    error_writer = require('./error_writer'),
    config       = require('../../../config'),
    fs           = require('fs');

var keychain_location = config.ios.keychainLocation;
var keychain_password = config.ios.keychainPassword;


module.exports = function(output, sha, devices, entry_point, couchdb_host, callback) {
    function log(msg) {
        console.log('[IOS] ' + msg + ' (sha: ' + sha.substr(0,7) + ')');
    }
    if (keychain_location.length === 0 || keychain_password.length === 0) {
        log('No keychain information. Fill that shit out in config.json if you want to build for iOS.');
        callback(true);
        return;
    } else {
        // unlock the chain
       log('setting up keychain');
        var security = shell.exec('security default-keychain -s \'' + keychain_location + '\' && security unlock-keychain -p \'' + keychain_password + '\' \'' + keychain_location+'\'', {silent:true});
        if (security.code > 0) {
            log('keychain setup failed');
            error_writer('ios', sha, 'Could not unlock keychain.', security.output);
            callback(true);
        } else {
            // create an ios app into output dir
            log('./bin/create\'ing.');
            shell.exec(create + ' ' + output + ' org.apache.cordova.example cordovaExample', {silent:true, async:true}, function(code, ootput) {
                if (code > 0) {
                    log('create failed');
                    error_writer('ios', sha, './bin/create error', ootput);
                    callback(true);
                } else {
                    log('starting iOS prepare');
                    try {
                        var projectWww = path.join(output, 'www');
                        // drop the iOS library SHA into the junit reporter
                        // only applies to projects that use it
                        var tempJasmine = path.join(projectWww, 'jasmine-jsreporter.js');
                        if (fs.existsSync(tempJasmine)) {
                            fs.writeFileSync(tempJasmine, "var library_sha = '" + sha + "';\n" + fs.readFileSync(tempJasmine, 'utf-8'), 'utf-8');
                        }

                        //  modify config.xml
                        var configFile = path.join(output, 'cordovaExample', 'config.xml');
                        fs.writeFileSync(configFile, fs.readFileSync(configFile, 'utf-8').replace(/<content\s*src=".*"/gi, '<content src="'+entry_point+'"'), 'utf-8');
                        // make sure the couch db server is whitelisted
                        fs.writeFileSync(configFile, fs.readFileSync(configFile, 'utf-8').replace(/<access origin="http:..audio.ibeat.org" *.>/gi,'<access origin="http://audio.ibeat.org" /><access origin="'+couchdb_host+'" />', 'utf-8'));

                        // modify configuration to Release mode, i386 to armv7 and sdk to iphoneos6.0 so we can use it with fruitstrap
                        // TODO: expose which target sdk to build for
                        var debugScript = path.join(output, 'cordova', 'build');
                        fs.writeFileSync(debugScript, fs.readFileSync(debugScript, 'utf-8').replace(/configuration Debug/, 'configuration Release').replace(/i386/g,'armv7').replace(/SDK=`.*`/, 'SDK="iphoneos6.1"'), 'utf-8');
                    } catch(e) {
                        error_writer('ios', sha, 'Exception thrown modifying mobile spec application for iOS.', e.message);
                        callback(true);
                        return;
                    }
                    // compile
                    log('Compiling.');
                        
                    var debug = 'cd ' + output + ' && ./cordova/build';
                    var compile = shell.exec(debug, {silent:true});
                    if (compile.code > 0) {
                            error_writer('ios', sha, 'Compilation error.', compile.output);
                            callback(true);
                    } else {
                            // get list of connected devices
                            scan(function(err, devices) {
                                if (err) {
                                    error_writer('ios', sha, devices, 'No further details dude.');
                                    callback(true);
                                } else {
                                    var bundle = path.join(output, 'build', 'cordovaExample.app'),
                                        bundleId = 'org.apache.cordova.example';
                                    deploy(sha, devices, bundle, bundleId, callback);
                                }
                            });
                    }
                }
            });
        }
    }
}
