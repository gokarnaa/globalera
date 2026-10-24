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

  if (isStudent) {
    const selectedVal = ['student_portal', 'certificates', 'notices'].includes(currentTab)
      ? currentTab
      : 'menu';

    return (
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}
        elevation={3}
      >
        <BottomNavigation
          value={selectedVal}
          onChange={handleChange}
          showLabels
          sx={{
            height: 62,
            '& .Mui-selected': { color: '#0d9488', fontWeight: 800 }
          }}
        >
          <BottomNavigationAction
            label="मेरो पोर्टल"
            value="student_portal"
            icon={<SchoolIcon />}
          />
          <BottomNavigationAction
            label="प्रमाणपत्र"
            value="certificates"
            icon={<WorkspacePremiumIcon />}
          />
          <BottomNavigationAction
            label="सूचना"
            value="notices"
            icon={<CampaignIcon />}
          />
          <BottomNavigationAction
            label="मेनु"
            value="menu"
            icon={<MenuIcon />}
          />
        </BottomNavigation>
      </Paper>
    );
  }

  if (isEmployer) {
    const selectedVal = ['employer_portal', 'placements'].includes(currentTab)
      ? currentTab
      : 'menu';

    return (
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}
        elevation={3}
      >
        <BottomNavigation
          value={selectedVal}
          onChange={handleChange}
          showLabels
          sx={{
            height: 62,
            '& .Mui-selected': { color: '#0284c7', fontWeight: 800 }
          }}
        >
          <BottomNavigationAction
            label="कम्पनी पोर्टल"
            value="employer_portal"
            icon={<BusinessIcon />}
          />
          <BottomNavigationAction
            label="OJT / Jobs"
            value="placements"
            icon={<WorkIcon />}
          />
          <BottomNavigationAction
            label="मेनु"
            value="menu"
            icon={<MenuIcon />}
          />
        </BottomNavigation>
      </Paper>
    );
  }

  const selectedValue = ['dashboard', 'groups', 'attendance', 'students'].includes(currentTab)
    ? currentTab
    : 'menu';

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
      }}
      elevation={3}
    >
      <BottomNavigation
        value={selectedValue}
        onChange={handleChange}
        showLabels
        sx={{
          height: 62,
          '& .Mui-selected': {
            color: '#1a56b0',
            fontWeight: 800
          }
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="dashboard"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          label="Groups"
          value="groups"
          icon={<GroupWorkIcon />}
        />
        <BottomNavigationAction
          label="Attendance"
          value="attendance"
          icon={<FactCheckIcon />}
        />
        <BottomNavigationAction
          label="Students"
          value="students"
          icon={<SchoolIcon />}
        />
        <BottomNavigationAction
          label="Menu"
          value="menu"
          icon={<MenuIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}
