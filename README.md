# node-pg-plv8

[![NPM version][npm-image]][npm-url]

Use node modules in [PLV8](https://github.com/plv8/plv8). Optimize your Node.js Backend by offloading work directly onto the database (PostgreSQL).

This is a fork of [node-plv8](https://github.com/langateam/node-plv8) that has been streamlined down to the essentials. The difference:

- Removed knex in favor of node-postgres

## Install

```sh
$ npm install --save pg-plv8
```

## Usage

### API

#### `install (module, [cwd])`

#### `uninstall (module)`

#### `eval (code)`

### Example

```js
const pg = require("pg");
const Pool = pg.Pool;
const PLV8 = require("plv8");
const plv8 = new PLV8(new Pool({ /* postgres pool config */});

plv8.install(require.resolve("lodash"))
	.then(() => {
		return plv8.eval(() => {
			const _ = require("lodash");
			return _.map([ 1, 2, 3 ], e => {
				return e + 1;
			});
		})
	})
	.then(result => {
		// result = [ 2, 3, 4 ]
	})
	.catch(err => {
		// handle error
	});
```

## License
MIT

## Maintained By
[<img src='https://i.imgur.com/yxS6uLe.png' height='64px'>breadboard](https://breadboard.ai)

[npm-image]: https://img.shields.io/npm/v/plv8.svg?style=flat-square
[npm-url]: https://npmjs.org/package/pg-plv8
