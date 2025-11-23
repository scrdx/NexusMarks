import React, { useState, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { IconView } from './components/IconView';
import { CardView } from './components/CardView';
import { ContextMenu } from './components/ContextMenu';
import { EditModal } from './components/EditModal';
import { MOCK_BOOKMARKS, MOCK_CATEGORIES } from './constants';
import { ViewMode, Category, Bookmark, ContextMenuState, ContextMenuType } from './types';
import { Menu, Search, Layers, Grid, ZoomIn, ZoomOut, Plus, X, Home, Pin } from 'lucide-react';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('icon');
  const [cardScale, setCardScale] = useState(1.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(MOCK_BOOKMARKS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  
  // Select the first available category by default
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories.length > 0 ? categories[0].id : ''
  );

  // Editing State for Sidebar
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Unified Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'canvas',
    targetId: null,
  });

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // --- Helpers ---

  const getAllCategoryIds = (category: Category): string[] => {
    let ids = [category.id];
    if (category.children) {
      category.children.forEach(child => {
        ids = [...ids, ...getAllCategoryIds(child)];
      });
    }
    return ids;
  };

  const findCategoryById = (id: string, list: Category[]): Category | null => {
     for (const cat of list) {
       if (cat.id === id) return cat;
       if (cat.children) {
         const found = findCategoryById(id, cat.children);
         if (found) return found;
       }
     }
     return null;
  };

  const getCategoryName = useCallback((id: string): string => {
    const cat = findCategoryById(id, categories);
    return cat ? cat.name : 'Unknown';
  }, [categories]);

  // --- Derived State ---

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;

    if (showPinnedOnly) {
        filtered = filtered.filter(b => b.isPinned);
    } else {
        if (selectedCategoryId) {
            const selectedCategory = findCategoryById(selectedCategoryId, categories);
            if (selectedCategory) {
                const validIds = getAllCategoryIds(selectedCategory);
                filtered = filtered.filter(b => validIds.includes(b.categoryId));
            }
        }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.description?.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [selectedCategoryId, searchQuery, bookmarks, categories, showPinnedOnly]);

  // --- Handlers ---

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id);
    setShowPinnedOnly(false); // Reset pinned view when category is selected
  };

  const handleTogglePinnedView = () => {
    setShowPinnedOnly(!showPinnedOnly);
    if (!showPinnedOnly) {
       setSelectedCategoryId(''); // Deselect category visual when entering pinned mode (optional, mostly for UI clarity)
    } else if (categories.length > 0) {
       setSelectedCategoryId(categories[0].id); // Revert to default when leaving
    }
  };

  const handleGoHome = () => {
    setSelectedCategoryId('');
    setShowPinnedOnly(false);
  };

  const handleContextMenu = (e: React.MouseEvent, type: ContextMenuType, targetId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type,
      targetId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  // -- Category Manipulation --

  const handleNewCategory = () => {
     const newId = `cat_${Date.now()}`;
     const newCat: Category = { id: newId, name: '未命名分类', children: [] };
     
     // If right clicked on a category, add as child
     if (contextMenu.targetId && contextMenu.type === 'sidebar_category') {
        const addAsChild = (cats: Category[]): Category[] => {
           return cats.map(c => {
              if (c.id === contextMenu.targetId) {
                 return { ...c, children: [...(c.children || []), newCat] };
              }
              if (c.children) return { ...c, children: addAsChild(c.children) };
              return c;
           });
        };
        setCategories(addAsChild(categories));
     } else {
        // Add to root
        setCategories([...categories, newCat]);
     }
     
     setEditingCategoryId(newId);
     closeContextMenu();
  };

  const handleRenameCategory = (id: string, newName: string) => {
     const updateName = (cats: Category[]): Category[] => {
        return cats.map(c => {
           if (c.id === id) return { ...c, name: newName };
           if (c.children) return { ...c, children: updateName(c.children) };
           return c;
        });
     };
     setCategories(updateName(categories));
     setEditingCategoryId(null);
  };

  const handleDeleteCategory = () => {
     if (contextMenu.targetId) {
        if (!window.confirm("Are you sure? This will delete all sub-categories.")) return;
        
        const deleteCat = (cats: Category[]): Category[] => {
           return cats.filter(c => c.id !== contextMenu.targetId).map(c => ({
              ...c,
              children: c.children ? deleteCat(c.children) : []
           }));
        };
        setCategories(deleteCat(categories));
        if (selectedCategoryId === contextMenu.targetId) {
           setSelectedCategoryId(categories[0]?.id || '');
        }
     }
     closeContextMenu();
  };

  const handleMoveCategory = (sourceId: string, targetId: string, position: 'inside' | 'before' | 'after' | 'append') => {
     if (sourceId === targetId) return;

     let nodeToMove: Category | null = null;

     // 1. Remove Source
     const removeNode = (cats: Category[]): Category[] => {
        const result: Category[] = [];
        for (const c of cats) {
           if (c.id === sourceId) {
             nodeToMove = c;
             continue; 
           }
           if (c.children) {
              const updatedChildren = removeNode(c.children);
              result.push({ ...c, children: updatedChildren });
           } else {
              result.push(c);
           }
        }
        return result;
     };
     
     const catsWithoutSource = removeNode(categories);
     if (!nodeToMove) return;

     // 2. Insert Node
     if (position === 'append') {
         // Append to Root
         setCategories([...catsWithoutSource, nodeToMove]);
     } else {
         const insertNode = (cats: Category[]): Category[] => {
             return cats.flatMap(c => {
                 if (c.id === targetId) {
                     if (position === 'inside') {
                         return [{ ...c, children: [...(c.children || []), nodeToMove!] }];
                     } else if (position === 'before') {
                         return [nodeToMove!, c];
                     } else if (position === 'after') {
                         return [c, nodeToMove!];
                     }
                 }
                 if (c.children) {
                     return [{ ...c, children: insertNode(c.children) }];
                 }
                 return [c];
             });
         };
         setCategories(insertNode(catsWithoutSource));
     }
  };

  // -- Bookmark Actions --

  const handleNewBookmark = () => {
     const newBookmark: Bookmark = {
        id: `new_${Date.now()}`,
        title: '',
        url: '',
        description: '',
        categoryId: selectedCategoryId || categories[0]?.id || '',
        tags: [],
        iconUrl: 'https://picsum.photos/200',
        createdAt: new Date().toISOString(),
        color: '#444444'
     };
     setEditingBookmark(newBookmark);
     setIsEditModalOpen(true);
     closeContextMenu();
  };

  const handleEdit = () => {
    if (contextMenu.type === 'bookmark' && contextMenu.targetId) {
      const bookmark = bookmarks.find(b => b.id === contextMenu.targetId);
      if (bookmark) {
        setEditingBookmark(bookmark);
        setIsEditModalOpen(true);
      }
    } else if (contextMenu.type === 'sidebar_category' && contextMenu.targetId) {
       setEditingCategoryId(contextMenu.targetId);
    }
    closeContextMenu();
  };

  const handleSaveBookmark = (updated: Bookmark) => {
    if (updated.id.startsWith('new_')) {
        // Create new
        const finalId = Date.now().toString();
        setBookmarks([...bookmarks, { ...updated, id: finalId }]);
    } else {
        // Update existing
        setBookmarks(prev => prev.map(b => b.id === updated.id ? updated : b));
    }
    setEditingBookmark(null);
  };

  const handleShare = () => {
    const bookmark = bookmarks.find(b => b.id === contextMenu.targetId);
    if (bookmark) {
       navigator.clipboard.writeText(bookmark.url);
       alert(`Copied to clipboard: ${bookmark.url}`);
    }
    closeContextMenu();
  };

  const handleQrCode = () => {
    const bookmark = bookmarks.find(b => b.id === contextMenu.targetId);
    if (bookmark) {
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookmark.url)}`);
    }
    closeContextMenu();
  };
  
  const handleDelete = () => {
     if (contextMenu.type === 'bookmark') {
        if (window.confirm("Are you sure you want to delete this bookmark?")) {
           setBookmarks(prev => prev.filter(b => b.id !== contextMenu.targetId));
        }
     } else if (contextMenu.type === 'sidebar_category') {
        handleDeleteCategory();
     }
     closeContextMenu();
  }

  const handleReorder = () => {
     alert("Drag and Drop categories to organize them.");
     closeContextMenu();
  };

  const handlePinBookmark = () => {
     if (contextMenu.targetId && contextMenu.type === 'bookmark') {
        setBookmarks(prev => prev.map(b => 
           b.id === contextMenu.targetId ? { ...b, isPinned: !b.isPinned } : b
        ));
     }
     closeContextMenu();
  };

  const isTargetPinned = contextMenu.type === 'bookmark' && contextMenu.targetId 
    ? bookmarks.find(b => b.id === contextMenu.targetId)?.isPinned 
    : false;

  return (
    <div 
      className="flex h-screen w-screen bg-[#171717] text-neutral-200 overflow-hidden font-sans selection:bg-neutral-700 selection:text-white"
    >
      {/* Left Sidebar */}
      <div className="h-full">
        <Sidebar
          categories={categories}
          selectedCategoryId={showPinnedOnly ? '' : selectedCategoryId} // Visual deselection if pinned is active
          editingCategoryId={editingCategoryId}
          onSelectCategory={handleSelectCategory}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          // Handle context menu from sidebar
          onContextMenu={(e, id) => {
             if (id) {
               handleContextMenu(e, 'sidebar_category', id);
             } else {
               handleContextMenu(e, 'sidebar_canvas');
             }
          }}
          onRenameCategory={handleRenameCategory}
          onMoveCategory={handleMoveCategory}
        />
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col h-full relative transition-all duration-300" 
        onClick={closeContextMenu}
        onContextMenu={(e) => handleContextMenu(e, 'canvas')}
      >
        
        {/* Top Navigation Bar */}
        <header className="h-14 bg-neutral-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}
              className="p-2 hover:bg-neutral-800 rounded-[4px] transition-colors text-neutral-400 hover:text-white"
            >
              <Menu size={18} />
            </button>

            <button
               onClick={handleTogglePinnedView}
               className={`p-2 rounded-[4px] hover:bg-neutral-800 transition-colors ${showPinnedOnly ? 'text-indigo-400 bg-neutral-800 ring-1 ring-indigo-500/50' : 'text-neutral-400'}`}
               title="Pinned Bookmarks"
            >
               <Pin size={18} className={showPinnedOnly ? "fill-indigo-400/20" : ""} />
            </button>

            <button
               onClick={handleGoHome}
               className={`p-2 rounded-[4px] hover:bg-neutral-800 transition-colors ${selectedCategoryId === '' && !showPinnedOnly ? 'text-white bg-neutral-800' : 'text-neutral-400'}`}
               title="All Bookmarks"
            >
               <Home size={18} />
            </button>
            
            {/* Search Bar */}
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-[4px] py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-neutral-600 w-64 transition-colors duration-200 placeholder:text-neutral-700"
              />
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-3">
             {/* Group Toggle */}
             <button
                onClick={() => setGroupingEnabled(!groupingEnabled)}
                className={`p-1.5 rounded-[4px] transition-all flex items-center gap-2 text-xs font-medium ${groupingEnabled ? 'bg-neutral-800 text-white border border-neutral-700' : 'text-neutral-500 hover:text-white hover:bg-neutral-900'}`}
                title="Group by Category"
              >
                <Layers size={14} />
                <span className="hidden sm:inline">Group</span>
              </button>

             <div className="h-4 w-px bg-neutral-800 mx-1" />

            {viewMode === 'card' && (
              <div className="flex items-center gap-1 bg-neutral-900 rounded-[4px] p-0.5 border border-neutral-800 mr-2">
                <button onClick={() => setCardScale(Math.max(0.5, cardScale - 0.1))} className="p-1.5 hover:text-white text-neutral-500 rounded-[2px] hover:bg-neutral-800"><ZoomOut size={12}/></button>
                <span className="text-[10px] w-8 text-center text-neutral-500 font-mono select-none">{Math.round(cardScale * 100)}%</span>
                <button onClick={() => setCardScale(Math.min(1.5, cardScale + 0.1))} className="p-1.5 hover:text-white text-neutral-500 rounded-[2px] hover:bg-neutral-800"><ZoomIn size={12}/></button>
              </div>
            )}

            <div className="flex bg-neutral-900 rounded-[4px] p-0.5 border border-neutral-800">
              <button
                onClick={() => setViewMode('icon')}
                className={`p-1.5 rounded-[2px] transition-all ${viewMode === 'icon' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="Icon View"
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-[2px] transition-all ${viewMode === 'card' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="Card View"
              >
                <Layers size={14} /> 
              </button>
            </div>

            <button 
                onClick={handleNewBookmark}
                className="bg-white text-neutral-900 hover:bg-neutral-200 px-3 py-1.5 rounded-[4px] text-xs font-bold flex items-center gap-2 transition-colors ml-2"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-hidden relative bg-neutral-950/50">
           {viewMode === 'icon' ? (
             <IconView 
                bookmarks={filteredBookmarks} 
                categories={categories}
                groupingEnabled={groupingEnabled}
                getCategoryName={getCategoryName}
                onContextMenu={(e, id) => handleContextMenu(e, 'bookmark', id)}
             />
           ) : (
             <CardView 
                bookmarks={filteredBookmarks} 
                categories={categories}
                scale={cardScale} 
                groupingEnabled={groupingEnabled}
                getCategoryName={getCategoryName}
                onContextMenu={(e, id) => handleContextMenu(e, 'bookmark', id)}
             />
           )}
           
           {/* Pinned View Empty State */}
           {showPinnedOnly && filteredBookmarks.length === 0 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600">
                <Pin size={48} className="mb-4 text-neutral-800" />
                <p className="text-sm font-medium">No pinned bookmarks found.</p>
                <p className="text-xs mt-2">Right-click a bookmark and select "Pin Bookmark" to add it here.</p>
             </div>
           )}
        </main>

        {/* Context Menu */}
        {contextMenu.isOpen && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            type={contextMenu.type}
            onClose={closeContextMenu}
            isPinned={isTargetPinned}
            actions={{
              onEdit: handleEdit,
              onShare: handleShare,
              onQrCode: handleQrCode,
              onDelete: handleDelete,
              onNewBookmark: handleNewBookmark,
              onNewCategory: handleNewCategory,
              onChangeBg: () => alert('Select Background Logic'),
              onReorder: handleReorder,
              onPin: handlePinBookmark
            }}
          />
        )}

        {/* Edit Modal */}
        {editingBookmark && (
          <EditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            bookmark={editingBookmark}
            onSave={handleSaveBookmark}
            categories={categories}
          />
        )}

        {/* QR Code Overlay */}
        {qrCodeUrl && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white p-6 rounded-[4px] shadow-2xl flex flex-col items-center relative">
                <button onClick={() => setQrCodeUrl(null)} className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600"><X size={20}/></button>
                <h3 className="text-neutral-900 font-bold mb-4 text-sm uppercase tracking-wider">Scan QR Code</h3>
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 border border-neutral-200 mix-blend-multiply" />
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;