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
  Paper,
  Tooltip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import HandshakeIcon from '@mui/icons-material/Handshake';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { loadDB, saveDB, logAudit } from '../../services/storage';
import { exportToExcel } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';
import LeadModal, { LEAD_STAGES, LEAD_PRIORITIES, LEAD_SOURCES } from './LeadModal';
import LeadDetailsModal from './LeadDetailsModal';
import ConvertToStudentModal from './ConvertToStudentModal';
import LeadImportModal from './LeadImportModal';

export default function LeadManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser } = useAuth();

  // Dialog states
  const [openAddEditModal, setOpenAddEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [detailsLead, setDetailsLead] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [openImportModal, setOpenImportModal] = useState(false);

  // Filters & View Modes
  const [viewMode, setViewMode] = useState('table'); // 'table', 'card', 'kanban', 'agents'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');

  // Agent Management states
  const [openAddAgentModal, setOpenAddAgentModal] = useState(false);
  const [agentForm, setAgentForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: 'काठमाडौं',
    commissionType: 'FIXED',
    defaultRate: 1000,
    paymentInfo: '',
    pin: '1234'
  });

  // Feedback Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const leads = db.leads || [];

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchPhone = item.phone?.includes(q);
        const matchCourse = item.course?.toLowerCase().includes(q);
        const matchAddress = item.address?.toLowerCase().includes(q);
        const matchSubject = item.subject?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCourse && !matchAddress && !matchSubject && !matchId) {
          return false;
        }
      }

      // Stage match
      if (selectedStage !== 'ALL' && item.stage !== selectedStage) {
        return false;
      }

      // Priority match
      if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) {
        return false;
      }

      // Source match
      if (selectedSource !== 'ALL' && !item.source?.includes(selectedSource)) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedStage, selectedPriority, selectedSource]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const total = leads.length;
    const active = leads.filter((l) => ['New Lead', 'Contacted', 'Interested', 'Follow-up'].includes(l.stage)).length;
    const converted = leads.filter((l) => l.stage === 'Converted').length;
    const todayFollowUps = leads.filter((l) => l.followUpDate === todayStr).length;
    const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return { total, active, converted, todayFollowUps, convRate };
  }, [leads]);

  // Handler: Save New or Edited Lead
  const handleSaveLead = (formData) => {
    let updatedLeads;
    if (editingLead) {
      updatedLeads = leads.map((l) => {
        if (l.id === editingLead.id) {
          const wasStageChanged = l.stage !== formData.stage;
          const updatedTimeline = [...(l.timeline || [])];
          if (wasStageChanged) {
            updatedTimeline.push({
              date: new Date().toISOString(),
              note: `अवस्था परिवर्तन भयो: '${l.stage}' बाट '${formData.stage}' मा`,
              staffName: currentUser?.name || 'Admin'
            });
          }
          return {
            ...l,
            ...formData,
            timeline: updatedTimeline
          };
        }
        return l;
      });
      showToast('सोधपुछ विवरण सफलतापूर्वक अपडेट भयो (Lead updated successfully).');
    } else {
      // Generate Next Sequential ID (L0001 format)
      const existingIds = leads
        .map((l) => {
          const match = l.id && l.id.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const nextNum = existingIds.length ? Math.max(...existingIds) + 1 : 1;
      const newId = `L${String(nextNum).padStart(4, '0')}`;

      const newLead = {
        id: newId,
        ...formData,
        timeline: [
          {
            date: new Date().toISOString(),
            note: `नयाँ सोधपुछ दर्ता: ${formData.source}`,
            staffName: currentUser?.name || 'Staff'
          }
        ],
        createdAt: new Date().toISOString()
      };

      updatedLeads = [newLead, ...leads];
      showToast(`नयाँ सोधपुछ (${newId}) दर्ता भयो (New lead registered).`);
    }

    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddEditModal(false);
    setEditingLead(null);
  };

  // Handler: Delete Lead
  const handleDeleteLead = (leadId) => {
    if (!window.confirm('के तपाईं यो सोधपुछ रेकर्ड मेटाउन निश्चित हुनुहुन्छ? (Confirm Delete)')) return;
    const updatedLeads = leads.filter((l) => l.id !== leadId);
    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);
    showToast('सोधपुछ रेकर्ड मेटाइयो (Lead record deleted).', 'info');
  };

  // Handler: Update Stage directly (e.g. from Details or Kanban)
  const handleUpdateStage = (leadId, newStage) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead || targetLead.stage === newStage) return;

    const updatedTimeline = [
      ...(targetLead.timeline || []),
      {
        date: new Date().toISOString(),
        note: `अवस्था अपडेट: '${targetLead.stage}' ➔ '${newStage}'`,
        staffName: currentUser?.name || 'Staff'
      }
    ];

    const updatedLeads = leads.map((l) => {
      if (l.id === leadId) {
        const isConverted = newStage === 'Converted';
        return {
          ...l,
          stage: newStage,
          commissionStatus: isConverted && l.agentId ? 'approved' : l.commissionStatus,
          timeline: updatedTimeline
        };
      }
      return l;
    });

    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);

    if (detailsLead && detailsLead.id === leadId) {
      setDetailsLead({ ...detailsLead, stage: newStage, timeline: updatedTimeline });
    }

    showToast(`अवस्था बदलिएर '${newStage}' बनाइयो।`);
  };

  // Handler: Save New Agent
  const handleSaveAgent = (e) => {
    if (e) e.preventDefault();
    if (!agentForm.name.trim() || !agentForm.phone.trim()) {
      alert('कृपया नाम र फोन नम्बर अनिवार्य लेख्नुहोस्।');
      return;
    }

    const currentAgents = db.agents || [];
    const existingIds = currentAgents
      .map((a) => {
        const match = a.code && a.code.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingIds.length ? Math.max(...existingIds) + 1 : 101;
    const newCode = `AGE-${nextNum}`;
    const newId = `AGT-${String(nextNum).padStart(2, '0')}`;

    const newAgent = {
      id: newId,
      code: newCode,
      name: agentForm.name.trim(),
      phone: agentForm.phone.trim(),
      email: agentForm.email.trim() || '',
      address: agentForm.address.trim() || 'काठमाडौं',
      pin: agentForm.pin.trim() || '1234',
      status: 'Active',
      commissionType: agentForm.commissionType,
      defaultRate: Number(agentForm.defaultRate) || 1000,
      paymentInfo: agentForm.paymentInfo.trim() || `eSewa: ${agentForm.phone.trim()}`,
      joinedDate: new Date().toISOString().slice(0, 10)
    };

    const nextDb = {
      ...db,
      agents: [newAgent, ...currentAgents]
    };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddAgentModal(false);
    showToast(`नयाँ एजेन्ट (${newAgent.name} - ${newCode}) सफलतापूर्वक दर्ता भयो।`);
    setAgentForm({
      name: '',
      phone: '',
      email: '',
      address: 'काठमाडौं',
      commissionType: 'FIXED',
      defaultRate: 1000,
      paymentInfo: '',
      pin: '1234'
    });
  };

  // Handler: Mark Commission Payout as Paid
  const handleMarkPayoutPaid = (agentCodeOrId) => {
    const updatedLeads = leads.map((l) => {
      const match = (l.agentId === agentCodeOrId || l.agentCode === agentCodeOrId) && l.stage === 'Converted';
      if (match && l.commissionStatus !== 'paid') {
        return {
          ...l,
          commissionStatus: 'paid',
          commissionPaidDate: new Date().toISOString()
        };
      }
      return l;
    });

    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);
    showToast('कमिसन भुक्तानी सम्पन्न मार्क गरियो (Commission marked as Paid).');
  };

  // Handler: Add Timeline Note
  const handleAddTimelineNote = (leadId, noteText, staffName) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const newEntry = {
      date: new Date().toISOString(),
      note: noteText,
      staffName: staffName || currentUser?.name || 'Staff'
    };

    const updatedTimeline = [...(targetLead.timeline || []), newEntry];

    const updatedLeads = leads.map((l) => {
      if (l.id === leadId) {
        return { ...l, timeline: updatedTimeline };
      }
      return l;
    });

    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);

    if (detailsLead && detailsLead.id === leadId) {
      setDetailsLead({ ...detailsLead, timeline: updatedTimeline });
    }

    showToast('फलो-अप टिप्पणी सुरक्षित भयो (Note logged).');
  };

  // Handler: Bulk Import
  const handleImportLeads = (newImportedLeads) => {
    let nextNum = leads.length + 1;
    const preparedLeads = newImportedLeads.map((item) => {
      const leadId = `L${String(nextNum++).padStart(4, '0')}`;
      return {
        id: leadId,
        ...item,
        timeline: [
          {
            date: new Date().toISOString(),
            note: 'एक्सेल/CSV बाट इम्पोर्ट गरिएको',
            staffName: currentUser?.name || 'Admin'
          }
        ],
        createdAt: new Date().toISOString()
      };
    });

    const updatedLeads = [...preparedLeads, ...leads];
    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);
    showToast(`${preparedLeads.length} नयाँ सोधपुछहरू सफलतापूर्वक इम्पोर्ट भए!`);
  };

  // Handler: Export to Excel
  const handleExportExcel = () => {
    if (!filteredLeads.length) {
      showToast('एक्स्पोर्ट गर्न कुनै डाटा छैन।', 'warning');
      return;
    }
    const exportData = filteredLeads.map((l) => ({
      'Lead ID': l.id,
      'Full Name': l.name,
      'Phone': l.phone,
      'Address': l.address || '',
      'Subject': l.subject || '',
      'Course': l.course || '',
      'Duration': l.duration || '',
      'Fee': l.price || 0,
      'Source': l.source || '',
      'Priority': l.priority || 'Medium',
      'Stage': l.stage || 'New Lead',
      'Next Follow-up': l.followUpDate || '',
      'Initial Notes': l.notes || '',
      'Total Activities': l.timeline?.length || 0,
      'Created Date': l.createdAt?.slice(0, 10) || ''
    }));

    exportToExcel(exportData, 'GlobalEra_TVET_Leads_Report');
    showToast('एक्सेल रिपोर्ट सफलतापूर्वक डाउनलोड भयो।');
  };

  // Helper for WhatsApp Click
  const getWaLink = (lead) => {
    const text = `नमस्ते ${lead.name}! ग्लोबल एरा प्राविधिक स्कुलबाट हजुरले सोधपुछ गर्नुभएको '${lead.course || 'व्यावसायिक तालिम'}' सम्बन्धी थप जानकारी तथा भर्ना प्रक्रियाको लागि सम्पर्क गरेका हौँ।`;
    return `https://wa.me/977${lead.phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Page Title & Breadcrumb Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 8px 16px rgba(30, 64, 175, 0.25)'
              }}
            >
              <ContactPhoneIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
                Lead CRM & Inquiry Management
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                विद्यार्थी सोधपुछ, परामर्श, फलो-अप तथा भर्ना रूपान्तरण व्यवस्थापन
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            onClick={handleExportExcel}
            startIcon={<FileDownloadIcon />}
            sx={{
              fontWeight: 700,
              borderRadius: 2.5,
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#FFFFFF',
              textTransform: 'none',
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
            }}
          >
            एक्सेल रिपोर्ट (Export)
          </Button>

          <Button
            variant="outlined"
            onClick={() => setOpenImportModal(true)}
            startIcon={<CloudUploadIcon />}
            sx={{
              fontWeight: 700,
              borderRadius: 2.5,
              borderColor: '#CBD5E1',
              color: '#1E40AF',
              bgcolor: '#FFFFFF',
              textTransform: 'none',
              '&:hover': { bgcolor: '#EFF6FF', borderColor: '#93C5FD' }
            }}
          >
            इम्पोर्ट (Bulk Import)
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setEditingLead(null);
              setOpenAddEditModal(true);
            }}
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
              fontWeight: 800,
              borderRadius: 2.5,
              px: 2.5,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              textTransform: 'none'
            }}
          >
            + नयाँ सोधपुछ (New Lead)
          </Button>
        </Stack>
      </Box>

      {/* Metric KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#3B82F6' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              कुल सोधपुछ (Total Leads)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', my: 0.5 }}>
              {metrics.total}
            </Typography>
            <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: '1rem' }} /> सबै च्यानलहरूबाट प्राप्त
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#F59E0B' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              सक्रिय काउन्सिलिङ (Active Pipeline)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706', my: 0.5 }}>
              {metrics.active}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              इच्छुक र निरन्तर सम्पर्कमा रहेका
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#0EA5E9' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              आजको फलो-अप (Today's Follow-ups)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284C7', my: 0.5 }}>
              {metrics.todayFollowUps}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              आज कल वा भेट्ने तालिका
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#10B981' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              भर्ना सफलता (Conversion)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', my: 0.5 }}>
              {metrics.converted} <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>({metrics.convRate}%)</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: '1rem' }} /> विद्यार्थी समूहमा रूपान्तरित
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar & View Mode Toggle */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        {/* Left Side: Search & Filter Selectors */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="नाम, फोन, कोर्स वा ठेगाना खोज्नुहोस्..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
          />

          <TextField
            select
            size="small"
            label="अवस्था (Stage)"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">सबै अवस्था (All Stages)</MenuItem>
            {LEAD_STAGES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="प्राथमिकता (Priority)"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">सबै (All Priorities)</MenuItem>
            {LEAD_PRIORITIES.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="स्रोत (Source)"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">सबै स्रोत (All Sources)</MenuItem>
            {LEAD_SOURCES.map((src) => (
              <MenuItem key={src} value={src.split(' (')[0]}>
                {src}
              </MenuItem>
            ))}
          </TextField>

          {(searchQuery || selectedStage !== 'ALL' || selectedPriority !== 'ALL' || selectedSource !== 'ALL') && (
            <Button
              size="small"
              startIcon={<FilterAltOffIcon />}
              onClick={() => {
                setSearchQuery('');
                setSelectedStage('ALL');
                setSelectedPriority('ALL');
                setSelectedSource('ALL');
              }}
              sx={{ color: '#EF4444', fontWeight: 700, textTransform: 'none' }}
            >
              फिल्टर हटाउनुहोस् (Clear)
            </Button>
          )}
        </Box>

        {/* Right Side: View Mode Switcher */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, next) => next && setViewMode(next)}
          size="small"
          sx={{
            bgcolor: '#F8FAFC',
            borderRadius: 2,
            border: '1px solid #E2E8F0',
            '& .MuiToggleButton-root': {
              px: 1.5,
              py: 0.8,
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#64748B',
              '&.Mui-selected': {
                bgcolor: '#1E40AF',
                color: '#FFFFFF',
                '&:hover': { bgcolor: '#1D4ED8' }
              }
            }
          }}
        >
          <ToggleButton value="table" aria-label="Table View">
            <ViewListIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> तालिका (Table)
          </ToggleButton>
          <ToggleButton value="card" aria-label="Card View">
            <ViewModuleIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> कार्ड (Cards)
          </ToggleButton>
          <ToggleButton value="kanban" aria-label="Kanban View">
            <ViewWeekIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> पाइपलाइन (Kanban)
          </ToggleButton>
          <ToggleButton value="agents" aria-label="Agents & Referrals">
            <HandshakeIcon sx={{ mr: 0.5, fontSize: '1.2rem', color: viewMode === 'agents' ? '#FFFFFF' : '#D97706' }} /> एजेन्ट तथा रेफ़रल
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* ========================================================= */}
      {/* VIEW 1: TABLE VIEW                                       */}
      {/* ========================================================= */}
      {viewMode === 'table' && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    Lead ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    विद्यार्थी (Name & Address)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    सम्पर्क (Phone & Actions)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    पाठ्यक्रम (Course / Subject)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    प्राथमिकता
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    अवस्था (Stage)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    अर्को फलो-अप
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    इतिहास
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    कार्यहरू (Actions)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94A3B8' }}>
                      कुनै सोधपुछ रेकर्ड भेटिएन (No leads matching filter).
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => {
                    const stgObj = LEAD_STAGES.find((s) => s.value === lead.stage) || LEAD_STAGES[0];
                    const prObj = LEAD_PRIORITIES.find((p) => p.value === lead.priority) || LEAD_PRIORITIES[1];

                    return (
                      <TableRow key={lead.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF' }}
                          >
                            {lead.id}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            {lead.createdAt?.slice(0, 10)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            onClick={() => setDetailsLead(lead)}
                            sx={{
                              fontWeight: 800,
                              color: '#0F172A',
                              cursor: 'pointer',
                              '&:hover': { color: '#2563EB', textDecoration: 'underline' }
                            }}
                          >
                            {lead.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.3 }}
                          >
                            <LocationOnIcon sx={{ fontSize: '0.85rem', color: '#94A3B8' }} />
                            {lead.address || 'स्थान नखुलेको'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#334155' }}
                            >
                              {lead.phone}
                            </Typography>
                            <Tooltip title="सिधै कल गर्नुहोस्">
                              <IconButton
                                size="small"
                                component="a"
                                href={`tel:${lead.phone}`}
                                sx={{ color: '#0284C7', p: 0.4 }}
                              >
                                <PhoneIcon sx={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ह्वाट्सएप सन्देश पठाउनुहोस्">
                              <IconButton
                                size="small"
                                component="a"
                                href={getWaLink(lead)}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: '#10B981', p: 0.4 }}
                              >
                                <WhatsAppIcon sx={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            {lead.course || 'सामान्य'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            {lead.subject ? `${lead.subject} • ` : ''} Rs. {Number(lead.price || 0).toLocaleString()}
                          </Typography>
                          {(lead.agentName || lead.agentCode) && (
                            <Chip
                              icon={<HandshakeIcon sx={{ fontSize: '13px !important' }} />}
                              label={`एजेन्ट: ${lead.agentName ? lead.agentName.split(' ')[0] : lead.agentCode}`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                bgcolor: '#FEF3C7',
                                color: '#92400E',
                                fontWeight: 800,
                                mt: 0.5
                              }}
                            />
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={prObj.label.split(' (')[0]}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              bgcolor: `${prObj.color}15`,
                              color: prObj.color,
                              border: `1px solid ${prObj.color}40`
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={stgObj.label.split(' (')[0]}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              bgcolor: `${stgObj.color}18`,
                              color: stgObj.color,
                              border: `1px solid ${stgObj.color}50`
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                            {lead.followUpDate || '-'}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            icon={<HistoryIcon sx={{ fontSize: '0.9rem !important' }} />}
                            label={lead.timeline?.length || 0}
                            size="small"
                            onClick={() => setDetailsLead(lead)}
                            clickable
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              bgcolor: '#F1F5F9',
                              color: '#334155'
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="विस्तृत विवरण तथा फलो-अप लग">
                              <IconButton
                                size="small"
                                onClick={() => setDetailsLead(lead)}
                                sx={{ color: '#2563EB' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {lead.stage !== 'Converted' && (
                              <Tooltip title="विद्यार्थी भर्नामा रूपान्तरण">
                                <IconButton
                                  size="small"
                                  onClick={() => setConvertLead(lead)}
                                  sx={{ color: '#059669' }}
                                >
                                  <HowToRegIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="सम्पादन">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingLead(lead);
                                  setOpenAddEditModal(true);
                                }}
                                sx={{ color: '#F59E0B' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="मेटाउनुहोस्">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteLead(lead.id)}
                                sx={{ color: '#EF4444' }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: CARD VIEW                                        */}
      {/* ========================================================= */}
      {viewMode === 'card' && (
        <Grid container spacing={2.5}>
          {filteredLeads.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3.5, color: '#94A3B8' }}>
                कुनै सोधपुछ फेला परेन।
              </Paper>
            </Grid>
          ) : (
            filteredLeads.map((lead) => {
              const stgObj = LEAD_STAGES.find((s) => s.value === lead.stage) || LEAD_STAGES[0];
              const prObj = LEAD_PRIORITIES.find((p) => p.value === lead.priority) || LEAD_PRIORITIES[1];
              const lastNote = lead.timeline?.length ? lead.timeline[lead.timeline.length - 1] : null;

              return (
                <Grid item xs={12} sm={6} md={4} key={lead.id}>
                  <Card
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3.5,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                        borderColor: '#CBD5E1'
                      }
                    }}
                  >
                    {/* Card Top: Avatar, Name & Stage Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: stgObj.color,
                            fontWeight: 800,
                            fontSize: '1.2rem'
                          }}
                        >
                          {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            onClick={() => setDetailsLead(lead)}
                            sx={{
                              fontWeight: 800,
                              color: '#0F172A',
                              cursor: 'pointer',
                              lineHeight: 1.2,
                              '&:hover': { color: '#2563EB' }
                            }}
                          >
                            {lead.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {lead.id} • {lead.source || 'Direct'}
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={stgObj.label.split(' (')[0]}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: `${stgObj.color}15`,
                          color: stgObj.color,
                          border: `1px solid ${stgObj.color}40`
                        }}
                      />
                    </Box>

                    {/* Course & Location Info */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
                        {lead.course || 'सामान्य सोधपुछ'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <LocationOnIcon sx={{ fontSize: '0.85rem', color: '#94A3B8' }} />
                          {lead.address || 'स्थान नखुलेको'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669' }}>
                          Rs. {Number(lead.price || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Quick Call & WhatsApp Action Row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        component="a"
                        href={`tel:${lead.phone}`}
                        startIcon={<PhoneIcon sx={{ fontSize: '1rem !important' }} />}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: 2,
                          color: '#0284C7',
                          borderColor: '#BAE6FD',
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#F0F9FF', borderColor: '#0284C7' }
                        }}
                      >
                        कल ({lead.phone})
                      </Button>

                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        component="a"
                        href={getWaLink(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<WhatsAppIcon sx={{ fontSize: '1rem !important' }} />}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: 2,
                          color: '#10B981',
                          borderColor: '#A7F3D0',
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#ECFDF5', borderColor: '#10B981' }
                        }}
                      >
                        ह्वाट्सएप
                      </Button>
                    </Box>

                    {/* Last Timeline Activity Note Snippet */}
                    {lastNote && (
                      <Box sx={{ mb: 2, px: 1.5, py: 1, bgcolor: '#FEF3C7', borderRadius: 1.5, borderLeft: '3px solid #F59E0B' }}>
                        <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                          पछिल्लो टिप्पणी ({lastNote.staffName || 'Staff'}): "{lastNote.note}"
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    {/* Card Footer: Timeline history count & Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        icon={<HistoryIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={`${lead.timeline?.length || 0} अन्तरक्रिया`}
                        size="small"
                        onClick={() => setDetailsLead(lead)}
                        clickable
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />

                      <Stack direction="row" spacing={0.5}>
                        {lead.stage !== 'Converted' && (
                          <Tooltip title="विद्यार्थी भर्नामा बदल्नुहोस्">
                            <IconButton
                              size="small"
                              onClick={() => setConvertLead(lead)}
                              sx={{ color: '#059669', bgcolor: '#ECFDF5' }}
                            >
                              <HowToRegIcon sx={{ fontSize: '1.1rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="सम्पादन">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingLead(lead);
                              setOpenAddEditModal(true);
                            }}
                            sx={{ color: '#F59E0B', bgcolor: '#FFFBEB' }}
                          >
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="मेटाउनुहोस्">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLead(lead.id)}
                            sx={{ color: '#EF4444', bgcolor: '#FEF2F2' }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: KANBAN PIPELINE BOARD VIEW                        */}
      {/* ========================================================= */}
      {viewMode === 'kanban' && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            alignItems: 'flex-start'
          }}
        >
          {LEAD_STAGES.map((colStage, colIdx) => {
            const colLeads = filteredLeads.filter((l) => l.stage === colStage.value);

            return (
              <Paper
                key={colStage.value}
                elevation={0}
                sx={{
                  minWidth: 290,
                  maxWidth: 320,
                  flexShrink: 0,
                  borderRadius: 3.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden'
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#FFFFFF',
                    borderBottom: '2px solid',
                    borderColor: colStage.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: colStage.color
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {colStage.label.split(' (')[0]}
                    </Typography>
                  </Box>
                  <Chip
                    label={colLeads.length}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      bgcolor: `${colStage.color}15`,
                      color: colStage.color
                    }}
                  />
                </Box>

                {/* Cards Inside Column */}
                <Box sx={{ p: 1.5, maxHeight: 650, overflowY: 'auto' }}>
                  {colLeads.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#94A3B8' }}>
                      <Typography variant="caption">कुनै लिड छैन</Typography>
                    </Box>
                  ) : (
                    colLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          mb: 1.5,
                          borderRadius: 2.5,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                            borderColor: '#CBD5E1'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography
                            variant="subtitle2"
                            onClick={() => setDetailsLead(lead)}
                            sx={{
                              fontWeight: 800,
                              color: '#0F172A',
                              cursor: 'pointer',
                              '&:hover': { color: '#2563EB' }
                            }}
                          >
                            {lead.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94A3B8' }}>
                            {lead.id}
                          </Typography>
                        </Box>

                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 1 }}>
                          {lead.course || 'सामान्य सोधपुछ'}
                        </Typography>

                        {/* Phone & WhatsApp Quick Icons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#334155' }}>
                            {lead.phone}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" component="a" href={`tel:${lead.phone}`} sx={{ color: '#0284C7', p: 0.3 }}>
                              <PhoneIcon sx={{ fontSize: '0.95rem' }} />
                            </IconButton>
                            <IconButton size="small" component="a" href={getWaLink(lead)} target="_blank" rel="noopener noreferrer" sx={{ color: '#10B981', p: 0.3 }}>
                              <WhatsAppIcon sx={{ fontSize: '0.95rem' }} />
                            </IconButton>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Stage Transition Quick Arrows */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Tooltip title="पछिल्लो चरणमा सार्नुहोस्">
                            <span>
                              <IconButton
                                size="small"
                                disabled={colIdx === 0}
                                onClick={() => handleUpdateStage(lead.id, LEAD_STAGES[colIdx - 1].value)}
                                sx={{ p: 0.4 }}
                              >
                                <ArrowBackIcon sx={{ fontSize: '0.95rem' }} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Chip
                            icon={<HistoryIcon sx={{ fontSize: '0.85rem !important' }} />}
                            label={lead.timeline?.length || 0}
                            size="small"
                            onClick={() => setDetailsLead(lead)}
                            clickable
                            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                          />

                          <Tooltip title="अर्को चरणमा सार्नुहोस्">
                            <span>
                              <IconButton
                                size="small"
                                disabled={colIdx === LEAD_STAGES.length - 1}
                                onClick={() => handleUpdateStage(lead.id, LEAD_STAGES[colIdx + 1].value)}
                                sx={{ p: 0.4 }}
                              >
                                <ArrowForwardIcon sx={{ fontSize: '0.95rem' }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Card>
                    ))
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* ========================================================= */}
      {/* VIEW 4: AGENTS & REFERRAL PARTNER MANAGEMENT             */}
      {/* ========================================================= */}
      {viewMode === 'agents' && (
        <Box>
          {/* Agent KPI Metrics */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {(() => {
              const allAgents = db.agents || [];
              const agentLeads = leads.filter((l) => l.agentId || l.agentCode || (l.source && l.source.includes('एजेन्ट')));
              const convertedAgentLeads = agentLeads.filter((l) => l.stage === 'Converted');

              let totalEarned = 0;
              let pendingPayout = 0;
              let paidOut = 0;

              convertedAgentLeads.forEach((l) => {
                const ag = allAgents.find((a) => a.id === l.agentId || a.code === l.agentCode);
                let amt = l.commissionAmount;
                if (!amt) {
                  amt = ag?.commissionType === 'PERCENTAGE'
                    ? Math.round(((l.price || 15000) * (ag.defaultRate || 10)) / 100)
                    : (ag?.defaultRate || 1000);
                }
                totalEarned += amt;
                if (l.commissionStatus === 'paid') paidOut += amt;
                else pendingPayout += amt;
              });

              return (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>
                        कुल दर्ता एजेन्ट (Agents)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2E5A', my: 0.5 }}>
                        {allAgents.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>सक्रिय रेफ़रल साझेदारहरू</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>
                        एजेन्टबाट आएका लिड
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#2563EB', my: 0.5 }}>
                        {agentLeads.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 700 }}>
                        {convertedAgentLeads.length} जना भर्ना सम्पन्न ({agentLeads.length > 0 ? Math.round((convertedAgentLeads.length / agentLeads.length) * 100) : 0}%)
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFBEB' }}>
                      <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 800, textTransform: 'uppercase' }}>
                        भुक्तानी गर्न बाँकी कमिसन
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#B45309', my: 0.5 }}>
                        रु. {pendingPayout.toLocaleString('ne-NP')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700 }}>स्वीकृत भई दिन बाँकी</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#ECFDF5' }}>
                      <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800, textTransform: 'uppercase' }}>
                        कुल भुक्तानी भइसकेको
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', my: 0.5 }}>
                        रु. {paidOut.toLocaleString('ne-NP')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>सम्पन्न भुक्तानी</Typography>
                    </Paper>
                  </Grid>
                </>
              );
            })()}
          </Grid>

          {/* Agents Directory Card */}
          <Card elevation={0} sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0' }}>
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                  🤝 आधिकारिक एजेन्ट तथा रेफ़रल साझेदारहरू
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  एजेन्टहरूको कार्यसम्पादन, सिफारिस लिडहरू तथा कमिसन भुक्तानी व्यवस्थापन
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddAgentModal(true)}
                sx={{
                  bgcolor: '#0B2545',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 2.5,
                  '&:hover': { bgcolor: '#133E68' }
                }}
              >
                + नयाँ एजेन्ट दर्ता गर्नुहोस्
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>एजेन्ट विवरण (Name & Code)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>सम्पर्क नम्बर</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>कमिसन दर (Policy)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>भुक्तानी खाता (eSewa / Bank)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>सिफारिस / भर्ना</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>कमिसन (बाँकी / कुल)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>कार्य (Action)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(db.agents || []).map((ag) => {
                    const agentLeads = leads.filter((l) => l.agentId === ag.id || l.agentCode === ag.code);
                    const converted = agentLeads.filter((l) => l.stage === 'Converted');

                    let earned = 0;
                    let pending = 0;
                    converted.forEach((l) => {
                      let amt = l.commissionAmount;
                      if (!amt) {
                        amt = ag.commissionType === 'PERCENTAGE'
                          ? Math.round(((l.price || 15000) * (ag.defaultRate || 10)) / 100)
                          : (ag.defaultRate || 1000);
                      }
                      earned += amt;
                      if (l.commissionStatus !== 'paid') pending += amt;
                    });

                    return (
                      <TableRow key={ag.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {ag.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                            <Chip label={ag.code} size="small" sx={{ fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E', height: 20, fontSize: '0.7rem' }} />
                            <Typography variant="caption" sx={{ color: '#64748B' }}>{ag.address || 'काठमाडौं'}</Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {ag.phone}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            पिन: {ag.pin || '1234'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={ag.commissionType === 'PERCENTAGE' ? `${ag.defaultRate}% प्रति भर्ना` : `रु. ${Number(ag.defaultRate || 1000).toLocaleString('ne-NP')} प्रति भर्ना`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
                          />
                        </TableCell>

                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                            {ag.paymentInfo || 'विवरण भरिएको छैन'}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {agentLeads.length} लिड
                          </Typography>
                          <Chip
                            label={`${converted.length} भर्ना`}
                            size="small"
                            color={converted.length > 0 ? 'success' : 'default'}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: pending > 0 ? '#B45309' : '#059669' }}>
                            रु. {pending.toLocaleString('ne-NP')} (बाँकी)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            कुल: रु. {earned.toLocaleString('ne-NP')}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {pending > 0 ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={() => handleMarkPayoutPaid(ag.code)}
                                sx={{ fontWeight: 800, fontSize: '0.72rem', borderRadius: 2 }}
                              >
                                भुक्तानी सम्पन्न मार्क
                              </Button>
                            ) : (
                              <Chip label="बाँकी छैन (Clear)" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Add / Edit Lead Modal */}
      <LeadModal
        open={openAddEditModal}
        onClose={() => {
          setOpenAddEditModal(false);
          setEditingLead(null);
        }}
        onSave={handleSaveLead}
        editingLead={editingLead}
        courses={db.courses || []}
      />

      {/* 2. Detailed Lead & Activity Timeline Modal */}
      <LeadDetailsModal
        open={Boolean(detailsLead)}
        onClose={() => setDetailsLead(null)}
        lead={detailsLead}
        onUpdateStage={handleUpdateStage}
        onAddTimelineNote={handleAddTimelineNote}
        onEditLead={(ld) => {
          setEditingLead(ld);
          setOpenAddEditModal(true);
        }}
        onConvertToStudent={(ld) => {
          setConvertLead(ld);
          setDetailsLead(null);
        }}
      />

      {/* 3. Convert to Student Modal */}
      <ConvertToStudentModal
        open={Boolean(convertLead)}
        onClose={() => setConvertLead(null)}
        lead={convertLead}
        db={db}
        onConverted={(newStudent) => {
          setDb(loadDB());
          showToast(`बधाई छ! ${newStudent.name} सफलतापुर्वक विद्यार्थी समूहमा भर्ना हुनुभयो।`);
        }}
      />

      {/* 4. Bulk CSV Import Modal */}
      <LeadImportModal
        open={openImportModal}
        onClose={() => setOpenImportModal(false)}
        onImportSuccess={handleImportLeads}
      />

      {/* 5. Add New Agent Modal */}
      <Dialog
        open={openAddAgentModal}
        onClose={() => setOpenAddAgentModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <form onSubmit={handleSaveAgent}>
          <DialogTitle sx={{ fontWeight: 900, color: '#0F2E5A' }}>
            + नयाँ एजेन्ट / रेफ़रल पार्टनर दर्ता (Add Referral Partner)
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.2} sx={{ pt: 1 }}>
              <TextField
                required
                fullWidth
                label="एजेन्टको पूरा नाम (Agent Full Name)"
                placeholder="उदा: सुवास घिमिरे"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="सम्पर्क नम्बर (Phone / WhatsApp)"
                    placeholder="उदा: 9841234567"
                    value={agentForm.phone}
                    onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="इमेल (Email)"
                    placeholder="agent@gmail.com"
                    value={agentForm.email}
                    onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="ठेगाना / सहर (Address)"
                value={agentForm.address}
                onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="कमिसन प्रकार (Commission Type)"
                    value={agentForm.commissionType}
                    onChange={(e) => setAgentForm({ ...agentForm, commissionType: e.target.value })}
                  >
                    <MenuItem value="FIXED">फिक्स्ड रकम (Fixed Amount)</MenuItem>
                    <MenuItem value="PERCENTAGE">प्रतिशत (Percentage % of Fee)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    fullWidth
                    label={agentForm.commissionType === 'PERCENTAGE' ? 'कमिसन प्रतिशत (%)' : 'कमिसन रकम (रु.)'}
                    value={agentForm.defaultRate}
                    onChange={(e) => setAgentForm({ ...agentForm, defaultRate: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="कमिसन भुक्तानी खाता (eSewa / Bank Details)"
                placeholder="उदा: eSewa: 9841234567 वा Global IME Bank: 01928374..."
                value={agentForm.paymentInfo}
                onChange={(e) => setAgentForm({ ...agentForm, paymentInfo: e.target.value })}
              />

              <TextField
                fullWidth
                type="password"
                label="लगइन ४-अङ्कको पिन (Login PIN)"
                value={agentForm.pin}
                onChange={(e) => setAgentForm({ ...agentForm, pin: e.target.value })}
                inputProps={{ maxLength: 6 }}
                helperText="एजेन्टले /agent पोर्टलमा लगइन गर्दा प्रयोग गर्ने पिन।"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAddAgentModal(false)} sx={{ fontWeight: 700 }}>
              रद्द
            </Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0B2545', fontWeight: 800, px: 3 }}>
              एजेन्ट सुरक्षित गर्नुहोस्
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
