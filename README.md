# Mapi

Mapi is a proxy that lets you selectively capture HTTP calls based on a simple ruleset and reroute them to a destination of your own choice. 

**Examples of use cases**

* Monitor HTTP calls
* Rewrite HTTP calls
* Inject data in responses 

<img src="http://projects.ljungblad.nu/images/mapi-screenshot.png" style="width: 75%" alt="Screenshot of Mapi" />

## Installing

1. Clone this repository
2. In your new clone, run `npm install` to download the necessary dependencies listed in `package.json`. 

## Running

```
% node mapi.js

Usage: node ./mapi.js --port [port] --target [addr] --targetport [port] --prefix [prefix] --ruleset [file]

Options:
  --port    [required]
  --target  [required]
```

**Example**

`node mapi.js --port 8888 --target requestb.in --ruleset rules.spec`

**Options explained**

* `--port` specifies the local port to start Mapi on
* `--target` the original http target
* `--targetport` (optional) the original http target's port (default 80)
* `--prefix` (optional) an API prefix, for example, `/api/v2/` (default "")
* `--ruleset` (optional) path to a set of rules (default `./rules.spec`)

## Rules

The rule file defines which calls to intercept and which to pass through to the original target. Each line is a separate rule which follows the pattern `ENDPOINT LOCALTARGET`. For example, if you want to redirect all calls to the endpoint `/foo` to `localhost:8002` you add the following line: 

`/foo localhost:8002`

## Contributions

Are more than welcome! 

## License 

The MIT License (MIT)

Copyright (c) 2014 Marcus Ljungblad