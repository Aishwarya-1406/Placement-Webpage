import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { GraduationCap, LogIn, ShieldCheck, User as UserIcon, Mail, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  // New states for Email/Password login
  const [loginMode, setLoginMode] = useState<'initial' | 'email'>('initial');
  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user - show role selection
        setPendingUser(user);
        setShowRoleSelection(true);
      } else {
        // Existing user - redirect to dashboard
        navigate('/');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        if (name) {
          await updateProfile(user, { displayName: name });
        }

        // Save user profile with selected role
        await saveUserProfile(user, activeTab, name);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Check if user role matches the active tab
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role !== activeTab) {
            setError(`This account is registered as a ${userData.role}. Please switch tabs.`);
            setLoading(false);
            return;
          }
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error("Email auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async (user: FirebaseUser, role: UserRole, displayName?: string) => {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName,
      photoURL: user.photoURL,
      role: role,
      createdAt: serverTimestamp(),
    });

    if (role === 'student') {
      // Create empty student profile
      await setDoc(doc(db, 'students', user.uid), {
        uid: user.uid,
        name: displayName || user.displayName || '',
        email: user.email || '',
        department: '',
        cgpa: 0,
        skills: [],
        graduationYear: new Date().getFullYear(),
        status: 'unplaced',
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleRoleSelection = async (role: UserRole) => {
    if (!pendingUser) return;
    
    setLoading(true);
    try {
      await saveUserProfile(pendingUser, role);
      navigate('/');
    } catch (err: any) {
      console.error("Role selection error:", err);
      setError("Failed to save user role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderInitialView = () => (
    <motion.div 
      key="initial"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100"
    >
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
          <GraduationCap className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PlacementHub</h1>
        <p className="text-slate-500 mt-2">Choose your login method</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => { setLoginMode('email'); setActiveTab('student'); setIsSignUp(false); }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
            <UserIcon size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">Login as Student</h3>
            <p className="text-xs text-slate-500">Access your placement profile</p>
          </div>
          <ArrowRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => { setLoginMode('email'); setActiveTab('admin'); setIsSignUp(false); }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">Login as Admin</h3>
            <p className="text-xs text-slate-500">Manage placements and students</p>
          </div>
          <ArrowRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-primary/20 hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all duration-200 group disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>
      </div>

      <div className="mt-10 pt-8 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">University Placement Cell</p>
      </div>
    </motion.div>
  );

  const renderEmailView = () => (
    <motion.div 
      key="email"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100"
    >
      <button 
        onClick={() => setLoginMode('initial')}
        className="mb-6 text-sm font-bold text-slate-400 hover:text-primary flex items-center gap-2 transition-colors"
      >
        <ArrowRight size={16} className="rotate-180" />
        Back to options
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isSignUp ? 'Create Account' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Login`}
        </h2>
        <p className="text-slate-500 mt-1">Enter your credentials to continue</p>
      </div>

      {/* Role Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('student')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'student' 
              ? "bg-white text-primary shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <UserIcon size={18} />
          Student
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'admin' 
              ? "bg-white text-primary shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <ShieldCheck size={18} />
          Admin
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="space-y-5">
        {isSignUp && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              required
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>{isSignUp ? 'Create Account' : 'Login'}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          {isSignUp ? (
            <>Already have an account? <span className="text-primary">Login</span></>
          ) : (
            <>Don't have an account? <span className="text-primary">Sign up</span></>
          )}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {showRoleSelection ? (
          <motion.div 
            key="role-selection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">One Last Step</h2>
              <p className="text-slate-500 mt-2">Please select your role to continue</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => handleRoleSelection('student')}
                disabled={loading}
                className="flex items-center gap-5 p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                  <UserIcon size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Student</h3>
                  <p className="text-sm text-slate-500">Apply for jobs and track applications</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelection('admin')}
                disabled={loading}
                className="flex items-center gap-5 p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Admin</h3>
                  <p className="text-sm text-slate-500">Manage companies and student placements</p>
                </div>
              </button>
            </div>

            <p className="mt-10 text-xs text-center text-slate-400 font-medium leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        ) : loginMode === 'initial' ? (
          renderInitialView()
        ) : (
          renderEmailView()
        )}
      </AnimatePresence>
      
      <p className="mt-10 text-slate-400 text-sm font-medium">
        &copy; {new Date().getFullYear()} PlacementHub. All rights reserved.
      </p>
    </div>
  );
}

const AlertCircle = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
