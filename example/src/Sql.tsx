import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { database } from './Database';

const App = () => {
  useEffect(() => {
    (async () => {
      try {
        const rows = [
          { name: 'Jobs & Vacancies' },
          { name: 'CVs' },
          { name: 'CVs' },
          { name: 'One' },
          { name: 'One' },
        ];

        const k = await database();
        await k
          .batchInsert('categories')
          .chunkSize(1)
          .items(rows)
          .onConflict(['name'])
          .ignore();
        console.log(await k.table('categories').select());
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  return <SafeAreaView />;
};

export const Sql = App;
