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
    setRegSuccessMsg(`Congratulations! Your Agent Code ${newCode} is ready. Click Sign In to continue.`);
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          portalMode === 'agent'
            ? 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #1e1b4b 100%)'
            : portalMode === 'trainer'
            ? 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)'
            : portalMode === 'student'
            ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #0b2545 0%, #133e68 50%, #081a30 100%)',
        p: { xs: 2, sm: 3 },
        transition: 'background 0.3s ease'
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          bgcolor: '#FFFFFF'
        }}
      >
        {/* Institutional Header Banner */}
        <Box
          sx={{
            bgcolor:
              portalMode === 'agent'
                ? '#7C2D12'
                : portalMode === 'trainer'
                ? '#064E3B'
                : portalMode === 'student'
                ? '#1E3A8A'
                : '#0F2E5A',
            color: '#FFFFFF',
            p: 3,
            textAlign: 'center',
            position: 'relative',
            borderBottom: `3px solid ${portalMode === 'agent' ? '#F59E0B' : portalMode === 'trainer' ? '#10B981' : portalMode === 'student' ? '#38BDF8' : '#F59E0B'}`
          }}
        >
          <Box
            sx={{
              width: 62,
              height: 62,
              bgcolor: 'rgba(255,255,255,0.12)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.2,
              border: `2px solid ${portalMode === 'agent' ? '#F59E0B' : portalMode === 'trainer' ? '#10B981' : portalMode === 'student' ? '#38BDF8' : '#F59E0B'}`
            }}
          >
            {portalMode === 'agent' ? (
              <HandshakeIcon sx={{ fontSize: 34, color: '#FCD34D' }} />
            ) : portalMode === 'trainer' ? (
              <PeopleAltIcon sx={{ fontSize: 34, color: '#10B981' }} />
            ) : portalMode === 'student' ? (
              <SchoolIcon sx={{ fontSize: 34, color: '#38BDF8' }} />
            ) : (
              <AdminPanelSettingsIcon sx={{ fontSize: 36, color: '#F59E0B' }} />
            )}
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.2 }}>
            {company.companyNameEnglish || 'GLOBAL ERA TECHNICAL SCHOOL'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mt: 0.4, fontWeight: 600 }}>
            {company.companyNameNepali || 'Global Era Technical School'} • CTEVT Code: {company.ctevtCode || '4208'}
          </Typography>

          {/* Gateway Title Badge */}
          <Chip
            label={
              portalMode === 'agent'
                ? '🤝 Referral Partner / Agent Gateway'
                : portalMode === 'trainer'
                ? '👨‍🏫 Trainer Portal Gateway'
                : portalMode === 'student'
                ? '🎓 Student Portal Gateway'
                : '🛡️ Main Administration Gateway'
            }
            size="small"
            sx={{
              mt: 1.5,
              bgcolor:
                portalMode === 'agent'
                  ? 'rgba(245, 158, 11, 0.25)'
                  : portalMode === 'trainer'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : portalMode === 'student'
                  ? 'rgba(56, 189, 248, 0.25)'
                  : 'rgba(245, 158, 11, 0.25)',
              color:
                portalMode === 'agent'
                  ? '#FDE68A'
                  : portalMode === 'trainer'
                  ? '#6EE7B7'
                  : portalMode === 'student'
                  ? '#BAE6FD'
                  : '#FDE68A',
              fontWeight: 800,
              fontSize: '0.75rem'
            }}
          />
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {regSuccessMsg && (
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 700 }}>
              {regSuccessMsg}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 700 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.2}>
              {/* Field 1: Identifier */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.6, display: 'block' }}>
                  {portalMode === 'admin'
                    ? 'Admin Username:'
                    : portalMode === 'agent'
                    ? 'Agent Code or Phone Number:'
                    : portalMode === 'trainer'
                    ? 'Trainer Phone or ID:'
                    : 'Student Phone or Registration ID (TGID):'}
                </Typography>
                <TextField
                  fullWidth
                  placeholder={
                    portalMode === 'admin'
                      ? 'admin'
                      : portalMode === 'agent'
                      ? 'e.g. 9841234567 or AGE-101'
                      : portalMode === 'trainer'
                      ? 'e.g. 9841234567 or TRN-01'
                      : 'e.g. 9860000001 or TGID-101'
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
                          <AdminPanelSettingsIcon sx={{ color: '#0F2E5A' }} />
                        ) : portalMode === 'agent' ? (
                          <HandshakeIcon sx={{ color: '#C2410C' }} />
                        ) : (
                          <PhoneIphoneIcon sx={{ color: portalMode === 'trainer' ? '#065F46' : '#1E40AF' }} />
                        )}
                      </InputAdornment>
                    )
                  }}
                  sx={{ bgcolor: '#F8FAFC' }}
                />
              </Box>

              {/* Field 2: Password / PIN */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.6, display: 'block' }}>
                  {portalMode === 'admin'
                    ? 'Admin Password:'
                    : '4-Digit Access PIN:'}
                </Typography>
                <TextField
                  fullWidth
                  type={showPin ? 'text' : 'password'}
                  placeholder={portalMode === 'admin' ? 'admin123' : '••••'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon
                          sx={{
                            color:
                              portalMode === 'agent'
                                ? '#C2410C'
                                : portalMode === 'trainer'
                                ? '#065F46'
                                : portalMode === 'student'
                                ? '#1E40AF'
                                : '#0F2E5A'
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPin(!showPin)} edge="end" size="small">
                          {showPin ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ bgcolor: '#F8FAFC' }}
                />

                {portalMode === 'admin' && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.6 }}>
                    Enter your authorized administrative username and password.
                  </Typography>
                )}
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{
                  py: 1.3,
                  bgcolor:
                    portalMode === 'agent'
                      ? '#7C2D12'
                      : portalMode === 'trainer'
                      ? '#065F46'
                      : portalMode === 'student'
                      ? '#1E40AF'
                      : '#0F2E5A',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.98rem',
                  borderRadius: 2.5,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                  '&:hover': {
                    bgcolor:
                      portalMode === 'agent'
                        ? '#9A3412'
                        : portalMode === 'trainer'
                        ? '#047857'
                        : portalMode === 'student'
                        ? '#1D4ED8'
                        : '#133E68'
                  }
                }}
              >
                {loading
                  ? 'Authenticating...'
                  : portalMode === 'agent'
                  ? 'Enter Agent Portal'
                  : portalMode === 'trainer'
                  ? 'Enter Trainer Portal'
                  : portalMode === 'student'
                  ? 'Enter Student Portal'
                  : 'Sign In to ERP'}
              </Button>

              {/* Agent Sign Up */}
              {portalMode === 'agent' && (
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<HowToRegIcon />}
                    onClick={() => setOpenRegisterModal(true)}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 2,
                      color: '#7C2D12',
                      borderColor: '#FDBA74',
                      bgcolor: '#FFF7ED',
                      '&:hover': { bgcolor: '#FFEDD5', borderColor: '#EA580C' }
                    }}
                  >
                    ✨ Register as New Referral Partner / Agent (Sign Up)
                  </Button>
                </Stack>
              )}
            </Stack>
          </form>

          {/* Bottom Navigation */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
            <Stack spacing={1.5} alignItems="center">
              {onBackHome && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onBackHome}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: '#0F2E5A',
                    borderColor: '#CBD5E1',
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  ← Return to Main Website (Home)
                </Button>
              )}

              {/* Show role switcher only if allowed */}
              {(!allowedModes || allowedModes.length > 1) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', pt: 0.5 }}>
                  {portalMode !== 'agent' && (!allowedModes || allowedModes.includes('agent')) && (
                    <Button
                      size="small"
                      startIcon={<HandshakeIcon />}
                      onClick={() => handleSwitchMode('agent')}
                      sx={{ fontWeight: 800, color: '#C2410C', fontSize: '0.78rem' }}
                    >
                      Agent Portal
                    </Button>
                  )}
                  {portalMode !== 'trainer' && (!allowedModes || allowedModes.includes('trainer')) && (
                    <Button
                      size="small"
                      startIcon={<PeopleAltIcon />}
                      onClick={() => handleSwitchMode('trainer')}
                      sx={{ fontWeight: 800, color: '#059669', fontSize: '0.78rem' }}
                    >
                      Trainer Portal
                    </Button>
                  )}
                  {portalMode !== 'student' && (!allowedModes || allowedModes.includes('student')) && (
                    <Button
                      size="small"
                      startIcon={<SchoolIcon />}
                      onClick={() => handleSwitchMode('student')}
                      sx={{ fontWeight: 800, color: '#2563EB', fontSize: '0.78rem' }}
                    >
                      Student Portal
                    </Button>
                  )}
                  {portalMode !== 'admin' && allowedModes && allowedModes.includes('admin') && (
                    <Button
                      size="small"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => handleSwitchMode('admin')}
                      sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.78rem' }}
                    >
                      Admin Login
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
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <form onSubmit={handleRegisterAgent}>
          <DialogTitle sx={{ fontWeight: 900, color: '#7C2D12', pb: 1 }}>
            ✨ New Agent / Referral Partner Registration
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 600 }}>
                Upon registration, you will immediately receive a <b>Unique Agent Code</b> and <b>Referral Link</b>.
              </Alert>

              <TextField
                required
                fullWidth
                label="Full Name"
                placeholder="e.g. Ramesh Sharma"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />

              <TextField
                required
                fullWidth
                label="Mobile Number"
                placeholder="e.g. 9841234567"
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
                placeholder="e.g. eSewa: 9841234567 or Nabil Bank"
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
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenRegisterModal(false)} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#7C2D12', color: '#FFFFFF', fontWeight: 800, px: 3, '&:hover': { bgcolor: '#9A3412' } }}
            >
              Register
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
