/**
 * 智能推荐面板组件
 */

import { useState, useEffect } from 'react';
import { suggestionEngine } from '@/services/suggestion-engine';
import type { SyntaxSuggestion } from '@/types/suggestion';
import type { SearchParams, SearchHistory } from '@/types';

interface SuggestionPanelProps {
  keyword: string;
  currentParams: SearchParams;
  history: SearchHistory[];
  onApplySuggestion: (params: Partial<SearchParams>) => void;
}

export function SuggestionPanel({
  keyword,
  currentParams,
  history,
  onApplySuggestion
}: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<SyntaxSuggestion[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (keyword.trim()) {
      const newSuggestions = suggestionEngine.getSuggestions(
        keyword,
        currentParams,
        history
      );
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [keyword, currentParams, history]);

  if (suggestions.length === 0) return null;

  const handleApply = (suggestion: SyntaxSuggestion) => {
    onApplySuggestion(suggestion.appliedParams);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return '高度推荐';
    if (confidence >= 0.6) return '推荐';
    return '建议';
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'pattern': return '🎯';
      case 'history': return '📜';
      case 'context': return '🔍';
      case 'engine': return '⚙️';
      default: return '💡';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 mb-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">💡</span>
          <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
            智能推荐 ({suggestions.length})
          </h4>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-2 animate-slide-up">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
              onClick={() => handleApply(suggestion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{getTypeIcon(suggestion.type)}</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-gray-800 dark:text-gray-200">
                      {suggestion.preview}
                    </code>
                    <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {getConfidenceLabel(suggestion.confidence)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {suggestion.reason}
                  </p>
                </div>
                <button 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium ml-2 whitespace-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(suggestion);
                  }}
                >
                  应用
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
        ✨ 点击推荐项即可快速应用
      </div>
    </div>
  );
}
