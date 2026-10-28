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
    address: 'काठमाडौं',
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
          ? 'कृपया एडमिन युजरनेम प्रविष्ट गर्नुहोस्।'
          : 'कृपया आफ्नो फोन नम्बर वा आईडी प्रविष्ट गर्नुहोस्।'
      );
      return;
    }
    if (!pin) {
      setError('कृपया पासवर्ड वा ४-अङ्कको पिन प्रविष्ट गर्नुहोस्।');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      const res = login(identifier, pin);
      setLoading(false);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess(res.user);
      } else {
        setError(res.message || 'लगइन असफल भयो। युजरनेम वा पिन जाँच गर्नुहोस्।');
      }
    }, 200);
  };

  const handleRegisterAgent = (e) => {
    if (e) e.preventDefault();
    if (!regForm.name.trim() || !regForm.phone.trim()) {
      alert('कृपया नाम र फोन नम्बर अनिवार्य प्रविष्ट गर्नुहोस्।');
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
      address: regForm.address.trim() || 'काठमाडौं',
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
    setRegSuccessMsg(`बधाई छ! तपाईंको एजेन्ट कोड: ${newCode} तयार भयो। लगइन बटन थिच्नुहोस्।`);
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
            {company.companyNameNepali || 'ग्लोबल एरा प्राविधिक स्कुल'} • CTEVT Code: {company.ctevtCode || '4208'}
          </Typography>

          {/* Gateway Title Badge */}
          <Chip
            label={
              portalMode === 'agent'
                ? '🤝 रेफ़रल पार्टनर / एजेन्ट लगइन (Agent Gateway)'
                : portalMode === 'trainer'
                ? '👨‍🏫 प्रशिक्षक पोर्टल लगइन (Trainer Gateway)'
                : portalMode === 'student'
                ? '🎓 विद्यार्थी पोर्टल लगइन (Student Gateway)'
                : '🛡️ क्याम्पस मुख्य प्रशासनिक लगइन (Main Admin)'
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
                    ? 'एडमिन युजरनेम (Admin Username):'
                    : portalMode === 'agent'
                    ? 'एजेन्ट कोड वा फोन नम्बर (Agent Code / Phone):'
                    : portalMode === 'trainer'
                    ? 'प्रशिक्षक फोन वा आईडी (Trainer Phone / ID):'
                    : 'विद्यार्थी फोन वा दर्ता नम्बर (Phone / TGID):'}
                </Typography>
                <TextField
                  fullWidth
                  placeholder={
                    portalMode === 'admin'
                      ? 'admin'
                      : portalMode === 'agent'
                      ? 'उदा: 9841234567 वा AGE-101'
                      : portalMode === 'trainer'
                      ? 'उदा: 9841234567 वा TRN-01'
                      : 'उदा: 9860000001 वा GETS-2026-STD01'
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
                    ? 'एडमिन पासवर्ड (Password):'
                    : '४-अङ्कको गोप्य पिन (4-Digit Access PIN):'}
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
                    अधिकृत प्रशासनिक युजरनेम तथा पासवर्ड प्रविष्ट गर्नुहोस्।
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
                  ? 'प्रमाणीकरण हुँदैछ...'
                  : portalMode === 'agent'
                  ? 'एजेन्ट पोर्टल खोल्नुहोस् (Enter Agent Portal)'
                  : portalMode === 'trainer'
                  ? 'प्रशिक्षक पोर्टल खोल्नुहोस् (Enter Trainer Portal)'
                  : portalMode === 'student'
                  ? 'विद्यार्थी पोर्टल खोल्नुहोस् (Enter Student Portal)'
                  : 'एडमिन प्रणालीमा प्रवेश गर्नुहोस् (Sign In to ERP)'}
              </Button>

              {/* Quick Demo Credentials & Agent Sign Up */}
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
                    ✨ नयाँ रेफ़रल पार्टनर / एजेन्ट दर्ता (Sign Up)
                  </Button>

                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleQuickDemo('AGE-101', '1234')}
                    sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#64748B' }}
                  >
                    💡 परीक्षण गर्नुहोस्: डेमो एजेन्ट (AGE-101 / 1234)
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
                  ← मुख्य वेबसाइट (गृहपृष्ठ) मा फर्कनुहोस्
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
                      एजेन्ट पोर्टल (Agent)
                    </Button>
                  )}
                  {portalMode !== 'trainer' && (!allowedModes || allowedModes.includes('trainer')) && (
                    <Button
                      size="small"
                      startIcon={<PeopleAltIcon />}
                      onClick={() => handleSwitchMode('trainer')}
                      sx={{ fontWeight: 800, color: '#059669', fontSize: '0.78rem' }}
                    >
                      प्रशिक्षक पोर्टल (Trainer)
                    </Button>
                  )}
                  {portalMode !== 'student' && (!allowedModes || allowedModes.includes('student')) && (
                    <Button
                      size="small"
                      startIcon={<SchoolIcon />}
                      onClick={() => handleSwitchMode('student')}
                      sx={{ fontWeight: 800, color: '#2563EB', fontSize: '0.78rem' }}
                    >
                      विद्यार्थी पोर्टल (Student)
                    </Button>
                  )}
                  {portalMode !== 'admin' && allowedModes && allowedModes.includes('admin') && (
                    <Button
                      size="small"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => handleSwitchMode('admin')}
                      sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.78rem' }}
                    >
                      एडमिन लगइन (Admin)
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
            ✨ नयाँ एजेन्ट / रेफ़रल पार्टनर दर्ता
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 600 }}>
                दर्ता गरेपछि तपाईंलाई तुरुन्तै <b>युनिक एजेन्ट कोड</b> र <b>रेफ़रल लिङ्क</b> प्राप्त हुनेछ।
              </Alert>

              <TextField
                required
                fullWidth
                label="तपाईंको पूरा नाम (Full Name)"
                placeholder="उदा: रमेश शर्मा"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />

              <TextField
                required
                fullWidth
                label="मोबाइल नम्बर (Phone Number)"
                placeholder="उदा: 9841234567"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
              />

              <TextField
                fullWidth
                label="ठेगाना / सहर (City/Address)"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
              />

              <TextField
                fullWidth
                label="कमिसन पाउने eSewa वा बैंक विवरण"
                placeholder="उदा: eSewa: 9841234567 वा Nabil Bank"
                value={regForm.paymentInfo}
                onChange={(e) => setRegForm({ ...regForm, paymentInfo: e.target.value })}
              />

              <TextField
                fullWidth
                type="password"
                label="आफ्नो ४-अङ्कको लगइन पिन (Login PIN)"
                value={regForm.pin}
                onChange={(e) => setRegForm({ ...regForm, pin: e.target.value })}
                inputProps={{ maxLength: 6 }}
                helperText="पछि लगइन गर्न यो पिन प्रयोग गर्नुहोस्।"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenRegisterModal(false)} sx={{ fontWeight: 700 }}>
              रद्द
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#7C2D12', color: '#FFFFFF', fontWeight: 800, px: 3, '&:hover': { bgcolor: '#9A3412' } }}
            >
              दर्ता गर्नुहोस् (Register)
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
