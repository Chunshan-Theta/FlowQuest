import { MongoClient, Db, Collection } from 'mongodb';
import { AgentProfile, Unit, CoursePackage, Activity, SessionRecord } from '@/types';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error('請在環境變數中設置 MONGODB_URI');
  }

  const uri = process.env.MONGODB_URI;

  if (clientPromise) {
    return clientPromise;
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

  return clientPromise;
}

// 導出一個模組範圍的 Promise，該 Promise 將解析為連接的 MongoDB 客戶端
export default getMongoClient;

// 獲取資料庫實例
export async function getDatabase(): Promise<Db> {
  if (!process.env.MONGODB_DB_NAME) {
    throw new Error('請在環境變數中設置 MONGODB_DB_NAME');
  }
  
  const clientPromise = getMongoClient();
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME);
}

// 獲取 agents 集合
export async function getAgentsCollection(): Promise<Collection<AgentProfile>> {
  const db = await getDatabase();
  return db.collection<AgentProfile>('agents');
}

// 獲取 units 集合
export async function getUnitsCollection(): Promise<Collection<Unit>> {
  const db = await getDatabase();
  return db.collection<Unit>('units');
}

// 獲取 course_packages 集合
export async function getCoursePackagesCollection(): Promise<Collection<CoursePackage>> {
  const db = await getDatabase();
  return db.collection<CoursePackage>('course_packages');
}

// 獲取 activities 集合
export async function getActivitiesCollection(): Promise<Collection<Activity>> {
  const db = await getDatabase();
  return db.collection<Activity>('activities');
}

// 仍提供 reports 集合以相容舊程式碼（使用 any 型別）
export async function getReportsCollection(): Promise<Collection<any>> {
  const db = await getDatabase();
  return db.collection<any>('reports');
}

// 獲取 sessions 集合
export async function getSessionsCollection(): Promise<Collection<SessionRecord>> {
  const db = await getDatabase();
  return db.collection<SessionRecord>('sessions');
}

// 測試資料庫連接
export async function testConnection(): Promise<boolean> {
  try {
    const clientPromise = getMongoClient();
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
