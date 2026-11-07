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
      const defaultUsername = formData.username || formData.name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 90 + 10);
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
    <Box sx={{ pb: 6 }}>
      {/* 1. Header Banner */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PeopleAltIcon sx={{ color: '#0F2E5A', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              User & Portal Access Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Manage admin, instructor, student and agent accounts, login credentials, and digital access QR cards.
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
            + Add New User
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
          🌐 Dedicated Portal Links Distribution Hub
        </Typography>

        <Grid container spacing={2}>
          {/* Trainer Portal Link Card */}
          <Grid item xs={12} md={4}>
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
                  👨‍🏫 Trainer Portal Link
                </Typography>
                <Chip label="Trainer Only" size="small" sx={{ bgcolor: '#10B981', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 1.5 }}>
                For instructors to mark class attendance, log daily lessons, and view assigned batches:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={`${window.location.origin}/trainer`}
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
                  onClick={() => handleCopyLink(`${window.location.origin}/trainer`)}
                  sx={{ bgcolor: '#10B981', fontWeight: 800, borderRadius: 1.5, '&:hover': { bgcolor: '#059669' } }}
                >
                  {copySuccess ? '✓ Copied' : 'Copy'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}/trainer`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, borderRadius: 1.5 }}
                >
                  Open
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Student Portal Link Card */}
          <Grid item xs={12} md={4}>
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
                  🎓 Student Portal Link
                </Typography>
                <Chip label="Student Only" size="small" sx={{ bgcolor: '#0284C7', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 1.5 }}>
                For trainees to view their attendance percentage, notices, and certificates:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={`${window.location.origin}/student`}
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
                  onClick={() => handleCopyLink(`${window.location.origin}/student`)}
                  sx={{ bgcolor: '#0284C7', fontWeight: 800, borderRadius: 1.5, '&:hover': { bgcolor: '#0369A1' } }}
                >
                  {copySuccess ? '✓ Copied' : 'Copy'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}/student`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, borderRadius: 1.5 }}
                >
                  Open
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Agent Portal Link Card */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FDE68A' }}>
                  🤝 Agent / Referral Portal Link
                </Typography>
                <Chip label="Referral Only" size="small" sx={{ bgcolor: '#D97706', color: '#fff', fontWeight: 800 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 1.5 }}>
                For recruitment partners and agents to submit leads and monitor commission payouts:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={`${window.location.origin}/agent`}
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
                  onClick={() => handleCopyLink(`${window.location.origin}/agent`)}
                  sx={{ bgcolor: '#D97706', fontWeight: 800, borderRadius: 1.5, '&:hover': { bgcolor: '#B45309' } }}
                >
                  {copySuccess ? '✓ Copied' : 'Copy'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`${window.location.origin}/agent`, '_blank')}
                  sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 800, borderRadius: 1.5 }}
                >
                  Open
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* 2. KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={1.7}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              Total Users
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A', mt: 0.5 }}>
              {totalCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={1.7}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#F0FDF4', borderRadius: 2.5, border: '1px solid #BBF7D0' }}>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>
              Active
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#15803D', mt: 0.5 }}>
              {activeCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={1.7}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#FEF2F2', borderRadius: 2.5, border: '1px solid #FECACA' }}>
            <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 800 }}>
              Suspended
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#B91C1C', mt: 0.5 }}>
              {suspendedCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={1.7}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#EFF6FF', borderRadius: 2.5, border: '1px solid #BFDBFE' }}>
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 800 }}>
              Trainers
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1D4ED8', mt: 0.5 }}>
              {trainerCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={1.7}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#FAF5FF', borderRadius: 2.5, border: '1px solid #E9D5FF' }}>
            <Typography variant="caption" sx={{ color: '#6B21A8', fontWeight: 800 }}>
              Students
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#7E22CE', mt: 0.5 }}>
              {studentCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={1.7}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#FFFBEB', borderRadius: 2.5, border: '1px solid #FDE68A' }}>
            <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 800 }}>
              Agents
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#B45309', mt: 0.5 }}>
              {agentCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={1.8}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #CBD5E1' }}>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800 }}>
              Admin / Staff
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#334155', mt: 0.5 }}>
              {adminStaffCount}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Search & Filter Bar (Compact & Balanced Layout - Zero Scroll Arrows) */}
      <Card sx={{ p: 1.5, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <Grid container spacing={1.2} alignItems="center">
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
                sx: { height: 36, fontSize: '0.8rem', borderRadius: 2 }
              }}
            />
          </Grid>

          {/* Expanded Role Tabs (All 6 Roles visible cleanly without scroll arrows) */}
          <Grid item xs={12} sm={8} md={7.7}>
            <Tabs
              value={roleFilter}
              onChange={(e, val) => setRoleFilter(val)}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 36,
                '& .MuiTabs-flexContainer': {
                  justifyContent: { xs: 'flex-start', md: 'space-around' },
                  gap: 0.5
                },
                '& .MuiTabs-indicator': { height: 3, bgcolor: '#0F2E5A', borderRadius: '3px 3px 0 0' },
                '& .MuiTab-root': {
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  minHeight: 36,
                  py: 0.5,
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
                sx: { height: 36, fontSize: '0.8rem', borderRadius: 2 }
              }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.8rem' }}>All</MenuItem>
              <MenuItem value="Active" sx={{ fontSize: '0.8rem' }}>Active</MenuItem>
              <MenuItem value="Suspended" sx={{ fontSize: '0.8rem' }}>Suspended</MenuItem>
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
                S.N.
              </TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>User Profile</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Role</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Contact (Phone/Username)</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>4-Digit PIN</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
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
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            ID: {user.id} {user.trainerId ? `• Trainer: ${user.trainerId}` : ''} {user.tgid ? `• TGID: ${user.tgid}` : ''}
                          </Typography>
                          {(user.role === 'AGENT' || user.agentCode) && (
                            <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 800 }}>
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
                        label={isSuspended ? 'Suspended' : 'Active'}
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
                        <Tooltip title={isSuspended ? 'Activate Account' : 'Suspend Account'}>
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
                        <Tooltip title="Share Credentials & QR">
                          <IconButton
                            size="small"
                            onClick={() => setShareUserModal(user)}
                            sx={{ color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                          >
                            <QrCode2Icon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Edit User */}
                        <Tooltip title="Edit User">
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
                          <Tooltip title="Delete User">
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
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)', color: '#ffffff', fontWeight: 900, py: 2.2, px: 3, borderBottom: '3px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{editingUser ? 'Edit User Profile' : '+ Add New User'}</span>
            <IconButton onClick={() => setOpenUserModal(false)} sx={{ color: 'rgba(255,255,255,0.85)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#ffffff' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
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
                <Paper sx={{ p: 2, bgcolor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 2 }}>
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
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. pooja or student01"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="4-Digit Access PIN"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                inputProps={{ maxLength: 6 }}
                required
                helperText="Secret PIN code used to log in to the portal."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenUserModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0F2E5A', fontWeight: 800 }}>
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
            const waMsg = `Hello ${shareUserModal.name},\nWelcome to the Global Era Technical School Portal!\n\nYour Login Credentials:\n• ID: ${shareUserModal.phone || shareUserModal.username}\n• Access PIN: ${shareUserModal.pin}\n\nDirect Login Link:\n${link}`;

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
