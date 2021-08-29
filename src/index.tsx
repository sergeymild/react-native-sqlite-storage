import { NativeModules } from 'react-native';

type SqliteStorageType = {
  multiply(a: number, b: number): Promise<number>;
};

const { SqliteStorage } = NativeModules;

export default SqliteStorage as SqliteStorageType;
