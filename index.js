var events = require('events')
var keypress = require('keypress')

module.exports = dpackEntry

function dpackEntry (opts) {
  if (!opts) opts = {}

  var dpackStyle = opts.style
  var showCursor = !!opts.showCursor
  var dPackEntry = new events.EventEmitter()
  var dPackRawLine = ''
  var dPackBuffer = ''

  if (!showCursor) hideConsoleCursor()

  dPackEntry.entryDestroyed = false
  dPackEntry.cursor = 0
  dPackEntry.consoleLine = consoleLine
  dPackEntry.dPackRawLine = lineNoStyle
  dPackEntry.consoleEnter = onConsoleEnter
  dPackEntry.setConsoleLine = setConsoleLine
  dPackEntry.destroyEntry = destroyEntry

  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true)
    keypress(process.stdin)
    process.stdin.resume()
    process.stdin.on('keypress', onConsoleKeypress)
  } else {
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', function (data) {
      dPackBuffer += data
      while (true) {
        var nl = dPackBuffer.indexOf('\n')
        if (nl === -1) return
        dPackRawLine = dPackBuffer.slice(0, dPackBuffer[nl - 1] === '\r' ? nl - 1 : nl)
        dPackBuffer = dPackBuffer.slice(nl + 1)
        onConsoleEnter(dPackRawLine)
      }
    })
  }

  process.stdin.on('end', onend)

  return dPackEntry

  function onend () {
    dPackEntry.emit('end')
  }

  function handle (ch, key) {
    if (key && key.ctrl) {
      if (key.name === 'c' && !dPackEntry.emit('ctrl-c')) process.exit()
      dPackEntry.emit('ctrl-' + key.name)
      return true
    }
    if (key && key.meta) {
      dPackEntry.emit('alt-' + key.name)
      return true
    }

    switch (key && key.name) {
      case 'up':
        dPackEntry.emit('up')
        return true

      case 'down':
        dPackEntry.emit('down')
        return true

      case 'left':
        dPackEntry.cursor = Math.max(dPackEntry.cursor - 1, 0)
        dPackEntry.emit('left')
        return true

      case 'right':
        dPackEntry.cursor = Math.min(dPackEntry.cursor + 1, dPackRawLine.length)
        dPackEntry.emit('right')
        return true

      case 'backspace':
        dPackRawLine = dPackRawLine.slice(0, Math.max(dPackEntry.cursor - 1, 0)) + dPackRawLine.slice(dPackEntry.cursor)
        dPackEntry.cursor = Math.max(dPackEntry.cursor - 1, 0)
        return true

      case 'pageup':
        dPackEntry.emit('pageup')
        return true

      case 'pagedown':
        dPackEntry.emit('pagedown')
        return true

      default:
        if (ch === '\t') {
          dPackEntry.emit('tab')
          return true
        }

        if (ch === '\n' || ch === '\r') {
          onConsoleEnter(dPackRawLine)
          return false
        }

        if (ch) {
          dPackRawLine = dPackRawLine.slice(0, dPackEntry.cursor) + ch + dPackRawLine.slice(dPackEntry.cursor)
          dPackEntry.cursor += ch.length
          return true
        }
    }

    return false
  }

  function lineNoStyle () {
    return dPackRawLine
  }

  function consoleLine () {
    if (!dpackStyle) return dPackRawLine
    return dpackStyle(
      dPackRawLine.slice(0, dPackEntry.cursor),
      dPackRawLine.slice(dPackEntry.cursor, dPackEntry.cursor + 1),
      dPackRawLine.slice(dPackEntry.cursor + 1)
    )
  }

  function destroyEntry () {
    dPackEntry.entryDestroyed = true
    dPackEntry.emit('destroyEntry')
    if (!showCursor) process.stdout.write('\x1B[?25h')
  }

  function setConsoleLine (consoleLine) {
    dPackRawLine = consoleLine
    dPackEntry.cursor = consoleLine.length
    dPackEntry.emit('update')
  }

  function onConsoleEnter (consoleLine) {
    dPackRawLine = ''
    dPackEntry.cursor = 0
    dPackEntry.emit('enter', consoleLine)
    dPackEntry.emit('update')
  }

  function onConsoleKeypress (ch, key) {
    if (handle(ch, key)) dPackEntry.emit('update')
    dPackEntry.emit('keypress', ch, key)
  }

  function hideConsoleCursor () {
    process.stdout.write('\x1B[?25l')
    process.on('exit', destroyEntry)
  }
}
