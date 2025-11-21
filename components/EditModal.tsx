import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bookmark, Category } from '../types';
import { X, Save } from 'lucide-react';
import { getTagColor } from '../constants';

interface EditModalProps {
  bookmark: Bookmark;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Bookmark) => void;
  categories: Category[];
}

export const EditModal: React.FC<EditModalProps> = ({ bookmark, isOpen, onClose, onSave, categories }) => {
  const [formData, setFormData] = useState<Bookmark>(bookmark);
  const [tagInput, setTagInput] = useState('');
  
  // Resizable state
  const modalRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 500, height: 'auto' });

  // Draggable state
  const [position, setPosition] = useState<{x: number, y: number} | null>(null);
  const dragStartRef = useRef<{mouseX: number, mouseY: number} | null>(null);
  const initialPosRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    setFormData(bookmark);
    setTagInput('');
  }, [bookmark]);

  // Memoize options to prevent re-render flashing
  const categoryOptions = useMemo(() => {
    const renderOptions = (cats: Category[], depth = 0): React.ReactNode[] => {
        return cats.flatMap(cat => [
            <option key={cat.id} value={cat.id}>
                {'\u00A0'.repeat(depth * 4) + cat.name}
            </option>,
            ...(cat.children ? renderOptions(cat.children, depth + 1) : [])
        ]);
    };
    return renderOptions(categories);
  }, [categories]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Bookmark, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
        alert("Please select a category");
        return;
    }
    onSave(formData);
    onClose();
  };

  // Resize Logic
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering drag
    const startX = e.clientX;
    const startWidth = modalRef.current?.offsetWidth || 500;

    const handleMouseMove = (moveEvent: MouseEvent) => {
       const newWidth = Math.max(400, Math.min(800, startWidth + (moveEvent.clientX - startX)));
       setSize(prev => ({ ...prev, width: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag Logic
  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();

    dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY
    };

    // Initialize position from current rect if not set yet (transition from CSS centering to absolute)
    const currentX = position ? position.x : rect.left;
    const currentY = position ? position.y : rect.top;

    initialPosRef.current = { x: currentX, y: currentY };
    
    if (!position) {
        setPosition({ x: currentX, y: currentY });
    }

    const handleMouseMove = (ev: MouseEvent) => {
        if (!dragStartRef.current || !initialPosRef.current) return;
        
        const deltaX = ev.clientX - dragStartRef.current.mouseX;
        const deltaY = ev.clientY - dragStartRef.current.mouseY;
        
        setPosition({
            x: initialPosRef.current.x + deltaX,
            y: initialPosRef.current.y + deltaY
        });
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        dragStartRef.current = null;
        initialPosRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none">
        {/* pointer-events-none on backdrop allows clicks to pass through if needed, but we usually want to block. 
            However, for dragging, we need the backdrop to be interactable? 
            Actually, we want the backdrop to block interactions with the app, but allow dragging the modal.
            Since the modal is a child, we need pointer-events-auto on the modal.
        */}
      <div 
        ref={modalRef}
        style={{ 
            width: size.width,
            ...(position ? { 
                position: 'absolute', 
                left: position.x, 
                top: position.y,
                margin: 0,
                transform: 'none'
            } : {}) 
        }}
        className="bg-neutral-900 border border-neutral-800 shadow-2xl relative flex flex-col rounded-[2px] overflow-hidden pointer-events-auto"
      >
        {/* Windows-style Title Bar - Draggable */}
        <div 
           className="flex items-center justify-between bg-neutral-900 border-b border-neutral-800 select-none h-10 cursor-move"
           onMouseDown={handleTitleMouseDown}
        >
          <div className="flex items-center px-4 gap-3 pointer-events-none">
             <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                {bookmark.id.startsWith('new_') ? 'New Bookmark' : 'Properties'}
             </span>
             {!bookmark.id.startsWith('new_') && (
                 <span className="text-[10px] text-neutral-600 font-mono">#{bookmark.id.substring(0,6)}</span>
             )}
          </div>
          
          <div className="h-full flex">
             <button 
                onClick={onClose} 
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on close button
                className="h-full w-12 flex items-center justify-center text-neutral-400 hover:bg-[#e81123] hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
             >
               <X size={16} strokeWidth={2} />
             </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scroll max-h-[75vh]">
          
          {/* Title & URL Group */}
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-[2px] px-3 py-2.5 text-sm text-white focus:border-neutral-600 focus:ring-0 outline-none transition-colors placeholder:text-neutral-700"
                placeholder="Page Title"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">URL</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={e => handleChange('url', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-[2px] px-3 py-2.5 text-sm text-neutral-300 font-mono focus:border-neutral-600 focus:ring-0 outline-none transition-colors placeholder:text-neutral-700"
                placeholder="https://..."
              />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Category</label>
                <select
                    value={formData.categoryId}
                    onChange={e => handleChange('categoryId', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-[2px] px-3 py-2.5 text-sm text-neutral-300 focus:border-neutral-600 focus:ring-0 outline-none transition-colors"
                >
                    <option value="" disabled>Select a category...</option>
                    {categoryOptions}
                </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-[2px] px-3 py-2.5 text-sm text-neutral-300 focus:border-neutral-600 focus:ring-0 outline-none resize-none leading-relaxed placeholder:text-neutral-700"
              placeholder="Enter a brief description..."
            />
          </div>

           {/* Tags Section */}
           <div>
            <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Tags</label>
            <div className="bg-neutral-950 border border-neutral-800 rounded-[2px] p-2 min-h-[44px] flex flex-wrap gap-2 items-center focus-within:border-neutral-600 transition-colors">
               {formData.tags.map(tag => (
                 <span key={tag} className={`flex items-center gap-1 px-2 py-1 rounded-[2px] text-[10px] font-medium border ${getTagColor(tag)}`}>
                   {tag}
                   <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                     <X size={10} />
                   </button>
                 </span>
               ))}
               <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="bg-transparent border-none outline-none text-sm text-white min-w-[60px] flex-1 px-1 placeholder:text-neutral-700"
                  placeholder={formData.tags.length === 0 ? "Type and press Enter..." : ""}
               />
            </div>
            <p className="text-[10px] text-neutral-600 mt-1.5">Press Enter to add a tag.</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-[2px] text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-[2px] text-xs font-semibold bg-neutral-200 text-neutral-900 hover:bg-white transition-colors flex items-center gap-2"
            >
              <Save size={14} />
              Save Resource
            </button>
          </div>
        </form>
        
        {/* Resize Handle */}
        <div 
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-1.5 h-1.5 bg-neutral-700 rounded-bl-[1px]" />
        </div>
      </div>
    </div>
  );
};
