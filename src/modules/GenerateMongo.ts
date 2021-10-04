/**
 * @module database
 */
import { MongoClient } from 'mongodb'

/**
 * @sample ```ts
 * const mongo = new GenerateMongo({...})
 * const { client } = mongo.init()
 * await clinet.connect()
 * client.collection(...).find(...)
 * ```
 */
export class GenerateMongo {
  dbUri: string
  dbName: string
  colName: string
  devDbName: string
  devColName: string
  devMode: boolean

  constructor({
    dbUri,
    dbName,
    colName,
    devDbName,
    devColName,
  }: {
    dbUri: string
    dbName: string
    colName: string
    devDbName?: string
    devColName?: string
  }) {
    this.dbUri = dbUri
    this.dbName = dbName
    this.colName = colName
    this.devDbName = devDbName || dbName
    this.devColName = devColName || colName
    this.devMode = false
  }

  init(devMode?: boolean) {
    if (devMode) {
      this.devMode = true
    } else {
      this.devMode = false
    }
    const client = new MongoClient(this.dbUri, {})
    const db = client.db(
      process.env.NODE_ENV === 'development' || devMode
        ? this.devDbName
        : this.dbName
    )
    const col = db.collection(
      process.env.NODE_ENV === 'development' || devMode
        ? this.devColName
        : this.colName
    )
    return { client, db, col }
  }
}

/**
 * @param str sample: `foo|!bar`
 * @returns sample: `foo|!bar` -> `{ foo: 1, bar: -1 }`
 */
export function getProjectSrotFromStr(str = ''): Record<string, 1 | -1> {
  const project: Record<string, 1 | -1> = {}
  str.split('|').forEach((i) => {
    const name = i.replace(/^!/, '')
    if (!name) return
    project[name] = i.startsWith('!') ? -1 : 1
  })
  return project
}
