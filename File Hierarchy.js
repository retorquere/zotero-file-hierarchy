{
  "translatorID": "86ffd88b-6f4e-4bec-a5be-839c1034beb2",
  "label": "File Hierarchy",
  "description": "Export files according to collection organisation",
  "creator": "Emiliano Heyns",
  "target": "txt",
  "minVersion": "4.0.27",
  "maxVersion": "",
  "configOptions": {
    "getCollections": true
  },
  "displayOptions": {
    "exportFileData": true
  },
  "translatorType": 2,
  "browserSupport": "gcsv",
  "priority": 100,
  "inRepository": false,
  "lastUpdated": "2021-12-30 00:40:30"
}

class Collections {
    constructor() {
        this.path = {};
        this.saved = {};
        let coll;
        while (coll = Zotero.nextCollection()) {
            this.register(coll);
        }
        Zotero.debug('collections: ' + JSON.stringify(this.path));
    }
    register(collection, path) {
        const key = (collection.primary ? collection.primary : collection).key;
        const children = collection.children || collection.descendents || [];
        const collections = children.filter(coll => coll.type === 'collection');
        const name = this.clean(collection.name);
        this.path[key] = path ? OS.Path.join(path, name) : name;
        for (collection of collections) {
            this.register(collection, this.path[key]);
        }
    }
    clean(filename) {
        return filename.replace(/[\x00-\x1F\x7F\/\\:*?"<>|$%]/g, encodeURIComponent);
    }
    split(filename) {
        const dot = filename.lastIndexOf('.');
        return (dot < 1 || dot === (filename.length - 1)) ? [filename, ''] : [filename.substring(0, dot), filename.substring(dot)];
    }
    save(item) {
        const attachments = (item.itemType === 'attachment') ? [item] : (item.attachments || []);
        const collections = (item.collections || []).map(key => this.path[key]).filter(coll => coll);
        for (const att of attachments) {
            if (!att.defaultPath)
                continue;
            const [base, ext] = this.split(this.clean(att.filename));
            const subdir = att.contentType === 'text/html' ? base : '';
            for (const coll of collections) {
                let path = [coll, subdir, base].filter(p => p).reduce((acc, p) => OS.Path.join(acc, p));
                const original = `${path}${ext}`;
                const lc_original = original.toLowerCase(); // deal with case insensitive file systems
                this.saved[lc_original] = this.saved[lc_original] || {};
                let filename = original;
                let postfix = 0;
                while (this.saved[lc_original][filename]) {
                    filename = `${path}_${++postfix}${ext}`;
                }
                this.saved[lc_original][filename] = true;
                att.saveFile(filename, true);
                Zotero.write(`${filename}\n`);
            }
        }
    }
}
function doExport() {
    if (!Zotero.getOption('exportFileData'))
        throw new Error('File Hierarchy needs "Export File Data" to be on');
    const collections = new Collections;
    let item;
    while ((item = Zotero.nextItem())) {
        collections.save(item);
    }
}
