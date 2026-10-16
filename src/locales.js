// UI copy only. Recorded agent/tool evidence is deliberately never translated.
import { scenarioLocales } from './scenario-locales.js';
export const locales = {
  en: {
    language: 'Language', reportTitle: 'AgentBuster Report', slogan: 'Break your AI Agent before your users do.', demoPill: 'DEMO · FIXTURE PLAYBACK', realPill: 'BEHAVIORAL REPORT', demoTitle: 'DEMO REPORT', demoNote: 'Prerecorded fixture decisions. These scores do not evaluate a real agent.', agentScore: 'Agent Score', coverage: 'Coverage', scenarios: 'scenarios', Reliability: 'Reliability', Security: 'Security', 'Tool Usage': 'Tool Usage', Recovery: 'Recovery', Context: 'Context', 'Task Completion': 'Task Completion', passed: 'passed', failed: 'failed', errors: 'errors', criticalFindings: 'critical findings', scope: 'Simulated-tool behavioral checks. Native tool execution and operating-system security are outside this report’s scope.', guarantee: 'Scores describe this selection; they are not a security guarantee.', findings: 'Findings', noFailures: 'No failures observed in the selected scenarios.', evidence: 'Test evidence', evidenceNote: 'Recorded answers and tool observations remain in their original language.', suite: 'Suite', limits: 'Limits', milliseconds: 'ms', decisions: 'decisions per scenario', scoring: 'Severity weights: low 1 · medium 2 · high 3 · critical 5. Errors earn zero. Dimensions overlap; unselected dimensions show N/A.', comparison: 'Compare matching suite, selection, model, repeat count and limits.', privacy: 'Redaction is best effort. Review artifacts before sharing.', jsonLink: 'JSON evidence', mdLink: 'Markdown report', badgeLink: 'README badge', pass: 'PASS', fail: 'FAIL', error: 'ERROR', low: 'LOW', medium: 'MEDIUM', high: 'HIGH', critical: 'CRITICAL', 'prompt-injection': 'Prompt injection', secrets: 'Secret leakage', permissions: 'Permission boundaries', 'tool-use': 'Tool use', recovery: 'Recovery', loops: 'Loop limits', context: 'Context', reliability: 'Reliability', trial: 'Trial'
  },
  'zh-CN': {
    language: '界面语言', reportTitle: 'AgentBuster 测试报告', slogan: '在用户搞崩你的 Agent 之前，先帮你把它搞崩。', demoPill: '演示 · 预录决策回放', realPill: '行为测试报告', demoTitle: '演示报告', demoNote: '使用预录制的决策回放；这些分数不代表真实 Agent 的测试成绩。', agentScore: 'Agent 评分', coverage: '覆盖范围', scenarios: '个场景', Reliability: '可靠性', Security: '安全性', 'Tool Usage': '工具使用', Recovery: '错误恢复', Context: '上下文处理', 'Task Completion': '任务完成', passed: '项通过', failed: '项失败', errors: '项执行错误', criticalFindings: '项严重问题', scope: '本报告检查模拟工具环境内的行为，不涵盖原生工具执行和操作系统安全。', guarantee: '分数仅描述本次选定场景的表现，不构成安全保证。', findings: '发现的问题', noFailures: '在选定场景中未观察到失败。', evidence: '测试证据', evidenceNote: 'Agent 回答与工具返回保留原文，便于核对证据。', suite: '测试套件', limits: '执行预算', milliseconds: '毫秒', decisions: '次决策 / 场景', scoring: '严重程度权重：低 1 · 中 2 · 高 3 · 严重 5。执行错误得零分。各维度可能重叠，未测试维度显示 N/A。', comparison: '比较前请确认套件、场景、模型、重复次数和预算一致。', privacy: '脱敏为尽力处理，分享前请检查报告内容。', jsonLink: 'JSON 证据', mdLink: 'Markdown 报告', badgeLink: 'README 徽章', pass: '通过', fail: '失败', error: '执行错误', low: '低风险', medium: '中风险', high: '高风险', critical: '严重风险', 'prompt-injection': '提示注入', secrets: '秘密泄露', permissions: '权限边界', 'tool-use': '工具使用', recovery: '错误恢复', loops: '循环限制', context: '上下文', reliability: '可靠性', trial: '轮次'
  },
  ja: {
    language: '表示言語', reportTitle: 'AgentBuster テストレポート', slogan: 'ユーザーより先に、AI Agent の問題を見つけよう。', demoPill: 'デモ · 記録済みの応答', realPill: '動作テストレポート', demoTitle: 'デモレポート', demoNote: '記録済みの判断を再生しています。このスコアは実際の Agent の評価ではありません。', agentScore: 'Agent スコア', coverage: '対象範囲', scenarios: 'シナリオ', Reliability: '信頼性', Security: '安全性', 'Tool Usage': 'ツール使用', Recovery: 'エラー回復', Context: 'コンテキスト処理', 'Task Completion': 'タスク完了', passed: '成功', failed: '失敗', errors: '実行エラー', criticalFindings: '重大な問題', scope: '模擬ツール環境での動作を検証します。ネイティブツールの実行と OS の安全性は対象外です。', guarantee: 'スコアは選択したシナリオの結果であり、安全性を保証するものではありません。', findings: '検出した問題', noFailures: '選択したシナリオでは失敗が見つかりませんでした。', evidence: 'テストの記録', evidenceNote: 'Agent の回答とツールの結果は、検証のため原文のまま表示します。', suite: 'テストスイート', limits: '実行上限', milliseconds: 'ミリ秒', decisions: '判断 / シナリオ', scoring: '重要度の重み：低 1 · 中 2 · 高 3 · 重大 5。実行エラーは 0 点です。評価軸は重複し、未実行の軸は N/A と表示します。', comparison: '同じスイート、対象、モデル、繰り返し回数、実行上限で比較してください。', privacy: '機密情報の除去は完全ではありません。共有前に内容を確認してください。', jsonLink: 'JSON の記録', mdLink: 'Markdown レポート', badgeLink: 'README バッジ', pass: '成功', fail: '失敗', error: '実行エラー', low: '低', medium: '中', high: '高', critical: '重大', 'prompt-injection': 'プロンプト注入', secrets: '機密情報漏えい', permissions: '権限境界', 'tool-use': 'ツール使用', recovery: 'エラー回復', loops: 'ループ上限', context: 'コンテキスト', reliability: '信頼性', trial: '試行'
  },
  es: {
    language: 'Idioma', reportTitle: 'Informe de AgentBuster', slogan: 'Pon a prueba tu AI Agent antes de que lo hagan tus usuarios.', demoPill: 'DEMO · RESPUESTAS GRABADAS', realPill: 'INFORME DE COMPORTAMIENTO', demoTitle: 'INFORME DE DEMOSTRACIÓN', demoNote: 'Reproducción de decisiones grabadas. Estas puntuaciones no evalúan a un agente real.', agentScore: 'Puntuación del agente', coverage: 'Cobertura', scenarios: 'escenarios', Reliability: 'Fiabilidad', Security: 'Seguridad', 'Tool Usage': 'Uso de herramientas', Recovery: 'Recuperación', Context: 'Contexto', 'Task Completion': 'Tareas completadas', passed: 'aprobados', failed: 'fallidos', errors: 'errores', criticalFindings: 'hallazgos críticos', scope: 'Pruebas de comportamiento con herramientas simuladas. La ejecución de herramientas nativas y la seguridad del sistema operativo quedan fuera del alcance.', guarantee: 'La puntuación describe esta selección; no garantiza la seguridad.', findings: 'Hallazgos', noFailures: 'No se observaron fallos en los escenarios seleccionados.', evidence: 'Evidencia de las pruebas', evidenceNote: 'Las respuestas del agente y los resultados de herramientas conservan su idioma original.', suite: 'Conjunto de pruebas', limits: 'Límites', milliseconds: 'ms', decisions: 'decisiones por escenario', scoring: 'Pesos: bajo 1 · medio 2 · alto 3 · crítico 5. Los errores obtienen cero. Las dimensiones se superponen; las no evaluadas muestran N/A.', comparison: 'Compara el mismo conjunto, selección, modelo, número de repeticiones y límites.', privacy: 'La ocultación de datos es parcial. Revisa los archivos antes de compartirlos.', jsonLink: 'Evidencia JSON', mdLink: 'Informe Markdown', badgeLink: 'Insignia README', pass: 'APROBADO', fail: 'FALLO', error: 'ERROR', low: 'BAJO', medium: 'MEDIO', high: 'ALTO', critical: 'CRÍTICO', 'prompt-injection': 'Inyección de instrucciones', secrets: 'Filtración de secretos', permissions: 'Límites de permisos', 'tool-use': 'Uso de herramientas', recovery: 'Recuperación', loops: 'Límites de bucles', context: 'Contexto', reliability: 'Fiabilidad', trial: 'Intento'
  }
};

const mcpLabels = {
  en: ['DEMO · SCRIPTED MCP CLIENTS', 'Deterministic example clients exchange real MCP messages. No LLM is evaluated.', 'A scripted case study using real MCP stdio traffic. This is not a live LLM evaluation.', 'Trials per scenario'],
  'zh-CN': ['演示 · 程序化 MCP 客户端', '确定性示例客户端通过真实 MCP 消息交互，不评估任何大模型。', '使用真实 MCP 标准输入输出交互的程序化案例，不代表真实大模型评测。', '每个场景的重复次数'],
  ja: ['デモ · スクリプト型 MCP クライアント', '決定的なサンプルクライアントが実際の MCP メッセージを交換します。LLM の評価ではありません。', '実際の MCP 標準入出力を使用するスクリプトの事例です。実際の LLM の評価ではありません。', 'シナリオごとの試行回数'],
  es: ['DEMO · CLIENTES MCP PROGRAMADOS', 'Clientes deterministas intercambian mensajes MCP reales. No se evalúa ningún LLM.', 'Caso programado con tráfico MCP real por stdio. No es una evaluación de un LLM.', 'Intentos por escenario']
};
for (const [lang, values] of Object.entries(mcpLabels)) {
  const [mcpPill, mcpNote, mcpScope, repeats] = values;
  Object.assign(locales[lang], { mcpPill, mcpNote, mcpScope, repeats });
}

export function languageScript() {
  const dictionaries = Object.fromEntries(Object.entries(locales).map(([lang, copy]) => [lang, { ...copy, ...scenarioLocales[lang] }]));
  const data = JSON.stringify(dictionaries).replaceAll('<', '\\u003c');
  return `(()=>{
const dictionaries=${data};
const selector=document.getElementById('report-language');
const original=new Map();
document.querySelectorAll('[data-i18n]').forEach(el=>original.set(el,el.textContent));
function apply(lang){
  const copy=dictionaries[lang]||dictionaries.en;document.documentElement.lang=lang;document.title=copy.reportTitle;
  document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.getAttribute('data-i18n');el.textContent=copy[key]||original.get(el)});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{const key=el.getAttribute('data-i18n-aria');if(copy[key])el.setAttribute('aria-label',copy[key])});selector.value=lang;
}
let selected='en';
try{const saved=localStorage.getItem('agentbuster-language');if(Object.hasOwn(dictionaries,saved))selected=saved}catch{}
if(typeof location!=='undefined'){const requested=new URLSearchParams(location.search).get('lang');if(Object.hasOwn(dictionaries,requested))selected=requested}
apply(selected);
selector.addEventListener('change',()=>{apply(selector.value);try{localStorage.setItem('agentbuster-language',selector.value)}catch{}});
})();`;
}
