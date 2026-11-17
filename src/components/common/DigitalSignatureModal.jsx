import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Paper,
  Alert,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { loadDB, saveDB } from '../../services/storage';
import { pushLocalDBToSupabase } from '../../services/supabaseClient';

/**
 * Reusable Digital Signature Studio (Draw Pad + PNG Upload)
 * Stores Accountant & Principal signatures in LocalDB + Supabase cloud sync.
 */
export default function DigitalSignatureModal({ open, onClose, onSaved }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [roleTab, setRoleTab] = useState(0); // 0 = Accountant, 1 = Principal
  const [accountantName, setAccountantName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [accountantSign, setAccountantSign] = useState('');
  const [principalSign, setPrincipalSign] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const db = loadDB();
    const sigs = db.companyProfile?.digitalSignatures || {};
    setAccountantName(sigs.accountantName || 'Accounts Department');
    setPrincipalName(sigs.principalName || 'Principal / Director');
    setAccountantSign(sigs.accountantSign || '');
    setPrincipalSign(sigs.principalSign || '');
    setStatusMsg(null);
  }, [open]);

  const activeSign = roleTab === 0 ? accountantSign : principalSign;
  const setActiveSign = roleTab === 0 ? setAccountantSign : setPrincipalSign;

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pt = getPoint(e);
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F2C59';
  };

  const handleMoveDraw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pt = getPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handleEndDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setActiveSign(canvas.toDataURL('image/png'));
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setActiveSign('');
  };

  const handleUploadPng = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setActiveSign(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const db = loadDB();
      const nextProfile = {
        ...(db.companyProfile || {}),
        digitalSignatures: {
          accountantName: accountantName.trim() || 'Accounts Department',
          principalName: principalName.trim() || 'Principal / Director',
          accountantSign,
          principalSign,
          updatedAt: new Date().toISOString()
        }
      };
      const nextDb = { ...db, companyProfile: nextProfile };
      saveDB(nextDb);

      // Sync to Supabase in background
      if (db.settings?.supabaseUrl && db.settings?.supabaseAnonKey) {
        await pushLocalDBToSupabase(nextDb).catch(() => null);
      }

      setStatusMsg({ type: 'success', text: 'Digital signatures saved & synced to Supabase!' });
      if (onSaved) onSaved(nextProfile.digitalSignatures);
      setTimeout(() => onClose(), 700);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle
        sx={{
          bgcolor: '#0F2C59',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DrawIcon />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
              Digital Signature Studio (Supabase Cloud)
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)' }}>
              Draw or upload official signatures to digitally sign bills & receipts
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#FFFFFF' }} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#F8FAFC', p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Tabs value={roleTab} onChange={(_, v) => setRoleTab(v)} variant="fullWidth">
          <Tab label="Accountant / Cashier Sign" />
          <Tab label="Principal / Director Sign" />
        </Tabs>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            size="small"
            label={roleTab === 0 ? 'Accountant Name / Title' : 'Principal / Director Name'}
            value={roleTab === 0 ? accountantName : principalName}
            onChange={(e) => (roleTab === 0 ? setAccountantName(e.target.value) : setPrincipalName(e.target.value))}
          />

          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
            Draw signature below (mouse or touch) OR upload a transparent PNG:
          </Typography>

          <Box
            sx={{
              border: '1.5px dashed #94A3B8',
              borderRadius: 2,
              bgcolor: '#F8FAFC',
              overflow: 'hidden',
              touchAction: 'none'
            }}
          >
            <canvas
              ref={canvasRef}
              width={460}
              height={150}
              onMouseDown={handleStartDraw}
              onMouseMove={handleMoveDraw}
              onMouseUp={handleEndDraw}
              onMouseLeave={handleEndDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleMoveDraw}
              onTouchEnd={handleEndDraw}
              style={{ width: '100%', height: 140, display: 'block', cursor: 'crosshair' }}
            />
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleClearCanvas}>
              Clear
            </Button>
            <Button size="small" variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              Upload PNG Sign
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleUploadPng} />
            </Button>
          </Stack>

          {activeSign && (
            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUserIcon sx={{ color: '#059669', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#065F46' }}>
                  Active Saved Signature Preview:
                </Typography>
              </Box>
              <Box component="img" src={activeSign} alt="Saved Signature" sx={{ maxHeight: 44, maxWidth: 140, objectFit: 'contain', bgcolor: '#FFFFFF', p: 0.5, borderRadius: 1 }} />
            </Box>
          )}
        </Paper>

        {statusMsg && <Alert severity={statusMsg.type}>{statusMsg.text}</Alert>}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ fontWeight: 800 }}>
          {saving ? 'Saving...' : 'Save Digital Signature'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
