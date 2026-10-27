import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import KeyIcon from '@mui/icons-material/Key';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SyncIcon from '@mui/icons-material/Sync';
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';

import { loadDB, saveDB, generateDefaultUsers } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useDialog } from '../../context/DialogContext';

export default function UserManager() {
  const { confirm, alert } = useDialog();
  const [db, setDb] = useState(loadDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'ADMIN' | 'TRAINER' | 'STUDENT' | 'STAFF'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Suspended'

  // PIN visibility map { [userId]: boolean }
  const [visiblePins, setVisiblePins] = useState({});

  // Modal States
  const [openUserModal, setOpenUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [shareUserModal, setShareUserModal] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    pin: '1234',
    role: 'STUDENT',
    status: 'Active',
    trainerId: '',
    studentId: '',
    title: ''
  });

  const usersList = db.users || [];

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.tgid || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

      return true;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter]);

  // KPI Metrics
  const totalCount = usersList.length;
  const activeCount = usersList.filter((u) => u.status === 'Active').length;
  const suspendedCount = usersList.filter((u) => u.status === 'Suspended').length;
  const trainerCount = usersList.filter((u) => u.role === 'TRAINER').length;
  const studentCount = usersList.filter((u) => u.role === 'STUDENT').length;
  const adminStaffCount = usersList.filter((u) => u.role === 'ADMIN' || u.role === 'STAFF').length;

  const togglePinVisibility = (id) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-Click Suspend / Activate Toggle
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
    const isSuspending = nextStatus === 'Suspended';
    const actionLabel = isSuspending ? 'खाता निलम्बन (Suspend Account)' : 'खाता सक्रिय (Activate Account)';

    const ok = await confirm({
      type: isSuspending ? 'danger' : 'info',
      title: `${actionLabel} निश्चित गर्नुहोस्`,
      message: `के तपाईं प्रयोगकर्ता "${user.name}" को खाता ${isSuspending ? 'निलम्बन' : 'सक्रिय'} गर्न निश्चित हुनुहुन्छ?`,
      detail: isSuspending
        ? 'निलम्बित प्रयोगकर्ताले प्रणालीमा लगइन गर्न पाउने छैनन्।'
        : 'सक्रिय भएपछि प्रयोगकर्ताले आफ्नो पिन प्रयोग गरी तत्काल लगइन गर्न सक्नेछन्।',
      confirmText: isSuspending ? 'हो, निलम्बन गर्नुहोस्' : 'हो, सक्रिय गर्नुहोस्',
      confirmColor: isSuspending ? '#DC2626' : '#2563EB'
    });

    if (ok) {
      const nextUsers = usersList.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u));
      const nextDb = { ...db, users: nextUsers };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      phone: '',
      pin: '1234',
      role: 'STUDENT',
      status: 'Active',
      trainerId: '',
      studentId: '',
      title: ''
    });
    setOpenUserModal(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      phone: user.phone || '',
      pin: user.pin || '1234',
      role: user.role || 'STUDENT',
      status: user.status || 'Active',
      trainerId: user.trainerId || '',
      studentId: user.studentId || '',
      title: user.title || ''
    });
    setOpenUserModal(true);
  };

  // Save User (Create or Update)
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.pin) {
      alert('कृपया नाम, फोन र पिन अनिवार्य रूपमा प्रविष्ट गर्नुहोस्।');
      return;
    }

    let nextUsers = [...usersList];

    if (editingUser) {
      nextUsers = nextUsers.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              ...formData,
              updatedAt: new Date().toISOString()
            }
          : u
      );
    } else {
      const newId = `USR-${Date.now()}`;
      const defaultUsername = formData.username || formData.name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 90 + 10);
      nextUsers.unshift({
        id: newId,
        ...formData,
        username: defaultUsername,
        createdAt: new Date().toISOString()
      });
    }

    const nextDb = { ...db, users: nextUsers };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenUserModal(false);

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    const targetUser = usersList.find((u) => u.id === userId);
    const ok = await confirm({
      type: 'danger',
      title: 'प्रयोगकर्ता मेटाउने निश्चित गर्नुहोस् (Delete User)',
      message: `के तपाईं प्रयोगकर्ता "${targetUser?.name || userId}" लाई स्थायी रूपमा मेटाउन निश्चित हुनुहुन्छ?`,
      detail: 'यो प्रयोगकर्ता प्रणालीबाट हट्नेछ र लगइन गर्न असमर्थ हुनेछ। यो कार्य पूर्ववत गर्न सकिने छैन।',
      confirmText: 'हो, मेटाउनुहोस् (Delete)',
      confirmColor: '#DC2626'
    });
    if (ok) {
      const nextUsers = usersList.filter((u) => u.id !== userId);
      const nextDb = { ...db, users: nextUsers };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // Auto-Sync Accounts with Trainers & Students
  const handleAutoSync = () => {
    const existingIds = new Set(usersList.map((u) => u.id));
    const generated = generateDefaultUsers(db.trainers || [], db.students || []);

    const newAccounts = generated.filter((g) => !existingIds.has(g.id));

    if (newAccounts.length === 0) {
      alert('सबै प्रशिक्षक र विद्यार्थीहरूको खाता पहिले नै सिर्जना भइसकेको छ। (All Accounts Synced)');
      return;
    }

    const nextDb = {
      ...db,
      users: [...usersList, ...newAccounts]
    };

    saveDB(nextDb);
    setDb(nextDb);
    alert(`सफलतापूर्वक ${newAccounts.length} नयाँ खाताहरू सिर्जना तथा सिङ्क गरियो!`);
  };

  // Generate Direct Login Link for User
  const getDirectLoginLink = (user) => {
    const baseUrl = window.location.origin + window.location.pathname;
    if (user.role === 'TRAINER') {
      return `${baseUrl}?portal=trainer&id=${user.trainerId || user.id}&pin=${user.pin || '1234'}`;
    }
    if (user.role === 'STUDENT') {
      return `${baseUrl}?portal=student&id=${user.studentId || user.id}&pin=${user.pin || '1234'}`;
    }
    return `${baseUrl}?user=${user.username || user.phone}&pin=${user.pin || '1111'}`;
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. Header Banner */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PeopleAltIcon sx={{ color: '#0F2E5A', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              प्रयोगकर्ता तथा पोर्टल पहुँच व्यवस्थापन (User Management)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            प्रणालीका सम्पूर्ण एडमिन, प्रशिक्षक र विद्यार्थी खाताहरू, पहुँच अनुमति र लगइन क्युआर कोड नियन्त्रण
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleAutoSync}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            Auto-Sync Accounts
          </Button>

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 900, bgcolor: '#0F2E5A', borderRadius: 2 }}
          >
            + नयाँ प्रयोगकर्ता थप्नुहोस्
          </Button>
        </Box>
      </Box>

      {/* 1.5 Dedicated Portals Distribution Hub */}
      <Card
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0F2E5A 0%, #1A467E 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(15, 46, 90, 0.2)'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          🌐 समर्पित पोर्टल लिङ्क वितरण हब (Public Portal Links Distribution Hub)
        </Typography>

        <Grid container spacing={2}>
          {/* Trainer Portal Link Card */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#6EE7B7' }}>
                  👨‍🏫 प्रशिक्षक पोर्टल लिङ्क (Trainer Portal Gateway)
                </Typography>
                <Chip label="Trainer Only" size="small" sx={{ bgcolor: '#10B981', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 1.5 }}>
                प्रशिक्षकहरूलाई कक्षा हाजिरी, दैनिक लग-बुक र ब्याच सञ्चालनका लागि यो लिङ्क पठाउनुहोस्:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={`${window.location.origin}${window.location.pathname}?portal=trainer`}
                InputProps={{
                  readOnly: true,
                  sx: { bgcolor: '#ffffff', borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 700 }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopyLink(`${window.location.origin}${window.location.pathname}?portal=trainer`)}
                  sx={{ bgcolor: '#10B981', fontWeight: 800, borderRadius: 1.5, '&:hover': { bgcolor: '#059669' } }}
                >
                  {copySuccess ? '✓ Copied' : 'Copy Link'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}${window.location.pathname}?portal=trainer`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, borderRadius: 1.5 }}
                >
                  नयाँ विन्डोमा खोल्नुहोस्
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Student Portal Link Card */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#BAE6FD' }}>
                  🎓 विद्यार्थी पोर्टल लिङ्क (Student Portal Gateway)
                </Typography>
                <Chip label="Student Only" size="small" sx={{ bgcolor: '#0284C7', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 1.5 }}>
                विद्यार्थीहरूलाई हाजिरी %, प्रमाणपत्र र सूचना हेर्नका लागि यो लिङ्क पठाउनुहोस्:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={`${window.location.origin}${window.location.pathname}?portal=student`}
                InputProps={{
                  readOnly: true,
                  sx: { bgcolor: '#ffffff', borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 700 }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopyLink(`${window.location.origin}${window.location.pathname}?portal=student`)}
                  sx={{ bgcolor: '#0284C7', fontWeight: 800, borderRadius: 1.5, '&:hover': { bgcolor: '#0369A1' } }}
                >
                  {copySuccess ? '✓ Copied' : 'Copy Link'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}${window.location.pathname}?portal=student`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, borderRadius: 1.5 }}
                >
                  नयाँ विन्डोमा खोल्नुहोस्
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* 2. KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              कुल प्रयोगकर्ता
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A', mt: 0.5 }}>
              {totalCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#F0FDF4', borderRadius: 2.5, border: '1px solid #BBF7D0' }}>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>
              सक्रिय (Active)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#15803D', mt: 0.5 }}>
              {activeCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#FEF2F2', borderRadius: 2.5, border: '1px solid #FECACA' }}>
            <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 800 }}>
              निलम्बित (Suspended)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#B91C1C', mt: 0.5 }}>
              {suspendedCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#EFF6FF', borderRadius: 2.5, border: '1px solid #BFDBFE' }}>
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 800 }}>
              प्रशिक्षक (Trainers)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1D4ED8', mt: 0.5 }}>
              {trainerCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#FAF5FF', borderRadius: 2.5, border: '1px solid #E9D5FF' }}>
            <Typography variant="caption" sx={{ color: '#6B21A8', fontWeight: 800 }}>
              विद्यार्थी (Students)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#7E22CE', mt: 0.5 }}>
              {studentCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#FFFBEB', borderRadius: 2.5, border: '1px solid #FDE68A' }}>
            <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 800 }}>
              एडमिन / स्टाफ
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#B45309', mt: 0.5 }}>
              {adminStaffCount}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Search & Filter Bar */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="नाम, फोन, युजरनेम वा TGID बाट खोज्नुहोस्..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Tabs
              value={roleFilter}
              onChange={(e, val) => setRoleFilter(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  minHeight: 36,
                  py: 0.5
                }
              }}
            >
              <Tab value="ALL" label="सबै (All)" />
              <Tab value="TRAINER" label="प्रशिक्षक" />
              <Tab value="STUDENT" label="विद्यार्थी" />
              <Tab value="ADMIN" label="एडमिन" />
              <Tab value="STAFF" label="स्टाफ" />
            </Tabs>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="स्थिति (Status)"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">सबै स्थिति (All Status)</MenuItem>
              <MenuItem value="Active">सक्रिय (Active Only)</MenuItem>
              <MenuItem value="Suspended">निलम्बित (Suspended Only)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* 4. Users Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
        <Table size="small">
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
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्रयोगकर्ता (User Profile)</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>भूमिका (Role)</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सम्पर्क (Phone/Username)</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>४-अङ्कको पिन (PIN)</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>स्थिति (Status)</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>कार्यहरू (Actions)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                  कुनै पनि प्रयोगकर्ता फेला परेन।
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, idx) => {
                const isPinVisible = Boolean(visiblePins[user.id]);
                const isSuspended = user.status === 'Suspended';

                return (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      bgcolor: isSuspended ? '#FFF1F2' : 'inherit',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor:
                              user.role === 'ADMIN'
                                ? '#0F2E5A'
                                : user.role === 'TRAINER'
                                ? '#10B981'
                                : user.role === 'STUDENT'
                                ? '#3B82F6'
                                : '#F59E0B',
                            fontWeight: 800,
                            fontSize: '0.9rem'
                          }}
                        >
                          {user.name ? user.name[0] : 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            ID: {user.id} {user.trainerId ? `• Trainer: ${user.trainerId}` : ''} {user.tgid ? `• TGID: ${user.tgid}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={
                          user.role === 'ADMIN'
                            ? '🛡️ Admin'
                            : user.role === 'TRAINER'
                            ? '👨‍🏫 Trainer'
                            : user.role === 'STUDENT'
                            ? '🎓 Student'
                            : '📋 Staff'
                        }
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor:
                            user.role === 'ADMIN'
                              ? '#E0E7FF'
                              : user.role === 'TRAINER'
                              ? '#DCFCE7'
                              : user.role === 'STUDENT'
                              ? '#EFF6FF'
                              : '#FEF3C7',
                          color:
                            user.role === 'ADMIN'
                              ? '#3730A3'
                              : user.role === 'TRAINER'
                              ? '#15803D'
                              : user.role === 'STUDENT'
                              ? '#1D4ED8'
                              : '#92400E'
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {user.phone || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        @{user.username || 'user'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            letterSpacing: isPinVisible ? 2 : 3,
                            color: isPinVisible ? '#0F2E5A' : '#94A3B8'
                          }}
                        >
                          {isPinVisible ? user.pin : '••••'}
                        </Typography>
                        <IconButton size="small" onClick={() => togglePinVisibility(user.id)}>
                          {isPinVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={isSuspended ? 'निलम्बित (Suspended)' : 'सक्रिय (Active)'}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: isSuspended ? '#FEE2E2' : '#DCFCE7',
                          color: isSuspended ? '#B91C1C' : '#15803D'
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
                        {/* 1-Click Suspend / Activate Toggle */}
                        <Tooltip title={isSuspended ? 'सक्रिय गर्नुहोस् (Activate)' : 'निलम्बन गर्नुहोस् (Suspend)'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(user)}
                            sx={{
                              color: isSuspended ? '#10B981' : '#EF4444',
                              bgcolor: isSuspended ? '#ECFDF5' : '#FEF2F2'
                            }}
                          >
                            {isSuspended ? <CheckCircleOutlineIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>

                        {/* Share & QR Access Modal */}
                        <Tooltip title="लगइन लिङ्क तथा QR कार्ड (Share & QR)">
                          <IconButton
                            size="small"
                            onClick={() => setShareUserModal(user)}
                            sx={{ color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                          >
                            <QrCode2Icon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Edit User */}
                        <Tooltip title="विवरण सम्पादन (Edit)">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(user)}
                            sx={{ color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Delete User */}
                        {user.id !== 'USR-ADMIN' && (
                          <Tooltip title="मेटाउनुहोस् (Delete)">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user.id)}
                              sx={{ color: '#DC2626', bgcolor: '#FEF2F2' }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 5. Add / Edit User Modal Dialog */}
      <Dialog open={openUserModal} onClose={() => setOpenUserModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveUser}>
          <DialogTitle sx={{ bgcolor: '#0F2E5A', color: '#ffffff', fontWeight: 900 }}>
            {editingUser ? 'प्रयोगकर्ता विवरण सम्पादन (Edit User)' : '+ नयाँ प्रयोगकर्ता थप्नुहोस् (Create User)'}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="भूमिका (Role)"
                    value={formData.role}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, role: val });
                    }}
                    required
                  >
                    <MenuItem value="STUDENT">विद्यार्थी (Student)</MenuItem>
                    <MenuItem value="TRAINER">प्रशिक्षक (Trainer)</MenuItem>
                    <MenuItem value="STAFF">स्टाफ / फ्रन्ट डेस्क (Staff)</MenuItem>
                    <MenuItem value="ADMIN">सुपर एडमिन (Admin)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="स्थिति (Status)"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="Active">सक्रिय (Active)</MenuItem>
                    <MenuItem value="Suspended">निलम्बित (Suspended)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {/* Link with Existing Profile if Trainer */}
              {formData.role === 'TRAINER' && (
                <TextField
                  select
                  fullWidth
                  label="प्रशिक्षक प्रोफाइल लिङ्क गर्नुहोस् (Link Trainer)"
                  value={formData.trainerId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const t = (db.trainers || []).find((x) => x.id === tId);
                    setFormData({
                      ...formData,
                      trainerId: tId,
                      name: t ? t.name : formData.name,
                      phone: t ? t.phone : formData.phone,
                      pin: t ? t.pin || '1234' : formData.pin
                    });
                  }}
                >
                  <MenuItem value="">-- प्रशिक्षक छान्नुहोस् --</MenuItem>
                  {(db.trainers || []).map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name} ({t.specialization}) - {t.phone}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {/* Link with Existing Profile if Student */}
              {formData.role === 'STUDENT' && (
                <TextField
                  select
                  fullWidth
                  label="विद्यार्थी प्रोफाइल लिङ्क गर्नुहोस् (Link Student)"
                  value={formData.studentId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const s = (db.students || []).find((x) => x.id === sId);
                    setFormData({
                      ...formData,
                      studentId: sId,
                      name: s ? s.name : formData.name,
                      phone: s ? s.phone : formData.phone,
                      pin: s ? s.pin || '1234' : formData.pin
                    });
                  }}
                >
                  <MenuItem value="">-- विद्यार्थी छान्नुहोस् --</MenuItem>
                  {(db.students || []).map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} ({s.tgid}) - {s.phone}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                fullWidth
                label="पूरा नाम (Full Name)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="मोबाइल नम्बर (Phone Number)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="युजरनेम (Username)"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="उदा: pooja वा student01"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="४-अङ्कको पिन कोड (4-Digit Access PIN)"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                inputProps={{ maxLength: 6 }}
                required
                helperText="पोर्टलमा लगइन गर्न प्रयोग हुने गोप्य पिन कोड।"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenUserModal(false)}>रद्द गर्नुहोस्</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0F2E5A', fontWeight: 800 }}>
              सुरक्षित गर्नुहोस् (Save User)
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 6. Share Credentials & Login QR Modal Dialog */}
      <Dialog
        open={Boolean(shareUserModal)}
        onClose={() => setShareUserModal(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#0F2E5A', color: '#ffffff', textAlign: 'center', fontWeight: 900 }}>
          प्रयोगकर्ता पहुँच कार्ड तथा लगइन QR
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          {shareUserModal && (() => {
            const link = getDirectLoginLink(shareUserModal);
            const waMsg = `नमस्ते ${shareUserModal.name},\nग्लोबल एरा प्राविधिक स्कुल (Global Era Technical School) को अनलाइन पोर्टलमा तपाईंको स्वागत छ!\n\nतपाईंको लगइन विवरण:\n• लगइन आईडी: ${shareUserModal.phone || shareUserModal.username}\n• गोप्य पिन: ${shareUserModal.pin}\n\nसिधै लगइन गर्न यो लिङ्क खोल्नुहोस्:\n${link}`;

            return (
              <Box>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 1.5,
                    bgcolor: '#0F2E5A',
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    border: '2px solid #F59E0B'
                  }}
                >
                  {shareUserModal.name[0]}
                </Avatar>

                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                  {shareUserModal.name}
                </Typography>
                <Chip
                  label={shareUserModal.role}
                  size="small"
                  sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, mt: 0.5, mb: 2 }}
                />

                {/* QR Code Container */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#F8FAFC',
                    borderRadius: 3,
                    display: 'inline-block',
                    border: '1.5px solid #E2E8F0',
                    mb: 2
                  }}
                >
                  <QRCodeSVG value={link} size={160} level="H" />
                </Box>

                {/* PIN Badge */}
                <Box sx={{ bgcolor: '#EFF6FF', p: 1.5, borderRadius: 2, border: '1px solid #BFDBFE', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 800, display: 'block' }}>
                    ४-अङ्कको गोप्य लगइन पिन (ACCESS PIN):
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#1D4ED8', letterSpacing: 4 }}>
                    {shareUserModal.pin}
                  </Typography>
                </Box>

                {/* Copy Link Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopyLink(link)}
                  sx={{ mb: 1.5, fontWeight: 800, borderRadius: 2 }}
                >
                  {copySuccess ? '✓ लिङ्क प्रतिलिपि भयो (Copied)!' : 'लगइन लिङ्क प्रतिलिपि गर्नुहोस् (Copy Link)'}
                </Button>

                {/* Send via WhatsApp Button */}
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => {
                    const waUrl = getWhatsAppUrl(shareUserModal.phone, waMsg);
                    window.open(waUrl, '_blank');
                  }}
                  sx={{ fontWeight: 900, borderRadius: 2 }}
                >
                  ह्वाट्सएपमा पठाउनुहोस् (WhatsApp)
                </Button>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => setShareUserModal(null)}>
            बन्द गर्नुहोस् (Close)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
