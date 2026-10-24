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
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { loadDB, saveDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import OfficialDocumentModal from '../common/OfficialDocumentModal';

export default function LessonPlanManager() {
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
  const [modalTargetItem, setModalTargetItem] = useState(null); // null = batch, item = single lesson plan

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const trainer = db.trainers.find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Instructor', phone: '' };

  const availableWorkPlans = (db.workPlans || []).filter((wp) => wp.groupId === selectedGroupId);

  const [formData, setFormData] = useState({
    workPlanId: '',
    groupId: selectedGroupId,
    objectives: '',
    materialsNeeded: '',
    methodology: '',
    assessmentMethod: '',
    homework: '',
    notes: ''
  });

  const groupLessonPlans = (db.lessonPlans || []).filter((lp) => lp.groupId === selectedGroupId);

  const filteredLessonPlans = groupLessonPlans.filter((lp) => {
    const wp = db.workPlans.find((w) => w.id === lp.workPlanId);
    const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);
    const q = searchTerm.toLowerCase();
    return (
      (syl?.title || '').toLowerCase().includes(q) ||
      (wp?.planDate || '').toLowerCase().includes(q) ||
      (lp.objectives || '').toLowerCase().includes(q) ||
      (lp.methodology || '').toLowerCase().includes(q) ||
      (lp.materialsNeeded || '').toLowerCase().includes(q) ||
      (lp.assessmentMethod || '').toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    const firstWp = availableWorkPlans[0];
    const syl = firstWp ? db.syllabi.find((s) => s.id === firstWp.syllabusId) : null;

    setFormData({
      workPlanId: firstWp?.id || '',
      groupId: selectedGroupId,
      objectives: syl ? `Students will understand safety protocols and demonstrate operational competence in ${syl.title}.` : '',
      materialsNeeded: 'Standard TVET toolkits, demonstration equipment, hygiene and PPE supplies, practice workbooks.',
      methodology: '15 min theoretical introduction & safety review, 30 min trainer live demonstration, 60 min guided trainee hands-on practice, 15 min review & question-answer.',
      assessmentMethod: 'Direct instructor observation, checklist skill rating, oral questioning during execution.',
      homework: 'Revise unit procedure steps and complete practical workbook log.',
      notes: 'Ensure proper workshop ventilation, adequate consumable materials, and safety compliance.'
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (lp) => {
    setEditingItem(lp);
    setFormData({
      workPlanId: lp.workPlanId,
      groupId: lp.groupId,
      objectives: lp.objectives || '',
      materialsNeeded: lp.materialsNeeded || '',
      methodology: lp.methodology || '',
      assessmentMethod: lp.assessmentMethod || '',
      homework: lp.homework || '',
      notes: lp.notes || ''
    });
    setOpenDialog(true);
  };

  const handleWorkPlanSelect = (wpId) => {
    const wp = availableWorkPlans.find((w) => w.id === wpId);
    const syl = wp ? db.syllabi.find((s) => s.id === wp.syllabusId) : null;
    setFormData((prev) => ({
      ...prev,
      workPlanId: wpId,
      objectives: syl ? `Students will master the operational techniques and safety protocols of ${syl.title}.` : prev.objectives
    }));
  };

  const handleSave = () => {
    if (!formData.workPlanId || !formData.objectives.trim()) {
      alert('Linked Work Plan and Learning Objectives are required.');
      return;
    }

    let updatedList = [...(db.lessonPlans || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `LP-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    const nextDb = { ...db, lessonPlans: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this lesson plan?')) {
      const nextDb = {
        ...db,
        lessonPlans: db.lessonPlans.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // WhatsApp formatted share generator
  const getSingleLessonPlanShareText = (lp) => {
    const wp = db.workPlans.find((w) => w.id === lp.workPlanId);
    const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `📖 *OFFICIAL LESSON PLAN (दैनिक पाठ योजना)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *Date & Duration:* ${wp?.planDate || '—'} (${wp?.plannedHours || 2} Hours)\n` +
      `• *Topic:* Unit ${syl?.unitNo || '—'}: ${syl?.title || '—'}\n` +
      `• *Instructor:* ${trainer?.name || 'Assigned Instructor'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *Learning Objectives:*\n${lp.objectives}\n\n` +
      `🛠️ *Required Materials:*\n${lp.materialsNeeded}\n\n` +
      `📋 *Methodology:*\n${lp.methodology}\n\n` +
      `✅ *Assessment Method:*\n${lp.assessmentMethod}\n\n` +
      `📝 *Homework / Drill:*\n${lp.homework || 'Review session workbook'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Official TVET Competency Lesson Plan compliant with CTEVT guidelines._`
    );
  };

  const getBatchLessonPlansShareText = () => {
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `📚 *BATCH LESSON PLANS OVERVIEW (पाठ योजना सारांश)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch / Group:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *Course:* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *Instructor:* ${trainer?.name || 'Assigned Instructor'}\n` +
      `• *Total Prepared Lesson Plans:* ${groupLessonPlans.length}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Prepared Units Summary:*\n` +
      groupLessonPlans.slice(0, 6).map((lp, idx) => {
        const wp = db.workPlans.find((w) => w.id === lp.workPlanId);
        const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);
        return `${idx + 1}. ${wp?.planDate || '—'}: Unit ${syl?.unitNo || '—'} (${syl?.title || 'Topic'})`;
      }).join('\n') +
      (groupLessonPlans.length > 6 ? `\n...and ${groupLessonPlans.length - 6} more prepared plans.` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Certified institutional curriculum documentation._`
    );
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssignmentIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Lesson Plan (पाठ योजना / तयारी)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Trainer pedagogical preparation document mapped from Work Plan. Details methodology, materials, and assessment.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Batch A4 View */}
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
            A4 Batch Document / PDF
          </Button>

          {/* WhatsApp Share */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(trainer?.phone || '', getBatchLessonPlansShareText())}
            target="_blank"
            sx={{ fontWeight: 700 }}
          >
            WhatsApp Share
          </Button>

          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
            + Prepare Lesson Plan
          </Button>
        </Box>
      </Box>

      {/* Group Selector & Overview Banner */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                bgcolor: '#f8fafc',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center'
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  WORK PLANS
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  {availableWorkPlans.length} Planned
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  LESSON PLANS READY
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                  {groupLessonPlans.length} Prepared
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  COVERAGE
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#16834b' }}>
                  {availableWorkPlans.length > 0
                    ? `${Math.round((groupLessonPlans.length / availableWorkPlans.length) * 100)}%`
                    : '0%'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Filter and View Switcher Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <TextField
          size="small"
          placeholder="Search by topic, date, objectives, methodology, materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: 380 }, bgcolor: '#ffffff' }}
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
            Showing {filteredLessonPlans.length} of {groupLessonPlans.length} plans
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
                  <TableCell sx={{ fontWeight: 800, width: 140 }}>Date & Duration</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Syllabus Unit Topic</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Learning Objectives</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Methodology & Materials</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Assessment Method</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 140, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLessonPlans.map((lp, index) => {
                  const wp = db.workPlans.find((w) => w.id === lp.workPlanId);
                  const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);

                  return (
                    <TableRow key={lp.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#647089', textAlign: 'center' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {wp?.planDate || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1a56b0', fontWeight: 700, display: 'block' }}>
                          {wp?.dayName} • {wp?.plannedHours || 2} Hours
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                          Unit {syl?.unitNo || '—'}: {syl?.title || 'Syllabus Topic'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {lp.objectives}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block' }}>
                          Method:
                        </Typography>
                        {lp.methodology}
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block', mt: 0.5 }}>
                          Materials:
                        </Typography>
                        {lp.materialsNeeded}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {lp.assessmentMethod}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="View Official A4 Lesson Plan (Printable/PDF)">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setModalTargetItem(lp);
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
                            href={getWhatsAppUrl('', getSingleLessonPlanShareText(lp))}
                            target="_blank"
                            sx={{ color: '#16834b' }}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Lesson Plan">
                          <IconButton size="small" onClick={() => handleOpenEdit(lp)} sx={{ color: '#475569' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(lp.id)} sx={{ color: '#d5372f' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLessonPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      {searchTerm
                        ? 'No lesson plans match your search query.'
                        : 'No lesson plans prepared yet. Select a Work Plan and click "+ Prepare Lesson Plan".'}
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
          {filteredLessonPlans.map((lp, index) => {
            const wp = db.workPlans.find((w) => w.id === lp.workPlanId);
            const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);
            return (
              <Grid item xs={12} sm={6} md={4} key={lp.id}>
                <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip label={`S.N. ${index + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                    <Chip label={`${wp?.plannedHours || 2} Hours`} size="small" color="primary" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', mb: 0.5 }}>
                    Unit {syl?.unitNo || '—'}: {syl?.title || 'Syllabus'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
                    📅 {wp?.planDate} ({wp?.dayName})
                  </Typography>

                  <Box sx={{ mb: 1.5, flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Learning Objectives:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', mb: 1 }}>
                      {lp.objectives}
                    </Typography>

                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Methodology:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', mb: 1 }}>
                      {lp.methodology}
                    </Typography>

                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Materials:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                      {lp.materialsNeeded}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        setModalTargetItem(lp);
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
                        href={getWhatsAppUrl('', getSingleLessonPlanShareText(lp))}
                        target="_blank"
                        sx={{ color: '#16834b' }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenEdit(lp)} sx={{ color: '#475569' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(lp.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit Lesson Plan' : 'Prepare Lesson Plan (दैनिक पाठ योजना)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Work Plan Link */}
            <TextField
              select
              label="Select Work Plan Entry"
              fullWidth
              value={formData.workPlanId}
              onChange={(e) => handleWorkPlanSelect(e.target.value)}
              required
            >
              {availableWorkPlans.map((wp) => {
                const s = db.syllabi.find((x) => x.id === wp.syllabusId);
                return (
                  <MenuItem key={wp.id} value={wp.id}>
                    {wp.planDate} ({wp.dayName}) — Unit {s?.unitNo}: {s?.title} ({wp.plannedHours} hrs)
                  </MenuItem>
                );
              })}
            </TextField>

            <TextField
              label="Learning Objectives (सिकाइ उपलब्धि / उद्देश्य)"
              multiline
              rows={2}
              fullWidth
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              required
            />

            <TextField
              label="Teaching Methodology (शिक्षण विधि र चरणहरू)"
              multiline
              rows={2}
              fullWidth
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              helperText="E.g. Introduction (15m), Trainer Demo (30m), Trainee Practice (60m), Review (15m)"
            />

            <TextField
              label="Training Materials & Consumables (आवश्यक शिक्षण सामग्री तथा उपकरण)"
              fullWidth
              value={formData.materialsNeeded}
              onChange={(e) => setFormData({ ...formData, materialsNeeded: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Assessment Method"
                  fullWidth
                  value={formData.assessmentMethod}
                  onChange={(e) => setFormData({ ...formData, assessmentMethod: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Homework / Assignment"
                  fullWidth
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              label="Special Instructor Notes & Precautions"
              fullWidth
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 800 }}>
            {editingItem ? 'Update Lesson Plan' : 'Save Lesson Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Official CTEVT Standard A4 Printable Modal */}
      <OfficialDocumentModal
        open={officialModalOpen}
        onClose={() => setOfficialModalOpen(false)}
        docType="LESSON_PLAN"
        title={modalTargetItem ? 'OFFICIAL VOCATIONAL LESSON PLAN' : 'COMPILATION OF LESSON PLANS'}
        nepaliTitle={modalTargetItem ? 'दैनिक पाठ योजना' : 'पाठ योजना सँगालो'}
        group={selectedGroup}
        course={selectedCourse}
        trainer={trainer}
        metadata={{
          dateRange: modalTargetItem
            ? (() => {
                const wp = db.workPlans.find((w) => w.id === modalTargetItem.workPlanId);
                return `${wp?.planDate || '—'} (${wp?.dayName || '—'})`;
              })()
            : `${selectedGroup?.admissionDate || '2026-09-01'} → ${selectedGroup?.expectedEndDate || '2026-10-31'}`
        }}
        shareText={modalTargetItem ? getSingleLessonPlanShareText(modalTargetItem) : getBatchLessonPlansShareText()}
        sharePhone={trainer?.phone || ''}
      >
        {modalTargetItem ? (
          /* Single Lesson Plan Standard CTEVT A4 View */
          <Box>
            {(() => {
              const wp = db.workPlans.find((w) => w.id === modalTargetItem.workPlanId);
              const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);
              return (
                <Box>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1', mb: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                      TOPIC: UNIT {syl?.unitNo}: {syl?.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3, fontWeight: 700 }}>
                      Scheduled Date: {wp?.planDate} ({wp?.dayName}) • Allocated Duration: {wp?.plannedHours || 2} Hours
                    </Typography>
                  </Box>

                  <Table size="small" sx={{ border: '1.5px solid #0f172a', '& td': { border: '1px solid #cbd5e1', p: 1.3, fontSize: '0.85rem' } }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, width: '32%', bgcolor: '#f1f5f9' }}>
                          1. SPECIFIC LEARNING OBJECTIVES<br />
                          <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(ज्ञान तथा सीपगत उद्देश्यहरू)</span>
                        </TableCell>
                        <TableCell>
                          {modalTargetItem.objectives || 'Upon completion, trainees will be competent in performing standard procedures safely.'}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                          2. REQUIRED MATERIALS & TOOLS<br />
                          <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(आवश्यक शिक्षण सामग्री तथा औजार)</span>
                        </TableCell>
                        <TableCell>
                          {modalTargetItem.materialsNeeded || 'Standard toolsets, personal protective equipment (PPE), workbooks, and demonstration media.'}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                          3. INSTRUCTIONAL METHODOLOGY<br />
                          <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(शिक्षण-सिकाइ प्रक्रिया तथा चरणहरू)</span>
                        </TableCell>
                        <TableCell>
                          {modalTargetItem.methodology || '15 min introduction & safety; 30 min trainer demo; 60 min trainee practice; 15 min review.'}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                          4. COMPETENCY ASSESSMENT<br />
                          <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(दक्षता मूल्यांकन विधि)</span>
                        </TableCell>
                        <TableCell>
                          {modalTargetItem.assessmentMethod || 'Continuous direct observation, checklist rating, and oral questioning.'}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                          5. HOMEWORK & PRACTICAL DRILL<br />
                          <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(गृहकार्य तथा स्व-अभ्यास)</span>
                        </TableCell>
                        <TableCell>
                          {modalTargetItem.homework || 'Review handbook safety principles and logbook entries.'}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#f1f5f9' }}>
                          6. INSTRUCTOR REMARKS & NOTES<br />
                          <span style={{ fontWeight: 600, color: '#647089', fontSize: '0.78rem' }}>(विशेष निर्देशन तथा टिप्पणी)</span>
                        </TableCell>
                        <TableCell>
                          {modalTargetItem.notes || 'Ensure safety adherence and individual student encouragement.'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              );
            })()}
          </Box>
        ) : (
          /* Batch Compilation of Lesson Plans */
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem' } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 45 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 95 }}>मिति र बार</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>पाठ्यक्रम शीर्षक</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>सिकाइ उद्देश्यहरू</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>विधि तथा सामग्री</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 100 }}>मूल्यांकन विधि</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupLessonPlans.map((lp, idx) => {
                  const wp = db.workPlans.find((w) => w.id === lp.workPlanId);
                  const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);
                  return (
                    <TableRow key={lp.id}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <b>{wp?.planDate || '—'}</b>
                        <br />
                        <span style={{ color: '#647089' }}>{wp?.dayName}</span>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Unit {syl?.unitNo}: {syl?.title}
                      </TableCell>
                      <TableCell>{lp.objectives}</TableCell>
                      <TableCell>
                        <b>विधि:</b> {lp.methodology}
                        <br />
                        <b>सामग्री:</b> {lp.materialsNeeded}
                      </TableCell>
                      <TableCell>{lp.assessmentMethod}</TableCell>
                    </TableRow>
                  );
                })}
                {groupLessonPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                      No lesson plans prepared for this group yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </OfficialDocumentModal>
    </Box>
  );
}
