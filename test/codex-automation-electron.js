'use strict';

// Real Electron + real main/preload/renderer IPC, isolated from the user's home.
// No inference requests or power actions are allowed by this launch check.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname, '..');

if (!process.versions.electron) {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llmpet-automation-ui-'));
  const child = require('child_process').spawn(require('electron'), [__filename], {
    cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, LLMPET_UI_TEST_DIR: testDir },
  });
  child.on('error', err => { console.error(err); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code || 0; });
} else {
  const { app, BrowserWindow } = require('electron');
  const testDir = process.env.LLMPET_UI_TEST_DIR;
  if (!testDir || !path.isAbsolute(testDir)) throw new Error('Isolated test directory required');
  os.homedir = () => testDir;
  app.setPath('userData', path.join(testDir, 'electron'));
  process.env.OCTOPUS_ALLOW_MULTI = '1';
  process.env.OCTOPUS_NO_HOOKS = '1';
  process.env.OCTOPUS_NO_NET = '1';
  process.env.LLMPET_NO_DSH = '1';
  // Fail closed even if a regression tries to execute one of these commands.
  const cp = require('child_process'), originalExec = cp.execFile, originalSpawn = cp.spawn;
  cp.execFile = (file, ...args) => {
    if (/shutdown|systemctl|osascript/i.test(file)) throw new Error('Power actions forbidden in launch test');
    return originalExec(file, ...args);
  };
  cp.spawn = (file, ...args) => {
    if (/codex|shutdown|systemctl/i.test(file)) throw new Error('Inference/power forbidden in launch test');
    return originalSpawn(file, ...args);
  };
  const stateDir = path.join(testDir, '.octopus');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'config.json'), JSON.stringify({ agentStartup: { claude: false, codex: false, dsh: false } }));
  const sid = '019f5103-921c-7ac1-9a8d-c4f8ff8a67aa', d = new Date();
  const sessions = path.join(testDir, '.codex', 'sessions', String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0'));
  fs.mkdirSync(sessions, { recursive: true });
  const rollout = path.join(sessions, `rollout-test-${sid}.jsonl`);
  const event = payload => JSON.stringify({ type: 'event_msg', timestamp: new Date().toISOString(), payload }) + '\n';
  fs.writeFileSync(rollout, JSON.stringify({ type: 'session_meta', payload: { id: sid, cwd: root, model_provider: 'openai' } }) + '\n'
    + event({ type: 'task_complete', turn_id: 'historical' }));
  const errors = [];
  app.on('web-contents-created', (_event, wc) => wc.on('console-message', (_e, level, message) => {
    if (level === 3 && !message.includes('Content Security Policy')) errors.push(message);
  }));
  require('../main');
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function until(fn) {
    for (let i = 0; i < 80; i++) { const value = await fn(); if (value) return value; await pause(100); }
    throw new Error('UI condition timed out');
  }
  (async () => {
    await app.whenReady();
    const pet = await until(() => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('pet.html') && !w.webContents.isLoading()));
    await pet.webContents.executeJavaScript('window.pet.openSessionArchive()');
    const win = await until(() => BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('archive.html') && !w.webContents.isLoading()));
    await until(() => win.webContents.executeJavaScript('!!document.getElementById("auto-form")'));
    const result = await win.webContents.executeJavaScript(`(async () => {
      document.querySelector('[data-page="automation"]').click();
      const pause = ms => new Promise(r => setTimeout(r, ms));
      const set = (id, value) => { const e = document.getElementById('auto-' + id); e.value = value; e.dispatchEvent(new Event('change')); };
      set('session', ${JSON.stringify(sid)}); set('name', '额度耗尽后关机'); set('trigger', 'quota_exhausted'); set('action', 'shutdown');
      document.getElementById('auto-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await pause(250); const a = await window.pet.getAutomation();
      if (!a.ok || a.value.rules.length !== 1) throw Error('Rule IPC save failed');
      const r = a.value.rules[0];
      if (r.enabled || r.delaySeconds < 60 || r.maxRuns !== 1) throw Error('Unsafe shutdown defaults');
      document.getElementById('auto-clear').click();
      set('session', ${JSON.stringify(sid)}); set('name', '额度恢复后继续'); set('trigger', 'quota_exhausted'); set('action', 'wait_quota');
      document.getElementById('auto-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await pause(250); const b = await window.pet.getAutomation();
      if (b.value.rules.length !== 2 || b.value.jobs.length) throw Error('Historical events replayed or second action missing');
      await window.pet.saveAutomationRule({ ...r, enabled: true });
      return { actions: b.value.rules.map(x => x.action), ruleId: r.id };
    })()`);
    assert.deepStrictEqual(result.actions, ['shutdown', 'wait_quota']);
    fs.appendFileSync(rollout, event({ type: 'task_started', turn_id: 'live-quota-failure' })
      + event({ type: 'error', turn_id: 'live-quota-failure', error: { codexErrorInfo: 'UsageLimitExceeded' }, will_retry: false }));
    await until(() => win.webContents.executeJavaScript('(async()=>{const r=await window.pet.getAutomation();return r.value.jobs.length===1})()'));
    const cancelled = await win.webContents.executeJavaScript(`(async()=>{
      const r=await window.pet.getAutomation(); const job=r.value.jobs[0];
      if(job.action!=='shutdown'||job.dueAt-Date.now()<50000)throw Error('Countdown missing');
      const cancel=document.querySelector('[data-auto="cancel"]');if(!cancel)throw Error('Cancel UI missing');cancel.click();
      await new Promise(r=>setTimeout(r,200));const next=await window.pet.getAutomation();return next.value.jobs[0].status;
    })()`);
    assert.strictEqual(cancelled, 'cancelled');
    for (const [lang, title] of [['en', 'Task automation'], ['ja', 'タスク自動化'], ['zh', '任务自动化']]) {
      win.webContents.send('archive:config', { lang });
      await until(() => win.webContents.executeJavaScript(`document.getElementById('page-title').textContent===${JSON.stringify(title)}`));
    }
    const css = await win.webContents.executeJavaScript(`(()=>{const s=document.getElementById('auto-action'),style=getComputedStyle(s);return {height:s.clientHeight,line:parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.4,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    assert(css.height > css.line + 18, `Select text must fit vertically: ${JSON.stringify(css)}`); assert(!css.overflow);
    await win.webContents.executeJavaScript("document.getElementById('auto-clear').click()");
    fs.writeFileSync(path.join(testDir, 'automation.png'), (await win.webContents.capturePage()).toPNG());
    win.setSize(920, 700); await pause(150);
    assert(!(await win.webContents.executeJavaScript('document.documentElement.scrollWidth>innerWidth')), 'Narrow workbench must not overflow');
    assert.deepStrictEqual(errors, [], 'Renderer must launch without errors');
    console.log('LLMPET automation launch passed: real Electron, IPC, independent actions, cancellation, zh/en/ja, responsive layout');
    console.log(`Screenshot: ${path.join(testDir, 'automation.png')}`);
    app.quit();
  })().catch(err => { console.error(err.stack); app.exit(1); });
  setTimeout(() => { console.error('Launch check timed out'); app.exit(2); }, 25000).unref();
}
