
import React, { useState, useEffect } from 'react';
import { type Keyword } from '../types';
import ContextMenu from './ContextMenu';

interface KeywordListProps {
  keywords: Keyword[];
  onUpdateKeywords: (keywords: string[]) => void;
  onResetKeywords: () => void;
  onDeleteKeyword: (keyword: string) => void;
  onResetKeywordCount: (keyword: string) => void;
  onEditKeyword: (originalKeyword: string, newKeyword: string) => void;
}

const KeywordList: React.FC<KeywordListProps> = ({ 
  keywords, 
  onUpdateKeywords, 
  onResetKeywords,
  onDeleteKeyword,
  onResetKeywordCount,
  onEditKeyword,
}) => {
  const [inputText, setInputText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; keyword: Keyword } | null>(null);
  const [editingState, setEditingState] = useState<{ keyword: string; value: string } | null>(null);

  const handleUpdateClick = () => {
    const newKeywords = inputText.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    if (newKeywords.length > 0) {
      onUpdateKeywords(newKeywords);
    } else {
      onResetKeywords();
    }
  };

  const handleResetClick = () => {
    onResetKeywords();
    setInputText('');
  };

  const handleContextMenu = (event: React.MouseEvent, keyword: Keyword) => {
    event.preventDefault();
    setEditingState(null); // Close any active editor
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      keyword: keyword,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => {
      closeContextMenu();
    };
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const handleEdit = () => {
    if (contextMenu) {
      const { keyword } = contextMenu;
      let editValue = keyword.keyword;
      if (keyword.target > 1) {
        editValue = `${keyword.keyword}:${keyword.target}`;
      }
      setEditingState({ 
        keyword: keyword.keyword, 
        value: editValue,
      });
      closeContextMenu();
    }
  };
  
  const handleDelete = () => {
    if (contextMenu) {
      onDeleteKeyword(contextMenu.keyword.keyword);
      closeContextMenu();
    }
  };

  const handleResetCount = () => {
    if (contextMenu) {
      onResetKeywordCount(contextMenu.keyword.keyword);
      closeContextMenu();
    }
  };

  const handleSaveEdit = () => {
    if (editingState) {
      onEditKeyword(editingState.keyword, editingState.value);
      setEditingState(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingState(null);
  };
  
  return (
    <div className="bg-[#1C1C1E] border border-gray-800 rounded-lg h-full flex flex-col">
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReset={handleResetCount}
        />
      )}
      <h2 className="text-gray-100 font-semibold p-4 border-b border-gray-800">Monitored Keywords</h2>
      <div className="overflow-y-auto flex-grow p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="pb-2 font-medium">Keyword Checklist</th>
              <th className="pb-2 font-medium text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((keyword) => (
              editingState?.keyword === keyword.keyword ? (
                <tr key={`${keyword.keyword}-editing`}>
                  <td colSpan={2} className="py-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editingState.value}
                        onChange={(e) => setEditingState({ ...editingState, value: e.target.value })}
                        className="bg-gray-900 border border-gray-700 w-full p-1.5 text-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 text-xl font-bold">✓</button>
                      <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-400 text-xl font-bold">✗</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr 
                  key={keyword.keyword} 
                  className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-context-menu ${keyword.isMentioned ? 'animate-highlight' : ''}`}
                  onContextMenu={(e) => handleContextMenu(e, keyword)}
                >
                  <td className="py-2 text-gray-300">{keyword.keyword}</td>
                  <td className={`py-2 text-right font-semibold font-mono ${
                      keyword.count >= keyword.target ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {keyword.count}/{keyword.target}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-800">
        <h3 className="text-gray-200 font-medium mb-2">Customize Keyword List</h3>
        <textarea
          className="bg-gray-900 border border-gray-700 w-full p-2 text-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          placeholder="e.g., TRUMP:8, 5+ BIDEN, AI+++, ELECTION"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          aria-label="Custom keywords input"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleUpdateClick}
            className="bg-blue-600 text-white font-bold py-2 px-3 rounded-md hover:bg-blue-500 transition-colors duration-200 flex-grow text-xs"
          >
            UPDATE LIST
          </button>
          <button
            onClick={handleResetClick}
            className="bg-gray-600 text-gray-200 font-bold py-2 px-3 rounded-md hover:bg-gray-500 transition-colors duration-200 flex-grow text-xs"
          >
            RESET TO DEFAULT
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeywordList;