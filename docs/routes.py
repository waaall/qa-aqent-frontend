"""
FastAPI 路由
"""
import os
import re
import uuid
import logging
from typing import Optional
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from pydantic import BaseModel

from llama_index.core.llms import ChatMessage

from src.utils.config import get_config_value, load_config
from src.agent.react_agent import LlamaAgentsRoutingAgent
from src.services.vector_store import VectorStoreService
from src.services.chat_store_service import ChatStoreService
from src.utils.ingestion_handler import IngestionHandler


logger = logging.getLogger(__name__)


# 自定义异常类
class PreprocessingError(Exception):
    """预处理阶段错误"""
    pass


class IndexingError(Exception):
    """索引阶段错误"""
    pass


router = APIRouter()

# 全局实例
react_agent: Optional[LlamaAgentsRoutingAgent] = None

# 文档索引任务状态存储（简单实现，生产环境建议使用 Redis）
indexing_tasks = {}
# 向量索引更新任务状态存储（简单实现，生产环境建议使用 Redis）
update_tasks = {}
LABEL_PATTERN = re.compile(r'^[A-Za-z0-9._-]+$')


def get_react_agent() -> LlamaAgentsRoutingAgent:
    """获取 LlamaAgents 路由代理实例（懒加载）"""
    global react_agent
    if react_agent is None:
        react_agent = LlamaAgentsRoutingAgent()
    return react_agent


def get_chat_store_service() -> ChatStoreService:
    """获取 ChatStore 服务实例"""
    return ChatStoreService.get_instance()


def index_document_background(
    task_id: str,
    filepath: str,
    filename: str,
    label: str,
    processed_docs_root: str
):
    """
    后台索引任务（支持预处理）

    Args:
        task_id: 任务ID
        filepath: 文件路径
        filename: 文件名
        label: 标签名（用于目录分组）
        processed_docs_root: 预处理文档根目录
    """
    try:
        file_ext = Path(filepath).suffix.lower()
        task = indexing_tasks[task_id]
        processed_filepath = filepath
        processed_docs_root = processed_docs_root or get_config_value(
            'vector_store.processed_docs', './data/processed_docs'
        )

        # === 阶段 1: 预处理（仅 PDF） ===
        if file_ext == '.pdf':
            task['status'] = 'preprocessing'
            task['stage'] = '正在预处理 PDF 文档'
            task['progress']['preprocessing'] = 'in_progress'
            logger.info(f"[{task_id}] 开始预处理: {filename}")

            try:
                ingestion_service = IngestionHandler.get_instance()
                output_dir = os.path.join(processed_docs_root, label)
                os.makedirs(output_dir, exist_ok=True)
                preprocess_result = ingestion_service.preprocess_single_file(
                    input_file=filepath,
                    output_dir=output_dir
                )

                if preprocess_result['status'] == 'success':
                    task['progress']['preprocessing'] = 'completed'
                    processed_filepath = preprocess_result['markdown_path']
                    logger.info(f"[{task_id}] 预处理成功: {processed_filepath}")
                else:
                    # 预处理失败 - 直接终止
                    raise PreprocessingError(preprocess_result.get('message', 'Unknown error'))

            except Exception as e:
                task['status'] = 'failed'
                task['stage'] = '预处理失败'
                task['progress']['preprocessing'] = 'failed'
                task['errors'].append({
                    'stage': 'preprocessing',
                    'message': str(e),
                    'timestamp': datetime.now().isoformat()
                })
                logger.error(f"[{task_id}] 预处理失败: {e}", exc_info=True)
                return  # 终止任务

        elif file_ext == '.md':
            task['progress']['preprocessing'] = 'skipped'
            logger.info(f"[{task_id}] Markdown 文件，跳过预处理")

        # === 阶段 2: 索引 ===
        task['status'] = 'indexing'
        task['stage'] = '正在构建索引'
        task['progress']['indexing'] = 'in_progress'
        logger.info(f"[{task_id}] 开始索引: {processed_filepath}")

        try:
            ingestion_service = IngestionHandler.get_instance()
            result = ingestion_service.build_index(
                directory=processed_docs_root,
                input_files=[processed_filepath],
                rebuild=False,
                check_duplicates=True
            )

            if result.get('success'):
                task['status'] = 'completed'
                task['stage'] = '索引构建完成'
                task['progress']['indexing'] = 'completed'
                task['doc_count'] = result['documents_processed']
                task['total_count'] = result['total_document_count']
                task['mode'] = result['mode']
                task['completed_at'] = datetime.now().isoformat()
                logger.info(f"[{task_id}] 索引完成")
            else:
                raise IndexingError(result.get('message', 'Unknown error'))

        except Exception as e:
            task['status'] = 'failed'
            task['stage'] = '索引失败'
            task['progress']['indexing'] = 'failed'
            task['errors'].append({
                'stage': 'indexing',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
            logger.error(f"[{task_id}] 索引失败: {e}", exc_info=True)

    except Exception as e:
        # 捕获未预期的异常
        task['status'] = 'failed'
        task['stage'] = '任务执行异常'
        task['errors'].append({
            'stage': 'unknown',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        })
        logger.error(f"[{task_id}] 任务异常: {e}", exc_info=True)


def update_index_background(task_id: str, processed_docs_root: str) -> None:
    """
    后台更新索引任务

    Args:
        task_id: 任务ID
        processed_docs_root: 预处理文档根目录
    """
    task = update_tasks.get(task_id)
    if task is None:
        logger.error(f"[{task_id}] 更新任务不存在，无法执行")
        return

    try:
        ingestion_service = IngestionHandler.get_instance()
        vector_service = VectorStoreService.get_instance()

        task['status'] = 'loading'
        task['stage'] = '正在加载文档'
        task['progress']['loading'] = 'in_progress'
        logger.info(f"[{task_id}] 开始加载文档: {processed_docs_root}")

        documents = ingestion_service.load_documents(
            directory=processed_docs_root,
            use_processed=True
        )
        task['documents_loaded'] = len(documents)
        task['progress']['loading'] = 'completed'

        if not documents:
            task['status'] = 'completed'
            task['stage'] = '没有可更新的文档'
            task['progress']['updating'] = 'skipped'
            task['result'] = {
                'success': True,
                'mode': 'skipped',
                'documents_checked': 0,
                'documents_added': 0,
                'message': '没有可更新的文档'
            }
            task['completed_at'] = datetime.now().isoformat()
            return

        task['status'] = 'updating'
        task['stage'] = '正在检查并更新索引'
        task['progress']['updating'] = 'in_progress'
        logger.info(f"[{task_id}] 开始更新索引")

        documents = ingestion_service.enrich_metadata(documents, processed_docs_root)
        result = vector_service.update_index(documents)

        task['status'] = 'completed'
        task['stage'] = '更新完成'
        task['progress']['updating'] = 'completed'
        task['result'] = result
        task['completed_at'] = datetime.now().isoformat()
        logger.info(f"[{task_id}] 更新完成")

    except Exception as e:
        task['status'] = 'failed'
        task['stage'] = '更新失败'
        if task.get('progress'):
            task['progress']['loading'] = task['progress'].get('loading') or 'failed'
            task['progress']['updating'] = task['progress'].get('updating') or 'failed'
        task['errors'].append({
            'stage': 'updating',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        })
        logger.error(f"[{task_id}] 更新失败: {e}", exc_info=True)


# ========== 请求/响应模型 ==========

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    query_type: Optional[str] = None
    create_session: bool = True
    db_name: Optional[str] = None
    db_source: Optional[str] = None
    api_name: Optional[str] = None


class ReactQueryRequest(BaseModel):
    query: str
    reset: bool = False


class ChatWithContextRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    reset: bool = False


# ========== 文档上传 ==========
@router.post('/upload')
async def upload_document(
    file: UploadFile = File(...),
    label: str = Form('general'),
    background_tasks: BackgroundTasks = None
):
    """
    上传文档到知识库（异步索引版本，支持预处理）

    改进：
    - PDF 文件强制预处理（MinerU）
    - Markdown 文件跳过预处理，直接索引
    - 其他格式拒绝上传
    - 异步后台任务，分阶段报告进度

    返回:
    - task_id: 索引任务ID
    - 使用 GET /api/upload/status/{task_id} 查询任务状态
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail='文件名为空')

        # 文件类型验证
        SUPPORTED_EXTENSIONS = {'.pdf', '.md'}
        REJECTED_EXTENSIONS = {'.docx', '.txt', '.doc', '.pptx', '.ppt'}

        file_ext = Path(file.filename).suffix.lower()

        if file_ext in REJECTED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f'不支持的文件格式 {file_ext}，当前仅支持 PDF 和 Markdown 文件'
            )

        if file_ext not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f'未知文件格式 {file_ext}，请上传 .pdf 或 .md 文件'
            )

        if not label:
            label = 'general'
        if not LABEL_PATTERN.fullmatch(label) or label in {'.', '..'}:
            raise HTTPException(
                status_code=400,
                detail='label 仅支持字母/数字/.-_，不允许中文或空格'
            )

        # 保存文件
        from werkzeug.utils import secure_filename
        filename = secure_filename(file.filename)
        documents_root = get_config_value('vector_store.documents', './data/documents')
        processed_docs_root = get_config_value(
            'vector_store.processed_docs', './data/processed_docs'
        )
        upload_root = processed_docs_root if file_ext == '.md' else documents_root
        upload_dir = os.path.join(upload_root, label)
        os.makedirs(upload_dir, exist_ok=True)

        filepath = os.path.join(upload_dir, filename)

        # 写入文件
        content = await file.read()
        with open(filepath, 'wb') as f:
            f.write(content)

        logger.info(f"文件上传成功: {filename}")

        # 创建后台索引任务（新增字段）
        task_id = str(uuid.uuid4())
        indexing_tasks[task_id] = {
            'status': 'pending',
            'stage': None,
            'filename': filename,
            'file_type': file_ext,
            'label': label,
            'needs_preprocessing': file_ext == '.pdf',
            'created_at': datetime.now().isoformat(),
            'progress': {
                'preprocessing': None,  # None | 'in_progress' | 'completed' | 'failed' | 'skipped'
                'indexing': None
            },
            'errors': []
        }

        # 添加后台任务
        background_tasks.add_task(
            index_document_background,
            task_id,
            filepath,
            filename,
            label,
            processed_docs_root
        )

        return {
            'success': True,
            'message': '文件上传成功，正在后台处理',
            'task_id': task_id,
            'filename': filename,
            'file_type': file_ext,
            'label': label,
            'status_url': f'/api/upload/status/{task_id}'
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件上传错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/upload/status/{task_id}')
async def get_upload_status(task_id: str):
    """
    查询上传索引任务状态

    Args:
        task_id: 任务ID

    返回:
        任务状态信息
    """
    if task_id not in indexing_tasks:
        raise HTTPException(status_code=404, detail='任务不存在')

    return {
        'success': True,
        'task_id': task_id,
        **indexing_tasks[task_id]
    }


# ========== 索引更新 ==========
@router.post('/update_index')
async def update_index(background_tasks: BackgroundTasks = None):
    """
    检查并更新向量索引（后台任务）
    """
    try:
        processed_docs_root = get_config_value(
            'vector_store.processed_docs', './data/processed_docs'
        )
        task_id = str(uuid.uuid4())
        update_tasks[task_id] = {
            'status': 'pending',
            'stage': None,
            'created_at': datetime.now().isoformat(),
            'progress': {
                'loading': None,   # None | 'in_progress' | 'completed' | 'failed'
                'updating': None   # None | 'in_progress' | 'completed' | 'failed' | 'skipped'
            },
            'documents_loaded': 0,
            'result': None,
            'errors': []
        }

        background_tasks.add_task(
            update_index_background,
            task_id,
            processed_docs_root
        )

        return {
            'success': True,
            'message': '索引更新任务已提交',
            'task_id': task_id,
            'status_url': f'/api/update_index/status/{task_id}'
        }

    except Exception as e:
        logger.error(f"更新索引失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/update_index/status/{task_id}')
async def get_update_index_status(task_id: str):
    """
    查询索引更新任务状态

    Args:
        task_id: 任务ID

    返回:
        任务状态信息
    """
    if task_id not in update_tasks:
        raise HTTPException(status_code=404, detail='任务不存在')

    return {
        'success': True,
        'task_id': task_id,
        **update_tasks[task_id]
    }


# ========== 聊天接口 ==========
@router.post('/chat/debug')
async def chat_with_context_debug(request: ChatWithContextRequest):
    """
    支持多轮对话的聊天接口（使用 Context 机制）

    请求体:
    - query: 用户问题
    - session_id: 可选，会话ID（用于恢复历史对话）
    - reset: 可选，true 时重置会话

    返回:
    - success: 是否成功
    - session_id: 会话ID（用于后续请求）
    - answer: 回答内容
    - raw: 原始响应（可选）
    """
    from opentelemetry import context, trace
    from opentelemetry.trace import Status, StatusCode
    from openinference.semconv.trace import SpanAttributes

    tracer = trace.get_tracer(__name__)
    span = tracer.start_span("api.chat")
    ctx_token = context.attach(trace.set_span_in_context(span))

    # 0. Phoenix Input：用户输入
    span.set_attribute(SpanAttributes.INPUT_VALUE, request.query)
    logger.debug("===================== phoenix处理用户输入============================")

    try:
        return await chat_with_context(request)
    except HTTPException as exc:
        span.record_exception(exc)
        span.set_status(Status(StatusCode.ERROR, str(exc.detail)))
        raise
    except Exception as e:
        span.record_exception(e)
        span.set_status(Status(StatusCode.ERROR, str(e)))
        logger.error(f"Chat 接口错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        context.detach(ctx_token)
        span.end()


@router.post('/chat')
async def chat_with_context(request: ChatWithContextRequest):
    """
    支持多轮对话的聊天接口（使用 ChatStore 对话历史）

    请求体:
    - query: 用户问题
    - session_id: 可选，会话ID（用于恢复历史对话）
    - reset: 可选，true 时重置会话

    返回:
    - success: 是否成功
    - session_id: 会话ID（用于后续请求）
    - answer: 回答内容
    - raw: 原始响应（可选）
    """
    try:
        agent = get_react_agent()
        chat_store_service = get_chat_store_service()

        # 1. 处理 reset 或创建新会话
        if request.reset:
            if request.session_id:
                archived = chat_store_service.archive_session(request.session_id, force=True)
                if not archived:
                    logger.warning(
                        "历史会话归档失败或不存在: %s",
                        request.session_id,
                    )
                # 清除 ChatStore 历史
                chat_store_service.clear_session(request.session_id)
            session_id = str(uuid.uuid4())
            ctx = None  # 单轮 Context
            logger.info(f"创建新会话: {session_id}")
        else:
            if not request.session_id:
                raise HTTPException(
                    status_code=400,
                    detail='需要 session_id 或 reset=true 创建新会话'
                )
            session_id = request.session_id
            ctx = None

        # 2. 加载 ChatMemoryBuffer（用于对话历史，不包含当前问题）
        config = load_config()
        token_limit = config.get('chat_store', {}).get('token_limit', 3000)
        chat_memory = chat_store_service.get_chat_memory(session_id, token_limit=token_limit)

        # 3. 调用带 Context 和 ChatMemory 的查询方法（此时 ChatStore 中还没有当前问题）
        result, _ = await agent.aquery_with_context(
            request.query,
            ctx,
            chat_memory=chat_memory
        )

        # 4. Agent 完成后，再添加用户消息和助手回答到 ChatStore
        user_msg = ChatMessage(role="user", content=request.query)
        chat_store_service.add_message(session_id, user_msg)

        assistant_msg = ChatMessage(role="assistant", content=result.get('answer', ''))
        chat_store_service.add_message(session_id, assistant_msg)

        return {
            'success': True,
            'session_id': session_id,
            'answer': result.get('answer'),
            'raw': str(result.get('raw_response', '')),
            'enhancement_applied': result.get('enhancement_applied', False),
            'matched_entries': result.get('matched_entries', 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat 接口错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ========== ChatStore 管理接口 ==========

@router.get('/chat/{session_id}/history')
async def get_chat_history(session_id: str, limit: int = Query(50, ge=1, le=100)):
    """
    获取会话对话历史

    Args:
        session_id: 会话ID
        limit: 返回消息数量限制（默认50，最多100）

    Returns:
        对话历史列表
    """
    try:
        chat_store_service = get_chat_store_service()
        messages = chat_store_service.get_messages(session_id, limit=limit)

        # 转换为可序列化的格式
        history = [
            {
                'role': msg.role,
                'content': msg.content,
                'additional_kwargs': msg.additional_kwargs
            }
            for msg in messages
        ]

        return {
            'success': True,
            'session_id': session_id,
            'message_count': len(history),
            'history': history
        }

    except Exception as e:
        logger.error(f"获取对话历史失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/chat/{session_id}/info')
async def get_session_info(session_id: str):
    """
    获取会话元数据

    Args:
        session_id: 会话ID

    Returns:
        会话信息（创建时间、最后访问时间、消息数等）
    """
    try:
        chat_store_service = get_chat_store_service()
        info = chat_store_service.get_session_info(session_id)

        if info is None:
            raise HTTPException(status_code=404, detail='会话不存在')

        return {
            'success': True,
            'info': info
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取会话信息失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/chat/{session_id}/history')
async def clear_chat_history(session_id: str):
    """
    清除会话对话历史（保留 Context）

    Args:
        session_id: 会话ID

    Returns:
        操作结果
    """
    try:
        chat_store_service = get_chat_store_service()
        success = chat_store_service.clear_session(session_id)

        if not success:
            logger.warning(f"清除会话历史失败: {session_id}")

        return {
            'success': success,
            'session_id': session_id,
            'message': '对话历史已清除' if success else '清除失败'
        }

    except Exception as e:
        logger.error(f"清除对话历史失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/chat/cleanup-expired')
async def cleanup_expired_chat_sessions():
    """
    清理过期会话（管理员接口）

    Returns:
        清理的会话数量
    """
    try:
        chat_store_service = get_chat_store_service()
        cleaned_count = chat_store_service.cleanup_expired_sessions()

        return {
            'success': True,
            'cleaned_count': cleaned_count,
            'message': f'已清理 {cleaned_count} 个过期会话'
        }

    except Exception as e:
        logger.error(f"清理过期会话失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/chat/sessions/list')
async def list_all_sessions():
    """
    获取所有会话列表（管理员接口）

    Returns:
        所有会话的元数据列表
    """
    try:
        chat_store_service = get_chat_store_service()
        sessions = chat_store_service.get_all_sessions()

        return {
            'success': True,
            'total_count': len(sessions),
            'sessions': sessions
        }

    except Exception as e:
        logger.error(f"获取会话列表失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ========== 统计信息 ==========

@router.get('/stats')
async def stats():
    """获取系统统计信息"""
    try:
        vector_service = VectorStoreService.get_instance()
        vector_stats = vector_service.get_collection_stats()

        return {
            'success': True,
            'stats': {
                'vector_store': vector_stats,
                'version': '1.0.0'
            }
        }

    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== 数据库信息 ==========
@router.get('/database/info')
async def database_info(
    db_name: Optional[str] = Query(None),
    db_source: Optional[str] = Query(None)
):
    """获取数据库信息"""
    try:
        if db_source == 'clickhouse':
            from src.engines.clickhouse_engine import ClickHouseEngine
            engine = ClickHouseEngine(db_name)
        else:
            from src.engines.sql_engine import SQLEngine
            engine = SQLEngine(db_name)

        info = engine.get_table_info()

        return {
            'success': True,
            'info': info
        }

    except Exception as e:
        logger.error(f"获取数据库信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== 文档列表 ==========
@router.get('/documents')
async def list_documents():
    """列出已上传的文档"""
    try:
        documents_root = get_config_value('vector_store.documents', './data/documents')
        processed_docs_root = get_config_value(
            'vector_store.processed_docs', './data/processed_docs'
        )
        supported_extensions = {'.pdf', '.md'}
        files = []

        def collect_files(root_dir: str, storage: str) -> None:
            if not os.path.exists(root_dir):
                return

            for dirpath, _, filenames in os.walk(root_dir):
                for filename in filenames:
                    file_ext = Path(filename).suffix.lower()
                    if file_ext not in supported_extensions:
                        continue
                    filepath = os.path.join(dirpath, filename)
                    rel_path = os.path.relpath(filepath, root_dir)
                    path_parts = rel_path.split(os.sep)
                    label = path_parts[0] if len(path_parts) > 1 else 'general'
                    files.append({
                        'filename': filename,
                        'label': label,
                        'relative_path': rel_path,
                        'storage': storage,
                        'file_type': file_ext,
                        'size': os.path.getsize(filepath),
                        'modified': os.path.getmtime(filepath)
                    })

        collect_files(documents_root, 'documents')
        collect_files(processed_docs_root, 'processed_docs')

        return {
            'success': True,
            'documents': files,
            'count': len(files)
        }

    except Exception as e:
        logger.error(f"列出文档失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
