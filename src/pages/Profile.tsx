import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { StudentProfile, User } from '../types';
import { 
  UserCircle, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Save, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { parseResume } from '../services/geminiService';
import { Navigate } from 'react-router-dom';

export default function Profile() {
  const { user, isStudent, loading: authLoading } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      if (!user?.uid || !isStudent) {
        setLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, 'students', user.uid));
        if (docSnap.exists()) {
          setStudent(docSnap.data() as StudentProfile);
          setResumeText(docSnap.data().resumeText || '');
        } else {
          // Initialize profile if it doesn't exist
          const initialProfile: StudentProfile = {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            department: '',
            cgpa: 0,
            graduationYear: new Date().getFullYear(),
            skills: [],
            resumeUrl: '',
            status: 'unplaced',
            updatedAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'students', user.uid), initialProfile);
          setStudent(initialProfile);
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [user, isStudent]);

  if (authLoading) return null;
  if (!isStudent) return <Navigate to="/dashboard" />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !student) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'students', user.uid), {
        ...student,
        resumeText,
        updatedAt: serverTimestamp(),
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error saving profile:", error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleParseResume = async () => {
    if (!resumeText) return;
    setParsing(true);
    try {
      const skills = await parseResume(resumeText);
      if (skills && skills.length > 0) {
        setStudent(prev => prev ? { ...prev, skills: Array.from(new Set([...prev.skills, ...skills])) } : null);
      }
    } catch (error) {
      console.error("Error parsing resume:", error);
    } finally {
      setParsing(false);
    }
  };

  const addSkill = () => {
    if (newSkill && student && !student.skills.includes(newSkill)) {
      setStudent({ ...student, skills: [...student.skills, newSkill] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (student) {
      setStudent({ ...student, skills: student.skills.filter(s => s !== skillToRemove) });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="w-32 h-32 rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="text-slate-400" size={64} />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user?.displayName}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Mail size={16} />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <GraduationCap size={16} />
              <span>{student?.department || 'No Department'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
          Save Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Academic Details */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <GraduationCap className="text-primary" size={20} />
            Academic Details
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</label>
              <input
                type="text"
                value={student?.department || ''}
                onChange={(e) => setStudent(prev => prev ? { ...prev, department: e.target.value } : null)}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={student?.cgpa || ''}
                  onChange={(e) => setStudent(prev => prev ? { ...prev, cgpa: Number(e.target.value) } : null)}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grad Year</label>
                <input
                  type="number"
                  value={student?.graduationYear || ''}
                  onChange={(e) => setStudent(prev => prev ? { ...prev, graduationYear: Number(e.target.value) } : null)}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Briefcase className="text-primary" size={20} />
            Skills & Expertise
          </h3>
          <div className="space-y-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button
                onClick={addSkill}
                className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {student?.skills.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-100">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
              {student?.skills.length === 0 && (
                <p className="text-sm text-slate-400 italic">No skills added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Resume Link */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <LinkIcon className="text-primary" size={20} />
            Resume Link
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Provide a link to your resume (Google Drive, Dropbox, etc.). Make sure it's publicly accessible.</p>
            <input
              type="url"
              value={student?.resumeUrl || ''}
              onChange={(e) => setStudent(prev => prev ? { ...prev, resumeUrl: e.target.value } : null)}
              placeholder="https://drive.google.com/..."
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
        </div>

        {/* Resume AI Parsing */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              Resume Analysis (AI)
            </h3>
            <button
              onClick={handleParseResume}
              disabled={parsing || !resumeText}
              className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {parsing ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={16} />}
              Extract Skills with AI
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Paste your resume text below to automatically extract skills and improve your profile.</p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here..."
              className="w-full h-48 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
