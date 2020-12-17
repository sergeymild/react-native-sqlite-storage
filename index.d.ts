
// export function enableDatabasePromises(enable: boolean): void;
export function setSQLiteDebug(isEnable: boolean): void
type DbLocation = "default" | "Documents" | "Library" | "Shared"

interface OpenDatabaseConfig {
  name: string,
  readOnly?: boolean
  location?: DbLocation,
  createFromLocation?: string,
  onOpen?: () => void,
  onError?: () => void
}

interface Rows {
  item: (index: number) => any
  raw: () => any
  length: number
}

interface SQLiteResult {
  rows: Rows
  rowsAffected: number
  insertId: number
}

interface SQLiteBatch {
  sql: string
  params?: ReadonlyArray<any>
}

interface SQLitePluginTransaction {
  executeSql: (sql: string, values: ReadonlyArray<any>, callback: (tx: SQLitePluginTransaction, results: SQLiteResult) => void) => void
}

interface SQLitePlugin {
  transaction: (tx: SQLitePluginTransaction) => void
  readTransaction: (tx: SQLitePluginTransaction) => void
  close: (success?: () => void, error?: () => void) => void
  executeSql: (sql: string, values: ReadonlyArray<any>) => Promise<SQLiteResult>
  sqlBatch: (statements: ReadonlyArray<SQLiteBatch>, values: ReadonlyArray<any>, success?: () => void, error?: (error: Error) => void) => void
}

interface SQLiteFactory {
  openDatabase: (config: OpenDatabaseConfig) => SQLitePlugin
  echoTest: () => Promise<void>
}
declare const factory: SQLiteFactory
export default factory
