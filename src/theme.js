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
      fontWeight: 900,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 800,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontWeight: 700,
      fontSize: '0.875rem',
    },
    body1: {
      letterSpacing: '-0.005em',
      color: '#1E293B',
    },
    body2: {
      letterSpacing: '-0.005em',
      color: '#475569',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8FAFC',
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
          padding: '8px 18px',
          fontWeight: 700,
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(15, 44, 89, 0.12)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E3E62 100%)',
          color: '#FFFFFF',
          '&:hover': {
            background: 'linear-gradient(135deg, #071A36 0%, #0F2C59 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
          border: '1px solid #E2E8F0',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
            borderColor: '#CBD5E1',
          },
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
          padding: '12px 16px',
        },
        head: {
          fontWeight: 800,
          backgroundColor: '#F8FAFC',
          color: '#334155',
          fontSize: '0.8rem',
          letterSpacing: '0.02em',
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
