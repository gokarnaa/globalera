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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  InputAdornment,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import PhoneIcon from '@mui/icons-material/Phone';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MessageIcon from '@mui/icons-material/Message';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { loadDB, saveDB, logCommunication, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function CommunicationManager() {
  const [db, setDb] = useState(loadDB());
  const [currentTab, setCurrentTab] = useState(0);

  // --- Tab 1: Dispatch State ---
  const [targetAudience, setTargetAudience] = useState('GROUP'); // 'GROUP', 'ABSENT_TODAY', 'ALL_STUDENTS', 'UNPLACED', 'EMPLOYERS', 'TRAINERS', 'SINGLE'
  const [selectedGroupId, setSelectedGroupId] = useState(db.trainingGroups[0]?.id || '');
  const [selectedSingleStudentId, setSelectedSingleStudentId] = useState(db.students[0]?.id || '');
  const [channel, setChannel] = useState('WhatsApp'); // 'WhatsApp' | 'SMS'
  const [selectedTemplateId, setSelectedTemplateId] = useState(db.smsTemplates[0]?.id || '');
  const [messageBody, setMessageBody] = useState(db.smsTemplates[0]?.content || '');
  const [dispatchStatus, setDispatchStatus] = useState(null);

  // --- Tab 2: Call Log State ---
  const [callStudentId, setCallStudentId] = useState(db.students[0]?.id || '');
  const [callStatus, setCallStatus] = useState('Connected'); // 'Connected' | 'No Answer' | 'Busy' | 'Call Back Later'
  const [callNotes, setCallNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // --- Tab 3: History State ---
  const [historySearch, setHistorySearch] = useState('');
  const [historyChannelFilter, setHistoryChannelFilter] = useState('All');

  // --- Tab 4: Template Management State ---
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', category: 'General', content: '' });

  // Resolve Recipient List based on targetAudience
  const recipientList = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let list = [];

    if (targetAudience === 'GROUP') {
      list = (db.students || []).filter((s) => s.groupId === selectedGroupId);
    } else if (targetAudience === 'ALL_STUDENTS') {
      list = db.students || [];
    } else if (targetAudience === 'ABSENT_TODAY') {
      const absentStudentIds = (db.attendances || [])
        .filter((a) => a.date === today && a.status === 'absent')
        .map((a) => a.studentId);
      list = (db.students || []).filter((s) => absentStudentIds.includes(s.id));
      if (list.length === 0) {
        // Fallback demo absentees
        list = (db.students || []).slice(0, 2);
      }
    } else if (targetAudience === 'UNPLACED') {
      const placedStudentIds = (db.placements || []).filter((p) => p.status === 'Placed').map((p) => p.studentId);
      list = (db.students || []).filter((s) => !placedStudentIds.includes(s.id));
    } else if (targetAudience === 'EMPLOYERS') {
      list = (db.employers || []).map((e) => ({
        id: e.id,
        name: e.contactPerson || e.name,
        phone: e.phone,
        organization: e.name,
        isEmployer: true
      }));
    } else if (targetAudience === 'TRAINERS') {
      list = (db.trainers || []).map((t) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        specialization: t.specialization,
        isTrainer: true
      }));
    } else if (targetAudience === 'SINGLE') {
      const std = (db.students || []).find((s) => s.id === selectedSingleStudentId);
      if (std) list = [std];
    }

    // Filter duplicates and valid phone
    const seen = new Set();
    return list.filter((item) => {
      if (!item.phone || seen.has(item.phone)) return false;
      seen.add(item.phone);
      return true;
    });
  }, [targetAudience, selectedGroupId, selectedSingleStudentId, db]);

  // Handle template selection
  const handleSelectTemplate = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = (db.smsTemplates || []).find((t) => t.id === tmplId);
    if (tmpl) {
      setMessageBody(tmpl.content);
    }
  };

  // Variable replacement helper
  const renderMessageFor = (recipient) => {
    const today = new Date().toISOString().slice(0, 10);
    const group = (db.trainingGroups || []).find((g) => g.id === recipient.groupId);
    const course = (db.courses || []).find((c) => c.id === group?.courseId);
    const cert = (db.certificates || []).find((c) => c.studentId === recipient.id);

    return messageBody
      .replace(/\{name\}/g, recipient.name || 'Student')
      .replace(/\{parent\}/g, recipient.fatherName || recipient.motherName || 'अभिभावक')
      .replace(/\{course\}/g, course?.title || 'Vocational Training')
      .replace(/\{shift\}/g, group?.shift || 'A')
      .replace(/\{date\}/g, today)
      .replace(/\{time\}/g, group?.startTime || '10:00 AM')
      .replace(/\{certNo\}/g, cert?.certificateNo || 'GETS-2026-0001')
      .replace(/\{employer\}/g, 'Norvic Hospital')
      .replace(/\{supervisor\}/g, 'Supervisor')
      .replace(/\{phone\}/g, recipient.phone || '')
      .replace(/\{jobTitle\}/g, 'Specialist Caregiver')
      .replace(/\{institute\}/g, db.settings?.instituteSub || 'ग्लोबल एरा प्राविधिक स्कुल');
  };

  // Broadcast Action
  const handleSendBroadcast = () => {
    if (recipientList.length === 0) {
      alert('No valid recipients found in selected audience.');
      return;
    }
    if (!messageBody.trim()) {
      alert('Message body cannot be empty.');
      return;
    }

    let updatedDb = { ...db };
    recipientList.forEach((recipient) => {
      const text = renderMessageFor(recipient);
      updatedDb = logCommunication(updatedDb, {
        recipientType: recipient.isEmployer ? 'Employer' : recipient.isTrainer ? 'Trainer' : 'Student',
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        channel: channel,
        templateId: selectedTemplateId || 'CUSTOM',
        messageText: text,
        sentBy: 'Admin'
      });
    });

    logAudit(updatedDb, 'BROADCAST_MESSAGE', 'Communication', `BROADCAST-${Date.now()}`, `Broadcasted ${channel} to ${recipientList.length} recipients`);
    setDb(updatedDb);
    setDispatchStatus({
      success: true,
      count: recipientList.length,
      channel
    });

    setTimeout(() => setDispatchStatus(null), 6000);
  };

  // Log Call Follow-up
  const handleSaveCallLog = () => {
    const std = (db.students || []).find((s) => s.id === callStudentId);
    if (!std) return;

    const summaryText = `Call Outcome: ${callStatus}. Notes: ${callNotes || 'General check-in'}. Next Follow-up: ${nextFollowUpDate || 'None'}`;
    const updatedDb = logCommunication(db, {
      recipientType: 'Student',
      recipientId: std.id,
      recipientName: std.name,
      recipientPhone: std.phone,
      channel: 'Call',
      templateId: 'CALL_FOLLOWUP',
      messageText: summaryText,
      callStatus: callStatus,
      sentBy: 'Admin'
    });

    logAudit(updatedDb, 'CALL_FOLLOWUP', 'Student', std.id, `Phone call logged for ${std.name} (${callStatus})`);
    setDb(updatedDb);
    setCallNotes('');
    alert(`Call record logged for ${std.name}!`);
  };

  // Save New Template
  const handleSaveTemplate = () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      alert('Template title and message text are required.');
      return;
    }

    const newTmpl = {
      id: `TPL-${String((db.smsTemplates || []).length + 1).padStart(2, '0')}`,
      ...newTemplate
    };

    const nextDb = {
      ...db,
      smsTemplates: [...(db.smsTemplates || []), newTmpl]
    };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenTemplateDialog(false);
    setNewTemplate({ title: '', category: 'General', content: '' });
  };

  // Filtered History
  const filteredHistory = (db.communicationLogs || []).filter((item) => {
    const q = historySearch.toLowerCase();
    const matchesSearch =
      !historySearch ||
      (item.recipientName || '').toLowerCase().includes(q) ||
      (item.recipientPhone || '').toLowerCase().includes(q) ||
      (item.messageText || '').toLowerCase().includes(q) ||
      (item.sentBy || '').toLowerCase().includes(q);

    const matchesChannel = historyChannelFilter === 'All' || item.channel === historyChannelFilter;
    return matchesSearch && matchesChannel;
  });

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MessageIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Communication Center (एकीकृत सञ्चार केन्द्र)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Direct WhatsApp dispatch, Aakash SMS API broadcast, candidate phone call follow-up, and message templates.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={<WhatsAppIcon sx={{ color: '#25D366 !important' }} />}
            label="WhatsApp Direct Active"
            sx={{ bgcolor: '#e8fdf0', color: '#16834b', fontWeight: 800 }}
          />
          <Chip
            icon={<SmsIcon sx={{ color: '#1a56b0 !important' }} />}
            label="Aakash SMS Ready"
            sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 800 }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          sx={{
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            '& .MuiTab-root': { fontWeight: 800, py: 1.8 }
          }}
        >
          <Tab icon={<SendIcon fontSize="small" />} iconPosition="start" label="१. सन्देश प्रवाह (WhatsApp & SMS Dispatch)" />
          <Tab icon={<PhoneIcon fontSize="small" />} iconPosition="start" label="२. फोन कल अनुगमन (Call Follow-up)" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="३. सञ्चार इतिहास (Communication Log)" />
          <Tab icon={<MessageIcon fontSize="small" />} iconPosition="start" label="४. सन्देश ढाँचा (Message Templates)" />
        </Tabs>

        {/* Tab 1: Dispatch */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            {dispatchStatus && (
              <Alert severity="success" sx={{ mb: 3, fontWeight: 700 }}>
                सन्देश सफलतापूर्वक प्रवाह गरियो! {dispatchStatus.count} जनालाई {dispatchStatus.channel} मार्फत पठाइएको छ र इतिहासमा सुरक्षित गरिएको छ।
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Left Configuration Panel */}
              <Grid item xs={12} md={5}>
                <Stack spacing={2.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    १. लक्षित समूह छनोट (Target Audience)
                  </Typography>

                  <TextField
                    select
                    label="Recipient Target"
                    fullWidth
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  >
                    <MenuItem value="GROUP">Training Batch (तालिम समूह अनुसार)</MenuItem>
                    <MenuItem value="ABSENT_TODAY">Today's Absent Trainees (आज अनुपस्थित विद्यार्थीका अभिभावक)</MenuItem>
                    <MenuItem value="UNPLACED">Unplaced Job Seekers (रोजगारी बाँकी रहेका विद्यार्थी)</MenuItem>
                    <MenuItem value="ALL_STUDENTS">All Active Students (सबै सक्रिय विद्यार्थी)</MenuItem>
                    <MenuItem value="EMPLOYERS">Employer Partners (रोजगारदाता संस्थाहरू)</MenuItem>
                    <MenuItem value="TRAINERS">All Trainers (सबै प्रशिक्षकहरू)</MenuItem>
                    <MenuItem value="SINGLE">Individual Student (एकजना विद्यार्थी मात्र)</MenuItem>
                  </TextField>

                  {targetAudience === 'GROUP' && (
                    <TextField
                      select
                      label="Select Training Batch"
                      fullWidth
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                    >
                      {db.trainingGroups.map((g) => {
                        const c = db.courses.find((x) => x.id === g.courseId);
                        return (
                          <MenuItem key={g.id} value={g.id}>
                            {g.groupCode} — {c?.title} (Shift {g.shift})
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  )}

                  {targetAudience === 'SINGLE' && (
                    <TextField
                      select
                      label="Select Student"
                      fullWidth
                      value={selectedSingleStudentId}
                      onChange={(e) => setSelectedSingleStudentId(e.target.value)}
                    >
                      {db.students.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} ({s.tgid}) • {s.phone}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}

                  <Divider />

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    २. सञ्चार माध्यम (Delivery Channel)
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      fullWidth
                      variant={channel === 'WhatsApp' ? 'contained' : 'outlined'}
                      startIcon={<WhatsAppIcon />}
                      onClick={() => setChannel('WhatsApp')}
                      sx={{
                        fontWeight: 800,
                        bgcolor: channel === 'WhatsApp' ? '#25D366' : 'transparent',
                        borderColor: '#25D366',
                        color: channel === 'WhatsApp' ? '#ffffff' : '#25D366',
                        '&:hover': { bgcolor: channel === 'WhatsApp' ? '#1ebc59' : '#f0fdf4' }
                      }}
                    >
                      WhatsApp Direct
                    </Button>
                    <Button
                      fullWidth
                      variant={channel === 'SMS' ? 'contained' : 'outlined'}
                      startIcon={<SmsIcon />}
                      onClick={() => setChannel('SMS')}
                      sx={{
                        fontWeight: 800,
                        bgcolor: channel === 'SMS' ? '#1a56b0' : 'transparent',
                        borderColor: '#1a56b0',
                        color: channel === 'SMS' ? '#ffffff' : '#1a56b0'
                      }}
                    >
                      Aakash SMS API
                    </Button>
                  </Box>

                  <Divider />

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    ३. सन्देश ढाँचा छनोट (Select Template)
                  </Typography>

                  <TextField
                    select
                    label="Choose Template"
                    fullWidth
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                  >
                    {(db.smsTemplates || []).map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.title} ({t.category})
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Message Content (सन्देशको व्यहोरा)"
                    multiline
                    rows={4}
                    fullWidth
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    helperText="Variables: {name}, {parent}, {course}, {shift}, {date}, {time}, {certNo}, {employer}, {institute}"
                  />

                  {/* Variable insertion buttons */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {['{name}', '{parent}', '{course}', '{date}', '{time}', '{certNo}', '{institute}'].map((v) => (
                      <Chip
                        key={v}
                        label={v}
                        size="small"
                        clickable
                        onClick={() => setMessageBody((prev) => `${prev} ${v}`)}
                        sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={channel === 'WhatsApp' ? <WhatsAppIcon /> : <SendIcon />}
                    onClick={handleSendBroadcast}
                    sx={{
                      fontWeight: 800,
                      py: 1.4,
                      bgcolor: channel === 'WhatsApp' ? '#25D366' : '#1a56b0',
                      '&:hover': { bgcolor: channel === 'WhatsApp' ? '#1ebc59' : '#123e80' }
                    }}
                  >
                    {channel === 'WhatsApp' ? 'Launch WhatsApp Dispatch' : 'Send Bulk SMS via Gateway'} ({recipientList.length} Recipients)
                  </Button>
                </Stack>
              </Grid>

              {/* Right Live Preview Panel */}
              <Grid item xs={12} md={7}>
                <Card sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      प्रत्यक्ष पूर्वावलोकन (Audience Preview: {recipientList.length} People)
                    </Typography>
                    <Chip
                      label={`Total: ${recipientList.length}`}
                      size="small"
                      sx={{ bgcolor: '#0b2545', color: '#ffffff', fontWeight: 800 }}
                    />
                  </Box>

                  {recipientList.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
                      No recipients matching this filter. Select another group or audience.
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ maxHeight: 420, borderRadius: 2 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Recipients</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Personalized Message</TableCell>
                            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Direct Link</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recipientList.map((rec, i) => {
                            const personalMsg = renderMessageFor(rec);
                            return (
                              <TableRow key={rec.id || i} hover>
                                <TableCell sx={{ fontWeight: 700 }}>
                                  {rec.name}
                                  {rec.tgid && (
                                    <Typography variant="caption" sx={{ display: 'block', color: '#647089' }}>
                                      {rec.tgid}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#1a56b0' }}>
                                  {rec.phone}
                                </TableCell>
                                <TableCell sx={{ maxWidth: 220 }}>
                                  <Typography variant="caption" sx={{ color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {personalMsg}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                  <IconButton
                                    size="small"
                                    component="a"
                                    href={getWhatsAppUrl(rec.phone, personalMsg)}
                                    target="_blank"
                                    sx={{ color: '#25D366' }}
                                    title="Open WhatsApp"
                                  >
                                    <WhatsAppIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 2: Call Follow-up Register */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Card sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                    फोन कल दर्ता फारम (Log Candidate Follow-up Call)
                  </Typography>

                  <Stack spacing={2.5}>
                    <TextField
                      select
                      label="Select Student / Candidate"
                      fullWidth
                      value={callStudentId}
                      onChange={(e) => setCallStudentId(e.target.value)}
                    >
                      {db.students.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} ({s.tgid}) • {s.phone}
                        </MenuItem>
                      ))}
                    </TextField>

                    {(() => {
                      const std = db.students.find((s) => s.id === callStudentId);
                      return std ? (
                        <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {std.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                              Mobile: {std.phone}
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            startIcon={<PhoneIcon />}
                            component="a"
                            href={`tel:${std.phone}`}
                            sx={{ fontWeight: 800 }}
                          >
                            Call Now
                          </Button>
                        </Box>
                      ) : null;
                    })()}

                    <TextField
                      select
                      label="Call Result (कलको नतिजा)"
                      fullWidth
                      value={callStatus}
                      onChange={(e) => setCallStatus(e.target.value)}
                    >
                      <MenuItem value="Connected">Connected & Spoke (सम्पर्क भएको)</MenuItem>
                      <MenuItem value="No Answer">No Answer / Not Reachable (फोन नउठेको)</MenuItem>
                      <MenuItem value="Busy">Line Busy (व्यस्त)</MenuItem>
                      <MenuItem value="Call Back Later">Call Back Later (पछि कल गर्न भनेको)</MenuItem>
                      <MenuItem value="Wrong Number">Wrong Number (गलत नम्बर)</MenuItem>
                    </TextField>

                    <TextField
                      label="Call Discussion Notes (छलफल भएको विषय)"
                      multiline
                      rows={3}
                      fullWidth
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="e.g. Inquired about OJT preference in Norvic Hospital, confirmed available next Monday."
                    />

                    <TextField
                      type="date"
                      label="Next Follow-up Date (अर्को कल गर्ने मिति)"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                    />

                    <Button variant="contained" onClick={handleSaveCallLog} sx={{ fontWeight: 800, py: 1.2 }}>
                      Save Call Record to History
                    </Button>
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} md={7}>
                <Card sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
                    हालसालै गरिएका कलहरू (Recent Call History)
                  </Typography>

                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Candidate</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Result</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(db.communicationLogs || [])
                          .filter((c) => c.channel === 'Call')
                          .slice(0, 8)
                          .map((call, idx) => (
                            <TableRow key={call.id || idx} hover>
                              <TableCell sx={{ fontSize: '0.8rem', color: '#647089' }}>
                                {call.sentAt?.slice(0, 10)}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>
                                {call.recipientName}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={call.callStatus}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor: call.callStatus === 'Connected' ? '#e5f8ee' : '#fdeceb',
                                    color: call.callStatus === 'Connected' ? '#16834b' : '#d5372f'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', color: '#334155' }}>
                                {call.messageText}
                              </TableCell>
                            </TableRow>
                          ))}
                        {(db.communicationLogs || []).filter((c) => c.channel === 'Call').length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                              No call records logged yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 3: History Log */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search history by name, phone, message text..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                sx={{ width: { xs: '100%', sm: 340 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ display: 'flex', gap: 0.8 }}>
                {['All', 'WhatsApp', 'SMS', 'Call'].map((ch) => (
                  <Chip
                    key={ch}
                    label={ch}
                    clickable
                    color={historyChannelFilter === ch ? 'primary' : 'default'}
                    onClick={() => setHistoryChannelFilter(ch)}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, width: '60px' }}>क्र.सं.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Recipient</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Channel</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Message Content / Call Result</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Sent By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((item, idx) => (
                    <TableRow key={item.id || idx} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#647089' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#647089' }}>
                        {item.sentAt?.replace('T', ' ').slice(0, 16)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {item.recipientName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          {item.recipientPhone} ({item.recipientType})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={item.channel === 'WhatsApp' ? <WhatsAppIcon /> : item.channel === 'SMS' ? <SmsIcon /> : <PhoneIcon />}
                          label={item.channel}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: item.channel === 'WhatsApp' ? '#e8fdf0' : item.channel === 'SMS' ? '#eff6ff' : '#fefce8',
                            color: item.channel === 'WhatsApp' ? '#16834b' : item.channel === 'SMS' ? '#1e40af' : '#854d0e'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 380, fontSize: '0.85rem', color: '#1e293b' }}>
                        {item.messageText}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                        {item.sentBy || 'Admin'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                        No communication records found matching criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 4: Templates Manager */}
        {currentTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                System & Custom Message Templates ({db.smsTemplates?.length || 0})
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenTemplateDialog(true)} sx={{ fontWeight: 800 }}>
                + Add Custom Template
              </Button>
            </Box>

            <Grid container spacing={2.5}>
              {(db.smsTemplates || []).map((tmpl, idx) => (
                <Grid item xs={12} sm={6} md={4} key={tmpl.id}>
                  <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {tmpl.title}
                        </Typography>
                        <Chip label={tmpl.category} size="small" sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700, fontSize: '0.72rem' }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569', mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, fontSize: '0.85rem' }}>
                        "{tmpl.content}"
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1.5, mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={<SendIcon />}
                        onClick={() => {
                          handleSelectTemplate(tmpl.id);
                          setCurrentTab(0);
                        }}
                        sx={{ fontWeight: 800 }}
                      >
                        Use in Broadcast
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Card>

      {/* Add Custom Template Dialog */}
      <Dialog open={openTemplateDialog} onClose={() => setOpenTemplateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Custom Message Template</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Template Title (e.g. Exam Schedule Reminder)"
              fullWidth
              value={newTemplate.title}
              onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
              required
            />
            <TextField
              select
              label="Category"
              fullWidth
              value={newTemplate.category}
              onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
            >
              <MenuItem value="Attendance">Attendance (उपस्थिति)</MenuItem>
              <MenuItem value="Class">Class Schedule (कक्षा तालिका)</MenuItem>
              <MenuItem value="Certificate">Certificate (प्रमाणपत्र)</MenuItem>
              <MenuItem value="OJT">OJT & Apprenticeship (स्थलगत तालिम)</MenuItem>
              <MenuItem value="Placement">Placement & Job (रोजगारी)</MenuItem>
              <MenuItem value="General">General Notice (साधारण सूचना)</MenuItem>
            </TextField>
            <TextField
              label="Template Content (सन्देशको व्यहोरा)"
              multiline
              rows={4}
              fullWidth
              value={newTemplate.content}
              onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
              helperText="Available variables: {name}, {parent}, {course}, {shift}, {date}, {time}, {certNo}, {employer}, {institute}"
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenTemplateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTemplate} sx={{ fontWeight: 800 }}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
