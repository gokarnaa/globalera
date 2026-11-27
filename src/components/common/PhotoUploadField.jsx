import React, { useRef, useState } from 'react';
import {
  Box,
  Stack,
  Avatar,
  Button,
  IconButton,
  Typography,
  TextField,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { uploadPhotoToSupabase } from '../../services/mediaUpload';

export default function PhotoUploadField({
  value = '',
  onChange,
  label = 'Profile Photo',
  folder = 'students',
  entityId = '',
  name = ''
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'U';

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusInfo({ type: 'error', text: 'Please select an image file (JPG, PNG, WebP).' });
      return;
    }

    setUploading(true);
    setStatusInfo(null);
    try {
      const res = await uploadPhotoToSupabase(file, { folder, entityId: entityId || name });
      onChange?.(res.url);
      setStatusInfo({
        type: 'success',
        text: res.storage === 'supabase'
          ? `Cloud Saved (${res.sizeKb} KB)`
          : `Saved Compact (${res.sizeKb} KB)`
      });
    } catch (err) {
      setStatusInfo({ type: 'error', text: err?.message || 'Photo upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 2,
        border: '1px dashed #CBD5E1',
        bgcolor: '#F8FAFC'
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFilePicked}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleFilePicked}
      />

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar
          src={value || undefined}
          variant="rounded"
          sx={{
            width: 58,
            height: 58,
            borderRadius: 2,
            bgcolor: '#E2E8F0',
            color: '#0F2E5A',
            fontWeight: 900,
            fontSize: '1.1rem',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
            flexShrink: 0
          }}
        >
          {uploading ? <CircularProgress size={22} /> : initials}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.74rem' }}>
              {label}
            </Typography>
            {statusInfo && (
              <Chip
                size="small"
                icon={statusInfo.type === 'success' ? <CheckCircleIcon sx={{ fontSize: '12px !important' }} /> : undefined}
                label={statusInfo.text}
                sx={{
                  height: 18,
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  bgcolor: statusInfo.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: statusInfo.type === 'success' ? '#047857' : '#DC2626'
                }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="contained"
              disabled={uploading}
              startIcon={<UploadFileIcon sx={{ fontSize: '15px !important' }} />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                bgcolor: '#0F2E5A',
                '&:hover': { bgcolor: '#1E3A8A' },
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.72rem',
                py: 0.35,
                px: 1.1,
                borderRadius: 1.5,
                boxShadow: 'none'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>

            <Button
              size="small"
              variant="outlined"
              disabled={uploading}
              startIcon={<PhotoCameraIcon sx={{ fontSize: '15px !important' }} />}
              onClick={() => cameraInputRef.current?.click()}
              sx={{
                borderColor: '#CBD5E1',
                color: '#334155',
                bgcolor: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.72rem',
                py: 0.35,
                px: 1,
                borderRadius: 1.5
              }}
            >
              Camera
            </Button>

            <Tooltip title="Paste image URL instead">
              <IconButton
                size="small"
                onClick={() => setShowUrlInput((prev) => !prev)}
                sx={{ color: showUrlInput ? '#1D4ED8' : '#64748B', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', p: 0.45 }}
              >
                <LinkIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>

            {value && (
              <Tooltip title="Remove photo">
                <IconButton
                  size="small"
                  onClick={() => {
                    onChange?.('');
                    setStatusInfo(null);
                  }}
                  sx={{ color: '#DC2626', bgcolor: '#FEF2F2', border: '1px solid #FECACA', p: 0.45 }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Stack>

      {showUrlInput && (
        <TextField
          fullWidth
          size="small"
          placeholder="https://example.com/photo.jpg"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          sx={{ mt: 1, bgcolor: '#FFFFFF', '& .MuiInputBase-input': { fontSize: '0.76rem', py: 0.6 } }}
        />
      )}
    </Box>
  );
}
