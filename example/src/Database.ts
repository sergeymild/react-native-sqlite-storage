// import factory, { setSQLiteDebug } from "react-native-sqlite-storage";
// setSQLiteDebug(false);
//setSQLiteDebug(true)




import { SQLite } from 'react-native-sqlite-storage';

let db: SQLite = new SQLite({name: 'database.sqlite'})

const checkDatabase = async (newVersion: number) => {
  const response = await db.executeSql<{user_version: number}>('PRAGMA user_version;')
  console.log('[Database.checkDatabase]', response)
  console.log('[Database.closeDb]', await db.close())
  await db.executeSql('PRAGMA foreign_keys = ON;')
  let shouldCreateTables = false
  if (response.type === 'success') {
    shouldCreateTables = response.rows[0].user_version === 0;
    if (response.rows[0].user_version !== newVersion) {
      await db.executeSql(`PRAGMA user_version = ${newVersion};`)
    }
  }
  return shouldCreateTables;
};

// Create a table
const createTables = async () => {
  const response = await db.executeSql(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      lastName TEXT NOT NULL
    );
  `)
  if (response.type === 'error') {
    console.log('[Database.error]', response)
  } else {
    console.log('[Database.success]', response)
  }
};

export const database = async () => {
  await checkDatabase(1);
  if (true) await createTables();
  return db;
};
