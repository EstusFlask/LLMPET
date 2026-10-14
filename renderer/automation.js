'use strict';

(() => {
  const root = document.getElementById('automation-root');
  const api = window.pet;
  const words = {
    zh: {
      intro: '规则默认关闭，仅处理启用后新观察到的事件。“本轮完成”只表示一次回复结束。额度恢复需要新数据确认；预计刷新时间本身不会触发续跑。自动任务由本机 Codex CLI 执行。',
      editor: '配置规则', name: '规则名称', session: 'Codex 会话 ID（可从列表选择或粘贴）', trigger: '触发条件', action: '执行动作', prompt: '继续指令 / 新任务内容', cwd: '工作目录（留空使用来源会话目录）', bucket: '额度桶（留空跟随来源会话）', delay: '延迟秒数', max: '最多触发次数', enabled: '启用规则', idle: '仅在没有运行中或待回复会话时关机', save: '保存规则', clear: '新建规则', rules: '已保存规则', jobs: '执行与等待', quotas: '额度状态', refresh: '查询最新额度', history: '最近记录', empty: '暂无记录', edit: '编辑', remove: '删除', reset: '重置次数', enable: '启用', disable: '停用', cancel: '取消动作', used: '已用', resetAt: '预计刷新', runs: '已触发', remaining: '秒后执行', note: '次数在动作排队时累计，取消也计入上限；重置后可再次触发。关机至少保留 60 秒倒计时，可随时取消；取消或停用规则不会中断已经运行的任务。',
      defaultPrompt: '继续原任务。先核对已完成的工作和当前状态，只继续尚未完成的部分；不要重复已经完成的外部操作。',
      unverified: '尚未确认此额度属于该提供商，保持挂起；需要提供商自己的额度数据。',
      triggers: { completed: '本轮正常完成', quota_exhausted: '明确因额度耗尽停止', quota_restored: '确认相关额度恢复', transient_error: '网络 / 临时服务错误最终失败', failed: '其他明确失败', interrupted: '任务中断（包括主动停止）' },
      actions: { continue: '继续原会话 / 重试', wait_quota: '挂起，确认额度恢复后继续', new_task: '开始新任务', shutdown: '关机' },
      states: { scheduled: '等待执行', waiting_quota: '挂起，等待额度恢复', waiting_idle: '等待会话停止运行', running: '执行中', completed: '完成', failed: '失败', cancelled: '已取消', idle: '空闲', unknown: '状态未确认', waiting_input: '等待回复', error_observed: '观察到错误，尚未确认终止', quota_exhausted: '额度耗尽', transient_error: '临时错误终止', interrupted: '中断' },
      events: { rule_saved: '保存规则', rule_removed: '删除规则', superseded: '会话已有新活动，取消旧动作', quota_restored: '额度已恢复' },
    },
    en: {
      intro: 'Rules start disabled and react only to newly observed events. A completed turn means one response ended. Recovery requires fresh quota data; reaching the estimated reset time alone never resumes work. Automated tasks run through the local Codex CLI.',
      editor: 'Configure rule', name: 'Rule name', session: 'Codex session ID (select or paste)', trigger: 'Trigger', action: 'Action', prompt: 'Continuation instructions / new task', cwd: 'Working directory (blank uses source session)', bucket: 'Quota bucket (blank follows source session)', delay: 'Delay in seconds', max: 'Maximum triggers', enabled: 'Enable rule', idle: 'Wait until all sessions stop running or awaiting input before shutdown', save: 'Save rule', clear: 'New rule', rules: 'Saved rules', jobs: 'Executions and waiting', quotas: 'Quota status', refresh: 'Check latest quotas', history: 'Recent history', empty: 'No records', edit: 'Edit', remove: 'Delete', reset: 'Reset count', enable: 'Enable', disable: 'Disable', cancel: 'Cancel action', used: 'used', resetAt: 'Estimated reset', runs: 'Triggered', remaining: 'seconds until execution', note: 'Counts accumulate when actions are queued, including cancelled actions, until reset. Shutdown has a cancellable countdown of at least 60 seconds. Cancelling or disabling a rule does not interrupt tasks already running.',
      defaultPrompt: 'Continue the original task. Check completed work and current state first. Continue only unfinished work and do not repeat completed external actions.',
      unverified: 'Quota ownership is unconfirmed. Work stays suspended until provider-specific quota data is available.',
      triggers: { completed: 'Turn completed normally', quota_exhausted: 'Stopped because quota was exhausted', quota_restored: 'Relevant quota recovery confirmed', transient_error: 'Final network / temporary service failure', failed: 'Other confirmed failure', interrupted: 'Interrupted (including manual stop)' },
      actions: { continue: 'Continue original session / retry', wait_quota: 'Suspend, then continue after quota recovery', new_task: 'Start a new task', shutdown: 'Shut down computer' },
      states: { scheduled: 'Scheduled', waiting_quota: 'Suspended; waiting for quota', waiting_idle: 'Waiting for sessions to stop', running: 'Running', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled', idle: 'Idle', unknown: 'Unconfirmed', waiting_input: 'Awaiting input', error_observed: 'Error observed; termination unconfirmed', quota_exhausted: 'Quota exhausted', transient_error: 'Transient failure', interrupted: 'Interrupted' },
      events: { rule_saved: 'Rule saved', rule_removed: 'Rule removed', superseded: 'New session activity cancelled the old action', quota_restored: 'Quota recovered' },
    },
    ja: {
      intro: 'ルールは初期状態で無効です。有効化後の新しいイベントだけを処理します。ターン完了は一度の応答の終了を表します。利用枠の回復には新しいデータが必要で、予定時刻の経過だけでは再開しません。自動タスクはローカル Codex CLI で実行します。',
      editor: 'ルール設定', name: 'ルール名', session: 'Codex セッション ID（選択・貼り付け）', trigger: '条件', action: 'アクション', prompt: '続行の指示 / 新しいタスク', cwd: '作業ディレクトリ（空欄で元の場所）', bucket: '利用枠（空欄で元の枠）', delay: '待機秒数', max: 'トリガー回数の上限', enabled: 'ルールを有効にする', idle: 'すべてのセッションの実行・入力待ちが終了してから電源を切る', save: '保存', clear: '新規ルール', rules: '保存済みルール', jobs: '実行と待機', quotas: '利用枠の状態', refresh: '最新の利用枠を確認', history: '最近の履歴', empty: '記録はありません', edit: '編集', remove: '削除', reset: '回数をリセット', enable: '有効化', disable: '無効化', cancel: 'アクションを取消', used: '使用済み', resetAt: 'リセット予定', runs: 'トリガー回数', remaining: '秒後に実行', note: '回数は待機に入った時点で累積し、取消済みもリセットまで含みます。電源オフには取消可能な 60 秒以上のカウントダウンがあります。取消・無効化しても実行中のタスクは中断しません。',
      defaultPrompt: '元のタスクを続けてください。完了した作業と現在の状態を確認し、未完了の部分だけを進めてください。完了済みの外部操作を繰り返さないでください。',
      unverified: 'この提供元の利用枠か確認できないため保留を続けます。提供元の利用枠データが必要です。',
      triggers: { completed: 'ターンが正常終了', quota_exhausted: '利用枠の不足で停止', quota_restored: '対象の利用枠の回復を確認', transient_error: '通信・一時的なサービス障害で終了', failed: 'その他の確定した失敗', interrupted: '中断（手動停止を含む）' },
      actions: { continue: '元のセッションを続行・再試行', wait_quota: '保留し、利用枠の回復後に続行', new_task: '新しいタスクを開始', shutdown: '電源を切る' },
      states: { scheduled: '実行待ち', waiting_quota: '保留・利用枠の回復待ち', waiting_idle: 'セッションの終了待ち', running: '実行中', completed: '完了', failed: '失敗', cancelled: '取消済み', idle: '待機', unknown: '未確認', waiting_input: '入力待ち', error_observed: 'エラーを検知・終了は未確認', quota_exhausted: '利用枠不足', transient_error: '一時的な障害で終了', interrupted: '中断済み' },
      events: { rule_saved: 'ルール保存', rule_removed: 'ルール削除', superseded: '新しいセッション活動により取消', quota_restored: '利用枠が回復' },
    },
  };
  let locale = 'zh', state = { rules: [], jobs: [], history: [], quotas: {}, sessions: [], counts: {} }, editing = '', lastAction = 'continue';
  const c = () => words[locale] || words.zh;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const el = id => document.getElementById(`auto-${id}`);
  const date = at => at ? new Date(at).toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US') : '—';
  const options = entries => Object.entries(entries).map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join('');
  function shell() {
    const w = c();
    root.innerHTML = `<p class="automation-intro">${esc(w.intro)}</p><div id="auto-error" class="automation-error" role="status"></div><div class="automation-layout">
      <article class="panel-card"><h2>${esc(w.editor)}</h2><form id="auto-form" class="automation-form">
      <label>${esc(w.name)}<input id="auto-name" maxlength="100"></label>
      <label>${esc(w.session)}<input id="auto-session" list="auto-sessions" required autocomplete="off"><datalist id="auto-sessions"></datalist></label>
      <label>${esc(w.trigger)}<select id="auto-trigger">${options(w.triggers)}</select></label>
      <label>${esc(w.action)}<select id="auto-action">${options(w.actions)}</select></label>
      <label>${esc(w.prompt)}<textarea id="auto-prompt" maxlength="12000" placeholder="${esc(w.defaultPrompt)}"></textarea></label>
      <label>${esc(w.cwd)}<input id="auto-cwd" maxlength="2048"></label>
      <label>${esc(w.bucket)}<input id="auto-bucket" maxlength="100"></label>
      <div class="automation-pair"><label>${esc(w.delay)}<input id="auto-delay" type="number" min="0" max="86400" value="15" required></label><label>${esc(w.max)}<input id="auto-max" type="number" min="1" max="100" value="3" required></label></div>
      <label class="automation-check"><input id="auto-idle" type="checkbox" checked>${esc(w.idle)}</label>
      <label class="automation-check"><input id="auto-enabled" type="checkbox">${esc(w.enabled)}</label>
      <div class="automation-actions"><button class="soft-button" type="submit">${esc(w.save)}</button><button class="text-button" id="auto-clear" type="button">${esc(w.clear)}</button></div><small>${esc(w.note)}</small></form></article>
      <div class="automation-stack"><article class="panel-card"><h2>${esc(w.rules)}</h2><div id="auto-rules"></div></article><article class="panel-card"><h2>${esc(w.jobs)}</h2><div id="auto-jobs"></div></article><article class="panel-card"><div class="section-head"><h2>${esc(w.quotas)}</h2><button id="auto-refresh" class="soft-button">${esc(w.refresh)}</button></div><div id="auto-quotas"></div></article><article class="panel-card"><h2>${esc(w.history)}</h2><div id="auto-history" class="automation-history"></div></article></div></div>`;
    el('form').addEventListener('submit', save);
    el('clear').addEventListener('click', () => { editing = ''; el('form').reset(); actionChanged(); });
    el('action').addEventListener('change', actionChanged);
    el('trigger').addEventListener('change', actionChanged);
    el('refresh').addEventListener('click', async () => showResult(await api.refreshAutomationQuota()));
    render(); actionChanged();
  }
  function actionChanged() {
    const action = el('action').value;
    if (lastAction !== action && !editing) el('max').value = ['new_task', 'shutdown'].includes(action) ? '1' : '3';
    lastAction = action;
    el('delay').min = action === 'shutdown' ? '60' : '0';
    if (action === 'shutdown' && Number(el('delay').value) < 60) el('delay').value = '60';
    el('prompt').required = action === 'new_task';
    el('prompt').disabled = action === 'shutdown';
    el('idle').disabled = action !== 'shutdown';
    const wait = el('action').querySelector('[value="wait_quota"]');
    wait.disabled = !['quota_exhausted', 'quota_restored'].includes(el('trigger').value);
    if (wait.disabled && action === 'wait_quota') el('action').value = 'continue';
  }
  function showResult(result) { el('error').textContent = result && !result.ok ? result.message : ''; return result && result.ok; }
  async function save(event) {
    event.preventDefault();
    const rule = { id: editing || undefined, name: el('name').value, sessionId: el('session').value,
      trigger: el('trigger').value, action: el('action').value, prompt: el('prompt').value || (el('action').value === 'new_task' ? '' : c().defaultPrompt),
      cwd: el('cwd').value, limitId: el('bucket').value, delaySeconds: Number(el('delay').value), maxRuns: Number(el('max').value),
      enabled: el('enabled').checked, onlyWhenIdle: el('idle').checked };
    const result = await api.saveAutomationRule(rule);
    if (showResult(result)) { editing = result.value.id; await load(); }
  }
  function edit(rule) {
    editing = rule.id;
    for (const [id, key] of Object.entries({ name: 'name', session: 'sessionId', trigger: 'trigger', action: 'action', prompt: 'prompt', cwd: 'cwd', bucket: 'limitId', delay: 'delaySeconds', max: 'maxRuns' })) el(id).value = rule[key] || (key === 'delaySeconds' ? 0 : '');
    el('enabled').checked = rule.enabled; el('idle').checked = rule.onlyWhenIdle; actionChanged(); el('name').focus();
  }
  function button(action, id, label) { return `<button class="soft-button" data-auto="${action}" data-id="${esc(id)}">${esc(label)}</button>`; }
  function render() {
    if (!el('rules')) return;
    const w = c(), empty = `<p class="automation-intro">${esc(w.empty)}</p>`;
    el('sessions').innerHTML = state.sessions.map(s => `<option value="${esc(s.sessionId)}">${esc(s.title || s.cwd || s.sessionId)} · ${esc(w.states[s.kind] || s.kind)}</option>`).join('');
    el('rules').innerHTML = state.rules.map(r => `<div class="automation-item ${r.enabled ? '' : 'automation-muted'}"><strong>${esc(r.name)}</strong><p>${esc(w.triggers[r.trigger])} → ${esc(w.actions[r.action])}</p><small>${esc(r.sessionId)} · ${esc(w.runs)} ${state.counts[r.id] || 0}/${r.maxRuns}</small><div class="automation-actions">${button('edit', r.id, w.edit)}${button('toggle', r.id, r.enabled ? w.disable : w.enable)}${button('reset', r.id, w.reset)}${button('remove', r.id, w.remove)}</div></div>`).join('') || empty;
    el('jobs').innerHTML = state.jobs.slice(0, 25).map(j => {
      const countdown = j.status === 'scheduled' ? `<p class="automation-countdown">${Math.max(0, Math.ceil((j.dueAt - Date.now()) / 1000))} ${esc(w.remaining)}</p>` : '';
      return `<div class="automation-item"><strong>${esc(j.ruleName)} · ${esc(w.states[j.status] || j.status)}</strong><small>${esc(w.actions[j.action])} · ${esc(date(j.createdAt))}</small>${countdown}${j.message ? `<p>${esc(j.message)}</p>` : ''}${['scheduled', 'waiting_quota', 'waiting_idle'].includes(j.status) ? button('cancel', j.id, w.cancel) : ''}</div>`;
    }).join('') || empty;
    el('quotas').innerHTML = Object.values(state.quotas).map(q => `<div class="automation-item"><strong>${esc(q.provider)} · ${esc(q.limitId)}</strong>${[q.primary, q.secondary].filter(Boolean).map(v => `<small>${v.windowMinutes || '—'} min · ${esc(w.used)} ${v.usedPercent}% · ${esc(w.resetAt)} ${esc(date(v.resetsAt))}</small>`).join('')}<small>${esc(date(q.at))}</small>${q.provider !== 'openai' && !q.providerVerified ? `<small class="automation-countdown">${esc(w.unverified)}</small>` : ''}</div>`).join('') || empty;
    if (state.queryMessage) { const p = document.createElement('p'); p.textContent = state.queryMessage; p.className = 'automation-intro'; el('quotas').appendChild(p); }
    el('history').innerHTML = state.history.slice(0, 50).map(h => `<div class="automation-item"><small>${esc(date(h.at))}</small><p>${esc(w.events[h.kind] || w.states[h.kind] || h.kind)}${h.message ? ` · ${esc(h.message)}` : ''}</p></div>`).join('') || empty;
    if (state.error) el('error').textContent = state.error;
  }
  root.addEventListener('click', async event => {
    const target = event.target.closest('[data-auto]'); if (!target) return;
    const id = target.dataset.id, action = target.dataset.auto, rule = state.rules.find(r => r.id === id);
    if (action === 'edit' && rule) { edit(rule); return; }
    let result;
    if (action === 'toggle' && rule) result = await api.saveAutomationRule({ ...rule, enabled: !rule.enabled });
    else if (action === 'remove') result = await api.removeAutomationRule(id);
    else if (action === 'reset') result = await api.resetAutomationCount(id);
    else if (action === 'cancel') result = await api.cancelAutomationJob(id);
    if (result) { showResult(result); await load(); }
  });
  async function load() { const result = await api.getAutomation(); if (result && result.ok) { state = result.value; render(); } else if (el('error')) showResult(result); }
  api.onAutomationChanged(next => { if (next) { state = next; render(); } });
  api.onConfig(cfg => { const next = cfg.lang || 'zh'; if (next !== locale) { locale = next; editing = ''; shell(); } });
  api.getConfig().then(cfg => { locale = cfg && cfg.lang || 'zh'; shell(); load(); });
  setInterval(() => { if (root.closest('[data-page-view]').classList.contains('active')) render(); }, 1000);
})();
