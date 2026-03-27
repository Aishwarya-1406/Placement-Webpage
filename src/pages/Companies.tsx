import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Company, StudentProfile } from '../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Briefcase, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { recommendCompanies } from '../services/geminiService';
import { cn } from '../lib/utils';

export default function Companies() {
  const { user, isAdmin, isStudent } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [applying, setApplying] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    description: '',
    package: 0,
    minCgpa: 0,
    requiredSkills: '',
    location: '',
    deadline: '',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'companies'), orderBy('createdAt', 'desc')), (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(companiesData);
      setLoading(false);
    });

    if (isStudent && user) {
      getDoc(doc(db, 'students', user.uid)).then(snap => {
        if (snap.exists()) {
          const profile = snap.data() as StudentProfile;
          setStudentProfile(profile);
        }
      });
    }

    return () => unsubscribe();
  }, [isStudent, user]);

  useEffect(() => {
    if (isStudent && studentProfile && companies.length > 0) {
      recommendCompanies(studentProfile.skills, studentProfile.cgpa, companies).then(recs => {
        setRecommendations(recs);
      });
    }
  }, [isStudent, studentProfile, companies]);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await updateDoc(doc(db, 'companies', editingCompany.id), {
          ...newCompany,
          requiredSkills: newCompany.requiredSkills.split(',').map(s => s.trim()),
        });
      } else {
        await addDoc(collection(db, 'companies'), {
          ...newCompany,
          requiredSkills: newCompany.requiredSkills.split(',').map(s => s.trim()),
          createdAt: serverTimestamp(),
        });
      }
      setIsAdding(false);
      setEditingCompany(null);
      setNewCompany({
        name: '',
        description: '',
        package: 0,
        minCgpa: 0,
        requiredSkills: '',
        location: '',
        deadline: '',
      });
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteDoc(doc(db, 'companies', id));
      } catch (error) {
        console.error("Error deleting company:", error);
      }
    }
  };

  const handleApply = async (company: Company) => {
    if (!user || !studentProfile) return;
    
    setApplying(true);
    try {
      // Check if already applied
      const appRef = doc(db, 'applications', `${user.uid}_${company.id}`);
      const appSnap = await getDoc(appRef);
      
      if (appSnap.exists()) {
        alert('You have already applied to this company.');
        return;
      }

      await setDoc(appRef, {
        studentId: user.uid,
        studentName: user.displayName,
        companyId: company.id,
        companyName: company.name,
        status: 'pending',
        appliedAt: serverTimestamp(),
      });

      alert('Application submitted successfully!');
      setSelectedCompany(null);
    } catch (error) {
      console.error("Error applying:", error);
      alert('Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const isEligible = (company: Company) => {
    if (!studentProfile) return false;
    const cgpaMatch = studentProfile.cgpa >= company.minCgpa;
    const skillMatch = company.requiredSkills.every(skill => 
      studentProfile.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
    return cgpaMatch && skillMatch;
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search companies, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        
        {isAdmin && (
          <button
            onClick={() => {
              setEditingCompany(null);
              setNewCompany({
                name: '',
                description: '',
                package: 0,
                minCgpa: 0,
                requiredSkills: '',
                location: '',
                deadline: '',
              });
              setIsAdding(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Plus size={20} />
            Add Company
          </button>
        )}
      </div>

      {/* AI Recommendations for Students */}
      {isStudent && recommendations.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-200/50 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Sparkles className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold">AI Recommended for You</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec, idx) => {
                const company = companies.find(c => c.id === rec.companyId);
                if (!company) return null;
                return (
                  <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                    <h4 className="font-bold text-lg mb-2">{company.name}</h4>
                    <p className="text-sm text-indigo-100 line-clamp-3">{rec.reason}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">{company.package} LPA</span>
                      <button 
                        onClick={() => setSelectedCompany(company)}
                        className="text-xs font-bold bg-white text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <motion.div
            key={company.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 group hover:shadow-md transition-all relative"
          >
            {isAdmin && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingCompany(company);
                    setNewCompany({
                      name: company.name,
                      description: company.description,
                      package: company.package,
                      minCgpa: company.minCgpa,
                      requiredSkills: company.requiredSkills.join(', '),
                      location: company.location,
                      deadline: company.deadline?.toDate ? format(company.deadline.toDate(), 'yyyy-MM-dd') : '',
                    });
                    setIsAdding(true);
                  }}
                  className="p-2 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteCompany(company.id)}
                  className="p-2 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                <Building2 className="text-slate-400 group-hover:text-primary transition-colors" size={28} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{company.package} <span className="text-xs text-slate-400 font-medium uppercase">LPA</span></p>
                <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">Full Time</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{company.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-6">{company.description}</p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span>{company.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Briefcase size={16} className="text-slate-400" />
                <span>Min. CGPA: {company.minCgpa}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Deadline: {company.deadline?.toDate ? format(company.deadline.toDate(), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {company.requiredSkills.map((skill, idx) => (
                <span key={idx} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">{skill}</span>
              ))}
            </div>

            <button 
              onClick={() => setSelectedCompany(company)}
              className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-2xl group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-2"
            >
              View Details
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Company Details Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompany(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
            >
              <button 
                onClick={() => setSelectedCompany(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100">
                  <Building2 className="text-primary" size={40} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{selectedCompany.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg font-bold text-primary">{selectedCompany.package} LPA</span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    <span className="text-slate-500">{selectedCompany.location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About the Company</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedCompany.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Eligibility</h4>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 size={18} className={cn(studentProfile && studentProfile.cgpa >= selectedCompany.minCgpa ? "text-emerald-500" : "text-slate-300")} />
                      <span className="font-medium">Min. CGPA: {selectedCompany.minCgpa}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deadline</h4>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar size={18} className="text-slate-400" />
                      <span className="font-medium">{selectedCompany.deadline?.toDate ? format(selectedCompany.deadline.toDate(), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.requiredSkills.map((skill, idx) => (
                      <span key={idx} className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-bold border transition-colors",
                        studentProfile?.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                          : "bg-slate-50 border-slate-100 text-slate-500"
                      )}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isStudent && (
                <div className="flex flex-col gap-4">
                  {!isEligible(selectedCompany) && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="text-amber-600 shrink-0" size={20} />
                      <p className="text-sm text-amber-700">
                        You might not be eligible for this role based on your current CGPA or skills.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handleApply(selectedCompany)}
                    disabled={applying}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
                  >
                    {applying ? 'Submitting...' : 'Apply Now'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Company Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-8">{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
              <form onSubmit={handleAddCompany} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                  <input
                    required
                    type="text"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Package (LPA)</label>
                  <input
                    required
                    type="number"
                    value={newCompany.package}
                    onChange={(e) => setNewCompany({ ...newCompany, package: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea
                    required
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Min. CGPA</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={newCompany.minCgpa}
                    onChange={(e) => setNewCompany({ ...newCompany, minCgpa: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deadline</label>
                  <input
                    required
                    type="date"
                    value={newCompany.deadline}
                    onChange={(e) => setNewCompany({ ...newCompany, deadline: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills (comma separated)</label>
                  <input
                    required
                    type="text"
                    placeholder="React, Node.js, Python..."
                    value={newCompany.requiredSkills}
                    onChange={(e) => setNewCompany({ ...newCompany, requiredSkills: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</label>
                  <input
                    required
                    type="text"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                  >
                    {editingCompany ? 'Update Company' : 'Save Company'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
