#geneViz-js: the JavaScript Frontend
This package provide the browser application to navigate into the neo4j backed gene correlation graph.

##Develop
##Prerequisites
nodejs must be installed locally.

###Build
Clone the project, then:

    npm install
    bower install
    
If bower is not installed globally, try <code>./node_modules/bower/bin/bower</code>


###Run
Simply open app/index.html in your browser.

##Deploy
Although it is not optimal from the web deployment point of view, simply

    rsync --recursive --delete app/* hostname:/path/to/http/application/

##License
This software is covered by the BSD license.

##Authors
Alexandre Masselot, Jacob Rinaldi, Johnny Wu. Bioinformatics & Computational Biology Department, gRED, Genentech
