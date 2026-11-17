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
  Grid
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
import { ResponsiveDataView, StatusBadge, EntityCard } from '../common';
import WhatsAppWorkspace from './WhatsAppWorkspace';
import { loadDB, saveDB, logCommunication } from '../../services/storage';
import {
  fetchRemoteWhatsAppData,
  buildWhatsAppHubState,
  sendMetaWhatsAppMessage,
  sendWhatsAppAbsenceAlertDirect,
  getWhatsAppSettings
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
    'Namaste! This is an update from Prabidhik School (Global Era Technical School), Jorpati. Contact 014910715 for any queries.'
  );
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const waSettings = useMemo(() => getWhatsAppSettings(), [db]);

  const syncHub = useCallback(async () => {
    setRefreshing(true);
    try {
      setDb(loadDB());
      const remote = await fetchRemoteWhatsAppData();
      setRemoteData(remote);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    </Box>
  );
}
