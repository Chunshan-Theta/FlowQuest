#!/usr/bin/env node

// Smoke test for server-side interactions (multi-turn)
// Requires the Next.js app to be running: npm run dev

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ROUNDS = Number(process.env.ROUNDS || 3);

function randomSessionId(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * alphabet.length);
    result += alphabet[idx];
  }
  return result;
}

async function fetchJSON(url, init) {
  const res = await fetch(url, init);
  const json = await res.json();
  return { ok: res.ok, json };
}

function summarizeSession(session) {
  const unitResults = session?.unit_results || [];
  const totalLogs = unitResults.reduce((acc, u) => acc + (u.conversation_logs?.length || 0), 0);
  const byUnit = unitResults.map((u) => ({
    unit_id: String(u.unit_id),
    turn_count: u.turn_count || 0,
    logs: (u.conversation_logs || []).length,
    status: u.status,
  }));
  return { unitCount: unitResults.length, totalLogs, byUnit };
}

function diffSummary(prev, curr) {
  if (!prev) return { totalLogsDelta: curr.totalLogs, byUnitDelta: curr.byUnit };
  const totalLogsDelta = curr.totalLogs - prev.totalLogs;
  const mapPrev = new Map(prev.byUnit.map((u) => [u.unit_id, u]));
  const byUnitDelta = curr.byUnit.map((u) => {
    const p = mapPrev.get(u.unit_id) || { turn_count: 0, logs: 0, status: 'failed' };
    return {
      unit_id: u.unit_id,
      turn_count_delta: u.turn_count - (p.turn_count || 0),
      logs_delta: u.logs - (p.logs || 0),
      status: u.status,
    };
  });
  return { totalLogsDelta, byUnitDelta };
}

function tailLogs(session, n = 2) {
  const unitResults = session?.unit_results || [];
  const all = [];
  for (const u of unitResults) {
    for (const log of (u.conversation_logs || [])) {
      all.push({ unit_id: String(u.unit_id), ...log });
    }
  }
  all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return all.slice(-n);
}

async function loadLatestSession(sessionId) {
  const { json } = await fetchJSON(`${BASE_URL}/api/sessions?session_id=${encodeURIComponent(sessionId)}`);
  const sessions = json?.data || [];
  return sessions[0];
}

async function main() {
  // 1) pick an activity
  const { json: actJson } = await fetchJSON(`${BASE_URL}/api/activities`);
  if (!actJson?.success || !Array.isArray(actJson.data) || actJson.data.length === 0) {
    console.error('No activities found. Please seed an activity first.');
    process.exit(1);
  }
  const activity = actJson.data[0];

  // Print activity details (+ agent + course with units)
  try {
    const [{ json: agentJson }, { json: cpJson }] = await Promise.all([
      fetchJSON(`${BASE_URL}/api/agents/${encodeURIComponent(activity.agent_profile_id)}`),
      fetchJSON(`${BASE_URL}/api/course-packages/${encodeURIComponent(activity.course_package_id)}?include_units=true`),
    ]);

    const agent = agentJson?.data || {};
    const course = cpJson?.data || {};
    const units = Array.isArray(course?.units) ? course.units : [];
    const unitTitles = units.map((u, i) => `${i + 1}. ${u.title}`).join(', ');

    console.log('[activity]', {
      id: activity._id,
      name: activity.name,
      status: activity.status,
      agent_id: activity.agent_profile_id,
      agent_name: agent?.name,
      course_id: activity.course_package_id,
      course_title: course?.title,
      units_count: units.length,
      units: unitTitles,
    });
  } catch (e) {
    console.warn('Failed to fetch activity details:', e?.message || e);
    console.log('[activity]', activity);
  }

  const sessionId = randomSessionId();
  const userId = 'smoke_user';
  const userName = 'smoke';

  // 2) initialize
  const tInitStart = Date.now();
  const { json: initJson } = await fetchJSON(`${BASE_URL}/api/interactions/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activity_id: activity._id, session_id: sessionId, user_id: userId, user_name: userName }),
  });
  const initElapsedMs = Date.now() - tInitStart;
  if (!initJson?.success) {
    console.error('Initialize failed:', initJson?.error || initJson);
    process.exit(1);
  }
  console.log('[initialize] session_id =', initJson.data?.session_id || sessionId, `(${initElapsedMs} ms)`);

  let prevSnapshot = summarizeSession(initJson.data || (await loadLatestSession(sessionId)) || {});
  console.log(`[initialize] units=${prevSnapshot.unitCount}, logs=${prevSnapshot.totalLogs}`);

  // 3) multi-round chat
  const canned = [
    '不好意思讓你久候了',
    '您好，請問需要什麼服務嗎',
    '很感謝你的等候',
    '請問有什麼可以幫忙的嗎',
  ];

  let totalChatMs = 0;
  for (let i = 0; i < ROUNDS; i++) {
    const message = canned[i % canned.length];
    const tChatStart = Date.now();
    const { json: chatJson } = await fetchJSON(`${BASE_URL}/api/interactions/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity_id: activity._id, session_id: sessionId, user_id: userId, user_name: userName, message }),
    });
    const chatElapsedMs = Date.now() - tChatStart;
    totalChatMs += chatElapsedMs;
    if (!chatJson?.success) {
      console.error(`Chat round ${i + 1} failed:`, chatJson?.error || chatJson);
      process.exit(1);
    }
    const assistant = (chatJson.data?.message || '').slice(0, 120).replace(/\n/g, ' ');
    console.log(`[round ${i + 1}] assistant =`, assistant, '...', `(${chatElapsedMs} ms)`);

    // load session and show delta
    const latest = await loadLatestSession(sessionId);
    const snap = summarizeSession(latest);
    const delta = diffSummary(prevSnapshot, snap);
    console.log(`[round ${i + 1}] delta: totalLogs +${delta.totalLogsDelta}`);
    for (const d of delta.byUnitDelta) {
      if (d.turn_count_delta !== 0 || d.logs_delta !== 0) {
        console.log(`  unit ${d.unit_id}: turn +${d.turn_count_delta}, logs +${d.logs_delta}, status=${d.status}`);
      }
    }
    const tails = tailLogs(latest, 2);
    for (const t of tails) {
      const preview = (t.content || '').slice(0, 100).replace(/\n/g, ' ');
      console.log(`  tail [${t.role}] u=${t.unit_id} at=${new Date(t.timestamp).toISOString()} :: ${preview} ...`);
    }

    prevSnapshot = snap;
  }

  const avgMs = ROUNDS > 0 ? Math.round(totalChatMs / ROUNDS) : 0;
  console.log(`[done] session_id=${sessionId} rounds=${ROUNDS} totalLogs=${prevSnapshot.totalLogs} avg_round_ms=${avgMs}`);
}

main().catch((e) => {
  console.error('Smoke test error:', e);
  process.exit(1);
}); 