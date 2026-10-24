import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadDB, saveDB } from '../services/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [db, setDb] = useState(loadDB());
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kite_current_user');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    // Default to Super Admin so localhost opens immediately ready for use
    return {
      id: 'USR-ADMIN',
      name: 'Super Admin',
      role: 'ADMIN',
      phone: '9851000000',
      title: 'Administrator'
    };
  });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setDb(loadDB());
    };
    window.addEventListener('kite_db_updated', handleUpdate);
    return () => window.removeEventListener('kite_db_updated', handleUpdate);
  }, []);

  const loginWithPin = (pin, preferredTrainerId = null) => {
    // 1. Check Admin PIN
    if (pin === '1111') {
      const user = {
        id: 'USR-ADMIN',
        name: 'Super Admin',
        role: 'ADMIN',
        title: 'Institute Administrator'
      };
      setCurrentUser(user);
      sessionStorage.setItem('kite_current_user', JSON.stringify(user));
      setIsLocked(false);
      return { success: true, user };
    }

    // 2. Check Front Desk PIN
    if (pin === '2222') {
      const user = {
        id: 'USR-STAFF',
        name: 'Front Desk Officer',
        role: 'STAFF',
        title: 'Admissions & Inquiries'
      };
      setCurrentUser(user);
      sessionStorage.setItem('kite_current_user', JSON.stringify(user));
      setIsLocked(false);
      return { success: true, user };
    }

    const currentDb = loadDB();

    // 3. Check Trainer PINs
    const matchingTrainers = (currentDb.trainers || []).filter((t) => t.pin === pin);
    if (matchingTrainers.length > 0) {
      const trainer = preferredTrainerId
        ? matchingTrainers.find((t) => t.id === preferredTrainerId) || matchingTrainers[0]
        : matchingTrainers[0];

      const user = {
        id: trainer.id,
        name: trainer.name,
        role: 'TRAINER',
        trainerId: trainer.id,
        occupationId: trainer.occupationId,
        specialization: trainer.specialization,
        photo: trainer.photo,
        title: `Trainer (${trainer.specialization || 'Instructor'})`
      };
      setCurrentUser(user);
      sessionStorage.setItem('kite_current_user', JSON.stringify(user));
      setIsLocked(false);
      return { success: true, user };
    }

    // 4. Quick match for Student (default PIN: 1234, 3333)
    if (pin === '3333') {
      const std = (currentDb.students || [])[0];
      if (std) {
        return loginAsStudent(std.id);
      }
    }

    // 5. Quick match for Employer (default PIN: 4444)
    if (pin === '4444') {
      const emp = (currentDb.employers || [])[0];
      if (emp) {
        return loginAsEmployer(emp.id);
      }
    }

    return { success: false, message: 'Invalid 4-digit PIN code. (Admin: 1111, Staff: 2222, Trainer: 1234/2345, Student: 3333, Employer: 4444)' };
  };

  const loginWithPhonePin = (phone, pin) => {
    const currentDb = loadDB();
    const cleanPhone = (phone || '').trim().replace(/[^0-9]/g, '');

    // Check Students
    const student = (currentDb.students || []).find((s) => {
      const p = (s.phone || '').trim().replace(/[^0-9]/g, '');
      return p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p);
    });

    if (student) {
      const validPin = student.pin || '1234';
      if (pin === validPin || pin === '1234' || pin === '1111') {
        return loginAsStudent(student.id);
      }
      return { success: false, message: 'पिन कोड मिलेन। (PIN Incorrect)' };
    }

    // Check Employers
    const employer = (currentDb.employers || []).find((e) => {
      const p = (e.phone || '').trim().replace(/[^0-9]/g, '');
      return p === cleanPhone || (e.email && e.email.toLowerCase() === phone.trim().toLowerCase());
    });

    if (employer) {
      const validPin = employer.pin || '1234';
      if (pin === validPin || pin === '1234' || pin === '1111') {
        return loginAsEmployer(employer.id);
      }
      return { success: false, message: 'पिन कोड मिलेन। (PIN Incorrect)' };
    }

    return { success: false, message: 'यो फोन नम्बर दर्ता भएको छैन। (Phone number not found)' };
  };

  const loginAsStudent = (studentId) => {
    const currentDb = loadDB();
    const student = (currentDb.students || []).find((s) => s.id === studentId) || (currentDb.students || [])[0];
    if (!student) return { success: false, message: 'Student record not found.' };

    const user = {
      id: student.id,
      studentId: student.id,
      name: student.name,
      role: 'STUDENT',
      phone: student.phone,
      tgid: student.tgid,
      groupId: student.groupId,
      title: 'Student / Trainee'
    };
    setCurrentUser(user);
    sessionStorage.setItem('kite_current_user', JSON.stringify(user));
    setIsLocked(false);
    return { success: true, user };
  };

  const loginAsEmployer = (employerId) => {
    const currentDb = loadDB();
    const employer = (currentDb.employers || []).find((e) => e.id === employerId) || (currentDb.employers || [])[0];
    if (!employer) return { success: false, message: 'Employer record not found.' };

    const user = {
      id: employer.id,
      employerId: employer.id,
      name: employer.name,
      role: 'EMPLOYER',
      phone: employer.phone,
      industry: employer.industry,
      status: employer.status,
      title: 'Employer Partner'
    };
    setCurrentUser(user);
    sessionStorage.setItem('kite_current_user', JSON.stringify(user));
    setIsLocked(false);
    return { success: true, user };
  };

  const logout = () => {
    setIsLocked(true);
  };

  const unlock = () => {
    setIsLocked(false);
  };

  const switchUser = (role, targetId = null) => {
    if (role === 'ADMIN') {
      loginWithPin('1111');
    } else if (role === 'STAFF') {
      loginWithPin('2222');
    } else if (role === 'TRAINER') {
      const currentDb = loadDB();
      const t = currentDb.trainers.find((x) => x.id === targetId) || currentDb.trainers[0];
      if (t) {
        loginWithPin(t.pin, t.id);
      }
    } else if (role === 'STUDENT') {
      loginAsStudent(targetId);
    } else if (role === 'EMPLOYER') {
      loginAsEmployer(targetId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLocked,
        loginWithPin,
        loginWithPhonePin,
        loginAsStudent,
        loginAsEmployer,
        logout,
        unlock,
        switchUser,
        isAdmin: currentUser?.role === 'ADMIN',
        isTrainer: currentUser?.role === 'TRAINER',
        isStaff: currentUser?.role === 'STAFF',
        isStudent: currentUser?.role === 'STUDENT',
        isEmployer: currentUser?.role === 'EMPLOYER',
        activeTrainerId: currentUser?.role === 'TRAINER' ? currentUser.trainerId : null,
        activeStudentId: currentUser?.role === 'STUDENT' ? currentUser.studentId : null,
        activeEmployerId: currentUser?.role === 'EMPLOYER' ? currentUser.employerId : null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
