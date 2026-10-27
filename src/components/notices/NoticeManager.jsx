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
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CampaignIcon sx={{ color: '#1a56b0', fontSize: 34 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Notice Board & Circulars (सूचना तथा परिपत्र केन्द्र)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Official institutional announcements broadcasted to Trainers, Students, and Staff.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
          + Broadcast New Notice
        </Button>
      </Box>

      {/* Filter & View Switcher Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Search notice title, content, author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 340 }, bgcolor: '#ffffff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {['All', 'Urgent', 'Normal'].map((p) => (
              <Chip
                key={p}
                label={p}
                clickable
                color={priorityFilter === p ? (p === 'Urgent' ? 'error' : 'primary') : 'default'}
                onClick={() => setPriorityFilter(p)}
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700 }}>
            Showing {filteredNotices.length} of {totalNotices}
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: '#ffffff' }}
          >
            <ToggleButton value="table" title="Table View">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card" title="Card View">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Table vs Card View */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
          <TableContainer>
            <Table>
              <TableHead
                sx={{
                  bgcolor: '#0F2E5A',
                  '& .MuiTableCell-head': {
                    bgcolor: '#0F2E5A !important',
                    color: '#FFFFFF !important',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    py: 1.5,
                    borderBottom: '2px solid #F59E0B'
                  }
                }}
              >
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>
                    क्र.सं. (S.N.)
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>मिति (Date)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्राथमिकता (Priority)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सूचना शीर्षक (Notice Title)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>लक्षित समूह (Target Audience)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>व्यहोरा संक्षेप (Summary)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>जारीकर्ता (Issued By)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>कार्यहरू (Actions)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotices.map((n, idx) => (
                  <TableRow key={n.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#64748B', textAlign: 'center', width: 65 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#647089' }}>
                      {n.createdAt?.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={n.priority === 'Urgent' ? <PriorityHighIcon /> : <NotificationsActiveIcon />}
                        label={n.priority}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: n.priority === 'Urgent' ? '#fee2e2' : '#e0f2fe',
                          color: n.priority === 'Urgent' ? '#dc2626' : '#0369a1'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {n.title}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={n.targetRole === 'ALL' ? 'All Institute' : n.targetRole === 'TRAINERS' ? 'Trainers Only' : 'Students Only'}
                        size="small"
                        sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320, color: '#334155', fontSize: '0.85rem' }}>
                      {n.content}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                      {n.author}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(n)} sx={{ color: '#1a56b0', mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(n.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNotices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
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
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <CampaignIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'आधिकारिक सूचना सम्पादन (Edit Notice)' : 'नयाँ आधिकारिक सूचना जारी (Broadcast Notice)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                समस्त प्रशिक्षार्थी, प्रशिक्षक तथा कर्मचारी वर्गका लागि सूचना प्रसारण
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
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
            p: 3,
            bgcolor: '#FFFFFF',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Notice Title (e.g. Dashain Break / CTEVT Inspection) *"
              fullWidth
              size="small"
              placeholder="उदा: बडादशैं बिदा सम्बन्धमा / CTEVT अनुगमन"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Target Audience"
                  fullWidth
                  size="small"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                >
                  <MenuItem value="ALL">Entire Institute (सबैका लागि)</MenuItem>
                  <MenuItem value="TRAINERS">Trainers Only (प्रशिक्षकहरू)</MenuItem>
                  <MenuItem value="STUDENTS">Students Only (प्रशिक्षार्थीहरू)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Priority Level"
                  fullWidth
                  size="small"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="Normal">Normal Notice (सामान्य)</MenuItem>
                  <MenuItem value="Urgent">Urgent / Immediate Action (जरुरी)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Notice Content / Circular Directives *"
              multiline
              rows={4}
              fullWidth
              size="small"
              placeholder="सूचनाको सम्पूर्ण व्यहोरा, मिति तथा पालना गर्नुपर्ने निर्देशनहरू..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />

            <TextField
              label="Author / Signing Authority"
              fullWidth
              size="small"
              placeholder="उदा: प्रिन्सिपल / प्रशासन शाखा"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
          </Stack>
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
            रद्द गर्नुहोस् (Cancel)
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
            {editingItem ? 'अद्यावधिक गर्नुहोस्' : 'सूचना जारी गर्नुहोस् (Broadcast)'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
