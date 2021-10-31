import { dbLocations, exec, log, logError } from './common';
import { SQLitePlugin } from './SQLitePlugin';

export class SQLiteFactory {
  constructor() {}

  sqliteFeatures = () => {
    return { isSQLitePlugin: true };
  };

  openDatabase = ({
    name,
    readOnly = false,
    location = dbLocations.default,
    createFromLocation = null,
    onOpen = () => {},
    onError = () => {},
  }) => {
    const openargs = { name };
    console.log('_____', openargs);
    if (!readOnly && (!location || !dbLocations.hasOwnProperty(location))) {
      openargs.dblocation = dbLocations.default;
    } else {
      openargs.dblocation = dbLocations[openargs.location];
    }

    if (createFromLocation) {
      openargs.assetFilename = createFromLocation;
    }

    return new SQLitePlugin(openargs, onOpen, onError);
  };

  echoTest = () => {
    return new Promise((resolve, reject) => {
      let inputTestValue = 'test-string';
      let echoTestSuccess = (testValue) => {
        if (testValue === inputTestValue) {
          log('Success exec echo', testValue);
          return resolve();
        } else {
          const error = `Mismatch: got: ${testValue} , expected: ${inputTestValue}`;
          reject(error);
          return logError(error);
        }
      };
      let myerror = (e) => reject(e);

      exec(
        'echoStringValue',
        { value: inputTestValue },
        echoTestSuccess,
        myerror
      );
    });
  };
}
