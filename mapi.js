/*
 * The MIT License (MIT)
 * 
 * Copyright (c) 2014 Marcus Ljungblad
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var util    = require('util'),
    colors  = require('colors'),
    http    = require('http'),
    url     = require('url'),
    fs      = require('fs'),
    argv    = require('optimist')
              .usage('Usage: $0 --port [port] --target [addr] --targetport [port] --prefix [prefix] --ruleset [file]')
              .demand(['port', 'target'])
              .argv;

/* configuration */
var rulesFile = (argv.ruleset ? argv.ruleset : './rules.spec');
var targetPort = (argv.targetport ? argv.targetport : 80);
var defaultRoute = { host: argv.target, port: targetPort };
var defaultAPIPrefix = (argv.prefix ? argv.prefix : '');
var ruleset = {};
var server_port = argv.port;

/* install ruleset */
ruleset = updateRules();

fs.watchFile(rulesFile, function(c,p) {
  ruleset = updateRules();
});

function updateRules() {
  var data = fs.readFileSync(rulesFile, 'ascii');
  var tmpRuleset = {};
  data.split('\n')
    .filter(function (element) { return element.length > 0; })
    .map(function (element) {
      var tuple = element.split(' ');
      var routeconf = tuple[1].split(':');
      tmpRuleset[tuple[0]] = { host: routeconf[0], port: parseInt(routeconf[1]) };
      return 1;
    });

  util.puts('Updated ruleset: '.green + rulesFile);

  return tmpRuleset;
}

function checkForRoute(path) {
  for (var pattern in ruleset) {
    if (new RegExp(pattern).test(path)) {
      return ruleset[pattern];
    }
  }
}

/* proxy server */
server = http.createServer(function(request, response) {

  // delete original host header
  delete request.headers.host;

  // determine the route to use for the particular path
  var possibleRoute = checkForRoute(url.parse(request.url).pathname);
  var route = (possibleRoute !== undefined ? possibleRoute : defaultRoute);

  // hack to add prefix to default route
  if (route['host'] == defaultRoute['host']) {
    route['prefix'] = defaultAPIPrefix;
  } else {
    route['prefix'] = '';
  }

  util.puts('Routing '.yellow + request.method + ' ' + request.url
    + ' to: '.yellow + route['host'] + ':' + route['port'] + route['prefix']);

  // compile proxy request options
  var options = {
    host: route['host'],
    port: route['port'],
    path: route['prefix'] + request.url,
    method: request.method,
    headers: request.headers
  };

  // make proxy request
  var proxyRequest = http.request(options, function(proxyResponse) {
    proxyResponse.setEncoding('utf8');
    response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
    proxyResponse.on('data', function(chunk) {
      response.write(chunk);
    });
    proxyResponse.on('end', function() {
      response.end();
    });
  });

  proxyRequest.on('error', function(error) {
    response.writeHead(405, {});
    response.end();
  });

  request.on('data', function(chunk) {
    if (request.method == 'POST' || request.method == 'PUT') {
      util.puts('\t Payload: '.red + chunk);
    }
    proxyRequest.write(chunk);
  });
  request.on('end', function() {
    proxyRequest.end();
  });
  request.on('error', function(err) {
    util.puts('Got error: ', err);
  });
});

// run server
server.listen(server_port);

util.puts('proxy server '.blue + 'started '.green.bold + 'on port '.blue
  + server_port);

/* local test backend */
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('caught: ' + req.url + ' using ' + req.method + '\n');
  res.end();
}).listen(8002);