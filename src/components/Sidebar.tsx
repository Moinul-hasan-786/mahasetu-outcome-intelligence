import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  PhoneCall,
  BarChart3,
  Building2,
  MapPin,
  Settings,
  Network,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'trainees'
  | 'outcomes'
  | 'evidence'
  | 'followup'
  | 'skill-gaps'
  | 'providers'
  | 'districts'
  | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, enabled: true },
  { id: 'trainees', label: 'Trainees', icon: Users, enabled: true },
  { id: 'outcomes', label: 'Outcomes', icon: TrendingUp, enabled: true },
  { id: 'evidence', label: 'Evidence Ledger', icon: FileText, enabled: true },
  { id: 'followup', label: 'Follow-up Queue', icon: PhoneCall, enabled: true },
  { id: 'skill-gaps', label: 'Skill Gaps', icon: BarChart3, enabled: false },
  { id: 'providers', label: 'Providers', icon: Building2, enabled: false },
  { id: 'districts', label: 'Districts', icon: MapPin, enabled: false },
  { id: 'settings', label: 'Settings', icon: Settings, enabled: false },
];

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onDemoReset: () => Promise<void>;
}

export function Sidebar({ currentPage, onNavigate, onDemoReset }: SidebarProps) {
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleDemoReset = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      await onDemoReset();
      setResetMessage('Rahul demo restored');
    } catch {
      setResetMessage('Reset could not complete');
    } finally {
      setResetting(false);
    }
  };

  return (
    <aside className="w-64 bg-navy-800 text-white flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-navy-700">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-navy-800" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">MahaSETU</h1>
            <p className="text-[11px] text-navy-300 font-medium">Outcome Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.enabled && onNavigate(item.id)}
              disabled={!item.enabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-600 text-white'
                  : item.enabled
                  ? 'text-navy-200 hover:bg-navy-700 hover:text-white'
                  : 'text-navy-400 cursor-not-allowed'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
              <span className="flex-1 text-left">{item.label}</span>
              {!item.enabled && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-700 text-navy-300 font-medium">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo badge */}
      <div className="px-3 py-3 border-t border-navy-700">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-amber-300">Demo Environment</p>
            <p className="text-[10px] text-amber-400/70">Synthetic data only</p>
          </div>
        </div>
        <button
          onClick={handleDemoReset}
          disabled={resetting}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-navy-200 transition-colors hover:bg-navy-700 disabled:cursor-wait"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting demo...' : 'Demo Reset'}
        </button>
        {resetMessage && <p className="mt-1 text-center text-[10px] text-navy-300">{resetMessage}</p>}
      </div>
    </aside>
  );
}
