import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SchoolIcon from '@mui/icons-material/School';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useAuth } from '../../context/AuthContext';
import { loadDB, saveDB, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import StudentProfileModal from '../students/StudentProfileModal';

import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';

export default function EmployerPortal({ onLogout, onGoHome }) {
  const { currentUser, logout } = useAuth();
  const [db, setDb] = useState(loadDB());
  const [activeTab, setActiveTab] = useState(0);

  // Identify Employer
  const employer = useMemo(() => {
    const list = db.employers || [];
    if (currentUser?.employerId) {
      return list.find((e) => e.id === currentUser.employerId) || list[0];
    }
    return list[0];
  }, [db.employers, currentUser]);

  // Dialogs
  const [openPostJobModal, setOpenPostJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    occupationId: '',
    vacancies: 2,
    salaryRange: 'NPR 20,000 – 30,000 / month',
    location: employer?.location || 'Kathmandu',
    employmentType: 'Full-Time',
    description: '',
    requiredSkills: ''
  });

  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    industry: 'Healthcare & Geriatric Care',
    location: 'Kathmandu',
    contactPerson: '',
    phone: '',
    email: '',
    pin: '1234',
    remarks: ''
  });

  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);

  // Employer's Jobs
  const employerJobs = useMemo(() => {
    return (db.jobOpenings || []).filter((j) => j.employerId === employer?.id);
  }, [db.jobOpenings, employer]);

  // Employer's Applications
  const employerApplications = useMemo(() => {
    const jobIds = employerJobs.map((j) => j.id);
    return (db.jobApplications || []).filter((a) => jobIds.includes(a.jobId));
  }, [db.jobApplications, employerJobs]);

  const handlePostJob = () => {
    if (!newJob.title || !newJob.occupationId) {
      alert('Please enter the job title and select an occupation.');
      return;
    }

    const createdJob = {
      id: `JOB-${Date.now()}`,
      employerId: employer.id,
      occupationId: newJob.occupationId,
      title: newJob.title,
      description: newJob.description,
      requiredSkills: newJob.requiredSkills,
      vacancies: Number(newJob.vacancies) || 1,
      salaryRange: newJob.salaryRange,
      location: newJob.location,
      employmentType: newJob.employmentType,
      status: 'Open',
      postedDate: new Date().toISOString().slice(0, 10)
    };

    const nextDb = {
      ...db,
      jobOpenings: [createdJob, ...(db.jobOpenings || [])]
    };
    saveDB(nextDb);
    setDb(nextDb);
    logAudit(nextDb, 'POST_JOB', 'JobOpening', createdJob.id, `${employer?.name} posted job ${createdJob.title}`);
    setOpenPostJobModal(false);
    setNewJob({
      title: '',
      occupationId: '',
      vacancies: 2,
      salaryRange: 'NPR 20,000 – 30,000 / month',
      location: employer?.location || 'Kathmandu',
      employmentType: 'Full-Time',
      description: '',
      requiredSkills: ''
    });
  };

  const handleRegisterCompany = () => {
    if (!regData.name || !regData.phone) {
      alert('Please enter both the company name and phone number.');
      return;
    }

    const newEmp = {
      id: `EMP-${Date.now()}`,
      name: regData.name,
      industry: regData.industry,
      location: regData.location,
      contactPerson: regData.contactPerson,
      phone: regData.phone,
      email: regData.email,
      pin: regData.pin || '1234',
      status: 'Pending', // Pending admin approval initially
      remarks: 'Self-registered from Employer Portal'
    };

    const nextDb = {
      ...db,
      employers: [newEmp, ...(db.employers || [])]
    };
    saveDB(nextDb);
    setDb(nextDb);
    logAudit(nextDb, 'EMPLOYER_REGISTER', 'Employer', newEmp.id, `New employer ${newEmp.name} self-registered`);
    setOpenRegisterModal(false);
    alert('Company registered successfully! Full portal features will be activated upon admin approval.');
  };

  const handleUpdateAppStatus = (appId, newStatus) => {
    const updatedApps = (db.jobApplications || []).map((a) =>
      a.id === appId ? { ...a, status: newStatus } : a
    );
    const nextDb = { ...db, jobApplications: updatedApps };
    saveDB(nextDb);
    setDb(nextDb);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Employer Header Banner */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(15,23,42,0.25)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: { xs: 68, md: 84 },
                height: { xs: 68, md: 84 },
                bgcolor: '#0284c7',
                border: '3px solid rgba(255,255,255,0.7)',
                fontSize: '2rem'
              }}
            >
              🏢
            </Avatar>
          </Grid>
          <Grid item xs={12} sm>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                {employer?.name || 'Company Portal'}
              </Typography>
              <Chip
                label={employer?.status || 'Active'}
                size="small"
                sx={{
                  bgcolor: employer?.status === 'Active' ? '#10b981' : '#f59e0b',
                  color: '#ffffff',
                  fontWeight: 800
                }}
              />
              <Chip
                label={employer?.industry || 'Healthcare'}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Location: <b>{employer?.location}</b> | Contact: <b>{employer?.contactPerson} ({employer?.phone})</b>
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Global Era Technical School Official Employer Partnership Hub
            </Typography>
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenPostJobModal(true)}
                sx={{ bgcolor: '#0284c7', fontWeight: 800, '&:hover': { bgcolor: '#0369a1' } }}
              >
                Post Job
              </Button>
              <Button
                variant="outlined"
                startIcon={<HowToRegIcon />}
                onClick={() => setOpenRegisterModal(true)}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.4)',
                  fontWeight: 700,
                  '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Register Company
              </Button>
              {onGoHome && (
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={onGoHome}
                  sx={{
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.4)',
                    fontWeight: 700,
                    '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Website
                </Button>
              )}
              {currentUser && (
                <Button
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  onClick={() => {
                    if (onLogout) onLogout();
                    else logout();
                  }}
                  sx={{
                    color: '#EF4444',
                    borderColor: 'rgba(239,68,68,0.5)',
                    fontWeight: 800,
                    '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239,68,68,0.15)' }
                  }}
                >
                  Logout
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {employer?.status !== 'Active' && (
        <Alert severity="warning" sx={{ mb: 2.5, fontWeight: 700 }}>
          Account Status: <b>{employer?.status || 'Pending Approval'}</b> — Your organization is awaiting Admin verification. Trainee direct phone numbers remain masked until your Hiring Partner account is approved.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 800, fontSize: '0.95rem', textTransform: 'none' }
          }}
        >
          <Tab
            icon={
              <Chip
                label={employerApplications.length}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.75rem', fontWeight: 800, mr: 0.5 }}
              />
            }
            iconPosition="start"
            label="Candidate Applications"
          />
          <Tab
            icon={<WorkIcon />}
            iconPosition="start"
            label={`Posted Jobs (${employerJobs.length})`}
          />
          <Tab icon={<SchoolIcon />} iconPosition="start" label="TVET Graduate Directory" />
        </Tabs>
      </Box>

      {/* Tab 0: Candidate Applications */}
      {activeTab === 0 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            Received Job Applications
          </Typography>
          <Typography variant="body2" sx={{ color: '#647089', mb: 2.5 }}>
            Direct applications submitted by currently enrolled trainees and graduates of Global Era Technical School.
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Candidate</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Job Role</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Attendance Rate</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Cover Note / Experience</TableCell>
                  <TableCell sx={{ fontWeight: 800, align: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employerApplications.map((app) => {
                  const student = (db.students || []).find((s) => s.id === app.studentId);
                  const job = employerJobs.find((j) => j.id === app.jobId);
                  const group = (db.trainingGroups || []).find((g) => g.id === student?.groupId);
                  const course = (db.courses || []).find((c) => c.id === group?.courseId);

                  // Calculate student attendance
                  const studentAtts = (db.attendances || []).filter((a) => a.studentId === student?.id);
                  const attTotal = studentAtts.length;
                  const attPresent = studentAtts.filter((a) => a.status === 'present').length;
                  const attPct = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 95;

                  return (
                    <TableRow key={app.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={student?.photoUrl}
                            sx={{ width: 44, height: 44, bgcolor: '#0d9488', fontWeight: 800 }}
                          >
                            {student?.name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 800, cursor: 'pointer', color: '#1a56b0', '&:hover': { textDecoration: 'underline' } }}
                              onClick={() => setSelectedStudentForProfile(student)}
                            >
                              {student?.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                              {course?.title || 'Training Batch'} • {employer?.status === 'Active' ? student?.phone : 'Verified Contact (Masked)'}
                            </Typography>
                            <Chip
                              size="small"
                              label={student?.status === 'Active' ? 'Currently Training' : 'Graduate'}
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: student?.status === 'Active' ? '#e0f2fe' : '#e5f8ee',
                                color: student?.status === 'Active' ? '#0369a1' : '#16834b'
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {job?.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          Applied: {app.applyDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: attPct >= 85 ? '#16834b' : '#c9820a' }}>
                            {attPct}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={attPct}
                          sx={{
                            width: 70,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': { bgcolor: attPct >= 85 ? '#16834b' : '#c9820a' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={app.status}
                          sx={{
                            fontWeight: 800,
                            bgcolor: app.status === 'Hired' ? '#10b981' : app.status === 'Shortlisted' ? '#0284c7' : '#f59e0b',
                            color: '#fff'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                          {app.coverNote || 'No extra cover note provided.'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {app.status !== 'Shortlisted' && app.status !== 'Hired' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleUpdateAppStatus(app.id, 'Shortlisted')}
                              sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                            >
                              Shortlist
                            </Button>
                          )}
                          {app.status !== 'Hired' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleUpdateAppStatus(app.id, 'Hired')}
                              sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                            >
                              Hire
                            </Button>
                          )}
                          {student?.phone && employer?.status === 'Active' && (
                            <Tooltip title="Direct WhatsApp Message">
                              <IconButton
                                size="small"
                                sx={{ color: '#25D366' }}
                                onClick={() => {
                                  const text = `Hello ${student.name}, regarding your application for ${job?.title} at ${employer.name}, we would like to invite you for an interview.`;
                                  window.open(getWhatsAppUrl(student.phone, text), '_blank');
                                }}
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {employerApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#647089' }}>
                      No candidate applications received yet. Post a new job opening to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 1: Posted Jobs */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {employerJobs.map((job) => {
            const apps = (db.jobApplications || []).filter((a) => a.jobId === job.id);
            const occ = (db.occupations || []).find((o) => o.id === job.occupationId);

            return (
              <Grid item xs={12} md={6} key={job.id}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {job.title}
                    </Typography>
                    <Chip label={job.status} color={job.status === 'Open' ? 'success' : 'default'} size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 700, display: 'block', mb: 1 }}>
                    Occupation: {occ?.name} • Type: {job.employmentType}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                    {job.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#647089' }}>Vacancies:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{job.vacancies} Seats</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#647089' }}>Salary Range:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b' }}>{job.salaryRange}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#647089' }}>Applicants:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284c7' }}>{apps.length} Candidates</Typography>
                    </Box>
                  </Box>

                  {job.requiredSkills && (
                    <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 2 }}>
                      <b>Required Skills:</b> {job.requiredSkills}
                    </Typography>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Tab 2: TVET Graduate Directory */}
      {activeTab === 2 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            Available TVET Talent Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#647089', mb: 3 }}>
            Browse and connect directly with skilled trainees and graduates for your business needs.
          </Typography>

          <Grid container spacing={2.5}>
            {(db.students || []).slice(0, 8).map((std) => {
              const grp = (db.trainingGroups || []).find((g) => g.id === std.groupId);
              const crs = (db.courses || []).find((c) => c.id === grp?.courseId);

              return (
                <Grid item xs={12} sm={6} md={3} key={std.id}>
                  <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Avatar
                      src={std.photoUrl}
                      sx={{ width: 60, height: 60, mx: 'auto', mb: 1, bgcolor: '#0d9488', fontSize: '1.5rem' }}
                    >
                      {std.name[0]}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {std.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 600, display: 'block' }}>
                      {crs?.title || 'Vocational Training'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
                      Batch: {grp?.groupCode} • {employer?.status === 'Active' ? std.phone : 'Contact Masked Until Approved'}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => setSelectedStudentForProfile(std)}
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      View Profile
                    </Button>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Card>
      )}

      {/* Post Job Modal */}
      <Dialog open={openPostJobModal} onClose={() => setOpenPostJobModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Create Job Opening
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Job Title"
              fullWidth
              required
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              placeholder="e.g. Senior Beautician, Caregiver Nurse Aide, Pattern Cutter"
            />
            <TextField
              select
              label="Occupation"
              fullWidth
              required
              value={newJob.occupationId}
              onChange={(e) => setNewJob({ ...newJob, occupationId: e.target.value })}
            >
              {(db.occupations || []).map((occ) => (
                <MenuItem key={occ.id} value={occ.id}>
                  {occ.name}
                </MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Vacancies"
                  type="number"
                  fullWidth
                  value={newJob.vacancies}
                  onChange={(e) => setNewJob({ ...newJob, vacancies: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Employment Type"
                  fullWidth
                  value={newJob.employmentType}
                  onChange={(e) => setNewJob({ ...newJob, employmentType: e.target.value })}
                >
                  <MenuItem value="Full-Time">Full-Time</MenuItem>
                  <MenuItem value="Part-Time">Part-Time</MenuItem>
                  <MenuItem value="OJT / Internship">OJT / Internship</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <TextField
              label="Salary Range"
              fullWidth
              value={newJob.salaryRange}
              onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
              placeholder="e.g. NPR 22,000 – 30,000 / month"
            />
            <TextField
              label="Workplace Location"
              fullWidth
              value={newJob.location}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
            />
            <TextField
              label="Job Description"
              fullWidth
              multiline
              rows={3}
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
            />
            <TextField
              label="Required TVET Skills"
              fullWidth
              value={newJob.requiredSkills}
              onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
              placeholder="e.g. First Aid, Vital Signs, Pattern Cutting, Facial Skincare"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenPostJobModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePostJob} sx={{ fontWeight: 800 }}>
            Publish Opening
          </Button>
        </DialogActions>
      </Dialog>

      {/* Self-Register Modal */}
      <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Employer Registration
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Company / Organization Name"
              fullWidth
              required
              value={regData.name}
              onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              placeholder="e.g. Himalayan Care Home, Fashion Hub Nepal"
            />
            <TextField
              label="Industry / Sector"
              fullWidth
              value={regData.industry}
              onChange={(e) => setRegData({ ...regData, industry: e.target.value })}
            />
            <TextField
              label="Location"
              fullWidth
              value={regData.location}
              onChange={(e) => setRegData({ ...regData, location: e.target.value })}
            />
            <TextField
              label="Contact Person"
              fullWidth
              value={regData.contactPerson}
              onChange={(e) => setRegData({ ...regData, contactPerson: e.target.value })}
            />
            <TextField
              label="Phone / WhatsApp Number"
              fullWidth
              required
              value={regData.phone}
              onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
            />
            <TextField
              label="4-Digit PIN Code"
              fullWidth
              type="password"
              value={regData.pin}
              onChange={(e) => setRegData({ ...regData, pin: e.target.value })}
              helperText="4-digit PIN used for portal login"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenRegisterModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRegisterCompany} sx={{ fontWeight: 800 }}>
            Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          open={Boolean(selectedStudentForProfile)}
          onClose={() => setSelectedStudentForProfile(null)}
          student={selectedStudentForProfile}
        />
      )}
    </Box>
  );
}
