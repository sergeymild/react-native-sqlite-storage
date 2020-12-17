import {SQLitePlugin} from './lib/SQLitePlugin'
import {SQLitePluginTransaction} from './lib/SQLitePluginTransaction'
import {SQLiteFactory} from './lib/SQLiteFactory'
import {log, setDebug} from "./lib/common";

// const config = [
//   [false, "SQLitePlugin", "transaction", false, true, true],
//   [false, "SQLitePlugin", "readTransaction", false, true, true],
//   [false, "SQLitePlugin", "close", false, false, true],
//   [false, "SQLitePlugin", "executeSql", true, false, true],
//   [false, "SQLitePlugin", "sqlBatch", false, false, true],
//   [false, "SQLitePlugin", "attach", true, false, true],
//   [false, "SQLitePlugin", "detach", false, false, true],
//   [false, "SQLitePluginTransaction", "executeSql", true, false, false],
//   [false, "SQLiteFactory", "deleteDatabase", false, false, true],
//   [true, "SQLiteFactory", "openDatabase", false, false, true],
//   [false, "SQLiteFactory", "echoTest", false, false, true]
// ];

// const originalFns = {};
// let isPromisesEnabled = false

// function enablePromiseRuntime(enable: boolean) {
//   if (isPromisesEnabled) return
//   if (enable) createPromiseRuntime()
//   else createCallbackRuntime()
// }
//
// config.forEach(entry => {
//   let [,prototype,fn]= entry;
//   // @ts-ignore
//   originalFns[`${prototype}.${fn}`] = plugin[prototype].prototype[fn];
// });
//
// function createCallbackRuntime() {
//   config.forEach(entry => {
//     let [,prototype,fn,,,] = entry;
//     // @ts-ignore
//     plugin[prototype].prototype[fn] = originalFns[`${prototype}.${fn}`];
//   });
//   log("Callback based runtime ready");
// }
//
// function createPromiseRuntime() {
//   config.forEach(entry => {
//     let [returnValueExpected, prototype, fn, argsNeedPadding, reverseCallbacks, rejectOnError] = entry;
//     // @ts-ignore
//     let originalFn = plugin[prototype].prototype[fn];
//     // @ts-ignore
//     plugin[prototype].prototype[fn] = function (...args: any) {
//       if (argsNeedPadding && args.length == 1) {
//         args.push([]);
//       }
//       return new Promise((resolve, reject) => {
//         let success = function (...args: any) {
//           if (!returnValueExpected) return resolve(args);
//         }
//         let error = (err: Error) => {
//           log('error: ', fn, ...args, arguments);
//           if (rejectOnError) reject(err);
//           return false;
//         };
//         const retValue = originalFn.call(this, ...args, reverseCallbacks ? error : success, reverseCallbacks ? success : error);
//         if (returnValueExpected) return resolve(retValue);
//       });
//     }
//   });
//   log("Promise based runtime ready");
//   isPromisesEnabled = true
// }
//
// export const enableDatabasePromises = enablePromiseRuntime;

export const setSQLiteDebug = setDebug
export default new SQLiteFactory();
