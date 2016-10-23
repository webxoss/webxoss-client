'use strict'

const map = {
  'Localize.min.js': ['Localize.js'],
  'ImageAndDetail.min.js': [
    'ImageManager.js',
    'Detail.js',
    'ImageFileCache.js',
  ],
  'webxoss.js': [
    './lib/util.js',
    'MessageBox.js',
    'IO.js',
    'Card.js',
    'CardBitmap.js',
    'StateBitmap.js',
    'Style.js',
    'Zone.js',
    'Game.js',
    'ZonePosition.js',
    'Button.js',
    'ButtonList.js',
    'Selector.js',
    'Dialog.js',
    'GameBackground.js',
    'FakeSocket.js',
    'GameAudio.js',
    'ChatManager.js',
    'RoomManager.js',
  ],
  // DeckEditor
  './DeckEditor/Deck.min.js': [
    './lib/util.js',
    './DeckManager.js',
    './DeckEditor/Rules.js',
    './DeckEditor/Searcher.js',
  ],
  './DeckEditor/DeckEditor.js': [
    './lib/util.js',
    './DeckEditor/editor.js',
  ],
}

const fs = require('fs')
const uglify = require('uglify-js')
Object.keys(map).forEach(key => {
  let code = uglify.minify(map[key]).code
  fs.writeFileSync(key, code)
  console.log(`${key} done.`)
})
