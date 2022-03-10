import { exec } from './common';
import type { ExecSqlError, ExecSqlResponse, ExecSqlSuccess, OpenDbParams, OpenDbResponse } from './types';

export class SQLite {
  private isOpened = false
  constructor(private openArgs: OpenDbParams) {

  }

  open = async () => {
    console.log('[SqLite.open]', 'isOpened', this.isOpened)
    return new Promise<OpenDbResponse>((resolve) => {
      const onSuccess = (dbPath: string) => {
        this.isOpened = true
        resolve({type: 'success', dbPath})
      }
      const onError = (error: string) => {
        console.log('[SqLite.onError]', error)
        this.isOpened = false
        resolve({type: 'error', error})
      }
      exec('open', this.openArgs, onSuccess, onError);
    })
  };

  close = async () => {
    console.log('[SqLite.close]', 'isOpened', this.isOpened)
    if (!this.isOpened) return Promise.resolve()
    return new Promise<boolean>((resolve) => {
      const onSuccess = (value: boolean) => {
        this.isOpened = false
        resolve(value)
      }
      const onError = (error: string) => {
        console.log('[SqLite.onError]', error)
        this.isOpened = false
        resolve(false)
      }
      exec('close', { path: this.openArgs.name }, onSuccess, onError);
    })
  };

  executeSql = <T>(sql: string, values?: Array<string | number | boolean>) => {
    return new Promise<ExecSqlResponse<T>>(async (resolve) => {
      if (!this.isOpened) {
        await this.open()
        this.isOpened = true;
      }
      console.log('[SqLite.exec]', sql)
      const onSuccess = (r: ExecSqlSuccess<T>) => {
        //@ts-ignore
        // noinspection JSConstantReassignment
        r.type = 'success'
        resolve(r)
      };
      const onError = (e: ExecSqlError) => {
        //@ts-ignore
        // noinspection JSConstantReassignment
        e.type = 'error'
        resolve(e)
      }

      const params = [];
      if (!!values && Array.isArray(values)) {
        for (let j = 0, len1 = values.length; j < len1; j++) {
          const v = values[j];
          const t = typeof v;
          if (v === null || v === void 0 || t === 'number' || t === 'string') {
            params.push(v);
          } else if (t === 'boolean') {
            //Convert true -> 1 / false -> 0
            params.push(~~v);
          } else {
            let errorMsg = 'Unsupported parameter type <' + t + '> found in addStatement()';
            resolve({type: 'error', code: 10, message: errorMsg})
            return;
          }
        }
      }

      exec(
        'backgroundExecuteSql',
        {
          dbName: this.openArgs.name,
          executes: { qid: 1111, sql, params, },
        },
        onSuccess,
        onError
      );
    });
  };
}
