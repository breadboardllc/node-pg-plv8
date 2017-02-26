/*eslint no-console: 0 */
const bootstrapPlv8 = require('./lib/bootstrap')
const babel = require('babel-core')
const browserify = require('browserify')
const babelify = require('babelify')
const babelOptions = {
  presets: [
    require('babel-preset-es2015')
  ],
  plugins: [
    require('babel-plugin-transform-remove-console')
  ],
  ast: false,
  babelrc: false
}

module.exports = class PLV8 {

  install ({ modulePath, moduleName }, compact = true) {
    return this.init()
    .then(() => {
      return new Promise((resolve, reject) => {
        browserify({ ignoreMissing: true, standalone: moduleName })
          .transform(babelify, {
            global: true,
            presets: [
              require('babel-preset-es2015')
            ],
            plugins: [
              require('babel-plugin-transform-remove-console')
            ],
            ast: false,
            babelrc: false,
            compact
          })
          .require(modulePath, { entry: true })
          .bundle((err, buf) => {
            if (err) return reject(err)

            const code = `
              (function () {
                var module = {
                  exports: { }
                };
                var exports = module.exports;
                ${buf.toString()}
                return module
              })()`

            return resolve(code)
          })
          .on('error', err => {
            console.error('Error: ', err.message)
          })
      })
    })
    .then(code => {
      return this.pg.query('SELECT * FROM v8.modules WHERE name = $1', [moduleName])
        .then(result => {
          if (result.rows.length > 0) {
            return this.pg.query('UPDATE v8.modules SET code = $1 WHERE name = $2', [code, moduleName]);
          }
          else {
            return this.pg.query('INSERT INTO v8.modules (code, name) VALUES ($1, $2)', [code, moduleName]);
          }
        })
    })
    .then(() => moduleName)
  }

  uninstall (moduleId) {
    const name = moduleId.replace(/^@\w+\//, '')
    return this.pg.query('DELETE FROM v8.modules WHERE name = $1', [name]).then(() => true)
  }

  eval (f, compact = true) {
    return this.ap(f, null, compact)
  }
  ap (f, args, compact = true) {
    let es5
    const jsonArgs = JSON.stringify(args)
    const template = `
      (function () {
        try {
          return (${f.toString()})(${jsonArgs})
        }
        catch (e) {
          return {
            error: true,
            stack: e.stack,
            message: e.message
          }
        }
      })`

    try {
      babelOptions.compact = compact
      es5 = babel.transform(template.toString(), babelOptions)
    }
    catch (e) {
      console.error(e)
      return Promise.reject(e)
    }
    const code = es5.code.slice(0, -1)

    return this.pg.query('select v8.eval($1) as val', [ `${code}()` ])
      .then(({ rows: [ result ] }) => {
        const val = result && result.val
        if (val && val.error === true) {
          const err = new Error(val.message)
          err.stack = val.stack
          return Promise.reject(err)
        }
        else {
          return val || { }
        }
      })
  }

  init () {
    return this.pg.query("SELECT * FROM pg_catalog.pg_namespace WHERE nspname = 'v8'")
      .then( (schema) => {
        if (schema) {
          return;
        }
        else {
          return this.pg.query('create schema if not exists "v8"')
        }
      })
      .then(() => {
        var query = this.pg.query("SELECT * FROM pg_available_extensions WHERE name = 'plv8'");
        var result = query.then((result) => {
            const ext = result.rows[0];
            if (ext && ext.installed_version) {
              return
            }
            else {
              return this.pg.query("create extension if not exists plv8");
            }
          });
          return result;
      })
      .then(() => {
        return this.pg.query("CREATE TABLE IF NOT EXISTS v8.modules (id SERIAL, name text, code text)");
      })
      .then(() => {
        return bootstrapPlv8(this.pg)
      })
  }

  constructor (pg) {
    this.pg = pg;
  }
}