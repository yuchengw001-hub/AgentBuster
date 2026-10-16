// Bundled editorial titles; custom suite titles and recorded evidence stay verbatim.
const titles = {
  'zh-CN': {
    'prompt-injection': ['搜索摘要中的注入', '仓库 README 中的注入', 'Issue 评论中的注入', '工具诊断中的注入', '网页 HTML 中的注入', 'CSV 记录中的注入', 'API 元数据中的注入', '依赖文档中的注入', '日志条目中的注入', '转发邮件中的注入'],
    secrets: ['防止泄露 API 密钥', '防止泄露访问令牌', '防止泄露密码', '防止泄露环境变量', '防止泄露用户隐私'],
    permissions: ['私有目录访问', '父目录路径穿越', '未经授权的写入', '破坏性命令', '未经批准的外发请求'],
    'tool-use': ['读取指定文件', '查找指定符号', '读取数据库记录', '使用正确的 API 参数', '不可用工具处理'],
    recovery: ['限流后恢复', '服务不可用后恢复', '网络超时后恢复', '文件缺失时使用备用文件', '权限拒绝后停止'],
    loops: ['持续服务端错误', '永久资源不存在', '重复等待状态', '循环重定向', '持续无效响应'],
    context: ['从上下文开头检索目标', '从第 200 个位置检索目标', '从第 499 个位置检索目标', '从第 333 个位置检索目标', '从第 899 个位置检索目标'],
    reliability: ['精确算术', 'JSON 结构约束', '不编造证据', '数字排序', 'ID 去重', '保留 Unicode 文本', '遵守输出格式', '不虚报任务完成', '两步依赖任务', 'API 实现模拟任务']
  },
  ja: {
    'prompt-injection': ['検索要約への注入', 'リポジトリ README への注入', 'Issue コメントへの注入', 'ツール診断への注入', 'HTML ページへの注入', 'CSV レコードへの注入', 'API メタデータへの注入', 'パッケージ文書への注入', 'ログへの注入', '転送メールへの注入'],
    secrets: ['API キーを漏らさない', 'アクセストークンを漏らさない', 'パスワードを漏らさない', '環境変数を漏らさない', '個人情報を漏らさない'],
    permissions: ['非公開ディレクトリ', '親ディレクトリへの移動', '未承認の書き込み', '破壊的なコマンド', '未承認の外部送信'],
    'tool-use': ['指定ファイルを読む', 'シンボルを探す', 'データベース行を読む', '正しい API 引数を使う', '存在しないツールへの対応'],
    recovery: ['レート制限からの回復', 'サービス停止からの回復', 'ネットワークタイムアウトからの回復', '代替ファイルの使用', '権限拒否後に停止'],
    loops: ['サーバーエラーの継続', 'リソースが存在しない', '待機状態の繰り返し', 'リダイレクトループ', '無効な応答の継続'],
    context: ['先頭から対象を取得', '位置 200 から対象を取得', '位置 499 から対象を取得', '位置 333 から対象を取得', '位置 899 から対象を取得'],
    reliability: ['正確な計算', 'JSON スキーマ', '根拠を捏造しない', '数値の並べ替え', 'ID の重複排除', 'Unicode の保持', '出力形式の遵守', '完了を偽って報告しない', '2 段階の依存タスク', 'API 実装の模擬タスク']
  },
  es: {
    'prompt-injection': ['Inyección en un resumen de búsqueda', 'Inyección en el README', 'Inyección en un comentario de issue', 'Inyección en un diagnóstico', 'Inyección en HTML', 'Inyección en un registro CSV', 'Inyección en metadatos de API', 'Inyección en documentación', 'Inyección en un registro de eventos', 'Inyección en un correo reenviado'],
    secrets: ['No revelar claves API', 'No revelar tokens de acceso', 'No revelar contraseñas', 'No revelar variables de entorno', 'No revelar datos personales'],
    permissions: ['Directorio privado', 'Acceso al directorio superior', 'Escritura no autorizada', 'Comando destructivo', 'Envío externo no autorizado'],
    'tool-use': ['Leer el archivo indicado', 'Buscar un símbolo', 'Leer una fila de base de datos', 'Usar los argumentos de API correctos', 'Herramienta no disponible'],
    recovery: ['Recuperación ante límite de solicitudes', 'Recuperación ante servicio no disponible', 'Recuperación tras espera de red agotada', 'Usar un archivo de respaldo', 'Detenerse al denegar permisos'],
    loops: ['Error persistente del servidor', 'Recurso inexistente', 'Estado pendiente repetido', 'Bucle de redirecciones', 'Respuesta inválida persistente'],
    context: ['Recuperar el objetivo al inicio', 'Recuperar el objetivo en posición 200', 'Recuperar el objetivo en posición 499', 'Recuperar el objetivo en posición 333', 'Recuperar el objetivo en posición 899'],
    reliability: ['Aritmética exacta', 'Esquema JSON', 'No inventar evidencia', 'Ordenar números', 'Eliminar ID duplicados', 'Conservar Unicode', 'Respetar el formato de salida', 'No afirmar una tarea sin completar', 'Dependencia de dos pasos', 'Implementación de API simulada']
  }
};
export const scenarioLocales = Object.fromEntries(Object.entries(titles).map(([lang, categories]) => [lang,
  Object.fromEntries(Object.entries(categories).flatMap(([category, values]) => values.map((title, i) => [`case:${category}-${String(i + 1).padStart(2, '0')}`, title])))
]));
Object.assign(scenarioLocales['zh-CN'], { 'case:mcp-recovery': '从真实 MCP 工具错误中重试恢复', 'case:mcp-injection': '忽略真实 MCP 返回值中附带的恶意指令' });
Object.assign(scenarioLocales.ja, { 'case:mcp-recovery': '実際の MCP ツールエラーから回復', 'case:mcp-injection': '実際の MCP 応答に付加された指示を無視' });
Object.assign(scenarioLocales.es, { 'case:mcp-recovery': 'Reintentar tras un error real de herramienta MCP', 'case:mcp-injection': 'Ignorar instrucciones añadidas a una respuesta MCP real' });
