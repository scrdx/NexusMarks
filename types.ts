export interface Category {
  id: string;
  name: string;
  icon?: string;
  children?: Category[];
  isExpanded?: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  categoryId: string;
  tags: string[];
  iconUrl: string;
  color?: string;
  createdAt: string; // ISO Date string
  isPinned?: boolean;
  x?: number;
  y?: number;
  z?: number;
}

export type ViewMode = 'icon' | 'card';

export type ContextMenuType = 'bookmark' | 'category' | 'canvas' | 'sidebar_canvas' | 'sidebar_category';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  targetId: string | null; // bookmarkId or categoryId
}

export interface DragPosition {
  x: number;
  y: number;
}