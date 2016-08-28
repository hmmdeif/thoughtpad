thoughtpad
==========

[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

A static site generator that automatically recompiles multiple sites periodically in a multi-core environment.

## Features

* Multiple domain hosting environment
* Optional bundling and minification of script and stylesheet files
* Optional periodic regeneration of sites or specific pages
* Realtime regeneration for development of sites
* Plugin based generation system
* Markdown flavoured content editing

## Running

`npm install`
`node thoughtpad`

Note that you need the minimum node engine (>=0.12.x) that allows generators. Use `node thoughtpad -help` to see available options. By default a browser link will be created for `localhost:8080` using websockets to automatically refresh when changes are detected. No http server is created so you will need to point a webserver to the correct `out` folder location. This makes thoughtpad quite platform agnostic, allowing you to pick whatever static webserver you want.

## Test

`npm -g install mocha`

This will install the test suite framework globally so you can run mocha in the command line. Then run the following command:

`mocha`

## Directory Structure

* app - application specific functions like request handling, compilation and bundling
* src - the source files for sites before static content generation. The top level folders in this directory should be the domain name of the hosted site. Inside each hosted domain will be the following folders:
    * documents -
        * posts - for your html/coffeekup/... files
        * scripts - for your javascript/coffeescript/... files
        * styles - for your css/styl/... files
    * files - static files that will be copied to the directory route on compilation (favicon.ico goes here for instance)
    * layouts - for your layout containers that your content gets injected into
    * config.js - an object that contains all metadata for the content
* out - the compiled sites split by their domain name

## License

The code is available under the [MIT license](http://deif.mit-license.org/).

[travis-image]: https://img.shields.io/travis/thoughtpad/thoughtpad/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/thoughtpad/thoughtpad
[coveralls-image]: https://img.shields.io/coveralls/thoughtpad/thoughtpad/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/thoughtpad/thoughtpad?branch=master
