import { Bookmark, Category } from './types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'dev',
    name: 'Development',
    children: [
      { id: 'frontend', name: 'Frontend' },
      { id: 'backend', name: 'Backend' },
      { id: 'devops', name: 'DevOps' },
    ]
  },
  {
    id: 'design',
    name: 'Design Resources',
    children: [
      { id: 'ui', name: 'User Interface' },
      { id: '3d', name: '3D Assets' },
    ]
  },
  {
    id: 'ent',
    name: 'Entertainment',
    children: [
        { id: 'video', name: 'Video Streaming'},
        { id: 'music', name: 'Music'}
    ]
  },
  { id: 'news', name: 'News & Reading' },
];

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: '1',
    title: 'React Documentation',
    url: 'https://react.dev',
    description: 'The library for web and native user interfaces. Learn React with interactive examples.',
    categoryId: 'frontend',
    tags: ['Library', 'JS', 'Docs'],
    iconUrl: 'https://picsum.photos/seed/react/200/200',
    color: '#61DAFB',
    createdAt: '2023-10-01T10:00:00Z',
    isPinned: true
  },
  {
    id: '2',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: 'Rapidly build modern websites without ever leaving your HTML. A utility-first CSS framework packed with classes.',
    categoryId: 'frontend',
    tags: ['CSS', 'Framework', 'Styling'],
    iconUrl: 'https://picsum.photos/seed/tailwind/200/200',
    color: '#38BDF8',
    createdAt: '2023-10-05T14:30:00Z'
  },
  {
    id: '3',
    title: 'Framer Motion',
    url: 'https://www.framer.com/motion/',
    description: 'A production-ready motion library for React. Open source and powerful animation primitives.',
    categoryId: 'frontend',
    tags: ['Animation', 'React', 'Library'],
    iconUrl: 'https://picsum.photos/seed/framer/200/200',
    color: '#E10098',
    createdAt: '2023-11-12T09:15:00Z'
  },
  {
    id: '4',
    title: 'Dribbble',
    url: 'https://dribbble.com',
    description: 'Discover the world’s top designers & creatives. The leading destination to find & showcase creative work.',
    categoryId: 'ui',
    tags: ['Design', 'Inspiration'],
    iconUrl: 'https://picsum.photos/seed/dribbble/200/200',
    color: '#EA4C89',
    createdAt: '2023-09-20T16:45:00Z',
    isPinned: true
  },
  {
    id: '5',
    title: 'Three.js',
    url: 'https://threejs.org',
    description: 'JavaScript 3D library. Create easy 3D experiences on the web.',
    categoryId: '3d',
    tags: ['3D', 'WebGL', 'Library'],
    iconUrl: 'https://picsum.photos/seed/threejs/200/200',
    color: '#444444',
    createdAt: '2023-12-01T11:20:00Z'
  },
  {
    id: '6',
    title: 'Docker',
    url: 'https://docker.com',
    description: 'Accelerate how you build, share, and run applications. The standard for containerization.',
    categoryId: 'devops',
    tags: ['Containers', 'DevOps'],
    iconUrl: 'https://picsum.photos/seed/docker/200/200',
    color: '#2496ED',
    createdAt: '2024-01-10T08:00:00Z'
  },
  {
    id: '7',
    title: 'Netflix',
    url: 'https://netflix.com',
    description: 'Watch TV Shows online, Watch Movies Online. Unlimited movies, TV shows, and more.',
    categoryId: 'video',
    tags: ['Movie', 'Chill'],
    iconUrl: 'https://picsum.photos/seed/netflix/200/200',
    color: '#E50914',
    createdAt: '2024-02-14T20:00:00Z'
  },
   {
    id: '8',
    title: 'Spotify',
    url: 'https://spotify.com',
    description: 'Web Player: Music for everyone. Millions of songs and podcasts.',
    categoryId: 'music',
    tags: ['Audio', 'Streaming'],
    iconUrl: 'https://picsum.photos/seed/spotify/200/200',
    color: '#1DB954',
    createdAt: '2023-11-05T13:10:00Z'
  }
];

export const getTagColor = (tag: string) => {
  const colors = [
    'bg-blue-500/10 text-blue-300 border-blue-500/20',
    'bg-green-500/10 text-green-300 border-green-500/20',
    'bg-purple-500/10 text-purple-300 border-purple-500/20',
    'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    'bg-pink-500/10 text-pink-300 border-pink-500/20',
    'bg-orange-500/10 text-orange-300 border-orange-500/20',
    'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    'bg-rose-500/10 text-rose-300 border-rose-500/20',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};