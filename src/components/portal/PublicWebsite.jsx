import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Divider,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Tooltip,
  Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloseIcon from '@mui/icons-material/Close';
import HandshakeIcon from '@mui/icons-material/Handshake';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';

import { loadDB, saveDB } from '../../services/storage';
import { calculateFeeBreakdown } from '../courses/CourseFeeManager';
import { verifyCertificateRemote } from '../../services/supabaseClient';

export default function PublicWebsite({ onNavigate, onVerifyCertificate }) {
  const [db, setDb] = useState(loadDB());
  const company = db.settings?.companyProfile || {};

  // Detect referral agent parameter ?ref=AGE-101 or ?agent=AGE-101
  const refCode = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('ref') || params.get('agent') || null;
    } catch (_) {
      return null;
    }
  }, []);

  const referredAgent = useMemo(() => {
    if (!refCode) return null;
    const agents = db.agents || [];
    return (
      agents.find(
        (a) =>
          a.code?.toLowerCase() === refCode.trim().toLowerCase() ||
          a.id?.toLowerCase() === refCode.trim().toLowerCase()
      ) || null
    );
  }, [refCode, db.agents]);

  // Form State for Online Lead Inquiry
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    courseId: db.courses?.[0]?.id || '',
    preferredShift: 'Morning',
    notes: ''
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Employer Partner Registration State
  const [employerForm, setEmployerForm] = useState({
    name: '',
    industry: 'Beauty Parlor & Cosmetology',
    contactPerson: '',
    phone: '',
    email: '',
    location: 'Kathmandu',
    jobRole: 'Beautician / Hair Stylist',
    vacancies: 2,
    pin: '1234'
  });
  const [employerSuccess, setEmployerSuccess] = useState(null);

  // Certificate Verification Search State
  const [certSearchId, setCertSearchId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Course fee data
  const courses = useMemo(() => {
    return (db.courses || []).map((crs) => {
      let fs = crs.feeStructure;
      if (!fs) {
        const isBasic = (crs.title || '').toLowerCase().includes('basic') && (crs.price || 0) <= 2000;
        fs = {
          basePrice: isBasic ? 0 : (crs.price || 30000),
          discountPercent: isBasic ? 0 : 70,
          admissionFee: isBasic ? 1700 : 1500,
          vatPercent: 13,
          paymentMode: isBasic ? 'FULL_ONLY' : 'TWO_INSTALLMENTS'
        };
      }
      return {
        ...crs,
        feeCalc: calculateFeeBreakdown(fs),
        feeStructure: fs
      };
    });
  }, [db.courses]);

  // Handle Online Inquiry Submit
  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryForm.name.trim() || !inquiryForm.phone.trim()) {
      alert('Please enter both your full name and contact number.');
      return;
    }

    const currentLeads = db.leads || [];
    const existingIds = currentLeads
      .map((l) => {
        const match = l.id && l.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingIds.length ? Math.max(...existingIds) + 1 : 1;
    const newId = `L${String(nextNum).padStart(4, '0')}`;

    const chosenCourse = courses.find((c) => c.id === inquiryForm.courseId);

    const newLead = {
      id: newId,
      name: inquiryForm.name.trim(),
      phone: inquiryForm.phone.trim(),
      email: inquiryForm.email.trim(),
      courseId: inquiryForm.courseId,
      course: chosenCourse?.title || 'Vocational Training',
      price: chosenCourse?.price || 15000,
      source: referredAgent
        ? `Agent Referral (${referredAgent.name} - ${referredAgent.code})`
        : 'Web Inquiry',
      agentId: referredAgent?.id || null,
      agentCode: referredAgent?.code || null,
      agentName: referredAgent?.name || null,
      commissionType: referredAgent?.commissionType || null,
      commissionRate: referredAgent?.defaultRate || null,
      potentialCommission: referredAgent
        ? (referredAgent.commissionType === 'PERCENTAGE'
            ? Math.round(((chosenCourse?.price || 15000) * (referredAgent.defaultRate || 10)) / 100)
            : (referredAgent.defaultRate || 1000))
        : 0,
      commissionAmount: referredAgent
        ? (referredAgent.commissionType === 'PERCENTAGE'
            ? Math.round(((chosenCourse?.price || 15000) * (referredAgent.defaultRate || 10)) / 100)
            : (referredAgent.defaultRate || 1000))
        : 0,
      commissionStatus: referredAgent ? 'pending' : null,
      stage: 'New Lead',
      notes: `Preferred Shift: ${inquiryForm.preferredShift} | Message: ${inquiryForm.notes || 'None'} ${referredAgent ? `| Referral: ${referredAgent.name} (${referredAgent.code})` : ''}`,
      timeline: [
        {
          date: new Date().toISOString(),
          note: referredAgent
            ? `Website Referral Form Registered: ${referredAgent.name} (${referredAgent.code})`
            : `New Inquiry Registered via Website: ${chosenCourse?.title || 'Course'}`,
          staffName: 'Online Web Portal'
        }
      ],
      createdAt: new Date().toISOString()
    };

    const nextDb = {
      ...db,
      leads: [newLead, ...currentLeads]
    };

    saveDB(nextDb);
    setDb(nextDb);
    setInquirySubmitted(true);
    setInquiryForm({
      name: '',
      phone: '',
      email: '',
      courseId: db.courses?.[0]?.id || '',
      preferredShift: 'Morning',
      notes: ''
    });
  };

  // Handle Employer Self-Registration
  const handleEmployerRegister = (e) => {
    e.preventDefault();
    if (!employerForm.name.trim() || !employerForm.phone.trim()) {
      alert('Please enter both Company/Salon/Hospital Name and Contact Phone Number.');
      return;
    }
    const empId = `EMP-${Date.now()}`;
    const newEmp = {
      id: empId,
      name: employerForm.name.trim(),
      industry: employerForm.industry,
      location: employerForm.location.trim() || 'Kathmandu',
      contactPerson: employerForm.contactPerson.trim() || 'Hiring Manager',
      phone: employerForm.phone.trim(),
      email: employerForm.email.trim(),
      pin: employerForm.pin.trim() || '1234',
      status: 'Active',
      remarks: 'Self-registered via Website Employer Partnership Portal'
    };

    let newJobOpening = null;
    if (employerForm.jobRole) {
      newJobOpening = {
        id: `JOB-${Date.now()}`,
        employerId: empId,
        employerName: newEmp.name,
        title: employerForm.jobRole,
        vacancies: Number(employerForm.vacancies) || 1,
        salaryRange: 'Negotiable / Market Rate',
        location: newEmp.location,
        employmentType: 'Full-Time',
        status: 'Open',
        description: `Immediate requirement for trained vocational graduates from Global Era Technical School.`,
        postedDate: new Date().toISOString().slice(0, 10)
      };
    }

    const nextDb = {
      ...db,
      employers: [newEmp, ...(db.employers || [])],
      jobOpenings: newJobOpening ? [newJobOpening, ...(db.jobOpenings || [])] : (db.jobOpenings || [])
    };
    saveDB(nextDb);
    setDb(nextDb);
    setEmployerSuccess({
      id: empId,
      name: newEmp.name,
      pin: newEmp.pin
    });
  };

  // Quick Inquire from Course Card
  const handleSelectCourseForInquiry = (courseId) => {
    setInquiryForm((prev) => ({ ...prev, courseId }));
    const element = document.getElementById('online-inquiry-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Certificate Verification Lookup
  const handleVerifySearch = async (e) => {
    if (e) e.preventDefault();
    const query = certSearchId.trim().toLowerCase();
    if (!query) return;

    setVerifying(true);
    setVerifyResult(null);
    setVerifyError('');

    try {
      // 1. Try remote cloud lookup
      const remoteRes = await verifyCertificateRemote(query);
      if (remoteRes?.found) {
        setVerifyResult({
          certificate: remoteRes.certificate,
          student: remoteRes.student,
          course: remoteRes.course,
          group: remoteRes.group,
          isCloudVerified: true
        });
        setVerifying(false);
        return;
      }

      // 2. Local fallback lookup
      const cert = (db.certificates || []).find(
        (c) =>
          (c.certificateNo && c.certificateNo.toLowerCase() === query) ||
          (c.id && c.id.toLowerCase() === query)
      );

      if (cert) {
        const student = (db.students || []).find((s) => s.id === cert.studentId);
        const group = (db.trainingGroups || []).find((g) => g.id === cert.groupId);
        const course = (db.courses || []).find((c) => c.id === (cert.courseId || group?.courseId));
        setVerifyResult({
          certificate: cert,
          student,
          course,
          group,
          isCloudVerified: false
        });
      } else {
        setVerifyError('The specified certificate number or code was not found in our official records. Please check and try again.');
      }
    } catch (_) {
      setVerifyError('An error occurred during verification. Please try again shortly.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column' }}>
      {/* ============================================================== */}
      {/* 0. TOP ANNOUNCEMENT & CONTACT BAR                               */}
      {/* ============================================================== */}
      <Box
        sx={{
          bgcolor: '#071A36',
          color: '#E2E8F0',
          py: 0.8,
          px: { xs: 1.5, sm: 3 },
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.78rem'
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.2
            }}
          >
            {/* Left: Location & Operating Hours */}
            <Stack direction="row" spacing={{ xs: 1.5, md: 2.5 }} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={0.6} alignItems="center">
                <LocationOnIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.76rem' }}>
                  Global Era Multi Service — Jorpati, Gokarneshwor, Kathmandu
                </Typography>
              </Stack>

              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)', display: { xs: 'none', md: 'block' } }} />

              <Stack direction="row" spacing={0.6} alignItems="center">
                <AccessTimeIcon sx={{ fontSize: 14, color: '#10B981' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#CBD5E1', fontSize: '0.74rem' }}>
                  Office Hours: 7:00 AM – 6:00 PM (Sun – Fri)
                </Typography>
              </Stack>
            </Stack>

            {/* Right: Phone, Email & WhatsApp Direct Connect */}
            <Stack direction="row" spacing={{ xs: 1.5, sm: 2.2 }} alignItems="center" flexWrap="wrap">
              <Box
                component="a"
                href="tel:01410715"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  '&:hover': { color: '#F59E0B' }
                }}
              >
                <PhoneIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                <span>01410715</span>
              </Box>

              <Box
                component="a"
                href="mailto:globaleramultiservice@gmail.com"
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  gap: 0.6,
                  color: '#E2E8F0',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  '&:hover': { color: '#F59E0B' }
                }}
              >
                <EmailIcon sx={{ fontSize: 14, color: '#38BDF8' }} />
                <span>globaleramultiservice@gmail.com</span>
              </Box>

              <Box
                component="a"
                href="https://wa.me/97701410715?text=Hello%20Global%20Era!%20I%20am%20inquiring%20about%20Caregiver%20and%20Vocational%20Training."
                target="_blank"
                rel="noreferrer"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: 'rgba(37, 211, 102, 0.15)',
                  color: '#25D366',
                  px: 1.2,
                  py: 0.3,
                  borderRadius: 1.5,
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.25)' }
                }}
              >
                <WhatsAppIcon sx={{ fontSize: 13 }} />
                <span>WhatsApp</span>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 1. TOP HEADER & NAVIGATION BAR                                  */}
      {/* ============================================================== */}
      <Box sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', borderBottom: '3px solid #F59E0B', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <Container maxWidth="xl">
          <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            {/* Brand Logo & Name */}
            <Box
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            >
              <Avatar
                sx={{
                  bgcolor: '#F59E0B',
                  color: '#0F2C59',
                  width: 44,
                  height: 44,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                }}
              >
                <SchoolIcon sx={{ fontSize: 26 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: '0.03em', lineHeight: 1.1, color: '#FFFFFF' }}>
                  {company.companyNameEn || 'Global Era Technical School'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 700, fontSize: '0.68rem', display: 'block' }}>
                  CTEVT Accredited • Affiliation Code: {company.ctevtCode || '4208'} • Reg No: {company.regNo || '184920/078/079'}
                </Typography>
              </Box>
            </Box>

            {/* Navigation & Portal Entry Buttons */}
            <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
              <Button
                size="small"
                onClick={() => {
                  const el = document.getElementById('courses-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.78rem', display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Courses & Fees
              </Button>

              <Button
                size="small"
                onClick={() => {
                  const el = document.getElementById('verify-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.78rem', display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Verify Certificate
              </Button>

              <Button
                size="small"
                onClick={() => {
                  const el = document.getElementById('employer-partner-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.78rem', display: { xs: 'none', lg: 'inline-flex' } }}
              >
                Hire Graduates
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<HandshakeIcon sx={{ fontSize: 16 }} />}
                onClick={() => onNavigate('agent')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  borderRadius: 1.5,
                  px: 1.3,
                  py: 0.5,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.4)' }
                }}
              >
                Agent Portal
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<PeopleAltIcon sx={{ fontSize: 16 }} />}
                onClick={() => onNavigate('trainer')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  borderRadius: 1.5,
                  px: 1.3,
                  py: 0.5,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.4)' }
                }}
              >
                Trainer Portal
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<SchoolIcon sx={{ fontSize: 16 }} />}
                onClick={() => onNavigate('student')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  borderRadius: 1.5,
                  px: 1.3,
                  py: 0.5,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.4)' }
                }}
              >
                Student Portal
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<BusinessIcon sx={{ fontSize: 16 }} />}
                onClick={() => onNavigate('employer')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  borderRadius: 1.5,
                  px: 1.3,
                  py: 0.5,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.4)' }
                }}
              >
                Employer Portal
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Referral Partner Notification Banner if ?ref=... is present */}
      {referredAgent && (
        <Box sx={{ bgcolor: '#FFFBEB', borderBottom: '2px solid #FCD34D', py: 1.2, px: 2, textAlign: 'center' }}>
          <Container maxWidth="lg">
            <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <HandshakeIcon sx={{ color: '#D97706', fontSize: 20 }} />
              Welcome! You have been referred by our official referral representative <u>{referredAgent.name} (Code: {referredAgent.code})</u>. Fill out the form below for special benefits and admission counseling.
            </Typography>
          </Container>
        </Box>
      )}

      {/* ============================================================== */}
      {/* 2. HERO BANNER SECTION                                          */}
      {/* ============================================================== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #071A36 0%, #0F2C59 50%, #1E3A8A 100%)',
          color: '#FFFFFF',
          pt: { xs: 5, md: 8 },
          pb: { xs: 6, md: 9 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Decorative Background Circles */}
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<VerifiedIcon sx={{ color: '#FCD34D !important' }} />}
                label="CTEVT Accredited National Vocational Training Center"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem', mb: 2, border: '1px solid rgba(253, 211, 77, 0.4)' }}
              />

              <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.2, mb: 2, fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' } }}>
                Vocational Skills, National Recognition & <span style={{ color: '#F59E0B' }}>A Bright Future</span>
              </Typography>

              <Typography variant="body1" sx={{ color: '#E2E8F0', mb: 3.5, fontSize: { xs: '0.9rem', md: '1.05rem' }, lineHeight: 1.7, maxWidth: 640 }}>
                Global Era Technical School offers national-standard 3-month (390 hours) skill-based vocational training programs.
                Transparent fee structure inclusive of 13% VAT, flexible 2-installment payment plan, and 100% hands-on practical training!
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    const el = document.getElementById('online-inquiry-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    fontWeight: 900,
                    px: 3,
                    py: 1.2,
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(5,150,105,0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #065F46 100%)' }
                  }}
                >
                  📝 Apply Now (Online Inquiry)
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    const el = document.getElementById('courses-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{
                    borderColor: '#F59E0B',
                    color: '#F59E0B',
                    fontWeight: 900,
                    px: 3,
                    py: 1.2,
                    fontSize: '0.9rem',
                    '&:hover': { borderColor: '#FCD34D', bgcolor: 'rgba(245,158,11,0.1)' }
                  }}
                >
                  💰 Courses & Fee Schedule
                </Button>
              </Stack>
            </Grid>

            {/* Right Card: Quick Verification Search Box */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  color: '#0F172A',
                  borderTop: '4px solid #F59E0B',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.25)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VerifiedIcon sx={{ color: '#059669', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0B2545', fontSize: '1.05rem' }}>
                    Online Certificate Verification
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                  Enter the official training certificate number issued by Global Era below.
                </Typography>

                <form onSubmit={handleVerifySearch}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., GE-2081-001 or STD-01"
                    value={certSearchId}
                    onChange={(e) => setCertSearchId(e.target.value)}
                    sx={{ mb: 1.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={verifying || !certSearchId.trim()}
                    sx={{
                      bgcolor: '#0F2C59',
                      fontWeight: 800,
                      py: 1,
                      '&:hover': { bgcolor: '#071A36' }
                    }}
                  >
                    {verifying ? 'Verifying...' : '🔍 Verify Certificate'}
                  </Button>
                </form>

                {/* Inline Verification Result */}
                {verifyResult && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#166534', mb: 0.5 }}>
                      <CheckCircleIcon fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        ✓ Official Certificate Verified!
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      Student: {verifyResult.student?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                      Course: {verifyResult.course?.title || 'Vocational Training'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                      Certificate No: <b>{verifyResult.certificate?.certificateNo || verifyResult.certificate?.id}</b>
                    </Typography>
                  </Box>
                )}

                {verifyError && (
                  <Alert severity="error" sx={{ mt: 2, py: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                    {verifyError}
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 3. TRUST & ACCREDITATION HIGHLIGHTS                             */}
      {/* ============================================================== */}
      <Box sx={{ bgcolor: '#FFFFFF', py: 3, borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="xl">
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', width: 44, height: 44 }}>
                  <WorkspacePremiumIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>CTEVT Accredited</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Affiliation Code: {company.ctevtCode || '4208'}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', width: 44, height: 44 }}>
                  <AccessTimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>390-Hour Curriculum</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>3-Month National Standard</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 44, height: 44 }}>
                  <AccountBalanceWalletIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>2-Installment Payment</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>50% at Admission + 50% in 1 Month</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#F3E8FF', color: '#7E22CE', width: 44, height: 44 }}>
                  <VerifiedIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>13% VAT Inclusive</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Transparent Tax-Compliant Billing</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 4. ACTIVE COURSES & TRANSPARENT FEE SHOWCASE                    */}
      {/* ============================================================== */}
      <Box id="courses-section" sx={{ py: 6, bgcolor: '#F8FAFC' }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Chip label="Transparent Fee Structure" size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 800, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0B2545', mb: 1, fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
              Official Training Courses & Fee Breakdown
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 650, mx: 'auto' }}>
              Official fee schedule inclusive of 13% Value Added Tax (VAT) as per Government of Nepal regulations. No hidden charges.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {courses.map((crs) => {
              const { feeCalc, feeStructure: fs } = crs;
              const isFullOnly = fs?.paymentMode === 'FULL_ONLY';

              return (
                <Grid item xs={12} sm={6} md={4} key={crs.id}>
                  <Card
                    elevation={2}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                        borderColor: '#0F2E5A'
                      }
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ p: 2.5, bgcolor: '#0F2C59', color: '#FFFFFF', borderBottom: '3px solid #F59E0B' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.3 }}>
                          {crs.title}
                        </Typography>
                        <Chip
                          label={crs.level || 'Level 1'}
                          size="small"
                          sx={{ bgcolor: '#F59E0B', color: '#0F2C59', fontWeight: 900, fontSize: '0.68rem', height: 22 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ⏱️ Duration: <b>{crs.durationValue} {crs.durationUnit} ({crs.totalHours || 390} Hours)</b>
                      </Typography>
                    </Box>

                    {/* Pricing Breakdown */}
                    <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                      {crs.description && (
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2, minHeight: 32, fontStyle: 'italic' }}>
                          {crs.description}
                        </Typography>
                      )}

                      <Stack spacing={0.8} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', mb: 2 }}>
                        {/* Brochure Price */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B' }}>
                          <span>Base Brochure Fee:</span>
                          <span style={{ textDecoration: feeCalc.discountPercent > 0 ? 'line-through' : 'none' }}>
                            NPR {feeCalc.basePrice.toLocaleString()}
                          </span>
                        </Box>

                        {/* Campaign Discount */}
                        {feeCalc.discountPercent > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#DC2626', fontWeight: 700 }}>
                            <span>Campaign Discount ({feeCalc.discountPercent}%):</span>
                            <span>(-) NPR {feeCalc.discountAmount.toLocaleString()}</span>
                          </Box>
                        )}

                        {/* Admission Charge */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569' }}>
                          <span>Admission & Registration Fee:</span>
                          <span>(+) NPR {feeCalc.admissionFee.toLocaleString()}</span>
                        </Box>

                        <Divider sx={{ my: 0.3 }} />

                        {/* 13% VAT */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#D97706', fontWeight: 700 }}>
                          <span>13% VAT:</span>
                          <span>(+) NPR {feeCalc.vatAmount.toLocaleString()}</span>
                        </Box>
                      </Stack>

                      {/* Final Net Effective Price Highlight */}
                      <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: 2, border: '1.5px solid #059669', textAlign: 'center', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800, display: 'block' }}>
                          Total Final Net Fee (Incl. 13% VAT)
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', my: 0.3 }}>
                          NPR {feeCalc.totalEffectiveFee.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#047857', fontSize: '0.68rem', display: 'block' }}>
                          {isFullOnly ? '⚡ Full Payment (Standard Rate)' : `📅 2 Installments: NPR ${feeCalc.installment1.toLocaleString()} + NPR ${feeCalc.installment2.toLocaleString()}`}
                        </Typography>
                      </Box>
                    </CardContent>

                    {/* Action Button */}
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleSelectCourseForInquiry(crs.id)}
                        sx={{
                          bgcolor: '#059669',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          py: 1,
                          fontSize: '0.82rem',
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                          '&:hover': { bgcolor: '#047857' }
                        }}
                      >
                        Inquire About This Course
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 5. ONLINE INQUIRY & ADMISSION SECTION                           */}
      {/* ============================================================== */}
      <Box id="online-inquiry-section" sx={{ py: 6, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: '1px solid #CBD5E1' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Chip label="Easy Online Application" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0B2545', mb: 0.5 }}>
                Online Admission & Counseling Inquiry
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Which training program are you interested in? Fill out the form below and our counselor will contact you promptly.
              </Typography>
            </Box>

            {inquirySubmitted ? (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F0FDF4', borderRadius: 2.5, border: '2px solid #059669' }}>
                <CheckCircleIcon sx={{ fontSize: 50, color: '#059669', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#065F46', mb: 0.5 }}>
                  Your inquiry has been registered successfully!
                </Typography>
                <Typography variant="body2" sx={{ color: '#047857', mb: 2 }}>
                  Thank you for choosing Global Era Technical School. Our admissions team will contact you shortly.
                </Typography>
                <Button variant="outlined" size="small" onClick={() => setInquirySubmitted(false)} sx={{ fontWeight: 800, borderColor: '#059669', color: '#059669' }}>
                  Submit Another Inquiry
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleInquirySubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Name *"
                      fullWidth
                      size="small"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Mobile Phone Number *"
                      fullWidth
                      size="small"
                      required
                      placeholder="e.g., 98XXXXXXXX"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Interested Course *"
                      value={inquiryForm.courseId}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, courseId: e.target.value })}
                    >
                      {courses.map((crs) => (
                        <MenuItem key={crs.id} value={crs.id}>
                          {crs.title} ({crs.level || 'Level 1'}) — NPR {crs.feeCalc.totalEffectiveFee.toLocaleString()}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Preferred Shift"
                      value={inquiryForm.preferredShift}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, preferredShift: e.target.value })}
                    >
                      <MenuItem value="Morning">Morning Shift (6:30 AM - 9:30 AM)</MenuItem>
                      <MenuItem value="Day">Day Shift (11:00 AM - 2:00 PM)</MenuItem>
                      <MenuItem value="Evening">Evening Shift (3:00 PM - 6:00 PM)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Questions or Remarks (Message)"
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      placeholder="Write any specific questions or requirements here..."
                      value={inquiryForm.notes}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, notes: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<SendIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        fontWeight: 900,
                        py: 1.3,
                        fontSize: '0.95rem'
                      }}
                    >
                      Submit Inquiry
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Paper>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 5.1 EMPLOYER PARTNER NETWORK & RECRUITMENT SECTION              */}
      {/* ============================================================== */}
      <Box id="employer-partner-section" sx={{ py: 7, bgcolor: '#0B1E38', color: '#FFFFFF', borderTop: '2px solid #F59E0B' }}>
        <Container maxWidth="lg">
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Chip
              icon={<BusinessIcon sx={{ fontSize: 16, color: '#0F2C59 !important' }} />}
              label="Employer Partner Network & Job Placement"
              size="small"
              sx={{ bgcolor: '#F59E0B', color: '#0F2C59', fontWeight: 900, mb: 1.5, px: 1 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', mb: 1, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
              Hire Certified Technical & Vocational Graduates
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 720, mx: 'auto', lineHeight: 1.6 }}>
              Partner with Global Era Technical School to recruit skilled professionals in Beautician, Tailoring, Caregiver, and Electrical trades.
              Enjoy 100% verified credentials, zero recruitment commission, and direct access to top talent.
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="stretch">
            {/* Left: Why Partner With Us (Value Props) */}
            <Grid item xs={12} md={5}>
              <Stack spacing={2.5} sx={{ height: '100%', justifyContent: 'space-between' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', width: 42, height: 42 }}>
                      <WorkspacePremiumIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                      80% Practical CTEVT Standard
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                    Every candidate completes 390 hours of competency-based training on authentic industrial tools, machines, and clinical protocols.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', width: 42, height: 42 }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                      Pre-Screened & Verified Portfolios
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                    Instant QR-code verified certificates, attendance metrics (≥80%), and detailed unit competency scorecards for every graduate.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', width: 42, height: 42 }}>
                      <HandshakeIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                      OJT & Internship Hosting
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                    Trial candidates on-site during their concurrent or post-training On-the-Job Training (OJT) practicum before offering permanent employment.
                  </Typography>
                </Paper>

                <Box sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2.5, border: '1px dashed #F59E0B', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#FDE68A', fontWeight: 800, display: 'block' }}>
                    Already have an Employer Account?
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<BusinessIcon />}
                    onClick={() => onNavigate('employer')}
                    sx={{
                      mt: 1,
                      bgcolor: '#F59E0B',
                      color: '#0F2C59',
                      fontWeight: 900,
                      '&:hover': { bgcolor: '#D97706' }
                    }}
                  >
                    Enter Employer Portal
                  </Button>
                </Box>
              </Stack>
            </Grid>

            {/* Right: Registration & Immediate Hiring Form */}
            <Grid item xs={12} md={7}>
              <Paper
                elevation={6}
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderRadius: 3.5,
                  bgcolor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
              >
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2C59', mb: 0.5 }}>
                    Register as an Employer Partner
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    Register your salon, boutique, clinic, hospital or workshop to post vacancies and interview qualified graduates.
                  </Typography>
                </Box>

                {employerSuccess ? (
                  <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F0FDF4', borderRadius: 3, border: '2px solid #059669' }}>
                    <CheckCircleIcon sx={{ fontSize: 52, color: '#059669', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#065F46', mb: 0.5 }}>
                      Welcome, {employerSuccess.name}!
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#047857', mb: 2 }}>
                      Your organization is now registered as an official hiring partner. Your Employer Access Code is:
                    </Typography>

                    <Box sx={{ display: 'inline-block', p: 2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1.5px dashed #059669', mb: 2.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                        EMPLOYER ID & DEFAULT PIN:
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#065F46', letterSpacing: '0.05em' }}>
                        {employerSuccess.id} | PIN: {employerSuccess.pin}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} justifyContent="center">
                      <Button
                        variant="contained"
                        startIcon={<BusinessIcon />}
                        onClick={() => onNavigate('employer')}
                        sx={{ bgcolor: '#059669', fontWeight: 900, '&:hover': { bgcolor: '#047857' } }}
                      >
                        Launch Employer Portal
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setEmployerSuccess(null)}
                        sx={{ fontWeight: 800, borderColor: '#CBD5E1', color: '#475569' }}
                      >
                        Register Another
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <form onSubmit={handleEmployerRegister}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Company / Salon / Business Name *"
                          fullWidth
                          size="small"
                          required
                          placeholder="e.g., Glamour Beauty Parlor"
                          value={employerForm.name}
                          onChange={(e) => setEmployerForm({ ...employerForm, name: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Industry / Trade Category *"
                          value={employerForm.industry}
                          onChange={(e) => setEmployerForm({ ...employerForm, industry: e.target.value })}
                        >
                          <MenuItem value="Beauty Parlor & Cosmetology">Beauty Parlor & Cosmetology</MenuItem>
                          <MenuItem value="Fashion Boutique & Tailoring">Fashion Boutique & Tailoring</MenuItem>
                          <MenuItem value="Hospital, Clinic & Elderly Care">Hospital, Clinic & Elderly Care</MenuItem>
                          <MenuItem value="Electrical & Technical Workshop">Electrical & Technical Workshop</MenuItem>
                          <MenuItem value="Hospitality & Customer Service">Hospitality & Customer Service</MenuItem>
                          <MenuItem value="Other Commercial Enterprise">Other Commercial Enterprise</MenuItem>
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Contact Person Name *"
                          fullWidth
                          size="small"
                          required
                          placeholder="e.g., Sunita Sharma (Proprietor)"
                          value={employerForm.contactPerson}
                          onChange={(e) => setEmployerForm({ ...employerForm, contactPerson: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Official Phone / Mobile *"
                          fullWidth
                          size="small"
                          required
                          placeholder="e.g., 98XXXXXXXX"
                          value={employerForm.phone}
                          onChange={(e) => setEmployerForm({ ...employerForm, phone: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Email Address (Optional)"
                          fullWidth
                          size="small"
                          placeholder="e.g., info@company.com"
                          value={employerForm.email}
                          onChange={(e) => setEmployerForm({ ...employerForm, email: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Office / Salon Location *"
                          fullWidth
                          size="small"
                          required
                          placeholder="e.g., Jorpati / Chabahil, Kathmandu"
                          value={employerForm.location}
                          onChange={(e) => setEmployerForm({ ...employerForm, location: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Immediate Role to Hire *"
                          fullWidth
                          size="small"
                          placeholder="e.g., Junior Beautician / Dress Maker"
                          value={employerForm.jobRole}
                          onChange={(e) => setEmployerForm({ ...employerForm, jobRole: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <TextField
                          type="number"
                          label="Vacancies"
                          fullWidth
                          size="small"
                          inputProps={{ min: 1, max: 50 }}
                          value={employerForm.vacancies}
                          onChange={(e) => setEmployerForm({ ...employerForm, vacancies: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Portal PIN"
                          fullWidth
                          size="small"
                          inputProps={{ maxLength: 6 }}
                          value={employerForm.pin}
                          onChange={(e) => setEmployerForm({ ...employerForm, pin: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          type="submit"
                          variant="contained"
                          size="large"
                          startIcon={<WorkIcon />}
                          sx={{
                            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
                            fontWeight: 900,
                            py: 1.3,
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 15px rgba(15, 44, 89, 0.3)'
                          }}
                        >
                          Register Company & Connect With Graduates
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 6. FOOTER SECTION                                              */}
      {/* ============================================================== */}
      <Box sx={{ mt: 'auto', bgcolor: '#071A36', color: '#94A3B8', pt: 5, pb: 3, borderTop: '2px solid #1E293B' }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* Col 1: Institute Info */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF', mb: 1.2 }}>
                {company.companyNameEn || 'Global Era Technical School'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 800, display: 'block', mb: 1.5 }}>
                GLOBAL ERA TECHNICAL SCHOOL / GLOBAL ERA MULTI SERVICE
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7, maxWidth: 420 }}>
                A premier vocational skill development center affiliated with the Council for Technical Education and Vocational Training (CTEVT).
                Our mission is to produce skilled manpower and ensure employment readiness.
              </Typography>
            </Grid>

            {/* Col 2: Contact Info */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                Contact & Campus Location
              </Typography>
              <Stack spacing={1.2}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon fontSize="small" sx={{ color: '#F59E0B', mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#E2E8F0' }}>
                    {company.address || 'Global Era Multi Service — Jorpati, Gokarneshwor, Kathmandu, Nepal'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                  <Typography
                    component="a"
                    href="tel:01410715"
                    variant="body2"
                    sx={{ color: '#E2E8F0', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                  >
                    01410715
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" sx={{ color: '#38BDF8' }} />
                  <Typography
                    component="a"
                    href="mailto:globaleramultiservice@gmail.com"
                    variant="body2"
                    sx={{ color: '#E2E8F0', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                  >
                    globaleramultiservice@gmail.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" sx={{ color: '#10B981' }} />
                  <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                    7:00 AM – 6:00 PM (Sunday to Friday)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', pt: 0.5 }}>
                  CTEVT Affiliation Code: {company.ctevtCode || '4208'} • Reg No: {company.regNo || '184920/078/079'}
                </Typography>
              </Stack>
            </Grid>

            {/* Col 3: Portal Links */}
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                User Portals
              </Typography>
              <Stack spacing={1}>
                <Button
                  size="small"
                  onClick={() => onNavigate('agent')}
                  sx={{ color: '#FCD34D', justifyContent: 'flex-start', p: 0, fontWeight: 700 }}
                >
                  🤝 Agent / Referral Portal
                </Button>
                <Button
                  size="small"
                  onClick={() => onNavigate('trainer')}
                  sx={{ color: '#10B981', justifyContent: 'flex-start', p: 0, fontWeight: 700 }}
                >
                  👨‍🏫 Trainer Portal (Login)
                </Button>
                <Button
                  size="small"
                  onClick={() => onNavigate('student')}
                  sx={{ color: '#38BDF8', justifyContent: 'flex-start', p: 0, fontWeight: 700 }}
                >
                  🎓 Student Portal (Login)
                </Button>
                <Button
                  size="small"
                  onClick={() => onNavigate('employer')}
                  sx={{ color: '#F59E0B', justifyContent: 'flex-start', p: 0, fontWeight: 700 }}
                >
                  🏢 Employer Partner Hub
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: '#1E293B', mb: 2.5 }} />

          {/* Bottom Bar: Copyright and Discreet Admin Login */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption">
              © {new Date().getFullYear()} {company.companyNameEn || 'Global Era Technical School'}. All Rights Reserved.
            </Typography>

            {/* Discreet Management Link */}
            <Tooltip title="Super Admin ERP Login">
              <Button
                size="small"
                startIcon={<LockIcon sx={{ fontSize: 13 }} />}
                onClick={() => onNavigate('admin')}
                sx={{
                  color: '#475569',
                  fontSize: '0.7rem',
                  textTransform: 'none',
                  '&:hover': { color: '#94A3B8', bgcolor: 'transparent' }
                }}
              >
                Office System (ERP)
              </Button>
            </Tooltip>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
