import React, { useState } from 'react';
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
  FormControlLabel,
  Switch,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MenuBookTwoToneIcon from '@mui/icons-material/MenuBookTwoTone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { loadDB, saveDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import OfficialDocumentModal from '../common/OfficialDocumentModal';

export default function LogBookManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer } = useAuth();

  const myGroups = isTrainer
    ? db.trainingGroups.filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups;

  const [selectedGroupId, setSelectedGroupId] = useState(myGroups[0]?.id || db.trainingGroups[0]?.id || '');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [searchTerm, setSearchTerm] = useState('');

  // Official A4 Modal state
  const [officialModalOpen, setOfficialModalOpen] = useState(false);
  const [modalTargetItem, setModalTargetItem] = useState(null); // null = batch, item = single log entry

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const trainer = db.trainers.find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Instructor', phone: '' };

  const availableLessonPlans = (db.lessonPlans || []).filter((lp) => lp.groupId === selectedGroupId);

  const [formData, setFormData] = useState({
    lessonPlanId: '',
    groupId: selectedGroupId,
    deliveryDate: new Date().toISOString().slice(0, 10),
    topicsCovered: '',
    materialsUsed: '',
    skillsLearned: '',
    actualHours: 2,
    isDelivered: true,
    trainerNotes: ''
  });

  const groupLogBooks = (db.logBooks || []).filter((lb) => lb.groupId === selectedGroupId);

  const filteredLogBooks = groupLogBooks.filter((lb) => {
    const q = searchTerm.toLowerCase();
    return (
      (lb.deliveryDate || '').toLowerCase().includes(q) ||
      (lb.topicsCovered || '').toLowerCase().includes(q) ||
      (lb.materialsUsed || '').toLowerCase().includes(q) ||
      (lb.skillsLearned || '').toLowerCase().includes(q) ||
      (lb.trainerNotes || '').toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalActualHours = groupLogBooks.reduce((sum, lb) => sum + (Number(lb.actualHours) || 0), 0);
  const targetCourseHours = selectedCourse?.durationHours || 160;
  const deliveryProgressPercent = Math.min(100, Math.round((totalActualHours / targetCourseHours) * 100));

  const handleOpenAdd = () => {
    setEditingItem(null);
    const firstLp = availableLessonPlans[0];
    const wp = firstLp ? db.workPlans.find((w) => w.id === firstLp.workPlanId) : null;
    const syl = wp ? db.syllabi.find((s) => s.id === wp.syllabusId) : null;

    setFormData({
      lessonPlanId: firstLp?.id || '',
      groupId: selectedGroupId,
      deliveryDate: wp?.planDate || new Date().toISOString().slice(0, 10),
      topicsCovered: syl ? `Delivered: ${syl.title}. Conducted theoretical safety briefing and hands-on operational practice.` : '',
      materialsUsed: firstLp?.materialsNeeded || 'Standard vocational toolkits, demonstration equipment, hygiene and PPE supplies.',
      skillsLearned: syl ? syl.learningOutcome : 'Practical vocational competence and procedural mastery.',
      actualHours: wp?.plannedHours || 2,
      isDelivered: true,
      trainerNotes: 'All enrolled trainees attended and actively participated in practical execution with satisfactory performance.'
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (lb) => {
    setEditingItem(lb);
    setFormData({
      lessonPlanId: lb.lessonPlanId || '',
      groupId: lb.groupId,
      deliveryDate: lb.deliveryDate,
      topicsCovered: lb.topicsCovered || '',
      materialsUsed: lb.materialsUsed || '',
      skillsLearned: lb.skillsLearned || '',
      actualHours: lb.actualHours || 2,
      isDelivered: lb.isDelivered ?? true,
      trainerNotes: lb.trainerNotes || ''
    });
    setOpenDialog(true);
  };

  const handleLessonPlanSelect = (lpId) => {
    const lp = availableLessonPlans.find((l) => l.id === lpId);
    const wp = lp ? db.workPlans.find((w) => w.id === lp.workPlanId) : null;
    const syl = wp ? db.syllabi.find((s) => s.id === wp.syllabusId) : null;

    setFormData((prev) => ({
      ...prev,
      lessonPlanId: lpId,
      deliveryDate: wp?.planDate || prev.deliveryDate,
      topicsCovered: syl ? `Delivered: ${syl.title}` : prev.topicsCovered,
      materialsUsed: lp?.materialsNeeded || prev.materialsUsed,
      skillsLearned: syl?.learningOutcome || prev.skillsLearned,
      actualHours: wp?.plannedHours || 2
    }));
  };

  const handleSave = () => {
    if (!formData.topicsCovered.trim() || !formData.deliveryDate) {
      alert('Topics covered and delivery date are required.');
      return;
    }

    let updatedList = [...(db.logBooks || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `LOG-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    const nextDb = { ...db, logBooks: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this log book record?')) {
      const nextDb = {
        ...db,
        logBooks: db.logBooks.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // WhatsApp share message generators
  const getSingleLogShareText = (lb) => {
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `📖 *DAILY TRAINING LOG SLIP (दैनिक तालिम कार्य विवरण)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *Course:* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *Date:* ${lb.deliveryDate} (${lb.actualHours} Hours Delivered)\n` +
      `• *Instructor:* ${trainer?.name || 'Assigned Instructor'}\n` +
      `• *Delivery Status:* ${lb.isDelivered ? '✅ Successfully Delivered' : '⏳ In Progress'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Topics Covered:*\n${lb.topicsCovered}\n\n` +
      `🎯 *Skills Acquired:*\n${lb.skillsLearned || 'Practical skills executed'}\n\n` +
      `🛠️ *Materials Used:*\n${lb.materialsUsed || 'Standard equipment'}\n\n` +
      `📝 *Trainer Observations:*\n${lb.trainerNotes || 'Satisfactory student engagement'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Certified daily log entry compliant with CTEVT accreditation standards._`
    );
  };

  const getBatchLogShareText = () => {
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `📚 *OFFICIAL LOG BOOK REGISTER (लग बुक सारांश)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch / Group:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *Course:* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *Instructor:* ${trainer?.name || 'Assigned Instructor'} ${trainer?.phone ? `(${trainer.phone})` : ''}\n` +
      `• *Total Sessions Logged:* ${groupLogBooks.length}\n` +
      `• *Total Delivered Hours:* ${totalActualHours} / ${targetCourseHours} Hours (${deliveryProgressPercent}%)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Recent Delivered Sessions:*\n` +
      groupLogBooks.slice(0, 5).map((lb, idx) => {
        return `${idx + 1}. ${lb.deliveryDate}: ${lb.topicsCovered.slice(0, 45)}... [${lb.actualHours} hrs]`;
      }).join('\n') +
      (groupLogBooks.length > 5 ? `\n...and ${groupLogBooks.length - 5} earlier sessions.` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Official institutional training log certified by Global Era Technical School._`
    );
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MenuBookTwoToneIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Log Book (दैनिक कार्य पुस्तिका / डेलिभरी)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Actual training delivery log. Work Plan (योजना) → Lesson Plan (तयारी) → Log Book (वास्तविक तालिम डेलिभरी)।
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Batch A4 Document / Print */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => {
              setModalTargetItem(null);
              setOfficialModalOpen(true);
            }}
            sx={{ fontWeight: 700 }}
          >
            A4 Official Log Sheet / PDF
          </Button>

          {/* Batch WhatsApp Share */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(trainer?.phone || '', getBatchLogShareText())}
            target="_blank"
            sx={{ fontWeight: 700 }}
          >
            WhatsApp Share
          </Button>

          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
            + Record Delivery
          </Button>
        </Box>
      </Box>

      {/* Group Selector & KPI Metrics */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              select
              label="Select Training Group"
              fullWidth
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {myGroups.map((grp) => {
                const c = db.courses.find((x) => x.id === grp.courseId);
                return (
                  <MenuItem key={grp.id} value={grp.id}>
                    {grp.groupCode} — {c?.title} (Shift {grp.shift}: {grp.startTime}-{grp.endTime})
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
                gap: 1.5,
                bgcolor: '#f8fafc',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  LOGGED SESSIONS
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  {groupLogBooks.length} Sessions
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  DELIVERED HOURS
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                  {totalActualHours} / {targetCourseHours} hrs
                </Typography>
              </Box>

              <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  COMPLETION RATE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={deliveryProgressPercent}
                    sx={{ flexGrow: 1, height: 7, borderRadius: 3 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {deliveryProgressPercent}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Filter & View Switcher Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <TextField
          size="small"
          placeholder="Search by date, topic covered, materials, or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: 360 }, bgcolor: '#ffffff' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700 }}>
            Showing {filteredLogBooks.length} of {groupLogBooks.length} records
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* 1. TABLE VIEW */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: 60, textAlign: 'center' }}>S.N.</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 120 }}>Delivery Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Delivered Topics</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Materials Used</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Skills Acquired</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 85 }}>Hours</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 110 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 140, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogBooks.map((lb, index) => (
                  <TableRow key={lb.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#647089', textAlign: 'center' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1a56b0' }}>
                      {lb.deliveryDate}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                      {lb.topicsCovered}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#475569' }}>
                      {lb.materialsUsed || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#475569' }}>
                      {lb.skillsLearned || '—'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1a56b0' }}>
                      {lb.actualHours} hrs
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={lb.isDelivered ? <CheckCircleOutlineIcon /> : <HourglassEmptyIcon />}
                        label={lb.isDelivered ? 'Delivered' : 'Pending'}
                        size="small"
                        sx={{
                          bgcolor: lb.isDelivered ? '#e5f8ee' : '#fef3c7',
                          color: lb.isDelivered ? '#16834b' : '#b45309',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Tooltip title="View Official A4 Log Sheet (PDF)">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setModalTargetItem(lb);
                            setOfficialModalOpen(true);
                          }}
                          sx={{ color: '#1a56b0' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Share on WhatsApp">
                        <IconButton
                          size="small"
                          component="a"
                          href={getWhatsAppUrl('', getSingleLogShareText(lb))}
                          target="_blank"
                          sx={{ color: '#16834b' }}
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Log Entry">
                        <IconButton size="small" onClick={() => handleOpenEdit(lb)} sx={{ color: '#475569' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(lb.id)} sx={{ color: '#d5372f' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogBooks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      {searchTerm
                        ? 'No log records match your search query.'
                        : 'No log books recorded yet. Click "+ Record Delivery" to log today\'s class.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* 2. CARD VIEW */
        <Grid container spacing={2}>
          {filteredLogBooks.map((lb, index) => (
            <Grid item xs={12} sm={6} md={4} key={lb.id}>
              <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={`S.N. ${index + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                    <Chip
                      label={lb.isDelivered ? 'Delivered' : 'Pending'}
                      size="small"
                      sx={{
                        bgcolor: lb.isDelivered ? '#e5f8ee' : '#fef3c7',
                        color: lb.isDelivered ? '#16834b' : '#b45309',
                        fontWeight: 700
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                    {lb.actualHours} hrs
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', mb: 0.5 }}>
                  {lb.topicsCovered}
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
                  📅 Delivery Date: <b>{lb.deliveryDate}</b>
                </Typography>

                <Box sx={{ mb: 1.5, flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                    Skills Acquired:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', mb: 1 }}>
                    {lb.skillsLearned || '—'}
                  </Typography>

                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                    Materials Used:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                    {lb.materialsUsed || '—'}
                  </Typography>
                </Box>

                <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => {
                      setModalTargetItem(lb);
                      setOfficialModalOpen(true);
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    A4 View
                  </Button>

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      component="a"
                      href={getWhatsAppUrl('', getSingleLogShareText(lb))}
                      target="_blank"
                      sx={{ color: '#16834b' }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenEdit(lb)} sx={{ color: '#475569' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(lb.id)} sx={{ color: '#d5372f' }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit Log Book Record' : 'Record Log Book Entry (वास्तविक डेलिभरी)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Delivery Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Actual Training Hours"
                  fullWidth
                  value={formData.actualHours}
                  onChange={(e) => setFormData({ ...formData, actualHours: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            {/* Lesson Plan Link */}
            <TextField
              select
              label="Associated Lesson Plan (Optional)"
              fullWidth
              value={formData.lessonPlanId}
              onChange={(e) => handleLessonPlanSelect(e.target.value)}
            >
              <MenuItem value="">Direct Log (Without Pre-existing Lesson Plan)</MenuItem>
              {availableLessonPlans.map((lp) => {
                const wp = db.workPlans.find((w) => w.id === lp.workPlanId);
                const s = db.syllabi.find((x) => x.id === wp?.syllabusId);
                return (
                  <MenuItem key={lp.id} value={lp.id}>
                    {wp?.planDate} — Unit {s?.unitNo}: {s?.title || lp.objectives?.slice(0, 30)}
                  </MenuItem>
                );
              })}
            </TextField>

            <TextField
              label="Subject / Topics Actually Covered (पढाइएको विषयवस्तु)"
              multiline
              rows={2}
              fullWidth
              value={formData.topicsCovered}
              onChange={(e) => setFormData({ ...formData, topicsCovered: e.target.value })}
              required
            />

            <TextField
              label="Training Materials & Consumables Used"
              fullWidth
              value={formData.materialsUsed}
              onChange={(e) => setFormData({ ...formData, materialsUsed: e.target.value })}
            />

            <TextField
              label="Skills Learned by Students (हासिल गरेका सीपहरू)"
              multiline
              rows={2}
              fullWidth
              value={formData.skillsLearned}
              onChange={(e) => setFormData({ ...formData, skillsLearned: e.target.value })}
            />

            <TextField
              label="Trainer Observations / Issues / Suggestions"
              multiline
              rows={2}
              fullWidth
              value={formData.trainerNotes}
              onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDelivered}
                  onChange={(e) => setFormData({ ...formData, isDelivered: e.target.checked })}
                  color="success"
                />
              }
              label="Mark session as fully delivered"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 800 }}>
            {editingItem ? 'Update Log Entry' : 'Save to Log Book'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Official CTEVT Standard A4 Printable Modal */}
      <OfficialDocumentModal
        open={officialModalOpen}
        onClose={() => setOfficialModalOpen(false)}
        docType="LOG_BOOK"
        title={modalTargetItem ? 'DAILY VOCATIONAL TRAINING LOG SLIP' : 'OFFICIAL TRAINING LOG BOOK REGISTER'}
        nepaliTitle={modalTargetItem ? 'दैनिक तालिम कार्य विवरण' : 'तालिम डेलिभरी लग बुक पुस्तिका'}
        group={selectedGroup}
        course={selectedCourse}
        trainer={trainer}
        metadata={{
          dateRange: modalTargetItem
            ? `Delivery Date: ${modalTargetItem.deliveryDate}`
            : `${selectedGroup?.admissionDate || '2026-09-01'} → ${selectedGroup?.expectedEndDate || '2026-10-31'}`
        }}
        shareText={modalTargetItem ? getSingleLogShareText(modalTargetItem) : getBatchLogShareText()}
        sharePhone={trainer?.phone || ''}
      >
        {modalTargetItem ? (
          /* Single Daily Log Slip */
          <Box>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1', mb: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                SESSION TOPIC: {modalTargetItem.topicsCovered}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3, fontWeight: 700 }}>
                Conducted On: {modalTargetItem.deliveryDate} • Duration: {modalTargetItem.actualHours} Hours • Status: {modalTargetItem.isDelivered ? 'Successfully Delivered' : 'Pending'}
              </Typography>
            </Box>

            <Table size="small" sx={{ border: '1.5px solid #0f172a', '& td': { border: '1px solid #cbd5e1', p: 1.3, fontSize: '0.85rem' } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, width: '32%', bgcolor: '#f1f5f9' }}>
                    1. TOPICS & THEORY COVERED<br />
                    <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(अध्यापन गरिएका विषयवस्तु)</span>
                  </TableCell>
                  <TableCell>
                    {modalTargetItem.topicsCovered}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                    2. PRACTICAL COMPETENCIES MASTERED<br />
                    <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(सिकाइएका प्रयोगात्मक सीपहरू)</span>
                  </TableCell>
                  <TableCell>
                    {modalTargetItem.skillsLearned || 'Demonstration, supervised student execution, and hands-on drills completed.'}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                    3. CONSUMABLES & APPARATUS USED<br />
                    <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(प्रयोग भएका सामग्री तथा औजार)</span>
                  </TableCell>
                  <TableCell>
                    {modalTargetItem.materialsUsed || 'Standard workshop materials and safety kits.'}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                    4. TRAINER OBSERVATIONS & REMARKS<br />
                    <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(प्रशिक्षकको टिप्पणी र विद्यार्थी प्रगति)</span>
                  </TableCell>
                  <TableCell>
                    {modalTargetItem.trainerNotes || 'Satisfactory trainee attentiveness and standard adherence.'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        ) : (
          /* Batch Log Book Register Table */
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem' } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 45 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 95 }}>डेलिभरी मिति</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>अध्यापन गरिएका विषयवस्तु</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>हासिल गरेका सीपहरू</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>प्रयोग भएका सामग्री</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 50 }}>घन्टा</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 75 }}>प्रमाणित</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupLogBooks.map((lb, idx) => (
                  <TableRow key={lb.id}>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{lb.deliveryDate}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{lb.topicsCovered}</TableCell>
                    <TableCell>{lb.skillsLearned || '—'}</TableCell>
                    <TableCell>{lb.materialsUsed || '—'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{lb.actualHours}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#16834b' }}>
                      {lb.isDelivered ? 'सम्पन्न' : 'बाँकी'}
                    </TableCell>
                  </TableRow>
                ))}
                {groupLogBooks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                      No log book records registered for this group yet.
                    </TableCell>
                  </TableRow>
                )}
                {/* Total Delivered Hours Footer */}
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell colSpan={5} sx={{ fontWeight: 900, textAlign: 'right' }}>
                    कुल सम्पन्न भएको तालिम समय (TOTAL DELIVERED HOURS):
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#1a56b0' }}>
                    {totalActualHours}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>
                    {deliveryProgressPercent}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}
      </OfficialDocumentModal>
    </Box>
  );
}
