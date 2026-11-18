import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ForumIcon from '@mui/icons-material/Forum';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TranslateIcon from '@mui/icons-material/Translate';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { ResponsiveDataView, StatusBadge, EntityCard } from '../common';
import WhatsAppWorkspace from './WhatsAppWorkspace';
import { loadDB, logCommunication } from '../../services/storage';
import {
  fetchRemoteWhatsAppData,
  buildWhatsAppHubState,
  sendMetaWhatsAppMessage,
  sendWhatsAppAbsenceAlertDirect,
  getWhatsAppSettings,
  getWhatsAppTemplates,
  saveWhatsAppTemplates,
  resetWhatsAppTemplates,
  getBotSettings,
  saveBotSettings,
  fetchRemoteBotSettings,
  testGeminiConnection,
  simulateGeminiCounselorTurn
} from '../../services/whatsappCloudApi';

const STATUS_TONE = {
  received: 'info',
  sent: 'primary',
  delivered: 'teal',
  read: 'success',
  failed: 'error'
};

export default function WhatsAppHubManager() {
  const [db, setDb] = useState(() => loadDB());
  const [remoteData, setRemoteData] = useState({ logs: [], inbound: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [jumpPhone, setJumpPhone] = useState(null);

  // Tracking filters
  const [logSearch, setLogSearch] = useState('');
  const [dirFilter, setDirFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Broadcast state
  const [broadcastGroup, setBroadcastGroup] = useState('DUE_STUDENTS');
  const [broadcastText, setBroadcastText] = useState(
    'नमस्ते! ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी) बाट महत्वपूर्ण जानकारी। सम्पर्क: 01-4910715 / 9803614574'
  );
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Custom Nepali Templates state
  const [templates, setTemplates] = useState(() => getWhatsAppTemplates());
  const [tplSearch, setTplSearch] = useState('');
  const [tplDialogOpen, setTplDialogOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState({ key: '', title: '', category: 'Custom', slashCmd: '', body: '', isSystem: false });

  // Auto-Bot & Gemini AI Counselor settings
  const [botCfg, setBotCfg] = useState(() => getBotSettings());
  const [botSaving, setBotSaving] = useState(false);
  const [botTesting, setBotTesting] = useState(false);
  const [botSavedMsg, setBotSavedMsg] = useState(null);

  const waSettings = useMemo(() => getWhatsAppSettings(), [db]);

  const syncHub = useCallback(async () => {
    setRefreshing(true);
    try {
      setDb(loadDB());
      setTemplates(getWhatsAppTemplates());
      const [remote, remoteBot] = await Promise.all([
        fetchRemoteWhatsAppData(),
        fetchRemoteBotSettings()
      ]);
      setRemoteData(remote);
      setBotCfg(remoteBot);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSaveBotSettings = async () => {
    setBotSaving(true);
    setBotSavedMsg(null);
    try {
      const saved = await saveBotSettings(botCfg);
      setBotCfg(saved);
      setBotSavedMsg({
        severity: 'success',
        text: saved.syncedRemote
          ? 'Auto-Bot & Gemini AI Counselor settings saved and synced to Supabase.'
          : 'Saved locally (Supabase not connected).'
      });
    } catch (err) {
      setBotSavedMsg({ severity: 'error', text: err?.message || 'Failed to save bot settings.' });
    } finally {
      setBotSaving(false);
    }
  };

  const handleTestGemini = async () => {
    setBotTesting(true);
    setBotSavedMsg(null);
    try {
      const res = await testGeminiConnection(botCfg.geminiApiKey);
      setBotSavedMsg({
        severity: 'success',
        text: `Gemini AI connected successfully (${res.model}). Click "Save Bot & AI Settings" to activate.`
      });
    } catch (err) {
      setBotSavedMsg({
        severity: 'error',
        text: `Gemini test failed: ${err?.message || 'Unknown error'}`
      });
    } finally {
      setBotTesting(false);
    }
  };

  // Live AI Counselor Test Sandbox state
  const [sandboxMessages, setSandboxMessages] = useState([
    {
      role: 'model',
      text: 'नमस्ते! म ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी) को २४/७ AI Counselor हुँ। म तपाईंलाई केयरगिभर, टेलरिङ, ब्युटिसियन कोर्स, शुल्क वा भर्नाबारे के जानकारी दिन सक्छु?'
    }
  ]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState(null);
  const [sandboxLeadDetected, setSandboxLeadDetected] = useState(null);

  const handleSendSandboxMessage = async (customText) => {
    const text = (customText || sandboxInput).trim();
    if (!text || sandboxLoading) return;

    const userMsg = { role: 'user', text };
    const nextMessages = [...sandboxMessages, userMsg];
    setSandboxMessages(nextMessages);
    setSandboxInput('');
    setSandboxLoading(true);
    setSandboxError(null);

    // Check admission lead intent simulation
    const lower = text.toLowerCase();
    if (
      lower.includes('भर्ना') ||
      lower.includes('admission') ||
      lower.includes('apply') ||
      lower.includes('आउँछु') ||
      lower.includes('join') ||
      lower === '4'
    ) {
      setSandboxLeadDetected({
        title: 'High Priority Admission Lead Intent Detected!',
        detail: `Visitor indicated admission/consultation intent ("${text}"). Auto-lead capture creates a high-priority lead in CRM and alerts counseling staff.`
      });
    }

    try {
      const res = await simulateGeminiCounselorTurn({
        messages: nextMessages,
        userInput: text,
        customInstructions: botCfg.aiInstructions
      });
      setSandboxMessages((prev) => [...prev, { role: 'model', text: res.reply, model: res.model }]);
    } catch (err) {
      setSandboxError(err?.message || 'Failed to get AI Counselor reply.');
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleResetSandbox = () => {
    setSandboxMessages([
      {
        role: 'model',
        text: 'नमस्ते! म ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी) को २४/७ AI Counselor हुँ। म तपाईंलाई केयरगिभर, टेलरिङ, ब्युटिसियन कोर्स, शुल्क वा भर्नाबारे के जानकारी दिन सक्छु?'
      }
    ]);
    setSandboxLeadDetected(null);
    setSandboxError(null);
  };

  useEffect(() => {
    syncHub();
    const onDbUpdate = () => setDb(loadDB());
    window.addEventListener('kite_db_updated', onDbUpdate);
    const timer = setInterval(syncHub, 20000);
    return () => {
      window.removeEventListener('kite_db_updated', onDbUpdate);
      clearInterval(timer);
    };
  }, [syncHub]);

  const hubState = useMemo(() => buildWhatsAppHubState(db, remoteData), [db, remoteData]);

  const fbAdThreads = useMemo(
    () =>
      hubState.threads.filter(
        (t) => Boolean(t.adReferral) || t.messages.some((m) => m.messageType === 'fb_ad_inquiry')
      ),
    [hubState.threads]
  );

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return hubState.auditLogs.filter((lg) => {
      if (dirFilter !== 'All' && lg.direction !== dirFilter) return false;
      if (statusFilter !== 'All' && lg.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (lg.contactName || '').toLowerCase().includes(q) ||
        (lg.phone || '').toLowerCase().includes(q) ||
        (lg.content || '').toLowerCase().includes(q)
      );
    });
  }, [hubState.auditLogs, logSearch, dirFilter, statusFilter]);

  const handleExportLogsCsv = () => {
    const headers = ['DateTime', 'Contact', 'Role', 'Phone', 'Direction', 'Type', 'Status', 'Message'];
    const rows = filteredLogs.map((r) => [
      r.createdAt || '',
      `"${(r.contactName || '').replace(/"/g, '""')}"`,
      r.contactRole || '',
      r.phone || '',
      r.direction || '',
      r.messageType || '',
      r.status || '',
      `"${(r.content || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp_tracking_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunBroadcast = async () => {
    let recipients = [];
    if (broadcastGroup === 'DUE_STUDENTS') {
      recipients = (db.students || []).filter((s) => Number(s.dueFee || 0) > 0 && s.phone);
    } else if (broadcastGroup === 'ACTIVE_LEADS') {
      recipients = (db.leads || []).filter((l) => l.stage !== 'Converted' && l.stage !== 'Lost / Cancelled' && l.phone);
    } else if (broadcastGroup === 'ALL_STUDENTS') {
      recipients = (db.students || []).filter((s) => s.phone);
    }

    if (recipients.length === 0) {
      setBroadcastResult({ type: 'warning', text: 'No recipients with valid phone numbers found in this segment.' });
      return;
    }

    setBroadcasting(true);
    setBroadcastResult(null);
    let sent = 0;
    let failed = 0;
    for (const r of recipients.slice(0, 25)) {
      try {
        await sendMetaWhatsAppMessage({ to: r.phone, type: 'text', text: broadcastText });
        logCommunication(loadDB(), {
          recipientType: broadcastGroup === 'ACTIVE_LEADS' ? 'Lead' : 'Student',
          recipientId: r.id,
          recipientName: r.name,
          recipientPhone: r.phone,
          channel: 'WhatsApp',
          messageText: broadcastText
        });
        sent += 1;
      } catch {
        failed += 1;
      }
    }
    setBroadcasting(false);
    setBroadcastResult({
      type: failed === 0 ? 'success' : 'warning',
      text: `Broadcast completed: ${sent} sent${failed > 0 ? `, ${failed} failed` : ''}.`
    });
    syncHub();
  };

  const handleSendAbsentAlertsToday = async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecs = (db.attendance || []).filter((a) => a.date === todayStr && a.status === 'A');
    if (todayRecs.length === 0) {
      setBroadcastResult({ type: 'info', text: `No students marked Absent today (${todayStr}).` });
      return;
    }
    setBroadcasting(true);
    setBroadcastResult(null);
    let sent = 0;
    for (const rec of todayRecs.slice(0, 25)) {
      const std = (db.students || []).find((s) => s.id === rec.studentId);
      const grp = (db.trainingGroups || []).find((g) => g.id === (std?.groupId || std?.trainingGroupId));
      const phone = std?.guardianPhone || std?.parentPhone || std?.phone;
      if (!phone) continue;
      try {
        await sendWhatsAppAbsenceAlertDirect(phone, std, grp, todayStr);
        sent += 1;
      } catch {
        // continue remaining alerts
      }
    }
    setBroadcasting(false);
    setBroadcastResult({ type: 'success', text: `Sent ${sent} absent alert(s) for ${todayStr}.` });
    syncHub();
  };

  const outboundLogs = useMemo(() => hubState.auditLogs.filter((l) => l.direction === 'outbound'), [hubState.auditLogs]);
  const deliveredCount = useMemo(
    () => outboundLogs.filter((l) => l.status === 'delivered' || l.status === 'read' || l.status === 'sent').length,
    [outboundLogs]
  );
  const deliveryRate = outboundLogs.length > 0 ? Math.round((deliveredCount / outboundLogs.length) * 100) : 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Executive Header + KPI Strip */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.75, sm: 2.25 },
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <WhatsAppIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                WhatsApp Command Center & Message Tracking
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Live Cloud API (+977 980-3614574) • Leads, Students, Trainers, Employers & FB Ads
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusBadge label="Cloud API Connected" tone="success" showDot />
            <Button
              size="small"
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
              onClick={syncHub}
              disabled={refreshing}
            >
              Sync Live
            </Button>
          </Box>
        </Box>

        <Grid container spacing={1.25}>
          {[
            { label: 'Active Contacts', value: hubState.threads.length, color: '#0F2C59', bg: '#EFF6FF' },
            { label: 'Unread Replies', value: hubState.totalUnread, color: '#15803D', bg: '#DCFCE7' },
            { label: 'Tracked Messages', value: hubState.auditLogs.length, color: '#0369A1', bg: '#F0F9FF' },
            { label: 'FB Ad Inquiries', value: fbAdThreads.length, color: '#7E22CE', bg: '#FAF5FF' }
          ].map((kpi) => (
            <Grid item xs={6} sm={3} key={kpi.label}>
              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: kpi.bg, border: '1px solid rgba(15,23,42,0.06)' }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block' }}>
                  {kpi.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>
                  {kpi.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mt: 1.5, borderTop: '1px solid #F1F5F9' }}
        >
          <Tab icon={<ForumIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Live 3-Pane Inbox" />
          <Tab icon={<FactCheckIcon sx={{ fontSize: 17 }} />} iconPosition="start" label={`Message Tracking (${hubState.auditLogs.length})`} />
          <Tab icon={<CampaignIcon sx={{ fontSize: 17 }} />} iconPosition="start" label={`FB Ad Inquiries (${fbAdThreads.length})`} />
          <Tab icon={<SendIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Broadcast & Bot Info" />
          <Tab icon={<TranslateIcon sx={{ fontSize: 17 }} />} iconPosition="start" label={`Nepali Templates (${templates.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: Live 3-Pane Workspace */}
      {activeTab === 0 && (
        <WhatsAppWorkspace
          threads={hubState.threads}
          onRefresh={syncHub}
          refreshing={refreshing}
          height={{ xs: '74dvh', md: '68dvh' }}
          initialPhone={jumpPhone}
        />
      )}

      {/* TAB 1: Systematic Message Tracking & Delivery Audit */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
              <TextField
                size="small"
                placeholder="Search contact, phone, message..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 240 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 17, color: '#64748B' }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                select
                size="small"
                label="Direction"
                value={dirFilter}
                onChange={(e) => setDirFilter(e.target.value)}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="inbound">Inbound</MenuItem>
                <MenuItem value="outbound">Outbound</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </TextField>
            </Box>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportLogsCsv}>
              Export CSV
            </Button>
          </Box>

          <ResponsiveDataView
            rows={filteredLogs}
            enableDesktopCardToggle={true}
            emptyTitle="No message logs match your filter"
            emptySubtitle="Messages sent or received via Floating Window, Auto-Bot, or Bulk Broadcast appear here automatically."
            renderCard={(lg) => (
              <EntityCard
                accentColor={lg.direction === 'inbound' ? '#0284C7' : lg.status === 'failed' ? '#DC2626' : '#16A34A'}
                title={lg.contactName}
                code={lg.contactRole}
                subtitle={lg.phone}
                status={{ label: lg.status || 'sent', tone: STATUS_TONE[lg.status] || 'neutral', showDot: true }}
                onCardClick={() => {
                  setJumpPhone(lg.phone);
                  setActiveTab(0);
                }}
                fields={[
                  { label: 'Direction', value: lg.direction === 'inbound' ? 'Inbound' : 'Outbound' },
                  { label: 'Source / Type', value: lg.messageType || 'text' },
                  { label: 'Time', value: new Date(lg.createdAt).toLocaleString(), fullWidth: true },
                  { label: 'Message', value: lg.content, fullWidth: true, wrap: true }
                ]}
              />
            )}
            renderTable={() => (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Contact & Role</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Direction</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.slice(0, 150).map((lg) => (
                      <TableRow
                        key={lg.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setJumpPhone(lg.phone);
                          setActiveTab(0);
                        }}
                      >
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {new Date(lg.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{lg.contactName}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>{lg.contactRole}</Typography>
                        </TableCell>
                        <TableCell>{lg.phone}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={lg.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                            sx={{
                              fontWeight: 700,
                              bgcolor: lg.direction === 'inbound' ? '#F0F9FF' : '#ECFDF5',
                              color: lg.direction === 'inbound' ? '#0369A1' : '#047857'
                            }}
                          />
                        </TableCell>
                        <TableCell>{lg.messageType || 'text'}</TableCell>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Typography variant="body2" noWrap>{lg.content}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusBadge label={lg.status || 'sent'} tone={STATUS_TONE[lg.status] || 'neutral'} showDot />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          />
        </Paper>
      )}

      {/* TAB 2: Facebook Ad Inquiries Tracker */}
      {activeTab === 2 && (
        <ResponsiveDataView
          rows={fbAdThreads}
          defaultDesktopMode="card"
          enableDesktopCardToggle={true}
          emptyTitle="No Facebook Ad WhatsApp Inquiries Yet"
          emptySubtitle="When you run Click-to-WhatsApp Ads targeting +977 980-3614574, every inquiry and its Ad Headline will appear here automatically."
          renderCard={(t) => (
            <EntityCard
              accentColor="#2563EB"
              title={t.name}
              code={t.role}
              subtitle={t.phone}
              status={{ label: t.role === 'New Inquiry' ? 'Needs Lead Save' : t.role, tone: t.role === 'New Inquiry' ? 'warning' : 'success', showDot: true }}
              onCardClick={() => {
                setJumpPhone(t.phone);
                setActiveTab(0);
              }}
              fields={[
                { label: 'Ad Headline', value: t.adReferral?.headline || 'Facebook Ad Referral', fullWidth: true },
                { label: 'Last Message', value: t.lastMessage || '-', fullWidth: true }
              ]}
              primaryAction={{
                label: 'Open Chat',
                icon: <ForumIcon />,
                onClick: () => {
                  setJumpPhone(t.phone);
                  setActiveTab(0);
                }
              }}
            />
          )}
          renderTable={() => (
            <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Visitor</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>CRM Role</TableCell>
                      <TableCell>Ad Headline</TableCell>
                      <TableCell>Last Message</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fbAdThreads.map((t) => (
                      <TableRow key={t.key} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{t.name}</TableCell>
                        <TableCell>{t.phone}</TableCell>
                        <TableCell><StatusBadge label={t.role} tone="primary" /></TableCell>
                        <TableCell>{t.adReferral?.headline || 'Click-to-WhatsApp Ad'}</TableCell>
                        <TableCell sx={{ maxWidth: 260 }}><Typography variant="body2" noWrap>{t.lastMessage}</Typography></TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => { setJumpPhone(t.phone); setActiveTab(0); }}>
                            Open Chat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        />
      )}

      {/* TAB 3: Quick Broadcast & Bot Status */}
      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Quick Segment WhatsApp Broadcast
              </Typography>
              <TextField
                select
                size="small"
                label="Target Audience"
                value={broadcastGroup}
                onChange={(e) => setBroadcastGroup(e.target.value)}
              >
                <MenuItem value="DUE_STUDENTS">Students with Pending Fee Due</MenuItem>
                <MenuItem value="ACTIVE_LEADS">Active Counseling Leads</MenuItem>
                <MenuItem value="ALL_STUDENTS">All Enrolled Students</MenuItem>
              </TextField>
              <TextField
                size="small"
                multiline
                rows={4}
                label="Broadcast Message"
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
              />
              {broadcastResult && <Alert severity={broadcastResult.type}>{broadcastResult.text}</Alert>}
              <Button
                variant="contained"
                disabled={broadcasting || !broadcastText.trim()}
                onClick={handleRunBroadcast}
                startIcon={broadcasting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 800, alignSelf: 'flex-start' }}
              >
                {broadcasting ? 'Sending...' : 'Send Broadcast (Up to 25)'}
              </Button>
            </Paper>

            {/* Live AI Counselor Test Sandbox (Interactive 2-Way Simulator) */}
            <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2.5, border: '1px solid #C7D2FE', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToyIcon sx={{ color: '#4F46E5' }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E1B4B' }}>
                      Live AI Counselor Test Sandbox (Interactive 2-Way Simulator)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Test how Gemini AI converses in 2-way real time, remembers context, applies instructions, and detects leads before live WhatsApp delivery.
                    </Typography>
                  </Box>
                </Box>
                <Button size="small" variant="outlined" color="inherit" onClick={handleResetSandbox} sx={{ fontWeight: 700 }}>
                  Reset Chat
                </Button>
              </Box>

              {/* Quick sample prompt chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {[
                  'केयरगिभर तालिम कति महिनाको हो?',
                  'दैनिक सिफ्ट कति बजे हुन्छ?',
                  'शुल्क कति लाग्छ र तिर्ने तरिका के हो?',
                  'म भोलि भर्ना हुन आउँछु सिट छ कि छैन?'
                ].map((prompt) => (
                  <Chip
                    key={prompt}
                    label={prompt}
                    size="small"
                    clickable
                    disabled={sandboxLoading}
                    onClick={() => handleSendSandboxMessage(prompt)}
                    sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' }, fontSize: '0.75rem', fontWeight: 600 }}
                  />
                ))}
              </Box>

              {/* Chat messages viewport */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  maxHeight: 320,
                  minHeight: 200,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25
                }}
              >
                {sandboxMessages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <Box
                      key={idx}
                      sx={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: isUser ? '#1E293B' : '#FFFFFF',
                        color: isUser ? '#FFFFFF' : '#0F172A',
                        border: isUser ? 'none' : '1px solid #E2E8F0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, mb: 0.25, color: isUser ? '#94A3B8' : '#4F46E5' }}>
                        {isUser ? 'Visitor (You)' : `AI Counselor${m.model ? ` (${m.model})` : ''}`}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.85rem' }}>
                        {m.text}
                      </Typography>
                    </Box>
                  );
                })}
                {sandboxLoading && (
                  <Box sx={{ alignSelf: 'flex-start', p: 1, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} sx={{ color: '#4F46E5' }} />
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                      Gemini AI Counselor is thinking and drafting reply...
                    </Typography>
                  </Box>
                )}
              </Box>

              {sandboxLeadDetected && (
                <Alert severity="success" onClose={() => setSandboxLeadDetected(null)} sx={{ py: 0.5 }}>
                  <strong>{sandboxLeadDetected.title}</strong> — {sandboxLeadDetected.detail}
                </Alert>
              )}

              {sandboxError && (
                <Alert severity="error" onClose={() => setSandboxError(null)} sx={{ py: 0.5 }}>
                  {sandboxError}
                </Alert>
              )}

              {/* Input bar */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Type a visitor question in Nepali, Roman Nepali, or English..."
                  value={sandboxInput}
                  disabled={sandboxLoading}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendSandboxMessage();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  disabled={sandboxLoading || !sandboxInput.trim()}
                  onClick={() => handleSendSandboxMessage()}
                  sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontWeight: 700, px: 2.5 }}
                >
                  Send
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Auto-Pilot Event Triggers & Analytics
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box sx={{ p: 1.1, borderRadius: 2, bgcolor: '#EFF6FF' }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block' }}>Delivery Rate</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1D4ED8' }}>{deliveryRate}%</Typography>
                  </Box>
                  <Box sx={{ p: 1.1, borderRadius: 2, bgcolor: '#FAF5FF' }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block' }}>Outbound / Inbound</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#7E22CE' }}>
                      {outboundLogs.length} / {hubState.auditLogs.length - outboundLogs.length}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  disabled={broadcasting}
                  onClick={handleSendAbsentAlertsToday}
                  sx={{ fontWeight: 800 }}
                >
                  Send Today&apos;s Absent Alerts via WhatsApp
                </Button>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #C7D2FE', bgcolor: '#F8FAFF', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToyIcon sx={{ color: '#4F46E5' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E1B4B' }}>
                    Auto-Bot &amp; Gemini AI Counselor
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(botCfg.autoBotEnabled)}
                      onChange={(e) => setBotCfg((prev) => ({ ...prev, autoBotEnabled: e.target.checked }))}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Auto-Bot Enabled (24/7 Replies)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      color="secondary"
                      checked={Boolean(botCfg.aiCounselorEnabled)}
                      onChange={(e) => setBotCfg((prev) => ({ ...prev, aiCounselorEnabled: e.target.checked }))}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Gemini 2.5 Flash AI Counselor</Typography>}
                />
                <TextField
                  size="small"
                  type="password"
                  label="Gemini API Key (Optional if set in Vercel)"
                  placeholder="AIza... or AQ...."
                  value={botCfg.geminiApiKey || ''}
                  onChange={(e) => setBotCfg((prev) => ({ ...prev, geminiApiKey: e.target.value }))}
                  helperText="Stored in Supabase system settings; falls back to Vercel GEMINI_API_KEY."
                />
                <TextField
                  size="small"
                  multiline
                  rows={2}
                  label="Custom AI Instructions (Offers / New Batch Info)"
                  placeholder="e.g. New Barista & Cook batch starts Sunday 10 AM..."
                  value={botCfg.aiInstructions || ''}
                  onChange={(e) => setBotCfg((prev) => ({ ...prev, aiInstructions: e.target.value }))}
                />
                {botSavedMsg && (
                  <Alert severity={botSavedMsg.severity} onClose={() => setBotSavedMsg(null)}>
                    {botSavedMsg.text}
                  </Alert>
                )}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={botSaving || botTesting}
                    onClick={handleSaveBotSettings}
                    sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontWeight: 800 }}
                  >
                    {botSaving ? 'Saving...' : 'Save Bot & AI Settings'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={botSaving || botTesting}
                    onClick={handleTestGemini}
                    sx={{ fontWeight: 700 }}
                  >
                    {botTesting ? 'Testing AI...' : 'Test Gemini AI'}
                  </Button>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2.5, border: '1px solid #A7F3D0', bgcolor: '#ECFDF5', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: '#059669' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#065F46' }}>
                    Live Cloud API Configuration
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#047857' }}>
                  <strong>Phone Number ID:</strong> {waSettings.phoneNumberId}
                </Typography>
                <Typography variant="body2" sx={{ color: '#047857' }}>
                  <strong>WABA ID:</strong> {waSettings.wabaId}
                </Typography>
                <Typography variant="body2" sx={{ color: '#047857', wordBreak: 'break-all' }}>
                  <strong>Webhook URL:</strong> {waSettings.webhookUrl}
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* TAB 4: Custom Editable Nepali Templates Studio */}
      {activeTab === 4 && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Custom Nepali WhatsApp Message Templates
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Customize system messages, /slash commands, or add new templates. Changes sync across receipts, leads, and WhatsApp Hub.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Search templates..."
                value={tplSearch}
                onChange={(e) => setTplSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 17, color: '#64748B' }} />
                    </InputAdornment>
                  )
                }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={() => {
                  const reset = resetWhatsAppTemplates();
                  setTemplates(reset);
                }}
              >
                Reset Defaults
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingTpl({
                    key: `custom_${Date.now()}`,
                    title: '',
                    category: 'Custom',
                    slashCmd: '',
                    body: '',
                    isSystem: false
                  });
                  setTplDialogOpen(true);
                }}
                sx={{ fontWeight: 800 }}
              >
                Add Template
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={1.5}>
            {templates
              .filter((t) => {
                const q = tplSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  (t.title || '').toLowerCase().includes(q) ||
                  (t.category || '').toLowerCase().includes(q) ||
                  (t.body || '').toLowerCase().includes(q) ||
                  (t.slashCmd || '').toLowerCase().includes(q)
                );
              })
              .map((tpl) => (
                <Grid item xs={12} md={6} key={tpl.key}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      border: '1px solid #E2E8F0',
                      borderLeft: `4px solid ${tpl.isSystem ? '#0F2C59' : '#16A34A'}`,
                      bgcolor: '#F8FAFC',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }} noWrap>
                            {tpl.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                            <Chip size="small" label={tpl.category || 'General'} sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700 }} />
                            {tpl.slashCmd && (
                              <Chip size="small" label={tpl.slashCmd} color="primary" sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800 }} />
                            )}
                            <StatusBadge label={tpl.isSystem ? 'System' : 'Custom'} tone={tpl.isSystem ? 'info' : 'success'} />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <IconButton
                            size="small"
                            aria-label="Edit template"
                            onClick={() => {
                              setEditingTpl({ ...tpl });
                              setTplDialogOpen(true);
                            }}
                            sx={{ bgcolor: '#EFF6FF', color: '#0F2C59' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          {!tpl.isSystem && (
                            <IconButton
                              size="small"
                              aria-label="Delete template"
                              onClick={() => {
                                const next = templates.filter((item) => item.key !== tpl.key);
                                saveWhatsAppTemplates(next);
                                setTemplates(next);
                              }}
                              sx={{ bgcolor: '#FEF2F2', color: '#DC2626' }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.78rem',
                          color: '#334155',
                          bgcolor: '#FFFFFF',
                          p: 1,
                          borderRadius: 1.5,
                          border: '1px solid #E2E8F0',
                          maxHeight: 130,
                          overflowY: 'auto'
                        }}
                      >
                        {tpl.body}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
          </Grid>
        </Paper>
      )}

      {/* Edit / Add Custom Template Dialog */}
      <Dialog open={tplDialogOpen} onClose={() => setTplDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 800 }}>
          {editingTpl.isSystem ? `Edit System Template: ${editingTpl.title}` : 'Create / Edit Custom Nepali Template'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            size="small"
            label="Template Title"
            required
            value={editingTpl.title}
            onChange={(e) => setEditingTpl({ ...editingTpl, title: e.target.value })}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
            <TextField
              size="small"
              label="Category"
              value={editingTpl.category}
              onChange={(e) => setEditingTpl({ ...editingTpl, category: e.target.value })}
            />
            <TextField
              size="small"
              label="Slash Shortcut (Optional, e.g. /offer)"
              value={editingTpl.slashCmd || ''}
              onChange={(e) => setEditingTpl({ ...editingTpl, slashCmd: e.target.value })}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block', mb: 0.5 }}>
              Click to insert smart placeholder:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {['{name}', '{course}', '{amount}', '{totalFee}', '{paid}', '{due}', '{receiptNo}', '{date}', '{tgid}', '{verifyUrl}'].map((ph) => (
                <Chip
                  key={ph}
                  size="small"
                  label={ph}
                  onClick={() => setEditingTpl({ ...editingTpl, body: `${editingTpl.body || ''}${ph}` })}
                  sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
                />
              ))}
            </Box>
          </Box>
          <TextField
            size="small"
            multiline
            rows={7}
            label="Nepali Message Body"
            required
            value={editingTpl.body}
            onChange={(e) => setEditingTpl({ ...editingTpl, body: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTplDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!editingTpl.title.trim() || !editingTpl.body.trim()}
            onClick={() => {
              const exists = templates.some((t) => t.key === editingTpl.key);
              const next = exists
                ? templates.map((t) => (t.key === editingTpl.key ? editingTpl : t))
                : [editingTpl, ...templates];
              saveWhatsAppTemplates(next);
              setTemplates(next);
              setTplDialogOpen(false);
            }}
            sx={{ fontWeight: 800 }}
          >
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
