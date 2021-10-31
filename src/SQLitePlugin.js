import { exec, log } from './common';

import {
  DB_STATE_OPEN,
  DB_STATE_INIT,
  txLocks,
  newSQLError,
  nextTick,
} from './common';
import { SQLitePluginTransaction } from './SQLitePluginTransaction';

export class SQLitePlugin {
  constructor(openargs, openSuccess, openError) {
    if (!(openargs && openargs.name)) {
      throw newSQLError(
        'Cannot create a SQLitePlugin db instance without a db name'
      );
    }

    const dbname = openargs.name;
    if (typeof dbname !== 'string') {
      throw newSQLError('sqlite plugin database name must be a string');
    }
    this.openargs = openargs;
    this.dbname = dbname;
    this.openSuccess = openSuccess;
    this.openError = openError;
    this.openSuccess ||
      (this.openSuccess = () => {
        log('DB opened: ' + dbname);
      });
    this.openError ||
      (this.openError = (e) => {
        log(e.message);
      });
    this.open(this.openSuccess, this.openError);
  }

  databaseFeatures = {
    isSQLitePluginDatabase: true,
  };

  openDBs = {};

  addTransaction = (t) => {
    if (!txLocks[this.dbname]) {
      txLocks[this.dbname] = {
        queue: [],
        inProgress: false,
      };
    }
    txLocks[this.dbname].queue.push(t);
    if (
      this.dbname in this.openDBs &&
      this.openDBs[this.dbname] !== DB_STATE_INIT
    ) {
      this.startNextTransaction();
    } else {
      if (this.dbname in this.openDBs) {
        log('new transaction is waiting for open operation');
      } else {
        log(
          'database is closed, new transaction is [stuck] waiting until db is opened again!'
        );
      }
    }
  };

  transaction = (fn, error, success) => {
    if (!this.openDBs[this.dbname]) {
      return error(newSQLError('database not open'));
    }
    this.addTransaction(
      new SQLitePluginTransaction(this, fn, error, success, true, false)
    );
  };

  readTransaction = (fn, error, success) => {
    if (!this.openDBs[this.dbname]) {
      return error(newSQLError('database not open'));
    }
    this.addTransaction(
      new SQLitePluginTransaction(this, fn, error, success, false, true)
    );
  };

  startNextTransaction = () => {
    nextTick(() => {
      if (
        !(this.dbname in this.openDBs) ||
        this.openDBs[this.dbname] !== DB_STATE_OPEN
      ) {
        log('cannot start next transaction: database not open');
        return;
      }
      const txLock = txLocks[this.dbname];
      if (!txLock) {
        log('cannot start next transaction: database connection is lost');
      } else if (txLock.queue.length > 0 && !txLock.inProgress) {
        txLock.inProgress = true;
        txLock.queue.shift().start();
      }
    });
  };

  abortAllPendingTransactions = () => {
    const txLock = txLocks[this.dbname];
    if (!!txLock && txLock.queue.length > 0) {
      const ref = txLock.queue;
      for (let j = 0, len1 = ref.length; j < len1; j++) {
        const tx = ref[j];
        tx.abortFromQ(newSQLError('Invalid database handle'));
      }
      txLock.queue = [];
      txLock.inProgress = false;
    }
  };

  sqlBatch = (sqlStatements, success, error) => {
    if (!sqlStatements || sqlStatements.constructor !== Array) {
      throw newSQLError('sqlBatch expects an array');
    }
    const batchList = [];
    for (let j = 0, len1 = sqlStatements.length; j < len1; j++) {
      const st = sqlStatements[j];
      if (st.constructor === Array) {
        if (st.length === 0) {
          throw newSQLError('sqlBatch array element of zero (0) length');
        }
        batchList.push({
          sql: st[0],
          params: st.length === 0 ? [] : st[1],
        });
      } else {
        batchList.push({
          sql: st,
          params: [],
        });
      }
    }
    const myfn = (tx) => {
      const results = [];
      for (let k = 0, len2 = batchList.length; k < len2; k++) {
        const elem = batchList[k];
        results.push(tx.addStatement(elem.sql, elem.params, null, null));
      }
      return results;
    };
    let sqlBatchSuccess = () => {
      if (success) return success();
    };
    let myerror = (e) => {
      if (error) {
        return error(e);
      } else {
        log('Error handler not provided: ', e);
      }
    };

    this.addTransaction(
      new SQLitePluginTransaction(
        this,
        myfn,
        myerror,
        sqlBatchSuccess,
        true,
        false
      )
    );
  };

  open = (success, error) => {
    if (
      this.dbname in this.openDBs &&
      this.openDBs[this.dbname] === DB_STATE_OPEN
    ) {
      log('database already open: ' + this.dbname);
      nextTick(() => success(this));
    } else {
      log('OPEN database: ' + this.dbname);
      const opensuccesscb = () => {
        if (!this.openDBs[this.dbname]) {
          log('database was closed during open operation');
        }
        if (this.dbname in this.openDBs) {
          this.openDBs[this.dbname] = DB_STATE_OPEN;
        }
        if (success) {
          success(this);
        }
        const txLock = txLocks[this.dbname];
        if (!!txLock && txLock.queue.length > 0 && !txLock.inProgress) {
          this.startNextTransaction();
        }
      };
      const openerrorcb = () => {
        log(
          'OPEN database: ' +
            this.dbname +
            ' failed, aborting any pending transactions'
        );
        if (error) {
          error(newSQLError('Could not open database'));
        }
        delete this.openDBs[this.dbname];
        this.abortAllPendingTransactions();
      };
      this.openDBs[this.dbname] = DB_STATE_INIT;
      exec('open', this.openargs, opensuccesscb, openerrorcb);
    }
  };

  close = (success, error) => {
    if (this.dbname in this.openDBs) {
      if (txLocks[this.dbname] && txLocks[this.dbname].inProgress) {
        log('cannot close: transaction is in progress');
        error(
          newSQLError(
            'database cannot be closed while a transaction is in progress'
          )
        );
        return;
      }
      log('CLOSE database: ' + this.dbname);
      delete this.openDBs[this.dbname];
      if (txLocks[this.dbname]) {
        log(
          'closing db with transaction queue length: ' +
            txLocks[this.dbname].queue.length
        );
      } else {
        log('closing db with no transaction lock state');
      }
      let closeSuccess = (t, r) => {
        if (success) return success(r);
      };
      let myerror = (t, e) => {
        if (error) {
          return error(e);
        } else {
          log('Error handler not provided: ', e);
        }
      };
      exec('close', { path: this.dbname }, closeSuccess, myerror);
    } else {
      const err = 'cannot close: database is not open';
      log(err);
      if (error) {
        nextTick(() => error(err));
      }
    }
  };

  executeSql = (statement, params) => {
    return new Promise((resolve, reject) => {
      const executeSqlSuccess = (t, r) => {
        resolve(r);
      };
      const myerror = (t, e) => reject(new Error(e.message));
      const myfn = (tx) => {
        tx.addStatement(statement, params, executeSqlSuccess, myerror);
      };
      this.addTransaction(
        new SQLitePluginTransaction(this, myfn, null, null, false, false)
      );
    });
  };
}
