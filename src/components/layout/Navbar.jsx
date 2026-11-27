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
  ButtonBase,
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

        // If no credentials configured
        if (!url || !key) {
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
        backgroundColor: '#FFFFFF',
        color: '#111827',
        borderBottom: '1px solid #E5E7EB',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2.5 }, gap: 1.5 }}>
        <IconButton
          color="inherit"
          edge="start"
          aria-label="Open navigation menu"
          onClick={onToggleSidebar}
          sx={{
            p: 1,
            bgcolor: '#F7F8FA',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            flexShrink: 0,
            color: '#4B5565',
            '&:hover': { bgcolor: '#F1F5F9', color: '#111827' }
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        {/* Institution Brand Identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: '#0F2C59',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <SchoolIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                fontSize: { xs: '0.9375rem', sm: '1rem' },
                color: '#111827',
                letterSpacing: '-0.01em'
              }}
            >
              Prabidhik School
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: '#6B7487',
                display: { xs: 'none', sm: 'block' },
                fontWeight: 400,
                fontSize: '0.75rem'
              }}
            >
              Global Era Multi Service Pvt. Ltd. · Jorpati, Kathmandu
            </Typography>
          </Box>
        </Box>

        {/* Operational Status Indicator */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center' }}>
          <Tooltip title={`${cloudStatus.message} · Active: ${activeShift} · Click for Settings`}>
            <ButtonBase
              onClick={() => onSelectTab && onSelectTab('settings')}
              aria-label={`Cloud status ${cloudStatus.status}, active ${activeShift}. Open settings`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: '8px',
                cursor: 'pointer',
                bgcolor: '#F7F8FA',
                border: '1px solid #E5E7EB',
                transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
                '&:hover': {
                  bgcolor: '#F1F5F9',
                  borderColor: '#D1D5DB'
                }
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor:
                    cloudStatus.status === 'connected'
                      ? '#16A34A'
                      : cloudStatus.status === 'setup_needed'
                      ? '#D97706'
                      : cloudStatus.status === 'checking'
                      ? '#94A3B8'
                      : '#DC2626'
                }}
              />
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: '#4B5565'
                }}
              >
                {cloudStatus.status === 'connected'
                  ? 'Cloud online'
                  : cloudStatus.status === 'setup_needed'
                  ? 'Setup needed'
                  : cloudStatus.status === 'checking'
                  ? 'Syncing'
                  : 'Offline'}
              </Typography>
              <Box sx={{ width: '1px', height: 12, bgcolor: '#E5E7EB' }} />
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: '#111827'
                }}
              >
                {String(activeShift || '').replace(/\s*\(.*?\)/, '')}
              </Typography>
            </ButtonBase>
          </Tooltip>
        </Box>

        {/* User Account & Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Compact Mobile Sync Status Dot */}
          <Tooltip title={cloudStatus.message}>
            <ButtonBase
              onClick={() => isAdmin && onSelectTab && onSelectTab('settings')}
              aria-label={`Sync status: ${cloudStatus.status}`}
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: '#F7F8FA',
                border: '1px solid #E5E7EB',
                cursor: isAdmin ? 'pointer' : 'default'
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor:
                    cloudStatus.status === 'connected'
                      ? '#16A34A'
                      : cloudStatus.status === 'setup_needed'
                      ? '#D97706'
                      : '#DC2626'
                }}
              />
            </ButtonBase>
          </Tooltip>

          <ButtonBase
            onClick={handleOpenUser}
            aria-label={`Account menu for ${currentUser?.name || 'User'}`}
            aria-haspopup="menu"
            aria-expanded={Boolean(anchorUser)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              p: { xs: '4px', sm: '4px 12px 4px 6px' },
              borderRadius: '8px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
              '&:hover': {
                bgcolor: '#F7F8FA',
                borderColor: '#D1D5DB'
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: '#0F2C59',
                color: '#FFFFFF',
                width: 28,
                height: 28,
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              {currentUser?.name?.[0] || 'U'}
            </Avatar>

            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', lineHeight: 1.2, fontSize: '0.8125rem' }}>
                {currentUser?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.72rem', fontWeight: 400, display: 'block', lineHeight: 1.2 }}>
                {currentUser?.role === 'ADMIN'
                  ? 'Administrator'
                  : currentUser?.role === 'TRAINER'
                  ? 'Trainer'
                  : currentUser?.role === 'STUDENT'
                  ? 'Trainee'
                  : currentUser?.role === 'EMPLOYER'
                  ? 'Employer'
                  : 'Officer'}
              </Typography>
            </Box>
          </ButtonBase>

          {onGoHome && (
            <Tooltip title="View Public Website">
              <Button
                size="small"
                variant="outlined"
                onClick={onGoHome}
                startIcon={<PublicIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: '#4B5565',
                  borderColor: '#E5E7EB',
                  fontWeight: 500,
                  fontSize: '0.78rem',
                  display: { xs: 'none', md: 'inline-flex' },
                  bgcolor: '#FFFFFF',
                  height: 36,
                  px: 1.5,
                  '&:hover': { bgcolor: '#F7F8FA', borderColor: '#D1D5DB', color: '#111827' }
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
              aria-label="Quick Lock Screen"
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                width: 36,
                height: 36,
                color: '#4B5565',
                '&:hover': { bgcolor: '#F7F8FA', borderColor: '#D1D5DB', color: '#111827' }
              }}
            >
              <LockIcon sx={{ fontSize: 18 }} />
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
              width: 300,
              borderRadius: '12px',
              p: 1,
              mt: 1,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              border: '1px solid #E5E7EB'
            }
          }}
        >
          <Box sx={{ px: 1.5, py: 1.25, bgcolor: '#F7F8FA', borderRadius: '8px', mb: 1, border: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827' }}>
              {currentUser?.name || 'Administrator'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7487', display: 'block' }}>
              {currentUser?.role || 'ADMIN'} · Global Era TVET
            </Typography>
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 400, color: '#6B7487' }}>
                Cloud database
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color:
                    cloudStatus.status === 'connected'
                      ? '#16A34A'
                      : cloudStatus.status === 'setup_needed'
                      ? '#D97706'
                      : '#DC2626'
                }}
              >
                {cloudStatus.status === 'connected'
                  ? 'Connected'
                  : cloudStatus.status === 'setup_needed'
                  ? 'Setup needed'
                  : 'Local only'}
              </Typography>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: '#6B7487', fontWeight: 500, fontSize: '0.72rem' }}>
            Switch account
          </Typography>

          <MenuItem onClick={() => { switchUser('ADMIN'); handleCloseUser(); }} sx={{ borderRadius: '8px', mb: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#0F2C59', width: 28, height: 28, fontSize: 12, fontWeight: 600 }}>A</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>Super Admin</Typography>
                <Typography variant="caption" sx={{ color: '#6B7487' }}>Full TVET management & cloud sync</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('STAFF'); handleCloseUser(); }} sx={{ borderRadius: '8px', mb: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#334155', width: 28, height: 28, fontSize: 12, fontWeight: 600 }}>S</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>Front Desk Officer</Typography>
                <Typography variant="caption" sx={{ color: '#6B7487' }}>Admissions, inquiries & billing</Typography>
              </Box>
            </Box>
          </MenuItem>

          {/* Dynamic Registered Real Trainers */}
          {(db.trainers || []).slice(0, 3).map((trainer) => (
            <MenuItem
              key={trainer.id}
              onClick={() => { switchUser('TRAINER', trainer.id); handleCloseUser(); }}
              sx={{ borderRadius: '8px', mb: 0.25 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#475569', width: 28, height: 28, fontSize: 12, fontWeight: 600 }}>
                  {trainer.name?.[0] || 'T'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {trainer.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7487', display: 'block' }}>
                    Trainer · {trainer.specialization || 'TVET Instructor'}
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
              sx={{ borderRadius: '8px', mb: 0.25 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#64748B', width: 28, height: 28, fontSize: 12, fontWeight: 600 }}>
                  {student.name?.[0] || 'S'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {student.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7487', display: 'block' }}>
                    Trainee · {student.rollNo || student.id}
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
              sx={{ borderRadius: '8px', mb: 0.25 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#334155', width: 28, height: 28, fontSize: 12, fontWeight: 600 }}>
                  {employer.name?.[0] || 'E'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {employer.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7487', display: 'block' }}>
                    Employer · {employer.industry || employer.contactPerson || 'Partner'}
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
              borderRadius: '8px',
              mt: 0.5,
              bgcolor: '#F7F8FA',
              border: '1px solid #E5E7EB',
              '&:hover': { bgcolor: '#F1F5F9' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
              <ManageAccountsIcon fontSize="small" sx={{ color: '#4B5565' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>Manage users & roles</Typography>
                <Typography variant="caption" sx={{ color: '#6B7487' }}>Staff, trainers & portal access</Typography>
              </Box>
            </Box>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={handleExportContacts} sx={{ borderRadius: '8px' }}>
            <DownloadIcon fontSize="small" sx={{ mr: 1.25, color: '#4B5565' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>Export contacts (.vcf)</Typography>
          </MenuItem>

          <MenuItem onClick={handleResetData} sx={{ borderRadius: '8px' }}>
            <RestartAltIcon fontSize="small" sx={{ mr: 1.25, color: '#DC2626' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#DC2626' }}>Reset local data</Typography>
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
                confirmColor: '#DC2626'
              });
              if (ok) {
                logout();
              }
            }}
            sx={{ borderRadius: '8px', color: '#DC2626' }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1.25, color: '#DC2626' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#DC2626' }}>Sign out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
