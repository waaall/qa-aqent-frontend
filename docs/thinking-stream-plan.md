# “思考过程”流式输出实施计划（前端视角）

目标：在现有 React + Zustand 聊天界面中展示后端的“thinking”流式事件，支持实时思考过程、工具调用轨迹、最终答案的串流与中断控制；兼容当前一次性返回的接口。

## 1. 现状与差距
- 当前仅调用 `POST /api/react_query`，一次性返回答案，UI 通过加载占位符展示等待态，没有思考流或停止生成。
- 前端已有：消息流（MessageList/MessageItem）、`useChat` Hook、`chatStore`/`sessionStore`、日志和错误提示；但缺失：流式 API 客户端、事件解析、思考轨迹 UI、取消/断开处理。
- 交互空缺：停止生成按钮未落地，工具/路由可视化缺失，出错时没有分步骤提示。

## 2. 协议要点（前端需支持）
- SSE 端点：`POST /api/react_stream`，请求体沿用 `/api/react_query` 字段，新增 `stream_thoughts`（默认 true）。若 `stream_thoughts=false` 或接口不可用，回退到 `/api/react_query`。
- 事件格式：`event: <type>` + `data: <json>`。通用字段：`trace_id`、`turn_id`、`step`（自增）、`ts`、`type`、`content`、`extra`。
- 事件类型：`meta.start`、`router.decision`、`memory.inject`、`thought`、`tool_call`、`tool_result`、`fallback`、`final`、`error`、`heartbeat`。
- 示例：
  ```
  event: meta.start
  data: {"trace_id":"t-123","turn_id":"sess-1","step":1,"content":"收到请求","extra":{"query":"..."}}

  event: router.decision
  data: {"trace_id":"t-123","step":2,"content":"路由到 agent_workflow","extra":{"query_type":"domain","confidence":0.91}}

  event: tool_result
  data: {"trace_id":"t-123","step":4,"content":"RAG: 找到3条相关资料","extra":{"status":"ok","preview":"..."}}

  event: final
  data: {"trace_id":"t-123","step":10,"content":"最终回答...","extra":{"route":"agent_workflow","fallback_triggered":false}}
  ```

## 3. 总体方案
- 新增 SSE 客户端，解析事件流并写入状态；默认走流式，失败时自动降级到一次性接口。
- UI 将思考事件作为“思考轨迹”分块展示：路由决策、记忆注入、工具调用/结果、LLM 思考、兜底提示、最终答案。
- 引入“停止生成”与断线检测：支持 AbortController/关闭流，流结束或错误时恢复可发送状态。
- 可选开关：通过环境变量控制是否启用思考流、端点路径、是否展示 heartbeat。

## 4. 详细改造项
1) 配置与类型  
   - `src/config/index.ts`：新增 `thinkingStreamEndpoint`（默认 `/api/react_stream`）、`enableThinkingStream`、`streamHeartbeatTimeout`、`toolPreviewMaxLen`、`sseRetry` 等配置，映射到 `.env.*`（如 `VITE_THINKING_STREAM_ENDPOINT`、`VITE_ENABLE_THINKING_STREAM`）。  
   - `src/types/api.ts`：新增 `ThinkingEventType` 联合类型、`ThinkingEvent` 接口（含通用字段 + `extra` 的结构化子字段）、`StreamResponse`/`FinalEvent` 类型。  
   - `src/types/message.ts`：为 Message 增加可选 `traceId`、`thinkingEvents`（按 step 排序的事件列表）、`route`、`fallback_triggered`、`streaming` 状态标记。

2) 服务层（SSE 客户端）  
   - `src/services/chatApi.ts`：保留 `sendMessage`，新增 `streamMessage(request)`：使用 `fetch` + `ReadableStream` 解析 SSE（原生 EventSource 不支持 POST）；支持传入 AbortController 以便“停止生成”。  
   - 实现通用 `parseSseChunk` 工具：按 `\n\n` 切分，兼容 `event:`/`data:` 行；过滤空行、无效 JSON，提供心跳忽略策略。  
   - 网络错误与 401/403 处理：在首包或连接中断时抛出明确错误，用于 UI 提示和降级。

3) 状态管理  
   - `chatStore`：新增 `streamingMessageId`、`streamStatus`（idle/connecting/streaming/ended/error）、`thinkingEvents` 映射（traceId => 事件列表）、`setStreamStatus`、`appendThinkingEvent`、`updateAssistantMessage` 等方法。  
   - 考虑是否独立 `thinkingStore`（若与消息状态耦合过多则共用 chatStore，以简化 Message 绑定）。  
   - 为“停止生成”提供 `cancelStream(traceId)`，在 hook 内绑定 AbortController。

4) Hooks  
   - 新增 `useThinkingStream`：接收请求参数、回调（onEvent/onFinal/onError/onComplete）、abort 控制；负责调用 `chatApi.streamMessage` 并顺序分发事件。  
   - 改造 `useChat`：优先尝试流式；流程：  
     - 添加用户消息 → 添加助手占位消息（附 traceId/streaming 标记）。  
     - 调用 `useThinkingStream`，接收事件：`thought`/`router`/`memory`/`tool_*` 推入 `thinkingEvents`；`final` 更新占位消息内容并清理流态；`error` 展示错误并清理。  
     - 若流式失败且配置允许，自动切换 `sendMessage` 一次性接口并提示“已降级”。  
   - 在 hook 层处理 `heartbeat` 超时（无事件超过阈值则提示网络异常并中断）。

5) 组件与 UI  
   - `MessageList/MessageItem`：支持展示关联的 `thinkingEvents`，提供折叠/展开；流式回答时显示打字动画。  
   - 新增 `ThinkingTimeline` 组件：按 step 渲染事件，区分类型（路由/记忆/思考/工具/兜底/最终），展示 `extra` 关键字段（如工具名、耗时、preview、confidence）。  
   - `InputBox`：增加“停止生成”按钮绑定 AbortController；发送按钮在 streaming 中禁用。  
   - 全局提示：在顶部或消息内嵌提示“已切换为一次性响应”“连接中断，请重试”等。  
   - Loading 交互：connecting 状态显示“正在建立思考流...”，streaming 状态显示实时点动/波形。  
   - 兼容移动端：思考轨迹可折叠为抽屉式，桌面端侧栏/卡片式。

6) 错误与异常场景  
   - SSE 连接失败：展示 toast + 降级；保留用户消息，清理占位助手消息。  
   - `error` 事件：在对应消息下展示错误态，允许重试。  
   - 断线/超时：监听 `request.is_disconnected` 对应的前端信号（reader 报错或心跳超时），自动结束流并解锁输入。  
   - JSON 解析失败或未知事件类型：记录日志，跳过该事件，不阻断流。

7) 安全与脱敏（前端侧）  
   - 渲染前对 `content` 做长度截断（使用配置 `toolPreviewMaxLen`），防止极长工具输出撑爆 UI。  
   - Markdown 渲染沿用 sanitize；事件中的 URL/代码块同样通过已有 MarkdownRenderer。

## 5. 交互细节
- 思考轨迹呈现：  
  - 路由决策：显示“已路由到 Agent/LLM”+ 置信度。  
  - 工具调用/结果：图标+标题+耗时/状态，失败显示错误原因。  
  - 思考文本：逐条追加，支持自动滚动至最新。  
  - 兜底与最终答案：在同一消息卡片内，兜底标红/橙，final 以正常气泡展示。  
- 停止生成：点击后立即调用 AbortController，UI 变为“已停止，您可以继续提问”；保留已收到的内容。  
- 降级提示：当 SSE 不可用时，弹出提醒并切换到非流式模式。  
- 重试：在错误态的助手消息上提供“重试”按钮（复用 `retryMessage`，走流式路径）。

## 6. 测试计划
- 单测：`parseSseChunk` 行为、事件排序/去重（按 `step`）、心跳超时逻辑、降级分支。  
- 组件测试（Testing Library）：  
  - Streaming 序列渲染：模拟事件流，断言思考轨迹和最终答案显示。  
  - 停止生成：触发 abort，验证 UI 解锁且不再追加事件。  
  - 错误事件：显示错误提示并允许重试。  
- 集成/手动：在本地起后端 SSE，验证 event 顺序、断线恢复、移动端折叠交互。

## 7. 里程碑与交付
- M1：配置与类型定义、SSE 客户端与解析工具完成（本地日志验证事件接收）。  
- M2：`useChat`/store 改造完成，能在界面展示基础思考轨迹与流式答案。  
- M3：完善 UI/交互（停止生成、折叠/展开、降级提示），移动端适配。  
- M4：补充测试与文档，默认开启流式（可通过 env 关闭），整理使用指南。

## 8. 风险与待决
- 后端 SSE 是否强制 POST：若仅支持 GET，需要将请求参数拼接为 query string；前端方案需根据实际后端实现调整。  
- 心跳或长时间工具调用可能导致前端误判超时：需要与后端协商 heartbeat 间隔与最大静默时长。  
- 大字段 preview 若仍过长需进一步压缩/截断策略。  
- 浏览器兼容性：`fetch + ReadableStream` 在旧版 Safari 需验证；必要时引入 polyfill 或降级为一次性接口。
