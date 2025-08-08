import 'server-only';

import { SessionRecord, isValidObjectId } from '@/types';
import { getSessionsCollection } from '@/lib/mongodb';

async function getSessionFromDb(id: string): Promise<SessionRecord | null> {
  const col = await getSessionsCollection();
  if (isValidObjectId(id)) {
    const doc = await col.findOne({ _id: id } as any);
    return (doc as any) || null;
  }
  // 當作 session_id 來查詢，取最新一筆
  const doc = await col.find({ session_id: id } as any).sort({ generated_at: -1 }).limit(1).next();
  return (doc as any) || null;
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromDb(id);

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Session 不存在</h1>
        <p className="text-gray-600">查詢鍵：{id}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">互動 Session</h1>
        <p className="text-sm text-gray-600">活動 {session.activity_id} · 使用者 {session.user_id} · Session {session.session_id}</p>
        {session.user_name && (
          <p className="text-sm text-gray-800">使用者名稱：{session.user_name}</p>
        )}
        <p className="text-xs text-gray-500">產生於 {new Date(session.generated_at).toLocaleString()}</p>
      </div>

      {session.summary && (
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">摘要</h2>
          <p className="whitespace-pre-wrap text-gray-800">{session.summary}</p>
        </div>
      )}

      <div className="bg-white border rounded">
        <div className="border-b px-4 py-2 font-semibold" style={{ color: '#333' }}>單元結果</div>
        <div className="divide-y">
          {session.unit_results.map((u) => (
            <div key={u.unit_id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium" style={{ color: '#333' }}>Unit {u.unit_id}</div>
                <span className={`text-xs px-2 py-1 rounded ${u.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {u.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">回合數：{u.turn_count}</div>
              {u.important_keywords?.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">關鍵詞：</span>
                  <span>{u.important_keywords.join('、')}</span>
                </div>
              )}
              {u.standard_pass_rules?.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600" style={{ color: '#333' }}>通過條件：</span>
                  <span style={{ color: '#333' }}>{u.standard_pass_rules.join('；')}</span>
                </div>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-700">對話紀錄</summary>
                <div className="mt-2 space-y-2">
                  {u.conversation_logs.map((c, idx) => (
                    <div key={idx} className="text-gray-800">
                      <span className="font-mono text-xs text-gray-500 mr-2">[{new Date(c.timestamp).toLocaleTimeString()}]</span>
                      <span className="font-semibold mr-2">{c.role}:</span>
                      <span className="whitespace-pre-wrap">{c.content}</span>
                      {c.system_prompt && (
                        <div className="mt-1 text-xs text-gray-500">system: {c.system_prompt}</div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 