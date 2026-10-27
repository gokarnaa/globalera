import React, { useState } from 'react';
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
  Divider,
  Paper,
  Grid
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../../context/AuthContext';
import { loadDB } from '../../services/storage';

export default function UnifiedLoginScreen({ onLoginSuccess }) {
  const { login } = useAuth();
  const db = loadDB();
  const company = db.settings?.companyProfile || {};

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!identifier) {
      setError('कृपया आफ्नो फोन नम्बर वा युजरनेम प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (!pin) {
      setError('कृपया आफ्नो ४-अङ्कको पिन प्रविष्ट गर्नुहोस्।');
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
        setError(res.message || 'लगइन असफल भयो। विवरण जाँच गर्नुहोस्।');
      }
    }, 250);
  };

  const handleQuickLogin = (quickId, quickPin) => {
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
        background: 'linear-gradient(135deg, #0b2545 0%, #133e68 50%, #081a30 100%)',
        p: { xs: 2, sm: 3 }
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 4,
          boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          bgcolor: '#FFFFFF'
        }}
      >
        {/* Institutional Header Banner */}
        <Box
          sx={{
            bgcolor: '#0F2E5A',
            color: '#FFFFFF',
            p: 3,
            textAlign: 'center',
            position: 'relative',
            borderBottom: '3px solid #F59E0B'
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'rgba(255,255,255,0.12)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
              border: '2px solid #F59E0B'
            }}
          >
            <SchoolIcon sx={{ fontSize: 36, color: '#F59E0B' }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.2 }}>
            {company.companyNameEnglish || 'GLOBAL ERA TECHNICAL SCHOOL'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mt: 0.5, fontWeight: 600 }}>
            {company.companyNameNepali || 'ग्लोबल एरा प्राविधिक स्कुल'} • CTEVT Code: {company.ctevtCode || '4208'}
          </Typography>
          <Chip
            label="एकीकृत लगइन पोर्टल (Unified TVET Access)"
            size="small"
            sx={{
              mt: 1.5,
              bgcolor: 'rgba(245, 158, 11, 0.2)',
              color: '#FCD34D',
              fontWeight: 800,
              border: '1px solid rgba(245, 158, 11, 0.4)'
            }}
          />
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 600 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.8, display: 'block' }}>
                  मोबाइल नम्बर / युजरनेम (Phone Number or Username):
                </Typography>
                <TextField
                  fullWidth
                  placeholder="उदा: 9841234567 वा admin वा tgid"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError('');
                  }}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIphoneIcon sx={{ color: '#0F2E5A' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ bgcolor: '#F8FAFC' }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.8, display: 'block' }}>
                  ४-अङ्कको पिन / पासवर्ड (4-Digit Access PIN):
                </Typography>
                <TextField
                  fullWidth
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#0F2E5A' }} />
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
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{
                  py: 1.4,
                  bgcolor: '#0F2E5A',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1rem',
                  borderRadius: 2.5,
                  boxShadow: '0 4px 12px rgba(15, 46, 90, 0.3)',
                  '&:hover': {
                    bgcolor: '#133E68'
                  }
                }}
              >
                {loading ? 'प्रमाणीकरण हुँदैछ...' : 'लगइन गर्नुहोस् (Sign In to Portal)'}
              </Button>
            </Stack>
          </form>

          {/* Quick 1-Click Access for Demo / Rapid Testing */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, display: 'block', mb: 1.5, textAlign: 'center' }}>
              द्रुत परीक्षण लगइन (Quick 1-Click Access for Testing):
            </Typography>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Paper
                  variant="outlined"
                  onClick={() => handleQuickLogin('pooja', '1234')}
                  sx={{
                    p: 1.2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderColor: '#10B981',
                    bgcolor: '#F0FDF4',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#DCFCE7', transform: 'translateY(-2px)' }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#047857', display: 'block' }}>
                    👨‍🏫 प्रशिक्षक (Trainer)
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#065F46', display: 'block' }}>
                    Pooja (PIN: 1234)
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper
                  variant="outlined"
                  onClick={() => handleQuickLogin('gets-2026-std01', '1234')}
                  sx={{
                    p: 1.2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderColor: '#3B82F6',
                    bgcolor: '#EFF6FF',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#DBEAFE', transform: 'translateY(-2px)' }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#1D4ED8', display: 'block' }}>
                    🎓 विद्यार्थी (Student)
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#1E40AF', display: 'block' }}>
                    Trainee (PIN: 1234)
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper
                  variant="outlined"
                  onClick={() => handleQuickLogin('admin', '1111')}
                  sx={{
                    p: 1.2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderColor: '#0F2E5A',
                    bgcolor: '#F8FAFC',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F1F5F9', transform: 'translateY(-2px)' }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block' }}>
                    🛡️ सुपर एडमिन (Admin)
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#475569', display: 'block' }}>
                    Admin (PIN: 1111)
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper
                  variant="outlined"
                  onClick={() => handleQuickLogin('staff', '2222')}
                  sx={{
                    p: 1.2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderColor: '#F59E0B',
                    bgcolor: '#FFFBEB',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#FEF3C7', transform: 'translateY(-2px)' }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#B45309', display: 'block' }}>
                    📋 फ्रन्ट डेस्क (Staff)
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#92400E', display: 'block' }}>
                    Staff (PIN: 2222)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
              🔒 सुरक्षित TVET प्रमाणीकरण • Global Era Technical School
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
