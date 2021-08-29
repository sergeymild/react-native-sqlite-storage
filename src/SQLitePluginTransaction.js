import {
  exec,
  log,
  logError,
  logWarn,
  newSQLError,
  READ_ONLY_REGEX,
  txLocks,
} from './common';

export class SQLitePluginTransaction {
  constructor(db, fn, error, success, txlock, readOnly) {
    this.db = db;
    this.fn = fn;
    this.error = error;
    this.success = success;
    this.txlock = txlock;
    this.readOnly = readOnly;
    this.executes = [];
    if (txlock) {
      this.addStatement('BEGIN', [], null, function (tx, err) {
        throw newSQLError(
          'unable to begin transaction: ' + err.message,
          err.code
        );
      });
    } else {
      this.addStatement('SELECT 1', [], null, null);
    }
  }

  start = () => {
    try {
      this.fn(this);
      this.run();
    } catch (_error) {
      const err = _error;
      txLocks[this.db.dbname].inProgress = false;
      this.db.startNextTransaction();
      if (this.error) {
        this.error(newSQLError(err));
      }
    }
  };

  executeSql = (sql, values, success, error) => {
    if (this.finalized) {
      throw {
        message:
          'InvalidStateError: DOM Exception 11: This transaction is already finalized. Transactions are committed' +
          ' after its success or failure handlers are called. If you are using a Promise to handle callbacks, be aware that' +
          ' implementations following the A+ standard adhere to run-to-completion semantics and so Promise resolution occurs' +
          ' on a subsequent tick and therefore after the transaction commits.',
        code: 11,
      };
    }
    if (this.readOnly && READ_ONLY_REGEX.test(sql)) {
      this.handleStatementFailure(error, {
        message: 'invalid sql for a read-only transaction',
      });
      return;
    }
    const mysuccess = (t, r) => {
      if (success) return success(t, r);
    };
    const myerror = (t, e) => {
      if (error) {
        return error(e);
      } else {
        log('Error handler not provided: ', e);
      }
    };
    this.addStatement(sql, values, mysuccess, myerror);
  };

  addStatement = (sql, values, success, error) => {
    const sqlStatement = typeof sql === 'string' ? sql : sql.toString();
    const params = [];
    if (!!values && values.constructor === Array) {
      for (let j = 0, len1 = values.length; j < len1; j++) {
        const v = values[j];
        const t = typeof v;
        if (v === null || v === void 0 || t === 'number' || t === 'string') {
          params.push(v);
        } else if (t === 'boolean') {
          //Convert true -> 1 / false -> 0
          params.push(~~v);
        } else if (t !== 'function') {
          params.push(v.toString());
          logWarn(
            'addStatement - parameter of type <' +
              t +
              '> converted to string using toString()'
          );
        } else {
          let errorMsg =
            'Unsupported parameter type <' + t + '> found in addStatement()';
          logError(errorMsg);
          error(newSQLError(errorMsg));
          return;
        }
      }
    }
    this.executes.push({
      success: success,
      error: error,
      sql: sqlStatement,
      params: params,
    });
  };

  handleStatementSuccess = (handler, response) => {
    if (!handler) return;
    const rows = response.rows || [];
    const payload = {
      rows: {
        item: (i) => rows[i],
        /**
         * non-standard Web SQL Database method to expose a copy of raw results
         * @return {Array}
         */
        raw: () => rows.slice(),
        length: rows.length,
      },
      rowsAffected: response.rowsAffected || 0,
      insertId: response.insertId || void 0,
    };
    handler(this, payload);
  };

  handleStatementFailure = (handler, response) => {
    if (!handler) {
      throw newSQLError(
        'a statement with no error handler failed: ' + response.message,
        response.code
      );
    }
    if (handler(this, response) !== false) {
      throw newSQLError(response.message, response.code);
    }
  };

  run = () => {
    let txFailure = null;
    const tropts = [];
    const batchExecutes = this.executes;
    let waiting = batchExecutes.length;
    this.executes = [];
    const tx = this;
    const handlerFor = (index, didSucceed) => {
      return (response) => {
        if (!txFailure) {
          try {
            if (didSucceed) {
              tx.handleStatementSuccess(batchExecutes[index].success, response);
            } else {
              tx.handleStatementFailure(
                batchExecutes[index].error,
                newSQLError(response)
              );
            }
          } catch (err) {
            let errorMsg = JSON.stringify(err);
            if (errorMsg === '{}') errorMsg = err.toString();
            log('warning - exception while invoking a callback: ' + errorMsg);
          }

          if (!didSucceed) {
            txFailure = newSQLError(response);
          }
        }
        if (--waiting === 0) {
          if (txFailure) {
            tx.executes = [];
            tx.abort(txFailure);
          } else if (tx.executes.length > 0) {
            tx.run();
          } else {
            tx.finish();
          }
        }
      };
    };

    let i = 0;
    const callbacks = [];
    while (i < batchExecutes.length) {
      const request = batchExecutes[i];
      callbacks.push({
        success: handlerFor(i, true),
        error: handlerFor(i, false),
      });
      tropts.push({
        qid: 1111,
        sql: request.sql,
        params: request.params,
      });
      i++;
    }

    let mysuccess = (result) => {
      if (result.length === 0) return;
      const last = result.length - 1;
      for (let j = 0; j <= last; ++j) {
        const r = result[j];
        const type = r.type;
        const res = r.result;
        const q = callbacks[j];
        if (q) {
          if (q[type]) {
            q[type](res);
          }
        }
      }
    };

    const myerror = (error) => {
      log('batch execution error: ', error);
    };

    exec(
      'backgroundExecuteSqlBatch',
      {
        dbargs: {
          dbname: this.db.dbname,
        },
        executes: tropts,
      },
      mysuccess,
      myerror
    );
  };

  abort = (txFailure) => {
    if (this.finalized) return;
    const tx = this;
    const succeeded = (tx) => {
      txLocks[tx.db.dbname].inProgress = false;
      tx.db.startNextTransaction();
      if (tx.error) {
        tx.error(txFailure);
      }
    };
    const failed = (tx, err) => {
      txLocks[tx.db.dbname].inProgress = false;
      tx.db.startNextTransaction();
      if (tx.error) {
        tx.error(
          newSQLError(
            'error while trying to roll back: ' + err.message,
            err.code
          )
        );
      }
    };
    this.finalized = true;
    if (this.txlock) {
      this.addStatement('ROLLBACK', [], succeeded, failed);
      this.run();
    } else {
      succeeded(tx);
    }
  };

  finish = () => {
    if (this.finalized) return;
    const tx = this;
    const succeeded = function (tx) {
      txLocks[tx.db.dbname].inProgress = false;
      tx.db.startNextTransaction();
      if (tx.success) {
        tx.success();
      }
    };
    const failed = function (tx, err) {
      txLocks[tx.db.dbname].inProgress = false;
      tx.db.startNextTransaction();
      if (tx.error) {
        tx.error(
          newSQLError('error while trying to commit: ' + err.message, err.code)
        );
      }
    };
    this.finalized = true;
    if (this.txlock) {
      this.addStatement('COMMIT', [], succeeded, failed);
      this.run();
    } else {
      succeeded(tx);
    }
  };

  abortFromQ = (sqlerror) => {
    if (this.error) this.error(sqlerror);
  };
}
