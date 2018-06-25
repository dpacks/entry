var dpackEntry = require('./')({dpackStyle: style})
var buffgap = require('@dwcore/buffgap')()

var names = []
var seconds = 0

buffgap.pipe(process.stdout)

dpackEntry.on('end', function () {
  process.exit()
})

dpackEntry.on('enter', function (consoleLine) {
  names.push(consoleLine)
})

setInterval(function () {
  seconds++
  update()
}, 1000)

dpackEntry.on('update', update)
update()

function style (start, cursor, end) {
  if (!cursor) cursor = ' '
  return start + '[' + cursor + ']' + end
}

function update () {
  buffgap.write(`
    Welcome to a name prompt. It has been ${seconds} second(s) since you started.

    Please enter your name: ${dpackEntry.consoleLine()}
    Cursor position is ${dpackEntry.cursor}

    Previously entered names: ${names.join(', ')}
  `)
}
