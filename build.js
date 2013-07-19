

var mobile_spec  = require('src/build/makers/mobile_spec');
var android  = require('src/build/makers/android');
var ios  = require('src/build/makers/ios');

// call the builder for the requested platform

  var fake_sha='HEAD';
  var test_entry='all.html';

 android.(output_location,fake_sha,'',test_entry,function(err){

 });

// ios.(output_location,fake_sha,'',test_entry,function(err){
// });

