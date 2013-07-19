var shell        = require('shelljs'),
    path         = require('path'),
    error_writer = require('./error_writer'),
    config       = require('../../../config'),
    fs           = require('fs');

var keychain_location = config.ios.keychainLocation;
var keychain_password = config.ios.keychainPassword;

var ios_lib = libraries.paths['cordova-ios'];
var create = path.join(ios_lib, 'bin', 'create');

module.exports = function(output, sha, devices, entry_point, callback) {
    function log(msg) {
        console.log('[IOS] ' + msg + ' (sha: ' + sha.substr(0,7) + ')');
    }
    if (keychain_location.length === 0 || keychain_password.length === 0) {
        log('No keychain information. Fill that shit out in config.json if you want to build for iOS.');
        callback(true);
        return;
    }
                        try {
                            var projectWww = path.join(output, 'www');

                            // drop the iOS library SHA into the junit reporter
                            // only applies to projects that use it
                            var tempJasmine = path.join(projectWww, 'jasmine-jsreporter.js');
                            if (fs.existsSync(tempJasmine)) {
                                fs.writeFileSync(tempJasmine, "var library_sha = '" + sha + "';\n" + fs.readFileSync(tempJasmine, 'utf-8'), 'utf-8');
                            }

                            // 2. new way: modify config.xml
                            var configFile = path.join(output, 'cordovaExample', 'config.xml');
                            fs.writeFileSync(configFile, fs.readFileSync(configFile, 'utf-8').replace(/<content\s*src=".*"/gi, '<content src="'+entry_point+'"'), 'utf-8');

                            // modify configuration to Release mode, i386 to armv7 and sdk to iphoneos6.0 so we can use it with fruitstrap
                            // TODO: expose which target sdk to build for
                            var debugScript = path.join(output, 'cordova', 'build');
                            fs.writeFileSync(debugScript, fs.readFileSync(debugScript, 'utf-8').replace(/configuration Debug/, 'configuration Release').replace(/i386/g,'armv7').replace(/SDK=`.*`/, 'SDK="iphoneos6.1"'), 'utf-8');

                        } catch(e) {
                            error_writer('ios', sha, 'Exception thrown modifying mobile spec application for iOS.', e.message);
                            callback(true);
                            return;
                        }

}
