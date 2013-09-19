/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var argscheck = require('cordova/argscheck'),
    channel = require('cordova/channel'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');

require('./jasmine-jsreporter');

/**
 * This represents the medic CI information
 * @constructor
 */
function Medic() {
    this.couchdb = 'http://172.23.188.139:5900';
    this.sha = 'sample';


}
Medic.prototype.isEnabled = function() {
    return (!!window.jasmine || !!window.jasmine.JSReporter) ;
}

Medic.prototype.getJSReporter = function() {

    if(!window.jasmine) console.log('[ERROR] jasmine not installed.');
    if(!window.jasmine.JSReporter) console.log('[ERROR] jasmine reporter not installed.');
    return new window.jasmine.JSReporter( this.couchdb,this.sha );
};

module.exports = new Medic();
