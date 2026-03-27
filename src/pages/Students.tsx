import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { StudentProfile, User } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MoreVertical,
  ChevronRight,
  UserCircle,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Navigate } from 'react-router-dom';

export default function Students() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data() } as StudentProfile));
      setStudents(studentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || student.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(students.map(s => s.department))).filter(Boolean);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Department', 'CGPA', 'Graduation Year', 'Skills'];
    const rows = filteredStudents.map(s => [
      s.name || 'N/A',
      s.email || 'N/A',
      s.department || 'N/A',
      s.cgpa || '0',
      s.graduationYear || 'N/A',
      (s.skills || []).join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-slate-600"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <motion.div
            key={student.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 group hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  <UserCircle className="text-slate-400" size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{student.name || 'Unknown Student'}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{student.department || 'No Department'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CGPA</p>
                <p className="text-lg font-bold text-slate-900">{student.cgpa || '0.0'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grad Year</p>
                <p className="text-lg font-bold text-slate-900">{student.graduationYear}</p>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {student.skills?.slice(0, 4).map((skill: string, idx: number) => (
                  <span key={idx} className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-100 px-2 py-0.5 rounded-lg">{skill}</span>
                )) || <span className="text-xs text-slate-400 italic">No skills listed</span>}
                {student.skills?.length > 4 && <span className="text-[10px] text-slate-400 font-bold">+{student.skills.length - 4} more</span>}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                View Profile
              </button>
              {student.resumeUrl && (
                <a 
                  href={student.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center"
                >
                  <FileText size={20} />
                </a>
              )}
            </div>
          </motion.div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Users size={64} className="opacity-10" />
              <p className="text-xl font-medium">No students found.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
