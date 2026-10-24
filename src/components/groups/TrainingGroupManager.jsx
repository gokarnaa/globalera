import React, { useState, useEffect } from 'react';
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
  Avatar,
  Paper,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PeopleIcon from '@mui/icons-material/People';
import { loadDB, saveDB, SHIFT_DEFINITIONS, calculateExpectedEndDate } from '../../services/storage';

export default function TrainingGroupManager({ onNavigateToAttendance, onNavigateToStudents }) {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [rosterGroup, setRosterGroup] = useState(null);

  const [formData, setFormData] = useState({
    groupCode: '',
    courseId: '',
    trainerId: '',
    shift: 'A',
    startTime: '07:00 AM',
    endTime: '09:00 AM',
    startDate: new Date().toISOString().slice(0, 10),
    expectedEndDate: '',
    status: 'Running'
  });

  const selectedCourse = db.courses.find((c) => c.id === formData.courseId);
  const selectedOccupation = db.occupations.find((o) => o.id === selectedCourse?.occupationId);
  const matchingTrainers = db.trainers.filter(
    (t) => !selectedCourse || t.occupationId === selectedCourse.occupationId
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    const defaultCourse = db.courses[0];
    const defaultStart = new Date().toISOString().slice(0, 10);
    const calculatedEnd = defaultCourse
      ? calculateExpectedEndDate(defaultStart, defaultCourse.durationValue, defaultCourse.durationUnit)
      : '';

    setFormData({
      groupCode: `GRP-${String(db.trainingGroups.length + 1).padStart(2, '0')}`,
      courseId: defaultCourse?.id || '',
      trainerId: db.trainers.find((t) => t.occupationId === defaultCourse?.occupationId)?.id || db.trainers[0]?.id || '',
      shift: 'A',
      startTime: '07:00 AM',
      endTime: '09:00 AM',
      startDate: defaultStart,
      expectedEndDate: calculatedEnd,
      status: 'Running'
    });
    setOpenDialog(true);
  };

  const handleCourseChange = (courseId) => {
    const course = db.courses.find((c) => c.id === courseId);
    const calcEnd = course
      ? calculateExpectedEndDate(formData.startDate, course.durationValue, course.durationUnit)
      : formData.expectedEndDate;

    const matchedTrainer = db.trainers.find((t) => t.occupationId === course?.occupationId);

    setFormData((prev) => ({
      ...prev,
      courseId,
      trainerId: matchedTrainer ? matchedTrainer.id : prev.trainerId,
      expectedEndDate: calcEnd
    }));
  };

  const handleShiftChange = (shiftCode) => {
    const shiftDef = SHIFT_DEFINITIONS.find((s) => s.code === shiftCode);
    if (shiftDef) {
      const parts = shiftDef.time.split('–');
      setFormData((prev) => ({
        ...prev,
        shift: shiftCode,
        startTime: parts[0]?.trim() || '',
        endTime: parts[1]?.trim() || ''
      }));
    }
  };

  const handleStartDateChange = (startDate) => {
    const course = db.courses.find((c) => c.id === formData.courseId);
    const calcEnd = course
      ? calculateExpectedEndDate(startDate, course.durationValue, course.durationUnit)
      : '';
    setFormData((prev) => ({ ...prev, startDate, expectedEndDate: calcEnd }));
  };

  const handleSave = () => {
    if (!formData.groupCode.trim() || !formData.courseId || !formData.trainerId) {
      alert('Group Code, Course, and Trainer are required.');
      return;
    }

    let updatedList = [...db.trainingGroups];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `GRP-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    const nextDb = { ...db, trainingGroups: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this training group? Note: Enrolled students will need reassignment.')) {
      const nextDb = {
        ...db,
        trainingGroups: db.trainingGroups.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GroupWorkIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Training Groups / Batches (सञ्चालन केन्द्र)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Operational core of the institution. Links Course + Matching Trainer + Shift + Auto End Date.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          + Create Training Group
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Group Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Course & Occupation</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Assigned Trainer</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Shift & Timings</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Start → Expected End</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Students</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {db.trainingGroups.map((grp) => {
                const course = db.courses.find((c) => c.id === grp.courseId);
                const occ = db.occupations.find((o) => o.id === course?.occupationId);
                const trainer = db.trainers.find((t) => t.id === grp.trainerId);
                const studentsInGroup = (db.students || []).filter((s) => s.groupId === grp.id);

                return (
                  <TableRow key={grp.id} hover>
                    <TableCell>
                      <Chip
                        label={grp.groupCode}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: '#1a56b0', color: '#fff' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {course?.title || 'Course'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#647089' }}>
                        {occ?.name || 'Occupation'} • {course?.level || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={trainer?.photo} sx={{ width: 28, height: 28, bgcolor: '#1a9c5c', fontSize: 13 }}>
                          {trainer?.name?.[0] || 'T'}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {trainer?.name || 'Unassigned'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Shift {grp.shift}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#647089' }}>
                        {grp.startTime} – {grp.endTime}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {grp.startDate}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 700 }}>
                        → {grp.expectedEndDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PeopleIcon />}
                        onClick={() => setRosterGroup(grp)}
                        sx={{ borderRadius: 2, fontWeight: 700, py: 0.2 }}
                      >
                        {studentsInGroup.length} Students
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={grp.status}
                        size="small"
                        sx={{
                          bgcolor: grp.status === 'Running' ? '#e5f8ee' : '#e8f0fd',
                          color: grp.status === 'Running' ? '#16834b' : '#1a56b0',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<FactCheckIcon />}
                        onClick={() => onNavigateToAttendance(grp.id)}
                        sx={{ mr: 1, fontWeight: 700, py: 0.4 }}
                      >
                        Attendance
                      </Button>
                      <IconButton size="small" onClick={() => handleDelete(grp.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Training Group Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? 'Edit Training Group' : 'Create New Training Group (Class)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Group Code (e.g. BT-01, CG-02)"
              fullWidth
              value={formData.groupCode}
              onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
              required
            />

            {/* Course Selection -> Auto cascade Occupation */}
            <TextField
              select
              label="Select Course"
              fullWidth
              value={formData.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              required
            >
              {db.courses.map((crs) => (
                <MenuItem key={crs.id} value={crs.id}>
                  {crs.title} ({crs.durationValue} {crs.durationUnit})
                </MenuItem>
              ))}
            </TextField>

            {/* Auto Cascade Context Info Box */}
            {selectedCourse && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                  AUTO-CASCADED CONTEXT:
                </Typography>
                Occupation: <b>{selectedOccupation?.name}</b> • Curriculum Duration: <b>{selectedCourse.durationValue} {selectedCourse.durationUnit} ({selectedCourse.totalHours} hrs)</b>
              </Alert>
            )}

            {/* Trainer selection filtered by matching occupation */}
            <TextField
              select
              label="Assigned Trainer"
              fullWidth
              value={formData.trainerId}
              onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
              required
            >
              {matchingTrainers.map((trn) => (
                <MenuItem key={trn.id} value={trn.id}>
                  {trn.name} ({trn.specialization || 'Trainer'})
                </MenuItem>
              ))}
            </TextField>

            {/* Shift Selection -> Auto fills Start and End Time */}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  select
                  label="Shift"
                  fullWidth
                  value={formData.shift}
                  onChange={(e) => handleShiftChange(e.target.value)}
                >
                  {SHIFT_DEFINITIONS.map((sh) => (
                    <MenuItem key={sh.code} value={sh.code}>
                      Shift {sh.code}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Start Time"
                  fullWidth
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="End Time"
                  fullWidth
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </Grid>
            </Grid>

            {/* Date Selection -> Auto calculates Expected End Date */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Group Start Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Expected End Date (Auto)"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.expectedEndDate}
                  onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                  helperText="Auto-computed from Course Duration"
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Group Status"
              fullWidth
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="Upcoming">Upcoming</MenuItem>
              <MenuItem value="Running">Running</MenuItem>
              <MenuItem value="OJT Phase">OJT Phase</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Training Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Student Roster Dialog */}
      <Dialog open={Boolean(rosterGroup)} onClose={() => setRosterGroup(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Group Roster: {rosterGroup?.groupCode}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {rosterGroup && (
            <Box>
              <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
                Students currently enrolled in Shift {rosterGroup.shift} ({rosterGroup.startTime} – {rosterGroup.endTime})
              </Typography>
              <Stack spacing={1}>
                {db.students.filter((s) => s.groupId === rosterGroup.id).map((std) => (
                  <Paper key={std.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={std.photoUrl} sx={{ width: 34, height: 34, bgcolor: '#1a56b0' }}>
                      {std.name[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{std.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#647089' }}>{std.tgid} • {std.phone}</Typography>
                    </Box>
                    <Chip label={std.status} size="small" sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 700 }} />
                  </Paper>
                ))}
                {db.students.filter((s) => s.groupId === rosterGroup.id).length === 0 && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 3 }}>
                    No students enrolled yet. Go to Students to enroll.
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRosterGroup(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
