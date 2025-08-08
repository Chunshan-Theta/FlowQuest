import 'server-only';

import { InteractionReport, isValidObjectId } from '@/types';
import { getReportsCollection } from '@/lib/mongodb';

async function getReportFromDb(id: string): Promise<InteractionReport | null> {
  const col = await getReportsCollection();
  if (isValidObjectId(id)) {
    const doc = await col.findOne({ _id: id });
    return (doc as any) || null;
  }
  // 當作 session_id 來查詢，取最新一筆
  const doc = await col.find({ session_id: id }).sort({ generated_at: -1 }).limit(1).next();
  return (doc as any) || null;
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportFromDb(id);

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">報告不存在</h1>
        <p className="text-gray-600">查詢鍵：{id}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">互動報告</h1>
        <p className="text-sm text-gray-600">活動 {report.activity_id} · 使用者 {report.user_id} · Session {report.session_id}</p>
        {report.user_name && (
          <p className="text-sm text-gray-800">使用者名稱：{report.user_name}</p>
        )}
        <p className="text-xs text-gray-500">產生於 {new Date(report.generated_at).toLocaleString()}</p>
      </div>

      {report.summary && (
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">摘要</h2>
          <p className="whitespace-pre-wrap text-gray-800">{report.summary}</p>
        </div>
      )}

      <div className="bg-white border rounded">
        <div className="border-b px-4 py-2 font-semibold">單元結果</div>
        <div className="divide-y">
          {report.unit_results.map((u) => (
            <div key={u.unit_id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Unit {u.unit_id}</div>
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
                  <span className="text-gray-600">通過條件：</span>
                  <span>{u.standard_pass_rules.join('；')}</span>
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