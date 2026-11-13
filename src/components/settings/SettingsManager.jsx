import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Grid,
  Alert,
  Divider,
  Paper,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  MenuItem
} from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SmsIcon from '@mui/icons-material/Sms';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BusinessIcon from '@mui/icons-material/Business';
import ShieldIcon from '@mui/icons-material/Shield';
import BoltIcon from '@mui/icons-material/Bolt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CertificateStudioManager from './CertificateStudioManager';
import CompanyProfileSettings from './CompanyProfileSettings';
import { loadDB, saveDB, resetDB, loadSimulationDB, syncWithCloud } from '../../services/storage';
import {
  generateSupabaseSQLSchema,
  generateSupabaseSecurityHardeningSQL,
  testSupabaseConnection,
  pushLocalDBToSupabase,
  pullRemoteDBFromSupabase
} from '../../services/supabaseClient';
import { exportGoogleContactsVCF } from '../../services/exportUtils';
import { executeGraphQL, GRAPHQL_QUERIES } from '../../services/graphqlClient';
import {
  sendMetaWhatsAppMessage,
  getWhatsAppSettings,
  saveWhatsAppSettings
} from '../../services/whatsappCloudApi';

export default function SettingsManager() {
  const [db, setDb] = useState(loadDB());
  const [settings, setSettings] = useState(db.settings || {});
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedSecuritySql, setCopiedSecuritySql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showKey, setShowKey] = useState(false);

  // Supabase test and sync state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // GraphQL API Playground State
  const [gqlQuery, setGqlQuery] = useState(GRAPHQL_QUERIES.GET_STUDENT_DOSSIER);
  const [gqlVariables, setGqlVariables] = useState('{\n  "studentId": "STD-001"\n}');
  const [gqlResponse, setGqlResponse] = useState(null);
  const [gqlExecuting, setGqlExecuting] = useState(false);
  const [gqlExecutionStats, setGqlExecutionStats] = useState(null);

  // Meta WhatsApp Cloud API State
  const [waSettings, setWaSettings] = useState(getWhatsAppSettings);

  // Biometric & Gate Hardware Settings State
  const [bioConfig, setBioConfig] = useState(() => ({
    enabled: true,
    connectionMode: 'ADMS_CLOUD',
    deviceName: 'Global Era Biometric Terminal (ADMS)',
    deviceIp: '192.168.1.201',
    devicePort: 4370,
    serialNo: 'ZK-GE-2026-8891',
    cloudPushUrl: 'https://globalera.com.np/api/iclock/cdata',
    lateGraceMinutes: 15,
    allowTrainerManualOverride: true,
    autoSmsOnAbsent: true,
    ...(db.settings?.biometricSettings || {})
  }));
  const [copiedAdmsUrl, setCopiedAdmsUrl] = useState(false);

  const handleSaveBiometricConfig = () => {
    const latest = loadDB();
    const updated = {
      ...latest,
      settings: {
        ...(latest.settings || {}),
        biometricSettings: {
          ...(latest.settings?.biometricSettings || {}),
          ...bioConfig,
          devicePort: Number(bioConfig.devicePort) || 4370,
          lateGraceMinutes: Number(bioConfig.lateGraceMinutes) || 15
        }
      }
    };
    saveDB(updated);
    setDb(updated);
    setSettings(updated.settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };
  const [waTestPhone, setWaTestPhone] = useState('9851000000');
  const [waSending, setWaSending] = useState(false);
  const [waSendResult, setWaSendResult] = useState(null);
  const [copiedWaSql, setCopiedWaSql] = useState(false);

  const handleSaveWhatsApp = () => {
    saveWhatsAppSettings(waSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestWhatsApp = async () => {
    setWaSending(true);
    setWaSendResult(null);
    try {
      const res = await sendMetaWhatsAppMessage({
        to: waTestPhone,
        type: 'text',
        text: '🌟 Welcome to Global Era Technical School! Your Meta WhatsApp Business Cloud API is connected and working perfectly with our TVET ERP.'
      });
      setWaSendResult({ ok: true, message: `Message sent successfully! Recipient: ${res.recipient}, Meta Message ID: ${res.messageId}` });
    } catch (err) {
      setWaSendResult({ ok: false, message: err.message });
    } finally {
      setWaSending(false);
    }
  };

  const handleCopyWaSql = () => {
    const sql = `-- ==============================================================================
-- GLOBAL ERA TECHNICAL SCHOOL: SUPABASE WHATSAPP CLOUD API & WEBHOOK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    phone TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'outbound',
    message_type TEXT NOT NULL DEFAULT 'text',
    status TEXT NOT NULL DEFAULT 'sent',
    content TEXT,
    meta_message_id TEXT
);
CREATE TABLE IF NOT EXISTS public.whatsapp_inbound_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_phone TEXT NOT NULL,
    sender_name TEXT,
    message_text TEXT,
    meta_message_id TEXT UNIQUE,
    bot_reply_sent TEXT,
    lead_id TEXT
);
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_inbound_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access to whatsapp_logs" ON public.whatsapp_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access to whatsapp_inbound_events" ON public.whatsapp_inbound_events FOR ALL TO authenticated USING (true);`;
    navigator.clipboard.writeText(sql);
    setCopiedWaSql(true);
    setTimeout(() => setCopiedWaSql(false), 3000);
  };

  const handleRunGraphQL = async () => {
    setGqlExecuting(true);
    setGqlResponse(null);
    const start = performance.now();
    try {
      let parsedVars = {};
      if (gqlVariables.trim()) {
        try {
          parsedVars = JSON.parse(gqlVariables);
        } catch (e) {
          setGqlResponse({ error: `Invalid Variables JSON: ${e.message}` });
          setGqlExecuting(false);
          return;
        }
      }
      const res = await executeGraphQL(gqlQuery, parsedVars);
      const durationMs = (performance.now() - start).toFixed(1);
      setGqlExecutionStats({
        durationMs,
        source: res.source === 'supabase_pg_graphql' ? 'Supabase pg_graphql (Cloud Network)' : 'Local-First Engine (Zero-Latency Offline)'
      });
      setGqlResponse(res.data);
    } catch (err) {
      setGqlResponse({ error: err.message });
    } finally {
      setGqlExecuting(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const url = (settings.supabaseUrl || '').trim();
      const key = (settings.supabaseAnonKey || '').trim();

      if (!url || !key) {
        setTestResult({
          ok: false,
          message: 'Please enter your Supabase Project URL and Anon Public Key.'
        });
        return;
      }

      const res = await testSupabaseConnection(url, key);
      setTestResult(res);

      if (res.ok) {
        // Automatically save verified credentials so top Navbar and entire system connect instantly
        const freshDb = loadDB();
        const nextDb = {
          ...freshDb,
          settings: {
            ...(freshDb.settings || {}),
            supabaseUrl: url,
            supabaseAnonKey: key
          }
        };
        saveDB(nextDb);
        setDb(nextDb);
        setSettings(nextDb.settings);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setSyncingData(true);
    setSyncResult(null);
    try {
      const counts = await pushLocalDBToSupabase(db);
      setSyncResult({ ok: true, counts });
    } catch (err) {
      setSyncResult({ ok: false, message: err.message });
    } finally {
      setSyncingData(false);
    }
  };

  const [pullingData, setPullingData] = useState(false);
  const [pullResult, setPullResult] = useState(null);

  const handlePullFromSupabase = async () => {
    setPullingData(true);
    setPullResult(null);
    try {
      const res = await syncWithCloud(false);
      if (res.ok) {
        setDb(loadDB());
        setPullResult({ ok: true, message: 'Successfully pulled latest records from Supabase Cloud!' });
      } else {
        setPullResult({ ok: false, message: res.message || 'Could not fetch records. Please verify table migration.' });
      }
    } catch (err) {
      setPullResult({ ok: false, message: err.message });
    } finally {
      setPullingData(false);
    }
  };

  const handleSaveSettings = () => {
    const freshDb = loadDB();
    const nextDb = {
      ...freshDb,
      settings: {
        ...(freshDb.settings || {}),
        ...settings,
        supabaseUrl: (settings.supabaseUrl || '').trim(),
        supabaseAnonKey: (settings.supabaseAnonKey || '').trim()
      }
    };
    saveDB(nextDb);
    setDb(nextDb);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSQLSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const sql = generateSupabaseSQLSchema();
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kite_tvet_supabase_migration.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySecuritySql = () => {
    const sql = generateSupabaseSecurityHardeningSQL();
    navigator.clipboard.writeText(sql);
    setCopiedSecuritySql(true);
    setTimeout(() => setCopiedSecuritySql(false), 3000);
  };

  const handleDownloadSecuritySql = () => {
    const sql = generateSupabaseSecurityHardeningSQL();
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase_security_hardening.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportContacts = () => {
    exportGoogleContactsVCF(db.students, db.employers);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all sample data back to initial seed data?')) {
      const fresh = resetDB();
      setDb(fresh);
      setSettings(fresh.settings);
      alert('Data reset successfully.');
    }
  };

  const handleLoadSimulation = () => {
    if (window.confirm('Load 100+ realistic trainees simulation dataset with complete admissions, accounting vouchers, batches, attendances & CRM leads?')) {
      const data = loadSimulationDB();
      setDb(data);
      alert(`Simulation data loaded successfully! Enrolled ${data.students?.length} trainees across ${data.trainingGroups?.length} batches with ${data.admissions?.length} admission agreements and ${data.payments?.length} vouchers.`);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SettingsIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
            Settings & Cloud Integration
          </Typography>
          <Typography variant="body2" sx={{ color: '#647089' }}>
            Supabase PostgreSQL Connection, Aakash SMS Gateway, WhatsApp, and Google Contacts.
          </Typography>
        </Box>
      </Box>

      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
          Settings successfully saved!
        </Alert>
      )}

      {/* Settings Navigation Tabs */}
      <Paper elevation={0} sx={{ p: 0.5, mb: 3, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, next) => setActiveTab(next)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.88rem',
              textTransform: 'none',
              minHeight: 46,
              borderRadius: 1.5
            },
            '& .Mui-selected': {
              color: '#0F2E5A !important'
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#0F2E5A',
              height: 3,
              borderRadius: 3
            }
          }}
        >
          <Tab
            icon={<BusinessIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="Company Profile & Numbering"
          />
          <Tab
            icon={<WorkspacePremiumIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="Certificate Studio & Templates"
          />
          <Tab
            icon={<CloudUploadIcon sx={{ mr: 1, fontSize: 20 }} />}
            iconPosition="start"
            label="Cloud & System Integrations"
          />
          <Tab
            icon={<BoltIcon sx={{ mr: 1, fontSize: 20, color: '#D97706' }} />}
            iconPosition="start"
            label="GraphQL API Studio"
          />
          <Tab
            icon={<FingerprintIcon sx={{ mr: 1, fontSize: 20, color: '#059669' }} />}
            iconPosition="start"
            label="Biometric & Gate Hardware"
          />
        </Tabs>
      </Paper>

      {/* TAB 0: COMPANY PROFILE & CERTIFICATE NUMBERING */}
      {activeTab === 0 && <CompanyProfileSettings onSaveSuccess={() => setDb(loadDB())} />}

      {/* TAB 1: CERTIFICATE STUDIO & TEMPLATE DESIGNER */}
      {activeTab === 1 && <CertificateStudioManager onSaveSuccess={() => setDb(loadDB())} />}

      {/* TAB 2: CLOUD & INTEGRATION SETTINGS */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
        {/* 1. Supabase PostgreSQL Card */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <CloudUploadIcon sx={{ color: '#1a56b0', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Supabase Cloud Database
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
              Connect your live Supabase project to sync this local system with Postgres Cloud.
            </Typography>

            {(!settings.supabaseUrl || !settings.supabaseAnonKey) ? (
              <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Cloud Sync is in Local Storage Mode (Offline)
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  Please paste your <b>Supabase Project URL</b> and <b>Anon Public API Key</b> below to activate cross-browser cloud sync.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  Target Project: <b>{settings.supabaseUrl.replace(/^https?:\/\//, '').split('/')[0]}</b>. Click <b>Test Connection</b> to check live status.
                </Typography>
              </Alert>
            )}

            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Supabase Project URL"
                fullWidth
                placeholder="https://yourprojectid.supabase.co"
                value={settings.supabaseUrl || ''}
                onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value.trim() })}
                helperText="Found under Project Settings -> API -> Project URL at supabase.com"
              />
              <TextField
                label="Supabase Anon Public API Key"
                fullWidth
                type={showKey ? 'text' : 'password'}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={settings.supabaseAnonKey || ''}
                onChange={(e) => setSettings({ ...settings, supabaseAnonKey: e.target.value.trim() })}
                helperText="Found under Project Settings -> API -> Project API Keys (anon public)"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowKey(!showKey)}
                        edge="end"
                      >
                        {showKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Stack>

            <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
                Complete Multi-Tenant Relational PostgreSQL Schema (36 Tables)
              </Typography>
              <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                Includes all 8 related table sections: Organizations, Users, Courses & Syllabi, CTEVT Work & Lesson Plans, Trainees & Biometrics, CRM Leads & Admissions, Double-Entry Accounting & Payroll, and Industry Placements.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopySql}
                  sx={{ fontWeight: 700 }}
                >
                  {copiedSql ? '✓ Copied SQL to Clipboard!' : 'Copy Complete SQL Schema'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadSql}
                  sx={{ fontWeight: 700 }}
                >
                  Download supabase_schema.sql
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={<ShieldIcon />}
                  onClick={handleCopySecuritySql}
                  sx={{ fontWeight: 800 }}
                >
                  {copiedSecuritySql ? '✓ Copied RLS Hardening SQL!' : 'Copy RLS Security Lockdown SQL'}
                </Button>
              </Box>

              <Alert severity="info" sx={{ py: 0.5, fontSize: '0.78rem', bgcolor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                <strong>How to setup Supabase:</strong> Open your Supabase Dashboard &rarr; <b>SQL Editor</b> &rarr; New Query &rarr; Paste the schema &rarr; Click <b>Run</b>. Then click <b>Copy RLS Security Lockdown SQL</b> to protect financial accounts and student privacy!
              </Alert>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={testingConnection}
                startIcon={testingConnection ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                sx={{ fontWeight: 700 }}
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                sx={{ fontWeight: 700, bgcolor: '#1a56b0' }}
              >
                Save Cloud Configuration
              </Button>
            </Stack>

            {testResult && (
              <Alert
                severity={testResult.ok ? 'success' : 'error'}
                icon={testResult.ok ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                sx={{ mb: 2, borderRadius: 2, fontWeight: 600, fontSize: '0.85rem' }}
              >
                {testResult.message}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ bgcolor: '#eff6ff', p: 2.5, borderRadius: 2.5, border: '1px solid #bfdbfe' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af', mb: 0.5 }}>
                Two-Way Multi-Browser Cloud Synchronization
              </Typography>
              <Typography variant="caption" sx={{ color: '#3b82f6', display: 'block', mb: 2 }}>
                Synchronize between your local browser cache and Supabase PostgreSQL. This ensures your data is permanently preserved and identical across different browsers and devices.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleSyncToSupabase}
                  disabled={syncingData}
                  startIcon={syncingData ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                  sx={{ fontWeight: 800, bgcolor: '#2563eb' }}
                >
                  {syncingData ? 'Pushing to Cloud...' : 'Push Local Data to Supabase'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handlePullFromSupabase}
                  disabled={pullingData}
                  startIcon={pullingData ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
                  sx={{ fontWeight: 800, color: '#1E40AF', borderColor: '#93C5FD' }}
                >
                  {pullingData ? 'Pulling from Cloud...' : 'Pull Cloud Data to Browser'}
                </Button>
              </Stack>

              {syncResult && (
                <Box sx={{ mt: 1.5 }}>
                  {syncResult.ok ? (
                    <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.82rem', fontWeight: 600 }}>
                      Data pushed successfully to Supabase! All 36 relational tables are synced with your cloud database.
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                      Push failed: {syncResult.message}. (Make sure you have run the migration SQL script in your Supabase SQL Editor first!)
                    </Alert>
                  )}
                </Box>
              )}

              {pullResult && (
                <Box sx={{ mt: 1.5 }}>
                  <Alert severity={pullResult.ok ? 'success' : 'error'} sx={{ borderRadius: 2, fontSize: '0.82rem', fontWeight: 600 }}>
                    {pullResult.message}
                  </Alert>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* 2. Communication & Automation */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <SmsIcon sx={{ color: '#16834b', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Aakash SMS & Automation
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#647089', mb: 2.5 }}>
              Automated notifications for daily absent alerts and welcome messages in Nepal.
            </Typography>

            <Stack spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Aakash SMS API Auth Token"
                fullWidth
                type="password"
                placeholder="Enter your Aakash SMS Token"
                value={settings.aakashSmsToken || ''}
                onChange={(e) => setSettings({ ...settings, aakashSmsToken: e.target.value })}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.enableAutoSmsOnAbsent)}
                    onChange={(e) => setSettings({ ...settings, enableAutoSmsOnAbsent: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Auto-send SMS to parents when student is Absent
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.enableWhatsAppDirect)}
                    onChange={(e) => setSettings({ ...settings, enableWhatsAppDirect: e.target.checked })}
                    color="success"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Enable 1-Click WhatsApp Quick Action Buttons
                  </Typography>
                }
              />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {/* Meta WhatsApp Cloud API & Supabase Webhook Section */}
            <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: 2.5, border: '1.5px solid #BBF7D0', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WhatsAppIcon sx={{ color: '#16A34A', fontSize: 24 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#14532D' }}>
                    Meta WhatsApp Business Cloud API
                  </Typography>
                </Box>
                <Chip
                  label="Meta Cloud Verified"
                  size="small"
                  sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.68rem', border: '1px solid #86EFAC' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 1.5 }}>
                Official automated messaging: Send brochures, fee receipts, and attendance warnings directly from your institute's WhatsApp.
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <TextField
                  label="Meta WhatsApp Cloud API Access Token"
                  fullWidth
                  size="small"
                  type="password"
                  value={waSettings.accessToken}
                  onChange={(e) => setWaSettings({ ...waSettings, accessToken: e.target.value })}
                  helperText="User Token: whatapp web hook (App ID: 2196399894585939)"
                />

                <TextField
                  label="WhatsApp Phone Number ID"
                  fullWidth
                  size="small"
                  placeholder="e.g. 105829384910293 (from Meta Developer API Setup)"
                  value={waSettings.phoneNumberId}
                  onChange={(e) => setWaSettings({ ...waSettings, phoneNumberId: e.target.value })}
                  helperText="Find in Meta Developers > WhatsApp > API Setup > Phone number ID"
                />

                <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px dashed #86EFAC' }}>
                  <Typography variant="caption" sx={{ color: '#334155', fontWeight: 800, display: 'block', mb: 0.5 }}>
                    SUPABASE 24/7 WHATSAPP WEBHOOK URL:
                  </Typography>
                  <code style={{ fontSize: '0.72rem', color: '#0F2E5A', wordBreak: 'break-all', display: 'block', mb: 0.5 }}>
                    {waSettings.webhookUrl}
                  </code>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Verify Token: <strong>{waSettings.verifyToken}</strong>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyWaSql}
                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    {copiedWaSql ? '✓ Copied SQL!' : 'Copy Supabase Webhook SQL'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveWhatsApp}
                    sx={{ bgcolor: '#16A34A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem', '&:hover': { bgcolor: '#15803D' } }}
                  >
                    Save WhatsApp Config
                  </Button>
                </Box>
              </Stack>

              {/* Test Live Message */}
              <Divider sx={{ my: 1.5, borderColor: '#DCFCE7' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#14532D', display: 'block', mb: 1 }}>
                TEST LIVE WHATSAPP MESSAGE:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Mobile (e.g. 9851000000)"
                  value={waTestPhone}
                  onChange={(e) => setWaTestPhone(e.target.value)}
                  sx={{ width: 170 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  disabled={waSending || !waSettings.phoneNumberId}
                  onClick={handleTestWhatsApp}
                  sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 800, fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                >
                  {waSending ? 'Sending...' : '⚡ Send Test WhatsApp'}
                </Button>
              </Stack>

              {waSendResult && (
                <Alert
                  severity={waSendResult.ok ? 'success' : 'error'}
                  sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 700, borderRadius: 1.5 }}
                >
                  {waSendResult.message}
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <ContactPhoneIcon sx={{ color: '#0288d1', fontSize: 26 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Google Contacts Mobile Sync
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
              Export all student and employer phone numbers into a single vCard file. Import to your Android or iPhone so incoming caller IDs show student names automatically.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportContacts}
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Export Contacts (.vcf)
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A', mb: 0.5 }}>
                ERP Simulation & Maintenance
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                Seed 100+ realistic trainee records across 8 batches, admissions, vouchers, and attendances for stress testing.
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<RocketLaunchIcon />}
                  onClick={handleLoadSimulation}
                  sx={{
                    fontWeight: 800,
                    bgcolor: '#0F2E5A',
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: '#1E40AF' }
                  }}
                >
                  Load 100+ Trainee Simulation Data
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<RestartAltIcon />}
                  onClick={handleResetData}
                  sx={{ fontWeight: 700 }}
                >
                  Reset Sample Database
                </Button>
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* TAB 3: GRAPHQL API STUDIO & PG_GRAPHQL ARCHITECTURE */}
      {activeTab === 3 && (
        <Box>
          {/* Executive Architecture Banner */}
          <Card
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3.5,
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F2E5A 100%)',
              color: '#FFFFFF',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <BoltIcon sx={{ color: '#F59E0B', fontSize: 30 }} />
                  <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '0.02em' }}>
                    GraphQL API Architecture &amp; Playground
                  </Typography>
                  <Chip
                    label="Hybrid Mode: Option A (pg_graphql + Local-First)"
                    size="small"
                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', fontWeight: 800, border: '1px solid #F59E0B' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 840, lineHeight: 1.6 }}>
                  High-efficiency relational queries for graduation dossiers, employer talent search, and illustrated course syllabi. Combines Supabase Postgres <code style={{ color: '#38BDF8' }}>pg_graphql</code> with zero-latency offline client fallback.
                </Typography>
              </Box>
              <Chip
                label="Single Endpoint: /graphql/v1"
                sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 900, px: 1 }}
              />
            </Box>
          </Card>

          <Grid container spacing={3}>
            {/* Left Panel: Query Presets & Editor */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #CBD5E1', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F2E5A', mb: 1 }}>
                  1. Ready Query Presets
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    size="small"
                    variant={gqlQuery === GRAPHQL_QUERIES.GET_STUDENT_DOSSIER ? 'contained' : 'outlined'}
                    onClick={() => {
                      setGqlQuery(GRAPHQL_QUERIES.GET_STUDENT_DOSSIER);
                      setGqlVariables('{\n  "studentId": "STD-001"\n}');
                    }}
                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                  >
                    🎓 Student Dossier
                  </Button>
                  <Button
                    size="small"
                    variant={gqlQuery === GRAPHQL_QUERIES.GET_EMPLOYER_TALENT_POOL ? 'contained' : 'outlined'}
                    onClick={() => {
                      setGqlQuery(GRAPHQL_QUERIES.GET_EMPLOYER_TALENT_POOL);
                      setGqlVariables('{\n  "minAttendance": 75\n}');
                    }}
                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                  >
                    🏢 Employer Talent Pool
                  </Button>
                  <Button
                    size="small"
                    variant={gqlQuery === GRAPHQL_QUERIES.GET_COURSE_SYLLABUS ? 'contained' : 'outlined'}
                    onClick={() => {
                      setGqlQuery(GRAPHQL_QUERIES.GET_COURSE_SYLLABUS);
                      setGqlVariables('{\n  "courseId": "CRS-01"\n}');
                    }}
                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                  >
                    📖 Illustrated Syllabus
                  </Button>
                </Stack>

                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>
                  GRAPHQL QUERY (DOCUMENT):
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={10}
                  maxRows={14}
                  value={gqlQuery}
                  onChange={(e) => setGqlQuery(e.target.value)}
                  sx={{
                    fontFamily: 'monospace',
                    mb: 2,
                    '& .MuiInputBase-input': {
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.8rem',
                      bgcolor: '#F8FAFC',
                      p: 1.5,
                      borderRadius: 1.5
                    }
                  }}
                />

                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>
                  QUERY VARIABLES (JSON):
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  value={gqlVariables}
                  onChange={(e) => setGqlVariables(e.target.value)}
                  sx={{
                    fontFamily: 'monospace',
                    mb: 2,
                    '& .MuiInputBase-input': {
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.82rem',
                      bgcolor: '#F8FAFC',
                      p: 1.2,
                      borderRadius: 1.5
                    }
                  }}
                />

                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={gqlExecuting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                    onClick={handleRunGraphQL}
                    disabled={gqlExecuting}
                    sx={{
                      bgcolor: '#0F2E5A',
                      fontWeight: 800,
                      px: 3,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#1E40AF' }
                    }}
                  >
                    {gqlExecuting ? 'Executing Query...' : 'Execute GraphQL Query'}
                  </Button>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Safe Execution • Zero Network Stall
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Right Panel: Execution Result & Benchmarking */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #CBD5E1', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                    2. Response JSON Output
                  </Typography>
                  {gqlExecutionStats && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`⚡ ${gqlExecutionStats.durationMs} ms`}
                        size="small"
                        sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 900 }}
                      />
                      <Chip
                        label={gqlExecutionStats.source}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800 }}
                      />
                    </Box>
                  )}
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    minHeight: 380,
                    maxHeight: 520,
                    overflow: 'auto',
                    p: 2,
                    bgcolor: '#0B1120',
                    color: '#38BDF8',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '0.82rem',
                    borderRadius: 2
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {gqlResponse ? JSON.stringify(gqlResponse, null, 2) : '// Click [Execute GraphQL Query] on the left to see live result...'}
                  </pre>
                </Paper>

                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.5 }}>
                    💡 How to Enable Native pg_graphql on Supabase SQL Editor:
                  </Typography>
                  <code style={{ fontSize: '0.74rem', color: '#0F2E5A', background: '#E2E8F0', padding: '3px 8px', borderRadius: 4, display: 'block' }}>
                    CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA extensions;
                  </code>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 4: BIOMETRIC & GATE HARDWARE SETTINGS */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FingerprintIcon sx={{ color: '#059669' }} /> Biometric Terminal & Gate Configuration
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Supports ADMS Cloud Push (ZKTeco / eSSL), Local LAN Bridge, and Web Gate Kiosk mode.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={bioConfig.enabled !== false}
                      onChange={(e) => setBioConfig({ ...bioConfig, enabled: e.target.checked })}
                      color="success"
                    />
                  }
                  label={<Typography variant="caption" sx={{ fontWeight: 800 }}>Active</Typography>}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Connection Mode"
                    value={bioConfig.connectionMode || 'ADMS_CLOUD'}
                    onChange={(e) => setBioConfig({ ...bioConfig, connectionMode: e.target.value })}
                  >
                    <MenuItem value="ADMS_CLOUD">ADMS Cloud Push (Recommended — Real-Time Direct to Cloud)</MenuItem>
                    <MenuItem value="LOCAL_BRIDGE">Local LAN Bridge (School Reception PC Agent)</MenuItem>
                    <MenuItem value="WEB_KIOSK">Web Gate Kiosk Only (No Physical Hardware Yet)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Device Name / Model"
                    value={bioConfig.deviceName || ''}
                    onChange={(e) => setBioConfig({ ...bioConfig, deviceName: e.target.value })}
                    placeholder="e.g. ZKTeco K40 Pro ADMS"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Device Serial Number"
                    value={bioConfig.serialNo || ''}
                    onChange={(e) => setBioConfig({ ...bioConfig, serialNo: e.target.value })}
                    placeholder="e.g. ZK-GE-2026-8891"
                  />
                </Grid>

                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Local Device IP (For LAN Bridge)"
                    value={bioConfig.deviceIp || ''}
                    onChange={(e) => setBioConfig({ ...bioConfig, deviceIp: e.target.value })}
                    placeholder="192.168.1.201"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="TCP Port"
                    value={bioConfig.devicePort || 4370}
                    onChange={(e) => setBioConfig({ ...bioConfig, devicePort: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ADMS Cloud Push Endpoint URL"
                    value={bioConfig.cloudPushUrl || 'https://globalera.com.np/api/iclock/cdata'}
                    onChange={(e) => setBioConfig({ ...bioConfig, cloudPushUrl: e.target.value })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard?.writeText(bioConfig.cloudPushUrl || 'https://globalera.com.np/api/iclock/cdata');
                              setCopiedAdmsUrl(true);
                              setTimeout(() => setCopiedAdmsUrl(false), 2000);
                            }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    helperText={copiedAdmsUrl ? 'Copied ADMS URL to clipboard!' : 'Enter this URL in your ADMS-enabled biometric device Cloud Server setting.'}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A', mb: 1.5 }}>
                Shift A–F Attendance & Notification Rules
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Late Grace Minutes"
                    value={bioConfig.lateGraceMinutes ?? 15}
                    onChange={(e) => setBioConfig({ ...bioConfig, lateGraceMinutes: e.target.value })}
                    helperText="Minutes after Shift A–F start"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bioConfig.allowTrainerManualOverride !== false}
                        onChange={(e) => setBioConfig({ ...bioConfig, allowTrainerManualOverride: e.target.checked })}
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Allow Trainer Override</Typography>}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bioConfig.autoSmsOnAbsent !== false}
                        onChange={(e) => setBioConfig({ ...bioConfig, autoSmsOnAbsent: e.target.checked })}
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Auto Alert on Absent</Typography>}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSaveBiometricConfig}
                  startIcon={<CheckCircleIcon />}
                  sx={{ bgcolor: '#0F2E5A', fontWeight: 800, px: 3, '&:hover': { bgcolor: '#1E3A8A' } }}
                >
                  Save Biometric Hardware Settings
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 1.5 }}>
                Hardware Buying & Setup Guide
              </Typography>
              <Stack spacing={1.5}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <strong>Recommended Hardware:</strong> Any ZKTeco or eSSL terminal with <b>ADMS / Cloud Push</b> support (e.g. ZKTeco K40 Pro ADMS, MB10-VL, or eSSL X990 ADMS).
                </Alert>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', display: 'block', mb: 0.5 }}>
                    1. ADMS Cloud Push Mode
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                    No dedicated PC needed. Connect the device to WiFi/LAN and set the Server URL to <code>globalera.com.np/api/iclock/cdata</code>.
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#1D4ED8', display: 'block', mb: 0.5 }}>
                    2. Local LAN Bridge Mode
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                    For non-ADMS LAN devices. A lightweight Node bridge on the reception PC polls the device IP/Port and pushes punches to Supabase.
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#D97706', display: 'block', mb: 0.5 }}>
                    3. Web Gate Kiosk (Active Now)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                    Works immediately without hardware via <b>Live Biometric Monitor</b> using Biometric ID or QR ID Card scan.
                  </Typography>
                </Paper>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
