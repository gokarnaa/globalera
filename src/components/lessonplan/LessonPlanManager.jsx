import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Grid,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider,
  Paper,
  Avatar,
  LinearProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, logAudit } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function LessonPlanManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer } = useAuth();

  const myGroups = isTrainer
    ? (db.trainingGroups || []).filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups || [];

  const [selectedGroupId, setSelectedGroupId] = useState(myGroups[0]?.id || db.trainingGroups?.[0]?.id || '');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [printTargetItem, setPrintTargetItem] = useState(null); // null = batch overview, item = single detailed A4 lesson plan
  const [openAutoDraftDialog, setOpenAutoDraftDialog] = useState(false);

  const selectedGroup = (db.trainingGroups || []).find((g) => g.id === selectedGroupId);
  const selectedCourse = (db.courses || []).find((c) => c.id === selectedGroup?.courseId);
  const trainer = (db.trainers || []).find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Instructor', phone: '' };

  const availableWorkPlans = useMemo(() => {
    return (db.workPlans || []).filter((wp) => wp.groupId === selectedGroupId);
  }, [db.workPlans, selectedGroupId]);

  // Form State
  const [formData, setFormData] = useState({
    workPlanId: '',
    groupId: selectedGroupId,
    objectives: '',
    materialsNeeded: '',
    introStep: '१५ मिनेट: पूर्व-ज्ञान पुनरावलोकन, सुरक्षा नियम तथा पाठको उद्देश्य परिचय।',
    demoStep: '३० मिनेट: प्रशिक्षकद्वारा कार्यथलोमा प्रत्यक्ष प्रयोगात्मक प्रदर्शन (Live Demo)।',
    practiceStep: '६० मिनेट: प्रशिक्षार्थीहरूद्वारा व्यक्तिगत तथा समूहमा प्रत्यक्ष सीप अभ्यास (Hands-on Drill)।',
    evalStep: '१५ मिनेट: सीप परीक्षण, प्रश्नोत्तर, मूल्याङ्कन तथा गृहकार्य समीक्षा।',
    assessmentMethod: 'प्रत्यक्ष अवलोकन, सीप चेकलिस्ट रेटिङ तथा मौखिक प्रश्नोत्तर।',
    homework: 'कार्यविधि अध्ययन गर्ने र दैनिक लगबुक (Log Book) प्रमाणित गराउने।',
    notes: 'कार्यथलोमा उचित भेन्टिलेसन, PPE किटको अनिवार्य प्रयोग तथा सुरक्षा मापदण्ड पालना गर्ने।'
  });

  const groupLessonPlans = useMemo(() => {
    return (db.lessonPlans || []).filter((lp) => lp.groupId === selectedGroupId);
  }, [db.lessonPlans, selectedGroupId]);

  const filteredLessonPlans = useMemo(() => {
    return groupLessonPlans.filter((lp) => {
      const wp = (db.workPlans || []).find((w) => w.id === lp.workPlanId);
      const syl = (db.syllabi || []).find((s) => s.id === wp?.syllabusId);
      const q = searchTerm.toLowerCase().trim();

      return (
        !q ||
        (syl?.title || '').toLowerCase().includes(q) ||
        (wp?.planDate || '').toLowerCase().includes(q) ||
        (lp.objectives || '').toLowerCase().includes(q) ||
        (lp.materialsNeeded || '').toLowerCase().includes(q) ||
        (lp.assessmentMethod || '').toLowerCase().includes(q) ||
        `unit ${syl?.unitNo || ''}`.includes(q)
      );
    });
  }, [groupLessonPlans, searchTerm, db.workPlans, db.syllabi]);

  // Statistics
  const totalWorkPlans = availableWorkPlans.length;
  const totalPreparedPlans = groupLessonPlans.length;
  const coveragePercent = totalWorkPlans > 0 ? Math.min(100, Math.round((totalPreparedPlans / totalWorkPlans) * 100)) : 0;

  // Add / Edit Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    const unmappedWp = availableWorkPlans.find((wp) => !groupLessonPlans.some((lp) => lp.workPlanId === wp.id)) || availableWorkPlans[0];
    const syl = unmappedWp ? (db.syllabi || []).find((s) => s.id === unmappedWp.syllabusId) : null;

    setFormData({
      workPlanId: unmappedWp?.id || '',
      groupId: selectedGroupId,
      objectives: syl ? `प्रशिक्षार्थीहरूले ${syl.title} सम्बन्धी आधारभूत सिद्धान्त बुझी सुरक्षा प्रोटोकल पालना गर्दै कार्यथलोमा प्रत्यक्ष सीप प्रदर्शन गर्न सक्षम हुनेछन्।` : '',
      materialsNeeded: syl?.toolsAndMaterials || 'मानक तालिम औजार, प्रदर्शन उपकरण, PPE किट, अभ्यास म्यानुअल तथा वर्कबुक।',
      introStep: '१५ मिनेट: पूर्व-ज्ञान पुनरावलोकन, सुरक्षा नियम तथा पाठको उद्देश्य परिचय।',
      demoStep: `३० मिनेट: प्रशिक्षकद्वारा ${syl?.title || 'सीप'} को प्रत्यक्ष प्रयोगात्मक प्रदर्शन (Live Demonstration)।`,
      practiceStep: '६० मिनेट: प्रशिक्षार्थीहरूद्वारा कार्यथलोमा प्रत्यक्ष सीप अभ्यास ड्रिल (Guided Hands-on Drill)।',
      evalStep: '१५ मिनेट: सीप दक्षता परीक्षण, प्रश्नोत्तर, मूल्याङ्कन तथा निष्कर्ष।',
      assessmentMethod: 'प्रत्यक्ष कार्यथलो अवलोकन, सीप चेकलिस्ट रेटिङ तथा मौखिक प्रश्नोत्तर।',
      homework: 'सत्रको कार्यविधि अध्ययन गर्ने र दैनिक लगबुक (Log Book) अद्यावधिक गर्ने।',
      notes: 'सुरक्षा मापदण्डको पूर्ण पालना, व्यक्तिगत सुरक्षा उपकरणको प्रयोग तथा सबै विद्यार्थीको समान सहभागिता सुनिश्चित गर्ने।'
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (lp) => {
    setEditingItem(lp);
    const parts = (lp.methodology || '').split(' | ');

    setFormData({
      workPlanId: lp.workPlanId,
      groupId: lp.groupId,
      objectives: lp.objectives || '',
      materialsNeeded: lp.materialsNeeded || '',
      introStep: parts[0] || '१५ मिनेट: पूर्व-ज्ञान पुनरावलोकन तथा सुरक्षा परिचय।',
      demoStep: parts[1] || '३० मिनेट: प्रशिक्षकद्वारा प्रत्यक्ष प्रयोगात्मक प्रदर्शन।',
      practiceStep: parts[2] || '६० मिनेट: प्रशिक्षार्थीहरूद्वारा प्रत्यक्ष सीप अभ्यास।',
      evalStep: parts[3] || '१५ मिनेट: सीप परीक्षण, प्रश्नोत्तर तथा निष्कर्ष।',
      assessmentMethod: lp.assessmentMethod || '',
      homework: lp.homework || '',
      notes: lp.notes || ''
    });
    setOpenDialog(true);
  };

  const handleWorkPlanSelect = (wpId) => {
    const wp = availableWorkPlans.find((w) => w.id === wpId);
    const syl = wp ? (db.syllabi || []).find((s) => s.id === wp.syllabusId) : null;

    setFormData((prev) => ({
      ...prev,
      workPlanId: wpId,
      objectives: syl ? `प्रशिक्षार्थीहरूले ${syl.title} सम्बन्धी प्राविधिक सीप र सुरक्षा नियमहरू सफलतापूर्वक सम्पन्न गर्न सक्नेछन्।` : prev.objectives,
      materialsNeeded: syl?.toolsAndMaterials || prev.materialsNeeded,
      demoStep: syl ? `३० मिनेट: प्रशिक्षकद्वारा ${syl.title} को प्रत्यक्ष प्रयोगात्मक प्रदर्शन।` : prev.demoStep
    }));
  };

  const handleSave = () => {
    if (!formData.workPlanId || !formData.objectives.trim()) {
      alert('कृपया सम्बन्धित कार्ययोजना (Work Plan) र सिकाइ उद्देश्यहरू प्रविष्ट गर्नुहोस्।');
      return;
    }

    const compiledMethodology = `${formData.introStep} | ${formData.demoStep} | ${formData.practiceStep} | ${formData.evalStep}`;

    const payload = {
      workPlanId: formData.workPlanId,
      groupId: formData.groupId,
      objectives: formData.objectives,
      materialsNeeded: formData.materialsNeeded,
      methodology: compiledMethodology,
      assessmentMethod: formData.assessmentMethod,
      homework: formData.homework,
      notes: formData.notes
    };

    let updatedList = [...(db.lessonPlans || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...payload } : x
      );
    } else {
      const newId = `LP-${String(updatedList.length + 1).padStart(3, '0')}`;
      updatedList.push({ id: newId, ...payload });
    }

    let nextDb = { ...db, lessonPlans: updatedList };
    nextDb = logAudit(
      nextDb,
      editingItem ? 'UPDATE' : 'CREATE',
      'LessonPlan',
      editingItem?.id || 'NEW',
      `Lesson plan ${editingItem ? 'updated' : 'created'} for group ${selectedGroup?.groupCode}`,
      currentUser?.name || 'Admin'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
  };

  const handleDelete = (id) => {
    if (window.confirm('के तपाईं निश्चित हुनुहुन्छ? यो पाठयोजना मेटिनेछ।')) {
      let nextDb = {
        ...db,
        lessonPlans: (db.lessonPlans || []).filter((x) => x.id !== id)
      };
      nextDb = logAudit(
        nextDb,
        'DELETE',
        'LessonPlan',
        id,
        `Lesson plan ${id} deleted`,
        currentUser?.name || 'Admin'
      );
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // 1-Click Auto-Draft All Lesson Plans for unmapped work plans
  const handleAutoDraftAll = () => {
    const unmappedWorkPlans = availableWorkPlans.filter(
      (wp) => !groupLessonPlans.some((lp) => lp.workPlanId === wp.id)
    );

    if (unmappedWorkPlans.length === 0) {
      alert('यस समूहका सबै कार्ययोजनाका लागि पाठयोजनाहरू पहिले नै तयार भइसकेका छन्।');
      setOpenAutoDraftDialog(false);
      return;
    }

    const newDrafts = unmappedWorkPlans.map((wp, idx) => {
      const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
      const unitTitle = syl?.title || 'व्यावसायिक सीप';

      return {
        id: `LP-${Date.now()}-${idx}`,
        workPlanId: wp.id,
        groupId: selectedGroupId,
        objectives: `प्रशिक्षार्थीहरूले ${unitTitle} सम्बन्धी प्राविधिक सीप र सुरक्षा मापदण्डहरू बुझी कार्यथलोमा सफलतापूर्वक प्रदर्शन गर्न सक्षम हुनेछन्।`,
        materialsNeeded: syl?.toolsAndMaterials || 'मानक व्यावसायिक तालिम औजार, PPE किट, मोडल तथा अभ्यास वर्कबुक।',
        methodology: `१५ मिनेट: पूर्व-ज्ञान पुनरावलोकन र सुरक्षा | ३० मिनेट: प्रशिक्षकद्वारा ${unitTitle} को प्रत्यक्ष प्रदर्शन | ६० मिनेट: प्रशिक्षार्थीहरूको प्रत्यक्ष सीप अभ्यास | १५ मिनेट: सीप परीक्षण तथा निष्कर्ष`,
        assessmentMethod: 'प्रत्यक्ष अवलोकन, सीप चेकलिस्ट रेटिङ तथा मौखिक प्रश्नोत्तर।',
        homework: 'दैनिक कार्यविधि अध्ययन गर्ने र लगबुक अद्यावधिक गर्ने।',
        notes: 'सुरक्षा नियमहरूको पूर्ण पालना र सबै प्रशिक्षार्थीहरूको समान सहभागिता सुनिश्चित गर्ने।'
      };
    });

    const nextDb = {
      ...db,
      lessonPlans: [...(db.lessonPlans || []), ...newDrafts]
    };

    saveDB(nextDb);
    setDb(nextDb);
    setOpenAutoDraftDialog(false);

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // WhatsApp Share Text
  const getSingleLessonPlanShareText = (lp) => {
    const wp = (db.workPlans || []).find((w) => w.id === lp.workPlanId);
    const syl = (db.syllabi || []).find((s) => s.id === wp?.syllabusId);

    return (
      `*ग्लोबल एरा प्राविधिक स्कुल (Global Era Technical School)*\n` +
      `📖 *CTEVT आधिकारिक दैनिक पाठ योजना (Lesson Plan)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *समूह (Batch):* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})\n` +
      `• *मिति र अवधि:* ${wp?.planDate || '—'} (${wp?.plannedHours || 2} Hours)\n` +
      `• *पाठ्यक्रम एकाइ:* Unit ${syl?.unitNo || '—'}: ${syl?.title || '—'}\n` +
      `• *प्रशिक्षक:* ${trainer?.name || 'Assigned Instructor'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *सिकाइ उद्देश्यहरू (Learning Objectives):*\n${lp.objectives}\n\n` +
      `🛠️ *आवश्यक सामग्री तथा औजार:*\n${lp.materialsNeeded}\n\n` +
      `📋 *शिक्षण विधि तथा चरणहरू:*\n${lp.methodology}\n\n` +
      `✅ *सीप मूल्याङ्कन विधि:*\n${lp.assessmentMethod}\n\n` +
      `📝 *गृहकार्य / अभ्यास:*\n${lp.homework || 'लगबुक प्रमाणित गर्ने'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_CTEVT राष्ट्रिय सीप मानक शैक्षिक तयारी दस्तावेज।_`
    );
  };

  return (
    <Box sx={{ maxWidth: 1320, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* =======================================================
          1. EXECUTIVE LESSON PLAN HERO STUDIO BANNER
          ======================================================= */}
      <Card
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #071933 0%, #0F2C59 60%, #1A56B0 100%)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 16px 40px -10px rgba(7, 25, 51, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left Title & Batch Details */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#FDE047 !important' }} />}
                label="CTEVT Pedagogical Lesson Preparation"
                size="small"
                sx={{
                  bgcolor: 'rgba(254, 240, 138, 0.15)',
                  color: '#FEF08A',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(254, 240, 138, 0.3)'
                }}
              />
              <Chip
                label={`Batch: ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
              <Chip
                label={`प्रशिक्षक: ${trainer?.name || 'Assigned Instructor'}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(74, 222, 128, 0.15)',
                  color: '#86EFAC',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(74, 222, 128, 0.25)'
                }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.45rem', sm: '1.9rem', md: '2.1rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                mb: 1
              }}
            >
              Lesson Plan Studio (दैनिक पाठ योजना / तयारी)
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', maxWidth: 620, mb: 2.5, lineHeight: 1.6 }}>
              {selectedCourse?.title} को दैनिक शिक्षण-सिकाइ योजना। कार्ययोजना अनुसार कक्षामा जाने पूर्व-तयारी,
              उद्देश्य, विधि, आवश्यक सामग्री तथा मूल्याङ्कनको आधिकारिक CTEVT ढाँचा।
            </Typography>

            {/* Quick Actions */}
            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
                sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  py: 1,
                  px: 2,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%) !important'
                  }
                }}
              >
                + Prepare Lesson Plan (नयाँ पाठयोजना)
              </Button>

              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon sx={{ color: '#FDE047' }} />}
                onClick={() => setOpenAutoDraftDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  py: 1,
                  px: 2,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                1-Click Auto-Draft All
              </Button>

              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={() => {
                  setPrintTargetItem(null);
                  setOpenPrintModal(true);
                }}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.4) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  py: 1,
                  px: 1.8,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' }
                }}
              >
                A4 Official Batch Print
              </Button>
            </Stack>
          </Grid>

          {/* Right Live Pedagogical Preparation Metric */}
          <Grid item xs={12} lg={5}>
            <Box
              sx={{
                bgcolor: 'rgba(15, 30, 60, 0.75)',
                backdropFilter: 'blur(16px)',
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3.5,
                border: '1.5px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="overline" sx={{ color: '#93C5FD', fontWeight: 900, letterSpacing: '0.08em' }}>
                  🎯 LESSON PLAN COVERAGE
                </Typography>
                <Chip
                  size="small"
                  label={`${coveragePercent}% Coverage`}
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    bgcolor: coveragePercent >= 80 ? '#10B981' : '#F59E0B',
                    color: '#FFFFFF'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {totalPreparedPlans}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                  / {totalWorkPlans} Work Plans Prepared
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={coveragePercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  mb: 1.5,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: coveragePercent === 100 ? '#10B981' : '#3B82F6',
                    borderRadius: 5
                  }
                }}
              />

              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 2 }}>
                तयार भएका: <b>{totalPreparedPlans} वटा पाठयोजना</b> • बाँकी: <b>{Math.max(0, totalWorkPlans - totalPreparedPlans)} वटा</b>
              </Typography>

              {/* Micro Status Boxes */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', p: 1.2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 800, display: 'block' }}>
                      PLANS READY
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {totalPreparedPlans} सत्र तयारी पूर्ण
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', p: 1.2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 800, display: 'block' }}>
                      WORK PLANS
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {totalWorkPlans} कुल क्यालेन्डर दिन
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          2. GROUP SELECTOR, SEARCH BAR & VIEW SWITCHER
          ======================================================= */}
      <Card
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          bgcolor: '#FFFFFF'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Select Group */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              size="small"
              label="तालिम समूह छान्नुहोस् (Select Training Group)"
              fullWidth
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              {myGroups.map((grp) => {
                const c = (db.courses || []).find((x) => x.id === grp.courseId);
                return (
                  <MenuItem key={grp.id} value={grp.id}>
                    <b>{grp.groupCode}</b> — {c?.title} (Shift {grp.shift})
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          {/* Instant Search Bar */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="शीर्षक, उद्देश्य, सामग्री वा विधि खोज्नुहोस्..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2.5 }
              }}
            />
          </Grid>

          {/* View Mode Switcher */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              दृश्य:
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              size="small"
            >
              <ToggleButton value="cards" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
              </ToggleButton>
              <ToggleButton value="table" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          VIEW 1: RICH VISUAL LESSON PLAN CARDS
          ======================================================= */}
      {viewMode === 'cards' && (
        <Grid container spacing={2.5}>
          {filteredLessonPlans.map((lp, idx) => {
            const wp = (db.workPlans || []).find((w) => w.id === lp.workPlanId);
            const syl = (db.syllabi || []).find((s) => s.id === wp?.syllabusId);

            return (
              <Grid item xs={12} sm={6} md={4} key={lp.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#FFFFFF',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 28px rgba(15, 44, 89, 0.1)',
                      borderColor: '#93C5FD'
                    }
                  }}
                >
                  {/* Top Color Accent */}
                  <Box sx={{ height: 5, background: 'linear-gradient(90deg, #10B981, #2563EB)' }} />

                  {/* Header: Date, Unit Badge & ID */}
                  <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`Unit ${syl?.unitNo || '—'}`}
                          size="small"
                          sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 900, fontSize: '0.7rem', height: 22 }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          {wp?.planDate || '—'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                        {wp?.dayName} • {wp?.plannedHours || 2} घण्टे सत्र
                      </Typography>
                    </Box>

                    <Chip
                      label={lp.id}
                      size="small"
                      sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 900, fontSize: '0.68rem', height: 20 }}
                    />
                  </Box>

                  {/* Syllabus Unit Title */}
                  <Box sx={{ px: 2, pb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.3 }}>
                      {syl?.title || 'व्यावसायिक पाठयोजना'}
                    </Typography>
                  </Box>

                  {/* Learning Objectives Box */}
                  <Box sx={{ px: 2, py: 1.5, mx: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #EDF2F7', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 900, display: 'block', mb: 0.4 }}>
                      🎯 सिकाइ उद्देश्यहरू (Learning Objectives):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {lp.objectives}
                    </Typography>
                  </Box>

                  {/* Materials & Assessment Chips */}
                  <Box sx={{ px: 2, pb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, mb: 1 }}>
                      <BuildIcon sx={{ fontSize: 15, color: '#94A3B8', mt: 0.2 }} />
                      <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.3 }}>
                        <b>सामग्री:</b> {lp.materialsNeeded}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8 }}>
                      <TaskAltIcon sx={{ fontSize: 15, color: '#059669', mt: 0.2 }} />
                      <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.3 }}>
                        <b>मूल्याङ्कन:</b> {lp.assessmentMethod}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Card Actions Footer */}
                  <Box
                    sx={{
                      mt: 'auto',
                      p: 1.5,
                      px: 2,
                      borderTop: '1px solid #F1F5F9',
                      bgcolor: '#FAFAFA',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
                      onClick={() => {
                        setPrintTargetItem(lp);
                        setOpenPrintModal(true);
                      }}
                      sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', color: '#0F2C59' }}
                    >
                      A4 Print
                    </Button>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        component="a"
                        href={getWhatsAppUrl(trainer?.phone || '', getSingleLessonPlanShareText(lp))}
                        target="_blank"
                        sx={{ color: '#25D366', p: 0.5 }}
                        title="Share on WhatsApp"
                      >
                        <WhatsAppIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(lp)}
                        sx={{ color: '#1D4ED8', p: 0.5 }}
                        title="Edit Plan"
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(lp.id)}
                        sx={{ color: '#EF4444', p: 0.5 }}
                        title="Delete"
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}

          {filteredLessonPlans.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed #CBD5E1', bgcolor: '#FFFFFF' }}>
                <AssignmentIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', mb: 0.5 }}>
                  कुनै पाठयोजना फेला परेन
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                  तपाईंले नयाँ पाठयोजना थप्न वा "1-Click Auto-Draft" बाट सबै कार्ययोजनाका लागि स्वचालित पाठयोजना तयार गर्न सक्नुहुन्छ।
                </Typography>
                <Stack direction="row" spacing={1.5} justifyContent="center">
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                    + Prepare Lesson Plan
                  </Button>
                  <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setOpenAutoDraftDialog(true)}>
                    1-Click Auto-Draft All
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* =======================================================
          VIEW 2: SORTABLE TABLE VIEW
          ======================================================= */}
      {viewMode === 'table' && (
        <Card sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#0F2C59' }}>
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 60, textAlign: 'center' }}>क्र.सं.</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 140 }}>मिति र बार (Date)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 180 }}>पाठ्यक्रम शीर्षक (Unit)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>सिकाइ उद्देश्यहरू (Objectives)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>शिक्षण विधि र सामग्री (Method & Materials)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 130 }}>मूल्याङ्कन विधि</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'right', width: 110 }}>कार्य (Actions)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLessonPlans.map((lp, idx) => {
                  const wp = (db.workPlans || []).find((w) => w.id === lp.workPlanId);
                  const syl = (db.syllabi || []).find((s) => s.id === wp?.syllabusId);

                  return (
                    <TableRow key={lp.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#1D4ED8' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {wp?.planDate || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {wp?.dayName} • {wp?.plannedHours || 2}h
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`Unit ${syl?.unitNo || '—'}`}
                          size="small"
                          sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 900, fontSize: '0.68rem', height: 20, mb: 0.3 }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#334155' }}>
                          {syl?.title || 'General Vocational'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#334155', maxWidth: 260 }}>
                        {lp.objectives}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#334155', maxWidth: 280 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2C59', display: 'block' }}>
                          विधि: {lp.methodology}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                          सामग्री: {lp.materialsNeeded}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#334155' }}>
                        {lp.assessmentMethod}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPrintTargetItem(lp);
                              setOpenPrintModal(true);
                            }}
                            sx={{ color: '#0F2C59' }}
                            title="A4 Print"
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenEdit(lp)} sx={{ color: '#1D4ED8' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(lp.id)} sx={{ color: '#EF4444' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredLessonPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#94A3B8' }}>
                      कुनै पाठयोजना फेला परेन।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* =======================================================
          MODAL 1: ADD / EDIT LESSON PLAN
          ======================================================= */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#0F2C59' }}>
          {editingItem ? 'पाठयोजना सम्पादन (Edit Lesson Plan)' : '+ नयाँ दैनिक पाठयोजना सिर्जना गर्नुहोस् (Create Lesson Plan)'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.2}>
            {/* Work Plan Selector */}
            <TextField
              select
              label="सम्बन्धित कार्ययोजना दिन (Select Work Plan Date & Unit) *"
              fullWidth
              size="small"
              value={formData.workPlanId}
              onChange={(e) => handleWorkPlanSelect(e.target.value)}
              required
            >
              {availableWorkPlans.map((wp) => {
                const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
                return (
                  <MenuItem key={wp.id} value={wp.id}>
                    <b>{wp.planDate} ({wp.dayName})</b> — Unit {syl?.unitNo}: {syl?.title} ({wp.plannedHours} hrs)
                  </MenuItem>
                );
              })}
            </TextField>

            {/* Objectives */}
            <TextField
              label="विशिष्ट सिकाइ उद्देश्यहरू (Specific Learning Objectives / NOS) *"
              multiline
              rows={2.5}
              fullWidth
              size="small"
              placeholder="यस सत्र पश्चात विद्यार्थीहरूले के-के सीप हासिल गर्नेछन् र के प्रदर्शन गर्न सक्नेछन्..."
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
            />

            {/* Materials Needed */}
            <TextField
              label="आवश्यक औजार तथा तालिम सामग्री (Tools, Equipment & Materials) *"
              fullWidth
              size="small"
              placeholder="उदा: म्यानुअल, PPE किट, प्राथमिक उपचार बक्स, कार्यथलो उपकरण..."
              value={formData.materialsNeeded}
              onChange={(e) => setFormData({ ...formData, materialsNeeded: e.target.value })}
            />

            {/* 4-Step Pedagogical Methodology */}
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59', pt: 1 }}>
              ४-चरणीय शिक्षण विधि तथा समय विभाजन (Instructional Steps):
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="१. परिचय तथा सुरक्षा (Intro & Safety - 15m)"
                  fullWidth
                  size="small"
                  value={formData.introStep}
                  onChange={(e) => setFormData({ ...formData, introStep: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="२. प्रशिक्षक प्रदर्शन (Trainer Demo - 30m)"
                  fullWidth
                  size="small"
                  value={formData.demoStep}
                  onChange={(e) => setFormData({ ...formData, demoStep: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="३. विद्यार्थी अभ्यास (Trainee Practice - 60m)"
                  fullWidth
                  size="small"
                  value={formData.practiceStep}
                  onChange={(e) => setFormData({ ...formData, practiceStep: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="४. मूल्याङ्कन र समीक्षा (Review & Q&A - 15m)"
                  fullWidth
                  size="small"
                  value={formData.evalStep}
                  onChange={(e) => setFormData({ ...formData, evalStep: e.target.value })}
                />
              </Grid>
            </Grid>

            {/* Assessment & Homework */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="सीप मूल्याङ्कन विधि (Assessment Method)"
                  fullWidth
                  size="small"
                  value={formData.assessmentMethod}
                  onChange={(e) => setFormData({ ...formData, assessmentMethod: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="गृहकार्य / अभ्यास (Homework / Drill)"
                  fullWidth
                  size="small"
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                />
              </Grid>
            </Grid>

            {/* Notes */}
            <TextField
              label="विशेष निर्देशन तथा सुरक्षा सावधानी (Instructor Notes & Precautions)"
              fullWidth
              size="small"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }}>
            रद्द गर्नुहोस्
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}>
            सुरक्षित गर्नुहोस् (Save Lesson Plan)
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 2: 1-CLICK AUTO-DRAFT ALL LESSON PLANS
          ======================================================= */}
      <Dialog
        open={openAutoDraftDialog}
        onClose={() => setOpenAutoDraftDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#0F2C59', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: '#F59E0B' }} />
          1-Click Auto-Draft All Lesson Plans
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            यस सुविधाले कार्ययोजना (Work Plan) मा रहेका सम्पूर्ण <b>{availableWorkPlans.length}</b> दिनहरूको लागि CTEVT मानक ४-चरणीय शिक्षण विधि, उद्देश्य, सामग्री र मूल्याङ्कन सहितको पाठयोजना स्वतः मस्यौदा (Auto-Draft) तयार गरिदिन्छ।
          </Typography>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            बाँकी रहेका <b>{Math.max(0, totalWorkPlans - totalPreparedPlans)}</b> सत्रहरूका लागि एकै क्लिकमा पूर्ण पाठयोजना सिर्जना हुनेछ।
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAutoDraftDialog(false)} sx={{ fontWeight: 700 }}>
            रद्द
          </Button>
          <Button variant="contained" onClick={handleAutoDraftAll} sx={{ fontWeight: 900, bgcolor: '#10B981' }}>
            ⚡ स्वतः तयार गर्नुहोस् (Generate Plans)
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 3: OFFICIAL PIXEL-PERFECT CTEVT A4 PRINTABLE DOCUMENT
          ======================================================= */}
      <Dialog
        open={openPrintModal}
        onClose={() => setOpenPrintModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        {/* Print Controls Header (Hidden in Print) */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip label="A4 CTEVT Official Lesson Plan" color="primary" size="small" sx={{ fontWeight: 900 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59' }}>
              {printTargetItem ? 'एकल पाठयोजना (Single Lesson Plan)' : 'सम्पूर्ण ब्याच पाठयोजना सँगालो (Batch Compilation)'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}
            >
              प्रिन्ट (Print / PDF)
            </Button>
            <IconButton onClick={() => setOpenPrintModal(false)} sx={{ color: '#64748B' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Printable Paper Canvas */}
        <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#FFFFFF' }}>
          <Box
            id="printableLessonPlanA4"
            sx={{
              fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
              color: '#0F172A',
              maxWidth: 800,
              mx: 'auto',
              border: '2px solid #0F2C59',
              p: { xs: 2, sm: 4 },
              bgcolor: '#FFFFFF'
            }}
          >
            {/* 1. Official Institutional Letterhead */}
            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2.5px double #0F2C59', mb: 2.5 }}>
              <Typography variant="overline" sx={{ fontWeight: 900, color: '#059669', letterSpacing: '0.12em', fontSize: '0.78rem' }}>
                GOVERNMENT REGD • CTEVT ACCREDITED TECHNICAL TRAINING INSTITUTE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2C59', letterSpacing: '-0.02em', mt: 0.3 }}>
                ग्लोबल एरा प्राविधिक स्कुल (GLOBAL ERA TECHNICAL SCHOOL)
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E3E62' }}>
                KITE CAREGIVER TRAINING CENTER • Chabahil, MitraPark, Kathmandu
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                फोन: +९७७-१-४४८१२३४ | इमेल: info@globalera.edu.np | दर्ता नं: १८४९२०/०७८/०७९
              </Typography>
            </Box>

            {/* 2. Document Title Banner */}
            <Box sx={{ my: 2, textAlign: 'center', bgcolor: '#F1F5F9', py: 1, border: '1.5px solid #0F2C59', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F2C59' }}>
                दैनिक पाठ योजना (OFFICIAL VOCATIONAL LESSON PLAN)
              </Typography>
            </Box>

            {/* 3. Metadata Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
                p: 2,
                mb: 2.5,
                border: '1px solid #CBD5E1',
                bgcolor: '#F8FAFC',
                fontSize: '0.85rem'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  पाठ्यक्रम (Course):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {selectedCourse?.title} ({selectedCourse?.totalHours || 390} Hours • {selectedCourse?.level || 'CTEVT Level 1'})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  समूह (Training Batch) &amp; सिफ्ट:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  Batch: <b>{selectedGroup?.groupCode}</b> | Shift {selectedGroup?.shift} ({selectedGroup?.startTime} - {selectedGroup?.endTime})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  प्रशिक्षकको नाम (Instructor):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: '#1D4ED8' }}>
                  {trainer?.name || '—'} {trainer?.phone ? `(सम्पर्क: ${trainer.phone})` : ''}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  सत्र मिति तथा दिन (Date &amp; Day):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {printTargetItem ? (() => {
                    const wp = (db.workPlans || []).find((w) => w.id === printTargetItem.workPlanId);
                    return `${wp?.planDate} (${wp?.dayName}) • ${wp?.plannedHours || 2} Hours`;
                  })() : `${groupLessonPlans.length} वटा पाठयोजनाहरूको सँगालो`}
                </Typography>
              </Box>
            </Box>

            {/* 4. Single Detailed Lesson Plan View */}
            {printTargetItem ? (() => {
              const wp = (db.workPlans || []).find((w) => w.id === printTargetItem.workPlanId);
              const syl = (db.syllabi || []).find((s) => s.id === wp?.syllabusId);
              const methodologySteps = (printTargetItem.methodology || '').split(' | ');

              return (
                <Box>
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1.5px solid #0F2C59', mb: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                      विषय / एकाइ: UNIT {syl?.unitNo}: {syl?.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3, fontWeight: 700 }}>
                      मिति: <b>{wp?.planDate} ({wp?.dayName})</b> • निर्धारित समय: <b>{wp?.plannedHours || 2} घण्टा</b>
                    </Typography>
                  </Box>

                  <Table size="small" sx={{ border: '1.5px solid #0F2C59', mb: 3, '& td': { border: '1px solid #CBD5E1', p: 1.5, fontSize: '0.85rem' } }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, width: '32%', bgcolor: '#F1F5F9' }}>
                          १. विशिष्ट सिकाइ उद्देश्यहरू<br />
                          <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.78rem' }}>(Specific Learning Objectives)</span>
                        </TableCell>
                        <TableCell sx={{ lineHeight: 1.6 }}>
                          {printTargetItem.objectives}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#F1F5F9' }}>
                          २. आवश्यक सामग्री तथा औजारहरू<br />
                          <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.78rem' }}>(Tools, Equipment & Materials)</span>
                        </TableCell>
                        <TableCell sx={{ lineHeight: 1.6 }}>
                          {printTargetItem.materialsNeeded}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#F1F5F9' }}>
                          ३. शिक्षण विधि तथा समय विभाजन<br />
                          <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.78rem' }}>(Instructional Steps & Timing)</span>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#0F2C59', mb: 0.5 }}>
                            • चरण १ (परिचय): {methodologySteps[0] || '१५ मिनेट पूर्व-ज्ञान र सुरक्षा नियम।'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#0F2C59', mb: 0.5 }}>
                            • चरण २ (प्रदर्शन): {methodologySteps[1] || '३० मिनेट प्रशिक्षकद्वारा प्रत्यक्ष सीप प्रदर्शन।'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#0F2C59', mb: 0.5 }}>
                            • चरण ३ (अभ्यास): {methodologySteps[2] || '६० मिनेट विद्यार्थीहरूको प्रत्यक्ष प्रयोगात्मक अभ्यास।'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#0F2C59' }}>
                            • चरण ४ (समीक्षा): {methodologySteps[3] || '१५ मिनेट सीप परीक्षण र प्रश्नोत्तर।'}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#F1F5F9' }}>
                          ४. सीप दक्षता मूल्याङ्कन विधि<br />
                          <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.78rem' }}>(Competency Assessment)</span>
                        </TableCell>
                        <TableCell sx={{ lineHeight: 1.6 }}>
                          {printTargetItem.assessmentMethod}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#F1F5F9' }}>
                          ५. गृहकार्य तथा स्व-अभ्यास<br />
                          <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.78rem' }}>(Homework & Drill)</span>
                        </TableCell>
                        <TableCell sx={{ lineHeight: 1.6 }}>
                          {printTargetItem.homework}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, bgcolor: '#F1F5F9' }}>
                          ६. विशेष निर्देशन तथा टिप्पणी<br />
                          <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.78rem' }}>(Instructor Remarks & Safety Notes)</span>
                        </TableCell>
                        <TableCell sx={{ lineHeight: 1.6 }}>
                          {printTargetItem.notes}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              );
            })() : (
              /* Batch Compilation Table View */
              <TableContainer sx={{ border: '1.5px solid #0F2C59', mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2C59' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 45, textAlign: 'center' }}>क्र.सं.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 95 }}>मिति र बार</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 140 }}>पाठ्यक्रम शीर्षक</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>सिकाइ उद्देश्यहरू</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>विधि तथा सामग्री</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 100 }}>मूल्याङ्कन</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupLessonPlans.map((lp, idx) => {
                      const wp = (db.workPlans || []).find((w) => w.id === lp.workPlanId);
                      const syl = (db.syllabi || []).find((s) => s.id === wp?.syllabusId);
                      return (
                        <TableRow key={lp.id} sx={{ '& td': { border: '1px solid #CBD5E1', fontSize: '0.8rem' } }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{idx + 1}</TableCell>
                          <TableCell>
                            <b>{wp?.planDate}</b>
                            <br />
                            <span style={{ color: '#64748B' }}>{wp?.dayName}</span>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>
                            Unit {syl?.unitNo || ''}: {syl?.title || ''}
                          </TableCell>
                          <TableCell>{lp.objectives}</TableCell>
                          <TableCell>
                            <b>विधि:</b> {lp.methodology}<br />
                            <b>सामग्री:</b> {lp.materialsNeeded}
                          </TableCell>
                          <TableCell>{lp.assessmentMethod}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* 5. Official 3-Tier CTEVT Inspection Signatures */}
            <Grid container spacing={3} sx={{ pt: 3 }}>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    प्रशिक्षकको दस्तखत (Trainer)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {trainer?.name || 'Lead Trainer'}<br />Date: {new Date().toISOString().slice(0, 10)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    पाठ्यक्रम संयोजक (Curriculum Coordinator)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Approved by CTEVT Lead<br />Signature &amp; Date
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    क्याम्पस प्रमुख / प्रिन्सिपल (Principal)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Official Seal &amp; Signature
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setOpenPrintModal(false)} sx={{ fontWeight: 700 }}>
            बन्द गर्नुहोस्
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}>
            प्रिन्ट गर्नुहोस् (Print A4)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
