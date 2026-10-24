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
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LockIcon from '@mui/icons-material/Lock';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SchoolIcon from '@mui/icons-material/School';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../../context/AuthContext';
import { loadDB, resetDB } from '../../services/storage';
import { exportGoogleContactsVCF } from '../../services/exportUtils';

export default function Navbar({ onToggleSidebar, onOpenPinModal }) {
  const { currentUser, switchUser, logout, isAdmin, isTrainer } = useAuth();
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

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        backgroundColor: '#ffffff',
        color: '#152238',
        borderBottom: '1px solid #e2e8f0',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 58, sm: 66 }, px: { xs: 1.5, sm: 2.5 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: { xs: 1, sm: 2 } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Avatar
            sx={{
              bgcolor: '#1a56b0',
              color: '#ffffff',
              width: { xs: 36, sm: 42 },
              height: { xs: 36, sm: 42 },
              fontWeight: 800,
              fontSize: { xs: 18, sm: 22 }
            }}
          >
            🎓
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.2,
                fontSize: { xs: '0.875rem', sm: '1.05rem' },
                color: '#1a56b0',
                letterSpacing: '-0.01em'
              }}
            >
              KITE CAREGIVER TRAINING CENTER
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#647089',
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              ग्लोबल एरा प्राविधिक स्कुल • MitraPark, Kathmandu
            </Typography>
          </Box>
        </Box>

        {/* User Badge & Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            avatar={<Avatar sx={{ bgcolor: isTrainer ? '#1a9c5c' : '#1a56b0', color: '#fff' }}>{currentUser?.name?.[0]}</Avatar>}
            label={currentUser?.name}
            variant="outlined"
            size="medium"
            onClick={handleOpenUser}
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              borderColor: '#cbd5e1',
              backgroundColor: isTrainer ? '#e5f8ee' : '#e8f0fd',
              color: isTrainer ? '#147a48' : '#1a56b0',
              '&:hover': { backgroundColor: '#e2e8f0' }
            }}
          />

          <Tooltip title="Quick Lock Screen (4-Digit PIN)">
            <IconButton
              onClick={onOpenPinModal}
              size="small"
              sx={{
                bgcolor: '#f1f4f9',
                border: '1px solid #dce4ee',
                '&:hover': { bgcolor: '#e2e8f0' }
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
            sx: { width: 300, borderRadius: 3, p: 1, mt: 1.5, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {currentUser?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#647089' }}>
              Role: <b>{currentUser?.role}</b> {isTrainer && `(Trainer)`}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />

          <Typography variant="overline" sx={{ px: 2, color: '#94a3b8', fontWeight: 800 }}>
            Switch Role / User (Testing)
          </Typography>

          <MenuItem onClick={() => { switchUser('ADMIN'); handleCloseUser(); }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#1a56b0', width: 28, height: 28, fontSize: 13 }}>A</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Super Admin (PIN: 1111)</Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>Full institute access</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('TRAINER', 'TRN-01'); handleCloseUser(); }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#1a9c5c', width: 28, height: 28, fontSize: 13 }}>P</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Pooja Rajbanshi (PIN: 1234)</Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>Beautician Trainer (BT-01)</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('TRAINER', 'TRN-02'); handleCloseUser(); }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#1a9c5c', width: 28, height: 28, fontSize: 13 }}>A</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Sister Anita Thapa (PIN: 2345)</Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>Caregiver Trainer (CG-01)</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('STAFF'); handleCloseUser(); }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#c9820a', width: 28, height: 28, fontSize: 13 }}>F</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Front Desk Officer (PIN: 2222)</Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>Admissions & Student intake</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('STUDENT', 'STD-01'); handleCloseUser(); }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#0d9488', width: 28, height: 28, fontSize: 13 }}>S</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Student Portal (Sunita Sharma)</Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>Phone: 9841000001 (PIN: 1234)</Typography>
              </Box>
            </Box>
          </MenuItem>

          <MenuItem onClick={() => { switchUser('EMPLOYER', 'EMP-01'); handleCloseUser(); }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ bgcolor: '#7c3aed', width: 28, height: 28, fontSize: 13 }}>E</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Employer (Norvic Hospital)</Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>Post Jobs & Hire TVET Students</Typography>
              </Box>
            </Box>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={handleExportContacts}>
            <DownloadIcon fontSize="small" sx={{ mr: 1.5, color: '#0288d1' }} />
            Export to Google Contacts (.vcf)
          </MenuItem>

          <MenuItem onClick={handleResetData}>
            <RestartAltIcon fontSize="small" sx={{ mr: 1.5, color: '#d5372f' }} />
            Reset Sample Data
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
