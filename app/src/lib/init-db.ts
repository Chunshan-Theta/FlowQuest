/**
 * 數據庫初始化腳本
 * 用於創建初始資料和索引
 */

import { getAgentsCollection, testConnection, getDatabase } from './mongodb';
import { EXAMPLES } from '../types';

export async function initializeDatabase() {
  try {
    console.log('開始初始化數據庫...');
    
    // 測試連接
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('無法連接到數據庫');
    }
    
    const agentsCollection = await getAgentsCollection();
    
    // 檢查是否已有數據
    const existingCount = await agentsCollection.countDocuments();
    
    if (existingCount === 0) {
      console.log('插入初始 Agent 數據...');
      
      // 插入範例 Agent
      const sampleAgent = {
        ...EXAMPLES.AGENT_PROFILE,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await agentsCollection.insertOne(sampleAgent);
      console.log('初始 Agent 數據插入成功');
    } else {
      console.log(`數據庫已存在 ${existingCount} 個 Agent，跳過初始化`);
    }
    
    // 創建索引
    await createIndexes();
    
    console.log('數據庫初始化完成');
    return true;
  } catch (error) {
    console.error('數據庫初始化失敗:', error);
    return false;
  }
}

async function createIndexes() {
  try {
    const agentsCollection = await getAgentsCollection();
    
    // 為 name 字段創建索引以優化搜索
    await agentsCollection.createIndex({ name: 1 });
    
    // 為 created_at 字段創建索引以優化排序
    await agentsCollection.createIndex({ created_at: -1 });
    
    // 記憶集合複合索引（如果存在）
    try {
      const db = await getDatabase();
      const memCol = db.collection('memories');
      await memCol.createIndex({
        agent_id: 1,
        created_by_user_id: 1,
        activity_id: 1,
        session_id: 1,
        created_at: 1,
      });
    } catch (e) {
      console.warn('建立 memories 索引時發生問題（可能集合尚未存在）');
    }
    
    console.log('數據庫索引創建成功');
  } catch (error) {
    console.error('創建索引失敗:', error);
  }
}
