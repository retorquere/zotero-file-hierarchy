const fs = require('fs')

const body = fs.readFileSync('File Hierarchy.js', 'utf-8')
const header = JSON.stringify({
  'translatorID': '86ffd88b-6f4e-4bec-a5be-839c1034beb2',
  'label': 'File Hierarchy',
  'description': 'Export files according to collection organisation',
  'creator': 'Emiliano Heyns',
  'target': 'txt',
  'minVersion': '4.0.27',
  'maxVersion': '',
  'configOptions': {
    'getCollections': true
  },
  'displayOptions': {
    'exportFileData': true
  },
  'translatorType': 2,
  'browserSupport': 'gcsv',
  'priority': 100,
  'inRepository': false,
  'lastUpdated': fs.statSync('File Hierarchy.ts').mtime.toISOString().replace('T', ' ').replace(/\..*/, ''),
}, null, 2)

fs.writeFileSync('File Hierarchy.js', header + '\n\n' + body)
