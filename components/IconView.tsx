import React, { useState, useRef, useLayoutEffect } from 'react';
import { Bookmark, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Layers, Pin } from 'lucide-react';
import clsx from 'clsx';
import { getTagColor } from '../constants';

interface IconViewProps {
  bookmarks: Bookmark[];
  categories: Category[];
  groupingEnabled: boolean;
  getCategoryName: (id: string) => string;
  onContextMenu: (e: React.MouseEvent, bookmarkId: string) => void;
}

export const IconView: React.FC<IconViewProps> = ({ 
  bookmarks, 
  categories,
  groupingEnabled, 
  getCategoryName,
  onContextMenu 
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Robust Hover Handling
  const handleMouseEnter = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setActiveId(id);
    triggerRef.current = e.currentTarget;
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveId(null);
      triggerRef.current = null;
    }, 200);
  };

  // Smart Positioning Logic
  useLayoutEffect(() => {
    if (activeId && triggerRef.current) {
       const rect = triggerRef.current.getBoundingClientRect();
       const popoverWidth = 256; // w-64
       const popoverHeight = 200; // Approx height
       const padding = 16;
       
       let top = rect.bottom + 10;
       let left = rect.left + (rect.width / 2) - (popoverWidth / 2);

       // Check Bottom Edge
       if (top + popoverHeight > window.innerHeight) {
          top = rect.top - popoverHeight - 10; // Flip to top
       }

       // Check Left Edge (Sidebar Collision)
       if (left < padding) {
          left = rect.right + 10; // Move to right side of icon
          top = rect.top; // Align top with icon
       }
       
       // Check Right Edge
       if (left + popoverWidth > window.innerWidth - padding) {
          left = rect.left - popoverWidth - 10; // Move to left side of icon
          top = rect.top;
       }
       
       setPopoverStyle({
          top: top,
          left: left,
          position: 'fixed',
          zIndex: 100
       });
    }
  }, [activeId]);

  const renderBookmark = (bookmark: Bookmark, index: number) => {
    const isActive = activeId === bookmark.id;
    
    return (
      <div 
        key={bookmark.id}
        className="relative flex flex-col items-center z-10"
        onMouseEnter={(e) => handleMouseEnter(bookmark.id, e)}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => onContextMenu(e, bookmark.id)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.01, duration: 0.2 }}
          className="cursor-pointer flex flex-col items-center gap-3 group py-2"
          onClick={() => window.open(bookmark.url, '_blank')}
        >
          {/* Icon Container - Sharper corners */}
          <div className={clsx(
            "relative w-12 h-12 sm:w-14 sm:h-14 bg-neutral-800 rounded-[6px] shadow-md overflow-hidden border transition-all duration-300",
            isActive ? "border-white/40 shadow-lg shadow-black/50 scale-105" : "border-white/5 group-hover:border-white/20"
          )}>
            <img 
              src={bookmark.iconUrl} 
              alt={bookmark.title} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            {bookmark.isPinned && (
              <div className="absolute top-0 right-0 bg-indigo-500/80 p-0.5 rounded-bl-[4px] shadow-sm">
                 <Pin size={8} className="text-white fill-white" />
              </div>
            )}
          </div>

          {/* Minimal Label */}
          <div className="w-20 text-center">
            <h3 className={clsx(
              "text-[10px] sm:text-[11px] font-medium truncate transition-colors",
              isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
            )}>
              {bookmark.title}
            </h3>
          </div>
        </motion.div>
      </div>
    );
  };

  // Separate component for Popover to use Portal conceptually via fixed position
  const renderPopover = () => {
     if (!activeId) return null;
     const bookmark = bookmarks.find(b => b.id === activeId);
     if (!bookmark) return null;

     return (
        <div 
           className="fixed z-[100] pointer-events-none" // pointer-events-none to let mouseLeave work on parent unless we bridge
           style={popoverStyle}
        >
           <motion.div
             initial={{ opacity: 0, y: 5, scale: 0.98 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, scale: 0.98 }}
             transition={{ duration: 0.15, ease: "easeOut" }}
             className="w-64 bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/80 rounded-[4px] shadow-2xl overflow-hidden relative pointer-events-auto"
             onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
             }}
             onMouseLeave={handleMouseLeave}
           >
             {/* Header Image */}
             <div className="h-24 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-neutral-800" />
                <img src={bookmark.iconUrl} className="w-full h-full object-cover opacity-50 blur-sm scale-110" alt="" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-neutral-900" />
                <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-end">
                  <h3 className="text-sm font-bold text-white truncate drop-shadow-md flex-1">{bookmark.title}</h3>
                  {bookmark.isPinned && <Pin size={12} className="text-indigo-400 fill-indigo-400 mb-1 ml-2" />}
                </div>
             </div>
             
             {/* Content */}
             <div className="p-3 space-y-3 relative">
                <p className="text-[10px] text-neutral-300 leading-relaxed line-clamp-3 font-light">
                  {bookmark.description || "No description provided."}
                </p>
                
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 pt-2 border-t border-white/5">
                   <Layers size={10} />
                   <span className="truncate max-w-[90px]">{getCategoryName(bookmark.categoryId)}</span>
                   <span className="text-neutral-700">|</span>
                   <Calendar size={10} />
                   <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                </div>
 
                {bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bookmark.tags.slice(0, 5).map(tag => (
                      <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-[2px] border ${getTagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
             </div>
           </motion.div>
        </div>
     );
  };

  const getCategoryColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-emerald-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-indigo-500',
      'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Recursive Grouping Logic
  const renderGroup = (categoryId: string, depth: number = 0) => {
    const findCategory = (nodes: Category[], id: string): Category | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findCategory(node.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    const category = findCategory(categories, categoryId);
    const categoryBookmarks = bookmarks.filter(b => b.categoryId === categoryId);
    const validChildren = category?.children || [];
    const hasContent = categoryBookmarks.length > 0;

    if (!category) return null;

    return (
      <div key={categoryId} className="w-full mb-2">
        {/* Category Header */}
        {(hasContent || validChildren.length > 0) && (
          <div className="mb-4">
             {/* New Header Style: Accent Bar + Title */}
             <div className={clsx(
               "flex items-center w-full mb-4",
               depth > 0 ? "ml-4" : ""
             )}>
                {/* Accent Bar */}
                <div className={clsx(
                  "w-1 h-5 rounded-full mr-3",
                  getCategoryColor(category.name)
                )} />
                
                {/* Title */}
                <h2 className={clsx(
                  "font-bold tracking-wide uppercase mr-3",
                  depth === 0 ? "text-sm text-white" : "text-xs text-neutral-300"
                )}>
                  {category.name}
                </h2>

                {/* Count */}
                {hasContent && (
                    <span className="text-[10px] text-neutral-500 font-mono mr-3">
                    ({categoryBookmarks.length})
                    </span>
                )}

                {/* Separator Line */}
                <div className="h-px bg-neutral-800 flex-1" />
             </div>

             {/* Grid */}
             {hasContent && (
               <div className={clsx(
                 "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12 gap-x-2 gap-y-6",
                 depth === 0 ? "pl-4" : "pl-8"
               )}>
                  {categoryBookmarks.map((b, i) => renderBookmark(b, i))}
               </div>
             )}
          </div>
        )}

        {/* Children */}
        <div className={clsx("flex flex-col gap-4", depth === 0 ? "" : "ml-4")}>
           {validChildren.map(child => renderGroup(child.id, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-8 w-full h-full overflow-y-auto custom-scroll pb-20">
        {groupingEnabled ? (
           categories.map(cat => renderGroup(cat.id, 0))
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12 gap-x-2 gap-y-6">
            {bookmarks.map((bookmark, index) => renderBookmark(bookmark, index))}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {renderPopover()}
      </AnimatePresence>
    </>
  );
};