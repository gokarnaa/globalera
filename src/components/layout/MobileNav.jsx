import React from 'react';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SchoolIcon from '@mui/icons-material/School';
import MenuIcon from '@mui/icons-material/Menu';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CampaignIcon from '@mui/icons-material/Campaign';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav({ currentTab, onSelectTab, onOpenMenu }) {
  const { isStudent, isEmployer } = useAuth();

  const handleChange = (event, newValue) => {
    if (newValue === 'menu') {
      onOpenMenu();
    } else {
      onSelectTab(newValue);
    }
  };

  let navConfig;
  if (isStudent) {
    navConfig = {
      accentColor: '#0d9488',
      selectedBg: 'rgba(13, 148, 136, 0.10)',
      items: [
        { label: 'My Portal', value: 'student_portal', icon: <SchoolIcon /> },
        { label: 'Certificate', value: 'certificates', icon: <WorkspacePremiumIcon /> },
        { label: 'Notices', value: 'notices', icon: <CampaignIcon /> },
        { label: 'Menu', value: 'menu', icon: <MenuIcon /> }
      ]
    };
  } else if (isEmployer) {
    navConfig = {
      accentColor: '#0284c7',
      selectedBg: 'rgba(2, 132, 199, 0.10)',
      items: [
        { label: 'Employer', value: 'employer_portal', icon: <BusinessIcon /> },
        { label: 'OJT / Jobs', value: 'placements', icon: <WorkIcon /> },
        { label: 'Menu', value: 'menu', icon: <MenuIcon /> }
      ]
    };
  } else {
    navConfig = {
      accentColor: '#1a56b0',
      selectedBg: 'rgba(26, 86, 176, 0.10)',
      items: [
        { label: 'Home', value: 'dashboard', icon: <DashboardIcon /> },
        { label: 'Groups', value: 'groups', icon: <GroupWorkIcon /> },
        { label: 'Attendance', value: 'attendance', icon: <FactCheckIcon /> },
        { label: 'Students', value: 'students', icon: <SchoolIcon /> },
        { label: 'Menu', value: 'menu', icon: <MenuIcon /> }
      ]
    };
  }

  const validValues = navConfig.items.map((item) => item.value).filter((v) => v !== 'menu');
  const selectedValue = validValues.includes(currentTab) ? currentTab : 'menu';

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' },
        bgcolor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.08)',
        pb: 'env(safe-area-inset-bottom)'
      }}
      elevation={0}
    >
      <BottomNavigation
        value={selectedValue}
        onChange={handleChange}
        showLabels
        sx={{
          height: 60,
          bgcolor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            px: 0.5,
            py: 0.75,
            color: '#64748b',
            transition: 'color 0.15s ease'
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.68rem',
            fontWeight: 600,
            mt: 0.25,
            whiteSpace: 'nowrap'
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.3rem',
            p: 0.35,
            borderRadius: 2,
            transition: 'background-color 0.15s ease, transform 0.15s ease'
          },
          '& .Mui-selected': {
            color: navConfig.accentColor,
            fontWeight: 800
          },
          '& .Mui-selected .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 800
          },
          '& .Mui-selected .MuiSvgIcon-root': {
            bgcolor: navConfig.selectedBg,
            transform: 'translateY(-1px)'
          }
        }}
      >
        {navConfig.items.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
