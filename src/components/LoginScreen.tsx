import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, UserPlus, Mail, Globe, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { TriadLogo } from './TriadLogo';

type LoginState = 'selection' | 'agency' | 'editor-selection' | 'editor-new' | 'editor-existing';

export function LoginScreen({ onLogin }: { onLogin: (role: string) => void }) {
  const [state, setState] = useState<LoginState>('selection');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Agency State
  const [passkey, setPasskey] = useState('');

  // Editor State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAgencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // We use a dedicated agency account for Firebase Auth
      // If the passkey is correct, we sign in. If it fails, we show incorrect passkey.
      // The passkey is 'brajj@2009'. We will try to sign in with agency@triad.workspace and the passkey.
      try {
        await signInWithEmailAndPassword(auth, 'agency@triad.workspace', passkey);
        onLogin('agency');
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // If the account doesn't exist yet, and the passkey is exactly 'brajj@2009', we create it.
          // This is a bootstrap mechanism for the prototype.
          if (passkey === 'brajj@2009') {
            const userCred = await createUserWithEmailAndPassword(auth, 'agency@triad.workspace', passkey);
            await setDoc(doc(db, 'users', userCred.user.uid), {
              email: 'agency@triad.workspace',
              role: 'agency',
              agencyName: 'triad editing agency',
              createdAt: serverTimestamp()
            });
            onLogin('agency');
          } else {
            setError('Incorrect pass key');
          }
        } else if (err.code === 'auth/wrong-password') {
          setError('Incorrect pass key');
        } else if (err.code === 'auth/network-request-failed') {
          setError('Network error: Please disable adblockers/VPNs or check your connection.');
        } else if (err.code === 'auth/operation-not-allowed') {
          setError('Error: Email/Password auth is not enabled in your Firebase Console.');
        } else {
          setError(err.message || 'Login failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email,
          displayName: name,
          country,
          role: 'editor',
          agencyName: 'triad editing agency',
          createdAt: serverTimestamp()
        });
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.CREATE, `users/${userCred.user.uid}`);
      }

      onLogin('editor');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Account already exists. Please login.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: Please disable adblockers/VPNs or check your connection.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Error: Email/Password auth is not enabled in your Firebase Console.');
      } else {
        setError(err.message || 'Signup failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user exists in our records as an editor
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'editor') {
        // Sign out if they aren't a valid editor
        await auth.signOut();
        setError('No such editor in record');
        return;
      }

      onLogin('editor');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('No such editor in record');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: Please disable adblockers/VPNs or check your connection.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Error: Email/Password auth is not enabled in your Firebase Console.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = (newState: LoginState) => {
    setState(newState);
    setError('');
    setPasskey('');
    setName('');
    setEmail('');
    setCountry('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] text-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-12 flex justify-center">
          <TriadLogo className="w-48 h-auto drop-shadow-[0_0_15px_rgba(0,243,255,0.3)]" />
        </div>

        <div className="border border-white/10 bg-black/60 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Neon Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-50" />

          <AnimatePresence mode="wait">
            {state === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4"
              >
                <h2 className="font-display text-xl tracking-[0.2em] text-center mb-6 text-white/90">SELECT ROLE</h2>
                <button
                  onClick={() => resetState('editor-selection')}
                  className="group relative flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-[#00f3ff]/10 border border-white/10 hover:border-[#00f3ff]/50 rounded-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f3ff]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <User className="w-5 h-5 text-[#00f3ff]" />
                  <span className="font-mono text-sm tracking-widest">EDITOR LOGIN</span>
                </button>
                <button
                  onClick={() => resetState('agency')}
                  className="group relative flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-[#ff003c]/10 border border-white/10 hover:border-[#ff003c]/50 rounded-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff003c]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Lock className="w-5 h-5 text-[#ff003c]" />
                  <span className="font-mono text-sm tracking-widest">AGENCY LOGIN</span>
                </button>
              </motion.div>
            )}

            {state === 'agency' && (
              <motion.div
                key="agency"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button onClick={() => resetState('selection')} className="mb-6 text-white/50 hover:text-white transition-colors flex items-center gap-2 font-mono text-xs">
                  <ArrowLeft className="w-4 h-4" /> BACK
                </button>
                <h2 className="font-display text-xl tracking-[0.2em] text-center mb-6 text-[#ff003c] drop-shadow-[0_0_8px_rgba(255,0,60,0.5)]">AGENCY ACCESS</h2>
                
                <form onSubmit={handleAgencyLogin} className="flex flex-col gap-4">
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="ENTER PASS KEY"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff003c]/50 focus:ring-1 focus:ring-[#ff003c]/50 transition-all"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="flex items-center gap-2 text-[#ff003c] font-mono text-xs mt-2 bg-[#ff003c]/10 p-3 rounded-lg border border-[#ff003c]/20">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-full py-3 bg-[#ff003c]/20 hover:bg-[#ff003c]/30 border border-[#ff003c]/50 text-[#ff003c] rounded-xl font-mono text-sm tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'AUTHENTICATING...' : 'AUTHORIZE'}
                  </button>
                </form>
              </motion.div>
            )}

            {state === 'editor-selection' && (
              <motion.div
                key="editor-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4"
              >
                <button onClick={() => resetState('selection')} className="mb-2 text-white/50 hover:text-white transition-colors flex items-center gap-2 font-mono text-xs">
                  <ArrowLeft className="w-4 h-4" /> BACK
                </button>
                <h2 className="font-display text-xl tracking-[0.2em] text-center mb-6 text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">EDITOR PORTAL</h2>
                
                <button
                  onClick={() => resetState('editor-new')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-[#00f3ff]/10 border border-white/10 hover:border-[#00f3ff]/50 rounded-xl transition-all duration-300"
                >
                  <UserPlus className="w-5 h-5 text-[#00f3ff]" />
                  <span className="font-mono text-sm tracking-widest">NEW ACCOUNT</span>
                </button>
                <button
                  onClick={() => resetState('editor-existing')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-[#00f3ff]/10 border border-white/10 hover:border-[#00f3ff]/50 rounded-xl transition-all duration-300"
                >
                  <User className="w-5 h-5 text-[#00f3ff]" />
                  <span className="font-mono text-sm tracking-widest">EXISTING ACCOUNT</span>
                </button>
              </motion.div>
            )}

            {state === 'editor-new' && (
              <motion.div
                key="editor-new"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-h-[60vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#00f3ff]/30 [&::-webkit-scrollbar-thumb]:rounded-full"
              >
                <button onClick={() => resetState('editor-selection')} className="mb-6 text-white/50 hover:text-white transition-colors flex items-center gap-2 font-mono text-xs">
                  <ArrowLeft className="w-4 h-4" /> BACK
                </button>
                <h2 className="font-display text-lg tracking-[0.2em] text-center mb-6 text-[#00f3ff]">CREATE ACCOUNT</h2>
                
                <form onSubmit={handleEditorSignup} className="flex flex-col gap-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="FULL NAME"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="GMAIL ADDRESS"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="COUNTRY"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="CREATE PASSWORD"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="RE-ENTER PASSWORD"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-[#ff003c] font-mono text-xs mt-2 bg-[#ff003c]/10 p-3 rounded-lg border border-[#ff003c]/20">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-full py-3 bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 border border-[#00f3ff]/50 text-[#00f3ff] rounded-xl font-mono text-sm tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'CREATING...' : 'REGISTER'}
                  </button>
                </form>
              </motion.div>
            )}

            {state === 'editor-existing' && (
              <motion.div
                key="editor-existing"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button onClick={() => resetState('editor-selection')} className="mb-6 text-white/50 hover:text-white transition-colors flex items-center gap-2 font-mono text-xs">
                  <ArrowLeft className="w-4 h-4" /> BACK
                </button>
                <h2 className="font-display text-lg tracking-[0.2em] text-center mb-6 text-[#00f3ff]">LOGIN</h2>
                
                <form onSubmit={handleEditorLogin} className="flex flex-col gap-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="GMAIL ADDRESS"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="PASSWORD"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-[#ff003c] font-mono text-xs mt-2 bg-[#ff003c]/10 p-3 rounded-lg border border-[#ff003c]/20">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-full py-3 bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 border border-[#00f3ff]/50 text-[#00f3ff] rounded-xl font-mono text-sm tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'AUTHENTICATING...' : 'LOGIN'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
