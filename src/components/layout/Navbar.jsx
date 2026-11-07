import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LockIcon from '@mui/icons-material/Lock';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SchoolIcon from '@mui/icons-material/School';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShieldIcon from '@mui/icons-material/Shield';
import LogoutIcon from '@mui/icons-material/Logout';
import PublicIcon from '@mui/icons-material/Public';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { loadDB, resetDB } from '../../services/storage';
import { exportGoogleContactsVCF } from '../../services/exportUtils';
import { testSupabaseConnection } from '../../services/supabaseClient';

export default function Navbar({ onToggleSidebar, onOpenPinModal, onGoHome, onSelectTab }) {
  const { currentUser, switchUser, logout, isAdmin, isTrainer, isStudent, isEmployer } = useAuth();
  const { confirm, alert } = useDialog();
  const [anchorUser, setAnchorUser] = useState(null);
  const [db, setDb] = useState(() => loadDB());
  const [cloudStatus, setCloudStatus] = useState({
    status: 'checking',
    message: 'Testing Supabase Cloud connection...'
  });

  useEffect(() => {
    let isMounted = true;
    const checkSupabaseHealth = async () => {
      try {
        const currentDb = loadDB();
        setDb(currentDb);
        const url = currentDb.settings?.supabaseUrl;
        const key = currentDb.settings?.supabaseAnonKey;

        // If no credentials configured or still dummy placeholder
        if (!url || !key || url.includes('yycybsmwuixixfmocrcz')) {
          if (isMounted) {
            setCloudStatus({
              status: 'offline',
              message: 'Supabase URL/Key not configured. System is operating safely in Local Storage mode. Click to open Settings.'
            });
          }
          return;
        }

        const res = await testSupabaseConnection(url, key);
        if (!isMounted) return;

        if (res.ok) {
          if (res.tableMissing) {
            setCloudStatus({
              status: 'setup_needed',
              message: 'Connected to Supabase project, but database tables need schema migration. Click to open Settings.'
            });
          } else {
            setCloudStatus({
              status: 'connected',
              message: `Supabase Cloud Connected & Live (${url.replace(/^https?:\/\//, '').split('/')[0]}). Real-time multi-browser sync active.`
            });
          }
        } else {
          setCloudStatus({
            status: 'offline',
            message: `Supabase Disconnected: ${res.message || 'Network unreachable'}. Local storage is active. Click to open Settings.`
          });
        }
      } catch (err) {
        if (isMounted) {
          setCloudStatus({
            status: 'offline',
            message: 'Supabase unreachable. Operating in local-first mode. Click to open Settings.'
          });
        }
      }
    };

    checkSupabaseHealth();
    window.addEventListener('kite_db_updated', checkSupabaseHealth);
    window.addEventListener('storage', checkSupabaseHealth);
    const interval = setInterval(checkSupabaseHealth, 25000);

    return () => {
      isMounted = false;
      window.removeEventListener('kite_db_updated', checkSupabaseHealth);
      window.removeEventListener('storage', checkSupabaseHealth);
      clearInterval(interval);
    };
  }, []);

  const handleOpenUser = (e) => setAnchorUser(e.currentTarget);
  const handleCloseUser = () => setAnchorUser(null);

  const handleResetData = async () => {
    handleCloseUser();
    const ok = await confirm({
      type: 'warning',
      title: 'Confirm Data Reset',
      message: 'Are you sure you want to reset all database records to the clean initial state?',
      detail: 'This action will clear all newly entered records from local storage.',
      confirmText: 'Yes, Reset Data',
      confirmColor: '#DC2626'
    });
    if (ok) {
      resetDB();
      await alert({
        type: 'success',
        title: 'Success',
        message: 'Database has been reset to its initial state.'
      });
    }
  };

  const handleExportContacts = () => {
    exportGoogleContactsVCF(db.students, db.employers);
    handleCloseUser();
  };

  // Get current active shift info
  const currentHour = new Date().getHours();
  let activeShift = 'Shift B (10:00 - 12:00)';
  if (currentHour < 10) activeShift = 'Shift A (07:00 - 09:00)';
  else if (currentHour >= 12 && currentHour < 14) activeShift = 'Shift C (12:00 - 02:00)';
  else if (currentHour >= 14 && currentHour < 16) activeShift = 'Shift D (02:00 - 04:00)';
  else if (currentHour >= 16) activeShift = 'Shift E (04:00 - 06:00)';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        color: '#0F172A',
        borderBottom: '1px solid #E2E8F0',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 62, sm: 70 }, px: { xs: 1.5, sm: 3 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleSidebar}
          sx={{
            mr: { xs: 1, sm: 2 },
            bgcolor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: 2.5,
            '&:hover': { bgcolor: '#E2E8F0' }
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Institution Brand Identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, flexGrow: 1 }}>
          <Box
            sx={{
              width: { xs: 38, sm: 46 },
              height: { xs: 38, sm: 46 },
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0F2C59 0%, #1A56B0 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(15, 44, 89, 0.25)',
              border: '2px solid rgba(255,255,255,0.8)'
            }}
          >
            <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, lineHeight: 1 }}>
              🎓
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.2,
                  fontSize: { xs: '0.95rem', sm: '1.15rem' },
                  color: '#0F2C59',
                  letterSpacing: '-0.02em'
                }}
              >
                Global Era Technical School
              </Typography>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#166534 !important' }} />}
                label="CTEVT Accredited"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor: '#DCFCE7',
                  color: '#166534',
                  display: { xs: 'none', md: 'inline-flex' }
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: '#64748B',
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              KITE CAREGIVER TRAINING CENTER • MitraPark, Chabahil, Kathmandu
            </Typography>
          </Box>
        </Box>

        {/* Live Operational Status Pills (Center/Right) */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.5, mr: 2.5 }}>
          {/* Active Shift indicator */}
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: '15px !important', color: '#1D4ED8 !important' }} />}
            label={`Active: ${activeShift}`}
            size="small"
            sx={{
              bgcolor: '#EFF6FF',
              color: '#1E40AF',
              border: '1px solid #BFDBFE',
              fontWeight: 700,
              fontSize: '0.75rem'
            }}
          />

          {/* Supabase Status Indicator (Dynamic Live Check) */}
          <Tooltip title={`${cloudStatus.message} • Click to open Supabase Settings`}>
            <Chip
              onClick={() => onSelectTab && onSelectTab('settings')}
              icon={
                cloudStatus.status === 'connected' ? (
                  <CloudDoneIcon sx={{ fontSize: '15px !important', color: '#059669 !important' }} />
                ) : cloudStatus.status === 'setup_needed' ? (
                  <CloudSyncIcon sx={{ fontSize: '15px !important', color: '#D97706 !important' }} />
                ) : cloudStatus.status === 'checking' ? (
                  <CloudSyncIcon sx={{ fontSize: '15px !important', color: '#64748B !important' }} />
                ) : (
                  <ErrorOutlineIcon sx={{ fontSize: '15px !important', color: '#DC2626 !important' }} />
                )
              }
              label={
                cloudStatus.status === 'connected'
                  ? 'Supabase Connected'
                  : cloudStatus.status === 'setup_needed'
                  ? 'Supabase Setup Needed'
                  : cloudStatus.status === 'checking'
                  ? 'Supabase Checking...'
                  : 'Supabase Offline (Local Only)'
              }
              size="small"
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor:
                  cloudStatus.status === 'connected'
                    ? '#ECFDF5'
                    : cloudStatus.status === 'setup_needed'
                    ? '#FEF3C7'
                    : cloudStatus.status === 'checking'
                    ? '#F1F5F9'
                    : '#FEF2F2',
                color:
                  cloudStatus.status === 'connected'
                    ? '#065F46'
                    : cloudStatus.status === 'setup_needed'
                    ? '#92400E'
                    : cloudStatus.status === 'checking'
                    ? '#475569'
                    : '#991B1B',
                border:
                  cloudStatus.status === 'connected'
                    ? '1px solid #A7F3D0'
                    : cloudStatus.status === 'setup_needed'
                    ? '1px solid #FDE68A'
                    : cloudStatus.status === 'checking'
                    ? '1px solid #E2E8F0'
                    : '1px solid #FECACA',
                fontWeight: 800,
                fontSize: '0.75rem',
                '&:hover': {
                  opacity: 0.9,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }
              }}
            />
          </Tooltip>
        </Box>

        {/* User Account Pill & Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            onClick={handleOpenUser}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              p: '5px 12px 5px 6px',
              borderRadius: 3,
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: '#F1F5F9',
                borderColor: '#CBD5E1',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
              }
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#10B981',
                  color: '#10B981',
                  boxShadow: '0 0 0 2px #fff'
                }
              }}
            >
              <Avatar
                sx={{
                  bgcolor: isStudent ? '#0D9488' : isEmployer ? '#7C3AED' : isTrainer ? '#059669' : '#0F2C59',
                  color: '#ffffff',
                  width: 32,
                  height: 32,
                  fontSize: '0.85rem',
                  fontWeight: 800
                }}
              >
                {currentUser?.name?.[0] || 'U'}
              </Avatar>
            </Badge>

            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {currentUser?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 600 }}>
                {currentUser?.role === 'ADMIN'
                  ? 'Administrator'
                  : currentUser?.role === 'TRAINER'
                  ? 'Certified Trainer'
                  : currentUser?.role === 'STUDENT'
                  ? 'Trainee'
                  : currentUser?.role === 'EMPLOYER'
                  ? 'Partner Employer'
                  : 'Officer'}
              </Typography>
            </Box>
          </Box>

          {onGoHome && (
            <Tooltip title="View Public Website">
              <Button
                size="small"
                variant="outlined"
                onClick={onGoHome}
                startIcon={<PublicIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: '#0F2E5A',
                  borderColor: '#CBD5E1',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  display: { xs: 'none', md: 'inline-flex' },
                  bgcolor: '#FFFFFF',
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: '#0F2E5A' }
                }}
              >
                Website
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Quick Lock Screen (4-Digit PIN)">
            <IconButton
              onClick={onOpenPinModal}
              size="small"
              sx={{
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 2.5,
                p: 1,
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
              }}
            >
              <LockIcon fontSize="small" sx={{ color: '#475569' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Switch & Option Menu */}
        <Menu
          anchorEl={anchorUser}
          open={Boolean(anchorUser)}
          onClose={handleCloseUser}
          PaperProps={{
            sx: {
              width: 320,
              borderRadius: 3.5,
              p: 1,
              mt: 1.5,
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.18)',
              border: '1px solid #E2E8F0'
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.5, bgcolor: '#F8FAFC', borderRadius: 2.5, mb: 1, border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59' }}>
              {currentUser?.name || 'Administrator'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Role: <b>{currentUser?.role || 'ADMIN'}</b> • Global Era TVET
            </Typography>
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
                Cloud Database:
              </Typography>
              <Chip
                size="small"
                label={
                  cloudStatus.status === 'connected'
                    ? 'Connected'
                    : cloudStatus.status === 'setup_needed'
                    ? 'Setup Needed'
                    : 'Local Only'
                }
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  bgcolor:
                    cloudStatus.status === 'connected'
                      ? '#DCFCE7'
                      : cloudStatus.status === 'setup_needed'
                      ? '#FEF3C7'
                      : '#FEE2E2',
                  color:
                    cloudStatus.status === 'connected'
                      ? '#166534'
                      : cloudStatus.status === 'setup_needed'
                      ? '#92400E'
                      : '#991B1B'
                }}
              />
            </Box>
          </Box>

          <Typography variant="overline" sx={{ px: 2, color: '#94A3B8', fontWeight: 800, fontSize: '0.68rem' }}>
            ACTIVE SYSTEM ACCOUNTS
          </Typography>

          <MenuItem onClick={() => { switchUser('ADMIN'); handleCloseUser(); }} sx={{ borderRadius: 2, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#0F2C59', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>A</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>Super Admin (PIN: 1111)</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Full TVET management & cloud sync</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('STAFF'); handleCloseUser(); }} sx={{ borderRadius: 2, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#1E40AF', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>S</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>Front Desk Officer (PIN: 2222)</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Admissions, inquiries & billing</Typography>
              </Box>
            </Box>
          </MenuItem>

          {/* Dynamic Registered Real Trainers */}
          {(db.trainers || []).slice(0, 3).map((trainer) => (
            <MenuItem
              key={trainer.id}
              onClick={() => { switchUser('TRAINER', trainer.id); handleCloseUser(); }}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#059669', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>
                  {trainer.name?.[0] || 'T'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Trainer: {trainer.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    {trainer.specialization || 'TVET Instructor'} {trainer.pin ? `(PIN: ${trainer.pin})` : ''}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}

          {/* Dynamic Registered Real Students */}
          {(db.students || []).slice(0, 2).map((student) => (
            <MenuItem
              key={student.id}
              onClick={() => { switchUser('STUDENT', student.id); handleCloseUser(); }}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#0D9488', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>
                  {student.name?.[0] || 'S'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Student: {student.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Roll: {student.rollNo || student.id} • {student.phone || 'Active'}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}

          {/* Dynamic Registered Real Employers */}
          {(db.employers || []).slice(0, 2).map((employer) => (
            <MenuItem
              key={employer.id}
              onClick={() => { switchUser('EMPLOYER', employer.id); handleCloseUser(); }}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#7C3AED', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>
                  {employer.name?.[0] || 'E'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Employer: {employer.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    {employer.industry || employer.contactPerson || 'TVET Partner'}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}

          <MenuItem
            onClick={() => {
              handleCloseUser();
              if (onSelectTab) onSelectTab('users');
            }}
            sx={{
              borderRadius: 2,
              mt: 1,
              bgcolor: '#F1F5F9',
              border: '1px dashed #CBD5E1',
              '&:hover': { bgcolor: '#E2E8F0' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <ManageAccountsIcon fontSize="small" sx={{ color: '#0F2C59' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2C59' }}>Manage Users & Roles</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Add real staff, trainers & accounts</Typography>
              </Box>
            </Box>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={handleExportContacts} sx={{ borderRadius: 2 }}>
            <DownloadIcon fontSize="small" sx={{ mr: 1.5, color: '#0284C7' }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Export Contacts (.vcf)</Typography>
          </MenuItem>

          <MenuItem onClick={handleResetData} sx={{ borderRadius: 2 }}>
            <RestartAltIcon fontSize="small" sx={{ mr: 1.5, color: '#DC2626' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>Reset Database</Typography>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem
            onClick={async () => {
              handleCloseUser();
              const ok = await confirm({
                type: 'logout',
                title: 'Confirm Logout',
                message: 'Are you sure you want to log out of the system?',
                detail: 'Your session will end securely and you will need your PIN to sign in again.',
                confirmText: 'Yes, Logout',
                cancelText: 'Cancel',
                confirmColor: '#EF4444'
              });
              if (ok) {
                logout();
              }
            }}
            sx={{ borderRadius: 2, color: '#DC2626' }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#DC2626' }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626' }}>Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
