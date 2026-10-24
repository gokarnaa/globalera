import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  IconButton,
  Alert,
  Avatar,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import KeyIcon from '@mui/icons-material/Key';
import SchoolIcon from '@mui/icons-material/School';
import DialpadIcon from '@mui/icons-material/Dialpad';
import { useAuth } from '../../context/AuthContext';

export default function PinLockDialog({ open, onClose }) {
  const { loginWithPin, loginWithPhonePin, currentUser } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Phone + PIN form
  const [phone, setPhone] = useState('');
  const [studentPin, setStudentPin] = useState('');

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError('');
      if (next.length === 4) {
        submitPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const submitPin = (pinToSubmit) => {
    const res = loginWithPin(pinToSubmit);
    if (res.success) {
      setPin('');
      setError('');
      if (onClose) onClose();
    } else {
      setError(res.message || 'Invalid PIN code. Try again.');
      setPin('');
    }
  };

  const handlePhoneLogin = (e) => {
    e.preventDefault();
    if (!phone) {
      setError('कृपया फोन नम्बर प्रविष्ट गर्नुहोस्।');
      return;
    }
    const res = loginWithPhonePin(phone, studentPin || '1234');
    if (res.success) {
      setError('');
      setPhone('');
      setStudentPin('');
      if (onClose) onClose();
    } else {
      setError(res.message || 'फोन वा पिन मिलेन।');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: { xs: 1, sm: 2 },
          bgcolor: '#ffffff',
          boxShadow: '0 20px 60px rgba(10,30,60,0.25)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <DialogContent sx={{ textAlign: 'center', pt: 0, pb: 3 }}>
        <Avatar
          sx={{
            bgcolor: tabIndex === 0 ? '#1a56b0' : '#0d9488',
            width: 58,
            height: 58,
            mx: 'auto',
            mb: 1.5,
            boxShadow: '0 8px 20px rgba(26,86,176,0.3)'
          }}
        >
          {tabIndex === 0 ? <LockOpenIcon fontSize="large" /> : <SchoolIcon fontSize="large" />}
        </Avatar>

        <Typography variant="h6" sx={{ fontWeight: 800, color: '#152238' }}>
          {tabIndex === 0 ? '4-Digit Quick PIN Login' : 'विद्यार्थी / रोजगारदाता लगइन'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
          {tabIndex === 0
            ? 'इन्स्टिच्युट वा आफ्नो ट्रेनर PIN प्रविष्ट गर्नुहोस्'
            : 'फोन नम्बर र ४-अङ्कको पिन मार्फत लगइन गर्नुहोस्'}
        </Typography>

        <Tabs
          value={tabIndex}
          onChange={(_, v) => {
            setTabIndex(v);
            setError('');
          }}
          variant="fullWidth"
          sx={{ mb: 2.5, bgcolor: '#f8fafc', borderRadius: 2, p: 0.5 }}
        >
          <Tab
            icon={<DialpadIcon />}
            iconPosition="start"
            label="Quick PIN"
            sx={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'none' }}
          />
          <Tab
            icon={<PhoneIcon />}
            iconPosition="start"
            label="फोन + PIN"
            sx={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'none' }}
          />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
            {error}
          </Alert>
        )}

        {/* Tab 0: Quick 4-Digit Keypad */}
        {tabIndex === 0 && (
          <Box>
            {/* 4 Circles / Dots */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <Box
                    key={index}
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: isFilled ? '#1a56b0' : '#cbd5e1',
                      bgcolor: isFilled ? '#1a56b0' : '#f8fafd',
                      transition: 'all 0.15s ease',
                      transform: isFilled ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                );
              })}
            </Box>

            {/* Touch Keypad */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
                maxWidth: 280,
                mx: 'auto'
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outlined"
                  onClick={() => handleDigit(String(num))}
                  sx={{
                    height: 54,
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    borderColor: '#e2e8f0',
                    color: '#152238',
                    bgcolor: '#f8fbff',
                    '&:hover': { bgcolor: '#eef4fd', borderColor: '#1a56b0' },
                    '&:active': { transform: 'scale(0.95)' }
                  }}
                >
                  {num}
                </Button>
              ))}

              <Button
                variant="text"
                onClick={handleClear}
                sx={{ height: 54, fontWeight: 700, color: '#d5372f', fontSize: '0.9rem' }}
              >
                Clear
              </Button>

              <Button
                variant="outlined"
                onClick={() => handleDigit('0')}
                sx={{
                  height: 54,
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  borderColor: '#e2e8f0',
                  color: '#152238',
                  bgcolor: '#f8fbff',
                  '&:hover': { bgcolor: '#eef4fd', borderColor: '#1a56b0' }
                }}
              >
                0
              </Button>

              <Button variant="text" onClick={handleBackspace} sx={{ height: 54, color: '#647089' }}>
                <BackspaceIcon />
              </Button>
            </Box>

            {/* Helper Quick Chips */}
            <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #f1f5f9' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1, fontWeight: 700 }}>
                QUICK DEMO CODES:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.8 }}>
                <Chip label="Admin: 1111" size="small" onClick={() => submitPin('1111')} sx={{ cursor: 'pointer', bgcolor: '#e8f0fd', color: '#1a56b0' }} />
                <Chip label="Trainer: 1234" size="small" onClick={() => submitPin('1234')} sx={{ cursor: 'pointer', bgcolor: '#e5f8ee', color: '#16834b' }} />
                <Chip label="Student: 3333" size="small" onClick={() => submitPin('3333')} sx={{ cursor: 'pointer', bgcolor: '#e0f2fe', color: '#0369a1' }} />
                <Chip label="Employer: 4444" size="small" onClick={() => submitPin('4444')} sx={{ cursor: 'pointer', bgcolor: '#f3e8ff', color: '#7e22ce' }} />
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 1: Phone + PIN Form */}
        {tabIndex === 1 && (
          <Box component="form" onSubmit={handlePhoneLogin} sx={{ maxWidth: 300, mx: 'auto', mt: 1 }}>
            <TextField
              label="फोन नम्बर (Mobile Number)"
              fullWidth
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9841234567"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#647089', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="४-अङ्कको PIN (Default: 1234)"
              fullWidth
              type="password"
              value={studentPin}
              onChange={(e) => setStudentPin(e.target.value)}
              placeholder="1234"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ color: '#647089', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2.5 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                bgcolor: '#0d9488',
                fontWeight: 800,
                py: 1.3,
                borderRadius: 2.5,
                '&:hover': { bgcolor: '#0f766e' }
              }}
            >
              लगइन गर्नुहोस् (Login)
            </Button>

            <Box sx={{ mt: 2.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                💡 <b>विद्यार्थी नमूना:</b> 9841000001 (पिन: 1234)
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 0.5 }}>
                🏢 <b>रोजगारदाता नमूना:</b> 9841889900 (पिन: 1234)
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
