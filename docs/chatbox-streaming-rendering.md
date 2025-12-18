# 流式渲染（含伪流式）与 Thinking/Reasoning 展示机制

本文档说明 Chatbox 在“生成回复”时，如何把模型的流式输出（以及在关闭流式时的伪流式输出）转成前端可逐步渲染的消息，并重点描述前端展示（Thinking 面板、计时器、增量更新与持久化）的实现。

---

## 术语与目标

### 术语

- **真流式（Streaming）**：上游（模型 API/SDK）边生成边推送增量片段（delta），前端实时更新 UI。
- **伪流式（Simulated Streaming）**：上游可能一次性返回完整结果，但通过中间件将其拆分成多个 delta 事件，从而让 UI 仍以“逐步更新”的方式渲染。
- **Reasoning/Thinking**：本项目内部统一用 `contentParts` 的 `type: 'reasoning'` 表示“思考内容”片段（可能来自 `<think>...</think>` 或供应商原生 thoughts）。

### 目标

- UI 能在生成过程中不断看到新增文本/工具调用/思考内容。
- 生成结束后，保留最终内容，并在需要时展示“思考耗时”。
- 在性能可控的前提下，保证消息内容能周期性持久化到本地存储。

---

## 关键数据结构（前端渲染的输入）

### `Message.contentParts`：统一的可渲染分片模型

消息内容不再只依赖单个 `content` 字符串，而是通过 `contentParts` 按类型分段：

- `text`：普通文本片段
- `reasoning`：思考片段（可带计时信息）
- `tool-call`：工具调用/结果
- `info`：系统提示信息（如 OCR/搜索提示）
- `image`：图片引用

类型定义见：`src/shared/types/session.ts`

其中 `reasoning` 片段结构：

```ts
// src/shared/types/session.ts
{ type: 'reasoning', text: string, startTime?: number, duration?: number }
```

### `Message.isStreamingMode`：是否“显示计时器”的开关

`ReasoningContentUI` 中计时器只在 `message.isStreamingMode === true` 时显示（避免伪流式/非流式下计时误导）。

该字段在生成开始时写入（常量语义）：

- `src/renderer/stores/sessionActions.ts` 中：`isStreamingMode: settings.stream !== false`

---

## 总体数据流（从“发送”到“逐步渲染”）

下面按调用链自上而下描述（UI → 生成包装层 → 模型层 → UI更新）。

### 1）UI 触发生成：创建占位 assistant 消息并进入 generating 状态

当用户发送消息后，会先插入用户消息，再插入一个“空白的 assistant 消息”作为占位，然后进入生成流程：

- `src/renderer/stores/sessionActions.ts`
  - `submitNewUserMessage()`：插入用户消息与占位 assistant 消息
  - `generate()`：将目标 assistant 消息标记为生成中（`generating: true`），并设置 `isStreamingMode`

此时 UI 立刻能渲染出一条“正在生成”的 assistant 消息气泡（即使内容还空）。

### 2）生成包装层：统一处理 tools / OCR / 系统提示，并对外提供 onResultChange

真正调用模型前，renderer 侧会走一层 `streamText()` 包装（注意：这是本项目自己的函数，不是 ai-sdk 的 `streamText`）：

- `src/renderer/packages/model-calls/stream-text.ts`
  - 创建 `AbortController`，生成 `cancel()` 并通过 `onResultChangeWithCancel` 先传给上层（用于 UI 取消生成）
  - 注入系统提示、组合 toolset、必要时做 OCR
  - 定义 `onResultChange`：把模型层的增量 `contentParts` 与 `infoParts` 合并后，再回调给 `sessionActions`

核心点：**从这里开始，上层（store/UI）只关心 `onResultChangeWithCancel`，不用关心底层各模型的流式细节。**

### 3）模型层：统一把“模型输出事件流”转成 `contentParts`

各 provider 最终都实现 `model.chat(...)`，并由 `AbstractAISDKModel` 统一消费 ai-sdk 的 `fullStream`：

- `src/shared/models/abstract-ai-sdk.ts`
  - `_callChatCompletion()`：当 `this.options.stream === false` 时，使用 `simulateStreamingMiddleware()` 包装模型（伪流式入口）
  - `handleStreamingCompletion()`：`for await (chunk of result.fullStream)` 持续读取事件
  - `processStreamChunk()`：把 `text-delta` / `reasoning-delta` / `tool-call` 等事件增量写入 `contentParts`
  - 每次处理完一个 chunk 后调用 `options.onResultChange?.({ contentParts })`

Reasoning 的关键行为：

- 收到 `reasoning-delta` 时创建/更新一个 `type: 'reasoning'` 的 part，并在第一次出现时写入 `startTime`
- 当从 reasoning 切换到 `text-delta` / `tool-call` / `tool-error` 等类型时，补齐该 reasoning part 的 `duration`
- 兜底：如果异常中断或结束时仍未写入 `duration`，`finalizeResult()` 会补一次

> 注意：这里的“伪流式”与“真流式”在 **下游表现一致**：都产生同样的 `fullStream` 事件序列、同样的 `onResultChange(contentParts)` 回调；区别只在于事件是否来自真实网络流。

### 4）store 层：把增量结果写入缓存，并周期性持久化

`sessionActions.generate()` 会把包装层的 `onResultChangeWithCancel` 接到 `modifyMessageCache()`：

- `src/renderer/stores/sessionActions.ts`
  - `modifyMessageCache(updated)`：合并增量字段到 `targetMsg`
  - 每个 chunk 都会更新 UI（写入 React Query 的 session cache）
  - 但仅每隔 `persistInterval = 2000ms` 才做一次持久化写入（降低 IO 压力）

持久化与缓存的区别在 `chatStore`：

- `updateMessageCache()`：只更新 query cache（高频）
- `updateMessage()`：更新 cache + 写入本地存储（低频）

对应实现见：

- `src/renderer/stores/chatStore.ts`：`updateSessionCache()` / `updateSessionWithMessages()`

### 5）React 渲染：Message 组件按 `contentParts` 类型渲染

最终 UI 渲染集中在：

- `src/renderer/components/Message.tsx`

其中对 `contentParts` 的渲染逻辑大致是：

- `reasoning` → `ReasoningContentUI`（折叠面板）
- `text` → Markdown 渲染或纯文本渲染
- `tool-call` → `ToolCallPartUI`
- 其他类型各自对应组件

此外，为兼容旧数据，`Message.tsx` 仍会优先检查 `msg.reasoningContent`（deprecated），并同样用 `ReasoningContentUI` 展示。

---

## 前端 Thinking 面板与计时器（重点）

Thinking/Reasoning UI 实现在：

- `src/renderer/components/message-parts/ToolCallPartUI.tsx`
  - `ReasoningContentUI`

### 1）“正在思考中”的判定

`ReasoningContentUI` 并不会对所有 reasoning part 都显示“Thinking 动画”，而是只对“最后一个 part 且消息仍在 generating”的 reasoning 生效：

- `message.generating === true`
- `part` 存在
- `message.contentParts[message.contentParts.length - 1] === part`

这样可以避免历史 reasoning 段落在生成过程中也被误标为“正在思考”。

### 2）计时器的来源与停止时机

- **开始时间**：模型层第一次创建 reasoning part 时写入 `part.startTime = Date.now()`（`AbstractAISDKModel.createOrUpdateReasoningPart()`）。
- **实时计时**：`useThinkingTimer(startTime, isThinking)` 以 100ms 频率更新 `elapsedTime`（`src/renderer/hooks/useThinkingTimer.ts`）。
- **停止计时**：当模型层切换到 `text-delta`/tool-call 等事件时，会写入 `part.duration = Date.now() - part.startTime`，之后 UI 会展示该固定值。

### 3）为什么伪流式/非流式不显示计时器？

计时器的显示由：

```ts
const shouldShowTimer = message.isStreamingMode === true
```

控制（`ReasoningContentUI`）。

原因是：

- 真流式下，`startTime → duration` 能较真实反映“模型思考阶段”的墙钟耗时。
- 伪流式/非流式下，delta 事件可能是“结果返回后再拆分”，用它来计时会产生误导，所以 UI 选择隐藏计时器，但仍可显示 reasoning 文本本身。

---

## 真流式 vs 伪流式：你会在 UI 上看到什么？

两者共同点：

- UI 都会不断收到 `contentParts` 的增量更新
- `Message.tsx` 都会逐步渲染文本/工具调用/思考面板

区别主要体现在：

- **计时器**：仅 `isStreamingMode === true` 时显示
- **主观感受**：伪流式可能“看起来像流”，但本质可能是结果到齐后拆分；真流式则会受到网络/模型推送节奏影响

伪流式入口（模型层）：

- `src/shared/models/abstract-ai-sdk.ts`：`simulateStreamingMiddleware()`（当 `this.options.stream === false`）

---

## 相关文件索引

### UI 渲染

- `src/renderer/components/Message.tsx`：按 `contentParts` 类型渲染消息（reasoning/text/tool-call 等）
- `src/renderer/components/message-parts/ToolCallPartUI.tsx`：`ReasoningContentUI`（Thinking 折叠面板与计时器）
- `src/renderer/hooks/useThinkingTimer.ts`：计时器 hook（100ms 更新）

### 生成与增量更新

- `src/renderer/stores/sessionActions.ts`：`generate()` / `modifyMessage()`（把增量写入 store；周期性持久化）
- `src/renderer/packages/model-calls/stream-text.ts`：renderer 侧生成包装（工具、OCR、onResultChange 合并）
- `src/renderer/stores/chatStore.ts`：React Query cache 与本地存储的更新策略（高频 cache、低频持久化）

### 模型层（流式/伪流式统一入口）

- `src/shared/models/abstract-ai-sdk.ts`：消费 `fullStream`，把 chunk 转为 `contentParts`，并回调 `onResultChange`
- `src/shared/models/openai.ts` / `src/shared/models/openai-compatible.ts`：`extractReasoningMiddleware({ tagName: 'think' })`（从 `<think>` 拆 reasoning）
- `src/shared/models/claude.ts` / `src/shared/models/gemini.ts`：通过 `providerOptions` 开启 thoughts/thinking（供应商原生能力）

