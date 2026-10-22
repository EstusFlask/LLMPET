'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const TRIGGERS = ['scheduled', 'completed', 'ended', 'transient_error', 'failed', 'interrupted'];
const ACTIONS = ['continue', 'new_task', 'shutdown'];
const TERMINAL = new Set(['completed', 'quota_exhausted', 'transient_error', 'failed', 'interrupted']);
const PENDING = new Set(['scheduled', 'waiting_idle']);
const text = (v, max = 256) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const uuid = () => crypto.randomUUID();
const DEFAULT_PROMPT = '继续原任务。先核对已完成的工作和当前状态，只继续尚未完成的部分；不要重复已经完成的外部操作。';
const AGENTS = ['codex', 'claude', 'dsh'];
const sessionKey = (agent, id) => `${agent || 'codex'}:${id}`;

function normalizeRule(input) {
  if (!input || !TRIGGERS.includes(input.trigger) || !ACTIONS.includes(input.action)) throw new Error('Invalid trigger or action');
  const sessionId = text(input.sessionId);
  const agent = input.agent || 'codex';
  if (!AGENTS.includes(agent)) throw new Error('Invalid agent');
  const validId = agent === 'dsh' ? /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/.test(sessionId) : /^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(sessionId);
  if (!validId) throw new Error('请选择或填写有效的会话 ID / Select a valid session');
  const number = (v, fallback, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback));
  const prompt = input.action === 'shutdown' ? '' : text(input.prompt, 12000) || DEFAULT_PROMPT;
  if (input.action === 'new_task' && !text(input.prompt)) throw new Error('新任务需要填写任务内容 / New task requires a prompt');
  const scheduledAt = input.trigger === 'scheduled' ? Number(input.scheduledAt) || 0 : 0;
  if (input.trigger === 'scheduled' && input.enabled === true && (!Number.isFinite(scheduledAt) || scheduledAt <= 0)) throw new Error('请设置执行时间 / Set an execution time');
  return { id: text(input.id, 80) || uuid(), name: text(input.name, 100) || `${input.trigger} → ${input.action}`,
    enabled: input.enabled === true, agent, sessionId, trigger: input.trigger, action: input.action,
    sessionTitle: text(input.sessionTitle, 256), sessionCwd: text(input.sessionCwd, 2048),
    sessionProvider: text(input.sessionProvider, 100), sessionModel: text(input.sessionModel, 100),
    scheduledAt, needsSchedule: input.needsSchedule === true && !scheduledAt,
    prompt, cwd: input.action === 'new_task' ? text(input.cwd, 2048) : '',
    delaySeconds: number(input.delaySeconds, 15, input.action === 'shutdown' ? 60 : 0, 86400),
    maxRuns: input.trigger === 'scheduled' ? 1 : number(input.maxRuns, input.action === 'continue' ? 3 : 1, 1, 100),
    onlyWhenIdle: input.onlyWhenIdle !== false };
}

function powerOff(platform = process.platform, run = execFile) {
  const [file, args] = platform === 'win32' ? ['shutdown.exe', ['/s', '/t', '0']]
    : platform === 'darwin' ? ['osascript', ['-e', 'tell application "System Events" to shut down']]
    : ['systemctl', ['poweroff']];
  return new Promise(resolve => run(file, args, { windowsHide: true, timeout: 15000 }, err => resolve({ ok: !err, message: err ? String(err.message).slice(0, 500) : '' })));
}

function createCodexAutomation(deps = {}) {
  const statePath = deps.statePath || path.join(os.homedir(), '.octopus', 'codex-automation.json');
  const now = deps.now || Date.now;
  const onChange = deps.onChange || (() => {});
  let state = { rules: [], jobs: [], history: [], seen: [], counts: {}, quotas: {} };
  let loadError = '';
  try {
    const saved = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (!saved || saved.version !== 1 || !Array.isArray(saved.rules) || !Array.isArray(saved.jobs)
        || !Array.isArray(saved.history) || !Array.isArray(saved.seen)
        || !saved.counts || typeof saved.counts !== 'object' || !saved.quotas || typeof saved.quotas !== 'object'
        || !saved.jobs.every(j => j && typeof j === 'object' && [...ACTIONS, 'wait_quota'].includes(j.action))) throw new Error('Invalid automation state');
    state = { ...state, ...saved, rules: saved.rules.map(r => normalizeRule(
      ['quota_exhausted', 'quota_restored'].includes(r.trigger) || r.action === 'wait_quota'
        ? { ...r, trigger: 'scheduled', action: r.action === 'wait_quota' ? 'continue' : r.action, scheduledAt: 0, enabled: false, needsSchedule: true } : r)) };
    for (const job of state.jobs) {
      job.agent = job.agent || 'codex';
      // Never replay a power action or a possibly-submitted task after restart.
      const futureTimer = job.trigger === 'scheduled' && job.status === 'scheduled' && job.dueAt > now();
      if (!futureTimer && (PENDING.has(job.status) || job.status === 'waiting_quota' || job.status === 'running')) {
        job.status = 'cancelled'; job.message = '应用已重启，取消未确认的动作 / Restarted; action cancelled';
      }
      if (job.action === 'wait_quota') job.action = 'continue';
    }
  } catch (err) { if (err.code !== 'ENOENT') loadError = '自动化记录无法读取，执行已暂停 / Automation state unreadable'; }
  const sessions = new Map(), running = new Map();
  let timer = null, ticking = false, stopped = false;

  function log(kind, message, fields = {}) {
    state.history.unshift({ id: uuid(), at: now(), kind, message: text(message, 1600), ...fields });
    state.history = state.history.slice(0, 200);
  }
  function commit() {
    if (loadError) throw new Error(loadError);
    // Persistence happens BEFORE side effects, so a crash cannot replay a job.
    try {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      const tmp = `${statePath}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ ...state, version: 1 }), { mode: 0o600 });
      fs.renameSync(tmp, statePath);
    } catch (err) { loadError = '无法保存自动化记录，执行已暂停 / Cannot persist automation state'; onChange(); throw err; }
    onChange();
  }
  function snapshot() {
    return JSON.parse(JSON.stringify({ ...state, sessions: [...sessions.values()], error: loadError, now: now() }));
  }
  function saveRule(input) {
    if (loadError) throw new Error(loadError);
    const rule = normalizeRule(input);
    if (rule.trigger === 'scheduled' && rule.enabled && rule.scheduledAt < now() + (rule.action === 'shutdown' ? 60000 : 1)) throw new Error(rule.action === 'shutdown'
      ? '关机时间需在至少 60 秒后 / Schedule shutdown at least 60 seconds ahead'
      : '请选择未来的执行时间 / Choose a future execution time');
    if (!state.rules.some(r => r.id === rule.id) && state.rules.length >= 100) throw new Error('最多 100 条规则 / Maximum 100 rules');
    // An edit invalidates pending actions created from the old rule.
    for (const job of state.jobs) if (job.ruleId === rule.id && PENDING.has(job.status)) job.status = 'cancelled';
    // A newly chosen time or conversation is a new one-shot schedule.
    if (rule.trigger === 'scheduled' && rule.enabled) state.counts[rule.id] = 0;
    state.rules = [...state.rules.filter(r => r.id !== rule.id), rule];
    if (rule.enabled && rule.trigger === 'scheduled') scheduleTimer(rule);
    log('rule_saved', rule.name, { ruleId: rule.id }); commit(); return rule;
  }
  function removeRule(id) {
    state.rules = state.rules.filter(r => r.id !== id);
    for (const job of state.jobs) if (job.ruleId === id && PENDING.has(job.status)) job.status = 'cancelled';
    log('rule_removed', '', { ruleId: id }); commit();
  }
  function cancelJob(id) {
    const job = state.jobs.find(j => j.id === id);
    if (!job || !PENDING.has(job.status)) return false;
    job.status = 'cancelled'; log('cancelled', '', { jobId: id }); commit(); return true;
  }
  function resetCount(id) {
    if (state.jobs.some(j => j.ruleId === id && (PENDING.has(j.status) || j.status === 'running'))) throw new Error('请先等待或取消待执行动作 / Finish or cancel pending actions first');
    state.counts[id] = 0; commit();
  }
  function scheduleTimer(rule) {
    const session = sessions.get(sessionKey(rule.agent, rule.sessionId)) || {};
    schedule({ ...session, agent: rule.agent, sessionId: rule.sessionId, kind: 'scheduled',
      cwd: session.cwd || rule.sessionCwd, provider: session.provider || rule.sessionProvider,
      model: session.model || rule.sessionModel, timerRuleId: rule.id });
  }
  function schedule(event) {
    for (const rule of state.rules) {
      const matches = rule.trigger === 'ended' ? TERMINAL.has(event.kind) : rule.trigger === event.kind;
      if (!rule.enabled || rule.agent !== (event.agent || 'codex') || rule.sessionId !== event.sessionId || !matches) continue;
      if (rule.trigger === 'scheduled' && event.timerRuleId !== rule.id) continue;
      if (deps.isAgentEnabled && !deps.isAgentEnabled(rule.agent)) continue;
      const count = Number(state.counts[rule.id]) || 0;
      if (count >= rule.maxRuns) continue;
      if (state.jobs.some(j => j.ruleId === rule.id && (PENDING.has(j.status) || j.status === 'running'))) continue;
      const job = { id: uuid(), agent: rule.agent, ruleId: rule.id, ruleName: rule.name, sessionId: event.sessionId,
        trigger: event.kind, action: rule.action, prompt: rule.prompt,
        cwd: rule.cwd || event.cwd || rule.sessionCwd || '', provider: event.provider || rule.sessionProvider || '', model: event.model || rule.sessionModel || '',
        status: 'scheduled', createdAt: now(),
        dueAt: rule.trigger === 'scheduled' ? rule.scheduledAt : now() + rule.delaySeconds * 1000 * (rule.action === 'continue' ? Math.min(16, 2 ** count) : 1),
        delaySeconds: rule.delaySeconds, onlyWhenIdle: rule.onlyWhenIdle };
      state.jobs.unshift(job); state.counts[rule.id] = count + 1;
      log(job.status, '', { jobId: job.id, ruleId: rule.id, sessionId: job.sessionId });
    }
    state.jobs = state.jobs.filter((j, i) => i < 200 || PENDING.has(j.status) || j.status === 'running');
  }
  function observe(event) {
    if (!event || !event.sessionId) return;
    event = { ...event, agent: event.agent || 'codex' };
    const identity = sessionKey(event.agent, event.sessionId);
    const prev = sessions.get(identity) || {};
    if (prev.at && event.at && event.at < prev.at) return;
    const next = { ...prev, ...event };
    sessions.set(identity, next);
    if (sessions.size > 500) { const oldest = [...sessions.values()].sort((a, b) => a.at - b.at)[0]; if (oldest) sessions.delete(sessionKey(oldest.agent, oldest.sessionId)); }
    if (event.seed || !TERMINAL.has(event.kind)) {
      // User activity supersedes an event-based retry; explicit timers wait for idle.
      let changed = false;
      if (!event.seed && ['running', 'waiting_input'].includes(event.kind)) {
        for (const job of state.jobs) if (sessionKey(job.agent, job.sessionId) === identity && PENDING.has(job.status) && !running.has(identity)) {
          if (job.trigger === 'scheduled') continue;
          job.status = 'cancelled'; log('superseded', '', { jobId: job.id }); changed = true;
        }
      }
      if (changed) commit(); else onChange(); return;
    }
    const managed = running.get(identity);
    if (managed) { managed.observedEvent = next; return; }
    const legacyKey = `${event.sessionId}:${event.turnId || event.at}`;
    const key = `${event.agent}:${legacyKey}`;
    if (state.seen.includes(key) || event.agent === 'codex' && state.seen.includes(legacyKey) || loadError || stopped) return;
    state.seen.push(key); state.seen = state.seen.slice(-2000);
    schedule(next); commit();
  }
  async function execute(job) {
    if (job.action === 'shutdown') {
      job.status = 'running'; commit();
      let result;
      try { result = await (deps.powerOff || powerOff)(); }
      catch (err) { result = { ok: false, message: text(err.message, 500) }; }
      job.status = result.ok ? 'completed' : 'failed'; job.message = result.message || '';
      log(job.status, job.message, { jobId: job.id }); commit(); return;
    }
    if (!deps.run) { job.status = 'failed'; job.message = 'Executor unavailable'; commit(); return; }
    job.status = 'running'; job.startedAt = now(); running.set(sessionKey(job.agent, job.sessionId), job); commit();
    let result;
    try {
      result = await deps.run(job, id => {
        if (job.action === 'new_task' && id !== job.sessionId) running.delete(sessionKey(job.agent, job.sessionId));
        running.set(sessionKey(job.agent, id), job); job.targetSessionId = id;
      });
    } catch (err) { result = { ok: false, kind: 'failed', message: String(err.message).slice(0, 500) }; }
    if (deps.flushStatus) deps.flushStatus();
    for (const [id, value] of running) if (value === job) running.delete(id);
    job.status = result.ok ? 'completed' : 'failed'; job.message = result.message || '';
    log(job.status, job.message, { jobId: job.id, sessionId: result.sessionId || job.sessionId });
    commit();
    if (stopped) return;
    const observed = job.observedEvent || {};
    observe({ ...observed, agent: job.agent, sessionId: result.sessionId || job.sessionId,
      cwd: job.cwd, provider: job.provider, model: job.model,
      turnId: observed.turnId || job.id, kind: result.kind || 'failed', at: now(),
      source: 'executor', message: result.message || '' });
  }
  async function tick() {
    if (ticking || stopped || loadError) return;
    ticking = true;
    try {
      for (const rule of state.rules) if (rule.enabled && rule.trigger === 'scheduled' && rule.scheduledAt > now()) {
        const count = state.jobs.length; scheduleTimer(rule); if (state.jobs.length !== count) commit();
      }
      for (const job of state.jobs) {
        if (!PENDING.has(job.status)) continue;
        if (deps.isAgentEnabled && !deps.isAgentEnabled(job.agent)) continue;
        const rule = state.rules.find(r => r.id === job.ruleId);
        if (!rule || !rule.enabled) { job.status = 'cancelled'; commit(); continue; }
        if (now() - job.dueAt > 7 * 86400000) { job.status = 'cancelled'; job.message = '动作已过期 / Action expired'; commit(); continue; }
        if (job.dueAt > now()) continue;
        if (deps.flushStatus) deps.flushStatus();
        if (!PENDING.has(job.status)) continue;
        const session = sessions.get(sessionKey(job.agent, job.sessionId));
        const sessionBusy = session && ['running', 'waiting_input', 'unknown', 'error_observed'].includes(session.kind);
        const anyBusy = [...sessions.values()].some(s => ['running', 'waiting_input', 'unknown', 'error_observed'].includes(s.kind));
        const busy = job.action === 'shutdown'
          ? job.onlyWhenIdle && (anyBusy || running.size > 0 || deps.isBusy && deps.isBusy())
          : running.has(sessionKey(job.agent, job.sessionId)) || sessionBusy;
        if (busy) { if (job.status !== 'waiting_idle') { job.status = 'waiting_idle'; commit(); } continue; }
        // A deferred shutdown gets a fresh cancellation window after work ends.
        if (job.status === 'waiting_idle' && job.action === 'shutdown') {
          job.status = 'scheduled'; job.dueAt = now() + Math.max(60, job.delaySeconds) * 1000; commit(); continue;
        }
        // Do not block the scheduler/cancel UI while a CLI turn runs.
        execute(job).catch(err => { loadError = `执行记录失败 / Execution journal failed: ${text(err.message, 200)}`; onChange(); });
      }
    } finally { ticking = false; }
  }
  return { snapshot, saveRule, removeRule, cancelJob, resetCount, observe, tick,
    start() { stopped = false; if (!timer) { timer = setInterval(() => tick().catch(() => {}), 1000); timer.unref?.(); } },
    stop() { stopped = true; clearInterval(timer); timer = null; } };
}

module.exports = { createCodexAutomation, createAgentAutomation: createCodexAutomation, normalizeRule, powerOff, TRIGGERS, ACTIONS, AGENTS, DEFAULT_PROMPT };
