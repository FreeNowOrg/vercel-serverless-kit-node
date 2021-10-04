/**
 * @module database
 */
import { MongoClient } from 'mongodb';
/**
 * @sample ```ts
 * const mongo = new GenerateMongo({...})
 * const { client } = mongo.init()
 * await clinet.connect()
 * client.collection(...).find(...)
 * ```
 */
export declare class GenerateMongo {
    dbUri: string;
    dbName: string;
    colName: string;
    devDbName: string;
    devColName: string;
    devMode: boolean;
    constructor({ dbUri, dbName, colName, devDbName, devColName, }: {
        dbUri: string;
        dbName: string;
        colName: string;
        devDbName?: string;
        devColName?: string;
    });
    init(devMode?: boolean): {
        client: MongoClient;
        db: import("mongodb").Db;
        col: import("mongodb").Collection<import("bson").Document>;
    };
}
/**
 * @param str sample: `foo|!bar`
 * @returns sample: `foo|!bar` -> `{ foo: 1, bar: -1 }`
 */
export declare function getProjectSrotFromStr(str?: string): Record<string, 1 | -1>;
