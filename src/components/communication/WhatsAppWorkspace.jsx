import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Avatar,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Drawer,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CallIcon from '@mui/icons-material/Call';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CampaignIcon from '@mui/icons-material/Campaign';
import BoltIcon from '@mui/icons-material/Bolt';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import PaymentsIcon from '@mui/icons-material/Payments';
import SmsIcon from '@mui/icons-material/Sms';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { StatusBadge } from '../common';
import { loadDB, saveDB, logCommunication } from '../../services/storage';
import { sendAakashSmsSimulated } from '../../services/exportUtils';
import {
  sendMetaWhatsAppMessage,
  sendWhatsAppBrochureDirect,
  markThreadRead,
  toggleBotPause
} from '../../services/whatsappCloudApi';

const ROLE_COLORS = {
  Lead: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  Student: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  Trainer: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  Employer: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  'New Inquiry': { bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' }
};

const QUICK_TEMPLATES = [
  {
    id: 'welcome',
    label: 'Admission Welcome',
    build: (t) =>
      `Namaste ${t.name}! Welcome to Prabidhik School (Global Era Technical School), Jorpati. Let us know if you need syllabus, shift timing, or admission details.`
  },
  {
    id: 'fee',
    label: 'Fee Reminder',
    build: (t) => {
      const due = Number(t.entity?.dueFee || 0);
      return `Namaste ${t.name}, this is a gentle reminder from Prabidhik School Accounts Desk regarding your remaining tuition fee${due > 0 ? ` of NPR ${due.toLocaleString()}` : ''}. Please contact 014910715 for assistance.`;
    }
  },
  {
    id: 'counsel',
    label: 'Counselling Follow-up',
    build: (t) =>
      `Namaste ${t.name}! Following up on your vocational training inquiry at Global Era Technical School. Would you like to visit our Jorpati campus this week for a free lab tour?`
  },
  {
    id: 'ojt',
    label: 'OJT / Placement Update',
    build: (t) =>
      `Namaste ${t.name}, we have an OJT / Job Placement update ready for you at Prabidhik School. Please reply when convenient or call 014910715.`
  }
];

function formatTimeShort(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatDateDivider(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Shared 3-Pane WhatsApp-Style Communication & Workflow Workspace.
 * Used in both the Floating Window and the Dedicated WhatsApp Sidebar Module.
 */
export default function WhatsAppWorkspace({
  threads = [],
  onRefresh,
  refreshing = false,
  height = '100%',
  initialPhone = null
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [mobileWorkflowOpen, setMobileWorkflowOpen] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState(null);
  const [templateAnchor, setTemplateAnchor] = useState(null);

  // Composer channel & modals
  const [sendChannel, setSendChannel] = useState('WhatsApp'); // 'WhatsApp' | 'SMS'
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({ url: '', filename: 'Brochure.pdf', caption: '' });
  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [metaTplForm, setMetaTplForm] = useState({ name: 'hello_world', language: 'en_US' });

  // Right-pane quick workflow & call log state
  const [noteText, setNoteText] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [newLeadCourse, setNewLeadCourse] = useState('Caregiver Training');
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callNote, setCallNote] = useState('');
  const [workflowSavedMsg, setWorkflowSavedMsg] = useState('');

  const messagesEndRef = useRef(null);
  const pillScrollRef = useRef(null);

  useEffect(() => {
    if (initialPhone) {
      const digits = String(initialPhone).replace(/\D/g, '').slice(-10);
      const match = threads.find((t) => t.key === digits);
      if (match) {
        setSelectedKey(match.key);
        if (isMobile) setMobileView('chat');
      }
    }
  }, [initialPhone, threads, isMobile]);

  useEffect(() => {
    if (!selectedKey && threads.length > 0 && !isMobile) {
      setSelectedKey(threads[0].key);
    }
  }, [threads, selectedKey, isMobile]);

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const todayStr = new Date().toISOString().slice(0, 10);
    return threads.filter((t) => {
      if (roleFilter === 'Unread' && t.unreadCount === 0) return false;
      if (roleFilter === 'Due / Today') {
        const isLeadDue = t.role === 'Lead' && t.entity?.nextFollowUp && t.entity.nextFollowUp <= todayStr && t.entity.stage !== 'Converted';
        const isFeeDue = t.role === 'Student' && Number(t.entity?.dueFee || 0) > 0;
        if (!isLeadDue && !isFeeDue) return false;
      }
      if (roleFilter === 'FB Ads' && !t.adReferral && !t.messages.some((m) => m.messageType === 'fb_ad_inquiry')) return false;
      if (['Lead', 'Student', 'Trainer', 'Employer'].includes(roleFilter) && t.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        (t.entity?.tgid || '').toLowerCase().includes(q) ||
        (t.lastMessage || '').toLowerCase().includes(q)
      );
    });
  }, [threads, roleFilter, searchQuery]);

  const activeThread = useMemo(
    () => threads.find((t) => t.key === selectedKey) || filteredThreads[0] || null,
    [threads, filteredThreads, selectedKey]
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages?.length, activeThread?.key]);

  const handleSelectThread = (thread) => {
    setSelectedKey(thread.key);
    if (thread.unreadCount > 0) {
      markThreadRead(thread.phone);
    }
    if (isMobile) setMobileView('chat');
  };

  const handleSend = async (customText = null) => {
    const textToSend = (customText ?? draft).trim();
    if (!textToSend || !activeThread) return;

    setSending(true);
    setSendFeedback(null);
    try {
      const currentDb = loadDB();
      if (sendChannel === 'SMS' && !customText) {
        sendAakashSmsSimulated(activeThread.phone, textToSend, currentDb.settings?.aakashSmsToken);
        logCommunication(currentDb, {
          recipientType: activeThread.role || 'Contact',
          recipientId: activeThread.entity?.id || activeThread.key,
          recipientName: activeThread.name,
          recipientPhone: activeThread.phone,
          channel: 'SMS',
          messageText: textToSend
        });
        setSendFeedback({ type: 'success', text: `SMS queued for ${activeThread.name} (${activeThread.phone}).` });
      } else {
        await sendMetaWhatsAppMessage({
          to: activeThread.phone,
          type: 'text',
          text: textToSend
        });
        logCommunication(currentDb, {
          recipientType: activeThread.role || 'Contact',
          recipientId: activeThread.entity?.id || activeThread.key,
          recipientName: activeThread.name,
          recipientPhone: activeThread.phone,
          channel: 'WhatsApp',
          messageText: textToSend
        });
      }
      if (!customText) setDraft('');
      markThreadRead(activeThread.phone);
      if (onRefresh) onRefresh();
    } catch (err) {
      setSendFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendDocument = async () => {
    if (!activeThread || !docForm.url.trim()) return;
    setSending(true);
    setSendFeedback(null);
    try {
      await sendMetaWhatsAppMessage({
        to: activeThread.phone,
        type: 'document',
        document: {
          url: docForm.url.trim(),
          filename: docForm.filename.trim() || 'Document.pdf',
          caption: docForm.caption.trim()
        },
        text: `[Document: ${docForm.filename || 'PDF'}] ${docForm.caption || docForm.url}`
      });
      setDocModalOpen(false);
      setDocForm({ url: '', filename: 'Brochure.pdf', caption: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setSendFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendMetaTemplate = async () => {
    if (!activeThread || !metaTplForm.name.trim()) return;
    setSending(true);
    setSendFeedback(null);
    try {
      await sendMetaWhatsAppMessage({
        to: activeThread.phone,
        type: 'template',
        template: {
          name: metaTplForm.name.trim(),
          language: { code: metaTplForm.language.trim() || 'en_US' }
        },
        text: `[Meta Template: ${metaTplForm.name.trim()}]`
      });
      setTplModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setSendFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleQuickShare = async (kind) => {
    if (!activeThread) return;
    const currentDb = loadDB();
    if (kind === 'brochure') {
      const courseName = activeThread.entity?.course || activeThread.entity?.subject || '';
      const matchedCourse = (currentDb.courses || []).find((c) =>
        courseName ? (c.title || '').toLowerCase().includes(courseName.toLowerCase()) : false
      ) || (currentDb.courses || [])[0];
      setSending(true);
      try {
        await sendWhatsAppBrochureDirect(activeThread.phone, matchedCourse);
        if (onRefresh) onRefresh();
      } catch (err) {
        setSendFeedback({ type: 'error', text: err.message });
      } finally {
        setSending(false);
      }
    } else if (kind === 'location') {
      await handleSend(
        `📍 *Prabidhik School (Global Era Technical School)*\nCampus: Jorpati, Gokarneshwor, Kathmandu (Near MitraPark Hub)\n⏰ Timing: 7:00 AM – 6:00 PM (Sun–Fri)\n📞 Office: 014910715 / 9803614574\n🌐 Map & Website: https://globalera.vercel.app`
      );
    } else if (kind === 'fee') {
      await handleSend(QUICK_TEMPLATES[1].build(activeThread));
    } else if (kind === 'certificate') {
      const cert = (currentDb.certificates || []).find(
        (c) => activeThread.entity?.id && c.studentId === activeThread.entity.id
      );
      const verifyUrl = cert?.certNo
        ? `https://globalera.vercel.app/?verify=${encodeURIComponent(cert.certNo)}`
        : `https://globalera.vercel.app`;
      await handleSend(
        `🎓 *Official Certificate Verification — Prabidhik School*\nHello ${activeThread.name}, you can verify your official vocational certificate online anytime here:\n${verifyUrl}`
      );
    }
  };

  const handleLogCall = () => {
    if (!activeThread) return;
    const currentDb = loadDB();
    logCommunication(currentDb, {
      recipientType: activeThread.role || 'Contact',
      recipientId: activeThread.entity?.id || activeThread.key,
      recipientName: activeThread.name,
      recipientPhone: activeThread.phone,
      channel: 'Phone Call',
      callStatus: callOutcome,
      messageText: `[Call: ${callOutcome}] ${callNote.trim() || 'Phone follow-up logged from WhatsApp Hub'}`
    });
    setCallNote('');
    setWorkflowSavedMsg(`Call (${callOutcome}) logged!`);
    setTimeout(() => setWorkflowSavedMsg(''), 2500);
    if (onRefresh) onRefresh();
  };

  const handleSaveLeadWorkflow = (nextStage) => {
    if (!activeThread?.entity || activeThread.role !== 'Lead') return;
    const db = loadDB();
    const updatedLeads = (db.leads || []).map((l) => {
      if (l.id !== activeThread.entity.id) return l;
      const followUps = [...(l.followUps || [])];
      if (noteText.trim()) {
        followUps.unshift({
          id: `FU-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          note: noteText.trim(),
          by: 'WhatsApp Hub'
        });
      }
      return {
        ...l,
        stage: nextStage || l.stage,
        nextFollowUp: nextFollowUp || l.nextFollowUp,
        followUps
      };
    });
    saveDB({ ...db, leads: updatedLeads });
    setNoteText('');
    setWorkflowSavedMsg('Lead workflow updated');
    setTimeout(() => setWorkflowSavedMsg(''), 2500);
    if (onRefresh) onRefresh();
  };

  const handleConvertVisitorToLead = () => {
    if (!activeThread) return;
    const db = loadDB();
    const newLead = {
      id: `LD-${Date.now()}`,
      name: activeThread.name || 'WhatsApp Inquiry',
      phone: activeThread.phone,
      course: activeThread.adReferral?.headline || newLeadCourse,
      source: activeThread.adReferral ? 'Facebook Ad (WhatsApp)' : 'WhatsApp Direct',
      stage: 'New Lead',
      priority: 'High',
      notes: activeThread.lastMessage || 'Inquiry from WhatsApp Hub',
      createdAt: new Date().toISOString(),
      followUps: []
    };
    saveDB({ ...db, leads: [newLead, ...(db.leads || [])] });
    setWorkflowSavedMsg('Saved to Leads CRM!');
    setTimeout(() => setWorkflowSavedMsg(''), 3000);
    if (onRefresh) onRefresh();
  };

  const renderLeftPane = () => (
    <Box
      sx={{
        width: { xs: '100%', md: 300 },
        flexShrink: 0,
        borderRight: { md: '1px solid #E2E8F0' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
        height: '100%',
        minHeight: 0
      }}
    >
      {/* Search + Refresh */}
      <Box sx={{ p: 1.25, borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, TGID..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 17, color: '#64748B' }} />
                </InputAdornment>
              )
            }}
          />
          {onRefresh && (
            <Tooltip title="Sync live WhatsApp messages">
              <IconButton size="small" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Horizontal Scrollable Filter Pills with Arrows */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton
            size="small"
            aria-label="Scroll filters left"
            onClick={() => pillScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
            sx={{ p: 0.25, color: '#64748B' }}
          >
            <ChevronLeftIcon sx={{ fontSize: 17 }} />
          </IconButton>
          <Box
            ref={pillScrollRef}
            onWheel={(e) => {
              if (pillScrollRef.current && Math.abs(e.deltaY) > 0) {
                pillScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            sx={{
              display: 'flex',
              gap: 0.6,
              overflowX: 'auto',
              flex: 1,
              py: 0.25,
              scrollBehavior: 'smooth',
              '&::-webkit-scrollbar': { height: 3 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 99 }
            }}
          >
            {['All', 'Unread', 'Due / Today', 'FB Ads', 'Lead', 'Student', 'Trainer', 'Employer'].map((tab) => {
              const active = roleFilter === tab;
              return (
                <Chip
                  key={tab}
                  size="small"
                  label={tab === 'Lead' ? 'Leads' : tab === 'Student' ? 'Students' : tab === 'Trainer' ? 'Trainers' : tab === 'Employer' ? 'Employers' : tab}
                  onClick={() => setRoleFilter(tab)}
                  sx={{
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontWeight: 700,
                    bgcolor: active ? '#0F2C59' : '#F1F5F9',
                    color: active ? '#FFFFFF' : '#475569',
                    '&:hover': { bgcolor: active ? '#0F2C59' : '#E2E8F0' }
                  }}
                />
              );
            })}
          </Box>
          <IconButton
            size="small"
            aria-label="Scroll filters right"
            onClick={() => pillScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
            sx={{ p: 0.25, color: '#64748B' }}
          >
            <ChevronRightIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Contact List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredThreads.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
              No matching contacts found.
            </Typography>
          </Box>
        ) : (
          filteredThreads.map((t) => {
            const isSelected = activeThread?.key === t.key;
            const roleStyle = ROLE_COLORS[t.role] || ROLE_COLORS['New Inquiry'];
            const hasAd = Boolean(t.adReferral) || t.messages.some((m) => m.messageType === 'fb_ad_inquiry');
            return (
              <Box
                key={t.key}
                onClick={() => handleSelectThread(t)}
                sx={{
                  px: 1.5,
                  py: 1.15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.15,
                  borderBottom: '1px solid #F1F5F9',
                  bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  borderLeft: isSelected ? '3px solid #0F2C59' : '3px solid transparent',
                  transition: 'background-color 0.12s ease',
                  '&:hover': { bgcolor: isSelected ? '#EFF6FF' : '#F8FAFC' }
                }}
              >
                <Badge
                  badgeContent={t.unreadCount}
                  color="success"
                  overlap="circular"
                  invisible={!t.unreadCount}
                >
                  <Avatar
                    src={t.entity?.photo || t.entity?.photoUrl || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: roleStyle.bg,
                      color: roleStyle.color,
                      border: `1px solid ${roleStyle.border}`,
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}
                  >
                    {(t.name || 'W').slice(0, 2).toUpperCase()}
                  </Avatar>
                </Badge>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: t.unreadCount ? 800 : 700,
                        color: '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.67rem', flexShrink: 0 }}>
                      {formatTimeShort(t.lastTimestamp)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                    <Box
                      component="span"
                      sx={{
                        px: 0.65,
                        py: 0.1,
                        borderRadius: 1,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: roleStyle.bg,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        flexShrink: 0
                      }}
                    >
                      {t.role}
                    </Box>
                    {hasAd && (
                      <Box
                        component="span"
                        sx={{
                          px: 0.6,
                          py: 0.1,
                          borderRadius: 1,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          bgcolor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          flexShrink: 0
                        }}
                      >
                        FB Ad
                      </Box>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: t.unreadCount ? '#0F172A' : '#64748B',
                        fontWeight: t.unreadCount ? 700 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}
                    >
                      {t.lastMessage || t.phone}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );

  const renderWorkflowPanel = () => {
    if (!activeThread) return null;
    const roleStyle = ROLE_COLORS[activeThread.role] || ROLE_COLORS['New Inquiry'];
    const entity = activeThread.entity;

    return (
      <Box
        sx={{
          width: { xs: '100%', md: 310 },
          flexShrink: 0,
          borderLeft: { md: '1px solid #E2E8F0' },
          bgcolor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          p: 1.75,
          gap: 1.5
        }}
      >
        {/* Identity Summary Card */}
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar
              src={entity?.photo || entity?.photoUrl || undefined}
              sx={{ width: 44, height: 44, bgcolor: roleStyle.bg, color: roleStyle.color, fontWeight: 800 }}
            >
              {(activeThread.name || 'W').slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }} noWrap>
                {activeThread.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                {activeThread.phone}
              </Typography>
            </Box>
            <StatusBadge
              label={activeThread.role}
              tone={activeThread.role === 'Student' ? 'success' : activeThread.role === 'Lead' ? 'warning' : 'primary'}
            />
          </Box>
        </Paper>

        {workflowSavedMsg && (
          <Alert severity="success" sx={{ py: 0.25, borderRadius: 2 }}>
            {workflowSavedMsg}
          </Alert>
        )}

        {/* FB Ad Referral Card */}
        {activeThread.adReferral && (
          <Paper
            elevation={0}
            sx={{ p: 1.35, borderRadius: 2.5, border: '1px solid #BFDBFE', bgcolor: '#EFF6FF' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <CampaignIcon sx={{ fontSize: 16, color: '#1D4ED8' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
                Facebook Ad Referral
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              {activeThread.adReferral.headline || 'Click-to-WhatsApp Ad'}
            </Typography>
            {activeThread.adReferral.body && (
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.25 }}>
                {activeThread.adReferral.body}
              </Typography>
            )}
          </Paper>
        )}

        {/* Role-Specific Live Workflow */}
        {activeThread.role === 'Lead' && entity && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Lead Pipeline Workflow
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {['New Lead', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Lost / Cancelled'].map((st) => {
                const active = entity.stage === st;
                return (
                  <Chip
                    key={st}
                    size="small"
                    label={st}
                    onClick={() => handleSaveLeadWorkflow(st)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      bgcolor: active ? '#0F2C59' : '#F1F5F9',
                      color: active ? '#FFFFFF' : '#475569'
                    }}
                  />
                );
              })}
            </Box>
            <TextField
              size="small"
              type="date"
              label="Next Follow-up Date"
              InputLabelProps={{ shrink: true }}
              value={nextFollowUp || entity.nextFollowUp || ''}
              onChange={(e) => setNextFollowUp(e.target.value)}
            />
            <TextField
              size="small"
              multiline
              rows={2}
              label="Log Counselling Note"
              placeholder="Write call or WhatsApp discussion..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<NoteAddIcon />}
              onClick={() => handleSaveLeadWorkflow()}
              sx={{ fontWeight: 800 }}
            >
              Save Workflow Update
            </Button>
          </Paper>
        )}

        {activeThread.role === 'Student' && entity && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Trainee Fee & Academic Status
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, bgcolor: '#F8FAFC', p: 1, borderRadius: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>TGID</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{entity.tgid || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Status</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{entity.status || 'Active'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Paid</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                  Rs. {Number(entity.paidFee || 0).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Due</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: Number(entity.dueFee || 0) > 0 ? '#DC2626' : '#059669' }}>
                  Rs. {Number(entity.dueFee || 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PaymentsIcon />}
              onClick={() => handleSend(QUICK_TEMPLATES[1].build(activeThread))}
              sx={{ fontWeight: 800 }}
            >
              Send Fee Reminder via WA
            </Button>
          </Paper>
        )}

        {(activeThread.role === 'Trainer' || activeThread.role === 'Employer') && entity && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              {activeThread.role} Details
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {entity.specialization || entity.sector || entity.trade || 'Partner / Faculty'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {entity.email || entity.address || entity.location || 'Global Era Network'}
            </Typography>
          </Paper>
        )}

        {activeThread.role === 'New Inquiry' && (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E9D5FF', bgcolor: '#FAF5FF', display: 'flex', flexDirection: 'column', gap: 1.1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase' }}>
              Unsaved WhatsApp / Ad Visitor
            </Typography>
            <TextField
              size="small"
              label="Course Interest"
              value={newLeadCourse}
              onChange={(e) => setNewLeadCourse(e.target.value)}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={handleConvertVisitorToLead}
              sx={{ bgcolor: '#7E22CE', '&:hover': { bgcolor: '#6B21A8' }, fontWeight: 800 }}
            >
              Save as New Lead
            </Button>
          </Paper>
        )}

        {/* Call Outcome Tracker */}
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PhoneInTalkIcon sx={{ fontSize: 16, color: '#0F2C59' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase' }}>
              Phone Call Outcome Log
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {['Connected', 'No Answer', 'Busy', 'Call Back Later'].map((st) => (
              <Chip
                key={st}
                size="small"
                label={st}
                onClick={() => setCallOutcome(st)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  bgcolor: callOutcome === st ? '#0F2C59' : '#F1F5F9',
                  color: callOutcome === st ? '#FFFFFF' : '#475569'
                }}
              />
            ))}
          </Box>
          <TextField
            size="small"
            placeholder="Call summary note..."
            value={callNote}
            onChange={(e) => setCallNote(e.target.value)}
          />
          <Button size="small" variant="outlined" startIcon={<PhoneInTalkIcon />} onClick={handleLogCall} sx={{ fontWeight: 800 }}>
            Log Phone Call
          </Button>
        </Paper>
      </Box>
    );
  };

  const renderCenterPane = () => {
    if (!activeThread) {
      return (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', p: 4 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
            <WhatsAppIcon sx={{ fontSize: 48, color: '#16A34A', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Select a Conversation
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Choose any Lead, Student, Trainer, Employer, or FB Ad inquiry from the left list to start chatting and managing workflows.
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F1F5F9', minWidth: 0, height: '100%', minHeight: 0 }}>
        {/* Chat Header */}
        <Box
          sx={{
            px: 1.75,
            py: 1.1,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setMobileView('list')} aria-label="Back to list">
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.8rem' }}>
              {(activeThread.name || 'W').slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }} noWrap>
                {activeThread.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                {activeThread.phone} • {activeThread.role}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
            <Tooltip title={activeThread.botPaused ? 'Resume Auto-Bot' : 'Pause Auto-Bot (Human Takeover)'}>
              <Chip
                size="small"
                icon={<SmartToyIcon sx={{ fontSize: 15 }} />}
                label={activeThread.botPaused ? 'Bot Paused' : 'Auto-Bot ON'}
                onClick={() => toggleBotPause(activeThread.phone, !activeThread.botPaused)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  bgcolor: activeThread.botPaused ? '#FEF2F2' : '#ECFDF5',
                  color: activeThread.botPaused ? '#B91C1C' : '#047857'
                }}
              />
            </Tooltip>
            <Tooltip title="Call">
              <IconButton
                size="small"
                component="a"
                href={`tel:${activeThread.phone}`}
                sx={{ bgcolor: '#EFF6FF', color: '#0F2C59' }}
              >
                <CallIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isMobile && (
              <Tooltip title="Open Workflow Panel">
                <IconButton
                  size="small"
                  onClick={() => setMobileWorkflowOpen(true)}
                  sx={{ bgcolor: '#F1F5F9', color: '#0F2C59' }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Chat Messages Scroll Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.1,
            backgroundImage: 'radial-gradient(rgba(15, 44, 89, 0.04) 1px, transparent 1px)',
            backgroundSize: '18px 18px'
          }}
        >
          {activeThread.messages.length === 0 ? (
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', borderRadius: 2.5, mx: 'auto', my: 3, maxWidth: 340, border: '1px dashed #CBD5E1' }}>
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
                No messages logged yet with {activeThread.name}.
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                Use a Quick Template or type a message below to start via WhatsApp Cloud API.
              </Typography>
            </Paper>
          ) : (
            activeThread.messages.map((m, idx) => {
              const isOutbound = m.direction === 'outbound';
              const prevMsg = idx > 0 ? activeThread.messages[idx - 1] : null;
              const currDay = m.createdAt ? new Date(m.createdAt).toDateString() : '';
              const prevDay = prevMsg?.createdAt ? new Date(prevMsg.createdAt).toDateString() : '';
              const showDateDivider = currDay && currDay !== prevDay;
              return (
                <React.Fragment key={m.id}>
                  {showDateDivider && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.75 }}>
                      <Chip
                        size="small"
                        label={formatDateDivider(m.createdAt)}
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor: '#E2E8F0',
                          color: '#334155'
                        }}
                      />
                    </Box>
                  )}
                  <Box
                    sx={{
                      alignSelf: isOutbound ? 'flex-end' : 'flex-start',
                      maxWidth: { xs: '88%', sm: '74%' },
                      bgcolor: isOutbound ? '#DCFCE7' : '#FFFFFF',
                      color: '#0F172A',
                      px: 1.5,
                      py: 1,
                      borderRadius: isOutbound ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      border: isOutbound ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
                    }}
                  >
                  {m.messageType === 'auto_bot' && (
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#047857', fontSize: '0.66rem', mb: 0.25 }}>
                      🤖 Auto-Bot Reply
                    </Typography>
                  )}
                  {m.messageType === 'fb_ad_inquiry' && (
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#1D4ED8', fontSize: '0.66rem', mb: 0.25 }}>
                      📢 Facebook Ad Inquiry
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.84rem', lineHeight: 1.45 }}>
                    {m.content}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.4 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.64rem' }}>
                      {formatTimeShort(m.createdAt)}
                    </Typography>
                    {isOutbound && (
                      m.status === 'failed' ? (
                        <ErrorOutlineIcon sx={{ fontSize: 13, color: '#DC2626' }} />
                      ) : m.status === 'read' ? (
                        <DoneAllIcon sx={{ fontSize: 14, color: '#2563EB' }} />
                      ) : m.status === 'delivered' ? (
                        <DoneAllIcon sx={{ fontSize: 14, color: '#64748B' }} />
                      ) : (
                        <DoneIcon sx={{ fontSize: 13, color: '#64748B' }} />
                      )
                    )}
                  </Box>
                  </Box>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Box>

        {sendFeedback && (
          <Alert severity={sendFeedback.type} onClose={() => setSendFeedback(null)} sx={{ mx: 1.5, mb: 1, borderRadius: 2 }}>
            {sendFeedback.text}
          </Alert>
        )}

        {/* 1-Click ERP Quick Share Bar + Dual Channel Switcher */}
        <Box
          sx={{
            px: 1.25,
            py: 0.75,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, overflowX: 'auto', flex: 1 }}>
            <Chip
              size="small"
              icon={<MenuBookIcon sx={{ fontSize: 14 }} />}
              label="Brochure"
              onClick={() => handleQuickShare('brochure')}
              disabled={sending}
              sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
            />
            <Chip
              size="small"
              icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
              label="Location"
              onClick={() => handleQuickShare('location')}
              disabled={sending}
              sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#ECFDF5', color: '#047857' }}
            />
            <Chip
              size="small"
              icon={<PaymentsIcon sx={{ fontSize: 14 }} />}
              label="Fee Info"
              onClick={() => handleQuickShare('fee')}
              disabled={sending}
              sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#FFFBEB', color: '#B45309' }}
            />
            {activeThread.role === 'Student' && (
              <Chip
                size="small"
                icon={<WorkspacePremiumIcon sx={{ fontSize: 14 }} />}
                label="Cert Link"
                onClick={() => handleQuickShare('certificate')}
                disabled={sending}
                sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#FAF5FF', color: '#7E22CE' }}
              />
            )}
          </Box>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={sendChannel}
            onChange={(_, v) => v && setSendChannel(v)}
            aria-label="Select messaging channel"
          >
            <ToggleButton value="WhatsApp" sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>
              <WhatsAppIcon sx={{ fontSize: 14, mr: 0.4, color: '#16A34A' }} />
              WA
            </ToggleButton>
            <ToggleButton value="SMS" sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>
              <SmsIcon sx={{ fontSize: 14, mr: 0.4, color: '#0284C7' }} />
              SMS
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Composer Bar */}
        <Box
          sx={{
            p: 1.25,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.75
          }}
        >
          <Tooltip title="Quick Templates & Meta Approved Template">
            <IconButton
              size="small"
              onClick={(e) => setTemplateAnchor(e.currentTarget)}
              sx={{ bgcolor: '#EFF6FF', color: '#0F2C59', mb: 0.25 }}
            >
              <BoltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send PDF / Document URL">
            <IconButton
              size="small"
              onClick={() => setDocModalOpen(true)}
              sx={{ bgcolor: '#F1F5F9', color: '#475569', mb: 0.25 }}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={templateAnchor}
            open={Boolean(templateAnchor)}
            onClose={() => setTemplateAnchor(null)}
          >
            {QUICK_TEMPLATES.map((tpl) => (
              <MenuItem
                key={tpl.id}
                onClick={() => {
                  setDraft(tpl.build(activeThread));
                  setTemplateAnchor(null);
                }}
              >
                {tpl.label}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              onClick={() => {
                setTemplateAnchor(null);
                setTplModalOpen(true);
              }}
              sx={{ fontWeight: 700, color: '#0F2C59' }}
            >
              Send Meta Approved Template (24h+)...
            </MenuItem>
          </Menu>

          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              sendChannel === 'SMS'
                ? `Send Aakash SMS to ${activeThread.name}...`
                : `Message ${activeThread.name} via WhatsApp Cloud API...`
            }
          />

          <Button
            variant="contained"
            disabled={sending || !draft.trim()}
            onClick={() => handleSend()}
            endIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
            sx={{
              bgcolor: sendChannel === 'SMS' ? '#0284C7' : '#16A34A',
              '&:hover': { bgcolor: sendChannel === 'SMS' ? '#0369A1' : '#15803D' },
              fontWeight: 800,
              px: 2,
              py: 0.85,
              flexShrink: 0
            }}
          >
            {sendChannel === 'SMS' ? 'Send SMS' : 'Send'}
          </Button>
        </Box>

        {/* Attach Document URL Dialog */}
        <Dialog open={docModalOpen} onClose={() => setDocModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Send Document / PDF via WhatsApp</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              size="small"
              label="Public PDF / Document URL"
              required
              placeholder="https://..."
              value={docForm.url}
              onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
            />
            <TextField
              size="small"
              label="File Name"
              value={docForm.filename}
              onChange={(e) => setDocForm({ ...docForm, filename: e.target.value })}
            />
            <TextField
              size="small"
              label="Caption (Optional)"
              value={docForm.caption}
              onChange={(e) => setDocForm({ ...docForm, caption: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendDocument} disabled={sending || !docForm.url.trim()}>
              Send Document
            </Button>
          </DialogActions>
        </Dialog>

        {/* Meta Approved Template Dialog */}
        <Dialog open={tplModalOpen} onClose={() => setTplModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Send Meta Approved Template</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Use an approved template name from Meta WhatsApp Manager to re-open conversations older than 24 hours.
            </Typography>
            <TextField
              size="small"
              label="Template Name"
              required
              value={metaTplForm.name}
              onChange={(e) => setMetaTplForm({ ...metaTplForm, name: e.target.value })}
            />
            <TextField
              size="small"
              label="Language Code"
              value={metaTplForm.language}
              onChange={(e) => setMetaTplForm({ ...metaTplForm, language: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTplModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendMetaTemplate} disabled={sending || !metaTplForm.name.trim()}>
              Send Template
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        height,
        borderRadius: 2.5,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        bgcolor: '#FFFFFF'
      }}
    >
      {isMobile ? (
        <>
          {mobileView === 'list' ? renderLeftPane() : renderCenterPane()}
          <Drawer
            anchor="right"
            open={mobileWorkflowOpen}
            onClose={() => setMobileWorkflowOpen(false)}
            PaperProps={{ sx: { width: '88vw', maxWidth: 340 } }}
          >
            {renderWorkflowPanel()}
          </Drawer>
        </>
      ) : (
        <>
          {renderLeftPane()}
          {renderCenterPane()}
          {renderWorkflowPanel()}
        </>
      )}
    </Paper>
  );
}
