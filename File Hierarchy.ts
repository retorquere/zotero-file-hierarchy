declare const Zotero: any
declare const OS: any

class Collections {
  private path: Record<string, string> = {}
  private saved: Record<string, Record<string, boolean>> = {}

  constructor() {
    let coll

    while (coll = Zotero.nextCollection()) {
      this.register(coll)
    }

    Zotero.debug('collections: ' + JSON.stringify(this.path))
  }

  private register(collection, path?: string) {
    const key = (collection.primary ? collection.primary : collection).key
    const children = collection.children || collection.descendents || []
    const collections = children.filter(coll => coll.type === 'collection')
    const name = this.clean(collection.name)

    this.path[key] = path ? OS.Path.join(path, name) : name

    for (collection of collections) {
      this.register(collection, this.path[key])
    }
  }

  clean(filename) {
    return filename.replace(/[#%&{}\\<>\*\?\/\$!'":@]/g, '_')
  }

  split(filename) {
    const dot = filename.lastIndexOf('.')
    return (dot < 1 || dot === (filename.length - 1)) ? [ filename, '' ] : [ filename.substring(0, dot), filename.substring(dot) ]
  }

  save(item) {
    const attachments = (item.itemType === 'attachment') ? [ item ] : (item.attachments || [])
    const collections = (item.collections || []).map(key => this.path[key]).filter(coll => coll)

    for (const att of attachments) {
      if (!att.defaultPath) continue

      const [ base, ext ] = this.split(this.clean(att.filename))
      const subdir = att.contentType === 'text/html' ? base : ''

      for (const coll of collections) {
        let path = [ coll, subdir, base ].filter(p => p).reduce((acc, p) => OS.Path.join(acc, p))
        const original = `${path}${ext}`
        this.saved[original] = this.saved[original] || {}

        let filename = original
        let postfix = 0
        while (this.saved[original][filename]) {
          filename = `${path}_${++postfix}${ext}`
        }
        this.saved[original][filename] = true

        att.saveFile(filename, true)
        Zotero.write(`${filename}\n`)
      }
    }
  }
}

function doExport() {
  if (!Zotero.getOption('exportFileData')) throw new Error('File Hierarchy needs "Export File Data" to be on')

  const collections = new Collections

  let item, attachments
  while ((item = Zotero.nextItem())) {
    collections.save(item)
  }
}
