/**
 * 快捷键录制组件
 * 用于捕获用户按下的键盘组合
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';

interface ShortcutRecorderProps {
  /** 当前快捷键值 */
  value: string;
  /** 快捷键变化回调 */
  onChange: (shortcut: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 冲突提示 */
  conflictMessage?: string;
}

/**
 * 标准化按键事件为快捷键字符串
 */
function normalizeShortcut(event: KeyboardEvent): string | null {
  const parts: string[] = [];

  // 修饰键 - 对于"?"字符，不添加 Shift
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');

  // 特殊处理：'?' 字符
  // '?' 需要 Shift+/ 产生，但我们只存储 '?' 以保持简洁
  if (event.key === '?') {
    parts.push('?');
    // 提前返回，避免后续 Shift 检查
    return parts.join('+');
  }

  // 其他情况才添加 Shift
  if (event.shiftKey && event.key !== 'Shift') {
    parts.push('Shift');
  }

  // 主键
  if (['Escape', 'Enter', 'Tab', 'Space'].includes(event.key)) {
    parts.push(event.key);
  } else if (event.key.length === 1) {
    // 单字符按键（字母、数字、符号）
    parts.push(event.key.toUpperCase());
  } else {
    // 无效组合
    return null;
  }

  // 至少需要一个修饰键或特殊键
  if (parts.length < 2 && !['Escape', 'Tab', '?'].includes(event.key)) {
    return null;
  }

  return parts.join('+');
}

export function ShortcutRecorder({
  value,
  onChange,
  disabled = false,
  placeholder,
  conflictMessage
}: ShortcutRecorderProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [tempKey, setTempKey] = useState('');

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isRecording) return;

    event.preventDefault();
    event.stopPropagation();

    const shortcut = normalizeShortcut(event);

    if (shortcut) {
      setTempKey(shortcut);
      onChange(shortcut);

      // 录制成功后短暂延迟退出录制模式
      setTimeout(() => {
        setIsRecording(false);
        setTempKey('');
      }, 500);
    } else {
      // 无效组合,显示提示
      setTempKey(t('shortcuts.recorder.invalid', {}, 'Invalid combination'));
    }
  }, [isRecording, onChange, t]);

  // 注册/注销键盘监听
  useEffect(() => {
    if (isRecording) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isRecording, handleKeyDown]);

  // 开始录制
  const startRecording = () => {
    if (!disabled) {
      setIsRecording(true);
      setTempKey('');
    }
  };

  // 取消录制
  const cancelRecording = () => {
    setIsRecording(false);
    setTempKey('');
  };

  // 清除快捷键
  const clearShortcut = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* 快捷键显示/录制输入框 */}
        <div
          onClick={startRecording}
          className={`
            flex-1 px-3 py-2 rounded-lg border-2 font-mono text-sm
            transition-all cursor-pointer
            ${isRecording
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-800'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${conflictMessage ? 'border-red-500 dark:border-red-400' : ''}
          `}
        >
          {isRecording ? (
            <span className="text-primary-600 dark:text-primary-400 animate-pulse">
              {tempKey || t('shortcuts.recorder.pressKey', {}, 'Press any key combination...')}
            </span>
          ) : (
            <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
              {value || placeholder || t('shortcuts.recorder.placeholder', {}, 'Click to record')}
            </span>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {isRecording ? (
            <button
              onClick={cancelRecording}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title={t('common.cancel', {}, 'Cancel')}
            >
              ✕
            </button>
          ) : value ? (
            <button
              onClick={clearShortcut}
              disabled={disabled}
              className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('common.clear', {}, 'Clear')}
            >
              🗑️
            </button>
          ) : null}
        </div>
      </div>

      {/* 冲突提示 */}
      {conflictMessage && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠️</span>
          <span>{conflictMessage}</span>
        </p>
      )}

      {/* 帮助提示 */}
      {isRecording && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('shortcuts.recorder.hint', {}, 'Press Escape to cancel')}
        </p>
      )}
    </div>
  );
}
