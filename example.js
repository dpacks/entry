var dPackEntry = require('./')({dpackStyle: style})
var buffgap = require('@dwcore/buffgap')()

var names = []
var seconds = 0

buffgap.pipe(process.stdout)

dPackEntry.on('end', function () {
  process.exit()
})

dPackEntry.on('enter', function (consoleLine) {
  names.push(consoleLine)
})

setInterval(function () {
  seconds++
  update()
}, 1000)

dPackEntry.on('update', update)
update()

function style (start, cursor, end) {
  if (!cursor) cursor = ' '
  return start + '[' + cursor + ']' + end
}

function update () {
  buffgap.write(`
    Welcome to a name prompt. It has been ${seconds} second(s) since you started.

    Please enter your name: ${dPackEntry.consoleLine()}
    Cursor position is ${dPackEntry.cursor}

    Previously entered names: ${names.join(', ')}
  `)
}
