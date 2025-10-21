import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReset: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onEdit, onDelete, onReset }) => {
  return (
    <div
      style={{ top: y, left: x }}
      className="absolute bg-gray-900 border border-gray-700 rounded-md p-1 z-20 text-gray-300 text-sm shadow-lg"
      // Stop propagation to prevent the window click listener in KeywordList from firing immediately
      onClick={(e) => e.stopPropagation()} 
    >
      <ul className="flex flex-col">
        <li className="hover:bg-gray-800 px-3 py-1.5 cursor-pointer whitespace-nowrap rounded-sm" onClick={onEdit}>
          Edit Keyword
        </li>
        <li className="hover:bg-gray-800 px-3 py-1.5 cursor-pointer whitespace-nowrap rounded-sm" onClick={onDelete}>
          Delete Keyword
        </li>
        <li className="hover:bg-gray-800 px-3 py-1.5 cursor-pointer whitespace-nowrap rounded-sm" onClick={onReset}>
          Reset Count
        </li>
      </ul>
    </div>
  );
};

export default ContextMenu;