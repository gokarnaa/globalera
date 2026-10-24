import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  Grid,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Avatar,
  Paper,
  Alert
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LinkIcon from '@mui/icons-material/Link';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import confetti from 'canvas-confetti';
import { loadDB, saveDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import A4LandscapeCertificateModal from './A4LandscapeCertificateModal';
import PublicCertificateVerify from './PublicCertificateVerify';

export default function CertificateManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer, isAdmin } = useAuth();

  const myGroups = isTrainer
    ? db.trainingGroups.filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups;

  const [selectedGroupId, setSelectedGroupId] = useState(myGroups[0]?.id || db.trainingGroups[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ISSUED' | 'ELIGIBLE' | 'INELIGIBLE'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

  // Modal State
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [activeCertificateItem, setActiveCertificateItem] = useState(null);

  // Online verification test modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyTargetItem, setVerifyTargetItem] = useState(null);

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const trainer = db.trainers.find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Instructor', phone: '' };
  const groupStudents = (db.students || []).filter((s) => s.groupId === selectedGroupId);

  // Existing Certificates list
  const existingCertificates = db.certificates || [];

  // Compute student eligibility based on attendance (>= 80%)
  const studentCertificateData = useMemo(() => {
    return groupStudents.map((student) => {
      // Calculate student attendance %
      const studentAtts = (db.attendances || []).filter(
        (a) => a.groupId === selectedGroupId && a.studentId === student.id
      );
      const pCount = studentAtts.filter((a) => a.status === 'present' || a.status === 'P').length;
      const lCount = studentAtts.filter((a) => a.status === 'late' || a.status === 'L').length;
      const totalDays = studentAtts.length;
      const attPercent = totalDays > 0 ? Math.round(((pCount + lCount * 0.5) / totalDays) * 100) : 100;

      // Check if already issued
      const cert = existingCertificates.find((c) => c.studentId === student.id);
      const isIssued = Boolean(cert);
      const isEligible = attPercent >= 80;

      return {
        student,
        attPercent,
        totalDays,
        isIssued,
        isEligible,
        certificate: cert || null
      };
    });
  }, [groupStudents, selectedGroupId, db.attendances, existingCertificates]);

  // KPI Metrics
  const totalCount = studentCertificateData.length;
  const issuedCount = studentCertificateData.filter((d) => d.isIssued).length;
  const eligiblePendingCount = studentCertificateData.filter((d) => d.isEligible && !d.isIssued).length;
  const ineligibleCount = studentCertificateData.filter((d) => !d.isEligible && !d.isIssued).length;

  // Filtered List
  const filteredData = studentCertificateData.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.student.name.toLowerCase().includes(q) ||
      item.student.tgid.toLowerCase().includes(q) ||
      (item.certificate?.certificateNo || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (statusFilter === 'ISSUED') return item.isIssued;
    if (statusFilter === 'ELIGIBLE') return item.isEligible && !item.isIssued;
    if (statusFilter === 'INELIGIBLE') return !item.isEligible;
    return true;
  });

  // Issue Certificate for single student
  const handleIssueCertificate = (student) => {
    const existingList = db.certificates || [];
    const year = new Date().getFullYear();
    const nextSeq = String(existingList.length + 1).padStart(4, '0');
    const newCertNo = `GETS-${year}-${nextSeq}`;

    const newCertificate = {
      id: `CERT-${Date.now()}`,
      certificateNo: newCertNo,
      studentId: student.id,
      groupId: selectedGroupId,
      courseId: selectedCourse?.id,
      issueDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    const nextDb = {
      ...db,
      certificates: [newCertificate, ...existingList]
    };

    saveDB(nextDb);
    setDb(nextDb);

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}

    // Open Certificate modal immediately
    setActiveCertificateItem({
      certificate: newCertificate,
      student,
      course: selectedCourse,
      group: selectedGroup,
      trainer
    });
    setCertificateModalOpen(true);
  };

  // Bulk Issue for all eligible students
  const handleBulkIssueEligible = () => {
    const eligibleStudents = studentCertificateData.filter((d) => d.isEligible && !d.isIssued);
    if (eligibleStudents.length === 0) {
      alert('No eligible students pending certificate issuance.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to issue certificates to ${eligibleStudents.length} eligible students in this group?`
      )
    ) {
      return;
    }

    let existingList = [...(db.certificates || [])];
    const year = new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);

    eligibleStudents.forEach((item, index) => {
      const nextSeq = String(existingList.length + 1).padStart(4, '0');
      const newCertNo = `GETS-${year}-${nextSeq}`;

      existingList.unshift({
        id: `CERT-${Date.now()}-${index}`,
        certificateNo: newCertNo,
        studentId: item.student.id,
        groupId: selectedGroupId,
        courseId: selectedCourse?.id,
        issueDate: today,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    });

    const nextDb = { ...db, certificates: existingList };
    saveDB(nextDb);
    setDb(nextDb);

    try {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    } catch (_) {}
  };

  // Revoke / Delete Certificate
  const handleRevokeCertificate = (certId) => {
    if (window.confirm('Are you sure you want to revoke/cancel this certificate?')) {
      const nextDb = {
        ...db,
        certificates: (db.certificates || []).filter((c) => c.id !== certId)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // Copy Verification link to clipboard
  const handleCopyLink = (certNo) => {
    const url = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(certNo)}`;
    navigator.clipboard.writeText(url);
    alert(`Verification link copied to clipboard:\n${url}`);
  };

  return (
    <Box>
      {/* 1. Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WorkspacePremiumIcon sx={{ color: '#c59b27', fontSize: 36 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Certificates (व्यावसायिक तालिम समापन प्रमाणपत्र)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Official A4 Landscape Certificate of Completion with CTEVT Accreditation, pure English & Nepali body, and Dynamic QR Code Online Verification.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {eligiblePendingCount > 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<VerifiedIcon />}
              onClick={handleBulkIssueEligible}
              sx={{ fontWeight: 800, bgcolor: '#0b2545' }}
            >
              Bulk Issue ({eligiblePendingCount} Eligible)
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. Group Selector & KPI Summary */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              select
              label="Select Training Group (ब्याच)"
              fullWidth
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {myGroups.map((grp) => {
                const c = db.courses.find((x) => x.id === grp.courseId);
                return (
                  <MenuItem key={grp.id} value={grp.id}>
                    {grp.groupCode} — {c?.title} (Shift {grp.shift})
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
                gap: 1.5,
                bgcolor: '#f8fafc',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  TOTAL TRAINEES
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  {totalCount}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  ISSUED
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#16834b' }}>
                  {issuedCount} Certified
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  ELIGIBLE PENDING
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                  {eligiblePendingCount}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  ATTENDANCE &lt;80%
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#dc2626' }}>
                  {ineligibleCount}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* 3. Search and View Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by trainee name, TGID, or cert no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 }, bgcolor: '#ffffff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                </InputAdornment>
              )
            }}
          />

          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 180, bgcolor: '#ffffff' }}
          >
            <MenuItem value="ALL">All Trainees ({studentCertificateData.length})</MenuItem>
            <MenuItem value="ISSUED">Issued Only ({issuedCount})</MenuItem>
            <MenuItem value="ELIGIBLE">Eligible to Issue ({eligiblePendingCount})</MenuItem>
            <MenuItem value="INELIGIBLE">Ineligible (&lt;80%) ({ineligibleCount})</MenuItem>
          </TextField>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700 }}>
            Showing {filteredData.length} records
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* 4. TABLE VIEW */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, width: 45, textAlign: 'center' }}>S.N.</TableCell>
                  <TableCell sx={{ fontWeight: 900, minWidth: 180 }}>Trainee Name</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 95 }}>TGID</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 110, textAlign: 'center' }}>Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>Certificate No</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 110 }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 130 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 180, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item, idx) => {
                  const { student, attPercent, isIssued, isEligible, certificate } = item;

                  return (
                    <TableRow key={student.id} hover>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#647089' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={student.photoUrl}
                            sx={{ width: 36, height: 36, bgcolor: '#0b2545', fontWeight: 800 }}
                          >
                            {student.name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              {student.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089' }}>
                              {student.permanentAddress || 'Nepal'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#647089' }}>
                        {student.tgid}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 900,
                            color: attPercent >= 80 ? '#16834b' : '#dc2626'
                          }}
                        >
                          {attPercent}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>
                          {attPercent >= 80 ? 'CTEVT Eligible' : 'Low Attendance'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0b2545' }}>
                        {certificate ? certificate.certificateNo : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#475569' }}>
                        {certificate ? certificate.issueDate : '—'}
                      </TableCell>
                      <TableCell>
                        {isIssued ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Issued & Valid"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800 }}
                          />
                        ) : isEligible ? (
                          <Chip
                            label="Eligible (Ready)"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        ) : (
                          <Chip
                            icon={<WarningAmberIcon />}
                            label="Ineligible (<80%)"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        {isIssued ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View & Print A4 Landscape Certificate">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setActiveCertificateItem({
                                    certificate,
                                    student,
                                    course: selectedCourse,
                                    group: selectedGroup,
                                    trainer
                                  });
                                  setCertificateModalOpen(true);
                                }}
                                sx={{ color: '#0b2545' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Test Public Online Verification">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setVerifyTargetItem({
                                    certificate,
                                    student,
                                    course: selectedCourse,
                                    group: selectedGroup
                                  });
                                  setVerifyModalOpen(true);
                                }}
                                sx={{ color: '#c59b27' }}
                              >
                                <VerifiedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Copy Verification Link">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyLink(certificate.certificateNo)}
                                sx={{ color: '#1a56b0' }}
                              >
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Revoke Certificate">
                              <IconButton
                                size="small"
                                onClick={() => handleRevokeCertificate(certificate.id)}
                                sx={{ color: '#dc2626' }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : isEligible ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleIssueCertificate(student)}
                            sx={{
                              bgcolor: '#0b2545',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              px: 1.5
                            }}
                          >
                            + Issue Certificate
                          </Button>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                            Attendance under 80%
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      No trainees found matching your filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* 5. CARD VIEW */
        <Grid container spacing={2}>
          {filteredData.map((item, idx) => {
            const { student, attPercent, isIssued, isEligible, certificate } = item;

            return (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip label={`S.N. ${idx + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                    {isIssued ? (
                      <Chip label="Issued & Valid" size="small" color="success" sx={{ fontWeight: 800 }} />
                    ) : isEligible ? (
                      <Chip label="Eligible (Ready)" size="small" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
                    ) : (
                      <Chip label="Ineligible (<80%)" size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar src={student.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#0b2545', fontWeight: 900 }}>
                      {student.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {student.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#647089' }}>
                        TGID: {student.tgid}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2, flexGrow: 1, fontSize: '0.85rem' }}>
                    <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                      Attendance Rate: <b style={{ color: attPercent >= 80 ? '#16834b' : '#dc2626' }}>{attPercent}%</b>
                    </Typography>
                    {certificate ? (
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                          CERTIFICATE NO:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#0b2545' }}>
                          {certificate.certificateNo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                          Issued on: {certificate.issueDate}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1 }}>
                        Certificate: Not issued yet
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isIssued ? (
                      <>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            setActiveCertificateItem({
                              certificate,
                              student,
                              course: selectedCourse,
                              group: selectedGroup,
                              trainer
                            });
                            setCertificateModalOpen(true);
                          }}
                          sx={{ fontWeight: 800, color: '#0b2545' }}
                        >
                          A4 View
                        </Button>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setVerifyTargetItem({
                                certificate,
                                student,
                                course: selectedCourse,
                                group: selectedGroup
                              });
                              setVerifyModalOpen(true);
                            }}
                            sx={{ color: '#c59b27' }}
                          >
                            <VerifiedIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRevokeCertificate(certificate.id)} sx={{ color: '#dc2626' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </>
                    ) : isEligible ? (
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => handleIssueCertificate(student)}
                        sx={{ bgcolor: '#0b2545', fontWeight: 800 }}
                      >
                        + Issue Certificate
                      </Button>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                        Ineligible (&lt;80% Attendance)
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Official A4 Landscape Printable Modal */}
      {activeCertificateItem && (
        <A4LandscapeCertificateModal
          open={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          certificate={activeCertificateItem.certificate}
          student={activeCertificateItem.student}
          course={activeCertificateItem.course}
          group={activeCertificateItem.group}
          trainer={activeCertificateItem.trainer}
        />
      )}

      {/* Online Public Verification Preview Modal */}
      {verifyTargetItem && (
        <PublicCertificateVerify
          open={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          certId={verifyTargetItem.certificate.certificateNo}
          certificate={verifyTargetItem.certificate}
          student={verifyTargetItem.student}
          course={verifyTargetItem.course}
          group={verifyTargetItem.group}
          onOpenFullCertificate={() => {
            setActiveCertificateItem({
              certificate: verifyTargetItem.certificate,
              student: verifyTargetItem.student,
              course: verifyTargetItem.course,
              group: verifyTargetItem.group,
              trainer
            });
            setCertificateModalOpen(true);
          }}
        />
      )}
    </Box>
  );
}
