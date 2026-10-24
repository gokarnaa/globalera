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
  LinearProgress,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { loadDB, saveDB, getHolidayInfo, logAudit } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import OfficialDocumentModal from '../common/OfficialDocumentModal';

export default function WorkPlanManager({ onNavigateToLessonPlan }) {
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
  const [modalTargetItem, setModalTargetItem] = useState(null); // null = entire batch; item = single work plan

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const availableSyllabi = (db.syllabi || []).filter((s) => s.courseId === selectedCourse?.id);
  const trainer = db.trainers.find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Trainer', phone: '' };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [formData, setFormData] = useState({
    groupId: selectedGroupId,
    syllabusId: '',
    planDate: new Date().toISOString().slice(0, 10),
    dayName: daysOfWeek[new Date().getDay()],
    theoryAspect: '',
    practicalAspect: '',
    plannedHours: 2,
    status: 'Pending'
  });

  const groupWorkPlans = (db.workPlans || []).filter((wp) => wp.groupId === selectedGroupId);

  const filteredWorkPlans = groupWorkPlans.filter((wp) => {
    const syl = db.syllabi.find((s) => s.id === wp.syllabusId);
    const q = searchTerm.toLowerCase();
    return (
      (wp.planDate || '').toLowerCase().includes(q) ||
      (wp.dayName || '').toLowerCase().includes(q) ||
      (syl?.title || '').toLowerCase().includes(q) ||
      (wp.theoryAspect || '').toLowerCase().includes(q) ||
      (wp.practicalAspect || '').toLowerCase().includes(q) ||
      (wp.status || '').toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalPlannedHours = groupWorkPlans.reduce((sum, wp) => sum + (Number(wp.plannedHours) || 0), 0);
  const completedHours = groupWorkPlans
    .filter((wp) => wp.status === 'Completed')
    .reduce((sum, wp) => sum + (Number(wp.plannedHours) || 0), 0);
  const progressPercent = totalPlannedHours > 0 ? Math.round((completedHours / totalPlannedHours) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingItem(null);
    const today = new Date().toISOString().slice(0, 10);
    const firstSyllabus = availableSyllabi[0];
    setFormData({
      groupId: selectedGroupId,
      syllabusId: firstSyllabus?.id || '',
      planDate: today,
      dayName: daysOfWeek[new Date(today).getDay()],
      theoryAspect: firstSyllabus ? `Theoretical concepts and fundamental principles of ${firstSyllabus.title}` : '',
      practicalAspect: firstSyllabus ? `Hands-on demonstration and student practice drill on ${firstSyllabus.title}` : '',
      plannedHours: 2,
      status: 'Pending'
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (wp) => {
    setEditingItem(wp);
    setFormData({
      groupId: wp.groupId,
      syllabusId: wp.syllabusId,
      planDate: wp.planDate,
      dayName: wp.dayName,
      theoryAspect: wp.theoryAspect || '',
      practicalAspect: wp.practicalAspect || '',
      plannedHours: wp.plannedHours || 2,
      status: wp.status || 'Pending'
    });
    setOpenDialog(true);
  };

  const handleSyllabusSelect = (syllabusId) => {
    const syl = availableSyllabi.find((s) => s.id === syllabusId);
    setFormData((prev) => ({
      ...prev,
      syllabusId,
      theoryAspect: syl ? `Theory of ${syl.title}: Key principles and safety procedures.` : prev.theoryAspect,
      practicalAspect: syl ? `Practical drill on ${syl.title}: Tools handling and execution.` : prev.practicalAspect
    }));
  };

  const handleDateChange = (dateStr) => {
    const d = new Date(dateStr);
    const day = isNaN(d.getTime()) ? '' : daysOfWeek[d.getDay()];
    setFormData((prev) => ({ ...prev, planDate: dateStr, dayName: day }));
  };

  const handleSave = () => {
    if (!formData.syllabusId || !formData.planDate) {
      alert('Syllabus unit and Plan Date are required.');
      return;
    }

    let updatedList = [...(db.workPlans || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `WP-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    let nextDb = { ...db, workPlans: updatedList };
    nextDb = logAudit(
      nextDb,
      editingItem ? 'UPDATE' : 'CREATE',
      'WorkPlan',
      editingItem ? editingItem.id : updatedList[updatedList.length - 1].id,
      `Work plan ${editingItem ? 'updated' : 'created'} for ${selectedGroup?.groupCode || selectedGroupId} on ${formData.planDate} (${formData.plannedHours} hrs)`,
      currentUser?.name || 'Admin'
    );
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this work plan?')) {
      let nextDb = {
        ...db,
        workPlans: db.workPlans.filter((x) => x.id !== id)
      };
      nextDb = logAudit(
        nextDb,
        'DELETE',
        'WorkPlan',
        id,
        `Work plan ${id} deleted for group ${selectedGroup?.groupCode || selectedGroupId}`,
        currentUser?.name || 'Admin'
      );
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // WhatsApp share message for Batch Work Plan
  const getBatchShareText = () => {
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `📋 *OFFICIAL VOCATIONAL WORK PLAN (कार्य योजना)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch / Group:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *Course:* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *Instructor:* ${trainer?.name || 'Assigned Instructor'} ${trainer?.phone ? `(${trainer.phone})` : ''}\n` +
      `• *Total Planned:* ${groupWorkPlans.length} Sessions (${totalPlannedHours} Hours)\n` +
      `• *Progress:* ${progressPercent}% Completed\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Schedule Outline:*\n` +
      groupWorkPlans.slice(0, 6).map((wp, idx) => {
        const syl = db.syllabi.find((s) => s.id === wp.syllabusId);
        return `${idx + 1}. ${wp.planDate} (${wp.dayName}): ${syl?.title || 'Unit'} [${wp.plannedHours} hrs - ${wp.status}]`;
      }).join('\n') +
      (groupWorkPlans.length > 6 ? `\n...and ${groupWorkPlans.length - 6} more planned sessions.` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Certified institutional syllabus work plan compliant with CTEVT standards._`
    );
  };

  const getSingleUnitShareText = (wp) => {
    const syl = db.syllabi.find((s) => s.id === wp?.syllabusId);
    return (
      `*KITE CAREGIVER TRAINING CENTER / ग्लोबल एरा प्राविधिक स्कुल*\n` +
      `📄 *OFFICIAL UNIT WORK PLAN (एकाइ कार्य योजना)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch:* ${selectedGroup?.groupCode || '—'} | *Shift:* ${selectedGroup?.shift || 'A'}\n` +
      `• *Date:* ${wp?.planDate} (${wp?.dayName})\n` +
      `• *Unit:* Unit ${syl?.unitNo || '—'}: ${syl?.title || '—'}\n` +
      `• *Planned Duration:* ${wp?.plannedHours || 2} Hours\n` +
      `• *Theory:* ${wp?.theoryAspect || '—'}\n` +
      `• *Practical:* ${wp?.practicalAspect || '—'}\n` +
      `• *Status:* ${wp?.status || 'Pending'}\n` +
      `• *Instructor:* ${trainer?.name || '—'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_CTEVT vocational delivery standard record._`
    );
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EventNoteIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Work Plan (कार्य योजना)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Syllabus delivery schedule mapping Training Group + Curriculum to calendar dates and hours.
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
            A4 Official View / PDF
          </Button>

          {/* Batch WhatsApp Share */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={getWhatsAppUrl(trainer?.phone || '', getBatchShareText())}
            target="_blank"
            sx={{ fontWeight: 700 }}
          >
            WhatsApp Share
          </Button>

          {/* Create Button */}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
            + Create Work Plan
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
                  CURRICULUM UNITS
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {availableSyllabi.length} Units ({groupWorkPlans.length} Planned)
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  TOTAL HOURS
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                  {totalPlannedHours} / {selectedCourse?.durationHours || 160} hrs
                </Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
                <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                  DELIVERY PROGRESS
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{ flexGrow: 1, height: 7, borderRadius: 3 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {progressPercent}%
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
          placeholder="Search by date, topic, syllabus unit, theory, or status..."
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
            Showing {filteredWorkPlans.length} of {groupWorkPlans.length} entries
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
                  <TableCell sx={{ fontWeight: 800, width: 140 }}>Date & Day</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Syllabus Unit</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Theoretical Aspect</TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Practical Aspect</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 90 }}>Hours</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 110 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 130, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWorkPlans.map((wp, index) => {
                  const syl = db.syllabi.find((s) => s.id === wp.syllabusId);
                  return (
                    <TableRow key={wp.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#647089', textAlign: 'center' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {wp.planDate}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.3 }}>
                          <Typography variant="caption" sx={{ color: '#647089' }}>
                            {wp.dayName}
                          </Typography>
                          {(() => {
                            const hInfo = getHolidayInfo(wp.planDate, db.holidays);
                            if (hInfo.isHoliday) {
                              return (
                                <Tooltip title={hInfo.name}>
                                  <Chip
                                    size="small"
                                    label={hInfo.type === 'Weekly Off' ? 'Sat' : 'Holiday'}
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      bgcolor: hInfo.type === 'Weekly Off' ? '#e0f2fe' : '#fef3c7',
                                      color: hInfo.type === 'Weekly Off' ? '#0369a1' : '#b45309'
                                    }}
                                  />
                                </Tooltip>
                              );
                            }
                            return null;
                          })()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                          Unit {syl?.unitNo || '—'}: {syl?.title || 'Syllabus Topic'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089' }}>
                          Curriculum: {syl?.totalHours || 0} hrs total
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {wp.theoryAspect || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {wp.practicalAspect || '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#1a56b0' }}>
                        {wp.plannedHours} hrs
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={wp.status === 'Completed' ? <CheckCircleOutlineIcon /> : <HourglassEmptyIcon />}
                          label={wp.status}
                          size="small"
                          sx={{
                            bgcolor: wp.status === 'Completed' ? '#e5f8ee' : '#fef3c7',
                            color: wp.status === 'Completed' ? '#16834b' : '#b45309',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="Official A4 View & PDF">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setModalTargetItem(wp);
                              setOfficialModalOpen(true);
                            }}
                            sx={{ color: '#1a56b0' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Work Plan">
                          <IconButton size="small" onClick={() => handleOpenEdit(wp)} sx={{ color: '#475569' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(wp.id)} sx={{ color: '#d5372f' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredWorkPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      {searchTerm
                        ? 'No work plans match your search query.'
                        : 'No work plans created for this group yet. Click "+ Create Work Plan" to map your syllabus.'}
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
          {filteredWorkPlans.map((wp, index) => {
            const syl = db.syllabi.find((s) => s.id === wp.syllabusId);
            return (
              <Grid item xs={12} sm={6} md={4} key={wp.id}>
                <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={`S.N. ${index + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                      <Chip
                        label={wp.status}
                        size="small"
                        sx={{
                          bgcolor: wp.status === 'Completed' ? '#e5f8ee' : '#fef3c7',
                          color: wp.status === 'Completed' ? '#16834b' : '#b45309',
                          fontWeight: 700
                        }}
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0' }}>
                      {wp.plannedHours} hrs
                    </Typography>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', mb: 0.5 }}>
                    Unit {syl?.unitNo || '—'}: {syl?.title || 'Syllabus Topic'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
                    📅 {wp.planDate} ({wp.dayName})
                  </Typography>

                  <Box sx={{ mb: 1.5, flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Theory:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', mb: 1 }}>
                      {wp.theoryAspect || '—'}
                    </Typography>

                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Practical Drills:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                      {wp.practicalAspect || '—'}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        setModalTargetItem(wp);
                        setOfficialModalOpen(true);
                      }}
                      sx={{ fontWeight: 700 }}
                    >
                      A4 View
                    </Button>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(wp)} sx={{ color: '#475569' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(wp.id)} sx={{ color: '#d5372f' }}>
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
          {editingItem ? 'Edit Work Plan Entry' : `Create Work Plan for Group ${selectedGroup?.groupCode}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Plan Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.planDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Day Name (Auto)"
                  fullWidth
                  disabled
                  value={formData.dayName}
                />
              </Grid>
            </Grid>

            {(() => {
              const hInfo = getHolidayInfo(formData.planDate, db.holidays);
              if (hInfo.isHoliday) {
                return (
                  <Chip
                    color="warning"
                    variant="outlined"
                    label={`⚠️ Holiday Note: ${hInfo.name} (${hInfo.type})`}
                    sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}
                  />
                );
              }
              return null;
            })()}

            {/* Syllabus Item Selection */}
            <TextField
              select
              label="Select Syllabus Unit"
              fullWidth
              value={formData.syllabusId}
              onChange={(e) => handleSyllabusSelect(e.target.value)}
              required
            >
              {availableSyllabi.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  Unit {s.unitNo}: {s.title} ({s.totalHours} hrs)
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Theoretical Aspect (सैद्धान्तिक विषयवस्तु)"
              multiline
              rows={2}
              fullWidth
              value={formData.theoryAspect}
              onChange={(e) => setFormData({ ...formData, theoryAspect: e.target.value })}
            />

            <TextField
              label="Practical Aspect (प्रयोगात्मक अभ्यास)"
              multiline
              rows={2}
              fullWidth
              value={formData.practicalAspect}
              onChange={(e) => setFormData({ ...formData, practicalAspect: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Planned Hours for Day"
                  fullWidth
                  value={formData.plannedHours}
                  onChange={(e) => setFormData({ ...formData, plannedHours: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Rescheduled">Rescheduled</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 800 }}>
            {editingItem ? 'Update Work Plan' : 'Save Work Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Official CTEVT Standard A4 Printable Modal */}
      <OfficialDocumentModal
        open={officialModalOpen}
        onClose={() => setOfficialModalOpen(false)}
        docType="WORK_PLAN"
        title={modalTargetItem ? 'OFFICIAL UNIT WORK PLAN' : 'TRAINING DELIVERY WORK PLAN'}
        nepaliTitle={modalTargetItem ? 'एकाइ कार्य योजना' : 'सत्र / वार्षिक कार्य योजना'}
        group={selectedGroup}
        course={selectedCourse}
        trainer={trainer}
        metadata={{
          dateRange: modalTargetItem
            ? `${modalTargetItem.planDate} (${modalTargetItem.dayName})`
            : `${selectedGroup?.admissionDate || '2026-09-01'} → ${selectedGroup?.expectedEndDate || '2026-10-31'}`
        }}
        shareText={modalTargetItem ? getSingleUnitShareText(modalTargetItem) : getBatchShareText()}
        sharePhone={trainer?.phone || ''}
      >
        {modalTargetItem ? (
          /* Single Unit View */
          <Box>
            {(() => {
              const syl = db.syllabi.find((s) => s.id === modalTargetItem.syllabusId);
              return (
                <Box>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #cbd5e1', mb: 2.5, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                      UNIT {syl?.unitNo}: {syl?.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                      <b>Scheduled Date:</b> {modalTargetItem.planDate} ({modalTargetItem.dayName}) • <b>Session Duration:</b> {modalTargetItem.plannedHours} Hours
                    </Typography>
                  </Box>

                  <Table size="small" sx={{ border: '1px solid #0f172a', mb: 2.5 }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, width: '30%', bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                          Theoretical Knowledge (सैद्धान्तिक पक्ष)
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {modalTargetItem.theoryAspect || 'Fundamental theories, safety regulations, and operational standard procedures.'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                          Practical Skills (प्रयोगात्मक सीप)
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {modalTargetItem.practicalAspect || 'Step-by-step practical demonstration, individual trainee drills, and tool handling.'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                          Competency Learning Outcome (अपेक्षित उपलब्धि)
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {syl?.learningOutcome || 'Trainee will independently execute tasks according to vocational competency benchmarks.'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                          Delivery Status (अवस्था)
                        </TableCell>
                        <TableCell sx={{ py: 1.5, fontWeight: 800 }}>
                          {modalTargetItem.status}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              );
            })()}
          </Box>
        ) : (
          /* Batch Work Plan Table */
          <Box>
            <Table size="small" sx={{ border: '1px solid #0f172a', '& th, & td': { border: '1px solid #cbd5e1', fontSize: '0.8rem' } }}>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 45 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 95 }}>मिति र बार</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>पाठ्यक्रम इकाइ</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>सैद्धान्तिक विषयवस्तु</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>प्रयोगात्मक अभ्यास</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 50 }}>घन्टा</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 70 }}>कैफियत</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupWorkPlans.map((wp, idx) => {
                  const syl = db.syllabi.find((s) => s.id === wp.syllabusId);
                  return (
                    <TableRow key={wp.id}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <b>{wp.planDate}</b>
                        <br />
                        <span style={{ color: '#647089' }}>{wp.dayName}</span>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Unit {syl?.unitNo}: {syl?.title}
                      </TableCell>
                      <TableCell>{wp.theoryAspect || '—'}</TableCell>
                      <TableCell>{wp.practicalAspect || '—'}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{wp.plannedHours}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{wp.status}</TableCell>
                    </TableRow>
                  );
                })}
                {groupWorkPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                      No work plan records created for this group.
                    </TableCell>
                  </TableRow>
                )}
                {/* Total Summary Row */}
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell colSpan={5} sx={{ fontWeight: 900, textAlign: 'right' }}>
                    कुल योजना गरिएको समय (TOTAL PLANNED HOURS):
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#1a56b0' }}>
                    {totalPlannedHours}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>
                    {progressPercent}% Complete
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
