/**
 * Global Era TVET Biometric & RFID Integration Service
 * Supports ZKTeco, Realtime, eSSL devices via ADMS Cloud Push, Local Bridge, RFID Card Tap & USB Log Import
 */

import { loadDB, saveDB, SHIFT_DEFINITIONS } from './storage';
import { playBiometricBeep } from './soundUtils';

/**
 * Format time helper
 */
export function formatPunchTime(dateObj = new Date()) {
  return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

/**
 * Parse a time string like "07:05:12 AM" or "14:20" into minutes since midnight for accurate chronological sorting
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 9999;
  try {
    const d = new Date(`2000-01-01 ${timeStr}`);
    if (!isNaN(d.getTime())) {
      return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    }
    const [h, m] = timeStr.split(':').map(Number);
    if (!isNaN(h)) return h * 60 + (m || 0);
  } catch (_) {}
  return 9999;
}

/**
 * Resolve 24-hour shift start string (e.g. "07:00", "10:00", "12:00", "14:00", "16:00") for a Training Group
 */
export function getGroupShiftStart24h(group, settings = {}) {
  if (!group) return settings.morningShiftStart || '07:00';

  const shiftCode = String(group.shift || '').trim().toUpperCase();
  const shiftDef = (SHIFT_DEFINITIONS || []).find(
    (sd) => sd.code === shiftCode || shiftCode === `SHIFT ${sd.code}`
  );
  if (shiftDef?.startTime) {
    return shiftDef.startTime;
  }

  if (group.startTime) {
    const mins = parseTimeToMinutes(group.startTime);
    if (mins < 9999) {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const lower = String(group.shift || '').toLowerCase();
  if (lower.includes('day') || lower === 'b' || lower === 'c') return settings.dayShiftStart || '10:00';
  if (lower.includes('evening') || lower === 'd' || lower === 'e') return settings.eveningShiftStart || '14:00';
  return settings.morningShiftStart || '07:00';
}

/**
 * Check if a punch time is late based on shift start and grace period
 */
export function evaluatePunchStatus(punchTimeStr, shiftStartStr = '07:00', graceMinutes = 15) {
  try {
    const [startH, startM] = shiftStartStr.split(':').map(Number);
    const punchDate = new Date(`2000-01-01 ${punchTimeStr}`);
    const startDate = new Date(`2000-01-01 ${startH}:${startM}:00`);
    const cutoffDate = new Date(startDate.getTime() + graceMinutes * 60 * 1000);

    if (punchDate > cutoffDate) {
      return 'late';
    }
    return 'present';
  } catch (_) {
    return 'present';
  }
}

/**
 * Resolve any identifier (biometricId, studentId, trainerId, tgid, RFID card number) to canonical user profile
 */
export function resolveBiometricEntity(db, rawId, fallbackName = null, fallbackRole = null) {
  const clean = String(rawId || '').trim();
  const cleanLower = clean.toLowerCase();

  // 1. Check Students
  const student = (db.students || []).find(
    (s) =>
      String(s.biometricId || '') === clean ||
      (s.rfidCardNo && String(s.rfidCardNo).toLowerCase() === cleanLower) ||
      (s.id && s.id.toLowerCase() === cleanLower) ||
      (s.tgid && s.tgid.toLowerCase() === cleanLower)
  );
  if (student) {
    return {
      biometricId: String(student.biometricId || clean),
      entityId: student.id,
      name: student.name,
      role: 'STUDENT',
      matched: true
    };
  }

  // 2. Check Trainers
  const trainer = (db.trainers || []).find(
    (t) =>
      String(t.biometricId || '') === clean ||
      (t.rfidCardNo && String(t.rfidCardNo).toLowerCase() === cleanLower) ||
      (t.id && t.id.toLowerCase() === cleanLower)
  );
  if (trainer) {
    return {
      biometricId: String(trainer.biometricId || clean),
      entityId: trainer.id,
      name: trainer.name,
      role: 'TRAINER',
      matched: true
    };
  }

  // 3. Check Staff / Admin users
  const staffUser = (db.users || []).find(
    (u) =>
      (u.role === 'STAFF' || u.role === 'ADMIN') &&
      (String(u.biometricId || '') === clean || (u.id && u.id.toLowerCase() === cleanLower) || (u.username && u.username.toLowerCase() === cleanLower))
  );
  if (staffUser) {
    return {
      biometricId: String(staffUser.biometricId || (staffUser.role === 'ADMIN' ? '3001' : '3002')),
      entityId: staffUser.id,
      name: staffUser.name,
      role: 'STAFF',
      matched: true
    };
  }

  // Built-in staff IDs 3001-3003
  const builtInStaff = {
    '3001': 'गोकर्ण थापा (Gokarna Thapa)',
    '3002': 'रिसेप्सन तथा इन्क्वायरी अफिसर',
    '3003': 'लेखा अधिकृत (Accountant Staff)'
  };
  if (builtInStaff[clean]) {
    return {
      biometricId: clean,
      entityId: `STF-${clean}`,
      name: builtInStaff[clean],
      role: 'STAFF',
      matched: true
    };
  }

  return {
    biometricId: clean,
    entityId: null,
    name: fallbackName || `User #${clean}`,
    role: fallbackRole || (clean.startsWith('2') ? 'TRAINER' : clean.startsWith('3') ? 'STAFF' : 'STUDENT'),
    matched: Boolean(fallbackName)
  };
}

/**
 * Sync all punch logs for a given date into db.attendances
 * Chronologically groups punches per student: Earliest punch = Check-In, Latest subsequent punch = Check-Out
 */
export function syncBiometricAttendance(targetDate = new Date().toISOString().slice(0, 10)) {
  const db = loadDB();
  const settings = db.settings?.biometricSettings || {};
  const logs = (db.biometricLogs || []).filter((l) => l.date === targetDate);
  const students = db.students || [];
  const groups = db.trainingGroups || [];

  let syncedCount = 0;
  let newAttendances = [...(db.attendances || [])];

  // Group logs by student.id so first punch is Check-In and later punch is Check-Out
  const studentLogsMap = new Map();

  logs.forEach((log) => {
    const cleanLogId = String(log.biometricId || '').trim().toLowerCase();
    const student = students.find(
      (s) =>
        (s.biometricId && String(s.biometricId).toLowerCase() === cleanLogId) ||
        (s.rfidCardNo && String(s.rfidCardNo).toLowerCase() === cleanLogId) ||
        (s.id && s.id.toLowerCase() === cleanLogId) ||
        (s.tgid && s.tgid.toLowerCase() === cleanLogId)
    );

    if (student) {
      if (!studentLogsMap.has(student.id)) {
        studentLogsMap.set(student.id, { student, punches: [] });
      }
      studentLogsMap.get(student.id).punches.push(log);
    }
  });

  studentLogsMap.forEach(({ student, punches }) => {
    // Sort punches chronologically (earliest punch of the day first)
    const sortedPunches = [...punches].sort(
      (a, b) => parseTimeToMinutes(a.timestamp) - parseTimeToMinutes(b.timestamp)
    );

    const firstPunch = sortedPunches[0];
    const lastPunch = sortedPunches.length > 1 ? sortedPunches[sortedPunches.length - 1] : null;

    const group = groups.find((g) => g.id === student.groupId) || groups[0];
    const shiftStart = getGroupShiftStart24h(group, settings);
    const status = evaluatePunchStatus(firstPunch.timestamp, shiftStart, settings.lateGraceMinutes || 15);

    const existingIdx = newAttendances.findIndex(
      (a) => a.studentId === student.id && a.date === targetDate && a.groupId === (student.groupId || group?.id)
    );

    // If an earlier check-in already existed, preserve the earliest check-in time
    let finalCheckIn = firstPunch.timestamp;
    let finalStatus = status;
    if (existingIdx >= 0 && newAttendances[existingIdx].checkInTime) {
      const existingMins = parseTimeToMinutes(newAttendances[existingIdx].checkInTime);
      const newMins = parseTimeToMinutes(firstPunch.timestamp);
      if (existingMins < newMins) {
        finalCheckIn = newAttendances[existingIdx].checkInTime;
        finalStatus = evaluatePunchStatus(finalCheckIn, shiftStart, settings.lateGraceMinutes || 15);
      }
    }

    const checkOutNote = lastPunch && lastPunch.timestamp !== finalCheckIn ? ` • बाहिरिएको (Out): ${lastPunch.timestamp}` : '';

    const recordObj = {
      id: existingIdx >= 0 ? newAttendances[existingIdx].id : `ATT-BIO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      groupId: student.groupId || group?.id || 'GRP-01',
      studentId: student.id,
      date: targetDate,
      status: finalStatus,
      source: 'BIOMETRIC',
      checkInTime: finalCheckIn,
      checkOutTime: lastPunch ? lastPunch.timestamp : (newAttendances[existingIdx]?.checkOutTime || ''),
      biometricId: String(student.biometricId || firstPunch.biometricId),
      verifiedBy: firstPunch.device || 'ZKTeco K40 Biometric / RFID',
      remarks:
        (finalStatus === 'late' ? 'बायोमेट्रिक ढिलो आगमन (Late Check-in)' : 'समयमै बायोमेट्रिक/RFID प्रमाणित (On Time)') +
        checkOutNote
    };

    if (existingIdx >= 0) {
      newAttendances[existingIdx] = {
        ...newAttendances[existingIdx],
        ...recordObj
      };
    } else {
      newAttendances.unshift(recordObj);
    }
    syncedCount++;
  });

  // Update last sync time
  const updatedSettings = {
    ...settings,
    lastSyncTime: formatPunchTime(),
    status: 'Online'
  };

  const nextDb = {
    ...db,
    attendances: newAttendances,
    settings: {
      ...db.settings,
      biometricSettings: updatedSettings
    }
  };

  saveDB(nextDb);
  return { success: true, syncedCount, totalLogs: logs.length };
}

/**
 * Simulate / Record an instantaneous biometric or RFID card punch
 */
export function recordLiveBiometricPunch({
  biometricId,
  name,
  role = null,
  device = 'Global Era Main Entrance - ZKTeco K40',
  playSound = true
}) {
  const db = loadDB();
  const todayStr = new Date().toISOString().slice(0, 10);
  const punchTimeStr = formatPunchTime();

  const resolved = resolveBiometricEntity(db, biometricId, name, role);

  const newLog = {
    id: `LOG-${Date.now()}`,
    biometricId: resolved.biometricId,
    name: resolved.name,
    role: resolved.role,
    date: todayStr,
    timestamp: punchTimeStr,
    device: device,
    matched: resolved.matched,
    status: 'success'
  };

  const nextLogs = [newLog, ...(db.biometricLogs || [])];
  const nextDb = {
    ...db,
    biometricLogs: nextLogs
  };

  saveDB(nextDb);

  // Auto-sync into attendances
  syncBiometricAttendance(todayStr);

  // Play realistic machine confirmation sound if enabled
  if (playSound) {
    playBiometricBeep(true);
  }

  return newLog;
}

/**
 * Parse USB / Pendrive attendance log file (.dat, .csv, or .txt format common in ZKTeco & Realtime)
 * Standard formats: "UserID,DateTime,Status" or "UserID\tDateTime\tDevice"
 */
export function parseBiometricLogFile(fileContent, defaultDevice = 'USB Imported Logs') {
  const db = loadDB();
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const parsedLogs = [];

  lines.forEach((line, idx) => {
    // Skip common header lines
    if (line.toLowerCase().includes('user') || line.toLowerCase().includes('time') || line.toLowerCase().includes('sn')) return;

    // Detect delimiter: comma, tab, or space
    let parts = line.split(',');
    if (parts.length < 2) parts = line.split('\t');
    if (parts.length < 2) parts = line.trim().split(/\s+/);

    if (parts.length >= 2) {
      const bioId = parts[0].trim();
      const dateTimeStr = parts.slice(1).join(' ').trim();

      let dateStr = new Date().toISOString().slice(0, 10);
      let timeStr = formatPunchTime();

      try {
        const dt = new Date(dateTimeStr);
        if (!isNaN(dt.getTime())) {
          dateStr = dt.toISOString().slice(0, 10);
          timeStr = formatPunchTime(dt);
        }
      } catch (_) {}

      const resolved = resolveBiometricEntity(db, bioId);

      parsedLogs.push({
        id: `LOG-USB-${Date.now()}-${idx}`,
        biometricId: resolved.biometricId,
        name: resolved.name,
        role: resolved.role,
        date: dateStr,
        timestamp: timeStr,
        device: defaultDevice,
        matched: resolved.matched,
        status: 'success'
      });
    }
  });

  return parsedLogs;
}
