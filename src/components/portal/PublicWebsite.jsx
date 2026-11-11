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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  LinearProgress
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
import PrintIcon from '@mui/icons-material/Print';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpeedIcon from '@mui/icons-material/Speed';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PaymentsIcon from '@mui/icons-material/Payments';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SpaIcon from '@mui/icons-material/Spa';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HandymanIcon from '@mui/icons-material/Handyman';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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

  // Active Syllabus Preview Modal State for Prospective Trainees & Counselors
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState(null);
  const [brochureTab, setBrochureTab] = useState(0);

  const activeSyllabusUnits = useMemo(() => {
    if (!selectedSyllabusCourse) return [];
    const direct = (db.syllabi || []).filter((s) => s.courseId === selectedSyllabusCourse.id);
    if (direct.length > 0) return direct.sort((a, b) => Number(a.unitNo) - Number(b.unitNo));

    const title = (selectedSyllabusCourse.title || '').toLowerCase();
    if (title.includes('beauty') || title.includes('beautician')) {
      return [
        { unitNo: 1, title: 'Introduction to Beauty Culture, Sanitation & Hygiene', theoryHours: 12, practicalHours: 18, toolsAndMaterials: 'Sterilizer, Sanitizer, Apron' },
        { unitNo: 2, title: 'Skin Anatomy, Facial Treatments & Clean-up', theoryHours: 10, practicalHours: 50, toolsAndMaterials: 'Facial Bed, Steamer, Scrub, Pack' },
        { unitNo: 3, title: 'Hair Cutting, Styling & Thermal Setting', theoryHours: 12, practicalHours: 58, toolsAndMaterials: 'Shears, Blow Dryer, Curling Iron' },
        { unitNo: 4, title: 'Hair Chemical Treatments (Rebonding & Smoothening)', theoryHours: 10, practicalHours: 50, toolsAndMaterials: 'Straightener, Chemical Bowls, Brushes' },
        { unitNo: 5, title: 'Professional Makeup (Day, Evening & Bridal HD)', theoryHours: 10, practicalHours: 50, toolsAndMaterials: 'Makeup Palette, Brush Set, HD Base' },
        { unitNo: 6, title: 'Manicure, Pedicure & Nail Art Techniques', theoryHours: 6, practicalHours: 34, toolsAndMaterials: 'Pedicure Tub, Cuticle Nipper, UV Lamp' },
        { unitNo: 7, title: 'Hair Removal (Waxing & Threading)', theoryHours: 6, practicalHours: 34, toolsAndMaterials: 'Cotton Thread, Wax Heater, Strips' },
        { unitNo: 8, title: 'Salon Management & Client Care', theoryHours: 12, practicalHours: 18, toolsAndMaterials: 'Appointment System, Client Records' }
      ];
    }
    if (title.includes('tailor') || title.includes('dress') || title.includes('fashion') || title.includes('stitch')) {
      return [
        { unitNo: 1, title: 'Garment Technology & Measurement Fundamentals', theoryHours: 12, practicalHours: 18, toolsAndMaterials: 'Measuring Tape, Chalk, Shears' },
        { unitNo: 2, title: 'Industrial Sewing Machine Operation & Maintenance', theoryHours: 10, practicalHours: 40, toolsAndMaterials: 'Industrial Lockstitch Machine, Needles' },
        { unitNo: 3, title: 'Pattern Drafting, Freehand Paper Cutting & Layout', theoryHours: 12, practicalHours: 58, toolsAndMaterials: 'Pattern Paper, L-Square, French Curve' },
        { unitNo: 4, title: 'Women’s Traditional Wear: Blouse Construction', theoryHours: 10, practicalHours: 60, toolsAndMaterials: 'Fabric, Interlining, Hooks, Iron' },
        { unitNo: 5, title: 'Traditional Wear: Kurtha, Suruwal & Salwar Construction', theoryHours: 10, practicalHours: 60, toolsAndMaterials: 'Suit Fabric, Thread Sets, Fusing Paper' },
        { unitNo: 6, title: 'Western Wear: Shirts, Trousers & Frocks', theoryHours: 8, practicalHours: 52, toolsAndMaterials: 'Fabric, Zippers, Collar Stiffener' },
        { unitNo: 7, title: 'Overlocking, Edge Finishing & Quality Pressing', theoryHours: 6, practicalHours: 34, toolsAndMaterials: 'Overlock Machine, Steam Iron' },
        { unitNo: 8, title: 'Boutique Management & Cost Calculation', theoryHours: 10, practicalHours: 20, toolsAndMaterials: 'Order Book, Costing Sheet' }
      ];
    }
    // Default Caregiver
    return [
      { unitNo: 1, title: 'Orientation, Ethics & Safety Measures', theoryHours: 10, practicalHours: 20, toolsAndMaterials: 'PPE Kit, Whiteboard' },
      { unitNo: 2, title: 'Fundamental Patient Care, Hygiene & Infection Control', theoryHours: 10, practicalHours: 40, toolsAndMaterials: 'Hospital Bed, Linens, Basin, Gloves' },
      { unitNo: 3, title: 'Vital Signs Monitoring & Health Assessment', theoryHours: 8, practicalHours: 32, toolsAndMaterials: 'Sphygmomanometer, Stethoscope, Oximeter' },
      { unitNo: 4, title: 'Nutrition, Therapeutic Diets & Meal Assistance', theoryHours: 10, practicalHours: 30, toolsAndMaterials: 'Feeding Tray, Pureed Meal Sets' },
      { unitNo: 5, title: 'Patient Mobility, Transfers & Assistive Devices', theoryHours: 6, practicalHours: 34, toolsAndMaterials: 'Wheelchair, Walking Frame, Transfer Belt' },
      { unitNo: 6, title: 'Emergency First Aid, Wound Care & Adult CPR', theoryHours: 8, practicalHours: 32, toolsAndMaterials: 'CPR Resusci Anne Mannequin, First Aid Box' },
      { unitNo: 7, title: 'Geriatric Care & Dementia Support', theoryHours: 10, practicalHours: 40, toolsAndMaterials: 'Sensory Therapy Kit, Orientation Clock' },
      { unitNo: 8, title: 'Medication Administration & Daily Log Book', theoryHours: 8, practicalHours: 22, toolsAndMaterials: 'Pill Organizer, Medication Chart' },
      { unitNo: 9, title: 'Palliative, End-of-Life & Bedridden Care', theoryHours: 6, practicalHours: 34, toolsAndMaterials: 'Air Mattress, Position Wedges' },
      { unitNo: 10, title: 'Clinical Demonstration & OJT Internship Preparation', theoryHours: 4, practicalHours: 26, toolsAndMaterials: 'Log Book, Uniform, Skill Rubric' }
    ];
  }, [selectedSyllabusCourse, db.syllabi]);

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
              const titleLower = (crs.title || '').toLowerCase();
              const isBeauty = titleLower.includes('beauty') || titleLower.includes('beautician');
              const isTailor = titleLower.includes('tailor') || titleLower.includes('dress') || titleLower.includes('fashion') || titleLower.includes('stitch');

              const headerGradient = isBeauty
                ? 'linear-gradient(135deg, #701A75 0%, #9D174D 60%, #BE123C 100%)'
                : isTailor
                ? 'linear-gradient(135deg, #451A03 0%, #78350F 60%, #B45309 100%)'
                : 'linear-gradient(135deg, #071A36 0%, #0F2C59 60%, #1E40AF 100%)';

              const accentBorder = isBeauty ? '#F43F5E' : isTailor ? '#D97706' : '#2563EB';
              const tradeLabel = isBeauty ? 'Beauty & Cosmetology' : isTailor ? 'Tailoring & Fashion' : 'Healthcare & Caregiving';
              const tradeIcon = isBeauty ? (
                <SpaIcon sx={{ fontSize: 18, color: '#FECDD3' }} />
              ) : isTailor ? (
                <ContentCutIcon sx={{ fontSize: 18, color: '#FDE68A' }} />
              ) : (
                <MedicalServicesIcon sx={{ fontSize: 18, color: '#BAE6FD' }} />
              );

              return (
                <Grid item xs={12} sm={6} md={4} key={crs.id}>
                  <Card
                    elevation={3}
                    sx={{
                      borderRadius: 3.5,
                      border: '1px solid #E2E8F0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.25s ease',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 16px 36px rgba(0,0,0,0.12)',
                        borderColor: accentBorder
                      }
                    }}
                  >
                    {/* Premium Header */}
                    <Box sx={{ p: 2.5, background: headerGradient, color: '#FFFFFF', borderBottom: `3px solid ${accentBorder}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          {tradeIcon}
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                            {tradeLabel}
                          </Typography>
                        </Box>
                        <Chip
                          label={crs.level || 'Level 1'}
                          size="small"
                          sx={{ bgcolor: '#F59E0B', color: '#0F2C59', fontWeight: 900, fontSize: '0.68rem', height: 22 }}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.3, color: '#FFFFFF', mb: 0.8 }}>
                        {crs.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ⏱️ Duration: <b>{crs.durationValue} {crs.durationUnit} ({crs.totalHours || 390} Hours)</b>
                      </Typography>
                    </Box>

                    {/* Features Micro-Chips */}
                    <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.6, bgcolor: '#F8FAFC' }}>
                      <Chip label="80% Practical Lab" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                      <Chip label="2h Shifts (A-E)" size="small" sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                      <Chip label="OJT Placement" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                    </Box>

                    {/* Pricing Breakdown */}
                    <CardContent sx={{ p: 2.5, pt: 1.5, flexGrow: 1 }}>
                      {crs.description && (
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2, minHeight: 32, fontStyle: 'italic', lineHeight: 1.4 }}>
                          {crs.description}
                        </Typography>
                      )}

                      <Stack spacing={0.8} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', mb: 2 }}>
                        {/* Brochure Price */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B' }}>
                          <span>Base Tuition Fee:</span>
                          <span style={{ textDecoration: feeCalc.discountPercent > 0 ? 'line-through' : 'none' }}>
                            NPR {feeCalc.basePrice.toLocaleString()}
                          </span>
                        </Box>

                        {/* Campaign Discount */}
                        {feeCalc.discountPercent > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#DC2626', fontWeight: 700 }}>
                            <span>Campaign Scholarship ({feeCalc.discountPercent}%):</span>
                            <span>(-) NPR {feeCalc.discountAmount.toLocaleString()}</span>
                          </Box>
                        )}

                        {/* Admission Charge */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569' }}>
                          <span>Registration & Exam Charge:</span>
                          <span>(+) NPR {feeCalc.admissionFee.toLocaleString()}</span>
                        </Box>

                        <Divider sx={{ my: 0.3 }} />

                        {/* 13% VAT */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#D97706', fontWeight: 700 }}>
                          <span>Government 13% VAT:</span>
                          <span>(+) NPR {feeCalc.vatAmount.toLocaleString()}</span>
                        </Box>
                      </Stack>

                      {/* Final Net Effective Price Highlight */}
                      <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: 2, border: '1.5px solid #059669', textAlign: 'center', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800, display: 'block' }}>
                          Total Final Net Fee (All Taxes Included)
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', my: 0.3 }}>
                          NPR {feeCalc.totalEffectiveFee.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#047857', fontSize: '0.68rem', display: 'block' }}>
                          {isFullOnly ? '⚡ Full Payment (Standard Rate)' : `📅 2 Installments: NPR ${feeCalc.installment1.toLocaleString()} + NPR ${feeCalc.installment2.toLocaleString()}`}
                        </Typography>
                      </Box>
                    </CardContent>

                    {/* Action Buttons */}
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Stack spacing={1}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handleSelectCourseForInquiry(crs.id)}
                          sx={{
                            bgcolor: '#059669',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            py: 0.9,
                            fontSize: '0.82rem',
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                            '&:hover': { bgcolor: '#047857' }
                          }}
                        >
                          Inquire About This Course
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<AutoAwesomeIcon sx={{ fontSize: 17, color: isBeauty ? '#BE123C' : isTailor ? '#B45309' : '#0F2C59' }} />}
                          onClick={() => {
                            setBrochureTab(0);
                            setSelectedSyllabusCourse(crs);
                          }}
                          sx={{
                            borderColor: isBeauty ? '#BE123C' : isTailor ? '#B45309' : '#0F2C59',
                            color: isBeauty ? '#BE123C' : isTailor ? '#B45309' : '#0F2C59',
                            fontWeight: 800,
                            py: 0.85,
                            fontSize: '0.78rem',
                            borderRadius: 2,
                            borderWidth: 1.5,
                            bgcolor: isBeauty ? 'rgba(190, 18, 60, 0.04)' : isTailor ? 'rgba(180, 83, 9, 0.04)' : 'rgba(15, 44, 89, 0.04)',
                            '&:hover': {
                              bgcolor: isBeauty ? 'rgba(190, 18, 60, 0.1)' : isTailor ? 'rgba(180, 83, 9, 0.1)' : 'rgba(15, 44, 89, 0.1)',
                              borderWidth: 1.5,
                              borderColor: isBeauty ? '#9D174D' : isTailor ? '#78350F' : '#071A36'
                            }
                          }}
                        >
                          View Syllabus &amp; Brochure
                        </Button>
                      </Stack>
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
                          {crs.title} ({crs.level || 'Level 1'}) — NPR {(crs.feeCalc?.totalEffectiveFee || crs.price || 0).toLocaleString()}
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

      {/* ============================================================== */}
      {/* 7. OFFICIAL SYLLABUS & COUNSELING BROCHURE MODAL                */}
      {/* ============================================================== */}
      {selectedSyllabusCourse && (
        <Dialog
          open={Boolean(selectedSyllabusCourse)}
          onClose={() => setSelectedSyllabusCourse(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 2, sm: 4 },
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              maxHeight: '92vh'
            }
          }}
        >
          {(() => {
            const cTitle = (selectedSyllabusCourse.title || '').toLowerCase();
            const isBeautician = cTitle.includes('beauty') || cTitle.includes('beautician');
            const isTailoring = cTitle.includes('tailor') || cTitle.includes('dress') || cTitle.includes('fashion') || cTitle.includes('stitch');

            const totalTheory = activeSyllabusUnits.reduce((acc, u) => acc + (Number(u.theoryHours) || 0), 0);
            const totalPractical = activeSyllabusUnits.reduce((acc, u) => acc + (Number(u.practicalHours) || 0), 0);
            const totalHours = totalTheory + totalPractical || selectedSyllabusCourse.totalHours || 390;
            const pRatio = totalHours > 0 ? Math.round((totalPractical / totalHours) * 100) : 80;

            const feeCalc = selectedSyllabusCourse.feeCalc || calculateFeeBreakdown(selectedSyllabusCourse.feeStructure || {
              basePrice: selectedSyllabusCourse.price || 30000,
              discountPercent: 70,
              admissionFee: 1500,
              vatPercent: 13,
              paymentMode: 'TWO_INSTALLMENTS'
            });

            const theme = isBeautician
              ? {
                  tradeName: 'Beautician & Cosmetology',
                  tagline: 'Professional Cosmetology, Skin Aesthetic Therapies & Bridal HD Makeup Artistry',
                  heroGradient: 'linear-gradient(135deg, #500724 0%, #831843 40%, #9D174D 75%, #BE123C 100%)',
                  primary: '#9D174D',
                  secondary: '#BE123C',
                  accent: '#F59E0B',
                  cardBg: '#FFF1F2',
                  border: '#FECDD3',
                  icon: <SpaIcon sx={{ fontSize: 26, color: '#FECDD3' }} />,
                  facilities: [
                    'Advanced Digital Ozone Facial Steamers with Ultrasonic Infusion',
                    'Hospital-Grade UV Ray Sterilization & Sanitization Chambers',
                    'Hydraulic Reclining Aesthetic Treatment & Hair Styling Chairs',
                    'Titanium Nano-Ceramic Thermal Straighteners & Curling Wands',
                    'Professional Airbrush & High-Definition Bridal Makeup Stations',
                    'Hydro-Massage Pedicure Spa Thrones & Precision Nail Art Stations',
                    'High-Frequency Therapeutic Glass Electrode Facial Sets'
                  ],
                  careers: [
                    { title: 'Independent Salon & Spa Owner', text: 'Launch your own thriving beauty parlour, nail lounge, or bridal aesthetics studio.' },
                    { title: 'Senior Bridal & Celebrity Makeup Artist', text: 'High-earning client assignments for weddings, fashion shoots, TV, and cinema.' },
                    { title: 'Dermatological Clinic Aesthetic Assistant', text: 'Work alongside certified dermatologists in modern clinical skin care treatments.' },
                    { title: 'International Cruise Ship & Luxury Spa Specialist', text: 'Globally certified qualification for five-star hotels and cruise liners in UAE, Europe, and Asia.' }
                  ]
                }
              : isTailoring
              ? {
                  tradeName: 'Tailoring & Fashion Designing',
                  tagline: 'Master Pattern Drafting, Haute Couture Cutting & Industrial Garment Production',
                  heroGradient: 'linear-gradient(135deg, #2E1005 0%, #451A03 40%, #78350F 75%, #B45309 100%)',
                  primary: '#78350F',
                  secondary: '#B45309',
                  accent: '#F59E0B',
                  cardBg: '#FFFBEB',
                  border: '#FDE68A',
                  icon: <ContentCutIcon sx={{ fontSize: 26, color: '#FDE68A' }} />,
                  facilities: [
                    'Juki DDL-8700 Industrial High-Speed Lockstitch Sewing Machines',
                    'Pegasus 4-Thread Heavy-Duty Industrial Overlock Surger Machines',
                    'Automated Vacuum Heated Steam Press Tables with Boilers',
                    'Master Pattern Drafting Rulers (L-Squares, French Curves, Grading Sets)',
                    'Professional Kai & Gingher Precision Cutting Shears & Rotary Cutters',
                    'Adjustable Female & Male Haute Couture Dressmaker Mannequins',
                    'Interfacing Fusing Press Stations & Automatic Buttonhole Attachments'
                  ],
                  careers: [
                    { title: 'Custom Boutique & Fashion Atelier Owner', text: 'Open your own profitable custom tailoring boutique for bridal and designer apparel.' },
                    { title: 'Export Garment Factory Pattern Master', text: 'Lead pattern making, grading, and sample development in apparel export manufacturing.' },
                    { title: 'Quality Assurance & Production Supervisor', text: 'Manage sewing floor quality, structural measurements, and finishing standards.' },
                    { title: 'Overseas Apparel Specialist (Gulf / Europe)', text: 'High-demand industrial garment craftsman for international apparel production hubs.' }
                  ]
                }
              : {
                  tradeName: 'Healthcare & Clinical Caregiving',
                  tagline: 'Certified Clinical Elder Care, Assisted Living & International SSW Nursing Aide',
                  heroGradient: 'linear-gradient(135deg, #071A36 0%, #0F2C59 45%, #1E40AF 85%, #2563EB 100%)',
                  primary: '#0F2C59',
                  secondary: '#1E40AF',
                  accent: '#38BDF8',
                  cardBg: '#F0F9FF',
                  border: '#BAE6FD',
                  icon: <MedicalServicesIcon sx={{ fontSize: 26, color: '#BAE6FD' }} />,
                  facilities: [
                    '5-Function Electric ICU Hospital Beds with Ergonomic Side Rails',
                    'Hydraulic Patient Transfer Hoists & Safety Transfer Slings',
                    'Laerdal Adult CPR Resuscitation Manikins with Digital Compression Feedback',
                    'Multi-Parameter Digital Patient Vital Signs Monitors (NIBP, SpO2, Pulse, Temp)',
                    'Clinical Urinary Catheterization, Bedpan & Tube Feeding Simulators',
                    'Ergonomic Wheelchairs, Walking Zimmer Frames & Gait Transfer Belts',
                    'Trauma Response, Wound Dressing & Infection Control Simulated Laboratory'
                  ],
                  careers: [
                    { title: 'Japan SSW Certified Nursing Caregiver', text: 'Direct pathway for Specified Skilled Worker (SSW-1) elderly care placement in Japan.' },
                    { title: 'Hospital Ward & Assisted Living Specialist', text: 'Employment in leading national hospitals, rehabilitation centers, and senior care homes.' },
                    { title: 'Private In-Home Palliative Care Specialist', text: 'High-earning personalized geriatric, dementia, and post-operative nursing assistance.' },
                    { title: 'UK / Europe Healthcare Assistant Pathway', text: 'Accredited vocational foundation for international healthcare assistant work visas.' }
                  ]
                };

            const shiftMatrix = [
              { shift: 'Shift A', time: '07:00 AM – 09:00 AM', label: 'Early Morning Batch', focus: 'Ideal for morning workers & college students' },
              { shift: 'Shift B', time: '10:00 AM – 12:00 PM', label: 'Mid-Morning Batch', focus: 'Prime practical lab training shift' },
              { shift: 'Shift C', time: '12:00 PM – 02:00 PM', label: 'Afternoon Batch', focus: 'Hands-on practice & instructor reviews' },
              { shift: 'Shift D', time: '02:00 PM – 04:00 PM', label: 'Late Afternoon Batch', focus: 'Skill refinement & individual mentoring' },
              { shift: 'Shift E', time: '04:00 PM – 06:00 PM', label: 'Evening Executive Batch', focus: 'For working professionals & career switchers' },
              { shift: 'Weekend', time: 'Saturday & Sunday (3h)', label: 'Weekend Intensive Batch', focus: 'Accelerated fast-track workshop cohort' }
            ];

            const handleWhatsAppShare = () => {
              const phone = company.phone || '01410715';
              const unitsSummary = activeSyllabusUnits
                .slice(0, 6)
                .map((u) => `  *Unit ${u.unitNo}:* ${u.title} (${(Number(u.theoryHours) || 0) + (Number(u.practicalHours) || 0)}h)`)
                .join('\n');

              const text =
                `🎓 *GLOBAL ERA TECHNICAL SCHOOL — OFFICIAL COURSE BROCHURE*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📘 *Course:* ${selectedSyllabusCourse.title} (${theme.tradeName})\n` +
                `🎖️ *Affiliation:* CTEVT Accredited (Code: 4208) • Level-1 National Standard\n` +
                `⏱️ *Total Duration:* ${totalHours} Hours (${pRatio}% Practical Hands-on Workshop)\n` +
                `📊 *Hours Distribution:* ${totalPractical}h Practical Lab + ${totalTheory}h Classroom Theory\n\n` +
                `⏰ *Flexible 2-Hour Daily Shifts (Pick Any):*\n` +
                `• Shift A: 07:00 AM – 09:00 AM (Early Morning)\n` +
                `• Shift B: 10:00 AM – 12:00 PM (Mid Morning)\n` +
                `• Shift C: 12:00 PM – 02:00 PM (Afternoon)\n` +
                `• Shift D: 02:00 PM – 04:00 PM (Late Afternoon)\n` +
                `• Shift E: 04:00 PM – 06:00 PM (Evening)\n` +
                `• Weekend Batch: Saturday / Sunday Intensive\n\n` +
                `📚 *Core Competency Units:*\n${unitsSummary}\n\n` +
                `💼 *Career & OJT Guarantee:*\n` +
                `✓ 100% Guaranteed On-the-Job (OJT) Internship\n` +
                `✓ Direct Employer Placement & Referral Assistance\n\n` +
                `💳 *Transparent Fee Schedule (13% VAT Included):*\n` +
                `• Total Net Fee: NPR ${(feeCalc.totalEffectiveFee || 0).toLocaleString()}\n` +
                `• Affordable 2-Installments: NPR ${(feeCalc.installment1 || 0).toLocaleString()} on Admission + NPR ${(feeCalc.installment2 || 0).toLocaleString()} Mid-Course clearance\n\n` +
                `📍 *Campus:* Jorpati, Gokarneshwor, Kathmandu (Near Mitra Park)\n` +
                `📞 *Call / WhatsApp:* ${phone}`;

              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            };

            return (
              <>
                {/* 1. ULTRA-PREMIUM HERO HEADER */}
                <Box
                  sx={{
                    background: theme.heroGradient,
                    color: '#FFFFFF',
                    p: { xs: 2.5, sm: 3.5 },
                    position: 'relative'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                    {/* Left: Branding & Course Title */}
                    <Box sx={{ maxWidth: { xs: '100%', md: '75%' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<WorkspacePremiumIcon sx={{ color: '#F59E0B !important', fontSize: 16 }} />}
                          label="CTEVT ACCREDITED AFFILIATION #4208"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(245, 158, 11, 0.18)',
                            color: '#FDE68A',
                            fontWeight: 900,
                            letterSpacing: 0.5,
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            fontSize: '0.72rem'
                          }}
                        />
                        <Chip
                          label={theme.tradeName}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}
                        />
                        <Chip
                          label={`${totalHours} Hours (${pRatio}% Practical)`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(16, 185, 129, 0.25)',
                            color: '#A7F3D0',
                            fontWeight: 800,
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            fontSize: '0.72rem'
                          }}
                        />
                      </Box>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          fontSize: { xs: '1.4rem', sm: '1.85rem' },
                          color: '#FFFFFF',
                          lineHeight: 1.25,
                          mb: 0.8
                        }}
                      >
                        {selectedSyllabusCourse.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.88)',
                          fontSize: { xs: '0.82rem', sm: '0.9rem' },
                          fontWeight: 500,
                          maxWidth: 720
                        }}
                      >
                        {theme.tagline}
                      </Typography>
                    </Box>

                    {/* Right: Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<WhatsAppIcon sx={{ color: '#FFFFFF' }} />}
                        onClick={handleWhatsAppShare}
                        sx={{
                          bgcolor: '#25D366',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          borderRadius: 2,
                          px: 1.5,
                          '&:hover': { bgcolor: '#1EBE5D' }
                        }}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          borderRadius: 2,
                          px: 1.5,
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' }
                        }}
                      >
                        Print A4
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedSyllabusCourse(null)}
                        sx={{
                          color: '#FFFFFF',
                          bgcolor: 'rgba(255,255,255,0.15)',
                          borderRadius: 2,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* 2. 4-PILLAR EXECUTIVE HIGHLIGHT TILES */}
                <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderBottom: '1px solid #E2E8F0' }}>
                  <Grid container spacing={1.5}>
                    {/* Tile 1: 80% Practical */}
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          p: 1.8,
                          bgcolor: '#FFFFFF',
                          borderRadius: 2.5,
                          border: '1px solid #E2E8F0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <SpeedIcon sx={{ color: '#059669', fontSize: 20 }} />
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#059669', textTransform: 'uppercase' }}>
                            Hands-On Ratio
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', my: 0.2 }}>
                          {pRatio}% Practical Lab
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                          {totalPractical}h Workshop • {totalTheory}h Theory
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={pRatio}
                          sx={{
                            mt: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#E2E8F0',
                            '& .MuiLinearProgress-bar': { bgcolor: '#059669', borderRadius: 3 }
                          }}
                        />
                      </Box>
                    </Grid>

                    {/* Tile 2: 2-Hour Flexible Shifts */}
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          p: 1.8,
                          bgcolor: '#FFFFFF',
                          borderRadius: 2.5,
                          border: '1px solid #E2E8F0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <ScheduleIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#2563EB', textTransform: 'uppercase' }}>
                            Daily Shift Matrix
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', my: 0.2 }}>
                          2-Hour Daily Shifts
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                          Shifts A, B, C, D, E + Weekend
                        </Typography>
                        <Chip
                          label="Small Batches: 15-20 Trainees"
                          size="small"
                          sx={{ mt: 1, bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: '0.66rem', height: 20 }}
                        />
                      </Box>
                    </Grid>

                    {/* Tile 3: Guaranteed OJT & Placement */}
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          p: 1.8,
                          bgcolor: '#FFFFFF',
                          borderRadius: 2.5,
                          border: '1px solid #E2E8F0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <HandshakeIcon sx={{ color: '#D97706', fontSize: 20 }} />
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#D97706', textTransform: 'uppercase' }}>
                            Industry Career
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', my: 0.2 }}>
                          100% Guaranteed OJT
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                          Partner Enterprise Placement Cell
                        </Typography>
                        <Chip
                          label="Verified Employer Network"
                          size="small"
                          sx={{ mt: 1, bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.66rem', height: 20 }}
                        />
                      </Box>
                    </Grid>

                    {/* Tile 4: 2-Installment Affordable Fee */}
                    <Grid item xs={6} md={3}>
                      <Box
                        sx={{
                          p: 1.8,
                          bgcolor: '#FFFFFF',
                          borderRadius: 2.5,
                          border: '1px solid #E2E8F0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PaymentsIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase' }}>
                            Fair Fee Policy
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#059669', my: 0.2 }}>
                          NPR {(feeCalc.totalEffectiveFee || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                          50% Admission + 50% Mid-Course
                        </Typography>
                        <Chip
                          label="13% VAT & Practice Kit Included"
                          size="small"
                          sx={{ mt: 1, bgcolor: '#F5F3FF', color: '#6D28D9', fontWeight: 800, fontSize: '0.66rem', height: 20 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* 3. MODERN TAB NAVIGATION BAR */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#FFFFFF', px: 2 }}>
                  <Tabs
                    value={brochureTab}
                    onChange={(_, val) => setBrochureTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      '& .MuiTab-root': {
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        textTransform: 'none',
                        minHeight: 46,
                        color: '#64748B',
                        '&.Mui-selected': {
                          color: theme.primary
                        }
                      },
                      '& .MuiTabs-indicator': {
                        bgcolor: theme.primary,
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                      }
                    }}
                  >
                    <Tab label={`📖 Curriculum Modules (${activeSyllabusUnits.length} Units)`} />
                    <Tab label="🛠️ Workshop Equipment & Lab Facilities" />
                    <Tab label="🕒 2-Hour Daily Shift Schedule" />
                    <Tab label="🤝 Career Roles & OJT Partners" />
                    <Tab label="💳 Transparent Fee & Installments" />
                  </Tabs>
                </Box>

                {/* 4. TAB CONTENTS */}
                <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#FAFBFD' }}>
                  {/* TAB 0: CURRICULUM MODULES TABLE & CARDS */}
                  {brochureTab === 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: theme.primary }}>
                            CTEVT National Vocational Standard Curriculum Units
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Every unit includes practical execution demonstrations, log-book documentation, and instructor assessment.
                          </Typography>
                        </Box>
                        <Chip
                          label={`Total: ${totalHours} Hours (${totalPractical}h Practical + ${totalTheory}h Theory)`}
                          size="small"
                          sx={{ bgcolor: theme.cardBg, color: theme.primary, border: `1px solid ${theme.border}`, fontWeight: 900 }}
                        />
                      </Box>

                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: theme.primary }}>
                            <TableRow>
                              <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 60, textAlign: 'center' }}>Unit</TableCell>
                              <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>Module Title &amp; Competency Objectives</TableCell>
                              <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 85 }}>Theory</TableCell>
                              <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 95 }}>Practical</TableCell>
                              <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 80 }}>Total</TableCell>
                              <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>Tools &amp; Equipment Provided</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeSyllabusUnits.map((u) => {
                              const tH = Number(u.theoryHours) || 0;
                              const pH = Number(u.practicalHours) || 0;
                              const tot = tH + pH;
                              return (
                                <TableRow key={u.unitNo} sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                                  <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: theme.primary }}>
                                    <Chip
                                      label={`0${u.unitNo}`}
                                      size="small"
                                      sx={{ bgcolor: theme.cardBg, color: theme.primary, fontWeight: 900, fontSize: '0.72rem', height: 22 }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A' }}>
                                    {u.title}
                                  </TableCell>
                                  <TableCell sx={{ textAlign: 'center', color: '#2563EB', fontWeight: 700, fontSize: '0.82rem' }}>
                                    {tH}h
                                  </TableCell>
                                  <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#059669', fontSize: '0.84rem' }}>
                                    {pH}h
                                  </TableCell>
                                  <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#0F172A', fontSize: '0.84rem' }}>
                                    {tot}h
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.78rem', color: '#475569' }}>
                                    <Chip
                                      label={u.toolsAndMaterials || 'Workshop Tool Set'}
                                      size="small"
                                      sx={{ bgcolor: '#F1F5F9', color: '#334155', fontWeight: 600, fontSize: '0.7rem' }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* TAB 1: WORKSHOP LAB & EQUIPMENT */}
                  {brochureTab === 1 && (
                    <Box>
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: theme.primary }}>
                          State-of-the-Art Training Laboratory &amp; Tool Guarantee
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Global Era guarantees individual tool sets and dedicated machines for every student during practical sessions.
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        {theme.facilities.map((fac, idx) => (
                          <Grid item xs={12} sm={6} key={idx}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: 2.5,
                                bgcolor: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                border: '1px solid #E2E8F0',
                                height: '100%'
                              }}
                            >
                              <Avatar sx={{ bgcolor: theme.cardBg, color: theme.primary, width: 36, height: 36 }}>
                                <CheckCircleOutlineIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                                  {fac}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                                  Individual trainee access • Fully maintained to industry safety standards
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Lab Standard Assurance Box */}
                      <Box sx={{ mt: 3, p: 2.5, bgcolor: '#ECFDF5', borderRadius: 3, border: '1px solid #A7F3D0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#065F46', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VerifiedIcon fontSize="small" />
                          Institutional Hygiene &amp; Electrical Safety Standard
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#047857', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                          All practical labs are equipped with power backups, emergency first aid facilities, ergonomic lighting, and sanitization protocols compliant with CTEVT workshop standards.
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* TAB 2: 2-HOUR SHIFT SYSTEM */}
                  {brochureTab === 2 && (
                    <Box>
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: theme.primary }}>
                          Flexible 2-Hour Daily Shift Schedule (Shifts A – E + Weekend)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Choose any convenient 2-hour daily time slot that fits your lifestyle, job, or morning college routine.
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        {shiftMatrix.map((s, idx) => (
                          <Grid item xs={12} sm={6} md={4} key={idx}>
                            <Card
                              elevation={0}
                              sx={{
                                p: 2.2,
                                borderRadius: 3,
                                border: '1.5px solid #E2E8F0',
                                bgcolor: '#FFFFFF',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Chip
                                    label={s.shift}
                                    size="small"
                                    sx={{ bgcolor: theme.cardBg, color: theme.primary, fontWeight: 900, fontSize: '0.72rem' }}
                                  />
                                  <Chip
                                    label="Enrolling"
                                    size="small"
                                    sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.66rem', height: 20 }}
                                  />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A', my: 0.3 }}>
                                  {s.time}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primary, display: 'block' }}>
                                  {s.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.8, fontSize: '0.74rem' }}>
                                  {s.focus}
                                </Typography>
                              </Box>
                              <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                                  Capacity: 15 Seats
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                                  ✓ Seats Open
                                </Typography>
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* TAB 3: CAREER & OJT PLACEMENT */}
                  {brochureTab === 3 && (
                    <Box>
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: theme.primary }}>
                          Guaranteed On-the-Job Training (OJT) &amp; Career Opportunities
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Every graduate completes mandatory practical OJT and receives direct placement interviews through our Employer Network.
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        {theme.careers.map((c, idx) => (
                          <Grid item xs={12} sm={6} key={idx}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2.2,
                                borderRadius: 3,
                                bgcolor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                height: '100%'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Avatar sx={{ bgcolor: theme.cardBg, color: theme.primary, width: 34, height: 34 }}>
                                  <WorkIcon fontSize="small" />
                                </Avatar>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                                  {c.title}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                {c.text}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Employer Portal Network Highlight */}
                      <Box sx={{ mt: 3, p: 2.5, bgcolor: '#F0F9FF', borderRadius: 3, border: '1px solid #BAE6FD' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon fontSize="small" />
                          Direct Hiring Through Global Era Employer Portal
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0284C7', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                          Over 45+ registered beauty salons, fashion design studios, and healthcare homes in Kathmandu and overseas partner agencies use our portal to hire certified graduates directly.
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* TAB 4: TRANSPARENT FEE & INSTALLMENTS */}
                  {brochureTab === 4 && (
                    <Box>
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: theme.primary }}>
                          Transparent Fee Schedule &amp; Affordable 2-Installment Guarantee
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Inclusive of Government 13% VAT, practice consumable kits, CTEVT examination fees, and graduation certificates.
                        </Typography>
                      </Box>

                      <Grid container spacing={3}>
                        {/* Left: 2 Installment Steps */}
                        <Grid item xs={12} sm={6}>
                          <Card
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              border: '1.5px solid #BBF7D0',
                              bgcolor: '#F0FDF4',
                              height: '100%'
                            }}
                          >
                            <Chip
                              label="PAYMENT PLAN 1 • 50% ENROLLMENT"
                              size="small"
                              sx={{ bgcolor: '#059669', color: '#FFFFFF', fontWeight: 900, fontSize: '0.68rem', mb: 1.5 }}
                            />
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#065F46', mb: 0.5 }}>
                              NPR {(feeCalc.installment1 || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#047857', display: 'block', fontWeight: 700, mb: 1 }}>
                              Paid upon Admission &amp; Workstation Booking
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#166534', display: 'block', lineHeight: 1.4 }}>
                              Secures your shift seat, includes personal starter practice tool kit, lab uniform apron, and student log book.
                            </Typography>
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Card
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              border: '1.5px solid #BAE6FD',
                              bgcolor: '#F0F9FF',
                              height: '100%'
                            }}
                          >
                            <Chip
                              label="PAYMENT PLAN 2 • 50% MID-COURSE"
                              size="small"
                              sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 900, fontSize: '0.68rem', mb: 1.5 }}
                            />
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#075985', mb: 0.5 }}>
                              NPR {(feeCalc.installment2 || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#0369A1', display: 'block', fontWeight: 700, mb: 1 }}>
                              Paid at Mid-Course (Day 30–35) Before OJT Dispatch
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#0C4A6E', display: 'block', lineHeight: 1.4 }}>
                              Covers advanced modules, CTEVT national competency assessment, OJT internship placement, and graduation certificate dispatch.
                            </Typography>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Fee Breakdown Table */}
                      <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2.5, bgcolor: '#FFFFFF' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', mb: 1 }}>
                          Statutory Tax-Compliant Fee Audit Breakdown
                        </Typography>
                        <Stack spacing={0.8} sx={{ fontSize: '0.8rem', color: '#475569' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Base Tuition Fee (Theory + Practical Hours):</span>
                            <b>NPR {(feeCalc.basePrice || 0).toLocaleString()}</b>
                          </Box>
                          {(feeCalc.discountPercent || 0) > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                              <span>Campaign Merit Scholarship ({feeCalc.discountPercent}%):</span>
                              <b>(-) NPR {(feeCalc.discountAmount || 0).toLocaleString()}</b>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Official Registration &amp; Examination Charge:</span>
                            <b>(+) NPR {(feeCalc.admissionFee || 0).toLocaleString()}</b>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 700 }}>
                            <span>Government Value Added Tax (13% VAT):</span>
                            <b>(+) NPR {(feeCalc.vatAmount || 0).toLocaleString()}</b>
                          </Box>
                          <Divider />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#059669', fontWeight: 900 }}>
                            <span>Total Final Net Effective Fee:</span>
                            <span>NPR {(feeCalc.totalEffectiveFee || 0).toLocaleString()}</span>
                          </Box>
                        </Stack>
                      </Paper>
                    </Box>
                  )}

                  {/* 5. OFFICIAL SIGNATURES & ACCREDITATION FOOTER */}
                  <Box sx={{ mt: 3.5, pt: 2.5, borderTop: '1px dashed #CBD5E1' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0F172A' }}>
                          Curriculum Department
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                          Global Era Technical School
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0F172A' }}>
                          Lead Technical Trainer
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                          Trade Instructor
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0F172A' }}>
                          Principal / Director
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                          Official Accreditation Stamp
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </DialogContent>

                {/* 6. BOTTOM DIALOG ACTIONS */}
                <DialogActions sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    onClick={() => setSelectedSyllabusCourse(null)}
                    sx={{ fontWeight: 700, color: '#64748B' }}
                  >
                    Close Brochure
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      const cId = selectedSyllabusCourse.id;
                      setSelectedSyllabusCourse(null);
                      handleSelectCourseForInquiry(cId);
                    }}
                    sx={{
                      bgcolor: '#059669',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                      '&:hover': { bgcolor: '#047857' }
                    }}
                  >
                    Apply for this Course Now
                  </Button>
                </DialogActions>
              </>
            );
          })()}
        </Dialog>
      )}
    </Box>
  );
}
