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
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Avatar
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { loadDB, saveDB, logAudit } from '../../services/storage';

export default function NoticeManager() {
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [printNotice, setPrintNotice] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'ALL', // 'ALL', 'TRAINERS', 'STUDENTS'
    priority: 'Normal', // 'Normal', 'Urgent'
    author: 'Principal / Admin'
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      content: '',
      targetRole: 'ALL',
      priority: 'Normal',
      author: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      targetRole: item.targetRole || 'ALL',
      priority: item.priority || 'Normal',
      author: item.author || 'Admin'
    });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Notice title and content are required.');
      return;
    }

    let updatedList = [...(db.notices || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
      logAudit(db, 'UPDATE_NOTICE', 'Notice', editingItem.id, `Updated notice: ${formData.title}`);
    } else {
      const newId = `NOT-${String(updatedList.length + 1).padStart(2, '0')}`;
      const newNotice = {
        id: newId,
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'Active'
      };
      updatedList.unshift(newNotice);
      logAudit(db, 'CREATE_NOTICE', 'Notice', newId, `Published ${formData.priority} notice: ${formData.title}`);
    }

    const nextDb = { ...db, notices: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this broadcast notice?')) {
      const nextDb = {
        ...db,
        notices: (db.notices || []).filter((x) => x.id !== id)
      };
      logAudit(nextDb, 'DELETE_NOTICE', 'Notice', id, `Deleted notice ID ${id}`);
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const noticesList = db.notices || [];
  const totalNotices = noticesList.length;

  const filteredNotices = noticesList.filter((n) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.author || '').toLowerCase().includes(q) ||
      (n.targetRole || '').toLowerCase().includes(q);

    const matchesPriority = priorityFilter === 'All' || n.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 }, maxWidth: '1440px', mx: 'auto' }}>
      {/* Slim 1-Row Executive Header Bar */}
      <Card
        elevation={0}
        sx={{
          py: { xs: 1.25, sm: 1.5 },
          px: { xs: 1.75, sm: 2.25 },
          mb: 1.75,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(15, 46, 90, 0.16)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.8,
                  bgcolor: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <CampaignIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Notice Board &amp; Official Circulars
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Official institutional announcements broadcasted to Trainers, Students &amp; Staff
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                onClick={handleOpenAdd}
                sx={{
                  bgcolor: '#f59e0b',
                  color: '#0f2e5a',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  whiteSpace: 'nowrap',
                  px: 1.4,
                  py: 0.65,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                }}
              >
                + Broadcast New Notice
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Compact Filter & View Switcher Bar */}
      <Card
        elevation={0}
        sx={{
          p: 1.25,
          mb: 1.75,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', flexGrow: 1 }}>
            <TextField
              size="small"
              placeholder="Search notice title, content, author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 }, bgcolor: '#ffffff' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
            />

            <Box sx={{ display: 'flex', gap: 0.6 }}>
              {['All', 'Urgent', 'Normal'].map((p) => (
                <Chip
                  key={p}
                  label={p}
                  size="small"
                  clickable
                  color={priorityFilter === p ? (p === 'Urgent' ? 'error' : 'primary') : 'default'}
                  onClick={() => setPriorityFilter(p)}
                  sx={{ fontWeight: 700, fontSize: '0.74rem' }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, fontSize: '0.74rem' }}>
              Showing {filteredNotices.length} of {totalNotices}
            </Typography>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, next) => next && setViewMode(next)}
              size="small"
              sx={{ bgcolor: '#ffffff' }}
            >
              <ToggleButton value="table" title="Table View" sx={{ py: 0.4, px: 0.9 }}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" title="Card View" sx={{ py: 0.4, px: 0.9 }}>
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Card>

      {/* Table vs Card View */}
      {viewMode === 'table' ? (
        <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <TableContainer>
            <Table size="small">
              <TableHead
                sx={{
                  bgcolor: '#0F2E5A',
                  '& .MuiTableCell-head': {
                    bgcolor: '#0F2E5A !important',
                    color: '#FFFFFF !important',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    py: 1,
                    px: 1.25,
                    borderBottom: '2px solid #F59E0B',
                    whiteSpace: 'nowrap'
                  }
                }}
              >
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 48, textAlign: 'center' }}>
                    S.N.
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Priority</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Notice Title</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Target Audience</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Summary</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Issued By</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotices.map((n, idx) => (
                  <TableRow key={n.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', textAlign: 'center', width: 48, fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#647089', whiteSpace: 'nowrap' }}>
                      {n.createdAt?.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={n.priority === 'Urgent' ? <PriorityHighIcon sx={{ fontSize: '13px !important' }} /> : <NotificationsActiveIcon sx={{ fontSize: '13px !important' }} />}
                        label={n.priority}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: n.priority === 'Urgent' ? '#fee2e2' : '#e0f2fe',
                          color: n.priority === 'Urgent' ? '#dc2626' : '#0369a1'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                      {n.title}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={n.targetRole === 'ALL' ? 'All Institute' : n.targetRole === 'TRAINERS' ? 'Trainers Only' : 'Students Only'}
                        size="small"
                        sx={{ height: 20, bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.68rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320, color: '#334155', fontSize: '0.77rem' }}>
                      {n.content}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.77rem' }}>
                      {n.author}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(n)} sx={{ color: '#1a56b0', p: 0.4, mr: 0.25 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(n.id)} sx={{ color: '#d5372f', p: 0.4 }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNotices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3.5, color: '#94a3b8', fontSize: '0.8rem' }}>
                      No notices matching filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* Card View */
        <Box>
          <Grid container spacing={2.5}>
            {filteredNotices.map((n, idx) => (
              <Grid item xs={12} sm={6} md={4} key={n.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    p: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    borderTop: n.priority === 'Urgent' ? '4px solid #ef4444' : '4px solid #3b82f6',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                      borderColor: '#cbd5e1'
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        label={`#${idx + 1}`}
                        size="small"
                        sx={{ bgcolor: '#0b2545', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem' }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        <Chip
                          label={n.targetRole}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }}
                        />
                        <Chip
                          label={n.priority}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: n.priority === 'Urgent' ? '#fee2e2' : '#e0f2fe',
                            color: n.priority === 'Urgent' ? '#dc2626' : '#0369a1'
                          }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, lineHeight: 1.3 }}>
                      {n.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#334155', mb: 2, lineHeight: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      {n.content}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                      {n.author} • {n.createdAt?.slice(0, 10)}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(n)} sx={{ color: '#1a56b0' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(n.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Add / Edit Notice Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: { backdropFilter: 'blur(5px)', bgcolor: 'rgba(15, 23, 42, 0.45)' }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px solid #F59E0B'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <CampaignIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'Edit Notice' : 'Broadcast Notice'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                Broadcast official announcements to all trainees, instructors, and staff
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            aria-label="Close notice dialog"
            onClick={() => setOpenDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: { xs: 2, sm: 2.5 },
            bgcolor: '#F8FAFC',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Stack spacing={2}>
              <TextField
                label="Notice Title (e.g. Dashain Break / CTEVT Inspection)"
                fullWidth
                size="small"
                placeholder="e.g. Regarding Dashain Vacation / CTEVT Inspection"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Target Audience"
                    fullWidth
                    size="small"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  >
                    <MenuItem value="ALL">Entire Institute (All)</MenuItem>
                    <MenuItem value="TRAINERS">Trainers Only</MenuItem>
                    <MenuItem value="STUDENTS">Students Only</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Priority Level"
                    fullWidth
                    size="small"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <MenuItem value="Normal">Normal Notice</MenuItem>
                    <MenuItem value="Urgent">Urgent / Immediate Action</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                label="Notice Content / Circular Directives"
                multiline
                rows={4}
                fullWidth
                size="small"
                placeholder="Full notice details, dates, and instructions to follow..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />

              <TextField
                label="Author / Signing Authority"
                fullWidth
                size="small"
                placeholder="e.g. Principal / Administration Department"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5
          }}
        >
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              fontWeight: 700,
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: 2,
              px: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handleSave}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 12px rgba(15, 44, 89, 0.25)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0F2444 0%, #172554 100%)',
                boxShadow: '0 6px 16px rgba(15, 44, 89, 0.35)'
              }
            }}
          >
            {editingItem ? 'Update Notice' : 'Broadcast Notice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
