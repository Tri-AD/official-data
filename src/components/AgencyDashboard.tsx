import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, setDoc, addDoc, serverTimestamp, orderBy, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Send, AlertCircle, CheckCircle, Clock, PlusCircle, User, DollarSign } from 'lucide-react';

export function AgencyDashboard({ activeTab }: { activeTab: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [editors, setEditors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Projects
    const q = query(collection(db, 'projects'));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projs);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

    // Fetch Editors
    const qEditors = query(collection(db, 'users'), where('role', '==', 'editor'));
    const unsubscribeEditors = onSnapshot(qEditors, (snapshot) => {
      const eds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEditors(eds);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => {
      unsubscribeProjects();
      unsubscribeEditors();
    };
  }, []);

  const renderContent = () => {
    if (loading) return <div className="p-6 font-mono text-sm text-[#ff003c] animate-pulse">LOADING_DATA...</div>;

    switch (activeTab) {
      case 'create':
        return <CreateProject editors={editors} />;
      case 'assigned':
        return <AssignedProjects projects={projects.filter(p => p.status === 'assigned' || p.status === 'changes_requested')} editors={editors} />;
      case 'submissions':
        return <Submissions projects={projects.filter(p => p.status === 'submitted' || p.status === 'completed')} editors={editors} />;
      case 'chat':
        return <Inbox editors={editors} />;
      case 'group_chat':
        return <AgencyGroupChat />;
      case 'payments':
        return <AgencyPayments projects={projects} editors={editors} />;
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

function CreateProject({ editors }: { editors: any[] }) {
  const [formData, setFormData] = useState({
    name: '', assets: '', voiceOver: '', script: '', amount: '', minutes: '', editorId: '', deadline: '', additionalMessage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        amount: Number(formData.amount),
        minutes: Number(formData.minutes),
        deadline: new Date(formData.deadline),
        status: 'assigned',
        isPaid: false,
        progressMinutes: 0,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setFormData({ name: '', assets: '', voiceOver: '', script: '', amount: '', minutes: '', editorId: '', deadline: '', additionalMessage: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ff003c]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="PROJECT NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none" />
          <select required value={formData.editorId} onChange={e => setFormData({...formData, editorId: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none">
            <option value="">SELECT EDITOR</option>
            {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.displayName || ed.email}</option>)}
          </select>
          <input type="text" placeholder="ASSETS LINK (OPTIONAL)" value={formData.assets} onChange={e => setFormData({...formData, assets: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none" />
          <input type="text" placeholder="VOICE OVER LINK (OPTIONAL)" value={formData.voiceOver} onChange={e => setFormData({...formData, voiceOver: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none" />
          <input type="text" placeholder="SCRIPT LINK (OPTIONAL)" value={formData.script} onChange={e => setFormData({...formData, script: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none" />
          <input type="number" placeholder="AMOUNT ($)" required min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none" />
          <input type="number" placeholder="MINUTES" required min="0" value={formData.minutes} onChange={e => setFormData({...formData, minutes: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none" />
          <input type="date" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none" />
        </div>
        <textarea placeholder="ADDITIONAL MESSAGE (OPTIONAL)" value={formData.additionalMessage} onChange={e => setFormData({...formData, additionalMessage: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none h-24 resize-none" />
        
        {success && <div className="text-[#00f3ff] font-mono text-xs text-center">PROJECT CREATED SUCCESSFULLY</div>}
        
        <button type="submit" disabled={isSubmitting} className="w-full bg-[#ff003c]/20 hover:bg-[#ff003c]/30 text-[#ff003c] border border-[#ff003c]/50 rounded-lg px-4 py-3 font-mono text-xs tracking-widest transition-colors disabled:opacity-50">
          {isSubmitting ? 'CREATING...' : 'ASSIGN PROJECT'}
        </button>
      </form>
    </div>
  );
}

function AssignedProjects({ projects, editors }: { projects: any[], editors: any[] }) {
  if (projects.length === 0) return <div className="p-6 font-mono text-sm text-white/30 text-center">NO ASSIGNED PROJECTS</div>;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ff003c]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
      {projects.map(project => {
        const editor = editors.find(e => e.id === project.editorId);
        const deadlineDate = project.deadline?.toDate ? project.deadline.toDate() : new Date(project.deadline);
        
        return (
          <div key={project.id} className="border border-white/10 rounded-xl p-5 bg-black/40 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-display text-lg text-[#ff003c] tracking-wider">{project.name}</h4>
                <p className="font-mono text-xs text-white/50 mt-1 flex items-center gap-2">
                  <User className="w-3 h-3" /> EDITOR: {editor?.displayName || editor?.email || 'UNKNOWN'}
                </p>
                <p className="font-mono text-xs text-white/50 mt-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> DEADLINE: {deadlineDate.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="text-[#ff003c]">${project.amount}</p>
                <p className="text-white/50">{project.minutes} MINS TOTAL</p>
                <p className="text-[#00f3ff] mt-2">PROGRESS: {project.progressMinutes || 0} MINS</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 font-mono text-xs text-white/70">
              <div><span className="text-white/40">ASSETS:</span> {project.assets ? <a href={project.assets} target="_blank" rel="noreferrer" className="text-[#ff003c] hover:underline">LINK</a> : 'NA'}</div>
              <div><span className="text-white/40">VOICE:</span> {project.voiceOver ? <a href={project.voiceOver} target="_blank" rel="noreferrer" className="text-[#ff003c] hover:underline">LINK</a> : 'NA'}</div>
              <div><span className="text-white/40">SCRIPT:</span> {project.script ? <a href={project.script} target="_blank" rel="noreferrer" className="text-[#ff003c] hover:underline">LINK</a> : 'NA'}</div>
              <div><span className="text-white/40">STATUS:</span> <span className="text-white">{project.status.toUpperCase()}</span></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Submissions({ projects, editors }: { projects: any[], editors: any[] }) {
  if (projects.length === 0) return <div className="p-6 font-mono text-sm text-white/30 text-center">NO SUBMISSIONS</div>;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ff003c]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
      {projects.map(project => {
        const editor = editors.find(e => e.id === project.editorId);
        const [feedback, setFeedback] = useState('');

        const handleRequestChanges = async () => {
          if (!feedback) return;
          try {
            await updateDoc(doc(db, 'projects', project.id), {
              status: 'changes_requested',
              feedback
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
          }
        };

        const handleMarkCompleted = async () => {
          try {
            await updateDoc(doc(db, 'projects', project.id), {
              status: 'completed'
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
          }
        };

        const handleTogglePaid = async () => {
          try {
            const newPaidStatus = !project.isPaid;
            await updateDoc(doc(db, 'projects', project.id), {
              isPaid: newPaidStatus
            });

            // Update editor's total earned
            if (editor) {
              const amountChange = newPaidStatus ? project.amount : -project.amount;
              await updateDoc(doc(db, 'users', editor.id), {
                totalEarned: (editor.totalEarned || 0) + amountChange,
                currentMonthEarned: (editor.currentMonthEarned || 0) + amountChange // Simplified for now
              });
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
          }
        };

        return (
          <div key={project.id} className="border border-white/10 rounded-xl p-5 bg-black/40 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-display text-lg text-[#00f3ff] tracking-wider">{project.name}</h4>
                <p className="font-mono text-xs text-white/50 mt-1 flex items-center gap-2">
                  <User className="w-3 h-3" /> EDITOR: {editor?.displayName || editor?.email || 'UNKNOWN'}
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <a href={project.submissionLink} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline border border-[#00f3ff]/50 px-3 py-1 rounded bg-[#00f3ff]/10">VIEW SUBMISSION</a>
              </div>
            </div>

            {project.status === 'submitted' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="FEEDBACK FOR CHANGES..." 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none"
                  />
                  <button 
                    onClick={handleRequestChanges}
                    disabled={!feedback}
                    className="bg-[#ff003c]/20 hover:bg-[#ff003c]/30 text-[#ff003c] border border-[#ff003c]/50 rounded-lg px-4 py-2 font-mono text-xs tracking-widest disabled:opacity-50"
                  >
                    REQ CHANGES
                  </button>
                </div>
                <button 
                  onClick={handleMarkCompleted}
                  className="w-full bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 text-[#00f3ff] border border-[#00f3ff]/50 rounded-lg px-4 py-2 font-mono text-xs tracking-widest"
                >
                  MARK COMPLETED
                </button>
              </div>
            )}

            {project.status === 'completed' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="font-mono text-xs text-[#00f3ff]">PROJECT COMPLETED</span>
                <button 
                  onClick={handleTogglePaid}
                  className={`font-mono text-xs tracking-widest px-4 py-2 rounded-lg border ${project.isPaid ? 'bg-[#ff003c]/20 text-[#ff003c] border-[#ff003c]/50' : 'bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/50'}`}
                >
                  {project.isPaid ? 'REMOVE PAYMENT' : 'MARK PAID'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Inbox({ editors }: { editors: any[] }) {
  const [selectedEditor, setSelectedEditor] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!selectedEditor) return;
    const q = query(collection(db, `chats/${selectedEditor.id}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [selectedEditor]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser || !selectedEditor) return;
    
    try {
      await addDoc(collection(db, `chats/${selectedEditor.id}/messages`), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  if (!selectedEditor) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ff003c]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
        <h4 className="font-mono text-xs text-white/50 tracking-widest mb-4">SELECT EDITOR TO CHAT</h4>
        {editors.map(editor => (
          <button 
            key={editor.id}
            onClick={() => setSelectedEditor(editor)}
            className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 font-mono text-xs text-white transition-colors"
          >
            {editor.displayName || editor.email}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <span className="font-mono text-xs text-[#ff003c] tracking-widest">CHAT: {selectedEditor.displayName || selectedEditor.email}</span>
        <button onClick={() => setSelectedEditor(null)} className="font-mono text-[10px] text-white/50 hover:text-white">BACK TO INBOX</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ff003c]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
        {messages.map(msg => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 font-mono text-xs ${isMe ? 'bg-[#ff003c]/20 border border-[#ff003c]/30 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                <p className="text-[9px] opacity-50 mb-1">{isMe ? 'MANAGEMENT' : selectedEditor.displayName || 'EDITOR'}</p>
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
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none"
        />
        <button type="submit" className="bg-[#ff003c]/20 hover:bg-[#ff003c]/30 text-[#ff003c] border border-[#ff003c]/50 rounded-lg px-4 py-2 flex items-center justify-center">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function AgencyGroupChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'group_chat'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'group_chat'), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        senderName: 'Management',
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ff003c]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
        {messages.map(msg => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 font-mono text-xs ${isMe ? 'bg-[#ff003c]/20 border border-[#ff003c]/30 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                <p className={`text-[9px] opacity-70 mb-1 ${isMe ? 'text-[#ff003c]' : 'text-[#00f3ff]'}`}>{msg.senderName}</p>
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
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 font-mono text-xs text-white focus:border-[#ff003c]/50 focus:outline-none"
        />
        <button type="submit" className="bg-[#ff003c]/20 hover:bg-[#ff003c]/30 text-[#ff003c] border border-[#ff003c]/50 rounded-lg px-4 py-2 flex items-center justify-center">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function AgencyPayments({ projects, editors }: { projects: any[], editors: any[] }) {
  const totalPaid = projects.filter(p => p.isPaid).reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingProjects = projects.filter(p => p.status === 'completed' && !p.isPaid);
  const totalPending = pendingProjects.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="p-6 space-y-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ff003c]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#00f3ff]/10 border border-[#00f3ff]/30 rounded-xl p-5">
          <p className="font-mono text-[10px] text-[#00f3ff]/70 tracking-widest mb-2">TOTAL PAID (ALL TIME)</p>
          <p className="font-display text-3xl text-[#00f3ff]">${totalPaid}</p>
        </div>
        <div className="bg-[#ff003c]/10 border border-[#ff003c]/30 rounded-xl p-5">
          <p className="font-mono text-[10px] text-[#ff003c]/70 tracking-widest mb-2">TOTAL PENDING CLEARANCE</p>
          <p className="font-display text-3xl text-[#ff003c]">${totalPending}</p>
        </div>
      </div>

      <div>
        <h4 className="font-mono text-xs text-white/50 tracking-widest mb-4">PENDING PAYMENTS</h4>
        {pendingProjects.length === 0 ? (
          <p className="font-mono text-xs text-white/30">NO PENDING PAYMENTS</p>
        ) : (
          <div className="space-y-2">
            {pendingProjects.map(p => {
              const editor = editors.find(e => e.id === p.editorId);
              return (
                <div key={p.id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-xs">
                  <div>
                    <span className="text-white/80 block">{p.name}</span>
                    <span className="text-white/40 text-[10px]">EDITOR: {editor?.displayName || editor?.email}</span>
                  </div>
                  <span className="text-[#ff003c]">${p.amount}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-mono text-xs text-white/50 tracking-widest mb-4">EDITOR EARNINGS</h4>
        <div className="space-y-2">
          {editors.map(editor => (
            <div key={editor.id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-xs">
              <span className="text-white/80">{editor.displayName || editor.email}</span>
              <span className="text-[#00f3ff]">${editor.totalEarned || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
