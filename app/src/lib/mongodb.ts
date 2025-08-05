import { MongoClient, Db, Collection } from 'mongodb';
import { AgentProfile } from '@/types';

if (!process.env.MONGODB_URI) {
  throw new Error('請在環境變數中設置 MONGODB_URI');
}

if (!process.env.MONGODB_DB_NAME) {
  throw new Error('請在環境變數中設置 MONGODB_DB_NAME');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // 在開發環境中，使用全域變數避免熱重載時重複連接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 在生產環境中，最好不要使用全域變數
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// 導出一個模組範圍的 Promise，該 Promise 將解析為連接的 MongoDB 客戶端
export default clientPromise;

// 獲取資料庫實例
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

// 獲取 agents 集合
export async function getAgentsCollection(): Promise<Collection<AgentProfile>> {
  const db = await getDatabase();
  return db.collection<AgentProfile>('agents');
}

// 測試資料庫連接
export async function testConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    // 發送 ping 以確認成功連接
    await client.db("admin").command({ ping: 1 });
    console.log("成功連接到 MongoDB!");
    return true;
  } catch (error) {
    console.error("連接到 MongoDB 失敗:", error);
    return false;
  }
}
