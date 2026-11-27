import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Grid
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HandshakeIcon from '@mui/icons-material/Handshake';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useAuth } from '../../context/AuthContext';
import { loadDB, saveDB } from '../../services/storage';

export default function UnifiedLoginScreen({ onLoginSuccess, initialMode, allowedModes, onBackHome }) {
  const { login } = useAuth();
  const db = loadDB();
  const company = db.settings?.companyProfile || {};

  // Detect mode from props, URL query ?portal=trainer or path
  const [portalMode, setPortalMode] = useState(() => {
    if (initialMode) return initialMode;
    try {
      const path = window.location.pathname.toLowerCase();
      if (path === '/agent') return 'agent';
      if (path === '/trainer') return 'trainer';
      if (path === '/student') return 'student';
      if (path === '/admin' || path === '/ge-admin') return 'admin';
      const params = new URLSearchParams(window.location.search);
      const p = params.get('portal');
      if (p === 'agent') return 'agent';
      if (p === 'trainer') return 'trainer';
      if (p === 'student') return 'student';
      if (p === 'admin') return 'admin';
    } catch (_) {}
    return 'trainer';
  });

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New Agent Self-Registration Modal
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: 'Kathmandu',
    paymentInfo: '',
    pin: '1234'
  });
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Sync state when mode switches
  const handleSwitchMode = (mode) => {
    setPortalMode(mode);
    setError('');
    setShowPin(false);
    setIdentifier('');
    setPin('');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!identifier) {
      setError(
        portalMode === 'admin'
          ? 'Please enter the admin username.'
          : 'Please enter your phone number or ID.'
      );
      return;
    }
    if (!pin) {
      setError('Please enter your password or 4-digit PIN.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      const res = login(identifier, pin, portalMode);
      setLoading(false);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Login failed. Please verify your username and PIN.');
      }
    }, 200);
  };

  const handleRegisterAgent = (e) => {
    if (e) e.preventDefault();
    if (!regForm.name.trim() || !regForm.phone.trim()) {
      alert('Please enter both your full name and phone number.');
      return;
    }

    const currentAgents = db.agents || [];
    const existingIds = currentAgents
      .map((a) => {
        const match = a.code && a.code.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingIds.length ? Math.max(...existingIds) + 1 : 101;
    const newCode = `AGE-${nextNum}`;
    const newId = `AGT-${String(nextNum).padStart(2, '0')}`;

    const newAgent = {
      id: newId,
      code: newCode,
      name: regForm.name.trim(),
      phone: regForm.phone.trim(),
      email: regForm.email.trim() || '',
      address: regForm.address.trim() || 'Kathmandu',
      pin: regForm.pin.trim() || '1234',
      status: 'Active',
      commissionType: 'FIXED',
      defaultRate: 1000,
      paymentInfo: regForm.paymentInfo.trim() || `eSewa: ${regForm.phone.trim()}`,
      joinedDate: new Date().toISOString().slice(0, 10)
    };

    const nextDb = {
      ...db,
      agents: [newAgent, ...currentAgents]
    };
    saveDB(nextDb);

    setOpenRegisterModal(false);
    setIdentifier(newCode);
    setPin(newAgent.pin);
    setRegSuccessMsg(`Agent code ${newCode} created. Sign in to continue.`);
  };

  const handleQuickDemo = (quickId, quickPin) => {
    setIdentifier(quickId);
    setPin(quickPin);
    setError('');
    const res = login(quickId, quickPin);
    if (res.success && onLoginSuccess) {
      onLoginSuccess(res.user);
    } else if (!res.success) {
      setError(res.message);
    }
  };

  const portalLabel =
    portalMode === 'agent'
      ? 'Referral partner portal'
      : portalMode === 'trainer'
      ? 'Trainer portal'
      : portalMode === 'student'
      ? 'Student portal'
      : 'Administration portal';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F7F8FA',
        p: { xs: 2, sm: 3 }
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          bgcolor: '#FFFFFF'
        }}
      >
        {/* Institutional Header */}
        <Box
          sx={{
            px: { xs: 3, sm: 4 },
            pt: { xs: 3, sm: 4 },
            pb: 2.5,
            borderBottom: '1px solid #E5E7EB'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: '#0F2C59',
                color: '#FFFFFF',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {portalMode === 'agent' ? (
                <HandshakeIcon sx={{ fontSize: 20 }} />
              ) : portalMode === 'trainer' ? (
                <PeopleAltIcon sx={{ fontSize: 20 }} />
              ) : portalMode === 'student' ? (
                <SchoolIcon sx={{ fontSize: 20 }} />
              ) : (
                <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 600, color: '#111827', lineHeight: 1.2, fontSize: '1.0625rem' }}>
                {company.companyNameEnglish || 'Prabidhik School, Jorpati'}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: '#6B7487', display: 'block', mt: 0.25, fontSize: '0.75rem' }}>
                {company.companyNameNepali || 'Global Era Multi Service Pvt. Ltd.'} · CTEVT {company.ctevtCode || '4208'}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: '#0F2C59', fontWeight: 500, fontSize: '0.8125rem' }}>
            {portalLabel}
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {regSuccessMsg && (
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px', fontWeight: 500 }}>
              {regSuccessMsg}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px', fontWeight: 500 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              {/* Field 1: Identifier */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 500, color: '#111827', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                  {portalMode === 'admin'
                    ? 'Username'
                    : portalMode === 'agent'
                    ? 'Agent code or phone number'
                    : portalMode === 'trainer'
                    ? 'Trainer phone or ID'
                    : 'Student phone or registration ID'}
                </Typography>
                <TextField
                  fullWidth
                  placeholder={
                    portalMode === 'admin'
                      ? 'Enter username'
                      : portalMode === 'agent'
                      ? '9841234567 or AGE-101'
                      : portalMode === 'trainer'
                      ? '9841234567 or TRN-01'
                      : '9860000001 or TGID-101'
                  }
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError('');
                  }}
                  autoFocus={portalMode !== 'admin'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {portalMode === 'admin' ? (
                          <AdminPanelSettingsIcon sx={{ color: '#6B7487', fontSize: 18 }} />
                        ) : portalMode === 'agent' ? (
                          <HandshakeIcon sx={{ color: '#6B7487', fontSize: 18 }} />
                        ) : (
                          <PhoneIphoneIcon sx={{ color: '#6B7487', fontSize: 18 }} />
                        )}
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {/* Field 2: Password / PIN */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 500, color: '#111827', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}>
                  {portalMode === 'admin'
                    ? 'Password'
                    : '4-digit PIN'}
                </Typography>
                <TextField
                  fullWidth
                  type={showPin ? 'text' : 'password'}
                  placeholder={portalMode === 'admin' ? 'Enter password' : '••••'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#6B7487', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPin(!showPin)} edge="end" size="small" aria-label="Toggle password visibility">
                          {showPin ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {portalMode === 'admin' && (
                  <Typography variant="caption" sx={{ color: '#6B7487', display: 'block', mt: 0.75, fontSize: '0.75rem' }}>
                    Use your authorized administrative credentials.
                  </Typography>
                )}
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                sx={{
                  height: 44,
                  bgcolor: '#0F2C59',
                  color: '#FFFFFF',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  borderRadius: '8px',
                  '&:hover': {
                    bgcolor: '#163A70'
                  }
                }}
              >
                {loading
                  ? 'Signing in...'
                  : portalMode === 'agent'
                  ? 'Sign in to agent portal'
                  : portalMode === 'trainer'
                  ? 'Sign in to trainer portal'
                  : portalMode === 'student'
                  ? 'Sign in to student portal'
                  : 'Sign in'}
              </Button>

              {/* Agent Sign Up */}
              {portalMode === 'agent' && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<HowToRegIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setOpenRegisterModal(true)}
                  sx={{
                    height: 38,
                    fontWeight: 500,
                    borderRadius: '8px',
                    color: '#111827',
                    borderColor: '#E5E7EB',
                    bgcolor: '#F7F8FA',
                    '&:hover': { bgcolor: '#F1F5F9', borderColor: '#D1D5DB' }
                  }}
                >
                  Register as referral partner
                </Button>
              )}
            </Stack>
          </form>

          {/* Bottom Navigation */}
          <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Stack spacing={1.5} alignItems="center">
              {onBackHome && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
                  onClick={onBackHome}
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.78rem',
                    color: '#4B5565',
                    '&:hover': { color: '#111827', bgcolor: '#F7F8FA' }
                  }}
                >
                  Return to main website
                </Button>
              )}

              {/* Show role switcher only if allowed */}
              {(!allowedModes || allowedModes.length > 1) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {portalMode !== 'agent' && (!allowedModes || allowedModes.includes('agent')) && (
                    <Button
                      size="small"
                      startIcon={<HandshakeIcon sx={{ fontSize: 15 }} />}
                      onClick={() => handleSwitchMode('agent')}
                      sx={{ fontWeight: 500, color: '#4B5565', fontSize: '0.78rem', '&:hover': { color: '#111827', bgcolor: '#F7F8FA' } }}
                    >
                      Agent
                    </Button>
                  )}
                  {portalMode !== 'trainer' && (!allowedModes || allowedModes.includes('trainer')) && (
                    <Button
                      size="small"
                      startIcon={<PeopleAltIcon sx={{ fontSize: 15 }} />}
                      onClick={() => handleSwitchMode('trainer')}
                      sx={{ fontWeight: 500, color: '#4B5565', fontSize: '0.78rem', '&:hover': { color: '#111827', bgcolor: '#F7F8FA' } }}
                    >
                      Trainer
                    </Button>
                  )}
                  {portalMode !== 'student' && (!allowedModes || allowedModes.includes('student')) && (
                    <Button
                      size="small"
                      startIcon={<SchoolIcon sx={{ fontSize: 15 }} />}
                      onClick={() => handleSwitchMode('student')}
                      sx={{ fontWeight: 500, color: '#4B5565', fontSize: '0.78rem', '&:hover': { color: '#111827', bgcolor: '#F7F8FA' } }}
                    >
                      Student
                    </Button>
                  )}
                  {portalMode !== 'admin' && allowedModes && allowedModes.includes('admin') && (
                    <Button
                      size="small"
                      startIcon={<AdminPanelSettingsIcon sx={{ fontSize: 15 }} />}
                      onClick={() => handleSwitchMode('admin')}
                      sx={{ fontWeight: 500, color: '#4B5565', fontSize: '0.78rem', '&:hover': { color: '#111827', bgcolor: '#F7F8FA' } }}
                    >
                      Admin
                    </Button>
                  )}
                </Box>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* MODAL: SELF REGISTER AS AGENT */}
      <Dialog
        open={openRegisterModal}
        onClose={() => setOpenRegisterModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleRegisterAgent}>
          <DialogTitle sx={{ fontWeight: 600 }}>
            New referral partner registration
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ borderRadius: '8px', fontWeight: 400 }}>
                Upon registration, you will receive a unique agent code and referral link.
              </Alert>

              <TextField
                required
                fullWidth
                label="Full Name"
                placeholder="Ramesh Sharma"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />

              <TextField
                required
                fullWidth
                label="Mobile Number"
                placeholder="9841234567"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
              />

              <TextField
                fullWidth
                label="City / Address"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
              />

              <TextField
                fullWidth
                label="eSewa or Bank Details for Commission"
                placeholder="eSewa: 9841234567 or Nabil Bank"
                value={regForm.paymentInfo}
                onChange={(e) => setRegForm({ ...regForm, paymentInfo: e.target.value })}
              />

              <TextField
                fullWidth
                type="password"
                label="4-Digit Login PIN"
                value={regForm.pin}
                onChange={(e) => setRegForm({ ...regForm, pin: e.target.value })}
                inputProps={{ maxLength: 6 }}
                helperText="Use this PIN for future logins."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRegisterModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', px: 2.5, '&:hover': { bgcolor: '#163A70' } }}
            >
              Register
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
