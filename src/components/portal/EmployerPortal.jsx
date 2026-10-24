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

export default function EmployerPortal() {
  const { currentUser } = useAuth();
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
      alert('कृपया पदको शीर्षक र पेशा छनोट गर्नुहोस्।');
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
      alert('कृपया कम्पनीको नाम र फोन नम्बर प्रविष्ट गर्नुहोस्।');
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
    alert('कम्पनी दर्ता भएको छ! प्रशासनको स्वीकृति पश्चात पूर्ण सुविधाहरू सक्रिय हुनेछन्।');
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
              ग्लोबल एरा प्राविधिक स्कुल आधिकारिक रोजगार साझेदार पोर्टल (Employer Partnership Hub)
            </Typography>
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenPostJobModal(true)}
                sx={{ bgcolor: '#0284c7', fontWeight: 800, '&:hover': { bgcolor: '#0369a1' } }}
              >
                नयाँ जागिर खुलाउनुहोस् (Post Job)
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
                नयाँ कम्पनी दर्ता
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

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
            label="आवेदक विद्यार्थीहरू (Candidate Applications)"
          />
          <Tab
            icon={<WorkIcon />}
            iconPosition="start"
            label={`पोस्ट गरिएका जागिरहरू (${employerJobs.length})`}
          />
          <Tab icon={<SchoolIcon />} iconPosition="start" label="TVET विद्यार्थीहरूको खोजी (Graduate Directory)" />
        </Tabs>
      </Box>

      {/* Tab 0: Candidate Applications */}
      {activeTab === 0 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            प्राप्त आवेदनहरू (Received Job Applications)
          </Typography>
          <Typography variant="body2" sx={{ color: '#647089', mb: 2.5 }}>
            ग्लोबल एरा प्राविधिक स्कुलका तालिमरत तथा उत्तीर्ण विद्यार्थीहरूले दिएका प्रत्यक्ष आवेदनहरू।
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>विद्यार्थी विवरण (Candidate)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>आवेदन पद (Job Role)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>हाजिरी दर (Attendance)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>स्थिति (Status)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>कभर नोट / अनुभव</TableCell>
                  <TableCell sx={{ fontWeight: 800, align: 'right' }}>कार्यहरू (Actions)</TableCell>
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
                              {course?.title || 'Training Batch'} • {student?.phone}
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
                          {student?.phone && (
                            <Tooltip title="Direct WhatsApp Message">
                              <IconButton
                                size="small"
                                sx={{ color: '#25D366' }}
                                onClick={() => {
                                  const text = `Namaste ${student.name}, regarding your application for ${job?.title} at ${employer.name}, we would like to invite you for an interview.`;
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
                      हालसम्म कुनै विद्यार्थीको आवेदन प्राप्त भएको छैन। नयाँ जागिर पोस्ट गर्नुहोस्।
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
                      <Typography variant="caption" sx={{ color: '#647089' }}>माग संख्या:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{job.vacancies} सिट</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#647089' }}>तलब दायरा:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b' }}>{job.salaryRange}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#647089' }}>आवेदकहरू:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284c7' }}>{apps.length} जना</Typography>
                    </Box>
                  </Box>

                  {job.requiredSkills && (
                    <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 2 }}>
                      <b>सीप आवश्यकता:</b> {job.requiredSkills}
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
            उपलब्ध विद्यार्थी तथा प्रशिक्षार्थी विवरण (Available TVET Talent)
          </Typography>
          <Typography variant="body2" sx={{ color: '#647089', mb: 3 }}>
            तपाईंको व्यवसायमा आवश्यक दक्ष जनशक्तिलाई प्रत्यक्ष अवलोकन गरी सम्पर्क गर्नुहोस्।
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
                      Batch: {grp?.groupCode} • {std.phone}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => setSelectedStudentForProfile(std)}
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      प्रोफाइल हेर्नुहोस्
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
          नयाँ रोजगारी अवसर पोस्ट गर्नुहोस् (Create Job Opening)
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="पदको नाम (Job Title)"
              fullWidth
              required
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              placeholder="e.g. Senior Beautician, Caregiver Nurse Aide, Pattern Cutter"
            />
            <TextField
              select
              label="सम्बन्धित पेशा (Occupation)"
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
                  label="माग संख्या (Vacancies)"
                  type="number"
                  fullWidth
                  value={newJob.vacancies}
                  onChange={(e) => setNewJob({ ...newJob, vacancies: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="रोजगार प्रकार"
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
              label="तलब सुविधा (Salary Range)"
              fullWidth
              value={newJob.salaryRange}
              onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
              placeholder="e.g. NPR 22,000 – 30,000 / month"
            />
            <TextField
              label="कार्यस्थल ठेगाना (Location)"
              fullWidth
              value={newJob.location}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
            />
            <TextField
              label="कामको विवरण (Job Description)"
              fullWidth
              multiline
              rows={3}
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
            />
            <TextField
              label="आवश्यक सीपहरू (Required TVET Skills)"
              fullWidth
              value={newJob.requiredSkills}
              onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
              placeholder="e.g. First Aid, Vital Signs, Pattern Cutting, Facial Skincare"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenPostJobModal(false)}>रद्द गर्नुहोस्</Button>
          <Button variant="contained" onClick={handlePostJob} sx={{ fontWeight: 800 }}>
            पोस्ट गर्नुहोस् (Publish Opening)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Self-Register Modal */}
      <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          नयाँ कम्पनी दर्ता (Employer Registration)
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="कम्पनी / संस्थाको नाम"
              fullWidth
              required
              value={regData.name}
              onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              placeholder="e.g. Himalayan Care Home, Fashion Hub Nepal"
            />
            <TextField
              label="क्षेत्र / उद्योग (Industry)"
              fullWidth
              value={regData.industry}
              onChange={(e) => setRegData({ ...regData, industry: e.target.value })}
            />
            <TextField
              label="ठेगाना (Location)"
              fullWidth
              value={regData.location}
              onChange={(e) => setRegData({ ...regData, location: e.target.value })}
            />
            <TextField
              label="सम्पर्क व्यक्ति (Contact Person)"
              fullWidth
              value={regData.contactPerson}
              onChange={(e) => setRegData({ ...regData, contactPerson: e.target.value })}
            />
            <TextField
              label="फोन नम्बर (Phone / WhatsApp)"
              fullWidth
              required
              value={regData.phone}
              onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
            />
            <TextField
              label="इमेल (Email)"
              fullWidth
              type="email"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
            />
            <TextField
              label="4-Digit PIN कोड"
              fullWidth
              type="password"
              value={regData.pin}
              onChange={(e) => setRegData({ ...regData, pin: e.target.value })}
              helperText="लगइन गर्न प्रयोग गरिने 4-अङ्कको पिन"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenRegisterModal(false)}>रद्द गर्नुहोस्</Button>
          <Button variant="contained" onClick={handleRegisterCompany} sx={{ fontWeight: 800 }}>
            दर्ता गर्नुहोस् (Register)
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
