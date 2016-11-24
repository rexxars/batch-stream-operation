const stream = require('readable-stream')

function createStream(options) {
  const writeStream = new stream.Writable(options.streamOptions)

  const concurrency = options.concurrency || 5
  const batchSize = options.batchSize || 50
  const operation = options.operation

  let batch = []
  let numOngoingOperations = 0
  let streamPaused = false
  let finished = false

  writeStream.on('operationComplete', () => {
    numOngoingOperations--

    if (streamPaused && numOngoingOperations < concurrency) {
      streamPaused = false
      writeStream.emit('resumeStream')
    }

    if (finished && numOngoingOperations === 0) {
      writeStream.emit('close')
    }
  })

  writeStream._write = function _write(data, enc, next) {
    batch.push(data)

    if (batch.length === batchSize) {
      numOngoingOperations++
      operation(batch, () => writeStream.emit('operationComplete'))
      batch = []

      if (numOngoingOperations >= concurrency) {
        streamPaused = true
        this.once('resumeStream', next)
        return
      }
    }

    next()
  }

  writeStream.on('finish', () => {
    finished = true

    if (batch.length > 0) {
      operation(batch, () => writeStream.emit('operationComplete'))
    } else if (numOngoingOperations === 0) {
      writeStream.emit('close')
    }
  })

  return writeStream
}

module.exports = createStream
