import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Checkbox,
  LinearProgress,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import FacebookIcon from '@mui/icons-material/Facebook';
import ForumIcon from '@mui/icons-material/Forum';
import { loadDB, saveDB, getNextSequentialId } from '../../services/storage';
import { sendFacebookReply, sendMetaWhatsAppMessage, openWhatsAppHubForContact } from '../../services/whatsappCloudApi';

const HANDLED_STORAGE_KEY = 'kite_fb_catchup_handled_v1';

function loadHandledSet() {
  try {
    const raw = localStorage.getItem(HANDLED_STORAGE_KEY);
    return new Set(JSON.parse(raw || '[]'));
  } catch {
    return new Set();
  }
}

function saveHandledSet(setObj) {
  try {
    localStorage.setItem(HANDLED_STORAGE_KEY, JSON.stringify(Array.from(setObj).slice(-1000)));
  } catch {}
}

function formatAgeLabel(ageHours = 0) {
  if (ageHours < 1) return 'Just now';
  if (ageHours < 24) return `${Math.round(ageHours)}h ago`;
  const days = Math.floor(ageHours / 24);
  return `${days}d ago`;
}

function buildSmartCatchUpDraft(item, db) {
  const name = (item?.senderName || '').split(' ')[0] || 'नमस्ते';
  const text = String(item?.message || '').toLowerCase();
  const institute = db?.settings?.instituteSub || 'Global Era Technical School';
  const phone = db?.settings?.contactPhone || '9851234567';
  const location = db?.settings?.location || 'Jorpati, Kathmandu';
  const courses = (db?.courses || []).map((c) => c.title).filter(Boolean);

  let matchedCourse = courses.find((title) => {
    const words = title.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
    return words.some((w) => text.includes(w));
  });
  if (!matchedCourse) {
    if (text.includes('beaut') || text.includes('parlour') || text.includes('makeup')) matchedCourse = 'Beautician Training';
    else if (text.includes('tailor') || text.includes('silai') || text.includes('cut')) matchedCourse = 'Tailoring Training';
    else if (text.includes('care') || text.includes('giver')) matchedCourse = 'Caregiver Training';
    else if (text.includes('barista') || text.includes('coffee')) matchedCourse = 'Barista Training';
  }

  if (item?.type === 'fb_comment') {
    const courseLine = matchedCourse ? `${matchedCourse} को` : 'हाम्रो CTEVT मान्यताप्राप्त तालिमको';
    return `नमस्ते ${name} ज्यू! ${courseLine} सम्पूर्ण जानकारी (फी, समय र नयाँ ब्याच) का लागि कृपया हामीलाई Inbox गर्नुहोस् वा WhatsApp/Call (${phone}) मा सम्पर्क गर्नुहोस्। स्थान: ${location} — ${institute}`;
  }

  if (item?.extractedPhone) {
    const courseLine = matchedCourse ? `${matchedCourse} सम्बन्धी` : 'तालिम सम्बन्धी';
    return `नमस्ते ${name} ज्यू! तपाईंले ${institute} को Facebook पेजमा ${courseLine} सोधपुछ गर्नुभएको थियो। नयाँ ब्याच, शुल्क र कक्षा समयको पूर्ण जानकारी दिन हामी WhatsApp मा जोडिएका छौँ। के तपाईं बिहान वा दिउँसो कुन सिफ्टमा इच्छुक हुनुहुन्छ? (${location})`;
  }

  const courseLine = matchedCourse ? `${matchedCourse} को` : 'हाम्रो नयाँ ब्याचको';
  return `नमस्ते ${name} ज्यू! ढिलो जवाफका लागि क्षमाप्रार्थी छौँ। ${courseLine} नयाँ भर्ना खुलिरहेको छ (${location})। कृपया तपाईंको फोन/WhatsApp नम्बर दिनुहोला वा ${phone} मा सम्पर्क गर्नुहोला — ${institute}`;
}

export default function FacebookCatchUpModal({ open, onClose, onRefreshHub }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tab, setTab] = useState(0);
  const [postLimit, setPostLimit] = useState(25);
  const [ageFilterDays, setAgeFilterDays] = useState(30); // 7 | 30 | 0 (All)
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusBanner, setStatusBanner] = useState(null);

  const [handledIds, setHandledIds] = useState(() => loadHandledSet());
  const [drafts, setDrafts] = useState({});
  const [selectedCommentIds, setSelectedCommentIds] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [batchProgress, setBatchProgress] = useState({ running: false, current: 0, total: 0 });

  const db = useMemo(() => loadDB(), [open, scanResult]);

  const markHandled = (id) => {
    setHandledIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveHandledSet(next);
      return next;
    });
  };

  const handleScan = async () => {
    setScanning(true);
    setErrorMsg('');
    setStatusBanner(null);
    try {
      const currentDb = loadDB();
      const pageToken = currentDb?.settings?.whatsappBot?.fbPageAccessToken || '';
      const res = await fetch('/api/facebook-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postLimit, convLimit: 60, pageToken })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to scan Facebook Page backlog.');
      }
      setScanResult(data);

      // Pre-fill smart AI drafts for all fetched items
      const nextDrafts = {};
      const allItems = [
        ...(data.comments || []),
        ...(data.messenger24h || []),
        ...(data.messengerOldWithPhone || []),
        ...(data.messengerOldNoPhone || [])
      ];
      allItems.forEach((it) => {
        nextDrafts[it.id] = buildSmartCatchUpDraft(it, currentDb);
      });
      setDrafts((prev) => ({ ...nextDrafts, ...prev }));
      setSelectedCommentIds([]);
    } catch (err) {
      setErrorMsg(err?.message || 'Facebook scan failed.');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (open && !scanResult && !scanning) {
      handleScan();
    }
  }, [open]);

  const filterByAge = (list = []) => {
    return list.filter((item) => {
      if (handledIds.has(item.id)) return false;
      if (ageFilterDays > 0 && (item.ageHours || 0) > ageFilterDays * 24) return false;
      return true;
    });
  };

  const visibleComments = useMemo(() => filterByAge(scanResult?.comments || []), [scanResult, handledIds, ageFilterDays]);
  const visibleMessenger24h = useMemo(() => (scanResult?.messenger24h || []).filter((i) => !handledIds.has(i.id)), [scanResult, handledIds]);
  const visibleOldWithPhone = useMemo(() => filterByAge(scanResult?.messengerOldWithPhone || []), [scanResult, handledIds, ageFilterDays]);
  const visibleOldNoPhone = useMemo(() => filterByAge(scanResult?.messengerOldNoPhone || []), [scanResult, handledIds, ageFilterDays]);

  // 1. Send single comment or <24h messenger reply
  const handleSendDirectReply = async (item) => {
    const text = String(drafts[item.id] || '').trim();
    if (!text) return;
    setBusyId(item.id);
    setStatusBanner(null);
    try {
      await sendFacebookReply({
        targetId: item.type === 'fb_comment' ? item.id : item.psid,
        targetName: item.senderName,
        channel: item.type === 'fb_comment' ? 'fb_comment' : 'messenger',
        text,
        messageType: 'catchup_reply'
      });
      markHandled(item.id);
      setSelectedCommentIds((prev) => prev.filter((id) => id !== item.id));
      setStatusBanner({ type: 'success', text: `Reply sent to ${item.senderName}!` });
      onRefreshHub?.();
    } catch (err) {
      setStatusBanner({ type: 'error', text: err?.message || 'Failed to send reply.' });
    } finally {
      setBusyId(null);
    }
  };

  // 2. Safe Batch Send Selected Comments (3s anti-spam delay, max 20)
  const handleBatchSendComments = async () => {
    const targets = visibleComments.filter((c) => selectedCommentIds.includes(c.id)).slice(0, 20);
    if (!targets.length) return;
    setBatchProgress({ running: true, current: 0, total: targets.length });
    setStatusBanner(null);
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < targets.length; i += 1) {
      const c = targets[i];
      const text = String(drafts[c.id] || '').trim();
      setBatchProgress({ running: true, current: i + 1, total: targets.length });
      if (!text) continue;
      try {
        await sendFacebookReply({
          targetId: c.id,
          targetName: c.senderName,
          channel: 'fb_comment',
          text,
          messageType: 'catchup_reply'
        });
        markHandled(c.id);
        sent += 1;
      } catch {
        failed += 1;
      }
      if (i < targets.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    setSelectedCommentIds([]);
    setBatchProgress({ running: false, current: 0, total: 0 });
    setStatusBanner({
      type: failed ? 'warning' : 'success',
      text: `Batch complete: ${sent} comment replies sent safely${failed ? `, ${failed} failed` : ''}.`
    });
    onRefreshHub?.();
  };

  // 3. Save Lead + Send WhatsApp (for 24h+ Messenger with extracted phone)
  const handleSaveLeadAndWhatsApp = async (item) => {
    const phone = item.extractedPhone;
    const text = String(drafts[item.id] || '').trim();
    if (!phone) return;
    setBusyId(item.id);
    setStatusBanner(null);
    try {
      const currentDb = loadDB();
      const cleanLast10 = phone.replace(/\D/g, '').slice(-10);
      const existingLead = (currentDb.leads || []).find(
        (l) => String(l.phone || '').replace(/\D/g, '').slice(-10) === cleanLast10
      );

      let nextLeads = [...(currentDb.leads || [])];
      if (!existingLead) {
        const newLead = {
          id: getNextSequentialId(nextLeads, 'LD-', 3, 'id', 1),
          name: item.senderName || 'Facebook Inquiry',
          phone,
          source: 'Facebook Backlog',
          stage: 'Contacted',
          status: 'Contacted',
          interestedCourseId: currentDb.courses?.[0]?.id || '',
          notes: `Recovered from FB Messenger: "${item.message}"`,
          createdAt: new Date().toISOString(),
          nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
        };
        nextLeads = [newLead, ...nextLeads];
        saveDB({ ...currentDb, leads: nextLeads });
      }

      // Attempt WhatsApp send; if 24h WhatsApp session not open, open directly in WhatsApp Hub with draft ready
      try {
        await sendMetaWhatsAppMessage({
          to: phone,
          type: 'text',
          text,
          messageType: 'catchup_whatsapp'
        });
        markHandled(item.id);
        setStatusBanner({
          type: 'success',
          text: `Lead saved & WhatsApp message sent to ${item.senderName} (${phone})!`
        });
        onRefreshHub?.();
      } catch {
        // Fallback: open in Floating WhatsApp Hub with pre-filled draft so user can send Template/Message
        markHandled(item.id);
        openWhatsAppHubForContact({ phone, name: item.senderName, draft: text });
        setStatusBanner({
          type: 'info',
          text: `Lead saved for ${item.senderName} (${phone}). Opened in WhatsApp Hub to send template/message.`
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  // 4. Copy AI Reply & Open Meta Business Suite (for 24h+ Messenger without phone)
  const handleCopyAndOpenMeta = async (item) => {
    const text = String(drafts[item.id] || '').trim();
    try {
      if (navigator.clipboard && text) {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
    if (item.metaInboxUrl) {
      window.open(item.metaInboxUrl, '_blank', 'noopener,noreferrer');
    }
    markHandled(item.id);
    setStatusBanner({
      type: 'success',
      text: `AI reply copied for ${item.senderName}! Paste (Ctrl+V) & Send in the opened Meta Inbox tab.`
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => !batchProgress.running && onClose?.()}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: 'hidden', maxHeight: isMobile ? '100dvh' : '90vh' } }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#0F2E5A',
          color: '#FFFFFF',
          py: 1.5,
          px: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <FacebookIcon sx={{ color: '#60A5FA', fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              FB Backlog Catch-Up Mode
            </Typography>
            <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'block', fontSize: '0.72rem' }}>
              {scanResult?.pageName
                ? `${scanResult.pageName} • Separate from Live Regular Mode (Safe Human-Approved)`
                : 'Scan & recover unreplied Facebook Comments & Messenger inquiries safely'}
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} disabled={batchProgress.running} sx={{ color: '#FFFFFF' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Top Scan & Filter Toolbar */}
      <Box sx={{ px: 2.2, py: 1.2, bgcolor: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            select
            size="small"
            label="Scan Depth"
            value={postLimit}
            onChange={(e) => setPostLimit(Number(e.target.value))}
            sx={{ minWidth: 120, bgcolor: '#FFFFFF', '& .MuiInputBase-input': { py: 0.65, fontSize: '0.78rem' } }}
          >
            <MenuItem value={15}>Last 15 Posts</MenuItem>
            <MenuItem value={25}>Last 25 Posts</MenuItem>
            <MenuItem value={50}>Last 50 Posts</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Time Window"
            value={ageFilterDays}
            onChange={(e) => setAgeFilterDays(Number(e.target.value))}
            sx={{ minWidth: 125, bgcolor: '#FFFFFF', '& .MuiInputBase-input': { py: 0.65, fontSize: '0.78rem' } }}
          >
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={0}>All Time</MenuItem>
          </TextField>
          <Button
            size="small"
            variant="contained"
            startIcon={scanning ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
            onClick={handleScan}
            disabled={scanning || batchProgress.running}
            sx={{ bgcolor: '#1D4ED8', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
          >
            {scanning ? 'Scanning...' : 'Scan Facebook'}
          </Button>
        </Stack>

        {handledIds.size > 0 && (
          <Button
            size="small"
            onClick={() => {
              const empty = new Set();
              setHandledIds(empty);
              saveHandledSet(empty);
            }}
            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#64748B' }}
          >
            Reset {handledIds.size} Done/Skipped
          </Button>
        )}
      </Box>

      {/* 4 Smart Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', minHeight: 42, '& .MuiTab-root': { minHeight: 42, fontWeight: 800, fontSize: '0.76rem', textTransform: 'none' } }}
      >
        <Tab label={`💬 Old Comments (${visibleComments.length})`} />
        <Tab label={`⚡ Inbox <24h (${visibleMessenger24h.length})`} />
        <Tab label={`📱 24h+ Phone Found (${visibleOldWithPhone.length})`} />
        <Tab label={`📋 24h+ Meta Inbox (${visibleOldNoPhone.length})`} />
      </Tabs>

      <DialogContent sx={{ p: 2, bgcolor: '#F8FAFC' }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, fontWeight: 600 }}>
            {errorMsg}
          </Alert>
        )}
        {scanResult?.warnings?.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2, fontSize: '0.76rem' }}>
            {scanResult.warnings.join(' • ')}
          </Alert>
        )}
        {statusBanner && (
          <Alert severity={statusBanner.type} onClose={() => setStatusBanner(null)} sx={{ mb: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '0.78rem' }}>
            {statusBanner.text}
          </Alert>
        )}
        {batchProgress.running && (
          <Box sx={{ mb: 1.5, p: 1.25, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF', display: 'block', mb: 0.5 }}>
              Sending Comment Replies Safely (3s Anti-Spam Delay): {batchProgress.current} / {batchProgress.total}
            </Typography>
            <LinearProgress variant="determinate" value={(batchProgress.current / Math.max(1, batchProgress.total)) * 100} />
          </Box>
        )}

        {scanning && !scanResult && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 700, color: '#475569' }}>
              Scanning Facebook Page posts &amp; Messenger backlog...
            </Typography>
          </Box>
        )}

        {/* TAB 0: Old Comments (No 24h limit — Direct Reply + Safe Batch) */}
        {tab === 0 && (
          <Stack spacing={1.25}>
            {visibleComments.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Checkbox
                    size="small"
                    checked={visibleComments.length > 0 && visibleComments.every((c) => selectedCommentIds.includes(c.id))}
                    onChange={(e) => {
                      setSelectedCommentIds(e.target.checked ? visibleComments.slice(0, 20).map((c) => c.id) : []);
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                    Select up to 20 comments ({selectedCommentIds.length} selected)
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={!selectedCommentIds.length || batchProgress.running}
                  startIcon={<SendIcon />}
                  onClick={handleBatchSendComments}
                  sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                >
                  Send Selected ({selectedCommentIds.length}) Safely
                </Button>
              </Box>
            )}

            {visibleComments.length === 0 && !scanning && (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2.5, border: '1px dashed #CBD5E1' }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#10B981', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  No unreplied Facebook comments in this time window!
                </Typography>
              </Paper>
            )}

            {visibleComments.map((item) => (
              <Paper key={item.id} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Stack direction="row" spacing={0.8} alignItems="flex-start">
                    <Checkbox
                      size="small"
                      sx={{ p: 0.2, mt: 0.1 }}
                      checked={selectedCommentIds.includes(item.id)}
                      onChange={() => {
                        setSelectedCommentIds((prev) =>
                          prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        );
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>
                        {item.senderName}
                        <Chip label={formatAgeLabel(item.ageHours)} size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                        Post: {item.postSnippet}
                      </Typography>
                      <Typography variant="body2" sx={{ bgcolor: '#F8FAFC', p: 0.9, borderRadius: 1.5, border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#1E293B' }}>
                        “{item.message}”
                      </Typography>
                    </Box>
                  </Stack>
                  <Tooltip title="Skip / Ignore">
                    <IconButton size="small" onClick={() => markHandled(item.id)} sx={{ color: '#94A3B8' }}>
                      <SkipNextIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2, pl: { sm: 3.5 } }} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    label="AI Suggested Comment Reply (Editable)"
                    value={drafts[item.id] || ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem' } }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busyId === item.id || batchProgress.running}
                    startIcon={busyId === item.id ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                    onClick={() => handleSendDirectReply(item)}
                    sx={{ bgcolor: '#0F2E5A', fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap', px: 2 }}
                  >
                    Send Reply
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* TAB 1: Messenger < 24h (Direct API Reply Ready) */}
        {tab === 1 && (
          <Stack spacing={1.25}>
            {visibleMessenger24h.length === 0 && !scanning && (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2.5, border: '1px dashed #CBD5E1' }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#10B981', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  All Messenger inquiries within 24 hours are replied!
                </Typography>
              </Paper>
            )}
            {visibleMessenger24h.map((item) => (
              <Paper key={item.id} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #BBF7D0', bgcolor: '#FFFFFF' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ForumIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {item.senderName}
                    </Typography>
                    <Chip label={`${formatAgeLabel(item.ageHours)} • 24h Ready`} size="small" sx={{ height: 19, fontSize: '0.66rem', fontWeight: 800, bgcolor: '#ECFDF5', color: '#047857' }} />
                  </Stack>
                  <IconButton size="small" onClick={() => markHandled(item.id)} sx={{ color: '#94A3B8' }}>
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography variant="body2" sx={{ bgcolor: '#F8FAFC', p: 0.9, borderRadius: 1.5, border: '1px solid #E2E8F0', fontSize: '0.82rem', mb: 1.2 }}>
                  “{item.message}”
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    label="AI Suggested Messenger Reply"
                    value={drafts[item.id] || ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem' } }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busyId === item.id}
                    startIcon={busyId === item.id ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                    onClick={() => handleSendDirectReply(item)}
                    sx={{ bgcolor: '#2563EB', fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap', px: 2 }}
                  >
                    Send DM
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* TAB 2: 24h+ Old Messenger WITH Phone Found -> Save Lead + Send WhatsApp */}
        {tab === 2 && (
          <Stack spacing={1.25}>
            {visibleOldWithPhone.length === 0 && !scanning && (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2.5, border: '1px dashed #CBD5E1' }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#10B981', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  No 24h+ Messenger chats with phone numbers pending in this window.
                </Typography>
              </Paper>
            )}
            {visibleOldWithPhone.map((item) => (
              <Paper key={item.id} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #A7F3D0', bgcolor: '#FFFFFF' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {item.senderName}
                    </Typography>
                    <Chip label={`📱 ${item.extractedPhone}`} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#166534' }} />
                    <Chip label={formatAgeLabel(item.ageHours)} size="small" sx={{ height: 19, fontSize: '0.66rem', fontWeight: 700 }} />
                  </Stack>
                  <IconButton size="small" onClick={() => markHandled(item.id)} sx={{ color: '#94A3B8' }}>
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography variant="body2" sx={{ bgcolor: '#F8FAFC', p: 0.9, borderRadius: 1.5, border: '1px solid #E2E8F0', fontSize: '0.82rem', mb: 1.2 }}>
                  “{item.message}”
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    label="WhatsApp Follow-up Message"
                    value={drafts[item.id] || ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem' } }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busyId === item.id}
                    startIcon={busyId === item.id ? <CircularProgress size={14} color="inherit" /> : <WhatsAppIcon />}
                    onClick={() => handleSaveLeadAndWhatsApp(item)}
                    sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap', px: 2 }}
                  >
                    Save Lead + WhatsApp
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* TAB 3: 24h+ Old Messenger WITHOUT Phone -> Copy AI Reply & Open Meta Inbox */}
        {tab === 3 && (
          <Stack spacing={1.25}>
            <Alert severity="info" icon={<AutoAwesomeIcon fontSize="small" />} sx={{ borderRadius: 2, fontSize: '0.76rem' }}>
              Meta blocks direct API messages after 24 hours. Click <b>Copy AI Reply &amp; Open Meta Inbox</b> — the reply is copied automatically so you just press <b>Ctrl+V → Enter</b>!
            </Alert>
            {visibleOldNoPhone.length === 0 && !scanning && (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2.5, border: '1px dashed #CBD5E1' }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: '#10B981', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  No 24h+ Messenger chats pending in this time window!
                </Typography>
              </Paper>
            )}
            {visibleOldNoPhone.map((item) => (
              <Paper key={item.id} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {item.senderName}
                    </Typography>
                    <Chip label={formatAgeLabel(item.ageHours)} size="small" sx={{ height: 19, fontSize: '0.66rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#B45309' }} />
                  </Stack>
                  <Button
                    size="small"
                    startIcon={<SkipNextIcon />}
                    onClick={() => markHandled(item.id)}
                    sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'none' }}
                  >
                    Skip
                  </Button>
                </Stack>
                <Typography variant="body2" sx={{ bgcolor: '#F8FAFC', p: 0.9, borderRadius: 1.5, border: '1px solid #E2E8F0', fontSize: '0.82rem', mb: 1.2 }}>
                  “{item.message}”
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    label="AI Reply (Auto-Copied on Click)"
                    value={drafts[item.id] || ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.78rem' } }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
                    endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleCopyAndOpenMeta(item)}
                    sx={{ bgcolor: '#1877F2', '&:hover': { bgcolor: '#1565C0' }, fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap', px: 2 }}
                  >
                    Copy &amp; Open Meta Inbox
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.2, py: 1.2, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFFFF', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
          {scanResult ? `Scanned ${scanResult.scannedPosts} posts & ${scanResult.scannedConversations} conversations` : 'Ready to scan'}
        </Typography>
        <Button onClick={onClose} disabled={batchProgress.running} sx={{ fontWeight: 800 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
