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
        console.log('- 1 db');
        await k.table('categories').insert(rows).onConflict('name').ignore();
        console.log('- 2 db');
        console.log(await k.table('categories').select());
        console.log('- 3 db');
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  return <SafeAreaView />;
};

export const Sql = App;
