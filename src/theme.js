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
      default: '#F8FAFC',   // Crisp Modern Slate 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',   // Slate 900 (High contrast)
      secondary: '#475569', // Slate 600
    },
    success: {
      main: '#059669',      // Emerald 600
      dark: '#047857',
      light: '#ECFDF5',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',      // Red 600
      dark: '#B91C1C',
      light: '#FEF2F2',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D97706',      // Amber 600
      dark: '#B45309',
      light: '#FFFBEB',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0284C7',      // Sky 600
      light: '#F0F9FF',
    },
    divider: '#E2E8F0',     // Slate 200
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 800,
      fontSize: 'clamp(1.35rem, 2.2vw, 1.8rem)',
      lineHeight: 1.25,
      textWrap: 'balance',
    },
    h5: {
      fontWeight: 800,
      fontSize: 'clamp(1.15rem, 1.7vw, 1.45rem)',
      lineHeight: 1.3,
      textWrap: 'balance',
    },
    h6: {
      fontWeight: 700,
      fontSize: 'clamp(1rem, 1.3vw, 1.18rem)',
      lineHeight: 1.35,
      textWrap: 'balance',
    },
    subtitle1: {
      fontWeight: 700,
      lineHeight: 1.4,
    },
    subtitle2: {
      fontWeight: 700,
      fontSize: '0.875rem',
      lineHeight: 1.4,
    },
    body1: {
      color: '#0F172A',
      lineHeight: 1.55,
      textWrap: 'pretty',
    },
    body2: {
      color: '#475569',
      lineHeight: 1.5,
      textWrap: 'pretty',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
          backgroundColor: '#FFFFFF',
          transition: 'all 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94A3B8',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(15, 46, 90, 0.08)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0F2C59',
              borderWidth: '1.5px',
            },
          },
        },
        input: {
          padding: '10px 14px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#475569',
          '&.Mui-focused': {
            color: '#0F2C59',
            fontWeight: 700,
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
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          overflow: 'hidden',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          padding: '16px 22px',
          borderBottom: '2px solid #F59E0B',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          padding: '16px 24px',
          gap: 12,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          overflowX: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: '#F4F7FB',
          color: '#0F172A',
          overflowX: 'hidden',
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
          borderRadius: 10,
          boxShadow: 'none',
          padding: '8px 16px',
          fontWeight: 700,
          transition: 'background-color 0.15s ease-out, border-color 0.15s ease-out, transform 0.15s ease-out',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(15, 44, 89, 0.12)',
          },
          '&:active': {
            transform: 'scale(0.99)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0F2C59',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#0A1F40',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)',
          border: '1px solid #E2E8F0',
          transition: 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            borderColor: '#CBD5E1',
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
          borderRadius: 14,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
          padding: '11px 14px',
          fontVariantNumeric: 'tabular-nums',
          color: '#0F172A',
        },
        head: {
          fontWeight: 800,
          backgroundColor: '#F8FAFC',
          color: '#334155',
          fontSize: '0.78rem',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 8,
        },
      },
    },
  },
});
