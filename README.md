thoughtpad
==========

A static site generator that automatically recompiles multiple sites periodically in a multi-core environment.

*NOT EVEN ALPHA YET; CURRENTLY IN DEVELOPMENT FOR ALPHA*

## Features

* Multiple domain hosting environment
* Optional bundling and minification of script and stylesheet files
* Optional periodic regeneration of sites or specific pages
* Realtime regeneration for development of sites
* Non-developer friendly admin section for content management
* Markdown flavoured content editing

## Why

There are a number of user and developer friendly static site applications for node.js already in existence as well as a number of blogging platforms. However in my eyes they always seem to miss something fundamental in their approach. In my eyes content should always be statically generated and only unknown content should be dynamically generated (such as user input).

The popular blog site [medium.com](http://medium.com) is entirely dynamically generated from javascript. The content is mostly static in nature yet it requires you to request the data once you have downloaded the page. Why not just include the content when you first respond to the http request? Thoughtpad hopes to improve on this.

[Docpad](http://docpad.org/), a terrific static site generation server, has multiple plugins that allow it to be extended. It is a single threaded application however and doesn't make use of the next generation ECMA6 generators. I am also not a fan of how Docpad handles the generation of files and how it watches them for changes. Thoughpad hopes to improve on this.

[Ghost](https://ghost.org/) is about as close as you'll get and probably the more ideal solution than thoughtpad, but healthy competition never hurt anyone. Ghost does bundling, minification, multi-host environments, non-developer friendly content generation and much more. The Ghost platform is the role model for thoughtpad.

## Running

`npm install`
`node --harmony app`

Note that you need the minimum node engine (>=0.11.9) that allows generators.

## Test

`npm -g install mocha`

This will install the test suite framework globally so you can run mocha in the command line. Then run the following command in the test folder:

`mocha --harmony-generators test`

## Directory Structure

* app - application specific functions like request handling, compilation and bundling
* src - the source files for sites before static content generation. The top level folders in this directory should be the domain name of the hosted site. Inside each hosted domain will be the following folders:
    * documents -
        * posts - for your html/coffeekup/... files
        * scripts - for your javascript/coffeescript/... files
        * styles - for your css/styl/... files
    * files - static files that will be copied to the directory route on compilation (favicon.ico goes here for instance)
    * layouts - for your layout containers that your content gets injected into
    * partials - for reuseable dynamic content
    * config.js - an object that contains all metadata for the content
* out - the compiled sites split by their domain name
* admin - a shared area for all domains to manage content

## License

The code is available under the [MIT license](http://deif.mit-license.org/).