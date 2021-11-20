import 'react-native-quick-sqlite';

class SQLiteKnex {
  constructor(private dbName: string) {}

  executeSql = (statement: string, params: any[]) => {
    return new Promise((resolve) => {
      const result = sqlite.executeSql(this.dbName, statement, params);
      resolve({
        insertId: result.insertId,
        rowsAffected: result.rowsAffected,
        rows: result.rows._array,
      });
    });
  };
}

export class SQLiteFactory {
  constructor() {}

  openDatabase = (params: { name: string }): SQLiteKnex => {
    try {
      sqlite.open(params.name);
      console.log('db opened');
      return new SQLiteKnex(params.name);
    } catch (e) {
      console.log('error open db', e);
      throw e;
    }
  };
}
