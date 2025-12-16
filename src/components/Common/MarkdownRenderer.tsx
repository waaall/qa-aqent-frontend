/**
 * Markdown 渲染组件
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = React.memo<MarkdownRendererProps>(
  ({ content, className }) => {
    // 自定义清理schema，允许代码高亮和安全的链接
    const sanitizeSchema = {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        code: ['className'], // 允许代码高亮class
        a: ['href', 'target', 'rel'],
      },
      protocols: {
        href: ['http', 'https', 'mailto'], // 禁止javascript:协议
      },
    };

    return (
      <div className={`${styles.markdown} ${className || ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeHighlight,
            [rehypeSanitize, sanitizeSchema], // 替换rehype-raw，防止XSS
          ]}
          components={{
            code({ node, className, children, ...props }) {
              const isInline = !node || node.position?.start.line === node.position?.end.line;
              return isInline ? (
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            table({ children }) {
              return (
                <div className={styles.tableWrapper}>
                  <table>{children}</table>
                </div>
              );
            },
            a: ({ href, children }) => {
              // 验证URL安全性
              const isValidUrl = /^https?:\/\//i.test(href || '');
              if (!isValidUrl) return <span>{children}</span>;

              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);

export default MarkdownRenderer;
