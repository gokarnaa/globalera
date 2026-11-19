import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import FacebookIcon from '@mui/icons-material/Facebook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { loadDB, saveDB } from '../../services/storage';
import {
  getBotSettings,
  saveBotSettings,
  fetchRemoteBotSettings,
  testGeminiConnection,
  resolveBotMode
} from '../../services/whatsappCloudApi';

export default function ChannelsSettingsPanel({ onSaveSuccess }) {
  const [botCfg, setBotCfg] = useState(() => getBotSettings());
  const [smsToken, setSmsToken] = useState(() => loadDB().settings?.aakashSmsToken || '');
  const [savingBot, setSavingBot] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [botAlert, setBotAlert] = useState(null);

  const [savingSms, setSavingSms] = useState(false);
  const [checkingCredit, setCheckingCredit] = useState(false);
  const [smsAlert, setSmsAlert] = useState(null);

  useEffect(() => {
    let active = true;
    fetchRemoteBotSettings()
      .then((remote) => {
        if (active && remote) setBotCfg(remote);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeMode = resolveBotMode(botCfg);

  const handleModeChange = (_, nextMode) => {
    if (!nextMode) return;
    setBotCfg((prev) => ({
      ...prev,
      replyMode: nextMode,
      autoBotEnabled: nextMode !== 'manual',
      aiCounselorEnabled: nextMode === 'ai'
    }));
  };

  const handleSaveChannels = async () => {
    setSavingBot(true);
    setBotAlert(null);
    try {
      const saved = await saveBotSettings(botCfg);
      setBotCfg(saved);
      setBotAlert({
        severity: 'success',
        text: saved.syncedRemote
          ? 'WhatsApp, Gemini AI & Facebook channel settings saved and synced to Supabase!'
          : 'Saved locally (Supabase sync unavailable).'
      });
      onSaveSuccess?.();
    } catch (err) {
      setBotAlert({ severity: 'error', text: err?.message || 'Failed to save channel settings.' });
    } finally {
      setSavingBot(false);
    }
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setBotAlert(null);
    try {
      const res = await testGeminiConnection(botCfg.geminiApiKey);
      setBotAlert({
        severity: 'success',
        text: `Gemini AI Counselor connected successfully (${res.model})!`
      });
    } catch (err) {
      setBotAlert({ severity: 'error', text: `AI test failed: ${err?.message || 'Unknown error'}` });
    } finally {
      setTestingAi(false);
    }
  };

  const handleSaveSms = () => {
    setSavingSms(true);
    setSmsAlert(null);
    try {
      const db = loadDB();
      saveDB({
        ...db,
        settings: {
          ...(db.settings || {}),
          aakashSmsToken: smsToken.trim()
        }
      });
      setSmsAlert({ severity: 'success', text: 'Aakash SMS Auth Token saved and synced!' });
      onSaveSuccess?.();
    } catch (err) {
      setSmsAlert({ severity: 'error', text: err?.message || 'Failed to save SMS token.' });
    } finally {
      setSavingSms(false);
    }
  };

  const handleCheckCredit = async () => {
    setCheckingCredit(true);
    setSmsAlert(null);
    try {
      const res = await fetch('/api/aakash-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'credit',
          ...(smsToken.trim() ? { token: smsToken.trim() } : {})
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Credit check failed');
      }
      setSmsAlert({
        severity: 'success',
        text: `Aakash SMS Connected! Available Credit: ${data.available_credit ?? '-'} • Total Sent: ${data.total_sms_sent ?? 0}`
      });
    } catch (err) {
      setSmsAlert({ severity: 'error', text: err?.message || 'Could not check Aakash SMS credit.' });
    } finally {
      setCheckingCredit(false);
    }
  };

  return (
    <Grid container spacing={2.5}>
      {/* 1. WhatsApp & Gemini AI Counselor */}
      <Grid item xs={12} md={7}>
        <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <WhatsAppIcon sx={{ color: '#16A34A', fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  WhatsApp, Gemini AI &amp; Facebook Omnichannel
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Centralized auto-reply mode, AI Counselor API key &amp; Facebook Page connection
                </Typography>
              </Box>
            </Stack>
            <Chip
              size="small"
              icon={<CheckCircleIcon />}
              label={`Active: ${activeMode.toUpperCase()}`}
              color={activeMode === 'ai' ? 'primary' : activeMode === 'bot' ? 'success' : 'warning'}
              sx={{ fontWeight: 800 }}
            />
          </Box>

          {botAlert && (
            <Alert severity={botAlert.severity} onClose={() => setBotAlert(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {botAlert.text}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.75, textTransform: 'uppercase' }}>
              Global Auto-Reply Mode
            </Typography>
            <ToggleButtonGroup size="small" exclusive value={activeMode} onChange={handleModeChange} fullWidth>
              <ToggleButton value="ai" sx={{ fontWeight: 800, textTransform: 'none', gap: 0.5 }}>
                <AutoAwesomeIcon fontSize="small" /> AI Counselor Mode
              </ToggleButton>
              <ToggleButton value="bot" sx={{ fontWeight: 800, textTransform: 'none', gap: 0.5 }}>
                <SmartToyIcon fontSize="small" /> Keyword Bot Mode
              </ToggleButton>
              <ToggleButton value="manual" sx={{ fontWeight: 800, textTransform: 'none', gap: 0.5 }}>
                <PersonIcon fontSize="small" /> Manual Only
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Stack spacing={1.5}>
            <TextField
              size="small"
              fullWidth
              label="Gemini AI API Key"
              type="password"
              value={botCfg.geminiApiKey || ''}
              onChange={(e) => setBotCfg((p) => ({ ...p, geminiApiKey: e.target.value }))}
              placeholder="Paste Gemini API key..."
            />
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              label="Custom AI Counselor Instructions (Optional Override)"
              value={botCfg.aiInstructions || ''}
              onChange={(e) => setBotCfg((p) => ({ ...p, aiInstructions: e.target.value }))}
              placeholder="Leave blank to use default Prabidhik School Master Prompt..."
            />

            <Divider sx={{ my: 0.5 }} />

            <Stack direction="row" spacing={1} alignItems="center">
              <FacebookIcon sx={{ color: '#1877F2', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Facebook Messenger &amp; Page Comments
              </Typography>
            </Stack>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={5}>
                <TextField
                  size="small"
                  fullWidth
                  label="Facebook Page ID"
                  value={botCfg.fbPageId || ''}
                  onChange={(e) => setBotCfg((p) => ({ ...p, fbPageId: e.target.value }))}
                  placeholder="104880039369032"
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  label="Facebook Page Access Token"
                  value={botCfg.fbPageAccessToken || ''}
                  onChange={(e) => setBotCfg((p) => ({ ...p, fbPageAccessToken: e.target.value }))}
                  placeholder="EAA..."
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={botCfg.fbAutoCommentReply !== false}
                  onChange={(e) => setBotCfg((p) => ({ ...p, fbAutoCommentReply: e.target.checked }))}
                />
              }
              label={<Typography variant="body2" fontWeight={700}>Auto-reply to Facebook Page Comments</Typography>}
            />

            <Stack direction="row" spacing={1.25} sx={{ pt: 0.5 }}>
              <Button
                variant="contained"
                startIcon={savingBot ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={savingBot}
                onClick={handleSaveChannels}
                sx={{ fontWeight: 800, bgcolor: '#0F2C59', '&:hover': { bgcolor: '#1E3A8A' } }}
              >
                Save Channel Settings
              </Button>
              <Button
                variant="outlined"
                startIcon={testingAi ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                disabled={testingAi}
                onClick={handleTestAi}
                sx={{ fontWeight: 700 }}
              >
                Test Gemini AI
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Grid>

      {/* 2. Aakash SMS Gateway */}
      <Grid item xs={12} md={5}>
        <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
            <SmsIcon sx={{ color: '#0284C7', fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Aakash SMS Gateway (Nepal)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Direct NTC / Ncell SMS for Fee Reminders, Notices &amp; Direct Chat
              </Typography>
            </Box>
          </Stack>

          {smsAlert && (
            <Alert severity={smsAlert.severity} onClose={() => setSmsAlert(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {smsAlert.text}
            </Alert>
          )}

          <Stack spacing={1.75}>
            <TextField
              size="small"
              fullWidth
              type="password"
              label="Aakash SMS Auth Token"
              value={smsToken}
              onChange={(e) => setSmsToken(e.target.value)}
              placeholder="Paste token from sms.aakashsms.com..."
              helperText="Synced securely with Supabase & Vercel /api/aakash-sms proxy."
            />

            <Stack direction="row" spacing={1.25}>
              <Button
                variant="contained"
                startIcon={savingSms ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={savingSms}
                onClick={handleSaveSms}
                sx={{ fontWeight: 800, bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' } }}
              >
                Save SMS Token
              </Button>
              <Button
                variant="outlined"
                disabled={checkingCredit}
                onClick={handleCheckCredit}
                sx={{ fontWeight: 700 }}
              >
                {checkingCredit ? 'Checking...' : 'Check Live Credit'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
