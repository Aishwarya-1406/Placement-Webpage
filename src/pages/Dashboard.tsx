import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  FileCheck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col gap-4"
  >
    <div className="flex items-center justify-between">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", color)}>
        <Icon className="text-white" size={24} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
          trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  </motion.div>
);

import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalApplications: 0,
    placedStudents: 0,
    avgPackage: 0,
  });
  const [studentStats, setStudentStats] = useState({
    applied: 0,
    selected: 0,
    rejected: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAdmin) {
          const studentsSnap = await getDocs(collection(db, 'students'));
          const companiesSnap = await getDocs(collection(db, 'companies'));
          const appsSnap = await getDocs(collection(db, 'applications'));
          
          const students = studentsSnap.docs.map(doc => doc.data());
          const placed = students.filter(s => s.status === 'placed').length;
          const totalPackage = companiesSnap.docs.reduce((acc, doc) => acc + (doc.data().package || 0), 0);
          
          setStats({
            totalStudents: studentsSnap.size,
            totalCompanies: companiesSnap.size,
            totalApplications: appsSnap.size,
            placedStudents: placed,
            avgPackage: companiesSnap.size > 0 ? totalPackage / companiesSnap.size : 0,
          });

          const recentAppsQuery = query(
            collection(db, 'applications'),
            orderBy('appliedAt', 'desc'),
            limit(5)
          );
          const recentAppsSnap = await getDocs(recentAppsQuery);
          setRecentApplications(recentAppsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (isStudent && user) {
          const studentAppsQuery = query(
            collection(db, 'applications'),
            where('studentId', '==', user.uid)
          );
          const studentAppsSnap = await getDocs(studentAppsQuery);
          const apps = studentAppsSnap.docs.map(doc => doc.data());
          
          setStudentStats({
            applied: apps.length,
            selected: apps.filter(a => a.status === 'selected').length,
            rejected: apps.filter(a => a.status === 'rejected').length,
          });

          const recentStudentAppsQuery = query(
            collection(db, 'applications'),
            where('studentId', '==', user.uid),
            orderBy('appliedAt', 'desc'),
            limit(5)
          );
          const recentStudentAppsSnap = await getDocs(recentStudentAppsQuery);
          setRecentApplications(recentStudentAppsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, isStudent, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.displayName}!
          </h1>
          <p className="text-slate-500 mt-1">
            Logged in as <span className="font-bold text-primary capitalize">{user?.role}</span>. 
            {isAdmin ? " Here's the overall placement overview." : " Track your applications and explore opportunities."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <span className="text-sm font-semibold text-slate-700">{format(new Date(), 'MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <>
          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Students" 
              value={stats.totalStudents} 
              icon={Users} 
              trend="up" 
              trendValue={12} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Active Companies" 
              value={stats.totalCompanies} 
              icon={Building2} 
              trend="up" 
              trendValue={8} 
              color="bg-indigo-500" 
            />
            <StatCard 
              title="Total Applications" 
              value={stats.totalApplications} 
              icon={FileCheck} 
              trend="up" 
              trendValue={24} 
              color="bg-emerald-500" 
            />
            <StatCard 
              title="Avg. Package" 
              value={`${stats.avgPackage.toFixed(1)} LPA`} 
              icon={TrendingUp} 
              trend="up" 
              trendValue={5} 
              color="bg-amber-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Placement Trends</h3>
                  <p className="text-sm text-slate-500">Monthly student placements for 2024</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Jan', value: 40 },
                    { name: 'Feb', value: 30 },
                    { name: 'Mar', value: 60 },
                    { name: 'Apr', value: 80 },
                    { name: 'May', value: 50 },
                    { name: 'Jun', value: 90 },
                  ]}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Placement Status</h3>
              <p className="text-sm text-slate-500 mb-8">Current placement distribution</p>
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Placed', value: stats.placedStudents },
                        { name: 'Unplaced', value: stats.totalStudents - stats.placedStudents },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900">{Math.round((stats.placedStudents / (stats.totalStudents || 1)) * 100)}%</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Placed</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Student Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard 
              title="Total Applied" 
              value={studentStats.applied} 
              icon={FileCheck} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Selected" 
              value={studentStats.selected} 
              icon={CheckCircle2} 
              color="bg-emerald-500" 
            />
            <StatCard 
              title="Rejected" 
              value={studentStats.rejected} 
              icon={XCircle} 
              color="bg-rose-500" 
            />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/companies')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Explore Companies</p>
                  <p className="text-xs text-slate-500">Find and apply for new opportunities</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <UserCircle size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Update Profile</p>
                  <p className="text-xs text-slate-500">Keep your CGPA and skills up to date</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Recent Applications Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isAdmin ? "Recent Applications" : "My Recent Applications"}
            </h3>
            <p className="text-sm text-slate-500">
              {isAdmin ? "Latest student applications for companies" : "The status of your latest job applications"}
            </p>
          </div>
          <button 
            onClick={() => navigate('/applications')}
            className="text-sm font-bold text-primary hover:underline"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {isAdmin && <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>}
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  {isAdmin && (
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {app.studentName?.substring(0, 1).toUpperCase() || 'S'}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{app.studentName}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-4 text-sm font-medium text-slate-600">{app.companyName}</td>
                  <td className="px-8 py-4 text-sm text-slate-500">
                    {app.appliedAt?.toDate ? format(app.appliedAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      app.status === 'selected' ? "bg-emerald-50 text-emerald-600" :
                      app.status === 'rejected' ? "bg-rose-50 text-rose-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {app.status === 'selected' ? <CheckCircle2 size={14} /> :
                       app.status === 'rejected' ? <XCircle size={14} /> :
                       <Clock size={14} />}
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {recentApplications.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-8 py-10 text-center text-slate-400 italic">No recent applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
