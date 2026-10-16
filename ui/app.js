const copy = [
  ['console','Local testing console','本地测试控制台','ローカルテストコンソール','Consola local de pruebas'],
  ['local','LOCAL ONLY','仅在本机运行','ローカル実行のみ','SOLO LOCAL'],
  ['language','Language','界面语言','表示言語','Idioma'],
  ['headline','Break your AI Agent before your users do.','在用户搞崩你的 Agent 之前，先发现问题。','ユーザーより先に、AI Agent の問題を見つけよう。','Pon a prueba tu AI Agent antes de que lo hagan tus usuarios.'],
  ['intro','Start a test here. Watch the evidence arrive. Open the report from this run.','在这里开始测试，查看实时进度，打开本次运行的报告。','ここからテストを開始し、進行状況と今回のレポートを確認できます。','Inicia una prueba, sigue el progreso y abre el informe de esta ejecución.'],
  ['configure','Choose your test','选择测试','テストを選択','Elige tu prueba'],
  ['noCloud','No cloud account for examples','示例无需云端账号','サンプルはアカウント不要','Ejemplos sin cuenta'],
  ['target','Target','测试对象','テスト対象','Objetivo'],
  ['showcase','MCP failure → fix · no account','MCP 故障 → 修复 · 无需账号','MCP 障害 → 修正 · アカウント不要','Fallo MCP → solución · sin cuenta'],
  ['demo','50-scenario harness demo · no account','50 场景框架演示 · 无需账号','50 シナリオのデモ · アカウント不要','Demo de 50 escenarios · sin cuenta'],
  ['suite','Suite','测试套件','テストスイート','Conjunto de pruebas'],
  ['all','All scenarios','全部场景','すべてのシナリオ','Todos los escenarios'],
  ['security','Security','安全性','安全性','Seguridad'],
  ['recovery','Recovery','错误恢复','エラー回復','Recuperación'],
  ['reliability','Reliability','可靠性','信頼性','Fiabilidad'],
  ['tools','Tool usage','工具使用','ツール使用','Uso de herramientas'],
  ['context','Context','上下文处理','コンテキスト','Contexto'],
  ['completion','Task completion','任务完成','タスク完了','Tareas completadas'],
  ['cases','Scenarios','场景数','シナリオ数','Escenarios'],
  ['advanced','Advanced settings','高级设置','詳細設定','Opciones avanzadas'],
  ['model','Model (optional)','模型（可选）','モデル（任意）','Modelo (opcional)'],
  ['repeat','Trials per scenario','每个场景重复次数','シナリオごとの試行回数','Intentos por escenario'],
  ['timeout','Scenario deadline','单场景超时','シナリオの制限時間','Tiempo por escenario'],
  ['baseline','Compare with baseline','与历史基线比较','ベースラインと比較','Comparar con referencia'],
  ['noBaseline','No baseline','不比较基线','比較しない','Sin referencia'],
  ['compareNote','Comparisons require the same suite, selection, model and execution limits.','比较要求套件、场景、模型和执行预算一致。','比較には同じスイート、対象、モデル、実行上限が必要です。','La comparación exige el mismo conjunto, selección, modelo y límites.'],
  ['paid','Use my installed CLI and existing login. Model calls may incur provider charges.','使用已安装的 CLI 和已有登录状态；模型调用可能产生费用。','インストール済み CLI と既存のログインを使用します。モデルの利用料金が発生する場合があります。','Usar mi CLI y sesión existentes. Las llamadas al modelo pueden generar cargos.'],
  ['missing','CLI not found. Install and sign in using your terminal, then check the environment again.','未找到 CLI。请在终端安装并登录，然后重新检查环境。','CLI が見つかりません。端末でインストールとログインを行い、再確認してください。','CLI no encontrado. Instálalo e inicia sesión en la terminal, y vuelve a comprobar.'],
  ['start','Start test','开始测试','テスト開始','Iniciar prueba'],
  ['oneAtATime','One run at a time. Each run gets its own saved report.','同时运行一个任务，每次运行独立保存报告。','同時に実行できるのは 1 件です。レポートは実行ごとに保存します。','Una ejecución a la vez. Cada una guarda su propio informe.'],
  ['liveRun','Live run','运行进度','実行状況','Ejecución en directo'],
  ['ready','READY','就绪','準備完了','LISTO'],
  ['readyTitle','Ready when you are.','准备好即可开始。','いつでも開始できます。','Todo listo para empezar.'],
  ['readyDescription','Try the MCP case study first. It reproduces a tool failure and verifies the fix.','建议先运行 MCP 案例，复现工具故障并验证修复。','まず MCP の事例で、ツール障害の再現と修正を確認しましょう。','Prueba primero el caso MCP: reproduce un fallo y verifica la solución.'],
  ['stop','Stop test','停止测试','テスト停止','Detener prueba'],
  ['notStarted','No test started','尚未开始测试','未実行','No hay pruebas iniciadas'],
  ['openReport','Open report ↗','打开完整报告 ↗','レポートを開く ↗','Abrir informe ↗'],
  ['json','JSON','JSON','JSON','JSON'],['markdown','Markdown','Markdown','Markdown','Markdown'],
  ['badge','Badge','徽章','バッジ','Insignia'],['comparison','Comparison ↗','比较结果 ↗','比較結果 ↗','Comparación ↗'],
  ['environment','Environment','运行环境','実行環境','Entorno'],['check','Check again','重新检查','再確認','Volver a comprobar'],
  ['environmentNote','This checks executable availability. A test run checks whether your existing login and CLI configuration work.','这里检查程序是否存在；实际测试会验证已有登录和 CLI 配置能否工作。','ここでは実行ファイルの有無を確認します。ログインと設定は実際のテストで確認します。','Se comprueba si existe el ejecutable. La prueba verifica la sesión y configuración existentes.'],
  ['setupHelp','Install / sign-in help','安装与登录帮助','インストールとログイン','Ayuda de instalación y acceso'],
  ['setupNote','Install and sign in with the official CLI in your terminal. Then click Check again. This console does not collect API keys.','请通过官方 CLI 在终端安装并登录，然后点击重新检查。控制台不收集 API Key。','端末で公式 CLI をインストールしてログインし、再確認してください。このコンソールは API キーを収集しません。','Instala el CLI oficial e inicia sesión en la terminal. Esta consola no recopila claves API.'],
  ['results','This run’s report','本次运行报告','今回のレポート','Informe de esta ejecución'],
  ['before','Before fix','修复前','修正前','Antes de corregir'],['after','After fix','修复后','修正後','Después de corregir'],
  ['history','Run history','历史运行','実行履歴','Historial'],['historyNote','Saved locally on this machine','保存在本机','この端末に保存','Guardado en este equipo'],
  ['scope','Behavioral suites use simulated tools. The MCP case study uses real transport with scripted clients. Scores are not security certification.','行为套件使用模拟工具；MCP 案例使用真实传输与程序化客户端。分数不代表安全认证。','動作スイートは模擬ツール、MCP 事例は実際の通信とスクリプトを使用します。スコアは安全性の認証ではありません。','Las pruebas de comportamiento usan herramientas simuladas; el caso MCP usa transporte real y clientes programados. Las puntuaciones no certifican seguridad.'],
  ['showcaseDesc','Real MCP traffic with two deterministic clients: reproduce two engineered failures, then verify the fixes. No LLM or account is used.','通过真实 MCP 通信运行两个确定性客户端：复现两项人为设计的故障，再验证修复。无需模型或账号。','実際の MCP 通信で 2 つの障害と修正を検証します。決定的なクライアントを使い、LLM やアカウントは不要です。','Tráfico MCP real con clientes deterministas: reproduce dos fallos diseñados y verifica las correcciones. Sin LLM ni cuenta.'],
  ['demoDesc','Prerecorded decisions verify the harness and report pipeline. DEMO scores do not evaluate a real agent.','预录决策用于验证框架与报告流程。DEMO 分数不代表真实 Agent 成绩。','記録済みの判断でテスト基盤を確認します。デモのスコアは実際の Agent の評価ではありません。','Decisiones grabadas verifican el sistema de pruebas. Las puntuaciones DEMO no evalúan a un agente real.'],
  ['liveDesc','Runs your installed CLI against simulated-tool behavioral scenarios. Start with one scenario; native OS security is outside this test.','调用已安装 CLI 测试模拟工具环境内的行为。建议先运行一个场景，不涵盖操作系统安全。','インストール済み CLI の動作を模擬ツールで確認します。まず 1 件から開始してください。OS の安全性は対象外です。','Ejecuta tu CLI con herramientas simuladas. Empieza con un escenario; no evalúa la seguridad del sistema operativo.'],
  ['installed','Found','已找到','検出済み','Encontrado'],['notInstalled','Not installed','未安装','未インストール','No instalado'],
  ['running','RUNNING','运行中','実行中','EN CURSO'],['cancelling','STOPPING','正在停止','停止中','DETENIENDO'],['completed','COMPLETED','已完成','完了','COMPLETADO'],['findings','FINDINGS','发现问题','問題あり','HALLAZGOS'],['error','ERROR','执行错误','実行エラー','ERROR'],['cancelled','STOPPED','已停止','停止済み','DETENIDO'],['interrupted','INTERRUPTED','已中断','中断','INTERRUMPIDO'],
  ['doneDescription','Run complete. The report below belongs to this run.','运行完成，下方显示本次运行的报告。','完了しました。下に今回のレポートを表示します。','Ejecución completada. El informe inferior corresponde a esta ejecución.'],
  ['cancelDescription','Stopped. No new model calls will be started by this run.','已停止，本次运行不会继续发起模型调用。','停止しました。この実行から新たなモデル呼び出しは行いません。','Detenido. Esta ejecución no iniciará nuevas llamadas al modelo.'],
  ['errorDescription','The run could not complete. Review the error below and check your CLI login, configuration and sandbox prerequisites.','运行未能完成。请查看下方错误，并检查 CLI 登录、配置与沙箱条件。','完了できませんでした。下のエラーと CLI のログイン、設定、サンドボックスを確認してください。','No se pudo completar. Revisa el error, la sesión del CLI, la configuración y el entorno aislado.'],
  ['progress','Completed trials','已完成轮次','完了した試行','Intentos completados'],['demoScore','DEMO score','演示评分','デモスコア','Puntuación DEMO'],['score','Agent Score','Agent 评分','Agent スコア','Puntuación del agente'],['passed','Passed trials','通过轮次','成功した試行','Intentos aprobados'],['issues','Failures / errors','失败 / 执行错误','失敗 / エラー','Fallos / errores'],
  ['improvements','Verified improvements','已验证改善','確認した改善','Mejoras verificadas'],['regressions','Observed regressions','观测到的退步','観測された後退','Regresiones observadas'],
  ['emptyHistory','No runs yet. Start your first test above.','暂无历史记录，请从上方开始测试。','履歴はありません。上で最初のテストを開始してください。','Aún no hay ejecuciones. Inicia una prueba arriba.'],
  ['connection','Cannot reach the local console. Keep the terminal running, then reload this page.','无法连接本地控制台。请保持终端运行，然后刷新页面。','コンソールに接続できません。端末を起動したまま再読み込みしてください。','No se puede conectar con la consola local. Mantén la terminal abierta y recarga.'],
  ['compareFailed','Baseline comparison unavailable','基线比较未完成','比較できませんでした','Comparación no disponible'],
  ['loading','Checking environment…','正在检查环境…','環境を確認中…','Comprobando el entorno…']
];
const langs = ['en', 'zh-CN', 'ja', 'es'];
const dictionaries = Object.fromEntries(langs.map((lang, i) => [lang, Object.fromEntries(copy.map(row => [row[0], row[i + 1]]))]));
const $ = id => document.getElementById(id);
let lang = 'en';
try { const saved = localStorage.getItem('agentbuster-language'); if (langs.includes(saved)) lang = saved; } catch {}
let state = { environment: [], jobs: [], active: null }, selectedId, busy = false, reportView = 'fixed', baselineSignature = '', historySignature = '', pollTimer;
const t = key => dictionaries[lang][key] || key;
const token = document.querySelector('meta[name="agentbuster-token"]').content;
function notice(message) { $('notice').textContent = message || ''; $('notice').hidden = !message; }
async function api(url, data) {
  const response = await fetch(url, data === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'content-type': 'application/json', 'x-agentbuster-token': token }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}
function selectedJob() { return state.jobs.find(j => j.id === selectedId); }
function paidTarget() { return !['showcase', 'demo'].includes($('agent').value); }
function modeDescription(agent) { return t(agent === 'showcase' ? 'showcaseDesc' : agent === 'demo' ? 'demoDesc' : 'liveDesc'); }
function applyLanguage() {
  document.documentElement.lang = lang; $('language').value = lang; $('language').setAttribute('aria-label', t('language'));
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  historySignature = ''; baselineSignature = ''; render();
}
function renderForm() {
  const live = paidTarget(), showcase = $('agent').value === 'showcase';
  const found = state.environment.find(e => e.name === $('agent').value)?.installed;
  $('mode-note').textContent = modeDescription($('agent').value);
  $('suite-options').hidden = showcase; $('advanced').hidden = showcase;
  $('model').disabled = !live; $('paid-area').hidden = !live; $('paid').required = live;
  $('missing').hidden = !live || !!found;
  $('start').disabled = busy || !!state.active || (live && (!found || !$('paid').checked));
}
function renderEnvironment() {
  $('environment-list').replaceChildren();
  for (const entry of state.environment) {
    const item = document.createElement('div'); item.className = 'env-item';
    const name = document.createElement('span'); name.textContent = { claude: 'Claude Code', codex: 'Codex', gemini: 'Gemini CLI', opencode: 'OpenCode' }[entry.name];
    const status = document.createElement('span'); status.className = `env-state${entry.installed ? ' ok' : ''}`; status.textContent = t(entry.installed ? 'installed' : 'notInstalled');
    item.append(name, status); $('environment-list').append(item);
  }
}
function artifactBase(job) { return `/runs/${job.id}/${job.agent === 'showcase' ? `${reportView}/` : ''}`; }
function renderJob() {
  const job = selectedJob();
  if (!job) { $('run-status').textContent = t('ready'); $('run-title').textContent = t('readyTitle'); $('run-description').textContent = t('readyDescription'); return; }
  const running = ['running', 'cancelling'].includes(job.status);
  $('run-status').textContent = t(job.status); $('run-status').className = `status ${job.status}`;
  $('run-title').textContent = `${job.agent === 'showcase' ? 'MCP' : job.agent.toUpperCase()} · ${t(job.agent === 'showcase' ? 'showcase' : 'suite')}${job.agent === 'showcase' ? '' : `: ${t(job.suite)}`}`;
  $('run-description').textContent = job.status === 'error' ? t('errorDescription') : ['cancelled', 'interrupted'].includes(job.status) ? t('cancelDescription') : running ? modeDescription(job.agent) : t('doneDescription');
  $('cancel').hidden = job.id !== state.active; $('cancel').disabled = job.status === 'cancelling';
  $('progress').style.width = `${job.total ? Math.min(100, 100 * job.done / job.total) : 0}%`;
  $('progress-text').textContent = `${t('progress')}: ${job.done} / ${job.total}`;
  const elapsed = Math.max(0, Math.round(((job.finishedAt ? Date.parse(job.finishedAt) : Date.now()) - Date.parse(job.startedAt)) / 1000));
  $('elapsed').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const log = `${job.log || ''}${job.error ? `\nERROR: ${job.error}` : ''}${job.comparisonError ? `\n${t('compareFailed')}: ${job.comparisonError}` : ''}`;
  const nearBottom = $('log').scrollHeight - $('log').scrollTop - $('log').clientHeight < 70;
  if ($('log').textContent !== log) { $('log').textContent = log; if (nearBottom) $('log').scrollTop = $('log').scrollHeight; }
  $('summary').hidden = !job.summary; $('artifact-actions').hidden = !job.summary; $('results').hidden = !job.summary;
  if (!job.summary) return;
  $('summary').replaceChildren();
  const stats = [[t(job.summary.demo ? 'demoScore' : 'score'), `${job.summary.score}/100`], [t('passed'), job.summary.passed], [t('issues'), `${job.summary.failed} / ${job.summary.errors}`]];
  if (job.improvements !== undefined) stats[2] = [t('improvements'), job.improvements];
  for (const [label, value] of stats) { const stat = document.createElement('div'); stat.className = 'stat'; const number = document.createElement('b'); number.textContent = value; const text = document.createElement('span'); text.textContent = label; stat.append(number, text); $('summary').append(stat); }
  const base = artifactBase(job), report = `${base}report.html?lang=${encodeURIComponent(lang)}`;
  $('open-report').href = report; $('download-json').href = `${base}report.json`; $('download-md').href = `${base}report.md`; $('download-badge').href = `${base}badge.svg`;
  if ($('report-frame').getAttribute('src') !== report) $('report-frame').src = report;
  $('report-views').hidden = job.agent !== 'showcase'; $('view-broken').classList.toggle('selected', reportView === 'broken'); $('view-fixed').classList.toggle('selected', reportView === 'fixed');
  $('comparison').hidden = job.agent !== 'showcase' && !job.comparison; $('comparison').href = `/runs/${job.id}/comparison.md`;
}
function renderHistory() {
  const signature = JSON.stringify([lang, state.jobs.map(j => [j.id, j.status, j.summary?.score])]);
  if (signature === historySignature) return; historySignature = signature;
  $('history-list').replaceChildren();
  if (!state.jobs.length) { const p = document.createElement('p'); p.className = 'history-empty'; p.textContent = t('emptyHistory'); $('history-list').append(p); }
  for (const job of state.jobs) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'history-row';
    const label = document.createElement('span'), title = document.createElement('strong'), time = document.createElement('small'), status = document.createElement('span');
    title.textContent = `${job.agent.toUpperCase()} · ${t(job.suite)}`; time.textContent = new Date(job.startedAt).toLocaleString(lang); label.append(title, time);
    status.className = `status ${job.status}`; status.textContent = `${t(job.status)}${job.summary ? ` · ${job.summary.score}/100${job.summary.demo ? ' DEMO' : ''}` : ''}`; button.append(label, status);
    button.addEventListener('click', () => { selectedId = job.id; reportView = 'fixed'; renderJob(); $('run-title').scrollIntoView({ block: 'center', behavior: 'smooth' }); }); $('history-list').append(button);
  }
  const candidates = state.jobs.filter(j => j.summary), baselineKey = JSON.stringify([lang, candidates.map(j => j.id)]);
  if (baselineKey !== baselineSignature) {
    baselineSignature = baselineKey; const value = $('baseline').value; $('baseline').replaceChildren();
    const empty = new Option(t('noBaseline'), ''); $('baseline').append(empty);
    for (const job of candidates) $('baseline').append(new Option(`${job.agent} · ${new Date(job.startedAt).toLocaleString(lang)} · ${job.summary.score}`, job.id));
    if (candidates.some(j => j.id === value)) $('baseline').value = value;
  }
}
function render() { renderForm(); renderEnvironment(); renderJob(); renderHistory(); }
async function refresh() {
  clearTimeout(pollTimer);
  try { state = await api('/api/state'); if (!selectedId && state.jobs.length) selectedId = state.active || state.jobs[0].id; render(); }
  catch { notice(t('connection')); }
  pollTimer = setTimeout(refresh, state.active ? 650 : 3000);
}
$('language').addEventListener('change', () => { lang = $('language').value; try { localStorage.setItem('agentbuster-language', lang); } catch {} applyLanguage(); });
$('agent').addEventListener('change', () => { $('paid').checked = false; if (paidTarget()) $('limit').value = '1'; renderForm(); });
$('paid').addEventListener('change', renderForm);
$('run-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy || state.active || !$('run-form').reportValidity()) return;
  busy = true; renderForm(); notice('');
  try {
    const response = await api('/api/jobs', { agent: $('agent').value, suite: $('suite').value, limit: Number($('limit').value), repeat: Number($('repeat').value), timeoutMs: Number($('timeout').value), model: $('model').value.trim(), allowPaid: $('paid').checked, baselineId: $('agent').value === 'showcase' ? '' : $('baseline').value });
    selectedId = response.id; reportView = 'fixed'; await refresh();
  } catch (e) { notice(e.message); }
  finally { busy = false; renderForm(); }
});
$('cancel').addEventListener('click', async () => { try { if (state.active) await api(`/api/jobs/${state.active}/cancel`, {}); await refresh(); } catch (e) { notice(e.message); } });
$('doctor').addEventListener('click', async () => { $('doctor').disabled = true; try { await api('/api/doctor', {}); notice(''); await refresh(); } catch (e) { notice(e.message); } finally { $('doctor').disabled = false; } });
$('view-broken').addEventListener('click', () => { reportView = 'broken'; renderJob(); }); $('view-fixed').addEventListener('click', () => { reportView = 'fixed'; renderJob(); });
applyLanguage(); $('environment-list').textContent = t('loading'); void refresh();
