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
  "lastUpdated": "2018-09-28 14:11:51"
}

class Collections {
    constructor() {
        this.collections = {};
        this.saved = {};
        let coll;
        while (coll = Zotero.nextCollection()) {
            const key = (coll.primary ? coll.primary : coll).key;
            this.collections[key] = {
                parent: coll.fields.parentKey,
                name: coll.name,
            };
        }
        for (const key in this.collections) {
            const coll = this.collections[key];
            if (coll.parent && !this.collections[coll.parent]) {
                coll.parent = false;
            }
            coll.path = this.path(coll);
        }
        Zotero.debug('collections: ' + JSON.stringify(this.collections));
    }
    clean(filename) {
        return filename.replace(/[#%&{}\\<>\*\?\/\$!'":@]/g, '_');
    }
    path(coll) {
        return (this.collections[coll.parent] ? this.path(this.collections[coll.parent]) : '') + this.clean(coll.name) + '/';
    }
    save(item) {
        const attachments = (item.itemType === 'attachment') ? [item] : (item.attachments || []);
        const collections = (item.collections || []).map(key => this.collections[key]).filter(coll => coll);
        for (const att of attachments) {
            if (!att.defaultPath)
                continue;
            const subdir = [
                // (item.itemType !== 'attachment' ? this.clean(item.title) : null),
                /* assume text/html is snapshot */
                (att.contentType === 'text/html' ? this.clean(att.filename.replace(/\.html?$/, '')) : null),
            ].filter(p => p).join('/');
            Zotero.write(`// subdir=${subdir}`);
            for (const coll of (collections.length ? collections : [{ path: '' }])) {
                const path = `${coll.path}${subdir}`;
                this.saved[path] = this.saved[path] || {};
                const parts = att.filename.split('.');
                const ext = this.clean(parts.length > 1 ? ('.' + parts.pop()) : '');
                const basename = this.clean(parts.join('.'));
                let postfix = 0;
                let filename = basename + ext;
                while (this.saved[filename]) {
                    filename = `${basename}_${++postfix}${ext}`;
                }
                this.saved[path][filename] = true;
                Zotero.debug(`saving to ${path}/${filename}\n`);
                att.saveFile(`${path}/${filename}`, true);
                Zotero.write(`${path}/${filename}\n`);
            }
        }
    }
}
function doExport() {
    if (!Zotero.getOption('exportFileData'))
        throw new Error('File Hierarchy needs "Export File Data" to be on');
    const collections = new Collections;
    let item, attachments;
    while ((item = Zotero.nextItem())) {
        collections.save(item);
    }
}
