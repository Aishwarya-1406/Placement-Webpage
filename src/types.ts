export type UserRole = 'admin' | 'student';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  createdAt: any; // Firestore Timestamp
}

export interface StudentProfile {
  uid: string;
  name: string;
  email: string;
  department: string;
  cgpa: number;
  skills: string[];
  resumeUrl?: string;
  graduationYear: number;
  status: 'placed' | 'unplaced' | 'in-process';
  updatedAt: any;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  package: number;
  minCgpa: number;
  requiredSkills: string[];
  location: string;
  deadline: any;
  logoUrl?: string;
  createdAt: any;
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  companyId: string;
  companyName: string;
  status: 'pending' | 'selected' | 'rejected';
  appliedAt: any;
  feedback?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}
