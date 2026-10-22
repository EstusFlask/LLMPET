'use strict';

(() => {
  const root = document.getElementById('automation-root');
  const api = window.pet;
  const words = {
    zh: {
      editor: '配置规则', name: '规则名称', session: 'Codex 会话 ID（可从列表选择或粘贴）', trigger: '触发条件', action: '执行动作', prompt: '继续指令 / 新任务内容', cwd: '工作目录（留空使用来源会话目录）', delay: '延迟秒数', max: '最多触发次数', enabled: '启用规则', idle: '仅在没有运行中或待回复会话时关机', save: '保存规则', clear: '新建规则', rules: '已保存规则', jobs: '执行与等待', history: '最近记录', empty: '暂无记录', edit: '编辑', remove: '删除', reset: '重置次数', enable: '启用', disable: '停用', cancel: '取消动作', runs: '已触发', remaining: '秒后执行', note: '次数在动作排队时累计，取消也计入上限；重置后可再次触发。关机至少保留 60 秒倒计时，可随时取消；取消或停用规则不会中断已经运行的任务。',
      defaultPrompt: '继续原任务。先核对已完成的工作和当前状态，只继续尚未完成的部分；不要重复已经完成的外部操作。',
      chooseAction: '请选择执行动作', continuePrompt: '继续指令（可留空）', taskPrompt: '新任务内容',
      countdown: '关机倒计时（秒）', promptNote: '留空会发送默认的继续指令，续跑仍会新增一条消息。',
      limitNote: '次数在动作排队时累计，取消也计入上限；重置后可再次触发。取消或停用规则不会中断已运行的任务。',
      shutdownNote: '关机至少保留 60 秒倒计时，可在「执行与等待」取消。',
      triggers: { completed: '本轮正常完成', ended: '任务结束或中断（含完成、失败、主动停止）', transient_error: '网络 / 临时服务错误最终失败', failed: '其他明确失败', interrupted: '任务中断（包括主动停止）' },
      actions: { continue: '继续原会话 / 重试', new_task: '开始新任务', shutdown: '关机' },
      states: { scheduled: '等待执行', waiting_idle: '等待会话停止运行', running: '执行中', completed: '完成', failed: '失败', cancelled: '已取消', idle: '空闲', unknown: '状态未确认', waiting_input: '等待回复', error_observed: '观察到错误，尚未确认终止', quota_exhausted: '额度耗尽', transient_error: '临时错误终止', interrupted: '中断' },
      events: { rule_saved: '保存规则', rule_removed: '删除规则', superseded: '会话已有新活动，取消旧动作', quota_restored: '额度已恢复' },
    },
    en: {
      editor: 'Configure rule', name: 'Rule name', session: 'Codex session ID (select or paste)', trigger: 'Trigger', action: 'Action', prompt: 'Continuation instructions / new task', cwd: 'Working directory (blank uses source session)', delay: 'Delay in seconds', max: 'Maximum triggers', enabled: 'Enable rule', idle: 'Wait until all sessions stop running or awaiting input before shutdown', save: 'Save rule', clear: 'New rule', rules: 'Saved rules', jobs: 'Executions and waiting', history: 'Recent history', empty: 'No records', edit: 'Edit', remove: 'Delete', reset: 'Reset count', enable: 'Enable', disable: 'Disable', cancel: 'Cancel action', runs: 'Triggered', remaining: 'seconds until execution', note: 'Counts accumulate when actions are queued, including cancelled actions, until reset. Shutdown has a cancellable countdown of at least 60 seconds. Cancelling or disabling a rule does not interrupt tasks already running.',
      defaultPrompt: 'Continue the original task. Check completed work and current state first. Continue only unfinished work and do not repeat completed external actions.',
      chooseAction: 'Choose an action', continuePrompt: 'Continuation instructions (optional)', taskPrompt: 'New task prompt',
      countdown: 'Shutdown countdown (seconds)', promptNote: 'Leaving this blank sends the default continuation instructions as a new message.',
      limitNote: 'Counts accumulate when actions are queued, including cancelled actions, until reset. Cancelling or disabling a rule does not interrupt running tasks.',
      shutdownNote: 'Shutdown has a cancellable countdown of at least 60 seconds. Cancel it under Executions and waiting.',
      triggers: { completed: 'Turn completed normally', ended: 'Task ended or interrupted (success, failure, manual stop)', transient_error: 'Final network / temporary service failure', failed: 'Other confirmed failure', interrupted: 'Interrupted (including manual stop)' },
      actions: { continue: 'Continue original session / retry', new_task: 'Start a new task', shutdown: 'Shut down computer' },
      states: { scheduled: 'Scheduled', waiting_idle: 'Waiting for sessions to stop', running: 'Running', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled', idle: 'Idle', unknown: 'Unconfirmed', waiting_input: 'Awaiting input', error_observed: 'Error observed; termination unconfirmed', quota_exhausted: 'Quota exhausted', transient_error: 'Transient failure', interrupted: 'Interrupted' },
      events: { rule_saved: 'Rule saved', rule_removed: 'Rule removed', superseded: 'New session activity cancelled the old action', quota_restored: 'Quota recovered' },
    },
    ja: {
      editor: 'ルール設定', name: 'ルール名', session: 'Codex セッション ID（選択・貼り付け）', trigger: '条件', action: 'アクション', prompt: '続行の指示 / 新しいタスク', cwd: '作業ディレクトリ（空欄で元の場所）', delay: '待機秒数', max: 'トリガー回数の上限', enabled: 'ルールを有効にする', idle: 'すべてのセッションの実行・入力待ちが終了してから電源を切る', save: '保存', clear: '新規ルール', rules: '保存済みルール', jobs: '実行と待機', history: '最近の履歴', empty: '記録はありません', edit: '編集', remove: '削除', reset: '回数をリセット', enable: '有効化', disable: '無効化', cancel: 'アクションを取消', runs: 'トリガー回数', remaining: '秒後に実行', note: '回数は待機に入った時点で累積し、取消済みもリセットまで含みます。電源オフには取消可能な 60 秒以上のカウントダウンがあります。取消・無効化しても実行中のタスクは中断しません。',
      defaultPrompt: '元のタスクを続けてください。完了した作業と現在の状態を確認し、未完了の部分だけを進めてください。完了済みの外部操作を繰り返さないでください。',
      chooseAction: 'アクションを選択', continuePrompt: '続行の指示（任意）', taskPrompt: '新しいタスクの内容',
      countdown: '電源オフまでの秒数', promptNote: '空欄の場合、既定の続行指示を新しいメッセージとして送信します。',
      limitNote: '回数は待機に入った時点で累積し、取消済みもリセットまで含みます。取消・無効化しても実行中のタスクは中断しません。',
      shutdownNote: '電源オフには 60 秒以上のカウントダウンがあります。「実行と待機」で取消できます。',
      triggers: { completed: 'ターンが正常終了', ended: 'タスク終了・中断（正常終了・失敗・手動停止）', transient_error: '通信・一時的なサービス障害で終了', failed: 'その他の確定した失敗', interrupted: '中断（手動停止を含む）' },
      actions: { continue: '元のセッションを続行・再試行', new_task: '新しいタスクを開始', shutdown: '電源を切る' },
      states: { scheduled: '実行待ち', waiting_idle: 'セッションの終了待ち', running: '実行中', completed: '完了', failed: '失敗', cancelled: '取消済み', idle: '待機', unknown: '未確認', waiting_input: '入力待ち', error_observed: 'エラーを検知・終了は未確認', quota_exhausted: '利用枠不足', transient_error: '一時的な障害で終了', interrupted: '中断済み' },
      events: { rule_saved: 'ルール保存', rule_removed: 'ルール削除', superseded: '新しいセッション活動により取消', quota_restored: '利用枠が回復' },
    },
  };
  Object.assign(words.zh, { intro: '为 Codex、Claude Code 和 DSH 配置定时或会话状态规则。规则默认关闭；事件条件仅处理新观察到的状态，正常完成只表示本轮回复结束。',
    session: '会话 ID（可从已发现会话选择或粘贴）', agent: '来源 Agent', discovered: '已发现会话', select: '选择', rescan: '重新扫描会话', diagnostics: '扫描诊断',
    source: '应用目录', configPath: '配置文件', loaded: '启动时间', tracked: '已跟踪', disabled: '已停用', missing: '目录不存在' });
  Object.assign(words.en, { intro: 'Configure timed or session-state rules for Codex, Claude Code and DSH. Rules start disabled. Event triggers react to new activity; completion means one turn ended.',
    session: 'Session ID (select a discovered session or paste)', agent: 'Source agent', discovered: 'Discovered sessions', select: 'Select', rescan: 'Rescan sessions', diagnostics: 'Scan diagnostics',
    source: 'Application directory', configPath: 'Config file', loaded: 'Started', tracked: 'Tracked', disabled: 'Disabled', missing: 'Directory missing' });
  Object.assign(words.ja, { intro: 'Codex・Claude Code・DSH の日時・セッション状態ルールを設定します。初期状態は無効です。イベント条件は新しい状態のみを処理し、完了は一度の応答の終了を表します。',
    session: 'セッション ID（一覧から選択・貼り付け）', agent: '対象 Agent', discovered: '検出したセッション', select: '選択', rescan: '再スキャン', diagnostics: 'スキャン診断',
    source: 'アプリの場所', configPath: '設定ファイル', loaded: '起動時刻', tracked: '追跡数', disabled: '無効', missing: 'フォルダなし' });
  words.zh.states.history = '历史记录（未确认运行）'; words.en.states.history = 'History (activity unconfirmed)'; words.ja.states.history = '履歴（実行は未確認）';
  const additions = {
    zh: { at: '执行时间（本机时区）', atNote: '到点执行一次；目标会话仍在运行时等待其结束。应用需保持运行。', saved: '保存成功', reselect: '重新选择对话', choosing: '点击已发现会话中的“选择”，即可替换此规则的对话并保存。', selected: '已重新选择对话并保存', taskTitle: '任务标题', untitled: '未命名任务', needsSchedule: '原额度规则已停用，请重新设置执行时间后启用。', search: '搜索标题或会话 ID', scheduled: '指定时间' },
    en: { at: 'Execution time (local time zone)', atNote: 'Runs once at this time. Waits for a busy session to finish. Keep the app running.', saved: 'Saved successfully', reselect: 'Choose another conversation', choosing: 'Click Select on a discovered session to replace this rule’s conversation and save.', selected: 'Conversation changed and saved', taskTitle: 'Task title', untitled: 'Untitled task', needsSchedule: 'The old quota rule is disabled. Set an execution time before enabling it.', search: 'Search by title or session ID', scheduled: 'At a specific time' },
    ja: { at: '実行日時（ローカル時間）', atNote: '指定日時に一度実行します。実行中のセッションは終了を待ちます。アプリを起動したままにしてください。', saved: '保存しました', reselect: '会話を選び直す', choosing: '検出したセッションの「選択」を押すと、このルールの会話を変更して保存します。', selected: '会話を変更して保存しました', taskTitle: 'タスク名', untitled: '無題のタスク', needsSchedule: '以前の利用枠ルールは無効です。実行日時を設定して有効にしてください。', search: 'タイトル・セッション ID で検索', scheduled: '日時を指定' },
  };
  for (const [lang, extra] of Object.entries(additions)) { Object.assign(words[lang], extra); words[lang].triggers = { scheduled: extra.scheduled, ...words[lang].triggers }; }
  const agentName = agent => ({ codex: 'Codex', claude: 'Claude Code', dsh: 'DSH' })[agent || 'codex'] || agent;
  let locale = 'zh', state = { rules: [], jobs: [], history: [], sessions: [], counts: {} }, editing = '', lastAction = '', reselecting = '';
  let noticeTimer;
  const c = () => words[locale] || words.zh;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const el = id => document.getElementById(`auto-${id}`);
  const date = at => at ? new Date(at).toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US') : '—';
  const options = entries => Object.entries(entries).map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join('');
  const localInput = at => { if (!at) return ''; const d = new Date(at); return new Date(at - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19); };
  function notice(message, success = true) {
    clearTimeout(noticeTimer); el('notice').textContent = message;
    el('notice').className = success ? 'automation-notice' : 'automation-selection';
    if (success) noticeTimer = setTimeout(() => { if (el('notice')) el('notice').textContent = ''; }, 6000);
  }
  function shell() {
    const w = c();
    root.innerHTML = `<p class="automation-intro">${esc(w.intro)}</p><div id="auto-error" class="automation-error" role="alert"></div><div id="auto-notice" role="status" aria-live="polite"></div><div class="automation-layout">
      <article class="panel-card"><h2>${esc(w.editor)}</h2><form id="auto-form" class="automation-form">
      <label>${esc(w.name)}<input id="auto-name" maxlength="100"></label>
      <label>${esc(w.agent)}<select id="auto-agent"><option value="codex">Codex</option><option value="claude">Claude Code</option><option value="dsh">DSH</option></select></label>
      <label>${esc(w.session)}<input id="auto-session" list="auto-sessions" required autocomplete="off"><datalist id="auto-sessions"></datalist><small id="auto-session-title"></small></label>
      <label>${esc(w.trigger)}<select id="auto-trigger">${options(w.triggers)}</select></label>
      <label id="auto-time-field" hidden>${esc(w.at)} · ${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)}<input id="auto-time" type="datetime-local" step="1"><small>${esc(w.atNote)}</small></label>
      <label>${esc(w.action)}<select id="auto-action" required><option value="">${esc(w.chooseAction)}</option>${options(w.actions)}</select></label>
      <label id="auto-prompt-field" hidden><span id="auto-prompt-label"></span><textarea id="auto-prompt" maxlength="12000"></textarea><small id="auto-prompt-note" hidden>${esc(w.promptNote)}</small></label>
      <label id="auto-cwd-field" hidden>${esc(w.cwd)}<input id="auto-cwd" maxlength="2048"></label>
      <div id="auto-limits" class="automation-pair" hidden><label><span id="auto-delay-label"></span><input id="auto-delay" type="number" min="0" max="86400" value="15" required></label><label>${esc(w.max)}<input id="auto-max" type="number" min="1" max="100" value="3" required></label></div>
      <label id="auto-idle-field" class="automation-check" hidden><input id="auto-idle" type="checkbox" checked>${esc(w.idle)}</label>
      <label class="automation-check"><input id="auto-enabled" type="checkbox">${esc(w.enabled)}</label>
      <div class="automation-actions"><button id="auto-save" class="soft-button" type="submit">${esc(w.save)}</button><button class="text-button" id="auto-clear" type="button">${esc(w.clear)}</button></div><small id="auto-limit-note" hidden>${esc(w.limitNote)}</small><small id="auto-shutdown-note" hidden>${esc(w.shutdownNote)}</small></form></article>
      <div class="automation-stack"><article class="panel-card"><div class="section-head"><h2>${esc(w.discovered)}</h2><button id="auto-rescan" class="soft-button">${esc(w.rescan)}</button></div><input id="auto-search" class="automation-search" type="search" placeholder="${esc(w.search)}" aria-label="${esc(w.search)}"><div id="auto-live"></div></article><article class="panel-card"><h2>${esc(w.rules)}</h2><div id="auto-rules"></div></article><article class="panel-card"><h2>${esc(w.jobs)}</h2><div id="auto-jobs"></div></article><article class="panel-card"><h2>${esc(w.history)}</h2><div id="auto-history" class="automation-history"></div></article><article class="panel-card"><h2>${esc(w.diagnostics)}</h2><div id="auto-diagnostics"></div></article></div></div>`;
    el('form').addEventListener('submit', save);
    el('clear').addEventListener('click', () => { editing = ''; reselecting = ''; notice(''); el('form').reset(); actionChanged(); render(); });
    el('action').addEventListener('change', actionChanged);
    el('trigger').addEventListener('change', actionChanged);
    el('agent').addEventListener('change', () => { el('session').value = ''; actionChanged(); render(); });
    el('rescan').addEventListener('click', async () => { showResult(await api.rescanAutomationSessions()); await load(); });
    el('search').addEventListener('input', render);
    el('session').addEventListener('input', render);
    render(); actionChanged();
  }
  function actionChanged() {
    const action = el('action').value;
    const inference = ['continue', 'new_task'].includes(action);
    const scheduled = el('trigger').value === 'scheduled';
    el('time-field').hidden = !scheduled;
    el('time').disabled = !scheduled;
    el('time').required = scheduled;
    el('time').min = localInput(Date.now() + (action === 'shutdown' ? 60000 : 1000));
    if (lastAction !== action && !editing) el('max').value = ['new_task', 'shutdown'].includes(action) ? '1' : '3';
    lastAction = action;
    for (const [field, visible] of Object.entries({ prompt: inference, cwd: action === 'new_task', idle: action === 'shutdown' })) {
      el(`${field}-field`).hidden = !visible;
      el(field).disabled = !visible;
    }
    el('limits').hidden = !action || scheduled;
    el('delay').disabled = !action || scheduled;
    el('max').disabled = !action || scheduled;
    el('limit-note').hidden = !action || scheduled;
    el('shutdown-note').hidden = action !== 'shutdown';
    el('prompt-label').textContent = action === 'new_task' ? c().taskPrompt : c().continuePrompt;
    el('prompt').placeholder = action === 'new_task' ? '' : c().defaultPrompt;
    el('prompt-note').hidden = !inference || action === 'new_task';
    el('delay-label').textContent = action === 'shutdown' ? c().countdown : c().delay;
    el('delay').min = action === 'shutdown' ? '60' : '0';
    if (action === 'shutdown' && Number(el('delay').value) < 60) el('delay').value = '60';
    el('prompt').required = action === 'new_task';
  }
  function showResult(result) {
    el('error').textContent = result && !result.ok ? result.message : '';
    if (result && !result.ok) notice('');
    return result && result.ok;
  }
  async function save(event) {
    event.preventDefault();
    if (!el('form').reportValidity()) return;
    const action = el('action').value;
    const rule = { id: editing || undefined, name: el('name').value, agent: el('agent').value, sessionId: el('session').value,
      trigger: el('trigger').value, action, prompt: el('prompt').disabled ? '' : el('prompt').value || (action === 'new_task' ? '' : c().defaultPrompt),
      cwd: el('cwd').disabled ? '' : el('cwd').value,
      scheduledAt: el('time').disabled ? 0 : new Date(el('time').value).getTime(),
      ...sessionFields(el('agent').value, el('session').value),
      delaySeconds: Number(el('delay').value), maxRuns: Number(el('max').value),
      enabled: el('enabled').checked, onlyWhenIdle: action === 'shutdown' ? el('idle').checked : true };
    el('save').disabled = true;
    try {
      const result = await api.saveAutomationRule(rule);
      if (showResult(result)) { editing = result.value.id; reselecting = ''; await load(); notice(c().saved); }
    } catch (err) { showResult({ ok: false, message: err.message }); }
    finally { el('save').disabled = false; }
  }
  function edit(rule) {
    editing = rule.id; reselecting = ''; notice('');
    el('agent').value = rule.agent || 'codex';
    for (const [id, key] of Object.entries({ name: 'name', session: 'sessionId', trigger: 'trigger', action: 'action', prompt: 'prompt', cwd: 'cwd', delay: 'delaySeconds', max: 'maxRuns' })) el(id).value = rule[key] || (key === 'delaySeconds' ? 0 : '');
    el('time').value = localInput(rule.scheduledAt);
    el('enabled').checked = rule.enabled; el('idle').checked = rule.onlyWhenIdle; actionChanged(); render(); el('name').focus();
  }
  function sessionFields(agent, id) {
    const source = (state.choices || state.sessions).find(s => (s.agent || 'codex') === agent && s.sessionId === id);
    const previous = state.rules.find(r => r.id === editing && r.agent === agent && r.sessionId === id);
    return { sessionTitle: source?.title || previous?.sessionTitle || '', sessionCwd: source?.cwd || previous?.sessionCwd || '',
      sessionProvider: source?.provider || previous?.sessionProvider || '', sessionModel: source?.model || previous?.sessionModel || '' };
  }
  function button(action, id, label, agent = '') { return `<button class="soft-button" data-auto="${action}" data-id="${esc(id)}" data-agent="${esc(agent)}">${esc(label)}</button>`; }
  function render() {
    if (!el('rules')) return;
    const w = c(), empty = `<p class="automation-intro">${esc(w.empty)}</p>`;
    const candidates = (state.choices || state.sessions).filter(s => (s.agent || 'codex') === el('agent').value).sort((a, b) => Number(['running', 'waiting_input'].includes(b.kind)) - Number(['running', 'waiting_input'].includes(a.kind)) || (b.at || 0) - (a.at || 0));
    el('sessions').innerHTML = candidates.map(s => `<option value="${esc(s.sessionId)}">${esc(s.title || s.cwd || s.sessionId)} · ${esc(w.states[s.kind] || s.kind)}</option>`).join('');
    const current = sessionFields(el('agent').value, el('session').value);
    el('session-title').textContent = current.sessionTitle;
    const search = el('search').value.trim().toLowerCase();
    el('live').innerHTML = candidates.filter(s => !search || `${s.title || ''} ${s.sessionId}`.toLowerCase().includes(search)).slice(0, 50).map(s => `<div class="automation-item ${s.sessionId === el('session').value ? 'automation-selected' : ''}"><strong>${esc(s.title || s.cwd || s.sessionId)}</strong><small>${esc(agentName(s.agent))} · ${esc(w.states[s.kind] || s.kind)} · ${esc(date(s.at))}</small><small>${esc(s.sessionId)}</small>${button('select', s.sessionId, w.select, s.agent || 'codex')}</div>`).join('') || empty;
    const d = state.diagnostics;
    el('diagnostics').innerHTML = d ? `<div class="automation-item"><small>${esc(w.source)}: ${esc(d.sourceRoot)}</small><small>${esc(w.configPath)}: ${esc(d.configPath)}</small><small>${esc(w.loaded)}: ${esc(date(d.loadedAt))}</small></div>${(d.watchers || []).map(x => `<div class="automation-item"><strong>${esc(agentName(x.agent))} · ${x.disabled ? esc(w.disabled) : `${esc(w.tracked)} ${x.tracked || 0}`}</strong><small>${esc(x.path || '')}${x.exists === false ? ` · ${esc(w.missing)}` : ''}</small></div>`).join('')}` : empty;
    el('rules').innerHTML = state.rules.map(r => `<div class="automation-item ${r.enabled ? '' : 'automation-muted'}"><strong>${esc(r.name)}</strong><p>${esc(w.triggers[r.trigger] || r.trigger)} → ${esc(w.actions[r.action] || r.action)}</p><small class="automation-task-title">${esc(w.taskTitle)}: ${esc(r.sessionTitle || (state.choices || state.sessions).find(s => (s.agent || 'codex') === r.agent && s.sessionId === r.sessionId)?.title || w.untitled)}</small>${r.trigger === 'scheduled' ? `<small>${esc(w.at)}: ${esc(date(r.scheduledAt))}</small>` : ''}${r.needsSchedule ? `<p class="automation-countdown">${esc(w.needsSchedule)}</p>` : ''}<small>${esc(agentName(r.agent))} · ${esc(r.sessionId)} · ${esc(w.runs)} ${state.counts[r.id] || 0}/${r.maxRuns}</small><div class="automation-actions">${button('edit', r.id, w.edit)}${button('reselect', r.id, w.reselect)}${button('toggle', r.id, r.enabled ? w.disable : w.enable)}${button('reset', r.id, w.reset)}${button('remove', r.id, w.remove)}</div></div>`).join('') || empty;
    el('jobs').innerHTML = state.jobs.slice(0, 25).map(j => {
      const countdown = j.status === 'scheduled' ? `<p class="automation-countdown">${Math.max(0, Math.ceil((j.dueAt - Date.now()) / 1000))} ${esc(w.remaining)}</p>` : '';
      return `<div class="automation-item"><strong>${esc(j.ruleName)} · ${esc(w.states[j.status] || j.status)}</strong><small>${esc(w.actions[j.action])} · ${esc(date(j.createdAt))}</small>${countdown}${j.message ? `<p>${esc(j.message)}</p>` : ''}${['scheduled', 'waiting_idle'].includes(j.status) ? button('cancel', j.id, w.cancel) : ''}</div>`;
    }).join('') || empty;
    el('history').innerHTML = state.history.slice(0, 50).map(h => `<div class="automation-item"><small>${esc(date(h.at))}</small><p>${esc(w.events[h.kind] || w.states[h.kind] || h.kind)}${h.message ? ` · ${esc(h.message)}` : ''}</p></div>`).join('') || empty;
    if (state.error) el('error').textContent = state.error;
  }
  root.addEventListener('click', async event => {
    const target = event.target.closest('[data-auto]'); if (!target) return;
    const id = target.dataset.id, action = target.dataset.auto, rule = state.rules.find(r => r.id === id);
    if (action === 'select') {
      const agent = target.dataset.agent; el('agent').value = agent; actionChanged(); el('session').value = id;
      if (reselecting) {
        const original = state.rules.find(r => r.id === reselecting);
        if (original) {
          target.disabled = true;
          try {
            const result = await api.saveAutomationRule({ ...original, agent, sessionId: id, ...sessionFields(agent, id) });
            if (showResult(result)) { edit(result.value); await load(); notice(c().selected); }
          } catch (err) { showResult({ ok: false, message: err.message }); }
          finally { target.disabled = false; }
        }
      }
      render(); return;
    }
    if (action === 'reselect' && rule) {
      edit(rule); reselecting = rule.id; notice(`${rule.name}: ${c().choosing}`, false);
      el('search').value = ''; render(); el('live').scrollIntoView({ behavior: 'smooth', block: 'center' }); el('search').focus(); return;
    }
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
  api.onConfig(cfg => { const next = cfg.lang || 'zh'; if (next !== locale) { locale = next; editing = ''; reselecting = ''; shell(); } });
  api.getConfig().then(cfg => { locale = cfg && cfg.lang || 'zh'; shell(); load(); });
  setInterval(() => { if (root.closest('[data-page-view]').classList.contains('active')) render(); }, 1000);
})();
