import React, { useState } from 'react';
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
import SchoolIcon from '@mui/icons-material/School';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShieldIcon from '@mui/icons-material/Shield';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';
import { loadDB, resetDB } from '../../services/storage';
import { exportGoogleContactsVCF } from '../../services/exportUtils';

export default function Navbar({ onToggleSidebar, onOpenPinModal }) {
  const { currentUser, switchUser, logout, isAdmin, isTrainer, isStudent, isEmployer } = useAuth();
  const [anchorUser, setAnchorUser] = useState(null);
  const db = loadDB();

  const handleOpenUser = (e) => setAnchorUser(e.currentTarget);
  const handleCloseUser = () => setAnchorUser(null);

  const handleResetData = () => {
    if (window.confirm('Reset all sample data back to default initial state?')) {
      resetDB();
      handleCloseUser();
      alert('Data reset to default.');
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
                ग्लोबल एरा प्राविधिक स्कुल
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

          {/* Supabase Status */}
          <Tooltip title="Supabase PostgreSQL Cloud: yycybsmwuixixfmocrcz.supabase.co (Active & Synchronized)">
            <Chip
              icon={<CloudDoneIcon sx={{ fontSize: '15px !important', color: '#059669 !important' }} />}
              label="Supabase Cloud Live"
              size="small"
              sx={{
                bgcolor: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                fontWeight: 800,
                fontSize: '0.75rem'
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
          <Box sx={{ px: 2, py: 1.5, bgcolor: '#F8FAFC', borderRadius: 2.5, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59' }}>
              {currentUser?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Role: <b>{currentUser?.role}</b> • Global Era TVET
            </Typography>
          </Box>

          <Typography variant="overline" sx={{ px: 2, color: '#94A3B8', fontWeight: 800, fontSize: '0.68rem' }}>
            द्रुत भूमिका स्विच गर्नुहोस् (SWITCH DEMO ROLE)
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

          <MenuItem onClick={() => { switchUser('TRAINER', 'TRN-01'); handleCloseUser(); }} sx={{ borderRadius: 2, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#059669', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>P</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>Trainer Pooja Rajbanshi</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Beautician Batch (PIN: 1234)</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('TRAINER', 'TRN-02'); handleCloseUser(); }} sx={{ borderRadius: 2, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#059669', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>A</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>Trainer Anita Thapa</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Caregiver Batch (PIN: 2345)</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('STUDENT', 'STD-01'); handleCloseUser(); }} sx={{ borderRadius: 2, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#0D9488', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>S</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>विद्यार्थी: Sunita Sharma</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Phone: 9841000001 (Job Apply Active)</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('EMPLOYER', 'EMP-01'); handleCloseUser(); }} sx={{ borderRadius: 2, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#7C3AED', width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>E</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>रोजगारदाता: Norvic Hospital</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Post Job & Hire TVET Trainees</Typography>
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
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>Reset Sample Data</Typography>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem
            onClick={() => {
              handleCloseUser();
              if (window.confirm('के तपाईं लगआउट (Logout) गर्न चाहनुहुन्छ?')) {
                logout();
              }
            }}
            sx={{ borderRadius: 2, color: '#DC2626' }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#DC2626' }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626' }}>Logout (लगआउट)</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
