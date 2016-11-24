/* eslint-disable id-length */
const fs = require('fs')
const path = require('path')
const test = require('tape')
const split2 = require('split2')
const batcher = require('../')

test('it batches, closes on uneven batch counts', t => {
  let batchNum = 0
  const batchStream = batcher({
    concurrency: 3,
    batchSize: 10,
    operation: (batch, cb) => {
      const expectedLength = ++batchNum === 11 ? 4 : 10
      t.equal(batch.length, expectedLength, `batch size should be ${expectedLength}`)
      setImmediate(cb)
    }
  })

  t.plan(12)

  fs.createReadStream(path.join(__dirname, 'fixture.txt'), {encoding: 'utf8'})
    .pipe(split2())
    .pipe(batchStream)
    .on('close', () => t.ok('Close called'))
})

test('it batches, closes on even batch counts', t => {
  const batchStream = batcher({
    concurrency: 4,
    batchSize: 8,
    operation: (batch, cb) => {
      t.equal(batch.length, 8, 'batch size should be 8')
      setImmediate(cb)
    }
  })

  t.plan(14)

  fs.createReadStream(path.join(__dirname, 'fixture.txt'), {encoding: 'utf8'})
    .pipe(split2())
    .pipe(batchStream)
    .on('close', () => t.ok('Close called'))
})
