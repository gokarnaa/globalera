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
  Alert,
  LinearProgress,
  Paper,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Avatar
} from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BuildIcon from '@mui/icons-material/Build';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';

export default function SyllabusManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer, isAdmin } = useAuth();

  const [selectedCourseId, setSelectedCourseId] = useState(db.courses[0]?.id || '');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Dialog States
  const [openSingleDialog, setOpenSingleDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [openDocDialog, setOpenDocDialog] = useState(false);

  // Single Unit Form
  const [formData, setFormData] = useState({
    courseId: selectedCourseId,
    unitNo: 1,
    title: '',
    theoryHours: 10,
    practicalHours: 30,
    learningOutcome: '',
    toolsAndMaterials: '',
    keyTasks: ''
  });

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState('append'); // 'append' | 'replace'
  const [bulkError, setBulkError] = useState('');

  const selectedCourse = db.courses.find((c) => c.id === selectedCourseId);
  const courseSyllabi = useMemo(() => {
    return (db.syllabi || [])
      .filter((s) => s.courseId === selectedCourseId)
      .sort((a, b) => Number(a.unitNo) - Number(b.unitNo));
  }, [db.syllabi, selectedCourseId]);

  // Statistics & Hours Allocation
  const totalTheoryHours = courseSyllabi.reduce((sum, s) => sum + (Number(s.theoryHours) || 0), 0);
  const totalPracticalHours = courseSyllabi.reduce((sum, s) => sum + (Number(s.practicalHours) || 0), 0);
  const totalSyllabusHours = totalTheoryHours + totalPracticalHours;
  const courseTargetHours = selectedCourse?.totalHours || 390;
  const hoursPercentage = Math.min(100, Math.round((totalSyllabusHours / courseTargetHours) * 100));

  const practicalRatio = totalSyllabusHours > 0 ? Math.round((totalPracticalHours / totalSyllabusHours) * 100) : 80;
  const theoryRatio = 100 - practicalRatio;

  // Single Add / Edit Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      courseId: selectedCourseId,
      unitNo: courseSyllabi.length + 1,
      title: '',
      theoryHours: 10,
      practicalHours: 30,
      learningOutcome: '',
      toolsAndMaterials: '',
      keyTasks: ''
    });
    setOpenSingleDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      theoryHours: item.theoryHours || 0,
      practicalHours: item.practicalHours || 0,
      toolsAndMaterials: item.toolsAndMaterials || '',
      keyTasks: item.keyTasks || ''
    });
    setOpenSingleDialog(true);
  };

  const handleSaveSingle = () => {
    if (!formData.title.trim()) {
      alert('Syllabus unit title is required.');
      return;
    }

    const calcTotal = (Number(formData.theoryHours) || 0) + (Number(formData.practicalHours) || 0);
    const payload = {
      ...formData,
      totalHours: calcTotal
    };

    let updatedList = [...db.syllabi];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...payload } : x
      );
    } else {
      const newId = `SYL-${Date.now().toString().slice(-4)}`;
      updatedList.push({ id: newId, ...payload });
    }

    let nextDb = { ...db, syllabi: updatedList };
    nextDb = logAudit(
      nextDb,
      editingItem ? 'UPDATE' : 'CREATE',
      'Syllabus',
      editingItem?.id || 'NEW',
      `Syllabus Unit ${formData.unitNo} (${formData.title}) updated for ${selectedCourse?.title}`,
      currentUser?.name || 'Admin'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenSingleDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('के तपाईं निश्चित हुनुहुन्छ? यो पाठ्यक्रम एकाइ मेटिनेछ।')) {
      const deletedItem = db.syllabi.find((x) => x.id === id);
      let updatedList = db.syllabi.filter((x) => x.id !== id);
      let nextDb = { ...db, syllabi: updatedList };
      nextDb = logAudit(
        nextDb,
        'DELETE',
        'Syllabus',
        id,
        `Syllabus unit (${deletedItem?.title || id}) deleted from ${selectedCourse?.title}`,
        currentUser?.name || 'Admin'
      );
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // ----------------------------------------------------
  // BULK CSV / TEXT IMPORT LOGIC
  // ----------------------------------------------------
  const parsedBulkUnits = useMemo(() => {
    if (!bulkText.trim()) return [];

    const lines = bulkText.trim().split('\n');
    const results = [];

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) return;

      // Skip header lines
      if (
        index === 0 &&
        (line.toLowerCase().includes('unit no') ||
          line.toLowerCase().includes('unit title') ||
          line.toLowerCase().includes('title'))
      ) {
        return;
      }

      // Support either CSV (comma-separated) or TSV (tab-separated from Excel)
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 2) {
        const unitNo = Number(parts[0]) || results.length + 1;
        const title = parts[1] || '';
        const theoryHours = Number(parts[2]) || 0;
        const practicalHours = Number(parts[3]) || 0;
        const learningOutcome = parts[4] || '';
        const toolsAndMaterials = parts[5] || '';

        if (title) {
          results.push({
            unitNo,
            title,
            theoryHours,
            practicalHours,
            totalHours: theoryHours + practicalHours,
            learningOutcome,
            toolsAndMaterials
          });
        }
      }
    });

    return results;
  }, [bulkText]);

  const handleDownloadSampleCSV = () => {
    const sampleData = `Unit No,Unit Title,Theory Hours,Practical Hours,Learning Outcomes,Tools & Materials
1,Orientation & TVET Concepts,4,6,Understand institutional norms and safety protocols,Projector, Whiteboard, Notebook
2,Fundamental Patient Care & Hygiene,10,30,Master bed making, sponge bathing and infection control,Hospital Bed, Linens, Basin, Gloves, Towels
3,Vital Signs Monitoring,8,22,Measure and record Blood Pressure, Pulse, Temperature & SpO2,Sphygmomanometer, Stethoscope, Digital Thermometer, Oximeter
4,Nutrition & Meal Assistance,6,24,Prepare special diets, feed dysphagia patients safely,Feeding Tray, Pureed Diet, Measuring Cup, Apron
5,Emergency First Aid & CPR,8,22,Perform Adult CPR and manage choking, bleeding, burns,CPR Mannequin, First Aid Kit, Bandages, Splints
6,Elderly Care & Assistive Devices,8,32,Transfer wheelchair patients, use walking frames and crutches,Wheelchair, Walker, Transfer Belt, Crutches`;

    const blob = new Blob(['\uFEFF' + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sample_CTEVT_Syllabus_Template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setBulkText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = () => {
    if (parsedBulkUnits.length === 0) {
      setBulkError('कुनै मान्य एकाइ भेटिएन (No valid units found). Please check your file/text format.');
      return;
    }

    let currentList = [...db.syllabi];
    if (bulkMode === 'replace') {
      currentList = currentList.filter((x) => x.courseId !== selectedCourseId);
    }

    const startIdx = bulkMode === 'append' ? currentList.filter((x) => x.courseId === selectedCourseId).length : 0;

    const newEntries = parsedBulkUnits.map((u, i) => ({
      id: `SYL-${Date.now()}-${i}`,
      courseId: selectedCourseId,
      unitNo: u.unitNo || startIdx + i + 1,
      title: u.title,
      theoryHours: u.theoryHours,
      practicalHours: u.practicalHours,
      totalHours: u.totalHours,
      learningOutcome: u.learningOutcome,
      toolsAndMaterials: u.toolsAndMaterials
    }));

    const updatedList = [...currentList, ...newEntries];
    let nextDb = { ...db, syllabi: updatedList };

    nextDb = logAudit(
      nextDb,
      'CREATE',
      'Syllabus',
      selectedCourseId,
      `Bulk imported ${newEntries.length} units to ${selectedCourse?.title} (Mode: ${bulkMode})`,
      currentUser?.name || 'Admin'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenBulkDialog(false);
    setBulkText('');

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // WhatsApp Share Text Generator
  const generateWhatsAppShareText = () => {
    if (!selectedCourse) return '';
    let msg = `*ग्लोबल एरा प्राविधिक स्कुल (Global Era Technical School)*\n`;
    msg += `📚 *पाठ्यक्रम रूपरेखा (Curriculum Outline)*: ${selectedCourse.title}\n`;
    msg += `⏱ *कुल तालिम अवधि*: ${courseTargetHours} घण्टा (Practical: ${totalPracticalHours} hrs [${practicalRatio}%], Theory: ${totalTheoryHours} hrs [${theoryRatio}%])\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*मुख्य पाठ्यक्रम एकाइहरू (Curriculum Units)*:\n`;

    courseSyllabi.forEach((u) => {
      msg += `🔹 *Unit ${u.unitNo}:* ${u.title} (${u.totalHours} hrs - Practical: ${u.practicalHours}h, Theory: ${u.theoryHours}h)\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 *ठेगाना*: मित्रपार्क, काठमाडौँ | 📞 *सम्पर्क*: ९८५१००००००\n`;
    msg += `🌐 *CTEVT मान्यता प्राप्त प्राविधिक तालिम*`;
    return msg;
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppShareText();
    const url = getWhatsAppUrl('', text);
    window.open(url, '_blank');
  };

  const handleCopyShareText = () => {
    const text = generateWhatsAppShareText();
    navigator.clipboard.writeText(text);
    alert('पाठ्यक्रम रूपरेखा क्लिपबोर्डमा कपी भयो (Copied to Clipboard)!');
  };

  return (
    <Box sx={{ maxWidth: 1250, mx: 'auto', p: { xs: 0.5, sm: 1.5 } }}>
      {/* =======================================================
          TOP BAR & ACTION BUTTONS
          ======================================================= */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <MenuBookIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#152238' }}>
              Curriculum &amp; Syllabus Studio (पाठ्यक्रम व्यवस्थापन)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.3 }}>
            CTEVT मापदण्ड अनुसारको एकाइ, प्रयोगात्मक र सैद्धान्तिक घण्टा, सिकाइ उपलब्धि तथा आवश्यक सामग्रीहरूको व्यवस्थापन।
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => setOpenDocDialog(true)}
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2.5,
              borderColor: '#94a3b8',
              color: '#1e293b'
            }}
          >
            आधिकारिक ढाँचा (Print / PDF)
          </Button>

          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={handleShareWhatsApp}
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2.5,
              color: '#16a34a',
              borderColor: '#86efac',
              bgcolor: '#f0fdf4',
              '&:hover': { bgcolor: '#dcfce7', borderColor: '#4ade80' }
            }}
          >
            Share Curriculum
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => setOpenBulkDialog(true)}
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2.5,
              color: '#0284c7',
              borderColor: '#7dd3fc',
              bgcolor: '#f0f9ff',
              '&:hover': { bgcolor: '#e0f2fe' }
            }}
          >
            बल्क इम्पोर्ट (CSV)
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2.5,
              bgcolor: '#1a56b0',
              boxShadow: '0 4px 14px rgba(26,86,176,0.3)',
              '&:hover': { bgcolor: '#0d3466' }
            }}
          >
            + Add Unit
          </Button>
        </Box>
      </Box>

      {/* =======================================================
          COURSE SELECTOR & CURRICULUM RATIO KPI BANNER
          ======================================================= */}
      <Card
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 3.5,
          border: '1px solid #dce5f2',
          boxShadow: '0 4px 20px rgba(13, 52, 102, 0.06)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        <Grid container spacing={2.5} alignItems="center">
          {/* Course Selector */}
          <Grid item xs={12} md={4}>
            <TextField
              select
              size="small"
              label="पाठ्यक्रम चयन गर्नुहोस् (Select Course)"
              fullWidth
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              sx={{ bgcolor: '#fff' }}
            >
              {db.courses.map((crs) => (
                <MenuItem key={crs.id} value={crs.id}>
                  <b>{crs.title}</b> ({crs.totalHours || 390} Hours)
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Practical vs Theory Ratio Visualization */}
          <Grid item xs={12} md={5}>
            <Box sx={{ bgcolor: '#fff', p: 1.8, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>
                  घण्टा विनियोजन (HOURS ALLOCATION):
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                  {totalSyllabusHours} / {courseTargetHours} Hours ({hoursPercentage}%)
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={hoursPercentage}
                sx={{
                  height: 9,
                  borderRadius: 4.5,
                  bgcolor: '#e2e8f0',
                  mb: 1.2,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: hoursPercentage === 100 ? '#16834b' : '#1a56b0',
                    borderRadius: 4.5
                  }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={`Practical: ${totalPracticalHours} hrs (${practicalRatio}%)`}
                  size="small"
                  sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 900, fontSize: '0.72rem' }}
                />
                <Chip
                  label={`Theory: ${totalTheoryHours} hrs (${theoryRatio}%)`}
                  size="small"
                  sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 900, fontSize: '0.72rem' }}
                />
                <Chip
                  label={`Units: ${courseSyllabi.length}`}
                  size="small"
                  sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 800, fontSize: '0.72rem' }}
                />
              </Box>
            </Box>
          </Grid>

          {/* View Mode Toggle & Quick Info */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                दृश्य (View):
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, next) => next && setViewMode(next)}
                size="small"
                sx={{ bgcolor: '#fff' }}
              >
                <ToggleButton value="cards" sx={{ fontWeight: 700, px: 1.5 }}>
                  <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
                </ToggleButton>
                <ToggleButton value="table" sx={{ fontWeight: 700, px: 1.5 }}>
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Typography variant="caption" sx={{ color: '#647089', fontStyle: 'italic' }}>
              CTEVT Level 1 &amp; NSTB Competency Standard
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          VIEW MODE 1: VISUALLY APPEALING UNIT CARDS
          ======================================================= */}
      {viewMode === 'cards' ? (
        <Grid container spacing={2.5}>
          {courseSyllabi.map((syl) => (
            <Grid item xs={12} sm={6} md={4} key={syl.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 28px rgba(13, 52, 102, 0.1)',
                    borderColor: '#93c5fd'
                  }
                }}
              >
                {/* Card Header */}
                <Box
                  sx={{
                    p: 2,
                    pb: 1.5,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1
                  }}
                >
                  <Box>
                    <Chip
                      label={`UNIT #${syl.unitNo}`}
                      size="small"
                      sx={{
                        bgcolor: '#0d3466',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '0.72rem',
                        mb: 0.8
                      }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {syl.title}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpenEdit(syl)} sx={{ color: '#1a56b0' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(syl.id)} sx={{ color: '#d5372f' }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Card Body */}
                <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Hours Chips */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Total: ${syl.totalHours || (Number(syl.theoryHours) || 0) + (Number(syl.practicalHours) || 0)}h`}
                      size="small"
                      sx={{ bgcolor: '#f1f5f9', color: '#1e293b', fontWeight: 900 }}
                    />
                    <Chip
                      label={`Practical: ${syl.practicalHours || 0}h`}
                      size="small"
                      sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 800 }}
                    />
                    <Chip
                      label={`Theory: ${syl.theoryHours || 0}h`}
                      size="small"
                      sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}
                    />
                  </Box>

                  {/* Learning Outcome Statement */}
                  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #edf2f7' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.3 }}>
                      🎯 सिकाइ उपलब्धि (Learning Outcomes / NOS):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {syl.learningOutcome || 'Practical competency skills and workplace protocols.'}
                    </Typography>
                  </Box>

                  {/* Tools and Materials */}
                  {syl.toolsAndMaterials && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 'auto', pt: 0.5 }}>
                      <BuildIcon sx={{ fontSize: 16, color: '#94a3b8', mt: 0.3 }} />
                      <Typography variant="caption" sx={{ color: '#647089', lineHeight: 1.4 }}>
                        <b>औजार/सामग्री:</b> {syl.toolsAndMaterials}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}

          {courseSyllabi.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3.5, border: '1px dashed #cbd5e1' }}>
                <MenuBookIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155' }}>
                  यो कोर्समा कुनै पाठ्यक्रम एकाइ थपिएको छैन
                </Typography>
                <Typography variant="body2" sx={{ color: '#647089', mb: 2.5 }}>
                  तपाईंले "+ Add Unit" मार्फत एकल एकाइ थप्न सक्नुहुन्छ वा "बल्क इम्पोर्ट (CSV)" बाट एकैपटक सम्पूर्ण सिलेबस लोड गर्न सक्नुहुन्छ।
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                    + Add Unit
                  </Button>
                  <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => setOpenBulkDialog(true)}>
                    बल्क इम्पोर्ट (CSV)
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        /* =======================================================
            VIEW MODE 2: CTEVT STANDARD TABLE VIEW
            ======================================================= */
        <Card sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.05)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#0d3466' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, width: 70, textAlign: 'center' }}>Unit #</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800 }}>पाठ्यक्रम एकाइ शीर्षक (Unit Title)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>Theory</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>Practical</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>Total Hours</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800 }}>सिकाइ उपलब्धि (Learning Outcomes / NOS)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800 }}>औजार र सामग्रीहरू (Tools &amp; Equipment)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courseSyllabi.map((syl) => (
                  <TableRow key={syl.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fbfcfd' } }}>
                    <TableCell sx={{ fontWeight: 900, color: '#1a56b0', textAlign: 'center' }}>
                      #{syl.unitNo}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {syl.title}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center', color: '#0369a1' }}>
                      {syl.theoryHours}h
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center', color: '#16834b' }}>
                      {syl.practicalHours}h
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#1e293b' }}>
                      {syl.totalHours || (Number(syl.theoryHours) || 0) + (Number(syl.practicalHours) || 0)}h
                    </TableCell>
                    <TableCell sx={{ color: '#334155', fontSize: '0.85rem' }}>
                      {syl.learningOutcome || 'Competency standard tasks.'}
                    </TableCell>
                    <TableCell sx={{ color: '#647089', fontSize: '0.82rem' }}>
                      {syl.toolsAndMaterials || 'Standard workshop tools.'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(syl)} sx={{ color: '#1a56b0' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(syl.id)} sx={{ color: '#d5372f' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

                {courseSyllabi.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                      No syllabus units added yet for this course. Click "+ Add Unit" to start.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* =======================================================
          MODAL 1: ADD / EDIT SINGLE SYLLABUS UNIT
          ======================================================= */}
      <Dialog
        open={openSingleDialog}
        onClose={() => setOpenSingleDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0d3466', color: '#fff', fontWeight: 800 }}>
          {editingItem ? 'Edit Syllabus Unit' : `Add Unit to ${selectedCourse?.title}`}
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  type="number"
                  label="Unit No"
                  fullWidth
                  size="small"
                  value={formData.unitNo}
                  onChange={(e) => setFormData({ ...formData, unitNo: Number(e.target.value) })}
                  required
                  sx={{ bgcolor: '#fff' }}
                />
              </Grid>
              <Grid item xs={9}>
                <TextField
                  label="एकाइ शीर्षक (Unit Title)"
                  fullWidth
                  size="small"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="जस्तै: Vital Signs Monitoring / Facial Anatomy"
                  required
                  sx={{ bgcolor: '#fff' }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  type="number"
                  label="Theory Hours"
                  fullWidth
                  size="small"
                  value={formData.theoryHours}
                  onChange={(e) => setFormData({ ...formData, theoryHours: Number(e.target.value) })}
                  sx={{ bgcolor: '#fff' }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  type="number"
                  label="Practical Hours"
                  fullWidth
                  size="small"
                  value={formData.practicalHours}
                  onChange={(e) => setFormData({ ...formData, practicalHours: Number(e.target.value) })}
                  sx={{ bgcolor: '#fff' }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Total Hours"
                  fullWidth
                  size="small"
                  disabled
                  value={(Number(formData.theoryHours) || 0) + (Number(formData.practicalHours) || 0)}
                  helperText="Auto Calculated"
                  sx={{ bgcolor: '#f1f5f9' }}
                />
              </Grid>
            </Grid>

            <TextField
              label="सिकाइ उपलब्धि / कार्यहरू (Learning Outcomes / Tasks)"
              multiline
              rows={3}
              fullWidth
              value={formData.learningOutcome}
              onChange={(e) => setFormData({ ...formData, learningOutcome: e.target.value })}
              placeholder="विद्यार्थीले यो एकाइ सकेपछि गर्न सक्ने मुख्य सीपहरू र उपलब्धि..."
              sx={{ bgcolor: '#fff' }}
            />

            <TextField
              label="आवश्यक औजार र कच्चा सामग्रीहरू (Tools & Equipment)"
              fullWidth
              size="small"
              value={formData.toolsAndMaterials}
              onChange={(e) => setFormData({ ...formData, toolsAndMaterials: e.target.value })}
              placeholder="जस्तै: Sphygmomanometer, First Aid Kit, Linens, Gloves"
              sx={{ bgcolor: '#fff' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenSingleDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSingle} sx={{ fontWeight: 800, bgcolor: '#0d3466' }}>
            Save Unit
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 2: BULK IMPORT SYLLABUS (CSV / TEXT PASTE)
          ======================================================= */}
      <Dialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0d3466', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileUploadIcon />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Bulk Import Syllabus Units to {selectedCourse?.title}
            </Typography>
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadSampleCSV}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'none' }}
          >
            Download Sample CSV
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          {bulkError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setBulkError('')}>
              {bulkError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ border: '2px dashed #cbd5e1', p: 2, borderRadius: 2.5, bgcolor: '#fff', textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  CSV फाइल अपलोड गर्नुहोस् (Upload CSV)
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089', display: 'block', mb: 1.5 }}>
                  एक्सलबाट सेभ गरिएको .csv फाइल सिधै छनोट गर्नुहोस्
                </Typography>
                <Button variant="outlined" component="label" size="small" startIcon={<FileUploadIcon />}>
                  Choose CSV File
                  <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  इम्पोर्ट मोड (Import Mode):
                </Typography>
                <TextField
                  select
                  size="small"
                  fullWidth
                  value={bulkMode}
                  onChange={(e) => setBulkMode(e.target.value)}
                >
                  <MenuItem value="append">थप्नुहोस् (Append to existing units)</MenuItem>
                  <MenuItem value="replace">पुरानो हटाएर नयाँ राख्नुहोस् (Replace all course units)</MenuItem>
                </TextField>
                <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1 }}>
                  ढाँचा: <code>Unit No, Unit Title, Theory, Practical, Learning Outcomes, Tools</code>
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <TextField
            label="अथवा यहाँ सिधै टेबल वा टेक्स्ट पेस्ट गर्नुहोस् (Paste Data from Excel/PDF):"
            multiline
            rows={5}
            fullWidth
            placeholder="1, Patient Hygiene, 10, 30, Bed bath protocol, Linens and basin&#10;2, Vital Signs, 8, 22, Blood pressure reading, Sphygmomanometer"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            sx={{ bgcolor: '#fff', mb: 2 }}
          />

          {/* Live Preview Table */}
          {parsedBulkUnits.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#16834b' }}>
                ✓ पूर्वावलोकन (Live Preview): {parsedBulkUnits.length} एकाइहरू पहिचान गरियो
              </Typography>
              <TableContainer sx={{ maxHeight: 220, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fff' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Unit Title</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Theory</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Practical</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Outcomes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedBulkUnits.map((u, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 800 }}>{u.unitNo}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{u.title}</TableCell>
                        <TableCell>{u.theoryHours}h</TableCell>
                        <TableCell>{u.practicalHours}h</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#1a56b0' }}>{u.totalHours}h</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#647089' }}>{u.learningOutcome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenBulkDialog(false)} sx={{ fontWeight: 700 }}>
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            variant="contained"
            disabled={parsedBulkUnits.length === 0}
            onClick={handleConfirmBulkImport}
            sx={{ fontWeight: 900, bgcolor: '#16834b', '&:hover': { bgcolor: '#116536' } }}
          >
            Confirm &amp; Import All ({parsedBulkUnits.length} Units)
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 3: OFFICIAL PRINTABLE A4 CURRICULUM PROSPECTUS
          ======================================================= */}
      <Dialog
        open={openDocDialog}
        onClose={() => setOpenDocDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0d3466', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            CTEVT आधिकारिक पाठ्यक्रम विवरण (Curriculum Prospectus)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ bgcolor: '#fff', color: '#0d3466', fontWeight: 800 }}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyShareText}
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', fontWeight: 800 }}
            >
              Copy Text
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#fff' }}>
          {/* Official Letterhead */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px solid #0d3466', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0d3466', letterSpacing: 0.5 }}>
              ग्लोबल एरा प्राविधिक स्कुल
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a56b0' }}>
              GLOBAL ERA TECHNICAL SCHOOL &amp; RESEARCH CENTER
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
              MitraPark, Chabahil, Kathmandu | Phone: +977-1-4488990 | CTEVT Affiliation Code: GETS-2081-TVET
            </Typography>
            <Chip
              label="CTEVT COMPETENCY BASED CURRICULUM OUTLINE"
              size="small"
              sx={{ bgcolor: '#0d3466', color: '#fff', fontWeight: 900, mt: 1, px: 1 }}
            />
          </Box>

          {/* Course Details Block */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                पाठ्यक्रम (Course):
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {selectedCourse?.title}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                कुल तालिम अवधि:
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {courseTargetHours} Hours (3 Months)
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                सैद्धान्तिक (Theory):
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0284c7' }}>
                {totalTheoryHours} Hours ({theoryRatio}%)
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                प्रयोगात्मक (Practical):
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#16834b' }}>
                {totalPracticalHours} Hours ({practicalRatio}%)
              </Typography>
            </Grid>
          </Grid>

          {/* Curriculum Table */}
          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#0d3466' }}>
            पाठ्यक्रम एकाइ तथा सीप विवरण (Curriculum Units &amp; Competencies):
          </Typography>

          <TableContainer sx={{ border: '1px solid #cbd5e1', borderRadius: 1.5, mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, width: 50, textAlign: 'center' }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>सीप / एकाइ शीर्षक (Competency / Task Title)</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center' }}>Theory</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center' }}>Practical</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>सिकाइ उपलब्धि (Learning Outcomes / NOS)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courseSyllabi.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>{u.unitNo}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{u.title}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{u.theoryHours}h</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{u.practicalHours}h</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 900 }}>{u.totalHours}h</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#475569' }}>{u.learningOutcome}</TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 900, textAlign: 'right' }}>
                    कुल जम्मा (Total Allocated Hours):
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#0284c7' }}>
                    {totalTheoryHours}h
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#16834b' }}>
                    {totalPracticalHours}h
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#0d3466', fontSize: '0.95rem' }}>
                    {totalSyllabusHours}h
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#647089' }}>
                    Target: {courseTargetHours} Hours ({hoursPercentage}% Met)
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Assessment Criteria Note */}
          <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0', mb: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#334155' }}>
              मूल्यांकन तथा प्रमाणीकरण मापदण्ड (Assessment &amp; Certification Criteria):
            </Typography>
            <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 0.3 }}>
              १. प्रयोगात्मक परीक्षामा कम्तीमा ८०% सीप दक्षता (Mastered) अनिवार्य हुनुपर्नेछ।<br />
              २. नियमित हाजिरी न्यूनतम ८५% पूरा गरेका प्रशिक्षार्थी मात्र अन्तिम सीप परीक्षणमा समावेश हुन पाउनेछन्।
            </Typography>
          </Box>

          {/* Signature Blocks */}
          <Grid container spacing={4} sx={{ pt: 3 }}>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ borderTop: '1px dashed #647089', pt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  पाठ्यक्रम संयोजक (Curriculum In-charge)
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  Signature &amp; Date
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ borderTop: '1px dashed #647089', pt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  प्रशिक्षक (Lead Instructor)
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  Signature &amp; Date
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ borderTop: '1px dashed #647089', pt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  प्रिन्सिपल / क्याम्पस प्रमुख (Principal)
                </Typography>
                <Typography variant="caption" sx={{ color: '#647089' }}>
                  Official Stamp &amp; Signature
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenDocDialog(false)} sx={{ fontWeight: 700 }}>
            बन्द गर्नुहोस् (Close)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
