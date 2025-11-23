import React, { useEffect, useRef } from 'react';
import { Edit, Share2, QrCode, Trash2, Plus, FolderPlus, Image, ArrowUp, ArrowDown, FolderPen, Pin, PinOff } from 'lucide-react';
import { ContextMenuType } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  type: ContextMenuType;
  onClose: () => void;
  isPinned?: boolean;
  actions: {
    onEdit?: () => void;
    onShare?: () => void;
    onQrCode?: () => void;
    onDelete?: () => void;
    onNewBookmark?: () => void;
    onNewCategory?: () => void;
    onChangeBg?: () => void;
    onReorder?: () => void;
    onPin?: () => void;
  };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, type, onClose, isPinned, actions }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Prevent menu from going off screen
  const adjustedX = Math.min(x, window.innerWidth - 190);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  const MenuItem = ({ icon: Icon, label, onClick, danger = false, separator = false }: any) => {
    if (separator) return <div className="my-1 border-t border-neutral-800" />;
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
          onClose();
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors text-left group rounded-[2px]
          ${danger 
            ? 'text-red-400 hover:bg-red-500/10' 
            : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
          }`}
      >
        <Icon size={14} className={danger ? "text-red-400" : "text-neutral-500 group-hover:text-neutral-300"} />
        {label}
      </button>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'bookmark':
        return (
          <>
            <MenuItem 
              icon={isPinned ? PinOff : Pin} 
              label={isPinned ? "Unpin Bookmark" : "Pin Bookmark"} 
              onClick={actions.onPin} 
            />
            <MenuItem separator />
            <MenuItem icon={Edit} label="Edit" onClick={actions.onEdit} />
            <MenuItem icon={Share2} label="Share" onClick={actions.onShare} />
            <MenuItem icon={QrCode} label="QR Code" onClick={actions.onQrCode} />
            <MenuItem separator />
            <MenuItem icon={Trash2} label="Delete" onClick={actions.onDelete} danger />
          </>
        );
      case 'sidebar_category': // Right click on an existing category
        return (
          <>
             <MenuItem icon={FolderPlus} label="New Sub-Category" onClick={actions.onNewCategory} />
             <MenuItem separator />
            <MenuItem icon={FolderPen} label="Rename" onClick={actions.onEdit} />
            <MenuItem icon={ArrowUp} label="Move Up" onClick={actions.onReorder} />
            <MenuItem separator />
            <MenuItem icon={Trash2} label="Delete Category" onClick={actions.onDelete} danger />
          </>
        );
      case 'sidebar_canvas': // Right click on empty sidebar space
        return (
           <>
            <MenuItem icon={FolderPlus} label="New Root Category" onClick={actions.onNewCategory} />
            <MenuItem icon={ArrowDown} label="Sort A-Z" onClick={actions.onReorder} />
           </>
        );
      case 'canvas':
        return (
          <>
            <MenuItem icon={Plus} label="New Bookmark" onClick={actions.onNewBookmark} />
            <MenuItem icon={Image} label="Change Background" onClick={actions.onChangeBg} />
            <MenuItem separator />
            <MenuItem icon={FolderPlus} label="New Category" onClick={actions.onNewCategory} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-48 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-[4px] shadow-2xl p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedX, top: adjustedY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {renderContent()}
    </div>
  );
};