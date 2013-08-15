#Medic using BuildBot
=======

> Tools for Automated Testing of Cordova

#Installation
- get [buildbot] (http://buildbot.net) version 0.8.7p1
- install buildbot using the buildbot install/tutorial instructions
- get the sample running
- stop the slave and the master
- edit the buildbot.tac file in the slave directory to change the name to 'cordova-slave' 
    slavename = 'cordova-slave'
- get two files from the medic repository
  - master.cfg - copy to buildbot/master/master.cfg
  - config.json.sample -  copy to buildbot

#Running the System
- start the master with buildbot start master
- start the slave with buildslave start slave
- restart the master with buildbot restart master
- stop the master with buildbot stop master

#Configuring
- change test, build steps, etc in master.cfg
- whenever master.cfg changes, you need to restart the master (not slaves)

