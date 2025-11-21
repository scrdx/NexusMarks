import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Tag, ChevronsLeft } from 'lucide-react';
import { Category } from '../types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string;
  editingCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent, id?: string) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onMoveCategory: (sourceId: string, targetId: string, position: 'inside' | 'before' | 'after' | 'append') => void;
}

interface TreeNodeProps {
  node: Category;
  selectedId: string;
  editingId: string | null;
  onSelect: (id: string) => void;
  depth: number;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onRename: (id: string, newName: string) => void;
  onMove: (sourceId: string, targetId: string, position: 'inside' | 'before' | 'after') => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, selectedId, editingId, onSelect, depth, onContextMenu, onRename, onMove 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editName, setEditName] = useState(node.name);
  
  // DnD State
  const [dropPosition, setDropPosition] = useState<'inside' | 'before' | 'after' | null>(null);
  
  const isEditing = editingId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename(node.id, editName);
    }
  };

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/react-dnd-id', node.id);
    e.dataTransfer.effectAllowed = 'move';
    // Set drag image or other properties if needed
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Zones: Top 25% (Before), Bottom 25% (After), Middle 50% (Inside)
    // We calculate this but DO NOT change DOM layout (margin/padding) based on it to avoid flickering
    let newPos: 'inside' | 'before' | 'after' = 'inside';
    
    if (y < height * 0.25) {
        newPos = 'before';
    } else if (y > height * 0.75) {
        newPos = 'after';
    }
    
    if (dropPosition !== newPos) {
        setDropPosition(newPos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const sourceId = e.dataTransfer.getData('application/react-dnd-id');
    if (sourceId && sourceId !== node.id && dropPosition) {
      onMove(sourceId, node.id, dropPosition);
    }
    setDropPosition(null);
  };

  return (
    <div className="select-none relative">
      <div
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          "flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors duration-200 group relative border border-transparent",
          isSelected ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
          // Use box-shadow or background for 'inside' highlight to avoid layout shift
          dropPosition === 'inside' ? "bg-indigo-500/20 ring-1 ring-indigo-500/50" : ""
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
      >
        {/* Absolute Positioned Drop Indicators - Zero Layout Shift */}
        {dropPosition === 'before' && (
           <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400 z-20 pointer-events-none shadow-[0_0_4px_rgba(129,140,248,0.8)]" />
        )}
        
        {dropPosition === 'after' && (
           <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 z-20 pointer-events-none shadow-[0_0_4px_rgba(129,140,248,0.8)]" />
        )}

        <div
          className="p-1 mr-1 rounded hover:bg-white/10 transition-colors"
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-[14px] inline-block" />
          )}
        </div>
        
        <div className="mr-2">
           {hasChildren ? (
             isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <Tag size={16} />
          )}
        </div>
        
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => onRename(node.id, editName)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-700 text-white text-sm px-1 py-0.5 rounded outline-none w-full border border-indigo-500"
          />
        ) : (
          <span className="text-sm font-medium truncate">{node.name}</span>
        )}
      </div>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                editingId={editingId}
                onSelect={onSelect}
                depth={depth + 1}
                onContextMenu={onContextMenu}
                onRename={onRename}
                onMove={onMove}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategoryId,
  editingCategoryId,
  onSelectCategory,
  isOpen,
  onToggle,
  onContextMenu,
  onRenameCategory,
  onMoveCategory
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [isRootDrop, setIsRootDrop] = useState(false);

  // Resize Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Constrain width between 200 and 600
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = 'default';
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Root Drop Logic
  const handleRootDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     if (e.currentTarget === e.target) {
        e.dataTransfer.dropEffect = 'move';
        if (!isRootDrop) setIsRootDrop(true);
     }
  };
  
  const handleRootDragLeave = (e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     if (e.currentTarget === e.target) {
         setIsRootDrop(false);
     }
  };

  const handleRootDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === e.target) {
          setIsRootDrop(false);
          const sourceId = e.dataTransfer.getData('application/react-dnd-id');
          if (sourceId) {
             onMoveCategory(sourceId, 'root', 'append');
          }
      }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? sidebarWidth : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-slate-900 border-r border-slate-800 overflow-hidden relative z-20 flex flex-col"
    >
      {/* Inner container maintains width while parent clips during collapse animation */}
      <div style={{ width: sidebarWidth }} className="h-full flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-indigo-400">
            <h1 className="text-xl font-bold text-white tracking-tight ml-2">Nexus Marks</h1>
          </div>
        </div>
        
        {/* Content List - Scrollbar Hidden */}
        <div 
          className="flex-1 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
               e.preventDefault();
               onContextMenu(e);
            }
          }}
          onDragOver={handleRootDragOver}
          onDragLeave={handleRootDragLeave}
          onDrop={handleRootDrop}
        >
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2 select-none">
            Collections
          </h3>
          {categories.map((category) => (
            <TreeNode
              key={category.id}
              node={category}
              selectedId={selectedCategoryId}
              editingId={editingCategoryId}
              onSelect={onSelectCategory}
              depth={0}
              onContextMenu={onContextMenu}
              onRename={onRenameCategory}
              onMove={onMoveCategory}
            />
          ))}

          {/* Visual Indicator for Drop to Root */}
          <div className={clsx(
              "h-0.5 rounded-full my-1 ml-2 w-full transition-all duration-200",
              isRootDrop ? "bg-indigo-500 opacity-100 shadow-[0_0_4px_rgba(129,140,248,0.8)]" : "bg-transparent opacity-0"
          )} />
        </div>

        {/* Bottom Control Bar - Full Width Button */}
        <div className="bg-slate-900 shrink-0">
          <button 
              onClick={onToggle}
              className="w-full py-4 flex items-center justify-center hover:bg-slate-800 text-slate-500 hover:text-white transition-colors border-t border-slate-800 group"
              title="Collapse Sidebar"
          >
              <ChevronsLeft size={22} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Resize Handle - only active when open */}
      {isOpen && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-indigo-500/50 cursor-col-resize z-50 transition-all duration-200"
          onMouseDown={handleResizeStart}
        />
      )}
    </motion.aside>
  );
};
