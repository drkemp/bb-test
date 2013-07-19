var shell        = require('shelljs'),
    path         = require('path'),
    error_writer = require('./error_writer'),
    n            = require('ncallbacks'),
    fs           = require('fs'),
    mspec        = require('./mobile_spec');

module.exports = function(output, sha, devices, entry_point, callback) {
      try {
          log('Modifying Cordova application.');

          // make sure android app got created first.
          if (!fs.existsSync(output)) {
              throw new Error('create must have failed as output path does not exist.');
          }
          mspec(output,sha,devices,entry_point, function(err){
              if(err) {
                  error_writer('android', sha, 'Error  modifying mobile spec application.', '');
                  callback(true);
              } else {
       
                        // add the sha to the junit reporter
                        var tempJasmine = path.join(output, 'assets', 'www', 'jasmine-jsreporter.js');
                        if (fs.existsSync(tempJasmine)) {
                            fs.writeFileSync(tempJasmine, "var library_sha = '" + sha + "';\n" + fs.readFileSync(tempJasmine, 'utf-8'), 'utf-8');
                        }

                        // modify start page
                        // modify the config.xml
                        var configFile = path.join(output, 'res', 'xml', 'config.xml');
                        fs.writeFileSync(configFile, fs.readFileSync(configFile, 'utf-8').replace(/<content\s*src=".*"/gi, '<content src="' +entry_point + '"'), 'utf-8');

                    } catch (e) {
                        error_writer('android', sha, 'Exception thrown modifying Android mobile spec application.', e.message);
                        callback(true);
                        return;
                    }
             }
}

