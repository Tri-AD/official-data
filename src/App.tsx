import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { TitleBar } from './components/TitleBar';
import { SplashScreen } from './components/SplashScreen';
import { Workspace } from './components/Workspace';
import { LoginScreen } from './components/LoginScreen';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user role
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
            setIsAuthenticated(true);
          } else {
            // If no user doc, sign out
            await auth.signOut();
            setIsAuthenticated(false);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] overflow-hidden selection:bg-[#00f3ff]/30">
      <TitleBar />
      <div className="flex-1 relative flex flex-col">
        <AnimatePresence mode="wait">
          {!isSplashDone ? (
            <SplashScreen key="splash" onComplete={() => setIsSplashDone(true)} />
          ) : !isAuthReady ? (
            <div key="loading" className="flex-1 flex items-center justify-center bg-[#050505]">
              <div className="w-8 h-8 border border-[#00f3ff]/30 rounded-full animate-[spin_1s_linear_infinite] border-t-[#00f3ff]" />
            </div>
          ) : !isAuthenticated ? (
            <LoginScreen key="login" onLogin={handleLogin} />
          ) : (
            <Workspace key="workspace" role={userRole} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
