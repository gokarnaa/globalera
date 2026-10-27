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

import { useAuth } from '../../context/AuthContext';
import { loadDB } from '../../services/storage';

export default function UnifiedLoginScreen({ onLoginSuccess }) {
  const { login } = useAuth();
  const db = loadDB();
  const company = db.settings?.companyProfile || {};

  // Detect mode from URL query ?portal=trainer or ?portal=student
  const [portalMode, setPortalMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('portal');
      if (p === 'trainer') return 'trainer';
      if (p === 'student') return 'student';
    } catch (_) {}
    return 'admin'; // Default is Admin Gateway
  });

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state when mode switches
  const handleSwitchMode = (mode) => {
    setPortalMode(mode);
    setError('');
    setShowPin(false);
    if (mode === 'admin') {
      setIdentifier('admin');
      setPin('admin123');
    } else {
      setIdentifier('');
      setPin('');
    }
  };

  useEffect(() => {
    if (portalMode === 'admin') {
      setIdentifier('admin');
      setPin('admin123');
    }
  }, [portalMode]);

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
          portalMode === 'trainer'
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
              portalMode === 'trainer'
                ? '#064E3B'
                : portalMode === 'student'
                ? '#1E3A8A'
                : '#0F2E5A',
            color: '#FFFFFF',
            p: 3,
            textAlign: 'center',
            position: 'relative',
            borderBottom: `3px solid ${portalMode === 'trainer' ? '#10B981' : portalMode === 'student' ? '#38BDF8' : '#F59E0B'}`
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
              border: `2px solid ${portalMode === 'trainer' ? '#10B981' : portalMode === 'student' ? '#38BDF8' : '#F59E0B'}`
            }}
          >
            {portalMode === 'trainer' ? (
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
              portalMode === 'trainer'
                ? '👨‍🏫 प्रशिक्षक पोर्टल लगइन (Trainer Gateway)'
                : portalMode === 'student'
                ? '🎓 विद्यार्थी पोर्टल लगइन (Student Gateway)'
                : '🛡️ क्याम्पस मुख्य प्रशासनिक लगइन (Main Admin)'
            }
            size="small"
            sx={{
              mt: 1.5,
              bgcolor:
                portalMode === 'trainer'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : portalMode === 'student'
                  ? 'rgba(56, 189, 248, 0.25)'
                  : 'rgba(245, 158, 11, 0.25)',
              color:
                portalMode === 'trainer'
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
                    : portalMode === 'trainer'
                    ? 'प्रशिक्षक फोन वा आईडी (Trainer Phone / ID):'
                    : 'विद्यार्थी फोन वा दर्ता नम्बर (Phone / TGID):'}
                </Typography>
                <TextField
                  fullWidth
                  placeholder={
                    portalMode === 'admin'
                      ? 'admin'
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
                              portalMode === 'trainer'
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
                    सुरुवाती एडमिन पासवर्ड: <b>admin123</b> (वा <b>1111</b>)
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
                    portalMode === 'trainer'
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
                      portalMode === 'trainer'
                        ? '#047857'
                        : portalMode === 'student'
                        ? '#1D4ED8'
                        : '#133E68'
                  }
                }}
              >
                {loading
                  ? 'प्रमाणीकरण हुँदैछ...'
                  : portalMode === 'trainer'
                  ? 'प्रशिक्षक पोर्टल खोल्नुहोस् (Enter Trainer Portal)'
                  : portalMode === 'student'
                  ? 'विद्यार्थी पोर्टल खोल्नुहोस् (Enter Student Portal)'
                  : 'एडमिन प्रणालीमा प्रवेश गर्नुहोस् (Sign In to ERP)'}
              </Button>
            </Stack>
          </form>

          {/* Quick Demo Helpers for Each Mode */}
          {portalMode === 'trainer' && (
            <Box sx={{ mt: 2.5, p: 1.5, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', display: 'block', mb: 0.8 }}>
                परीक्षणका लागि प्रशिक्षक खाता (Quick Test):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickDemo('pooja', '1234')}
                  sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#047857', borderColor: '#10B981' }}
                >
                  Pooja (PIN: 1234)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickDemo('anita', '2345')}
                  sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#047857', borderColor: '#10B981' }}
                >
                  Anita (PIN: 2345)
                </Button>
              </Box>
            </Box>
          )}

          {portalMode === 'student' && (
            <Box sx={{ mt: 2.5, p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF', display: 'block', mb: 0.8 }}>
                परीक्षणका लागि विद्यार्थी खाता (Quick Test):
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleQuickDemo('gets-2026-std01', '1234')}
                sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#1D4ED8', borderColor: '#3B82F6' }}
              >
                Student Sunita (PIN: 1234)
              </Button>
            </Box>
          )}

          {/* Switch Portals Navigation at the Bottom */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
            {portalMode === 'admin' ? (
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, fontWeight: 700 }}>
                  अन्य प्रयोगकर्ता पोर्टलहरू (Direct User Portals):
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<PeopleAltIcon />}
                    onClick={() => handleSwitchMode('trainer')}
                    sx={{ fontWeight: 800, color: '#059669', fontSize: '0.82rem' }}
                  >
                    प्रशिक्षक पोर्टल (Trainer) →
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<SchoolIcon />}
                    onClick={() => handleSwitchMode('student')}
                    sx={{ fontWeight: 800, color: '#2563EB', fontSize: '0.82rem' }}
                  >
                    विद्यार्थी पोर्टल (Student) →
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                size="small"
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => handleSwitchMode('admin')}
                sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.82rem' }}
              >
                ← मुख्य प्रशासनिक लगइनमा फर्कनुहोस् (Back to Admin Login)
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
