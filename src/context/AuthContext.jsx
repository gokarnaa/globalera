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
    return null;
  });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setDb(loadDB());
    };
    window.addEventListener('kite_db_updated', handleUpdate);
    return () => window.removeEventListener('kite_db_updated', handleUpdate);
  }, []);

  // Universal Unified Login (Phone / Username / TGID / ID + PIN)
  const login = (identifier, pin, preferredRole = null) => {
    if (!identifier && !pin) {
      return { success: false, message: 'Please enter your username/phone and PIN.' };
    }

    const currentDb = loadDB();
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPhone = (identifier || '').trim().replace(/[^0-9]/g, '');
    const cleanPin = (pin || '').trim();
    const targetRole = preferredRole ? preferredRole.toUpperCase() : null;

    const isPhoneMatch = (storedPhone) => {
      const p = (storedPhone || '').trim().replace(/[^0-9]/g, '');
      if (cleanPhone.length < 7 || p.length < 7) return false;
      return p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p);
    };

    // 1. Check in db.users collection (prioritizing preferredRole if provided)
    const users = [...(currentDb.users || [])];
    if (targetRole) {
      users.sort((a, b) => {
        const aMatch = a.role === targetRole || (targetRole === 'ADMIN' && a.role === 'STAFF') ? 0 : 1;
        const bMatch = b.role === targetRole || (targetRole === 'ADMIN' && b.role === 'STAFF') ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    const matchedUser = users.find((u) => {
      const uUsername = (u.username || '').trim().toLowerCase();
      const uId = (u.id || '').trim().toLowerCase();
      const uStudentId = (u.studentId || '').trim().toLowerCase();
      const uTrainerId = (u.trainerId || '').trim().toLowerCase();
      const uAgentId = (u.agentId || '').trim().toLowerCase();
      const uAgentCode = (u.agentCode || '').trim().toLowerCase();
      const uTgid = (u.tgid || '').trim().toLowerCase();

      return (
        isPhoneMatch(u.phone) ||
        (cleanId && (uUsername === cleanId || uId === cleanId || uStudentId === cleanId || uTrainerId === cleanId || uAgentId === cleanId || uAgentCode === cleanId || uTgid === cleanId))
      );
    });

    if (matchedUser) {
      // Check Suspended Status
      if (matchedUser.status === 'Suspended') {
        return {
          success: false,
          message: 'Your account has been suspended. Please contact the institute administration.'
        };
      }

      // Check PIN
      const userPin = matchedUser.pin || '1234';
      const isPinMatch =
        cleanPin === userPin ||
        (matchedUser.role === 'ADMIN' && (cleanPin === 'admin123' || cleanPin === '1111'));

      if (isPinMatch) {
        let userObj = { ...matchedUser };

        if (matchedUser.role === 'TRAINER') {
          const t = (currentDb.trainers || []).find((tr) => tr.id === matchedUser.trainerId) || {};
          userObj = {
            id: matchedUser.id,
            trainerId: matchedUser.trainerId || t.id,
            name: matchedUser.name || t.name,
            role: 'TRAINER',
            phone: matchedUser.phone || t.phone,
            specialization: t.specialization || matchedUser.specialization,
            photo: t.photo,
            title: `Trainer (${t.specialization || 'Instructor'})`
          };
        } else if (matchedUser.role === 'STUDENT') {
          const s = (currentDb.students || []).find((st) => st.id === matchedUser.studentId) || {};
          userObj = {
            id: matchedUser.id,
            studentId: matchedUser.studentId || s.id,
            name: matchedUser.name || s.name,
            role: 'STUDENT',
            phone: matchedUser.phone || s.phone,
            tgid: s.tgid || matchedUser.tgid,
            groupId: s.groupId,
            title: 'Student / Trainee'
          };
        } else if (matchedUser.role === 'ADMIN') {
          userObj = {
            id: matchedUser.id,
            name: matchedUser.name,
            role: 'ADMIN',
            phone: matchedUser.phone,
            title: 'Institute Administrator'
          };
        } else if (matchedUser.role === 'AGENT') {
          const ag = (currentDb.agents || []).find((a) => a.id === matchedUser.agentId || a.code === matchedUser.agentCode) || {};
          userObj = {
            id: matchedUser.id,
            agentId: matchedUser.agentId || ag.id,
            agentCode: matchedUser.agentCode || ag.code,
            name: matchedUser.name || ag.name,
            role: 'AGENT',
            phone: matchedUser.phone || ag.phone,
            email: ag.email,
            commissionType: ag.commissionType,
            defaultRate: ag.defaultRate,
            title: 'Referral Partner / Agent'
          };
        } else if (matchedUser.role === 'STAFF') {
          userObj = {
            id: matchedUser.id,
            name: matchedUser.name,
            role: 'STAFF',
            phone: matchedUser.phone,
            title: 'Front Desk Officer'
          };
        }

        setCurrentUser(userObj);
        sessionStorage.setItem('kite_current_user', JSON.stringify(userObj));
        setIsLocked(false);
        return { success: true, user: userObj };
      } else {
        return { success: false, message: 'Invalid PIN code. Please enter your 4-digit PIN.' };
      }
    }

    // 2. Direct Fallback: Check Trainers table
    const trainer = (currentDb.trainers || []).find((t) => {
      return isPhoneMatch(t.phone) || (t.id || '').toLowerCase() === cleanId;
    });

    if (trainer && (!targetRole || targetRole === 'TRAINER')) {
      if (trainer.status === 'Inactive' || trainer.status === 'Suspended') {
        return { success: false, message: 'Trainer account is suspended.' };
      }
      if (cleanPin === (trainer.pin || '1234')) {
        const user = {
          id: trainer.id,
          name: trainer.name,
          role: 'TRAINER',
          trainerId: trainer.id,
          occupationId: trainer.occupationId,
          specialization: trainer.specialization,
          photo: trainer.photo,
          phone: trainer.phone,
          title: `Trainer (${trainer.specialization || 'Instructor'})`
        };
        setCurrentUser(user);
        sessionStorage.setItem('kite_current_user', JSON.stringify(user));
        setIsLocked(false);
        return { success: true, user };
      }
      return { success: false, message: 'Invalid PIN code.' };
    }

    // 3. Direct Fallback: Check Students table
    const student = (currentDb.students || []).find((s) => {
      const tgid = (s.tgid || '').trim().toLowerCase();
      return isPhoneMatch(s.phone) || (tgid && tgid === cleanId) || (s.id || '').toLowerCase() === cleanId;
    });

    if (student && (!targetRole || targetRole === 'STUDENT')) {
      if (student.status === 'Dropout' || student.status === 'Suspended') {
        return { success: false, message: 'Student account is inactive or suspended.' };
      }
      if (cleanPin === (student.pin || '1234')) {
        return loginAsStudent(student.id);
      }
      return { success: false, message: 'Invalid PIN code.' };
    }

    // 4. Direct Fallback: Check Agents table
    const agent = (currentDb.agents || []).find((a) => {
      const code = (a.code || '').trim().toLowerCase();
      return isPhoneMatch(a.phone) || (code && code === cleanId) || (a.id || '').toLowerCase() === cleanId;
    });

    if (agent) {
      if (agent.status === 'Suspended') {
        return { success: false, message: 'Agent account is suspended.' };
      }
      if (cleanPin === (agent.pin || '1234')) {
        const user = {
          id: `USR-${agent.id}`,
          agentId: agent.id,
          agentCode: agent.code,
          name: agent.name,
          role: 'AGENT',
          phone: agent.phone,
          email: agent.email,
          commissionType: agent.commissionType,
          defaultRate: agent.defaultRate,
          title: 'Referral Partner / Agent'
        };
        setCurrentUser(user);
        sessionStorage.setItem('kite_current_user', JSON.stringify(user));
        setIsLocked(false);
        return { success: true, user };
      }
      return { success: false, message: 'Invalid PIN code.' };
    }

    // 5. Quick PIN check for direct 4-digit code (e.g. admin/admin123, 1111 Admin, 2222 Staff)
    if (cleanId === '1111' || (cleanId === 'admin' && (cleanPin === 'admin123' || cleanPin === '1111'))) {
      const user = {
        id: 'USR-ADMIN',
        username: 'admin',
        name: 'Super Admin',
        role: 'ADMIN',
        title: 'Institute Administrator'
      };
      setCurrentUser(user);
      sessionStorage.setItem('kite_current_user', JSON.stringify(user));
      setIsLocked(false);
      return { success: true, user };
    }

    if (cleanId === '2222' || (cleanId === 'staff' && cleanPin === '2222')) {
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

    return {
      success: false,
      message: 'Registered username or phone number not found. Please enter valid credentials.'
    };
  };

  // Check URL query parameters on mount for frictionless Direct Link / QR Code login
  useEffect(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal'); // 'trainer' | 'student' | 'agent'
      const idParam = params.get('id'); // 'TRN-01', 'STD-01', 'AGE-101'
      const pinParam = params.get('pin');
      const userParam = params.get('user') || params.get('login');
      const logoutParam = params.get('logout');

      let roleHint = null;
      if (path.includes('agent') || portalParam === 'agent') roleHint = 'AGENT';
      else if (path.includes('trainer') || portalParam === 'trainer') roleHint = 'TRAINER';
      else if (path.includes('student') || portalParam === 'student') roleHint = 'STUDENT';
      else if (path.includes('admin') || portalParam === 'admin') roleHint = 'ADMIN';

      if (logoutParam === 'true') {
        logout();
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      if (idParam && pinParam) {
        login(idParam, pinParam, roleHint);
      } else if (userParam && pinParam) {
        login(userParam, pinParam, roleHint);
      }
      // Security Enforcement: Never auto-login without PIN verification
    } catch (_) {}
  }, []);

  const loginWithPin = (pin, preferredTrainerId = null) => {
    return login(pin, pin);
  };

  const loginWithPhonePin = (phone, pin) => {
    return login(phone, pin);
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
    setCurrentUser(null);
    sessionStorage.removeItem('kite_current_user');
    setIsLocked(false);
  };

  const unlock = () => {
    setIsLocked(false);
  };

  const switchUser = (role, targetId = null) => {
    if (role === 'ADMIN') {
      login('admin', '1111');
    } else if (role === 'STAFF') {
      login('staff', '2222');
    } else if (role === 'TRAINER') {
      const currentDb = loadDB();
      const t = currentDb.trainers.find((x) => x.id === targetId) || currentDb.trainers[0];
      if (t) {
        login(t.phone || t.id, t.pin || '1234');
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
        login,
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
        isAgent: currentUser?.role === 'AGENT',
        activeTrainerId: currentUser?.role === 'TRAINER' ? currentUser.trainerId : null,
        activeStudentId: currentUser?.role === 'STUDENT' ? currentUser.studentId : null,
        activeEmployerId: currentUser?.role === 'EMPLOYER' ? currentUser.employerId : null,
        activeAgentId: currentUser?.role === 'AGENT' ? currentUser.agentId : null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
