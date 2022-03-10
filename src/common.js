import { NativeModules } from 'react-native';

export const exec = (method, options, success, error) => {
  console.log('SQLite.' + method + '(' + JSON.stringify(options) + ')');
  NativeModules.SQLite[method](options, success, error);
};
