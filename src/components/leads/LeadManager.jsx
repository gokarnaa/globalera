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
import { playLeadChime } from '../../services/soundUtils';
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
    address: 'Kathmandu',
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

  // Live Real-Time Multi-Device & Multi-Tab Lead Listener
  React.useEffect(() => {
    let lastKnownCount = (loadDB().leads || []).length;

    const handleRealTimeSync = () => {
      const freshDb = loadDB();
      const currentLeads = freshDb.leads || [];

      if (currentLeads.length > lastKnownCount) {
        const latest = currentLeads[0];
        playLeadChime();
        showToast(
          `🔔 New lead received! ${latest?.name || 'Student'} (${latest?.course || latest?.subject || 'Course'}) - ${latest?.source || 'Online'}`,
          'success'
        );
      }
      lastKnownCount = currentLeads.length;
      setDb(freshDb);
    };

    window.addEventListener('kite_db_updated', handleRealTimeSync);
    window.addEventListener('storage', handleRealTimeSync);

    // Fast background poller (every 4 seconds) so any new lead instantly appears without page refresh
    const poller = setInterval(handleRealTimeSync, 4000);

    return () => {
      window.removeEventListener('kite_db_updated', handleRealTimeSync);
      window.removeEventListener('storage', handleRealTimeSync);
      clearInterval(poller);
    };
  }, []);

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
              note: `Stage changed: from '${l.stage}' to '${formData.stage}'`,
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
      showToast('Lead updated successfully.');
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
            note: `New lead registered: ${formData.source}`,
            staffName: currentUser?.name || 'Staff'
          }
        ],
        createdAt: new Date().toISOString()
      };

      updatedLeads = [newLead, ...leads];
      showToast(`New lead (${newId}) registered.`);
    }

    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddEditModal(false);
    setEditingLead(null);
  };

  // Handler: Delete Lead
  const handleDeleteLead = (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead record?')) return;
    const updatedLeads = leads.filter((l) => l.id !== leadId);
    const nextDb = { ...db, leads: updatedLeads };
    saveDB(nextDb);
    setDb(nextDb);
    showToast('Lead record deleted.', 'info');
  };

  // Handler: Update Stage directly (e.g. from Details or Kanban)
  const handleUpdateStage = (leadId, newStage) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead || targetLead.stage === newStage) return;

    const updatedTimeline = [
      ...(targetLead.timeline || []),
      {
        date: new Date().toISOString(),
        note: `Stage updated: '${targetLead.stage}' ➔ '${newStage}'`,
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

    showToast(`Stage updated to '${newStage}'.`);
  };

  // Handler: Save New Agent
  const handleSaveAgent = (e) => {
    if (e) e.preventDefault();
    if (!agentForm.name.trim() || !agentForm.phone.trim()) {
      alert('Please enter both the agent name and phone number.');
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
      address: agentForm.address.trim() || 'Kathmandu',
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
    showToast(`New agent (${newAgent.name} - ${newCode}) registered successfully.`);
    setAgentForm({
      name: '',
      phone: '',
      email: '',
      address: 'Kathmandu',
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
    showToast('Commission marked as Paid.');
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

    showToast('Follow-up note logged.');
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
            note: 'Imported from Excel/CSV',
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
    showToast(`${preparedLeads.length} new leads imported successfully!`);
  };

  // Handler: Export to Excel
  const handleExportExcel = () => {
    if (!filteredLeads.length) {
      showToast('No data available to export.', 'warning');
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
    showToast('Excel report downloaded successfully.');
  };

  // Helper for WhatsApp Click
  const getWaLink = (lead) => {
    const text = `Hello ${lead.name}! We are contacting you from Global Era Technical School regarding further details and the admission process for '${lead.course || 'Vocational Training'}' that you inquired about.`;
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
                Student Inquiry, Counseling, Follow-up & Admission Conversion Management
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
            Export Excel
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
            Bulk Import
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
            + New Lead
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
              Total Leads
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', my: 0.5 }}>
              {metrics.total}
            </Typography>
            <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: '1rem' }} /> Received from all channels
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
              Active Pipeline
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706', my: 0.5 }}>
              {metrics.active}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Interested & in active contact
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
              Today's Follow-ups
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284C7', my: 0.5 }}>
              {metrics.todayFollowUps}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Scheduled calls or visits today
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
              Conversions
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', my: 0.5 }}>
              {metrics.converted} <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>({metrics.convRate}%)</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: '1rem' }} /> Converted to student batches
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
            placeholder="Search by name, phone, course, or address..."
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
            label="Stage"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Stages</MenuItem>
            {LEAD_STAGES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Priority"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">All Priorities</MenuItem>
            {LEAD_PRIORITIES.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Source"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Sources</MenuItem>
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
              Clear Filters
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
            <ViewListIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> Table
          </ToggleButton>
          <ToggleButton value="card" aria-label="Card View">
            <ViewModuleIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> Cards
          </ToggleButton>
          <ToggleButton value="kanban" aria-label="Kanban View">
            <ViewWeekIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> Pipeline (Kanban)
          </ToggleButton>
          <ToggleButton value="agents" aria-label="Agents & Referrals">
            <HandshakeIcon sx={{ mr: 0.5, fontSize: '1.2rem', color: viewMode === 'agents' ? '#FFFFFF' : '#D97706' }} /> Agents & Referrals
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
                    Student (Name & Address)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    Contact (Phone & Actions)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    Course / Subject
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    Priority
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    Stage
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    Next Follow-up
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    History
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#475569' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94A3B8' }}>
                      No leads matching filter.
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
                            {lead.address || 'Location not specified'}
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
                            <Tooltip title="Call directly">
                              <IconButton
                                size="small"
                                component="a"
                                href={`tel:${lead.phone}`}
                                sx={{ color: '#0284C7', p: 0.4 }}
                              >
                                <PhoneIcon sx={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Send WhatsApp message">
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
                            {lead.course || 'General'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            {lead.subject ? `${lead.subject} • ` : ''} Rs. {Number(lead.price || 0).toLocaleString()}
                          </Typography>
                          {(lead.agentName || lead.agentCode) && (
                            <Chip
                              icon={<HandshakeIcon sx={{ fontSize: '13px !important' }} />}
                              label={`Agent: ${lead.agentName ? lead.agentName.split(' ')[0] : lead.agentCode}`}
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
                            <Tooltip title="Detailed Profile & Follow-up Log">
                              <IconButton
                                size="small"
                                onClick={() => setDetailsLead(lead)}
                                sx={{ color: '#2563EB' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {lead.stage !== 'Converted' && (
                              <Tooltip title="Convert to Student Admission">
                                <IconButton
                                  size="small"
                                  onClick={() => setConvertLead(lead)}
                                  sx={{ color: '#059669' }}
                                >
                                  <HowToRegIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="Edit">
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

                            <Tooltip title="Delete">
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
                No leads found.
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
                        {lead.course || 'General Inquiry'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <LocationOnIcon sx={{ fontSize: '0.85rem', color: '#94A3B8' }} />
                          {lead.address || 'Location not specified'}
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
                        Call ({lead.phone})
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
                        WhatsApp
                      </Button>
                    </Box>

                    {/* Last Timeline Activity Note Snippet */}
                    {lastNote && (
                      <Box sx={{ mb: 2, px: 1.5, py: 1, bgcolor: '#FEF3C7', borderRadius: 1.5, borderLeft: '3px solid #F59E0B' }}>
                        <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                          Latest Note ({lastNote.staffName || 'Staff'}): "{lastNote.note}"
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    {/* Card Footer: Timeline history count & Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        icon={<HistoryIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={`${lead.timeline?.length || 0} Interactions`}
                        size="small"
                        onClick={() => setDetailsLead(lead)}
                        clickable
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />

                      <Stack direction="row" spacing={0.5}>
                        {lead.stage !== 'Converted' && (
                          <Tooltip title="Convert to Student Admission">
                            <IconButton
                              size="small"
                              onClick={() => setConvertLead(lead)}
                              sx={{ color: '#059669', bgcolor: '#ECFDF5' }}
                            >
                              <HowToRegIcon sx={{ fontSize: '1.1rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Edit">
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

                        <Tooltip title="Delete">
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
                      <Typography variant="caption">No leads</Typography>
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
                          {lead.course || 'General Inquiry'}
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
                          <Tooltip title="Move to previous stage">
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

                          <Tooltip title="Move to next stage">
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
              const agentLeads = leads.filter((l) => l.agentId || l.agentCode || (l.source && l.source.includes('Agent')));
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
                        Total Registered Agents
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2E5A', my: 0.5 }}>
                        {allAgents.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Active referral partners</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>
                        Leads from Agents
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#2563EB', my: 0.5 }}>
                        {agentLeads.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 700 }}>
                        {convertedAgentLeads.length} Admitted ({agentLeads.length > 0 ? Math.round((convertedAgentLeads.length / agentLeads.length) * 100) : 0}%)
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFBEB' }}>
                      <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 800, textTransform: 'uppercase' }}>
                        Pending Commission Payout
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#B45309', my: 0.5 }}>
                        NPR {pendingPayout.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700 }}>Approved & awaiting payout</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#ECFDF5' }}>
                      <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800, textTransform: 'uppercase' }}>
                        Total Paid Out
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', my: 0.5 }}>
                        NPR {paidOut.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>Completed payouts</Typography>
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
                  🤝 Official Agents & Referral Partners
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Manage agent performance, referred leads, and commission payouts
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
                + Register New Agent
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Agent Details (Name & Code)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Contact Number</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Commission Rate (Policy)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Payout Account (eSewa / Bank)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Referred / Admitted</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Commission (Pending / Total)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Action</TableCell>
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
                            <Typography variant="caption" sx={{ color: '#64748B' }}>{ag.address || 'Kathmandu'}</Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {ag.phone}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            PIN: {ag.pin || '1234'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={ag.commissionType === 'PERCENTAGE' ? `${ag.defaultRate}% per admission` : `NPR ${Number(ag.defaultRate || 1000).toLocaleString()} per admission`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
                          />
                        </TableCell>

                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                            {ag.paymentInfo || 'Details not provided'}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {agentLeads.length} Leads
                          </Typography>
                          <Chip
                            label={`${converted.length} Admitted`}
                            size="small"
                            color={converted.length > 0 ? 'success' : 'default'}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: pending > 0 ? '#B45309' : '#059669' }}>
                            NPR {pending.toLocaleString()} (Pending)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Total: NPR {earned.toLocaleString()}
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
                                Mark as Paid
                              </Button>
                            ) : (
                              <Chip label="Cleared" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
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
          showToast(`Congratulations! ${newStudent.name} has been successfully enrolled into the student batch.`);
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
            + Add Referral Partner (Agent)
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.2} sx={{ pt: 1 }}>
              <TextField
                required
                fullWidth
                label="Agent Full Name"
                placeholder="e.g., Subash Ghimire"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Phone / WhatsApp Number"
                    placeholder="e.g., 9841234567"
                    value={agentForm.phone}
                    onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    placeholder="agent@gmail.com"
                    value={agentForm.email}
                    onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Address / City"
                value={agentForm.address}
                onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Commission Type"
                    value={agentForm.commissionType}
                    onChange={(e) => setAgentForm({ ...agentForm, commissionType: e.target.value })}
                  >
                    <MenuItem value="FIXED">Fixed Amount</MenuItem>
                    <MenuItem value="PERCENTAGE">Percentage (% of Fee)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="number"
                    fullWidth
                    label={agentForm.commissionType === 'PERCENTAGE' ? 'Commission Percentage (%)' : 'Commission Amount (NPR)'}
                    value={agentForm.defaultRate}
                    onChange={(e) => setAgentForm({ ...agentForm, defaultRate: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Commission Payout Account (eSewa / Bank Details)"
                placeholder="e.g., eSewa: 9841234567 or Global IME Bank: 01928374..."
                value={agentForm.paymentInfo}
                onChange={(e) => setAgentForm({ ...agentForm, paymentInfo: e.target.value })}
              />

              <TextField
                fullWidth
                type="password"
                label="4-Digit Login PIN"
                value={agentForm.pin}
                onChange={(e) => setAgentForm({ ...agentForm, pin: e.target.value })}
                inputProps={{ maxLength: 6 }}
                helperText="PIN used by the agent to log in to the /agent portal."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAddAgentModal(false)} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0B2545', fontWeight: 800, px: 3 }}>
              Save Agent
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
