import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F2C59',      // Deep Executive Navy
      dark: '#071A36',
      light: '#E8F1FC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2563EB',      // Enterprise Royal Blue
      dark: '#1D4ED8',
      light: '#EFF6FF',
    },
    accent: {
      main: '#0D9488',      // TVET Teal
      light: '#F0FDFA',
    },
    background: {
      default: '#F7F8FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5565',
    },
    success: {
      main: '#16A34A',
      dark: '#15803D',
      light: '#F0FDF4',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      dark: '#B91C1C',
      light: '#FEF2F2',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D97706',
      dark: '#B45309',
      light: '#FFFBEB',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0284C7',
      light: '#F0F9FF',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: 'clamp(1.2rem, 1.7vw, 1.5rem)',
      lineHeight: 1.2,
      letterSpacing: '-0.015em',
      textWrap: 'balance',
    },
    h5: {
      fontWeight: 600,
      fontSize: 'clamp(1.05rem, 1.35vw, 1.25rem)',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      textWrap: 'balance',
    },
    h6: {
      fontWeight: 600,
      fontSize: 'clamp(0.95rem, 1.1vw, 1.0625rem)',
      lineHeight: 1.3,
      textWrap: 'balance',
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '0.9rem',
      lineHeight: 1.35,
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.8125rem',
      lineHeight: 1.35,
    },
    body1: {
      color: '#111827',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      textWrap: 'pretty',
    },
    body2: {
      color: '#4B5565',
      fontSize: '0.8125rem',
      lineHeight: 1.45,
      textWrap: 'pretty',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.35,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.8125rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid #2563EB',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.8125rem',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
          transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#64748B',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(15, 44, 89, 0.12)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0F2C59',
              borderWidth: '1.5px',
            },
          },
        },
        input: {
          padding: '8px 12px',
        },
        inputSizeSmall: {
          padding: '7px 11px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#475569',
          '&.Mui-focused': {
            color: '#0F2C59',
            fontWeight: 700,
          },
          '& .MuiFormLabel-asterisk': {
            color: '#DC2626',
            fontWeight: 800,
          },
        },
        outlined: {
          lineHeight: '1.2em',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.72rem',
          color: '#64748B',
          marginTop: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          overflow: 'hidden',
          '@media (max-width:599.95px)': {
            margin: '8px',
            width: 'calc(100% - 16px)',
            maxWidth: 'calc(100% - 16px) !important',
            maxHeight: '92dvh',
            '&.MuiDialog-paperFullScreen': {
              margin: 0,
              width: '100%',
              maxWidth: '100% !important',
              maxHeight: '100dvh',
              borderRadius: 0,
            },
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          backgroundColor: '#F7F8FA',
          borderTop: '1px solid #E5E7EB',
          padding: '12px 20px',
          gap: 8,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          overflowX: 'clip',
          overflowY: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: '#F7F8FA',
          color: '#111827',
          overflowX: 'clip',
          fontVariantNumeric: 'tabular-nums',
          scrollbarColor: '#CBD5E1 #F1F5F9',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: '#F1F5F9',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E1',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#94A3B8',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '6px 14px',
          fontSize: '0.8125rem',
          lineHeight: 1.35,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            boxShadow: 'none',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        sizeSmall: {
          padding: '4px 10px',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
        sizeLarge: {
          padding: '8px 16px',
          fontSize: '0.875rem',
          borderRadius: 8,
        },
        containedPrimary: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#163A70',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          border: '1px solid #E5E7EB',
          transition: 'border-color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            borderColor: '#D1D5DB',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#E5E7EB',
          padding: '8px 12px',
          fontSize: '0.8125rem',
          lineHeight: 1.4,
          fontVariantNumeric: 'tabular-nums',
          color: '#111827',
        },
        sizeSmall: {
          padding: '8px 12px',
          fontSize: '0.78rem',
        },
        head: {
          fontWeight: 500,
          backgroundColor: '#F7F8FA',
          color: '#4B5565',
          padding: '8px 12px',
          fontSize: '0.75rem',
          letterSpacing: '0',
          whiteSpace: 'nowrap',
          textTransform: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
        sizeSmall: {
          height: 22,
          fontSize: '0.72rem',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          borderRadius: 8,
          margin: '2px 6px',
          padding: '8px 10px',
          '&.Mui-selected': {
            backgroundColor: '#F1F5F9',
            color: '#0F2C59',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#E5E7EB',
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: '#F1F5F9',
          padding: 4,
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          gap: 4,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: '6px !important',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.78rem',
          color: '#4B5565',
          padding: '4px 12px',
          transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&.Mui-selected': {
            backgroundColor: '#FFFFFF',
            color: '#111827',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
            '&:hover': {
              backgroundColor: '#FFFFFF',
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
          borderRadius: '2px 2px 0 0',
          backgroundColor: '#0F2C59',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          minHeight: 40,
          color: '#6B7487',
          '&.Mui-selected': {
            color: '#0F2C59',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0F172A',
          fontSize: '0.73rem',
          fontWeight: 600,
          borderRadius: 7,
          padding: '6px 10px',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        primary: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(15, 44, 89, 0.35)',
          '&:hover': {
            backgroundColor: '#0A1F40',
          },
        },
      },
    },
  },
});
