import React from 'react';
import { Box, Typography } from '@mui/material';

const TONE_MAP = {
  success: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
  warning: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  error:   { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  info:    { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD', dot: '#0EA5E9' },
  primary: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' },
  teal:    { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', dot: '#14B8A6' },
  neutral: { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', dot: '#94A3B8' }
};

/**
 * Unified semantic pill badge used across tables, mobile cards, and 360° profiles.
 */
export default function StatusBadge({
  label,
  tone = 'neutral',
  icon,
  showDot = false,
  size = 'small',
  sx
}) {
  const palette = TONE_MAP[tone] || TONE_MAP.neutral;
  const isSm = size === 'small';

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        px: isSm ? 1 : 1.25,
        py: isSm ? 0.3 : 0.45,
        borderRadius: '999px',
        bgcolor: palette.bg,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...sx
      }}
    >
      {showDot && (
        <Box
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: palette.dot,
            flexShrink: 0
          }}
        />
      )}
      {icon && (
        <Box component="span" sx={{ display: 'inline-flex', fontSize: isSm ? 13 : 15 }}>
          {icon}
        </Box>
      )}
      <Typography
        component="span"
        sx={{
          fontSize: isSm ? '0.69rem' : '0.75rem',
          fontWeight: 700,
          color: 'inherit',
          letterSpacing: '0.01em',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
