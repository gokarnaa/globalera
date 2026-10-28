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
    showToast('तपाईंको रेफ़रल लिङ्क क्लिपबोर्डमा कपी भयो! (Referral Link Copied)');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = `नमस्ते! म ग्लोबल एरा प्राविधिक स्कुल (CTEVT सम्बन्धन) को आधिकारिक रेफ़रल प्रतिनिधि हुँ। विभिन्न रोजगारमूलक सीप तथा प्राविधिक तालिम कोर्सहरूमा भर्ना तथा छुटको लागि यो लिंकबाट फारम भर्नुहोस्: ${referralLink}`;
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
      alert('कृपया विद्यार्थीको नाम र फोन नम्बर अनिवार्य भर्नुहोस्।');
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
      address: leadForm.address.trim() || 'काठमाडौं',
      subject: chosenCourse?.title || 'व्यावसायिक तालिम',
      course: chosenCourse?.title || 'व्यावसायिक तालिम',
      courseId: chosenCourse?.id,
      price: chosenCourse?.price || 15000,
      duration: `${chosenCourse?.durationValue || 3} ${chosenCourse?.durationUnit || 'Months'}`,
      source: `एजेन्ट रेफ़रल (${agent.name} - ${agent.code})`,
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
      notes: leadForm.notes || 'एजेन्ट ड्यासबोर्डबाट सिफारिस गरिएको विद्यार्थी।',
      timeline: [
        {
          date: new Date().toISOString(),
          note: `एजेन्ट पोर्टलबाट नयाँ लिड दर्ता: ${agent.name} (${agent.code})`,
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

    showToast(`सफलतापूर्वक नयाँ विद्यार्थी (${newLead.name}) सिफारिस गरियो!`);
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
    showToast('भुक्तानी प्राप्त गर्ने विवरण अद्यावधिक भयो।');
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
                  label="रेफ़रल पार्टनर पोर्टल (Agent Portal)"
                  size="small"
                  sx={{ bgcolor: 'rgba(245, 158, 11, 0.25)', color: '#FDE68A', fontWeight: 800, fontSize: '0.75rem' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'block', mt: 0.3 }}>
                CTEVT सम्बन्धन नं: {company.ctevtCode || '4208'} • आधिकारिक विद्यार्थी सिफारिस तथा कमिसन प्रणाली
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
                एजेन्ट कोड: {agent?.code} • {agent?.phone}
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
                वेबसाइट
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
                लगआउट
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
                    label="तपाईंको आधिकारिक रेफ़रल लिङ्क (Your Referral Link)"
                    size="small"
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontWeight: 800 }}
                  />
                  <Chip
                    label={`कमिसन: ${agent?.commissionType === 'PERCENTAGE' ? `${agent?.defaultRate}% प्रति भर्ना` : `रु. ${Number(agent?.defaultRate || 1000).toLocaleString('ne-NP')} प्रति भर्ना`}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.25)', color: '#FCD34D', fontWeight: 800 }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  यो लिङ्क विद्यार्थीलाई सेयर गर्नुहोस् र भर्ना हुँदा कमिसन प्राप्त गर्नुहोस्!
                </Typography>
                <Typography variant="body2" sx={{ color: '#E2E8F0', mb: 2 }}>
                  विद्यार्थीले यो लिङ्क खोलेर अनलाइन सोधपुछ वा भर्ना फारम भर्नासाथ, त्यो लिड स्वतः तपाईंको खातामा दर्ता हुनेछ र इन्स्टिच्युटमा भर्ना हुनासाथ तपाईंको कमिसन स्वीकृत हुनेछ।
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
                    {copiedLink ? 'कपी भयो!' : 'लिङ्क कपी'}
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
                    ह्वाट्सएपमा विद्यार्थीलाई पठाउनुहोस्
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
                    + नयाँ विद्यार्थी लिड सिधै दर्ता गर्नुहोस्
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
                    कुल सिफारिस लिड
                  </Typography>
                  <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 38, height: 38 }}>
                    <PeopleAltIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>
                  {stats.totalLeads}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                  तपाईंले दर्ता गर्नुभएका सबै विद्यार्थी
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
                    काउन्सिलिङ / फलोअप
                  </Typography>
                  <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 38, height: 38 }}>
                    <AccessTimeIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706' }}>
                  {stats.inProgressCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                  इन्स्टिच्युटमा कुराकानी चलिरहेका
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
                    सफल भर्ना (Converted)
                  </Typography>
                  <Avatar sx={{ bgcolor: '#ECFDF5', color: '#059669', width: 38, height: 38 }}>
                    <CheckCircleIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669' }}>
                  {stats.convertedCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  भर्ना सम्पन्न भएका विद्यार्थी
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
                    कुल आर्जित कमिसन
                  </Typography>
                  <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', width: 38, height: 38 }}>
                    <MonetizationOnIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#4F46E5' }}>
                  रु. {stats.totalEarned.toLocaleString('ne-NP')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                  भर्नाबाट बनेको कुल आम्दानी
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
                    भुक्तानी पाउन बाँकी
                  </Typography>
                  <Avatar sx={{ bgcolor: '#FEF3C7', color: '#B45309', width: 38, height: 38 }}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#B45309' }}>
                  रु. {stats.pendingPayout.toLocaleString('ne-NP')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  एडमिनबाट भुक्तानी प्रक्रियामा
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
            <Tab icon={<PeopleAltIcon />} iconPosition="start" label={`मेरा सिफारिस विद्यार्थीहरू (${myLeads.length})`} />
            <Tab icon={<MonetizationOnIcon />} iconPosition="start" label="कमिसन तथा भुक्तानी विवरण (Payouts)" />
            <Tab icon={<SchoolIcon />} iconPosition="start" label="इन्स्टिच्युट तालिम कोर्सहरू र शुल्क" />
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
                    placeholder="विद्यार्थीको नाम, फोन वा कोर्स खोज्नुहोस्..."
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
                      label="सबै (All)"
                      clickable
                      color={filterStage === 'ALL' ? 'primary' : 'default'}
                      onClick={() => setFilterStage('ALL')}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip
                      label="भर्ना सम्पन्न (Admitted)"
                      clickable
                      color={filterStage === 'CONVERTED' ? 'success' : 'default'}
                      onClick={() => setFilterStage('CONVERTED')}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip
                      label="प्रक्रियामा (In Progress)"
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
                  + नयाँ लिड दर्ता गर्नुहोस्
                </Button>
              </Box>

              {/* Leads Table */}
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>मिति / ID</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>विद्यार्थीको नाम</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>सम्पर्क नम्बर</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>इच्छाएको कोर्स</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>इन्स्टिच्युट अवस्था (Status)</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>कमिसन स्थिति</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>कैफियत (Notes)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                          <PeopleAltIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#64748B' }}>
                            कुनै पनि लिड फेला परेन।
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
                            नयाँ विद्यार्थी सिफारिस गर्न माथिको बटन थिच्नुहोस् वा आफ्नो रेफ़रल लिङ्क सेयर गर्नुहोस्।
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenAddLeadModal(true)}
                            sx={{ fontWeight: 800 }}
                          >
                            + नयाँ विद्यार्थी लिड थप्नुहोस्
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
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ne-NP') : 'आज'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnIcon sx={{ fontSize: 13 }} /> {item.address || 'काठमाडौं'}
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
                                {item.course || item.subject || 'व्यावसायिक तालिम'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                शुल्क: रु. {Number(item.price || 15000).toLocaleString('ne-NP')}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              {isConverted ? (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="भर्ना सम्पन्न (Admitted)"
                                  size="small"
                                  color="success"
                                  sx={{ fontWeight: 800 }}
                                />
                              ) : item.stage === 'Contacted' ? (
                                <Chip label="सम्पर्कमा (Contacted)" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800 }} />
                              ) : item.stage === 'Interested' ? (
                                <Chip label="इच्छुक (Interested)" size="small" sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 800 }} />
                              ) : (
                                <Chip label="नयाँ सोधपुछ (New)" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800 }} />
                              )}
                            </TableCell>

                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isConverted ? '#059669' : '#64748B' }}>
                                  रु. {commAmt.toLocaleString('ne-NP')}
                                </Typography>
                                {isConverted ? (
                                  item.commissionStatus === 'paid' ? (
                                    <Chip label="भुक्तानी भयो (Paid)" size="small" color="primary" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 800 }} />
                                  ) : (
                                    <Chip label="स्वीकृत (Approved)" size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem', height: 20, fontWeight: 800 }} />
                                  )
                                ) : (
                                  <Chip label="भर्नापछि प्राप्त हुने" size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700 }} />
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
                      💳 भुक्तानी प्राप्त गर्ने खाता
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenEditPaymentModal(true)} sx={{ color: '#0F2E5A' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0', mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      हालको eSewa / बैंक विवरण:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {agent?.paymentInfo || 'विवरण भरिएको छैन (eSewa / Khalti / Bank)'}
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
                    भुक्तानी खाता परिवर्तन गर्नुहोस्
                  </Button>
                </CardContent>
              </Card>

              {/* Commission Policy Card */}
              <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', bgcolor: '#F0FDF4' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon sx={{ color: '#166534' }} /> कमिसन तथा भुक्तानी नीति
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#14532D', mb: 1.5, lineHeight: 1.6 }}>
                    • प्रत्येक विद्यार्थी इन्स्टिच्युटमा उपस्थित भएर भर्ना शुल्क बुझाउनासाथ कमिसन स्वतः <b>स्वीकृत (Approved)</b> हुन्छ।
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#14532D', mb: 1.5, lineHeight: 1.6 }}>
                    • स्वीकृत कमिसन रकम प्रत्येक हप्ता वा भर्ना भएको २४ घण्टाभित्र तपाईंको <b>eSewa, Khalti वा बैंक खातामा</b> पठाइनेछ।
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#14532D', lineHeight: 1.6 }}>
                    • कुनै पनि समस्या परेमा सिधै कलेज प्रशासन फोन <b>{company.phone || '9851000000'}</b> मा सम्पर्क गर्न सक्नुहुन्छ।
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Right: Converted Leads Earning Breakdown */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F2E5A', mb: 2 }}>
                    💰 आर्जित कमिसन विवरण (Earnings Breakdown)
                  </Typography>

                  {myLeads.filter((l) => l.stage === 'Converted').length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px dashed #CBD5E1' }}>
                      <MonetizationOnIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B' }}>
                        अहिलेसम्म कुनै विद्यार्थी भर्ना सम्पन्न भएको छैन।
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        तपाईंले सिफारिस गरेका विद्यार्थीहरू भर्ना भएपछि यहाँ सूची देखिनेछ।
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
                                  भर्ना ID: {item.id} • फोन: {item.phone}
                                </Typography>
                              </Box>

                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#059669' }}>
                                  + रु. {commAmt.toLocaleString('ne-NP')}
                                </Typography>
                                <Chip
                                  label={isPaid ? 'भुक्तान भइसकेको' : 'भुक्तानी प्रक्रियामा (Pending)'}
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
                📚 ग्लोबल एरा प्राविधिक स्कुलका आधिकारिक कोर्सहरू
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                विद्यार्थीलाई सल्लाह दिँदा यी कोर्सहरूको अवधि, शुल्क र विषयवस्तुको जानकारी दिन सक्नुहुन्छ:
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
                          अवधि: {crs.durationValue} {crs.durationUnit} ({crs.totalHours} घण्टा)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', mb: 2, fontSize: '0.82rem' }}>
                          {crs.description || 'व्यावहारिक सीप र रोजगारीमूलक तालिम।'}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                            कोर्स शुल्क:
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                            रु. {Number(crs.price || 15000).toLocaleString('ne-NP')}
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
            + नयाँ विद्यार्थी सिफारिस गर्नुहोस् (Refer a Student)
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 600 }}>
                तपाईंको एजेन्ट कोड <b>{agent?.code}</b> यस लिडमा स्वतः संलग्न हुनेछ। विद्यार्थी भर्ना हुनासाथ कमिसन तपाईंको खातामा जम्मा हुनेछ।
              </Alert>

              <TextField
                required
                fullWidth
                label="विद्यार्थीको पूरा नाम (Full Name)"
                placeholder="उदा: सुवास कार्की"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              />

              <TextField
                required
                fullWidth
                label="मोबाइल / ह्वाट्सएप नम्बर (10 Digits)"
                placeholder="उदा: 9841234567"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#94A3B8' }} /></InputAdornment>
                }}
              />

              <TextField
                select
                fullWidth
                label="इच्छाएको कोर्स (Interested Course)"
                value={leadForm.courseId}
                onChange={(e) => setLeadForm({ ...leadForm, courseId: e.target.value })}
              >
                {(db.courses || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.title} — रु. {Number(c.price || 15000).toLocaleString('ne-NP')}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="ठेगाना / सहर (Address)"
                placeholder="उदा: जोरपाटी, काठमाडौं"
                value={leadForm.address}
                onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#94A3B8' }} /></InputAdornment>
                }}
              />

              <TextField
                select
                fullWidth
                label="प्राथमिकता (Priority)"
                value={leadForm.priority}
                onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value })}
              >
                <MenuItem value="High">उच्च (High - तुरुन्तै भर्ना हुन इच्छुक)</MenuItem>
                <MenuItem value="Medium">साधारण (Medium - बुझ्न चाहेको)</MenuItem>
                <MenuItem value="Urgent">अत्यन्तै जरुरी (Urgent)</MenuItem>
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={2.5}
                label="कैफियत / पृष्ठभूमी (Notes / Background)"
                placeholder="उदा: बिहानी सिफ्ट इच्छुक, साथीको भाइ, विदेश जानको लागि केयरगिभर गर्न चाहेको..."
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenAddLeadModal(false)} sx={{ fontWeight: 700, color: '#64748B' }}>
              रद्द गर्नुहोस्
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
              विद्यार्थी लिड सुरक्षित गर्नुहोस्
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
          भुक्तानी खाता अद्यावधिक
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              कमिसन रकम पाउनको लागि आफ्नो eSewa आईडी, Khalti वा बैंक विवरण (खाता नम्बर र बैंक नाम) लेख्नुहोस्:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="भुक्तानी विवरण (Payment Info)"
              value={paymentInfoDraft}
              onChange={(e) => setPaymentInfoDraft(e.target.value)}
              placeholder="उदा: eSewa: 9841234567 वा Nabil Bank: 0192837465, Ramesh Shrestha"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditPaymentModal(false)} sx={{ fontWeight: 700 }}>
            रद्द
          </Button>
          <Button variant="contained" onClick={handleSavePaymentInfo} sx={{ fontWeight: 800, bgcolor: '#0B2545' }}>
            सुरक्षित गर्नुहोस्
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
