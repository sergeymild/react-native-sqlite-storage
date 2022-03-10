


export interface OpenDbParams {
  readonly name: string
  readonly readOnly?: boolean
}

export interface ExecSqlSuccess<T> {
  readonly type: 'success'
  readonly rowsAffected: number
  readonly insertId?: number
  readonly rows: T[]
}

export interface ExecSqlError {
  readonly type: 'error'
  readonly code: number;
  readonly message: string
}

export type ExecSqlResponse<T> = ExecSqlSuccess<T> | ExecSqlError
export type OpenDbResponse = {type: 'success'; dbPath: string} | {type: 'error'; error: string}
