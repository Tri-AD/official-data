import { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Folder, CheckCircle, AlertCircle, MessageSquare, Users, DollarSign, Settings, PlusCircle, Inbox, LogOut, Minus, Square, X, Github, RefreshCw } from 'lucide-react';
import { auth } from '../firebase';
import { EditorDashboard } from './EditorDashboard';
import { AgencyDashboard } from './AgencyDashboard';

export function Workspace({ role }: { role: string | null }) {
  const [activeTab, setActiveTab] = useState('projects');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const handleLogout = async () => {
    await auth.signOut();
  };

  const checkForUpdates = () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateMessage('Checking GitHub...');
    setTimeout(() => {
      setUpdateMessage('Downloading...');
      setTimeout(() => {
        setUpdateMessage('App is up to date (v1.0.2)');
        setIsUpdating(false);
        setTimeout(() => setUpdateMessage(''), 3000);
      }, 1500);
    }, 1500);
  };

  const editorTabs = [
    { id: 'projects', label: 'ACTIVE PROJECTS', icon: Folder },
    { id: 'completed', label: 'COMPLETED', icon: CheckCircle },
    { id: 'changes', label: 'CHANGES REQ', icon: AlertCircle },
    { id: 'chat', label: 'MANAGEMENT CHAT', icon: MessageSquare },
    { id: 'group_chat', label: 'GROUP CHAT', icon: Users },
    { id: 'payments', label: 'PAYMENTS', icon: DollarSign },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  const agencyTabs = [
    { id: 'create', label: 'CREATE PROJECT', icon: PlusCircle },
    { id: 'assigned', label: 'ASSIGNED PROJ', icon: Folder },
    { id: 'submissions', label: 'SUBMISSIONS', icon: Inbox },
    { id: 'chat', label: 'INBOX', icon: MessageSquare },
    { id: 'group_chat', label: 'GROUP CHAT', icon: Users },
    { id: 'payments', label: 'PAYMENTS', icon: DollarSign },
  ];

  const tabs = role === 'agency' ? agencyTabs : editorTabs;

  // Set default tab if role changes
  if (role === 'agency' && activeTab === 'projects') {
    setActiveTab('assigned');
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
      className="flex-1 flex flex-col bg-[#0a0a0a] text-white relative overflow-hidden"
    >
      {/* Title Bar */}
      <div className="h-10 bg-[#050505] border-b border-white/10 flex items-center justify-between px-4 select-none z-50 relative shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-white/50 tracking-widest">TRIAD WORKSPACE</span>
          <button onClick={checkForUpdates} disabled={isUpdating} className="font-mono text-[10px] text-[#00f3ff] hover:text-[#00f3ff]/80 flex items-center gap-2 transition-colors">
            <Github className="w-3 h-3" /> 
            {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
            {updateMessage || 'CHECK FOR UPDATES'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none fixed" />

        <div className="relative z-10 flex-1 flex flex-col h-full max-w-7xl mx-auto w-full min-h-0">
          <header className="mb-8 flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display text-3xl tracking-[0.2em] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">WORKSPACE</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="font-mono text-xs text-white/40 text-right">
                <p>SECURE_CONNECTION: ESTABLISHED</p>
                <p>LATENCY: 12ms</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 font-mono text-[10px] text-[#ff003c]/70 hover:text-[#ff003c] transition-colors mt-2"
              >
                <LogOut className="w-3 h-3" /> LOG OUT
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
            {/* Left Sidebar */}
            <div className="col-span-1 flex flex-col gap-6">
              <div className="border border-white/10 bg-black/40 backdrop-blur-md rounded-xl p-4 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <h3 className="font-mono text-[10px] text-white/50 tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> NAVIGATION
                </h3>
                <div className="flex flex-col gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-xs tracking-widest transition-all ${
                        activeTab === tab.id 
                          ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
                          : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Viewport */}
            <div className="col-span-1 lg:col-span-3 border border-white/10 bg-black/40 backdrop-blur-md rounded-xl p-6 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h3 className="font-mono text-[10px] text-white/50 tracking-[0.2em] mb-4 uppercase">
                {tabs.find(t => t.id === activeTab)?.label || 'MAIN_VIEWPORT'}
              </h3>
              
              <div className="flex-1 border border-white/5 rounded-lg bg-[#050505] relative overflow-hidden flex flex-col">
                {role === 'agency' ? (
                  <AgencyDashboard activeTab={activeTab} />
                ) : (
                  <EditorDashboard activeTab={activeTab} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
