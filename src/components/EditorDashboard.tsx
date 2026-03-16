import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, setDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function EditorDashboard({ activeTab }: { activeTab: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch User Data
    const unsubscribeUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    // Fetch Projects
    const q = query(collection(db, 'projects'), where('editorId', '==', auth.currentUser.uid));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projs);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

    return () => {
      unsubscribeUser();
      unsubscribeProjects();
    };
  }, []);

  const renderContent = () => {
    if (loading) return <div className="p-6 font-mono text-sm text-[#00f3ff] animate-pulse">LOADING_DATA...</div>;

    switch (activeTab) {
      case 'projects':
        return <ProjectList projects={projects.filter(p => p.status === 'assigned')} type="active" />;
      case 'completed':
        return <ProjectList projects={projects.filter(p => p.status === 'completed' || p.status === 'submitted')} type="completed" />;
      case 'changes':
        return <ProjectList projects={projects.filter(p => p.status === 'changes_requested')} type="changes" />;
      case 'chat':
        return <ManagementChat />;
      case 'group_chat':
        return <GroupChat userData={userData} />;
      case 'payments':
        return <PaymentsView userData={userData} projects={projects} />;
      case 'settings':
        return <SettingsView userData={userData} />;
      default:
        return <div className="p-6 font-mono text-sm text-white/50">MODULE_NOT_FOUND</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {renderContent()}
    </div>
  );
}

function ProjectList({ projects, type }: { projects: any[], type: 'active' | 'completed' | 'changes' }) {
  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-sm text-white/30 tracking-widest">
        NO_PROJECTS_FOUND
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#00f3ff]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} type={type} />
      ))}
    </div>
  );
}

function ProjectCard({ project, type }: { project: any, type: string }) {
  const [submissionLink, setSubmissionLink] = useState(project.submissionLink || '');
  const [progress, setProgress] = useState(project.progressMinutes || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smart warning system (1 day before deadline)
  const deadlineDate = project.deadline?.toDate ? project.deadline.toDate() : new Date(project.deadline);
  const isWarning = deadlineDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && type !== 'completed';

  const handleSubmit = async () => {
    if (!submissionLink) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        submissionLink,
        status: 'submitted'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        progressMinutes: Number(progress)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
    }
  };

  return (
    <div className={`border rounded-xl p-5 bg-black/40 backdrop-blur-sm transition-all ${isWarning ? 'border-[#ff003c]/50 shadow-[0_0_15px_rgba(255,0,60,0.1)]' : 'border-white/10'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-display text-lg text-[#00f3ff] tracking-wider">{project.name}</h4>
          <p className="font-mono text-xs text-white/50 mt-1 flex items-center gap-2">
            <Clock className="w-3 h-3" /> DEADLINE: {deadlineDate.toLocaleDateString()}
            {isWarning && <span className="text-[#ff003c] animate-pulse ml-2">URGENT</span>}
          </p>
        </div>
        <div className="text-right font-mono text-xs">
          <p className="text-[#00f3ff]">${project.amount}</p>
          <p className="text-white/50">{project.minutes} MINS</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 font-mono text-xs text-white/70">
        <div><span className="text-white/40">ASSETS:</span> {project.assets ? <a href={project.assets} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline">LINK</a> : 'NA'}</div>
        <div><span className="text-white/40">VOICE:</span> {project.voiceOver ? <a href={project.voiceOver} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline">LINK</a> : 'NA'}</div>
        <div><span className="text-white/40">SCRIPT:</span> {project.script ? <a href={project.script} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline">LINK</a> : 'NA'}</div>
        <div><span className="text-white/40">MSG:</span> {project.additionalMessage || 'NA'}</div>
      </div>

      {type === 'changes' && project.feedback && (
        <div className="mb-4 p-3 bg-[#ff003c]/10 border border-[#ff003c]/30 rounded-lg font-mono text-xs text-[#ff003c]">
          <strong>AGENCY FEEDBACK:</strong> {project.feedback}
        </div>
      )}

      {type !== 'completed' && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white/50">PROGRESS (MINS):</span>
            <input 
              type="number" 
              value={progress} 
              onChange={(e) => setProgress(Number(e.target.value))}
              onBlur={handleUpdateProgress}
              className="bg-black/50 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white w-20 focus:border-[#00f3ff]/50 focus:outline-none"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              placeholder="PASTE FINAL RENDER LINK..." 
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#00f3ff]/50 focus:outline-none w-full"
            />
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !submissionLink}
              className="bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 text-[#00f3ff] border border-[#00f3ff]/50 rounded-lg px-4 py-3 sm:py-2 font-mono text-xs tracking-widest disabled:opacity-50 transition-colors shrink-0 w-full sm:w-auto"
            >
              {type === 'changes' ? 'RE-SUBMIT' : 'SUBMIT'}
            </button>
          </div>
        </div>
      )}
      
      {type === 'completed' && (
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center font-mono text-xs">
          <span className="text-white/50">SUBMITTED LINK: <a href={project.submissionLink} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline">VIEW</a></span>
          <span className={project.status === 'completed' ? 'text-[#00f3ff]' : 'text-white/50'}>
            {project.status === 'completed' ? 'ACCEPTED' : 'PENDING REVIEW'}
          </span>
        </div>
      )}
    </div>
  );
}

function ManagementChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, `chats/${auth.currentUser.uid}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;
    
    try {
      await addDoc(collection(db, `chats/${auth.currentUser.uid}/messages`), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#00f3ff]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
        {messages.map(msg => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 font-mono text-xs ${isMe ? 'bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                <p className="text-[9px] opacity-50 mb-1">{isMe ? 'YOU' : 'MANAGEMENT'}</p>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="TYPE MESSAGE..."
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 font-mono text-xs text-white focus:border-[#00f3ff]/50 focus:outline-none"
        />
        <button type="submit" className="bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 text-[#00f3ff] border border-[#00f3ff]/50 rounded-lg px-4 py-2 flex items-center justify-center">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function GroupChat({ userData }: { userData: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [isNameSet, setIsNameSet] = useState(!!userData?.displayName);

  useEffect(() => {
    const q = query(collection(db, 'group_chat'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName });
      setIsNameSet(true);
    } catch (error) {
      console.error("Error setting name", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'group_chat'), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        senderName: displayName,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  if (!isNameSet) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSetName} className="bg-black/40 border border-white/10 p-6 rounded-xl max-w-sm w-full">
          <h3 className="font-display text-[#00f3ff] tracking-widest mb-4 text-center">JOIN GROUP CHAT</h3>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ENTER DISPLAY NAME"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#00f3ff]/50 focus:outline-none mb-4"
            required
          />
          <button type="submit" className="w-full bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 text-[#00f3ff] border border-[#00f3ff]/50 rounded-lg px-4 py-3 font-mono text-xs tracking-widest">
            JOIN
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#00f3ff]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
        {messages.map(msg => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          const isMgmt = msg.senderName === 'Management';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 font-mono text-xs ${isMe ? 'bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-white' : isMgmt ? 'bg-[#ff003c]/20 border border-[#ff003c]/30 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                <p className={`text-[9px] opacity-70 mb-1 ${isMgmt ? 'text-[#ff003c]' : 'text-[#00f3ff]'}`}>{isMe ? 'YOU' : msg.senderName}</p>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="TYPE MESSAGE TO GROUP..."
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 font-mono text-xs text-white focus:border-[#00f3ff]/50 focus:outline-none"
        />
        <button type="submit" className="bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 text-[#00f3ff] border border-[#00f3ff]/50 rounded-lg px-4 py-2 flex items-center justify-center">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function PaymentsView({ userData, projects }: { userData: any, projects: any[] }) {
  const totalEarned = userData?.totalEarned || 0;
  const currentMonthEarned = userData?.currentMonthEarned || 0;
  
  const pendingProjects = projects.filter(p => p.status === 'completed' && !p.isPaid);
  const pendingAmount = pendingProjects.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#00f3ff]/10 border border-[#00f3ff]/30 rounded-xl p-5">
          <p className="font-mono text-[10px] text-[#00f3ff]/70 tracking-widest mb-2">TOTAL EARNED</p>
          <p className="font-display text-3xl text-[#00f3ff]">${totalEarned}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="font-mono text-[10px] text-white/50 tracking-widest mb-2">CURRENT MONTH</p>
          <p className="font-display text-3xl text-white">${currentMonthEarned}</p>
        </div>
        <div className="bg-[#ff003c]/10 border border-[#ff003c]/30 rounded-xl p-5">
          <p className="font-mono text-[10px] text-[#ff003c]/70 tracking-widest mb-2">PENDING CLEARANCE</p>
          <p className="font-display text-3xl text-[#ff003c]">${pendingAmount}</p>
        </div>
      </div>

      <div>
        <h4 className="font-mono text-xs text-white/50 tracking-widest mb-4">PENDING PAYMENTS</h4>
        {pendingProjects.length === 0 ? (
          <p className="font-mono text-xs text-white/30">NO PENDING PAYMENTS</p>
        ) : (
          <div className="space-y-2">
            {pendingProjects.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-xs">
                <span className="text-white/80">{p.name}</span>
                <span className="text-[#ff003c]">${p.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView({ userData }: { userData: any }) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h4 className="font-mono text-xs text-[#00f3ff] tracking-widest mb-4">PROFILE INFO</h4>
        <div className="space-y-3 font-mono text-xs text-white/70">
          <p><span className="text-white/40 w-24 inline-block">EMAIL:</span> {userData?.email}</p>
          <p><span className="text-white/40 w-24 inline-block">COUNTRY:</span> {userData?.country || 'NA'}</p>
          <p><span className="text-white/40 w-24 inline-block">AGENCY:</span> {userData?.agencyName}</p>
        </div>
      </div>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h4 className="font-mono text-xs text-[#00f3ff] tracking-widest mb-4">PREFERENCES</h4>
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="text-white/70">THEME MODE</span>
          <button className="bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 px-3 py-1 rounded">DARK NEON (LOCKED)</button>
        </div>
        <p className="font-mono text-[9px] text-white/30 mt-2">Note: Triad Workspace strictly operates in Dark Neon mode for optimal visual performance.</p>
      </div>
    </div>
  );
}
