import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  Divider,
  Snackbar
} from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageIcon from '@mui/icons-material/Language';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import VerifiedIcon from '@mui/icons-material/Verified';
import confetti from 'canvas-confetti';

import { useAuth } from '../../context/AuthContext';
import { loadDB, saveDB } from '../../services/storage';

export default function AgentPortal({ onLogout, onGoHome }) {
  const { currentUser } = useAuth();
  const [db, setDb] = useState(loadDB());
  const company = db.settings?.companyProfile || {};

  // Identify Current Agent Profile
  const agent = useMemo(() => {
    const list = db.agents || [];
    if (currentUser?.agentId) {
      return list.find((a) => a.id === currentUser.agentId || a.code === currentUser.agentCode) || list[0];
    }
    if (currentUser?.agentCode) {
      return list.find((a) => a.code === currentUser.agentCode) || list[0];
    }
    return list[0] || {
      id: 'AGT-01',
      code: 'AGE-101',
      name: currentUser?.name || 'Authorized Referral Agent',
      phone: currentUser?.phone || '9841000000',
      commissionType: 'FIXED',
      defaultRate: 1000,
      paymentInfo: 'eSewa: 9841000000'
    };
  }, [db.agents, currentUser]);

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('ALL');

  // Modal States
  const [openAddLeadModal, setOpenAddLeadModal] = useState(false);
  const [openEditPaymentModal, setOpenEditPaymentModal] = useState(false);
  const [paymentInfoDraft, setPaymentInfoDraft] = useState(agent?.paymentInfo || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Referral Link
  const referralLink = `${window.location.origin}/?ref=${agent?.code || 'AGE-101'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast('Your referral link has been copied to the clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = `Hello! I am an official referral representative of Global Era Technical School (CTEVT Affiliated). Fill out the form via this link for admission and discounts on various job-oriented skill and technical training courses: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Form state for adding new lead
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    courseId: db.courses?.[0]?.id || '',
    address: '',
    priority: 'High',
    notes: ''
  });

  // Calculate Agent's Leads
  const myLeads = useMemo(() => {
    const all = db.leads || [];
    return all.filter((l) => {
      const matchAgentId = l.agentId && (l.agentId === agent?.id || l.agentId === agent?.code);
      const matchAgentCode = l.agentCode && l.agentCode.toLowerCase() === (agent?.code || '').toLowerCase();
      const matchSource = l.source && (l.source.includes(agent?.code || 'NOMATCH') || l.source.includes(agent?.name || 'NOMATCH'));
      return matchAgentId || matchAgentCode || matchSource;
    });
  }, [db.leads, agent]);

  // Filtered Leads for Table
  const filteredLeads = useMemo(() => {
    return myLeads.filter((l) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.name?.toLowerCase().includes(q);
        const matchPhone = l.phone?.includes(q);
        const matchCourse = (l.course || l.courseTitle)?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCourse) return false;
      }
      if (filterStage !== 'ALL') {
        if (filterStage === 'CONVERTED' && l.stage !== 'Converted') return false;
        if (filterStage === 'PENDING' && l.stage === 'Converted') return false;
      }
      return true;
    });
  }, [myLeads, searchQuery, filterStage]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalLeads = myLeads.length;
    const convertedLeads = myLeads.filter((l) => l.stage === 'Converted');
    const inProgressLeads = myLeads.filter((l) => l.stage !== 'Converted' && l.stage !== 'Dropped');

    // Commission calculations:
    let totalEarned = 0;
    let pendingPayout = 0;
    let paidOut = 0;

    convertedLeads.forEach((l) => {
      let amount = l.commissionAmount;
      if (!amount || amount === 0) {
        if (agent?.commissionType === 'PERCENTAGE') {
          const courseFee = l.price || 15000;
          amount = Math.round((courseFee * (agent.defaultRate || 10)) / 100);
        } else {
          amount = agent?.defaultRate || 1000;
        }
      }

      totalEarned += amount;
      if (l.commissionStatus === 'paid') {
        paidOut += amount;
      } else {
        pendingPayout += amount;
      }
    });

    return {
      totalLeads,
      convertedCount: convertedLeads.length,
      inProgressCount: inProgressLeads.length,
      totalEarned,
      pendingPayout,
      paidOut
    };
  }, [myLeads, agent]);

  // Submit New Lead
  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      alert('Please enter both the student name and phone number.');
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

    const chosenCourse = (db.courses || []).find((c) => c.id === leadForm.courseId);

    // Potential commission calculation
    let potentialComm = agent?.defaultRate || 1000;
    if (agent?.commissionType === 'PERCENTAGE') {
      const price = chosenCourse?.price || 15000;
      potentialComm = Math.round((price * (agent.defaultRate || 10)) / 100);
    }

    const newLead = {
      id: newId,
      name: leadForm.name.trim(),
      phone: leadForm.phone.trim(),
      address: leadForm.address.trim() || 'Kathmandu',
      subject: chosenCourse?.title || 'Vocational Training',
      course: chosenCourse?.title || 'Vocational Training',
      courseId: chosenCourse?.id,
      price: chosenCourse?.price || 15000,
      duration: `${chosenCourse?.durationValue || 3} ${chosenCourse?.durationUnit || 'Months'}`,
      source: `Agent Referral (${agent.name} - ${agent.code})`,
      agentId: agent.id,
      agentCode: agent.code,
      agentName: agent.name,
      priority: leadForm.priority,
      stage: 'New Lead',
      commissionType: agent.commissionType,
      commissionRate: agent.defaultRate,
      potentialCommission: potentialComm,
      commissionAmount: potentialComm,
      commissionStatus: 'pending',
      notes: leadForm.notes || 'Student referred from Agent Dashboard.',
      timeline: [
        {
          date: new Date().toISOString(),
          note: `New lead registered via Agent Portal: ${agent.name} (${agent.code})`,
          staffName: 'Agent Portal'
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

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    showToast(`Successfully referred new student (${newLead.name})!`);
    setOpenAddLeadModal(false);
    setLeadForm({
      name: '',
      phone: '',
      courseId: db.courses?.[0]?.id || '',
      address: '',
      priority: 'High',
      notes: ''
    });
  };

  // Update Agent's Payment Receiving Info
  const handleSavePaymentInfo = () => {
    const updatedAgents = (db.agents || []).map((a) => {
      if (a.id === agent.id || a.code === agent.code) {
        return { ...a, paymentInfo: paymentInfoDraft };
      }
      return a;
    });

    const nextDb = { ...db, agents: updatedAgents };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenEditPaymentModal(false);
    showToast('Payment receiving details updated successfully.');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
      {/* Top Header Bar */}
      <Box
        sx={{
          bgcolor: '#0B2545',
          color: '#FFFFFF',
          py: 2.5,
          px: { xs: 2, sm: 4 },
          borderBottom: '4px solid #F59E0B',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        <Box sx={{ maxWidth: '1440px', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          {/* Brand & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#F59E0B',
                color: '#0B2545',
                width: 48,
                height: 48,
                fontWeight: 900
              }}
            >
              <HandshakeIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                  {company.companyNameEnglish || 'GLOBAL ERA TECHNICAL SCHOOL'}
                </Typography>
                <Chip
                  label="Referral Partner Portal (Agent Portal)"
                  size="small"
                  sx={{ bgcolor: 'rgba(245, 158, 11, 0.25)', color: '#FDE68A', fontWeight: 800, fontSize: '0.75rem' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'block', mt: 0.3 }}>
                CTEVT Affiliation No: {company.ctevtCode || '4208'} • Official Student Referral & Commission System
              </Typography>
            </Box>
          </Box>

          {/* Agent Profile & Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                {agent?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 700 }}>
                Agent Code: {agent?.code} • {agent?.phone}
              </Typography>
            </Box>

            {onGoHome && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<LanguageIcon />}
                onClick={onGoHome}
                sx={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderRadius: 2,
                  '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' }
                }}
              >
                Website
              </Button>
            )}

            {onLogout && (
              <Button
                variant="contained"
                size="small"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={onLogout}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  borderRadius: 2,
                  boxShadow: 'none'
                }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main Container */}
      <Box sx={{ maxWidth: '1440px', mx: 'auto', p: { xs: 2, sm: 3 } }}>
        {/* Referral Link & Share Center Banner */}
        <Card
          sx={{
            mb: 3.5,
            borderRadius: 3.5,
            background: 'linear-gradient(135deg, #0F2E5A 0%, #1E3A8A 60%, #172554 100%)',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 46, 90, 0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Chip
                    icon={<VerifiedIcon sx={{ fill: '#10B981 !important' }} />}
                    label="Your Official Referral Link"
                    size="small"
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontWeight: 800 }}
                  />
                  <Chip
                    label={`Commission: ${agent?.commissionType === 'PERCENTAGE' ? `${agent?.defaultRate}% per admission` : `NPR ${Number(agent?.defaultRate || 1000).toLocaleString()} per admission`}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.25)', color: '#FCD34D', fontWeight: 800 }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Share this link with students and earn a commission upon their admission!
                </Typography>
                <Typography variant="body2" sx={{ color: '#E2E8F0', mb: 2 }}>
                  As soon as a student opens this link and submits an online inquiry or admission form, the lead is automatically registered under your account and your commission is approved once they enroll at the institute.
                </Typography>

                {/* Link Box */}
                <Paper
                  sx={{
                    p: 1,
                    pl: 2,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(0,0,0,0.3)',
                    borderRadius: 2.5,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      color: '#FDE68A',
                      fontWeight: 700,
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {referralLink}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyLink}
                    sx={{
                      bgcolor: copiedLink ? '#10B981' : '#F59E0B',
                      color: copiedLink ? '#FFFFFF' : '#0B2545',
                      fontWeight: 800,
                      ml: 1.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: copiedLink ? '#059669' : '#D97706' }
                    }}
                  >
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Stack spacing={1.5} sx={{ pl: { md: 2 } }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<WhatsAppIcon sx={{ fontSize: 26 }} />}
                    onClick={handleShareWhatsApp}
                    sx={{
                      bgcolor: '#25D366',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      borderRadius: 2.5,
                      py: 1.3,
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                      '&:hover': { bgcolor: '#1EBE5D' }
                    }}
                  >
                    Send to Student on WhatsApp
                  </Button>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<AddIcon sx={{ fontSize: 26 }} />}
                    onClick={() => setOpenAddLeadModal(true)}
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: '#0B2545',
                      fontWeight: 900,
                      borderRadius: 2.5,
                      py: 1.3,
                      fontSize: '0.95rem',
                      '&:hover': { bgcolor: '#F1F5F9' }
                    }}
                  >
                    + Register New Student Lead Directly
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* KPI Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {/* Card 1: Total Leads */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    Total Referred Leads
                  </Typography>
                  <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 38, height: 38 }}>
                    <PeopleAltIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>
                  {stats.totalLeads}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                  All students registered by you
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: In Progress */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    Counseling / Follow-up
                  </Typography>
                  <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 38, height: 38 }}>
                    <AccessTimeIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706' }}>
                  {stats.inProgressCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                  In active discussion at institute
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Converted */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    Converted Admissions
                  </Typography>
                  <Avatar sx={{ bgcolor: '#ECFDF5', color: '#059669', width: 38, height: 38 }}>
                    <CheckCircleIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669' }}>
                  {stats.convertedCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  Successfully enrolled students
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Total Commission Earned */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    Total Commission Earned
                  </Typography>
                  <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', width: 38, height: 38 }}>
                    <MonetizationOnIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#4F46E5' }}>
                  NPR {stats.totalEarned.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                  Total earnings from admissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 5: Pending Payout */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', bgcolor: stats.pendingPayout > 0 ? '#FFFBEB' : '#FFFFFF' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>
                    Pending Payout
                  </Typography>
                  <Avatar sx={{ bgcolor: '#FEF3C7', color: '#B45309', width: 38, height: 38 }}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#B45309' }}>
                  NPR {stats.pendingPayout.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  Payout processing by admin
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Paper sx={{ borderRadius: 3, mb: 3, p: 0.5, border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 800,
                fontSize: '0.92rem',
                minHeight: 48,
                textTransform: 'none'
              }
            }}
          >
            <Tab icon={<PeopleAltIcon />} iconPosition="start" label={`My Referred Students (${myLeads.length})`} />
            <Tab icon={<MonetizationOnIcon />} iconPosition="start" label="Commission & Payouts" />
            <Tab icon={<SchoolIcon />} iconPosition="start" label="Institute Training Courses & Fees" />
          </Tabs>
        </Paper>

        {/* TAB 0: REFERRED LEADS TABLE */}
        {activeTab === 0 && (
          <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Table Toolbar */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Search by student name, phone, or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{ minWidth: { xs: '100%', sm: 320 } }}
                  />

                  <Stack direction="row" spacing={1}>
                    <Chip
                      label="All"
                      clickable
                      color={filterStage === 'ALL' ? 'primary' : 'default'}
                      onClick={() => setFilterStage('ALL')}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip
                      label="Admitted"
                      clickable
                      color={filterStage === 'CONVERTED' ? 'success' : 'default'}
                      onClick={() => setFilterStage('CONVERTED')}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip
                      label="In Progress"
                      clickable
                      color={filterStage === 'PENDING' ? 'warning' : 'default'}
                      onClick={() => setFilterStage('PENDING')}
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddLeadModal(true)}
                  sx={{
                    bgcolor: '#0B2545',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    borderRadius: 2,
                    px: 2.5,
                    '&:hover': { bgcolor: '#133E68' }
                  }}
                >
                  + Register New Lead
                </Button>
              </Box>

              {/* Leads Table */}
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Date / ID</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Contact Number</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Interested Course</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Institute Status</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Commission Status</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                          <PeopleAltIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#64748B' }}>
                            No leads found.
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
                            Click the button above to refer a new student or share your referral link.
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenAddLeadModal(true)}
                            sx={{ fontWeight: 800 }}
                          >
                            + Add New Student Lead
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((item) => {
                        const isConverted = item.stage === 'Converted';
                        const commAmt = item.commissionAmount || (agent.commissionType === 'PERCENTAGE' ? Math.round(((item.price || 15000) * (agent.defaultRate || 10)) / 100) : (agent.defaultRate || 1000));

                        return (
                          <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                                {item.id}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : 'Today'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnIcon sx={{ fontSize: 13 }} /> {item.address || 'Kathmandu'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                  {item.phone}
                                </Typography>
                                <IconButton
                                  size="small"
                                  color="success"
                                  component="a"
                                  href={`https://wa.me/977${item.phone?.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  sx={{ p: 0.5 }}
                                >
                                  <WhatsAppIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                                {item.course || item.subject || 'Vocational Training'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Fee: NPR {Number(item.price || 15000).toLocaleString()}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              {isConverted ? (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Admitted"
                                  size="small"
                                  color="success"
                                  sx={{ fontWeight: 800 }}
                                />
                              ) : item.stage === 'Contacted' ? (
                                <Chip label="Contacted" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800 }} />
                              ) : item.stage === 'Interested' ? (
                                <Chip label="Interested" size="small" sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 800 }} />
                              ) : (
                                <Chip label="New Inquiry" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800 }} />
                              )}
                            </TableCell>

                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isConverted ? '#059669' : '#64748B' }}>
                                  NPR {commAmt.toLocaleString()}
                                </Typography>
                                {isConverted ? (
                                  item.commissionStatus === 'paid' ? (
                                    <Chip label="Paid" size="small" color="primary" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 800 }} />
                                  ) : (
                                    <Chip label="Approved" size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 800 }} />
                                  )
                                ) : (
                                  <Chip label="Payable on Admission" size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700 }} />
                                )}
                              </Box>
                            </TableCell>

                            <TableCell sx={{ maxWidth: 220 }}>
                              <Typography variant="caption" sx={{ color: '#475569', display: 'block', whiteSpace: 'normal' }}>
                                {item.notes || '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* TAB 1: COMMISSION & PAYOUTS */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Left: Payout Account Settings */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      💳 Payout Receiving Account
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenEditPaymentModal(true)} sx={{ color: '#0F2E5A' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0', mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Current eSewa / Bank Details:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {agent?.paymentInfo || 'Details not provided (eSewa / Khalti / Bank)'}
                    </Typography>
                  </Paper>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setPaymentInfoDraft(agent?.paymentInfo || '');
                      setOpenEditPaymentModal(true);
                    }}
                    sx={{ fontWeight: 800, borderRadius: 2 }}
                  >
                    Update Payout Account
                  </Button>
                </CardContent>
              </Card>

              {/* Commission Policy Card */}
              <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', bgcolor: '#F0FDF4' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon sx={{ color: '#166534' }} /> Commission & Payout Policy
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#14532D', mb: 1.5, lineHeight: 1.6 }}>
                    • Commission is automatically <b>Approved</b> as soon as each referred student attends the institute and pays the admission fee.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#14532D', mb: 1.5, lineHeight: 1.6 }}>
                    • Approved commission amounts are transferred weekly or within 24 hours of admission to your <b>eSewa, Khalti, or Bank Account</b>.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#14532D', lineHeight: 1.6 }}>
                    • For any assistance, you can contact the college administration directly at <b>{company.phone || '9851000000'}</b>.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Right: Converted Leads Earning Breakdown */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F2E5A', mb: 2 }}>
                    💰 Earnings Breakdown
                  </Typography>

                  {myLeads.filter((l) => l.stage === 'Converted').length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px dashed #CBD5E1' }}>
                      <MonetizationOnIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B' }}>
                        No student admissions completed yet.
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Once your referred students enroll, the list will appear here.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {myLeads
                        .filter((l) => l.stage === 'Converted')
                        .map((item) => {
                          const commAmt = item.commissionAmount || (agent.commissionType === 'PERCENTAGE' ? Math.round(((item.price || 15000) * (agent.defaultRate || 10)) / 100) : (agent.defaultRate || 1000));
                          const isPaid = item.commissionStatus === 'paid';

                          return (
                            <Paper
                              key={item.id}
                              sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 2
                              }}
                            >
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                  {item.name} ({item.course || item.subject})
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>
                                  Admission ID: {item.id} • Phone: {item.phone}
                                </Typography>
                              </Box>

                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#059669' }}>
                                  + NPR {commAmt.toLocaleString()}
                                </Typography>
                                <Chip
                                  label={isPaid ? 'Paid' : 'Pending Payout'}
                                  size="small"
                                  color={isPaid ? 'primary' : 'warning'}
                                  sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                                />
                              </Box>
                            </Paper>
                          );
                        })}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: COURSE CATALOG FOR AGENT'S REFERENCE */}
        {activeTab === 2 && (
          <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3.5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F2E5A', mb: 1 }}>
                📚 Official Courses at Global Era Technical School
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                Share the duration, fees, and curriculum details of these courses when advising prospective students:
              </Typography>

              <Grid container spacing={2.5}>
                {(db.courses || []).map((crs) => (
                  <Grid item xs={12} sm={6} md={4} key={crs.id}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                        <Chip label={crs.level || 'Level 1'} size="small" color="primary" sx={{ fontWeight: 800, mb: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                          {crs.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                          Duration: {crs.durationValue} {crs.durationUnit} ({crs.totalHours} Hours)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', mb: 2, fontSize: '0.82rem' }}>
                          {crs.description || 'Practical skills and job-oriented vocational training.'}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                            Course Fee:
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                            NPR {Number(crs.price || 15000).toLocaleString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* MODAL: ADD STUDENT LEAD */}
      <Dialog
        open={openAddLeadModal}
        onClose={() => setOpenAddLeadModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1 }
        }}
      >
        <form onSubmit={handleCreateLead}>
          <DialogTitle sx={{ fontWeight: 900, color: '#0F2E5A', pb: 1 }}>
            + Refer a Student
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 600 }}>
                Your Agent Code <b>{agent?.code}</b> will be automatically attached to this lead. Commission will be credited to your account upon student enrollment.
              </Alert>

              <TextField
                required
                fullWidth
                label="Student Full Name"
                placeholder="e.g., Subash Karki"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              />

              <TextField
                required
                fullWidth
                label="Mobile / WhatsApp Number (10 Digits)"
                placeholder="e.g., 9841234567"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#94A3B8' }} /></InputAdornment>
                }}
              />

              <TextField
                select
                fullWidth
                label="Interested Course"
                value={leadForm.courseId}
                onChange={(e) => setLeadForm({ ...leadForm, courseId: e.target.value })}
              >
                {(db.courses || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.title} — NPR {Number(c.price || 15000).toLocaleString()}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Address / City"
                placeholder="e.g., Jorpati, Kathmandu"
                value={leadForm.address}
                onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#94A3B8' }} /></InputAdornment>
                }}
              />

              <TextField
                select
                fullWidth
                label="Priority"
                value={leadForm.priority}
                onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value })}
              >
                <MenuItem value="High">High (Ready to enroll immediately)</MenuItem>
                <MenuItem value="Medium">Medium (General inquiry)</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={2.5}
                label="Notes / Background"
                placeholder="e.g., Prefers morning shift, friend's brother, interested in Caregiver course for abroad..."
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenAddLeadModal(false)} sx={{ fontWeight: 700, color: '#64748B' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#0B2545',
                color: '#FFFFFF',
                fontWeight: 800,
                px: 3,
                borderRadius: 2,
                '&:hover': { bgcolor: '#133E68' }
              }}
            >
              Save Student Lead
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MODAL: EDIT PAYMENT INFO */}
      <Dialog
        open={openEditPaymentModal}
        onClose={() => setOpenEditPaymentModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#0F2E5A' }}>
          Update Payout Account
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Enter your eSewa ID, Khalti, or Bank details (Account Number and Bank Name) to receive commission payouts:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Payment Info"
              value={paymentInfoDraft}
              onChange={(e) => setPaymentInfoDraft(e.target.value)}
              placeholder="e.g., eSewa: 9841234567 or Nabil Bank: 0192837465, Ramesh Shrestha"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditPaymentModal(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSavePaymentInfo} sx={{ fontWeight: 800, bgcolor: '#0B2545' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ fontWeight: 700, borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
