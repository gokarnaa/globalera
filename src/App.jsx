import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Container,
  useMediaQuery,
  useTheme,
  Alert,
  Button,
  Typography
} from '@mui/material';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import PinLockDialog from './components/layout/PinLockDialog';

import Dashboard from './components/dashboard/Dashboard';
import OccupationManager from './components/occupations/OccupationManager';
import CourseManager from './components/courses/CourseManager';
import TrainerManager from './components/trainers/TrainerManager';
import TrainingGroupManager from './components/groups/TrainingGroupManager';
import SyllabusManager from './components/syllabus/SyllabusManager';
import StudentManager from './components/students/StudentManager';
import LeadManager from './components/leads/LeadManager';
import AdmissionManager from './components/admission/AdmissionManager';
import CourseFeeManager from './components/courses/CourseFeeManager';
import AccountsManager from './components/accounts/AccountsManager';
import WorkPlanManager from './components/workplan/WorkPlanManager';
import LessonPlanManager from './components/lessonplan/LessonPlanManager';
import AttendanceManager from './components/attendance/AttendanceManager';
import LogBookManager from './components/logbook/LogBookManager';
import EvaluationManager from './components/evaluation/EvaluationManager';
import EmployerManager from './components/employers/EmployerManager';
import OjtManager from './components/ojt/OjtManager';
import PlacementManager from './components/placements/PlacementManager';
import ReportsManager from './components/reports/ReportsManager';
import CertificateManager from './components/certificates/CertificateManager';
import CertificateStudioManager from './components/settings/CertificateStudioManager';
import PublicCertificateVerify from './components/certificates/PublicCertificateVerify';
import A4LandscapeCertificateModal from './components/certificates/A4LandscapeCertificateModal';
import HolidayManager from './components/holidays/HolidayManager';
import CommunicationManager from './components/communication/CommunicationManager';
import NoticeManager from './components/notices/NoticeManager';
import SnapshotAuditManager from './components/snapshots/SnapshotAuditManager';
import SettingsManager from './components/settings/SettingsManager';
import StudentPortal from './components/portal/StudentPortal';
import EmployerPortal from './components/portal/EmployerPortal';
import TrainerPortal from './components/portal/TrainerPortal';
import PublicWebsite from './components/portal/PublicWebsite';
import UserManager from './components/users/UserManager';
import UnifiedLoginScreen from './components/auth/UnifiedLoginScreen';
import { loadDB } from './services/storage';
import { verifyCertificateRemote } from './services/supabaseClient';
import { useAuth } from './context/AuthContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2.5, justifyContent: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              प्रणालीमा त्रुटि देखियो (Rendering Notice)
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
              {this.state.error?.message || 'Unexpected issue'}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            sx={{ fontWeight: 800 }}
          >
            ड्यासबोर्डमा फर्कनुहोस् (Return to Dashboard)
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isLocked, currentUser, isStudent, isEmployer, logout } = useAuth();

  // Multi-Portal Route detection supporting pathname (/trainer, /student, /ge-admin, /admin, /verify) and query (?portal=trainer, etc.)
  const getInitialRoute = () => {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal');
    const verify = params.get('verify');

    if (verify || path === '/verify') return 'verify';
    if (portal === 'trainer' || path === '/trainer') return 'trainer';
    if (portal === 'student' || path === '/student') return 'student';
    if (portal === 'admin' || path === '/admin' || path === '/ge-admin' || path === '/office' || path === '/mgmt') return 'admin';
    return 'home'; // default is official website!
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

  const navigateTo = (route, updateUrl = true) => {
    setCurrentRoute(route);
    if (updateUrl) {
      const pathMap = {
        home: '/',
        trainer: '/trainer',
        student: '/student',
        admin: '/ge-admin',
        verify: '/verify'
      };
      const newPath = pathMap[route] || '/';
      window.history.pushState({}, '', newPath);
    }
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [currentTab, setCurrentTab] = useState(() => {
    if (currentUser?.role === 'TRAINER') return 'trainer_portal';
    if (currentUser?.role === 'STUDENT') return 'student_portal';
    if (currentUser?.role === 'EMPLOYER') return 'employer_portal';
    return 'dashboard';
  });

  // Switch tab when user role changes
  React.useEffect(() => {
    if (currentUser?.role === 'TRAINER') {
      setCurrentTab('trainer_portal');
    } else if (currentUser?.role === 'STUDENT') {
      setCurrentTab('student_portal');
    } else if (currentUser?.role === 'EMPLOYER') {
      setCurrentTab('employer_portal');
    }
  }, [currentUser?.role, currentUser?.id]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Keep sidebar state in sync with device screen size changes (e.g. mobile toggle mode)
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [attendanceGroupId, setAttendanceGroupId] = useState(null);

  // Online QR Code Verification trigger from URL (?verify=...)
  const [verifyParam, setVerifyParam] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('verify') || null;
  });
  const [fullCertModalOpen, setFullCertModalOpen] = useState(false);
  const [remoteVerifyData, setRemoteVerifyData] = useState(null);

  React.useEffect(() => {
    if (!verifyParam) return;
    let isMounted = true;
    verifyCertificateRemote(verifyParam).then((res) => {
      if (isMounted && res?.found) {
        setRemoteVerifyData(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [verifyParam]);

  // Lookup verification record (Cloud-first, Local-fallback)
  const verifyData = React.useMemo(() => {
    if (!verifyParam) return null;

    if (remoteVerifyData?.certificate) {
      return {
        certId: verifyParam,
        certificate: remoteVerifyData.certificate,
        student: remoteVerifyData.student,
        course: remoteVerifyData.course,
        group: remoteVerifyData.group,
        trainer: remoteVerifyData.group?.trainer || null,
        isCloudVerified: true
      };
    }

    const db = loadDB();
    const cert = (db.certificates || []).find(
      (c) => c.certificateNo.toLowerCase() === verifyParam.trim().toLowerCase()
    );
    if (!cert) return { certId: verifyParam, certificate: null, student: null, course: null, group: null, trainer: null };

    const student = (db.students || []).find((s) => s.id === cert.studentId);
    const group = (db.trainingGroups || []).find((g) => g.id === cert.groupId);
    const course = (db.courses || []).find((c) => c.id === (cert.courseId || group?.courseId));
    const trainer = (db.trainers || []).find((t) => t.id === group?.trainerId);

    return { certId: verifyParam, certificate: cert, student, course, group, trainer };
  }, [verifyParam, remoteVerifyData]);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'occupations':
        return <OccupationManager />;
      case 'courses':
        return <CourseManager />;
      case 'trainers':
        return <TrainerManager />;
      case 'groups':
        return (
          <TrainingGroupManager
            onNavigateToAttendance={(grpId) => {
              setAttendanceGroupId(grpId);
              setCurrentTab('attendance');
            }}
          />
        );
      case 'syllabus':
        return <SyllabusManager />;
      case 'leads':
        return <LeadManager />;
      case 'admission':
        return <AdmissionManager />;
      case 'students':
        return <StudentManager />;
      case 'fees':
      case 'accounts':
        return <AccountsManager initialTab={0} />;
      case 'course_fees':
        return <CourseFeeManager />;
      case 'workplan':
        return <WorkPlanManager />;
      case 'lessonplan':
        return <LessonPlanManager />;
      case 'attendance':
        return <AttendanceManager initialGroupId={attendanceGroupId} />;
      case 'logbook':
        return <LogBookManager />;
      case 'evaluations':
        return <EvaluationManager />;
      case 'holidays':
        return <HolidayManager />;
      case 'employers':
        return <EmployerManager />;
      case 'ojt':
        return <OjtManager />;
      case 'placements':
        return <PlacementManager />;
      case 'certificates':
        return <CertificateManager />;
      case 'certificate_studio':
        return <CertificateStudioManager />;
      case 'communication':
        return <CommunicationManager />;
      case 'notices':
        return <NoticeManager />;
      case 'snapshots':
        return <SnapshotAuditManager />;
      case 'reports':
        return <ReportsManager />;
      case 'settings':
        return <SettingsManager />;
      case 'student_portal':
        return <StudentPortal />;
      case 'trainer_portal':
        return <TrainerPortal />;
      case 'employer_portal':
        return <EmployerPortal />;
      case 'users':
        return <UserManager />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  // 1. PUBLIC WEBSITE ROUTE (HOME & VERIFY)
  if (currentRoute === 'home' || currentRoute === 'verify') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
        <CssBaseline />
        <PublicWebsite
          onNavigate={navigateTo}
          onVerifyCertificate={(certId) => {
            setVerifyParam(certId);
          }}
        />

        {/* Online Verification Modal triggered by QR scan (?verify=...) or direct verify */}
        {verifyData && (
          <>
            <PublicCertificateVerify
              open={Boolean(verifyParam)}
              onClose={() => {
                setVerifyParam(null);
                window.history.replaceState({}, '', window.location.pathname);
              }}
              certId={verifyData.certId}
              certificate={verifyData.certificate}
              student={verifyData.student}
              course={verifyData.course}
              group={verifyData.group}
              isCloudVerified={verifyData.isCloudVerified}
              onOpenFullCertificate={() => setFullCertModalOpen(true)}
            />

            {verifyData.certificate && verifyData.student && (
              <A4LandscapeCertificateModal
                open={fullCertModalOpen}
                onClose={() => setFullCertModalOpen(false)}
                certificate={verifyData.certificate}
                student={verifyData.student}
                course={verifyData.course}
                group={verifyData.group}
                trainer={verifyData.trainer}
              />
            )}
          </>
        )}
      </Box>
    );
  }

  // 2. DEDICATED TRAINER PORTAL ROUTE (/trainer)
  if (currentRoute === 'trainer') {
    if (!currentUser || currentUser?.role !== 'TRAINER') {
      return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#064E3B' }}>
          <CssBaseline />
          <UnifiedLoginScreen
            initialMode="trainer"
            allowedModes={['trainer', 'student']}
            onBackHome={() => navigateTo('home')}
          />
        </Box>
      );
    }
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F4F7FB', p: { xs: 1.5, sm: 3 } }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <TrainerPortal onLogout={() => { logout(); navigateTo('home'); }} />
        </Box>
      </Box>
    );
  }

  // 3. DEDICATED STUDENT PORTAL ROUTE (/student)
  if (currentRoute === 'student') {
    if (!currentUser || currentUser?.role !== 'STUDENT') {
      return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#1E3A8A' }}>
          <CssBaseline />
          <UnifiedLoginScreen
            initialMode="student"
            allowedModes={['student', 'trainer']}
            onBackHome={() => navigateTo('home')}
          />
        </Box>
      );
    }
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F4F7FB', p: { xs: 1.5, sm: 3 } }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <StudentPortal onLogout={() => { logout(); navigateTo('home'); }} />
        </Box>
      </Box>
    );
  }

  // 4. ADMIN & MANAGEMENT ROUTE (/ge-admin or /admin)
  if (!currentUser) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0F2E5A' }}>
        <CssBaseline />
        <UnifiedLoginScreen
          initialMode="admin"
          allowedModes={['admin']}
          onBackHome={() => navigateTo('home')}
        />
      </Box>
    );
  }

  // Role Enforcement: If logged in user is a Trainer, lock to Trainer Portal
  if (currentUser?.role === 'TRAINER') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F4F7FB', p: { xs: 1.5, sm: 3 } }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <TrainerPortal onLogout={() => { logout(); navigateTo('home'); }} />
        </Box>
      </Box>
    );
  }

  // Role Enforcement: If logged in user is a Student, lock to Student Portal
  if (currentUser?.role === 'STUDENT') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F4F7FB', p: { xs: 1.5, sm: 3 } }}>
        <CssBaseline />
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <StudentPortal onLogout={() => { logout(); navigateTo('home'); }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f7fb' }}>
      <CssBaseline />

      {/* Top Application Bar */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          onOpenPinModal={() => setPinModalOpen(true)}
          onGoHome={() => navigateTo('home')}
        />

        <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative', overflowX: 'hidden' }}>
          {/* Sidebar Navigation */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              p: { xs: 1.5, sm: 2.5, md: 3 },
              minHeight: 'calc(100vh - 70px)',
              position: 'relative',
              zIndex: 1,
              pb: { xs: 12, md: 5 } // Padding for mobile bottom nav
            }}
          >
            <Box sx={{ width: '100%', maxWidth: '1720px', mx: 'auto', px: { xs: 0, sm: 1 } }}>
              <ErrorBoundary key={currentTab} onReset={() => setCurrentTab('dashboard')}>
                {renderContent()}
              </ErrorBoundary>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenMenu={() => setSidebarOpen(true)}
      />

      {/* 4-Digit Quick PIN Modal */}
      <PinLockDialog
        open={pinModalOpen || isLocked}
        onClose={isLocked ? null : () => setPinModalOpen(false)}
      />

      {/* Online Verification Modal triggered by QR scan (?verify=...) */}
      {verifyData && (
        <>
          <PublicCertificateVerify
            open={Boolean(verifyParam)}
            onClose={() => {
              setVerifyParam(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
            certId={verifyData.certId}
            certificate={verifyData.certificate}
            student={verifyData.student}
            course={verifyData.course}
            group={verifyData.group}
            isCloudVerified={verifyData.isCloudVerified}
            onOpenFullCertificate={() => setFullCertModalOpen(true)}
          />

          {verifyData.certificate && verifyData.student && (
            <A4LandscapeCertificateModal
              open={fullCertModalOpen}
              onClose={() => setFullCertModalOpen(false)}
              certificate={verifyData.certificate}
              student={verifyData.student}
              course={verifyData.course}
              group={verifyData.group}
              trainer={verifyData.trainer}
            />
          )}
        </>
      )}
    </Box>
  );
}
