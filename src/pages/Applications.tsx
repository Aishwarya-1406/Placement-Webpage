import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Application, Company, StudentProfile } from '../types';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  MoreVertical,
  ChevronDown,
  Building2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Applications() {
  const { user, isAdmin, isStudent } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;

    let q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));
    
    if (isStudent) {
      q = query(
        collection(db, 'applications'), 
        where('studentId', '==', user.uid),
        orderBy('appliedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isStudent, user]);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected': return <CheckCircle2 size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return <Clock size={16} />;
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
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={isAdmin ? "Search by company or student..." : "Search by company..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-slate-600"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                {isAdmin && <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>}
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Applied Date</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                {isAdmin && <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{app.companyName}</p>
                      </div>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                          <User size={16} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{app.studentName}</p>
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-6 text-sm text-slate-500">
                    {app.appliedAt?.toDate ? format(app.appliedAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                      getStatusColor(app.status)
                    )}>
                      {getStatusIcon(app.status)}
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                          className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="pending">Pending</option>
                          <option value="selected">Select</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 3} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <FileText size={48} className="opacity-20" />
                      <p className="text-lg font-medium">No applications found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
