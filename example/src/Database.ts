import { Knex, NativeClient } from 'react-native-knex';
// import factory, { setSQLiteDebug } from "react-native-sqlite-storage";
// setSQLiteDebug(false);
//setSQLiteDebug(true)
import { factory, setSQLiteDebug } from 'react-native-sqlite-storage';
setSQLiteDebug(true);
export const knex = new Knex(
  new NativeClient(
    {
      debug: true,
      connection: {
        filename: 'database.sqlite',
      },
    },
    factory
  )
);

const checkDatabase = async (newVersion: number) => {
  const response = await knex.raw('PRAGMA user_version;');
  console.log('--==', response);
  await knex.raw('PRAGMA foreign_keys = ON;');
  const shouldCreateTables = response[0].user_version === 0;
  if (response[0].user_version !== newVersion) {
    await knex.raw(`PRAGMA user_version = ${newVersion};`);
  }
  console.log('--==__');
  return shouldCreateTables;
};

// Create a table
const createTables = async () => {
  console.log('createTables');
  const has = await knex.schema.hasTable('categories');
  if (has) return;
  await knex.schema.createTable('categories', (table) => {
    table.increments('id');
    table.string('name').unique();
    table.string('lastName').index();
  });
  console.log('createTables finish');
};

export const database = async () => {
  await checkDatabase(1);
  if (true) await createTables();
  return knex;
};
