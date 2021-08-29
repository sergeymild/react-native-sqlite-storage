import { SQLiteFactory } from './SQLiteFactory';
import { setDebug } from './common';

export const setSQLiteDebug = setDebug;
export const factory = new SQLiteFactory();
