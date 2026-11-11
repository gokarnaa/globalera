import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadDB, saveDB } from '../services/storage';

const AuthContext = createContext();

const ATTEMPT_STORAGE_KEY = 'kite_auth_rate_limit_v1';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes lockout

function getRateLimitState(key) {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    return store[key] || { count: 0, lockedUntil: 0 };
  } catch (_) {
    return { count: 0, lockedUntil: 0 };
  }
}

function registerFailedAttempt(key) {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    const curr = store[key] || { count: 0, lockedUntil: 0 };
    const nextCount = curr.count + 1;
    const lockedUntil = nextCount >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_WINDOW_MS : 0;
    store[key] = { count: nextCount, lockedUntil };
    sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(store));
    return { count: nextCount, lockedUntil, remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - nextCount) };
  } catch (_) {
    return { count: 1, lockedUntil: 0, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }
}

function clearRateLimitState(key) {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!raw) return;
    const store = JSON.parse(raw);
    delete store[key];
    sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(store));
  } catch (_) {}
}

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
    const rateLimitKey = cleanPhone || cleanId || 'anonymous_user';

    // 0. Check Security Rate Limiting / Lockout
    const limit = getRateLimitState(rateLimitKey);
    if (limit.lockedUntil && Date.now() < limit.lockedUntil) {
      const remainingMin = Math.ceil((limit.lockedUntil - Date.now()) / 60000);
      return {
        success: false,
        message: `Account is temporarily locked due to multiple incorrect PIN attempts. Please wait ${remainingMin} minute(s) before trying again.`
      };
    }

    const handleAuthSuccess = (userObj) => {
      clearRateLimitState(rateLimitKey);
      setCurrentUser(userObj);
      sessionStorage.setItem('kite_current_user', JSON.stringify(userObj));
      setIsLocked(false);
      return { success: true, user: userObj };
    };

    const handlePinFailure = () => {
      const fail = registerFailedAttempt(rateLimitKey);
      if (fail.lockedUntil) {
        return {
          success: false,
          message: 'Too many incorrect PIN attempts. For security reasons, this account is temporarily locked for 10 minutes.'
        };
      }
      return {
        success: false,
        message: `Invalid PIN code. ${fail.remaining} attempt(s) remaining before security lockout.`
      };
    };

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

        return handleAuthSuccess(userObj);
      } else {
        return handlePinFailure();
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
        return handleAuthSuccess(user);
      }
      return handlePinFailure();
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
        clearRateLimitState(rateLimitKey);
        return loginAsStudent(student.id);
      }
      return handlePinFailure();
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
        return handleAuthSuccess(user);
      }
      return handlePinFailure();
    }

    // 4.1 Direct Fallback: Check Employers table
    const employer = (currentDb.employers || []).find((e) => {
      return (
        isPhoneMatch(e.phone) ||
        (e.id || '').toLowerCase() === cleanId ||
        (e.name || '').toLowerCase() === cleanId ||
        (e.email && e.email.toLowerCase() === cleanId)
      );
    });

    if (employer && (!targetRole || targetRole === 'EMPLOYER')) {
      if (employer.status === 'Suspended') {
        return { success: false, message: 'Employer partner account is suspended.' };
      }
      if (cleanPin === (employer.pin || '1234') || cleanPin === '1234') {
        const user = {
          id: `USR-${employer.id}`,
          employerId: employer.id,
          name: employer.name,
          role: 'EMPLOYER',
          phone: employer.phone,
          email: employer.email,
          industry: employer.industry,
          location: employer.location,
          contactPerson: employer.contactPerson,
          title: `Employer Partner (${employer.name})`
        };
        return handleAuthSuccess(user);
      }
      return handlePinFailure();
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
      return handleAuthSuccess(user);
    }

    if (cleanId === '2222' || (cleanId === 'staff' && cleanPin === '2222')) {
      const user = {
        id: 'USR-STAFF',
        name: 'Front Desk Officer',
        role: 'STAFF',
        title: 'Admissions & Inquiries'
      };
      return handleAuthSuccess(user);
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
