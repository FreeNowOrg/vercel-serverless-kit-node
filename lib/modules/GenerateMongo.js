"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectSrotFromStr = exports.GenerateMongo = void 0;
/**
 * @module database
 */
const mongodb_1 = require("mongodb");
/**
 * @sample ```ts
 * const mongo = new GenerateMongo({...})
 * const { client } = mongo.init()
 * await clinet.connect()
 * client.collection(...).find(...)
 * ```
 */
class GenerateMongo {
    constructor({ dbUri, dbName, colName, devDbName, devColName, }) {
        this.dbUri = dbUri;
        this.dbName = dbName;
        this.colName = colName;
        this.devDbName = devDbName || dbName;
        this.devColName = devColName || colName;
        this.devMode = false;
    }
    init(devMode) {
        if (devMode) {
            this.devMode = true;
        }
        else {
            this.devMode = false;
        }
        const client = new mongodb_1.MongoClient(this.dbUri, {});
        const db = client.db(process.env.NODE_ENV === 'development' || devMode
            ? this.devDbName
            : this.dbName);
        const col = db.collection(process.env.NODE_ENV === 'development' || devMode
            ? this.devColName
            : this.colName);
        return { client, db, col };
    }
}
exports.GenerateMongo = GenerateMongo;
/**
 * @param str sample: `foo|!bar`
 * @returns sample: `foo|!bar` -> `{ foo: 1, bar: -1 }`
 */
function getProjectSrotFromStr(str = '') {
    const project = {};
    str.split('|').forEach((i) => {
        const name = i.replace(/^!/, '');
        if (!name)
            return;
        project[name] = i.startsWith('!') ? -1 : 1;
    });
    return project;
}
exports.getProjectSrotFromStr = getProjectSrotFromStr;
//# sourceMappingURL=GenerateMongo.js.map