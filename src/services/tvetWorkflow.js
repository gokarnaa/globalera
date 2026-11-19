// Centralized CTEVT / TVET Lifecycle & Cross-Module Readiness Helper
// Connects: Occupation -> Course -> Syllabus -> Batch -> Trainer -> Student -> Attendance -> Evaluation -> OJT -> Certificate -> EPP Placement

export function getStudentWorkflowSummary(db = {}, student = null) {
  if (!student) return null;

  const group = (db.trainingGroups || []).find((g) => g.id === student.groupId) || null;
  const course = (db.courses || []).find((c) => c.id === (group?.courseId || student.courseId)) || null;
  const occupation = (db.occupations || []).find((o) => o.id === course?.occupationId) || null;
  const trainer = (db.trainers || []).find((t) => t.id === group?.trainerId) || null;

  // 1. Attendance summary
  const attRecords = (db.attendances || []).filter((a) => a.studentId === student.id);
  const totalDays = attRecords.length;
  const presentDays = attRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // 2. Fee summary
  const admission = (db.admissions || []).find((a) => a.studentId === student.id || a.tgid === student.tgid);
  const lockedFee = Number(admission?.netFee ?? student.feeAmount ?? course?.price ?? 0);
  const totalPaid = (db.payments || [])
    .filter((p) => p.studentId === student.id)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const effectivePaid = Math.max(totalPaid, Number(student.feePaid || 0));
  const due = Math.max(0, lockedFee - effectivePaid);
  const feeCleared = due <= 0;

  // 3. Skill Evaluation summary (linked to Course Syllabus)
  const courseSyllabi = (db.syllabi || []).filter((s) => s.courseId === course?.id);
  const studentEvals = (db.evaluations || []).filter((e) => e.studentId === student.id);
  const totalUnits = courseSyllabi.length || studentEvals.length;
  const evaluatedUnits = studentEvals.length;
  const masteredUnits = studentEvals.filter((e) => {
    const m = String(e.mastered || '').trim().toLowerCase();
    return Boolean(m) && m !== 'none' && m !== 'n/a' && m !== 'fail';
  }).length;
  const evalPct = totalUnits > 0 ? Math.round((masteredUnits / totalUnits) * 100) : 0;
  const evalPassed = evaluatedUnits > 0 && evalPct >= 50;

  let suggestedGrade = 'Competent (Pass)';
  if (evaluatedUnits > 0) {
    if (evalPct >= 85) suggestedGrade = 'Distinction';
    else if (evalPct >= 70) suggestedGrade = 'First Division';
    else if (evalPct >= 50) suggestedGrade = 'Second Division';
    else suggestedGrade = 'Competent (Pass)';
  }

  // 4. OJT summary
  const ojtRecord = (db.ojts || []).find((o) => o.studentId === student.id) || null;
  const ojtEmployer = ojtRecord ? (db.employers || []).find((e) => e.id === ojtRecord.employerId) : null;
  const ojtStatus = ojtRecord?.status || 'Not Assigned';
  const ojtCompleted = ojtStatus === 'Completed';

  // 5. Certificate summary
  const certRecord = (db.certificates || []).find((c) => c.studentId === student.id) || null;
  const certIssued = Boolean(certRecord);

  // 6. EPP / Job Placement summary
  const placementRecord = (db.placements || []).find((p) => p.studentId === student.id) || null;
  const placementEmployer = placementRecord ? (db.employers || []).find((e) => e.id === placementRecord.employerId) : null;
  const placed = Boolean(placementRecord && ['Placed', 'Retained 3M', 'Retained 6M', 'Self-Employed'].includes(placementRecord.status));

  // 7. LogBook progress for student's group
  const groupLogs = (db.logBooks || []).filter((lb) => lb.groupId === student.groupId && lb.isDelivered !== false);
  const deliveredHours = groupLogs.reduce((sum, lb) => sum + (Number(lb.actualHours) || 0), 0);
  const courseHours = Number(course?.totalHours || 390);
  const trainingPct = courseHours > 0 ? Math.min(100, Math.round((deliveredHours / courseHours) * 100)) : 0;

  const stages = [
    {
      key: 'admission',
      label: 'Admission',
      done: true,
      detail: group?.groupCode || 'Enrolled'
    },
    {
      key: 'training',
      label: 'Training',
      done: totalDays > 0 && attPct >= 75,
      inProgress: totalDays > 0 || deliveredHours > 0,
      detail: totalDays > 0 ? `${attPct}% Att.` : `${deliveredHours}h Log`
    },
    {
      key: 'evaluation',
      label: 'Evaluation',
      done: evalPassed,
      inProgress: evaluatedUnits > 0,
      detail: evaluatedUnits > 0 ? `${masteredUnits}/${totalUnits} Units` : 'Pending'
    },
    {
      key: 'ojt',
      label: 'OJT',
      done: ojtCompleted,
      inProgress: Boolean(ojtRecord) && !ojtCompleted,
      detail: ojtRecord ? ojtStatus : 'Pending'
    },
    {
      key: 'certificate',
      label: 'Certificate',
      done: certIssued,
      inProgress: false,
      detail: certIssued ? (certRecord.certificateNo || 'Issued') : 'Pending'
    },
    {
      key: 'placement',
      label: 'EPP Job',
      done: placed,
      inProgress: Boolean(placementRecord) && !placed,
      detail: placementRecord ? placementRecord.status : 'Pending'
    }
  ];

  const doneCount = stages.filter((s) => s.done).length;
  const completionPct = Math.round((doneCount / stages.length) * 100);

  return {
    group,
    course,
    occupation,
    trainer,
    attendance: { totalDays, presentDays, pct: attPct, eligible: totalDays === 0 || attPct >= 75 },
    fees: { lockedFee, totalPaid: effectivePaid, due, cleared: feeCleared },
    evaluation: { totalUnits, evaluatedUnits, masteredUnits, pct: evalPct, passed: evalPassed, suggestedGrade },
    ojt: { record: ojtRecord, status: ojtStatus, completed: ojtCompleted, employerName: ojtEmployer?.name || '' },
    certificate: { record: certRecord, issued: certIssued },
    placement: { record: placementRecord, placed, status: placementRecord?.status || 'Not Placed', employerName: placementEmployer?.name || '' },
    training: { deliveredHours, courseHours, pct: trainingPct },
    stages,
    completionPct
  };
}
