import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
  >
    <Icon size={24} className={active ? 'fill-indigo-100' : ''} />
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);