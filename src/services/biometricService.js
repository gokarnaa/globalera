/**
 * Global Era TVET Biometric Integration Service
 * Supports ZKTeco, Realtime, eSSL devices via ADMS Cloud Push, Local Bridge & USB Log Import
 */

import { loadDB, saveDB } from './storage';
import { playBiometricBeep } from './soundUtils';

/**
 * Format time helper
 */
export function formatPunchTime(dateObj = new Date()) {
  return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
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
 * Sync all punch logs for a given date into db.attendances
 */
export function syncBiometricAttendance(targetDate = new Date().toISOString().slice(0, 10)) {
  const db = loadDB();
  const settings = db.settings?.biometricSettings || {};
  const logs = (db.biometricLogs || []).filter((l) => l.date === targetDate);
  const students = db.students || [];
  const groups = db.trainingGroups || [];

  let syncedCount = 0;
  let newAttendances = [...(db.attendances || [])];

  logs.forEach((log) => {
    // 1. Check if punch belongs to a student
    const student = students.find(
      (s) =>
        (s.biometricId && String(s.biometricId) === String(log.biometricId)) ||
        s.id.toLowerCase() === String(log.biometricId).toLowerCase() ||
        (s.tgid && s.tgid.toLowerCase() === String(log.biometricId).toLowerCase())
    );

    if (student) {
      const group = groups.find((g) => g.id === student.groupId) || groups[0];
      const shiftStart = group?.shift?.toLowerCase().includes('day')
        ? (settings.dayShiftStart || '11:00')
        : group?.shift?.toLowerCase().includes('evening')
        ? (settings.eveningShiftStart || '15:00')
        : (settings.morningShiftStart || '07:00');

      const status = evaluatePunchStatus(log.timestamp, shiftStart, settings.lateGraceMinutes || 15);

      // Check existing record
      const existingIdx = newAttendances.findIndex(
        (a) => a.studentId === student.id && a.date === targetDate && a.groupId === (student.groupId || group?.id)
      );

      const recordObj = {
        id: existingIdx >= 0 ? newAttendances[existingIdx].id : `ATT-BIO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        groupId: student.groupId || group?.id || 'GRP-01',
        studentId: student.id,
        date: targetDate,
        status: status,
        source: 'BIOMETRIC',
        checkInTime: log.timestamp,
        biometricId: log.biometricId,
        verifiedBy: log.device || 'ZKTeco K40 Biometric',
        remarks: status === 'late' ? 'बायोमेट्रिक ढिलो आगमन (Late Check-in)' : 'समयमै बायोमेट्रिक प्रमाणित (On Time)'
      };

      if (existingIdx >= 0) {
        // If already marked by biometric or trainer, preserve/upgrade with biometric timestamp
        newAttendances[existingIdx] = {
          ...newAttendances[existingIdx],
          ...recordObj
        };
      } else {
        newAttendances.unshift(recordObj);
      }
      syncedCount++;
    }
  });

  // Update last sync time
  const updatedSettings = {
    ...settings,
    lastSyncTime: new Date().toISOString(),
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
 * Simulate / Record an instantaneous biometric punch (e.g. when user tests in UI or machine posts ADMS HTTP)
 */
export function recordLiveBiometricPunch({ biometricId, name, role = 'STUDENT', device = 'Global Era Main Entrance - ZKTeco K40' }) {
  const db = loadDB();
  const todayStr = new Date().toISOString().slice(0, 10);
  const punchTimeStr = formatPunchTime();

  const newLog = {
    id: `LOG-${Date.now()}`,
    biometricId: String(biometricId),
    name: name || 'Enrolled User',
    role: role,
    date: todayStr,
    timestamp: punchTimeStr,
    device: device,
    matched: true,
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

  // Play realistic machine confirmation sound
  playBiometricBeep(true);

  return newLog;
}

/**
 * Parse USB / Pendrive attendance log file (.dat, .csv, or .txt format common in ZKTeco & Realtime)
 * Standard formats: "UserID,DateTime,Status" or "UserID\tDateTime\tDevice"
 */
export function parseBiometricLogFile(fileContent, defaultDevice = 'USB Imported Logs') {
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
      const dateTimeStr = parts[1].trim();

      let dateStr = new Date().toISOString().slice(0, 10);
      let timeStr = formatPunchTime();

      try {
        const dt = new Date(dateTimeStr);
        if (!isNaN(dt.getTime())) {
          dateStr = dt.toISOString().slice(0, 10);
          timeStr = formatPunchTime(dt);
        }
      } catch (_) {}

      parsedLogs.push({
        id: `LOG-USB-${Date.now()}-${idx}`,
        biometricId: String(bioId),
        name: `User #${bioId}`,
        role: bioId.startsWith('2') ? 'TRAINER' : bioId.startsWith('3') ? 'STAFF' : 'STUDENT',
        date: dateStr,
        timestamp: timeStr,
        device: defaultDevice,
        matched: true,
        status: 'success'
      });
    }
  });

  return parsedLogs;
}
