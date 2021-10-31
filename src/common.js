import { NativeModules } from 'react-native';

export const READ_ONLY_REGEX =
  /^(\s|;)*(?:alter|create|delete|drop|insert|reindex|replace|update)/i;
export const DB_STATE_INIT = 'INIT';
export const DB_STATE_OPEN = 'OPEN';
export const newSQLError = (error, code) => {
  let sqlError;
  sqlError = error;
  if (!code) {
    code = 0;
  }
  if (!sqlError) {
    sqlError = new Error('a plugin had an error but provided no response');
    sqlError.code = code;
  }
  if (typeof sqlError === 'string') {
    sqlError = new Error(error);
    sqlError.code = code;
  }
  if (!sqlError.code && sqlError.message) {
    sqlError.code = code;
  }
  if (!sqlError.code && !sqlError.message) {
    sqlError = new Error(
      'an unknown error was returned: ' + JSON.stringify(sqlError)
    );
    sqlError.code = code;
  }
  return sqlError;
};

export const nextTick = function (fun) {
  setTimeout(fun, 0);
};

export const txLocks = {};

export const dbLocations = {
  default: 'nosync',
  Documents: 'docs',
  Library: 'libs',
  Shared: 'shared',
};

let isDebug = false;

export const setDebug = (debug) => {
  isDebug = debug;
  log('Setting debug to: ', debug);
};

export const log = function (...messages) {
  if (!isDebug) return;
  console.log(...messages);
};

export const logWarn = function (...messages) {
  if (!isDebug) return;
  console.warn(...messages);
};

export const logError = function (...messages) {
  if (!isDebug) return;
  console.error(...messages);
};

export const exec = (method, options, success, error) => {
  log(`[start][SQLite.${method}](${JSON.stringify(options)})`);
  global[method](options, success, error);
};
