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

import { loadDB, saveDB } from '../../services/storage';
import { calculateFeeBreakdown } from '../courses/CourseFeeManager';
import { verifyCertificateRemote } from '../../services/supabaseClient';

export default function PublicWebsite({ onNavigate, onVerifyCertificate }) {
  const [db, setDb] = useState(loadDB());
  const company = db.settings?.companyProfile || {};

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
      alert('कृपया आफ्नो नाम र सम्पर्क नम्बर अनिवार्य लेख्नुहोस्।');
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
      source: 'वेबसाइट अनलाइन सोधपुछ (Web Inquiry)',
      status: 'New',
      notes: `इच्छुक समय: ${inquiryForm.preferredShift} | सन्देश: ${inquiryForm.notes || 'छैन'}`,
      timeline: [
        {
          date: new Date().toISOString(),
          note: `वेबसाइटबाट नयाँ सोधपुछ दर्ता: ${chosenCourse?.title || 'कोर्स'}`,
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
        setVerifyError('उक्त प्रमाणपत्र नम्बर वा कोड हाम्रो आधिकारिक अभिलेखमा फेला परेन। कृपया पुनः जाँच गर्नुहोस्।');
      }
    } catch (_) {
      setVerifyError('प्रमाणीकरण गर्दा समस्या आयो। कृपया केही समयपछि पुनः प्रयास गर्नुहोस्।');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column' }}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER & NAVIGATION BAR                                  */}
      {/* ============================================================== */}
      <Box sx={{ bgcolor: '#0B2545', color: '#FFFFFF', borderBottom: '3px solid #F59E0B', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
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
                  color: '#0B2545',
                  width: 44,
                  height: 44,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                }}
              >
                <SchoolIcon sx={{ fontSize: 26 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: '0.03em', lineHeight: 1.1, color: '#FFFFFF' }}>
                  {company.companyNameNp || 'ग्लोबल एरा प्राविधिक स्कुल'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 700, fontSize: '0.68rem', display: 'block' }}>
                  CTEVT मान्यता प्राप्त • सम्बन्धन कोड: {company.ctevtCode || '४२०८'} • दर्ता नं: {company.regNo || '१८४९२०/०७८/०७९'}
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
                तालिम तथा शुल्क
              </Button>

              <Button
                size="small"
                onClick={() => {
                  const el = document.getElementById('verify-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.78rem', display: { xs: 'none', sm: 'inline-flex' } }}
              >
                प्रमाणपत्र प्रमाणीकरण
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<PeopleAltIcon />}
                onClick={() => onNavigate('trainer')}
                sx={{
                  borderColor: '#10B981',
                  color: '#10B981',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)', borderColor: '#059669' }
                }}
              >
                प्रशिक्षक पोर्टल
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<SchoolIcon />}
                onClick={() => onNavigate('student')}
                sx={{
                  bgcolor: '#0284C7',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: '#0369A1' }
                }}
              >
                विद्यार्थी पोर्टल
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 2. HERO BANNER SECTION                                          */}
      {/* ============================================================== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0B2545 0%, #0F2E5A 50%, #1E3A8A 100%)',
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
                label="CTEVT मान्यता प्राप्त राष्ट्रिय व्यावसायिक तालिम केन्द्र"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem', mb: 2, border: '1px solid rgba(253, 211, 77, 0.4)' }}
              />

              <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.2, mb: 2, fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' } }}>
                व्यावसायिक सीप, राष्ट्रिय मान्यता र <span style={{ color: '#F59E0B' }}>सुनौलो भविष्य</span>
              </Typography>

              <Typography variant="body1" sx={{ color: '#E2E8F0', mb: 3.5, fontSize: { xs: '0.9rem', md: '1.05rem' }, lineHeight: 1.7, maxWidth: 640 }}>
                ग्लोबल एरा प्राविधिक स्कुलमा राष्ट्रिय मापदण्ड अनुसार ३ महिने (३९० घण्टा) सीपमूलक तालिमहरू सञ्चालन भइरहेका छन्।
                पारदर्शी १३% भ्याट सहितको शुल्क, २ किस्ता सुविधा र शतप्रतिशत प्रयोगात्मक अभ्यास !
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
                  📝 अनलाइन भर्ना सोधपुछ (Apply Now)
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
                  💰 तालिम तथा शुल्क तालिका
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
                    अनलाइन प्रमाणपत्र प्रमाणीकरण
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                  ग्लोबल एराबाट जारी भएका आधिकारिक तालिम प्रमाणपत्र नम्बर यहाँ प्रविष्ट गर्नुहोस्।
                </Typography>

                <form onSubmit={handleVerifySearch}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="उदा: GE-2081-001 वा STD-01"
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
                      bgcolor: '#0B2545',
                      fontWeight: 800,
                      py: 1,
                      '&:hover': { bgcolor: '#07182C' }
                    }}
                  >
                    {verifying ? 'प्रमाणीकरण हुँदैछ...' : '🔍 प्रमाणपत्र जाँच्नुहोस्'}
                  </Button>
                </form>

                {/* Inline Verification Result */}
                {verifyResult && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#166534', mb: 0.5 }}>
                      <CheckCircleIcon fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        ✓ आधिकारिक प्रमाणपत्र प्रमाणित भयो !
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      विद्यार्थी: {verifyResult.student?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                      पाठ्यक्रम: {verifyResult.course?.title || 'व्यावसायिक तालिम'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                      प्रमाणपत्र नं: <b>{verifyResult.certificate?.certificateNo || verifyResult.certificate?.id}</b>
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>CTEVT मान्यता प्राप्त</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>सम्बन्धन कोड: {company.ctevtCode || '४२०८'}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', width: 44, height: 44 }}>
                  <AccessTimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>३९० घण्टा पाठ्यक्रम</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>३ महिने राष्ट्रिय मापदण्ड</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 44, height: 44 }}>
                  <AccountBalanceWalletIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>२ किस्ता भुक्तानी</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>५०% भर्नामा + ५०% १ महिनामा</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#F3E8FF', color: '#7E22CE', width: 44, height: 44 }}>
                  <VerifiedIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>१३% भ्याट सहित</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>पारदर्शी कर चुक्ता बिलिङ</Typography>
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
            <Chip label="पारदर्शी शुल्क संरचना" size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 800, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0B2545', mb: 1, fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
              आधिकारिक तालिम कोर्षहरू तथा शुल्क विवरण
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 650, mx: 'auto' }}>
              नेपाल सरकारको नियमानुसार १३% मूल्य अभिवृद्धि कर (VAT) समावेश गरिएको आधिकारिक शुल्क तालिका। कुनै लुकेको शुल्क नलाग्ने।
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
                    <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#FFFFFF', borderBottom: '3px solid #F59E0B' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.3 }}>
                          {crs.title}
                        </Typography>
                        <Chip
                          label={crs.level || 'Level 1'}
                          size="small"
                          sx={{ bgcolor: '#F59E0B', color: '#0F2E5A', fontWeight: 900, fontSize: '0.68rem', height: 22 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ⏱️ अवधि: <b>{crs.durationValue} {crs.durationUnit} ({crs.totalHours || 390} घण्टा)</b>
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
                          <span>मूल ब्रोसर शुल्क:</span>
                          <span style={{ textDecoration: feeCalc.discountPercent > 0 ? 'line-through' : 'none' }}>
                            रु. {feeCalc.basePrice.toLocaleString()}
                          </span>
                        </Box>

                        {/* Campaign Discount */}
                        {feeCalc.discountPercent > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#DC2626', fontWeight: 700 }}>
                            <span>अभियान छुट ({feeCalc.discountPercent}%):</span>
                            <span>(-) रु. {feeCalc.discountAmount.toLocaleString()}</span>
                          </Box>
                        )}

                        {/* Admission Charge */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569' }}>
                          <span>भर्ना तथा दर्ता शुल्क:</span>
                          <span>(+) रु. {feeCalc.admissionFee.toLocaleString()}</span>
                        </Box>

                        <Divider sx={{ my: 0.3 }} />

                        {/* 13% VAT */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#D97706', fontWeight: 700 }}>
                          <span>१३% भ्याट (VAT 13%):</span>
                          <span>(+) रु. {feeCalc.vatAmount.toLocaleString()}</span>
                        </Box>
                      </Stack>

                      {/* Final Net Effective Price Highlight */}
                      <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: 2, border: '1.5px solid #059669', textAlign: 'center', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800, display: 'block' }}>
                          कुल अन्तिम खुद शुल्क (१३% भ्याट सहित)
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', my: 0.3 }}>
                          रु. {feeCalc.totalEffectiveFee.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#047857', fontSize: '0.68rem', display: 'block' }}>
                          {isFullOnly ? '⚡ एकमुष्ट भुक्तानी (बेसिक दर)' : `📅 २ किस्ता: रु. ${feeCalc.installment1.toLocaleString()} + रु. ${feeCalc.installment2.toLocaleString()}`}
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
                          bgcolor: '#0B2545',
                          fontWeight: 800,
                          py: 1,
                          fontSize: '0.8rem',
                          '&:hover': { bgcolor: '#059669' }
                        }}
                      >
                        यो कोर्षमा भर्ना सोधपुछ गर्नुहोस्
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
              <Chip label="सजिलो अनलाइन आवेदन" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0B2545', mb: 0.5 }}>
                अनलाइन भर्ना तथा परामर्श सोधपुछ
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                तपाईं कुन तालिममा इच्छुक हुनुहुन्छ? तलको फारम भर्नुहोस्, हाम्रो परामर्शदाताले तुरुन्तै सम्पर्क गर्नुहुनेछ।
              </Typography>
            </Box>

            {inquirySubmitted ? (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F0FDF4', borderRadius: 2.5, border: '2px solid #059669' }}>
                <CheckCircleIcon sx={{ fontSize: 50, color: '#059669', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#065F46', mb: 0.5 }}>
                  तपाईंको सोधपुछ सफलतापूर्वक दर्ता भयो !
                </Typography>
                <Typography variant="body2" sx={{ color: '#047857', mb: 2 }}>
                  ग्लोबल एरा प्राविधिक स्कुल छनोट गर्नुभएकोमा धन्यवाद। हाम्रो एड्मिसन टोलीले तपाईंलाई छिट्टै सम्पर्क गर्नेछ।
                </Typography>
                <Button variant="outlined" size="small" onClick={() => setInquirySubmitted(false)} sx={{ fontWeight: 800, borderColor: '#059669', color: '#059669' }}>
                  अर्को फारम भर्नुहोस्
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleInquirySubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="पूरा नाम (Full Name) *"
                      fullWidth
                      size="small"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="मोबाइल फोन नम्बर *"
                      fullWidth
                      size="small"
                      required
                      placeholder="उदा: 98XXXXXXXX"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="इच्छुक कोर्ष (Interested Course) *"
                      value={inquiryForm.courseId}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, courseId: e.target.value })}
                    >
                      {courses.map((crs) => (
                        <MenuItem key={crs.id} value={crs.id}>
                          {crs.title} ({crs.level || 'Level 1'}) — रु. {crs.feeCalc.totalEffectiveFee.toLocaleString()}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="इच्छुक समय (Preferred Shift)"
                      value={inquiryForm.preferredShift}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, preferredShift: e.target.value })}
                    >
                      <MenuItem value="Morning">बिहानी सिफ्ट (६:३० - ९:३०)</MenuItem>
                      <MenuItem value="Day">दिउँसो सिफ्ट (११:०० - २:००)</MenuItem>
                      <MenuItem value="Evening">साँझ सिफ्ट (३:०० - ६:००)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="कुनै जिज्ञासा वा प्रश्न (Message / Remarks)"
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      placeholder="केही विशेष सोध्न चाहनुहुन्छ भने यहाँ लेख्नुहोस्..."
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
                      सोधपुछ फारम पेश गर्नुहोस् (Submit Inquiry)
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Paper>
        </Container>
      </Box>

      {/* ============================================================== */}
      {/* 6. FOOTER SECTION                                              */}
      {/* ============================================================== */}
      <Box sx={{ mt: 'auto', bgcolor: '#07182C', color: '#94A3B8', pt: 5, pb: 3, borderTop: '2px solid #1E293B' }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* Col 1: Institute Info */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF', mb: 1.2 }}>
                {company.companyNameNp || 'ग्लोबल एरा प्राविधिक स्कुल'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 800, display: 'block', mb: 1.5 }}>
                GLOBAL ERA TECHNICAL SCHOOL / GLOBAL ERA MULTI SERVICE
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7, maxWidth: 420 }}>
                प्राविधिक शिक्षा तथा व्यावसायिक तालिम परिषद् (CTEVT) बाट सम्बन्धन प्राप्त स्तरीय व्यावसायिक सीप विकास केन्द्र।
                हाम्रो लक्ष्य दक्ष जनशक्ति उत्पादन र रोजगारी सुनिश्चितता हो।
              </Typography>
            </Grid>

            {/* Col 2: Contact Info */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                सम्पर्क तथा ठेगाना
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                  <Typography variant="body2">{company.address || 'मित्रपार्क, चाबहिल, काठमाडौं, नेपाल'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                  <Typography variant="body2">{company.phone || '०१-४४६९००० / ९८५१००००००'}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', pt: 0.5 }}>
                  CTEVT सम्बन्धन कोड: {company.ctevtCode || '४२०८'} • दर्ता नं: {company.regNo || '१८४९२०/०७८/०७९'}
                </Typography>
              </Stack>
            </Grid>

            {/* Col 3: Portal Links */}
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1.5 }}>
                प्रयोगकर्ता पोर्टलहरू
              </Typography>
              <Stack spacing={1}>
                <Button
                  size="small"
                  onClick={() => onNavigate('trainer')}
                  sx={{ color: '#10B981', justifyContent: 'flex-start', p: 0, fontWeight: 700 }}
                >
                  👨‍🏫 प्रशिक्षक पोर्टल (Trainer Login)
                </Button>
                <Button
                  size="small"
                  onClick={() => onNavigate('student')}
                  sx={{ color: '#38BDF8', justifyContent: 'flex-start', p: 0, fontWeight: 700 }}
                >
                  🎓 विद्यार्थी पोर्टल (Student Login)
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: '#1E293B', mb: 2.5 }} />

          {/* Bottom Bar: Copyright and Discreet Admin Login */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption">
              © {new Date().getFullYear()} {company.companyNameEn || 'Global Era Technical School'}. सर्वाधिकार सुरक्षित।
            </Typography>

            {/* Discreet Management Link */}
            <Tooltip title="संस्था व्यवस्थापक लगइन (Super Admin ERP)">
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
                कार्यालय प्रणाली (ERP)
              </Button>
            </Tooltip>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
