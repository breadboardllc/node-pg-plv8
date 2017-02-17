const assert = require('assert')
const PLV8 = require('../')

const pg = require("pg");
const Pool = pg.Pool;

describe('plv8', () => {
  const plv8 = new PLV8(new Pool({
    "user": "postgres",
    "host": "localhost",
    "port": 5433,
    "database": "terramango",
    "ssl": false,
    "max": 2,
    "min": 1,
    "idleTimeoutMillis": 1000
  }));
  describe('#install', () => {
    it('should install a module', () => {
      return plv8.install({
        modulePath: require.resolve('./testmodule'),
        moduleName: 'testmodule'
      })
      .then(moduleName => {
        assert.equal(moduleName, 'testmodule')
      })
    })
  })
  describe('#uninstall', () => {
    before(() => {
      return plv8.install({
        modulePath: require.resolve('./testmodule'),
        moduleName: 'testmodule'
      })
      .then(moduleName => {
        assert.equal(moduleName, 'testmodule')
      })
    })
    it('should uninstall a module', () => {
      return plv8.uninstall('testmodule')
        .then(deleted => {
          assert(deleted)
        })
    })

  })
  describe('#eval', () => {
    before(() => {
      return plv8.install({
        modulePath: require.resolve('./testmodule'),
        moduleName: 'testmodule'
      })
      .then(moduleName => {
        assert.equal(moduleName, 'testmodule')
      })
    })

    it('should eval an arbitrary function', () => {
      return plv8.eval(() => 42)
        .then(result => {
          assert.equal(result, 42)
        })
    })
    it('should invoke function on installed module', () => {
      return plv8.eval(() => {
        const tm = require('testmodule')
        return tm.hello('world')
      })
      .then(result => {
        assert.equal(result, 'helloworld required value')
      })
    })
  })
})
