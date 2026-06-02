const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
const S = (props) => ({ ...base, ...props });

export const Logo = (p) => (
  <svg {...S(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>
);
export const Calendar = (p) => (
  <svg {...S(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const Plus = (p) => (<svg {...S(p)} strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>);
export const Trash = (p) => (<svg {...S(p)}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>);
export const Logout = (p) => (<svg {...S(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>);
export const Close = (p) => (<svg {...S(p)} strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>);
export const Send = (p) => (<svg {...S(p)}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>);
export const Chat = (p) => (<svg {...S(p)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>);
export const Bell = (p) => (<svg {...S(p)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>);
export const Users = (p) => (<svg {...S(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
export const Shield = (p) => (<svg {...S(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>);
export const User = (p) => (<svg {...S(p)}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /></svg>);
export const Grid = (p) => (<svg {...S(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>);
export const Megaphone = (p) => (<svg {...S(p)}><path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>);
export const Check = (p) => (<svg {...S(p)} strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg>);
export const Sparkles = (p) => (<svg {...S(p)}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z" /></svg>);
export const Mail = (p) => (<svg {...S(p)}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>);
export const Reply = (p) => (<svg {...S(p)}><path d="M9 17 4 12l5-5M4 12h11a4 4 0 0 1 4 4v2" /></svg>);
export const Edit = (p) => (<svg {...S(p)}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
export const Search = (p) => (<svg {...S(p)}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
export const MapPin = (p) => (<svg {...S(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>);
export const Clock = (p) => (<svg {...S(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const ChevronLeft = (p) => (<svg {...S(p)} strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>);
export const ChevronRight = (p) => (<svg {...S(p)} strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>);
export const CheckCircle = (p) => (<svg {...S(p)}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>);
export const Camera = (p) => (<svg {...S(p)}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3" /></svg>);
export const Lock = (p) => (<svg {...S(p)}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
export const UserCircle = (p) => (<svg {...S(p)}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M6.5 19a6 6 0 0 1 11 0" /></svg>);
export const LogoutDoor = (p) => (<svg {...S(p)}><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M10 12h11m0 0-3-3m3 3-3 3" /></svg>);
