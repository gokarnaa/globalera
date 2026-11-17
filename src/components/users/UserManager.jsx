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
import CloseIcon from '@mui/icons-material/Close';
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
import HandshakeIcon from '@mui/icons-material/Handshake';
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
    agentId: '',
    agentCode: '',
    commissionType: 'FIXED',
    defaultRate: 1000,
    paymentInfo: '',
    address: 'Kathmandu',
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
        (u.agentCode || '').toLowerCase().includes(q) ||
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
  const agentCount = usersList.filter((u) => u.role === 'AGENT').length;
  const adminStaffCount = usersList.filter((u) => u.role === 'ADMIN' || u.role === 'STAFF').length;

  const togglePinVisibility = (id) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-Click Suspend / Activate Toggle
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
    const isSuspending = nextStatus === 'Suspended';
    const actionLabel = isSuspending ? 'Suspend Account' : 'Activate Account';

    const ok = await confirm({
      type: isSuspending ? 'danger' : 'info',
      title: `Confirm ${actionLabel}`,
      message: `Are you sure you want to ${isSuspending ? 'suspend' : 'activate'} user account "${user.name}"?`,
      detail: isSuspending
        ? 'Suspended users will be blocked from logging into the portal.'
        : 'Once activated, the user can immediately log in using their credentials.',
      confirmText: isSuspending ? 'Yes, Suspend' : 'Yes, Activate',
      confirmColor: isSuspending ? '#DC2626' : '#2563EB'
    });

    if (ok) {
      const nextUsers = usersList.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u));
      let nextAgents = db.agents || [];
      let nextTrainers = db.trainers || [];
      let nextStudents = db.students || [];

      if (user.role === 'AGENT' || user.agentCode || user.agentId) {
        nextAgents = nextAgents.map((ag) =>
          ag.id === user.agentId || ag.code === user.agentCode || ag.code === user.username
            ? { ...ag, status: nextStatus }
            : ag
        );
      }
      if (user.role === 'TRAINER' && user.trainerId) {
        nextTrainers = nextTrainers.map((tr) =>
          tr.id === user.trainerId ? { ...tr, status: nextStatus === 'Suspended' ? 'Inactive' : 'Active' } : tr
        );
      }
      if (user.role === 'STUDENT' && user.studentId) {
        nextStudents = nextStudents.map((st) =>
          st.id === user.studentId ? { ...st, status: nextStatus === 'Suspended' ? 'Suspended' : 'Active' } : st
        );
      }
      const nextDb = saveDB({
        ...db,
        users: nextUsers,
        agents: nextAgents,
        trainers: nextTrainers,
        students: nextStudents
      });
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
      role: roleFilter === 'AGENT' ? 'AGENT' : 'STUDENT',
      status: 'Active',
      trainerId: '',
      studentId: '',
      agentId: '',
      agentCode: '',
      commissionType: 'FIXED',
      defaultRate: 1000,
      paymentInfo: '',
      address: 'Kathmandu',
      title: ''
    });
    setOpenUserModal(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    const ag = (db.agents || []).find((a) => a.id === user.agentId || a.code === user.agentCode || a.code === user.username) || {};
    setFormData({
      name: user.name || ag.name || '',
      username: user.username || ag.code || '',
      phone: user.phone || ag.phone || '',
      pin: user.pin || ag.pin || '1234',
      role: user.role || 'STUDENT',
      status: user.status || ag.status || 'Active',
      trainerId: user.trainerId || '',
      studentId: user.studentId || '',
      agentId: user.agentId || ag.id || '',
      agentCode: user.agentCode || ag.code || '',
      commissionType: user.commissionType || ag.commissionType || 'FIXED',
      defaultRate: user.defaultRate || ag.defaultRate || 1000,
      paymentInfo: user.paymentInfo || ag.paymentInfo || '',
      address: user.address || ag.address || 'Kathmandu',
      title: user.title || ''
    });
    setOpenUserModal(true);
  };

  // Save User (Create or Update)
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.pin) {
      alert('Please fill in Name, Phone, and PIN.');
      return;
    }

    let nextUsers = [...usersList];
    let nextAgents = [...(db.agents || [])];

    if (formData.role === 'AGENT') {
      let agCode = formData.agentCode;
      let agId = formData.agentId;

      if (!agCode) {
        const existingCodes = nextAgents.map((a) => parseInt((a.code || '').replace(/\D/g, '') || 100));
        const nextNum = existingCodes.length ? Math.max(...existingCodes) + 1 : 101;
        agCode = `AGE-${nextNum}`;
        agId = `AGT-${String(nextNum).padStart(2, '0')}`;
      }

      if (editingUser) {
        nextAgents = nextAgents.map((ag) => {
          if (ag.id === editingUser.agentId || ag.code === editingUser.agentCode || ag.code === agCode) {
            return {
              ...ag,
              name: formData.name,
              phone: formData.phone,
              code: agCode,
              commissionType: formData.commissionType,
              defaultRate: Number(formData.defaultRate) || 1000,
              paymentInfo: formData.paymentInfo || `eSewa: ${formData.phone}`,
              address: formData.address || 'Kathmandu',
              pin: formData.pin,
              status: formData.status
            };
          }
          return ag;
        });
      } else {
        const newAgent = {
          id: agId,
          code: agCode,
          name: formData.name,
          phone: formData.phone,
          address: formData.address || 'Kathmandu',
          pin: formData.pin,
          status: formData.status,
          commissionType: formData.commissionType,
          defaultRate: Number(formData.defaultRate) || 1000,
          paymentInfo: formData.paymentInfo || `eSewa: ${formData.phone}`,
          joinedDate: new Date().toISOString().slice(0, 10)
        };
        nextAgents = [newAgent, ...nextAgents];
      }

      formData.agentCode = agCode;
      formData.agentId = agId;
      formData.username = agCode.toLowerCase();
    }

    let nextTrainers = [...(db.trainers || [])];
    let nextStudents = [...(db.students || [])];

    if (formData.role === 'TRAINER' && (formData.trainerId || editingUser?.trainerId)) {
      const targetTrnId = formData.trainerId || editingUser?.trainerId;
      nextTrainers = nextTrainers.map((tr) =>
        tr.id === targetTrnId
          ? {
              ...tr,
              name: formData.name,
              phone: formData.phone,
              pin: formData.pin,
              status: formData.status === 'Suspended' ? 'Inactive' : 'Active'
            }
          : tr
      );
    }

    if (formData.role === 'STUDENT' && (formData.studentId || editingUser?.studentId)) {
      const targetStdId = formData.studentId || editingUser?.studentId;
      nextStudents = nextStudents.map((st) =>
        st.id === targetStdId
          ? {
              ...st,
              name: formData.name,
              phone: formData.phone,
              pin: formData.pin,
              status: formData.status === 'Suspended' ? 'Suspended' : 'Active'
            }
          : st
      );
    }

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
      const defaultUsername = formData.username || (formData.name || 'user').trim().split(' ')[0].toLowerCase() + Math.floor(Math.random() * 90 + 10);
      nextUsers.unshift({
        id: newId,
        ...formData,
        username: defaultUsername,
        createdAt: new Date().toISOString()
      });
    }

    const nextDb = saveDB({
      ...db,
      users: nextUsers,
      agents: nextAgents,
      trainers: nextTrainers,
      students: nextStudents
    });
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
      title: 'Confirm User Deletion',
      message: `Are you sure you want to permanently delete user "${targetUser?.name || userId}"?`,
      detail: 'This user will be permanently removed from the system and unable to log in. This action cannot be undone.',
      confirmText: 'Yes, Delete',
      confirmColor: '#DC2626'
    });
    if (ok) {
      const nextUsers = usersList.filter((u) => u.id !== userId);
      let nextAgents = db.agents || [];
      if (targetUser?.role === 'AGENT' || targetUser?.agentId || targetUser?.agentCode) {
        nextAgents = nextAgents.filter(
          (ag) => ag.id !== targetUser.agentId && ag.code !== targetUser.agentCode && ag.code !== targetUser.username
        );
      }
      const nextDb = { ...db, users: nextUsers, agents: nextAgents };
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
      alert('All trainer and trainee accounts are already synchronized.');
      return;
    }

    const nextDb = {
      ...db,
      users: [...usersList, ...newAccounts]
    };

    saveDB(nextDb);
    setDb(nextDb);
    alert(`Successfully synchronized ${newAccounts.length} new accounts!`);
  };

  // Generate Direct Login Link for User
  const getDirectLoginLink = (user) => {
    const baseUrl = window.location.origin;
    if (user.role === 'AGENT') {
      return `${baseUrl}/agent?id=${user.agentCode || user.phone}&pin=${user.pin || '1234'}`;
    }
    if (user.role === 'TRAINER') {
      return `${baseUrl}/trainer?id=${user.trainerId || user.id}&pin=${user.pin || '1234'}`;
    }
    if (user.role === 'STUDENT') {
      return `${baseUrl}/student?id=${user.studentId || user.id}&pin=${user.pin || '1234'}`;
    }
    return `${baseUrl}/ge-admin?user=${user.username || user.phone}&pin=${user.pin || '1111'}`;
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

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
          <Grid item xs={12} md={7}>
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
                <PeopleAltIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  User &amp; Portal Access Management
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Manage admin, instructor, student &amp; agent accounts, PINs and digital access QR cards
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SyncIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleAutoSync}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  whiteSpace: 'nowrap',
                  px: 1.4,
                  py: 0.65,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', borderColor: '#ffffff' }
                }}
              >
                Auto-Sync Accounts
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddIcon sx={{ fontSize: '16px !important' }} />}
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
                + Add New User
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 1.5 Dedicated Portals Distribution Hub (Compact) */}
      <Card
        elevation={0}
        sx={{
          mb: 1.75,
          p: 1.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #0F2E5A 0%, #1A467E 100%)',
          color: '#ffffff'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: '#cbd5e1', fontSize: '0.73rem' }}>
          🌐 Dedicated Portal Links Distribution Hub
        </Typography>

        <Grid container spacing={1.25}>
          {/* Trainer Portal Link Card */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(16, 185, 129, 0.35)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#6EE7B7', fontSize: '0.76rem' }}>
                  👨‍🏫 Trainer Portal Link
                </Typography>
                <Chip label="Trainer Only" size="small" sx={{ height: 18, fontSize: '0.64rem', bgcolor: '#10B981', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={`${window.location.origin}/trainer`}
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: '#ffffff', borderRadius: 1.2, fontSize: '0.73rem', fontWeight: 700, height: 30 }
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleCopyLink(`${window.location.origin}/trainer`)}
                  sx={{ bgcolor: '#10B981', fontWeight: 800, fontSize: '0.7rem', py: 0.4, px: 1, minWidth: 0, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#059669' } }}
                >
                  {copySuccess ? '✓' : 'Copy'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}/trainer`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.7rem', py: 0.4, px: 1, minWidth: 0 }}
                >
                  Open
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Student Portal Link Card */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(56, 189, 248, 0.35)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#BAE6FD', fontSize: '0.76rem' }}>
                  🎓 Student Portal Link
                </Typography>
                <Chip label="Student Only" size="small" sx={{ height: 18, fontSize: '0.64rem', bgcolor: '#0284C7', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={`${window.location.origin}/student`}
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: '#ffffff', borderRadius: 1.2, fontSize: '0.73rem', fontWeight: 700, height: 30 }
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleCopyLink(`${window.location.origin}/student`)}
                  sx={{ bgcolor: '#0284C7', fontWeight: 800, fontSize: '0.7rem', py: 0.4, px: 1, minWidth: 0, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#0369A1' } }}
                >
                  {copySuccess ? '✓' : 'Copy'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}/student`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.7rem', py: 0.4, px: 1, minWidth: 0 }}
                >
                  Open
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Agent Portal Link Card */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#FDE68A', fontSize: '0.76rem' }}>
                  🤝 Agent / Referral Portal Link
                </Typography>
                <Chip label="Referral Only" size="small" sx={{ height: 18, fontSize: '0.64rem', bgcolor: '#D97706', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={`${window.location.origin}/agent`}
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: '#ffffff', borderRadius: 1.2, fontSize: '0.73rem', fontWeight: 700, height: 30 }
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleCopyLink(`${window.location.origin}/agent`)}
                  sx={{ bgcolor: '#D97706', fontWeight: 800, fontSize: '0.7rem', py: 0.4, px: 1, minWidth: 0, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#B45309' } }}
                >
                  {copySuccess ? '✓' : 'Copy'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}/agent`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.7rem', py: 0.4, px: 1, minWidth: 0 }}
                >
                  Open
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* 2. 4 Compact Single-Row KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.75 }}>
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #1e40af',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Total Accounts
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {activeCount} Active • {suspendedCount} Suspended
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <PeopleAltIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #0284c7',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Trainers &amp; Staff
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {trainerCount + adminStaffCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {trainerCount} Trainers • {adminStaffCount} Admin/Staff
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f9ff', borderRadius: 1.5, color: '#0284c7', flexShrink: 0 }}>
                <BadgeIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #059669',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Student Accounts
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {studentCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Trainee Portal Access
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ecfdf5', borderRadius: 1.5, color: '#059669', flexShrink: 0 }}>
                <SchoolIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #d97706',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Referral Agents
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#d97706', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {agentCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Partner Recruitment Codes
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fffbeb', borderRadius: 1.5, color: '#d97706', flexShrink: 0 }}>
                <HandshakeIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Search & Filter Bar (Compact & Balanced Layout) */}
      <Card elevation={0} sx={{ p: 1.25, mb: 1.75, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#ffffff' }}>
        <Grid container spacing={1.25} alignItems="center">
          {/* Compact Search Box */}
          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, phone, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { height: 36, fontSize: '0.78rem', borderRadius: 1.5 }
              }}
            />
          </Grid>

          {/* Expanded Role Tabs */}
          <Grid item xs={12} sm={8} md={7.7}>
            <Tabs
              value={roleFilter}
              onChange={(e, val) => setRoleFilter(val)}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 34,
                '& .MuiTabs-flexContainer': {
                  justifyContent: { xs: 'flex-start', md: 'space-around' },
                  gap: 0.5
                },
                '& .MuiTabs-indicator': { height: 2.5, bgcolor: '#0F2E5A', borderRadius: '3px 3px 0 0' },
                '& .MuiTab-root': {
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  minHeight: 34,
                  py: 0.4,
                  px: { xs: 1, sm: 1.2 },
                  minWidth: 'auto',
                  textTransform: 'none',
                  color: '#64748B',
                  '&.Mui-selected': { color: '#0F2E5A', fontWeight: 900 }
                }
              }}
            >
              <Tab value="ALL" label="All" />
              <Tab value="TRAINER" label="Trainers" />
              <Tab value="STUDENT" label="Students" />
              <Tab value="AGENT" label="Agents" />
              <Tab value="ADMIN" label="Admin" />
              <Tab value="STAFF" label="Staff" />
            </Tabs>
          </Grid>

          {/* Compact Status Filter */}
          <Grid item xs={12} sm={6} md={1.8}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              InputProps={{
                sx: { height: 36, fontSize: '0.78rem', borderRadius: 1.5 }
              }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.78rem' }}>All</MenuItem>
              <MenuItem value="Active" sx={{ fontSize: '0.78rem' }}>Active</MenuItem>
              <MenuItem value="Suspended" sx={{ fontSize: '0.78rem' }}>Suspended</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* 4. Users Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflowX: 'auto', border: '1px solid #E2E8F0' }}>
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
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>User Profile</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Role</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Contact (Phone/Username)</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center' }}>4-Digit PIN</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3.5, color: '#64748B', fontSize: '0.8rem' }}>
                  No users found matching current filters.
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
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>{idx + 1}</TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor:
                              user.role === 'ADMIN'
                                ? '#0F2E5A'
                                : user.role === 'TRAINER'
                                ? '#10B981'
                                : user.role === 'STUDENT'
                                ? '#3B82F6'
                                : '#F59E0B',
                            fontWeight: 800,
                            fontSize: '0.78rem'
                          }}
                        >
                          {user.name ? user.name[0] : 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.8rem' }}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.69rem' }}>
                            ID: {user.id} {user.trainerId ? `• Trainer: ${user.trainerId}` : ''} {user.tgid ? `• TGID: ${user.tgid}` : ''}
                          </Typography>
                          {(user.role === 'AGENT' || user.agentCode) && (
                            <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 800, fontSize: '0.69rem' }}>
                              Referral Code: {user.agentCode || user.username}
                            </Typography>
                          )}
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
                            : user.role === 'AGENT'
                            ? '🤝 Agent'
                            : '📋 Staff'
                        }
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor:
                            user.role === 'ADMIN'
                              ? '#E0E7FF'
                              : user.role === 'TRAINER'
                              ? '#DCFCE7'
                              : user.role === 'STUDENT'
                              ? '#EFF6FF'
                              : user.role === 'AGENT'
                              ? '#FEF3C7'
                              : '#F1F5F9',
                          color:
                            user.role === 'ADMIN'
                              ? '#3730A3'
                              : user.role === 'TRAINER'
                              ? '#15803D'
                              : user.role === 'STUDENT'
                              ? '#1D4ED8'
                              : user.role === 'AGENT'
                              ? '#92400E'
                              : '#475569'
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                        {user.phone || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                        @{user.username || 'user'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '0.78rem',
                            letterSpacing: isPinVisible ? 2 : 3,
                            color: isPinVisible ? '#0F2E5A' : '#94A3B8'
                          }}
                        >
                          {isPinVisible ? user.pin : '••••'}
                        </Typography>
                        <IconButton size="small" onClick={() => togglePinVisibility(user.id)} sx={{ p: 0.3 }}>
                          {isPinVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={isSuspended ? 'Suspended' : 'Active'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: isSuspended ? '#FEE2E2' : '#DCFCE7',
                          color: isSuspended ? '#B91C1C' : '#15803D'
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {/* 1-Click Suspend / Activate Toggle */}
                        <Tooltip title={isSuspended ? 'Activate Account' : 'Suspend Account'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(user)}
                            sx={{
                              p: 0.4,
                              color: isSuspended ? '#10B981' : '#EF4444',
                              bgcolor: isSuspended ? '#ECFDF5' : '#FEF2F2'
                            }}
                          >
                            {isSuspended ? <CheckCircleOutlineIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>

                        {/* Share & QR Access Modal */}
                        <Tooltip title="Share Credentials & QR">
                          <IconButton
                            size="small"
                            onClick={() => setShareUserModal(user)}
                            sx={{ p: 0.4, color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                          >
                            <QrCode2Icon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Edit User */}
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(user)}
                            sx={{ p: 0.4, color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Delete User */}
                        {user.id !== 'USR-ADMIN' && (
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user.id)}
                              sx={{ p: 0.4, color: '#DC2626', bgcolor: '#FEF2F2' }}
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
      <Dialog
        open={openUserModal}
        onClose={() => setOpenUserModal(false)}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: { backdropFilter: 'blur(5px)', bgcolor: 'rgba(15, 23, 42, 0.45)' }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <form onSubmit={handleSaveUser}>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)', color: '#ffffff', fontWeight: 900, py: 2.2, px: 3, borderBottom: '3px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{editingUser ? 'Edit User Profile' : '+ Add New User'}</span>
            <IconButton
              size="small"
              aria-label="Close user dialog"
              onClick={() => setOpenUserModal(false)}
              sx={{ color: 'rgba(255,255,255,0.85)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#ffffff' } }}
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
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Role"
                      value={formData.role}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, role: val });
                      }}
                      required
                    >
                      <MenuItem value="STUDENT">Student</MenuItem>
                      <MenuItem value="TRAINER">Trainer</MenuItem>
                      <MenuItem value="AGENT">🤝 Referral Partner / Agent</MenuItem>
                      <MenuItem value="STAFF">Staff / Front Desk</MenuItem>
                      <MenuItem value="ADMIN">Super Admin</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Suspended">Suspended</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                {/* Agent Specific Fields */}
                {formData.role === 'AGENT' && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 800, display: 'block', mb: 1.5 }}>
                      🤝 Agent Policy Settings
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Agent Referral Code"
                          value={formData.agentCode}
                          onChange={(e) => setFormData({ ...formData, agentCode: e.target.value })}
                          placeholder="e.g. AGE-101"
                          helperText="Leave empty to auto-generate."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Commission Type"
                          value={formData.commissionType}
                          onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                        >
                          <MenuItem value="FIXED">Fixed Amount (Rs.)</MenuItem>
                          <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          label={formData.commissionType === 'PERCENTAGE' ? 'Commission Rate (%)' : 'Commission Amount (Rs.)'}
                          value={formData.defaultRate}
                          onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="City / Address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Payment / Bank / eSewa Details"
                          value={formData.paymentInfo}
                          onChange={(e) => setFormData({ ...formData, paymentInfo: e.target.value })}
                          placeholder="e.g. eSewa: 9841234567 or Nabil Bank A/C: 0192837..."
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Link with Existing Profile if Trainer */}
                {formData.role === 'TRAINER' && (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Link Trainer Profile"
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
                    <MenuItem value="">-- Select Trainer --</MenuItem>
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
                    size="small"
                    label="Link Student Profile"
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
                    <MenuItem value="">-- Select Student --</MenuItem>
                    {(db.students || []).map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} ({s.tgid}) - {s.phone}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                <TextField
                  fullWidth
                  size="small"
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. staff01 or trainer01"
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  label="4-Digit Access PIN"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  inputProps={{ maxLength: 6 }}
                  required
                  helperText="Secret PIN code used to log in to the portal."
                />
              </Stack>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              onClick={() => setOpenUserModal(false)}
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
              type="submit"
              variant="contained"
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
              Save User
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
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)', color: '#ffffff', textAlign: 'center', fontWeight: 900, py: 2.2, borderBottom: '3px solid #F59E0B' }}>
          User Access Card & Login QR
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          {shareUserModal && (() => {
            const link = getDirectLoginLink(shareUserModal);
            const waMsg = `Hello ${shareUserModal.name},\nWelcome to the Prabidhik School, Jorpati Portal!\n\nYour Login Credentials:\n• ID: ${shareUserModal.phone || shareUserModal.username}\n• Access PIN: ${shareUserModal.pin}\n\nDirect Login Link:\n${link}`;

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
                    4-Digit ACCESS PIN:
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
                  {copySuccess ? '✓ Link Copied!' : 'Copy Login Link'}
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
                  Share via WhatsApp
                </Button>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => setShareUserModal(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
