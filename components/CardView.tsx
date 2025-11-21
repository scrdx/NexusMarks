import React, { useState } from 'react';
import { Bookmark, Category } from '../types';
import { motion } from 'framer-motion';
import { ExternalLink, Calendar, Layers } from 'lucide-react';
import clsx from 'clsx';
import { getTagColor } from '../constants';

interface CardViewProps {
  bookmarks: Bookmark[];
  categories: Category[];
  scale: number;
  groupingEnabled: boolean;
  getCategoryName: (id: string) => string;
  onContextMenu: (e: React.MouseEvent, bookmarkId: string) => void;
}

const FlipCard: React.FC<{ 
  bookmark: Bookmark; 
  scale: number;
  getCategoryName: (id: string) => string;
  onContextMenu: (e: React.MouseEvent, bookmarkId: string) => void;
}> = ({ bookmark, scale, getCategoryName, onContextMenu }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const width = 200 * scale;
  const height = 280 * scale;
  
  const stripeColor = bookmark.color && bookmark.color !== '#000000' ? bookmark.color : '#525252';

  return (
    <div 
      className="relative perspective-1000" 
      style={{ width, height }}
      onContextMenu={(e) => onContextMenu(e, bookmark.id)}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full h-full relative preserve-3d cursor-pointer group"
        onClick={handleFlip}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT FACE */}
        <div 
          className="absolute inset-0 backface-hidden bg-neutral-800 rounded-[4px] overflow-hidden border border-neutral-700/50 transition-all duration-300 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] group-hover:-translate-y-2"
          style={{ backfaceVisibility: 'hidden' }}
        >
           {/* Cover Image */}
           <div className="h-3/5 relative">
             <img src={bookmark.iconUrl} alt={bookmark.title} className="w-full h-full object-cover opacity-70 grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" />
             <div className="absolute inset-0 bg-gradient-to-t from-neutral-800 via-transparent to-transparent" />
             <div className="absolute top-3 right-3 bg-neutral-950/60 backdrop-blur-md rounded-[2px] px-1.5 py-0.5 border border-white/5">
                <Layers size={10} className="text-white/70 inline mr-1" />
                <span className="text-[9px] text-white/90 font-medium tracking-wide">{getCategoryName(bookmark.categoryId).split(' ').pop()}</span>
             </div>
           </div>

           {/* Front Content */}
           <div className="h-2/5 p-4 flex flex-col justify-between bg-neutral-800 relative">
              
              <div className="mt-1">
                 <h3 className="text-xs font-bold text-neutral-200 leading-tight line-clamp-2 mb-2 tracking-wide group-hover:text-white transition-colors">{bookmark.title}</h3>
                 <div className="flex flex-wrap gap-1">
                   {bookmark.tags.slice(0,2).map(t => (
                     <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-[2px] border ${getTagColor(t)}`}>
                       {t}
                     </span>
                   ))}
                 </div>
              </div>
              
              {/* Bottom Color Stripe */}
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: stripeColor }} />
           </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 backface-hidden bg-neutral-900 rounded-[4px] overflow-hidden shadow-xl border border-neutral-700 flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex-1 p-5 flex flex-col">
             {/* Icon Left Alignment - No Back text */}
             <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-neutral-800 rounded-[4px] p-1 border border-neutral-700 shadow-inner shrink-0">
                    <img src={bookmark.iconUrl} alt="" className="w-full h-full object-cover rounded-[2px]" />
                 </div>
                 <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">{bookmark.title}</h4>
             </div>

             <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto custom-scroll pr-1">
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                        {bookmark.description || "No description available."}
                    </p>
                </div>
             </div>
          </div>

          <div className="p-4 border-t border-neutral-800 space-y-3 bg-neutral-900/50">
             <div className="flex items-center justify-between text-[10px] text-neutral-500">
               <div className="flex items-center gap-1">
                  <Calendar size={10} />
                  <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
               </div>
             </div>
             
             <button 
               onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
               className="w-full py-2 bg-neutral-100 hover:bg-white text-neutral-900 text-xs font-semibold rounded-[2px] flex items-center justify-center gap-2 transition-colors"
             >
               <ExternalLink size={12} />
               Visit Website
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const CardView: React.FC<CardViewProps> = ({ bookmarks, categories, scale, groupingEnabled, getCategoryName, onContextMenu }) => {
  
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
      <div key={categoryId} className="w-full mb-4">
        {(hasContent || validChildren.length > 0) && (
           <div className="mb-8">
               {/* Accent Bar Header Style */}
               <div className={clsx(
                 "flex items-center w-full mb-6",
                 depth > 0 ? "ml-4" : ""
               )}>
                   <div className={clsx(
                     "w-1 h-5 rounded-full mr-3",
                     getCategoryColor(category.name)
                   )} />
                   
                   <h2 className={clsx(
                     "font-bold tracking-wide uppercase mr-3",
                     depth === 0 ? "text-sm text-white" : "text-xs text-neutral-300"
                   )}>
                     {category.name}
                   </h2>

                   {hasContent && (
                       <span className="text-[10px] text-neutral-500 font-mono mr-3">
                       ({categoryBookmarks.length})
                       </span>
                   )}

                   <div className="h-px bg-neutral-800 flex-1" />
               </div>

              <div className={clsx("flex flex-wrap gap-6", depth === 0 ? "pl-4" : "pl-8")}>
                {categoryBookmarks.map(b => (
                  <FlipCard 
                    key={b.id} 
                    bookmark={b} 
                    scale={scale} 
                    getCategoryName={getCategoryName} 
                    onContextMenu={onContextMenu}
                  />
                ))}
              </div>
           </div>
        )}
        
        <div className={clsx("flex flex-col gap-8", depth === 0 ? "" : "ml-4")}>
            {validChildren.map(child => renderGroup(child.id, depth + 1))}
        </div>
      </div>
    );
  };

  if (groupingEnabled) {
    return (
      <div className="w-full h-full p-10 overflow-y-auto custom-scroll pb-24">
         {categories.map(cat => renderGroup(cat.id, 0))}
      </div>
    );
  }

  return (
    <div className="w-full h-full p-10 overflow-y-auto custom-scroll pb-24">
       <div className="flex flex-wrap gap-6">
         {bookmarks.map(b => (
           <FlipCard 
             key={b.id} 
             bookmark={b} 
             scale={scale} 
             getCategoryName={getCategoryName} 
             onContextMenu={onContextMenu}
            />
         ))}
       </div>
    </div>
  );
};