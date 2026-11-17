import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
  Button,
  LinearProgress
} from '@mui/material';
import StatusBadge from './StatusBadge';

/**
 * Premium "Smart Action Card" used across CRM, Students, Batches, Courses,
 * Trainers, Employers, Accounts, OJT, Placements & Certificates.
 *
 * - Clicking the card body triggers `onCardClick` (opens 360° profile / detail popup).
 * - Bottom Action Dock features soft-tinted clickable icon buttons that open
 *   the exact related popup/action without triggering `onCardClick`.
 */
export default function EntityCard({
  accentColor = '#0F2C59',
  avatarSrc,
  avatarText,
  avatarIcon,
  avatarBg = '#EFF6FF',
  avatarColor = '#0F2C59',
  title,
  subtitle,
  code,
  status,
  extraBadges,
  fields = [],
  progress,
  highlight,
  actions = [],
  primaryAction,
  onCardClick,
  sx
}) {
  const visibleActions = (actions || []).filter((a) => a && !a.hidden);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${accentColor}`,
        bgcolor: '#FFFFFF',
        overflow: 'hidden',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        '&:hover': onCardClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.10)',
              borderColor: '#CBD5E1',
              borderLeftColor: accentColor
            }
          : {
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)'
            },
        ...sx
      }}
    >
      {/* Clickable Body Area */}
      <Box
        onClick={onCardClick}
        sx={{
          p: { xs: 1.65, sm: 1.85 },
          pb: 1.25,
          cursor: onCardClick ? 'pointer' : 'default',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25
        }}
      >
        {/* Header Zone: Avatar + Title/Code + Status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
            {(avatarSrc || avatarText || avatarIcon) && (
              <Avatar
                src={avatarSrc || undefined}
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: avatarBg,
                  color: avatarColor,
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: '1px solid rgba(15, 44, 89, 0.08)',
                  flexShrink: 0
                }}
              >
                {avatarIcon || avatarText}
              </Avatar>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: '0.92rem',
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {title}
                </Typography>
                {code && (
                  <Box
                    component="span"
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: 1,
                      bgcolor: '#F1F5F9',
                      color: '#334155',
                      fontSize: '0.67rem',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                      border: '1px solid #E2E8F0',
                      flexShrink: 0
                    }}
                  >
                    {code}
                  </Box>
                )}
              </Box>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748B',
                    display: 'block',
                    mt: 0.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
            {status && (
              <StatusBadge
                label={status.label}
                tone={status.tone || 'neutral'}
                showDot={status.showDot}
                icon={status.icon}
              />
            )}
            {extraBadges}
          </Box>
        </Box>

        {/* Content 2-Column Grid */}
        {fields.length > 0 && (
          <Grid
            container
            spacing={1}
            sx={{
              bgcolor: '#F8FAFC',
              borderRadius: 2,
              p: 1.15,
              border: '1px solid #F1F5F9'
            }}
          >
            {fields.map((field, idx) => (
              <Grid item xs={field.fullWidth ? 12 : 6} key={idx}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.65, minWidth: 0 }}>
                  {field.icon && (
                    <Box sx={{ color: field.iconColor || '#64748B', display: 'inline-flex', mt: 0.15, flexShrink: 0 }}>
                      {field.icon}
                    </Box>
                  )}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748B',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        display: 'block',
                        lineHeight: 1.15
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: field.color || '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.79rem',
                        lineHeight: 1.3,
                        mt: 0.15,
                        fontVariantNumeric: 'tabular-nums',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: field.wrap ? 'normal' : 'nowrap'
                      }}
                    >
                      {field.value ?? '-'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Optional Progress Bar */}
        {progress && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.45 }}>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.71rem' }}>
                {progress.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: progress.color || '#0F2C59',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {progress.text}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, Number(progress.percent) || 0))}
              sx={{
                height: 6,
                borderRadius: 99,
                bgcolor: '#E2E8F0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 99,
                  bgcolor: progress.color || '#0F2C59'
                }
              }}
            />
          </Box>
        )}

        {/* Optional Highlight Strip */}
        {highlight && (
          <Box
            sx={{
              px: 1.1,
              py: 0.65,
              borderRadius: 1.5,
              bgcolor: highlight.bg || '#FFFBEB',
              border: `1px solid ${highlight.border || '#FDE68A'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75
            }}
          >
            {highlight.icon && (
              <Box sx={{ display: 'inline-flex', color: highlight.color || '#B45309', flexShrink: 0 }}>
                {highlight.icon}
              </Box>
            )}
            <Typography
              variant="caption"
              sx={{
                color: highlight.color || '#92400E',
                fontWeight: 700,
                fontSize: '0.72rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {highlight.text}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Bottom Clickable Action Icon Dock */}
      {(visibleActions.length > 0 || primaryAction) && (
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            px: { xs: 1.5, sm: 1.75 },
            py: 1,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {visibleActions.map((act, idx) => {
              const btnColor = act.color || '#0F2C59';
              const btnBg = act.bgColor || 'rgba(15, 44, 89, 0.07)';
              const commonProps = {
                size: 'small',
                disabled: act.disabled,
                'aria-label': act.label,
                onClick: (e) => {
                  e.stopPropagation();
                  if (act.onClick) act.onClick(e);
                },
                sx: {
                  width: { xs: 36, sm: 34 },
                  height: { xs: 36, sm: 34 },
                  borderRadius: 2,
                  color: btnColor,
                  bgcolor: btnBg,
                  border: '1px solid transparent',
                  transition: 'all 0.14s ease',
                  '&:hover': {
                    bgcolor: btnBg,
                    borderColor: btnColor,
                    transform: 'scale(1.06)'
                  }
                }
              };

              const buttonEl = act.href ? (
                <IconButton
                  component="a"
                  href={act.href}
                  target={act.target}
                  rel={act.target === '_blank' ? 'noopener noreferrer' : undefined}
                  {...commonProps}
                >
                  {act.icon}
                </IconButton>
              ) : (
                <IconButton {...commonProps}>{act.icon}</IconButton>
              );

              return (
                <Tooltip key={idx} title={act.label} arrow>
                  <span>{buttonEl}</span>
                </Tooltip>
              );
            })}
          </Box>

          {primaryAction && (
            <Button
              size="small"
              variant={primaryAction.variant || 'contained'}
              color={primaryAction.muiColor || 'primary'}
              startIcon={primaryAction.icon}
              disabled={primaryAction.disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (primaryAction.onClick) primaryAction.onClick(e);
              }}
              sx={{
                fontWeight: 800,
                fontSize: '0.73rem',
                borderRadius: 2,
                px: 1.35,
                py: 0.5,
                ...(primaryAction.bgcolor
                  ? {
                      bgcolor: primaryAction.bgcolor,
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: primaryAction.hoverBgcolor || primaryAction.bgcolor }
                    }
                  : {})
              }}
            >
              {primaryAction.label}
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}
