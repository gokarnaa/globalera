import React, { useState } from 'react';
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
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  Paper,
  LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import KeyIcon from '@mui/icons-material/Key';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { QRCodeSVG } from 'qrcode.react';
import { loadDB, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useDialog } from '../../context/DialogContext';

export default function TrainerManager() {
  const { confirm, alert } = useDialog();
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [profileTrainer, setProfileTrainer] = useState(null);
  const [profileTab, setProfileTab] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    occupationId: '',
    pin: '1234',
    specialization: '',
    status: 'Active',
    photo: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      phone: '',
      occupationId: '',
      pin: '',
      specialization: '',
      status: 'Active',
      photo: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.pin.trim()) {
      alert('Trainer Name, Phone, and 4-Digit PIN are required.');
      return;
    }
    if (formData.pin.length !== 4) {
      alert('PIN must be exactly 4 digits.');
      return;
    }

    let updatedList = [...db.trainers];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `TRN-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    const nextDb = { ...db, trainers: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
    const trn = (db.trainers || []).find((x) => x.id === id);
    const assignedBatches = (db.trainingGroups || []).filter((g) => g.trainerId === id);

    if (assignedBatches.length > 0) {
      await alert({
        type: 'warning',
        title: 'प्रशिक्षक मेटाउन नमिल्ने (Trainer Assigned)',
        message: `प्रशिक्षक "${trn?.name || id}" हाल ${assignedBatches.length} वटा तालिम ब्याचहरूमा तोकिएका छन्।`,
        detail: 'पहिले सम्बन्धित समूहहरूबाट प्रशिक्षक परिवर्तन गर्नुहोस् वा ब्याच हटाउनुहोस्।'
      });
      return;
    }

    const ok = await confirm({
      type: 'danger',
      title: 'प्रशिक्षक मेटाउने निश्चित गर्नुहोस् (Delete Trainer)',
      message: `के तपाईं प्रशिक्षक "${trn?.name || id}" लाई प्रणालीबाट हटाउन निश्चित हुनुहुन्छ?`,
      detail: 'यो कार्यपछि प्रशिक्षकको प्रोफाइल र लगइन विवरण हट्नेछ।',
      confirmText: 'हो, मेटाउनुहोस् (Delete)',
      confirmColor: '#DC2626'
    });

    if (ok) {
      const nextDb = {
        ...db,
        trainers: db.trainers.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PeopleAltIcon sx={{ color: '#1a56b0', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Trainer Master (प्रशिक्षक)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Manage instructors, 4-digit mobile PIN codes, specialization, and login QR cards.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          + Add Trainer
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table>
            <TableHead
              sx={{
                bgcolor: '#0F2E5A',
                '& .MuiTableCell-head': {
                  bgcolor: '#0F2E5A !important',
                  color: '#FFFFFF !important',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  py: 1.5,
                  borderBottom: '2px solid #F59E0B'
                }
              }}
            >
              <TableRow>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>
                  क्र.सं. (S.N.)
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्रशिक्षक (Trainer)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>पेशा तथा विज्ञता (Specialization)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सम्पर्क र WhatsApp</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सुरक्षा पिन (PIN)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>तोकिएको तालिम समूह (Batches)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>स्थिति (Status)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>कार्यहरू (Actions)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {db.trainers.map((trn, idx) => {
                const occ = db.occupations.find((o) => o.id === trn.occupationId);
                const assignedGroups = (db.trainingGroups || []).filter((g) => g.trainerId === trn.id);

                return (
                  <TableRow key={trn.id} hover>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={trn.photo} sx={{ width: 42, height: 42, bgcolor: '#1a9c5c', fontWeight: 700 }}>
                          {trn.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {trn.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089' }}>
                            {trn.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={occ?.name || 'General'} size="small" sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700, mb: 0.5, display: 'block', width: 'fit-content' }} />
                      <Typography variant="caption" sx={{ color: '#647089' }}>
                        {trn.specialization || 'Instructor'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {trn.phone}
                        </Typography>
                        <IconButton
                          size="small"
                          component="a"
                          href={getWhatsAppUrl(trn.phone, `Namaste ${trn.name}, your KITE Trainer PIN is ${trn.pin}.`)}
                          target="_blank"
                          sx={{ color: '#25D366' }}
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<KeyIcon fontSize="small" />}
                        label={`PIN: ${trn.pin}`}
                        size="small"
                        sx={{ bgcolor: '#f1f5f9', fontWeight: 800, color: '#334155' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {assignedGroups.map((g) => g.groupCode).join(', ') || 'No active batch'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trn.status}
                        size="small"
                        sx={{
                          bgcolor: trn.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                          color: trn.status === 'Active' ? '#16834b' : '#d5372f',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Tooltip title="View Trainer 360° Profile">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setProfileTrainer(trn);
                            setProfileTab(0);
                          }}
                          sx={{ color: '#1a56b0' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Login QR Code">
                        <IconButton size="small" onClick={() => setQrModalItem(trn)} sx={{ color: '#1a56b0' }}>
                          <QrCode2Icon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => handleOpenEdit(trn)} sx={{ color: '#1a56b0' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(trn.id)} sx={{ color: '#d5372f' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: { backdropFilter: 'blur(5px)', bgcolor: 'rgba(15, 23, 42, 0.45)' }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <SchoolIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2, color: '#FFFFFF' }}>
                {editingItem ? 'प्रशिक्षक विवरण सम्पादन (Edit Trainer)' : 'नयाँ मुख्य प्रशिक्षक दर्ता (Add New Trainer)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {editingItem ? 'प्रशिक्षक प्रोफाइल, मोबाइल PIN र विज्ञता अद्यावधिक गर्नुहोस्' : 'प्रशिक्षकको व्यक्तिगत विवरण, ४-अंकको सुरक्षा पिन र विषय दर्ता गर्नुहोस्'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setOpenDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 3,
            bgcolor: '#FFFFFF',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Trainer Full Name *"
              fullWidth
              size="small"
              placeholder="उदा: Pooja Rajbanshi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Mobile Number (for WhatsApp/SMS) *"
              fullWidth
              size="small"
              placeholder="98XXXXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <TextField
              select
              label="Primary Occupation Specialization *"
              fullWidth
              size="small"
              value={formData.occupationId}
              onChange={(e) => setFormData({ ...formData, occupationId: e.target.value })}
              required
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- पेशा चयन गर्नुहोस् (Select Occupation) --
              </MenuItem>
              {db.occupations.map((occ) => (
                <MenuItem key={occ.id} value={occ.id}>
                  {occ.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="4-Digit Security PIN (for mobile unlock) *"
              fullWidth
              size="small"
              type="password"
              inputProps={{ maxLength: 4 }}
              placeholder="उदा: 1234"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              helperText="प्रशिक्षकले मोबाइलबाट लगइन गर्दा यो ४-अंकको PIN प्रयोग गर्नेछन्।"
              required
            />
            <TextField
              label="Specialization Details"
              fullWidth
              size="small"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="उदा: Cosmetology & Hair Styling / Caregiver"
            />
            <TextField
              label="Photo URL (Optional)"
              fullWidth
              size="small"
              placeholder="https://example.com/trainer-photo.jpg"
              value={formData.photo}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
            />
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="Active">Active (सक्रिय)</MenuItem>
              <MenuItem value="Inactive">Inactive (निष्क्रिय)</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5
          }}
        >
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              fontWeight: 700,
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: 2,
              px: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' }
            }}
          >
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handleSave}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 12px rgba(15, 44, 89, 0.25)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0F2444 0%, #172554 100%)',
                boxShadow: '0 6px 16px rgba(15, 44, 89, 0.35)'
              }
            }}
          >
            सुरक्षित गर्नुहोस् (Save Trainer)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trainer Login QR Dialog */}
      <Dialog open={Boolean(qrModalItem)} onClose={() => setQrModalItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>
          Trainer Access Card & QR
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {qrModalItem && (
            <Box>
              <Avatar
                src={qrModalItem.photo}
                sx={{ width: 68, height: 68, mx: 'auto', mb: 1.5, bgcolor: '#1a9c5c', fontWeight: 800 }}
              >
                {qrModalItem.name[0]}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {qrModalItem.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
                ID: {qrModalItem.id} • {qrModalItem.specialization || 'Trainer'}
              </Typography>

              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, display: 'inline-block', border: '1px solid #e2e8f0', mb: 2 }}>
                <QRCodeSVG
                  value={`KITE-TRAINER:${qrModalItem.id}:PIN:${qrModalItem.pin}`}
                  size={160}
                  level="H"
                />
              </Box>

              <Box sx={{ bgcolor: '#e5f8ee', p: 1.5, borderRadius: 2, border: '1px solid #c0ebce' }}>
                <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 800, display: 'block' }}>
                  TRAINER LOGIN 4-DIGIT PIN:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b', letterSpacing: 4 }}>
                  {qrModalItem.pin}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setQrModalItem(null)}>
            Close Card
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trainer 360° Profile Dossier Dialog */}
      <Dialog open={Boolean(profileTrainer)} onClose={() => setProfileTrainer(null)} maxWidth="md" fullWidth>
        {profileTrainer && (() => {
          const occ = db.occupations.find((o) => o.id === profileTrainer.occupationId);
          const assignedGroups = (db.trainingGroups || []).filter((g) => g.trainerId === profileTrainer.id);
          const groupIds = assignedGroups.map((g) => g.id);
          const myStudents = (db.students || []).filter((s) => groupIds.includes(s.groupId));
          const studentIds = myStudents.map((s) => s.id);
          const myOjts = (db.ojts || []).filter((o) => studentIds.includes(o.studentId));
          const myPlacements = (db.placements || []).filter((p) => studentIds.includes(p.studentId));

          return (
            <>
              <DialogTitle sx={{ pb: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={profileTrainer.photo} sx={{ width: 56, height: 56, bgcolor: '#1a9c5c', fontWeight: 800 }}>
                    {profileTrainer.name[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {profileTrainer.name}
                      </Typography>
                      <Chip label={profileTrainer.id} size="small" sx={{ fontWeight: 800, bgcolor: '#1a56b0', color: '#fff' }} />
                      <Chip label={profileTrainer.status} size="small" color={profileTrainer.status === 'Active' ? 'success' : 'default'} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#647089' }}>
                      {occ?.name || 'Instructor'} • {profileTrainer.specialization} • Phone: {profileTrainer.phone}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<QrCode2Icon />}
                    onClick={() => {
                      setQrModalItem(profileTrainer);
                    }}
                  >
                    Login QR
                  </Button>
                </Box>
              </DialogTitle>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={profileTab} onChange={(e, v) => setProfileTab(v)}>
                  <Tab label="1. Overview" />
                  <Tab label={`2. Assigned Groups (${assignedGroups.length})`} />
                  <Tab label={`3. Enrolled Students (${myStudents.length})`} />
                  <Tab label={`4. Employer Outcomes (${myOjts.length + myPlacements.length})`} />
                </Tabs>
              </Box>

              <DialogContent sx={{ py: 2.5 }}>
                {profileTab === 0 && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f0fd' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a56b0' }}>{assignedGroups.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a56b0' }}>Active Groups</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e5f8ee' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b' }}>{myStudents.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#16834b' }}>Total Students</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fdf3e2' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#c9820a' }}>{myOjts.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#c9820a' }}>Students in OJT</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e8ff' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#7e22ce' }}>{myPlacements.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#7e22ce' }}>Placed Graduates</Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>TRAINER CREDENTIALS</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.5 }}>{profileTrainer.name}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Occupation: {occ?.name || 'General'}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Specialization: {profileTrainer.specialization}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>Phone: {profileTrainer.phone}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>SECURITY & QUICK ACCESS</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip icon={<KeyIcon />} label={`Login PIN: ${profileTrainer.pin}`} sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(profileTrainer.phone, `Namaste Trainer ${profileTrainer.name}, your portal PIN is ${profileTrainer.pin}.`)}
                              target="_blank"
                              sx={{ color: '#25D366' }}
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1.5 }}>
                            Trainers use this 4-digit PIN to mark attendance, submit work plans, lesson plans, and student evaluations.
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {profileTab === 1 && (
                  <Stack spacing={1.5}>
                    {assignedGroups.map((grp) => {
                      const course = db.courses.find((c) => c.id === grp.courseId);
                      const stdCount = (db.students || []).filter((s) => s.groupId === grp.id).length;
                      return (
                        <Paper key={grp.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                  Group {grp.groupCode}
                                </Typography>
                                <Chip label={`Shift ${grp.shift}`} size="small" sx={{ fontWeight: 800, bgcolor: '#e8f0fd', color: '#1a56b0' }} />
                                <Chip label={grp.status} size="small" color={grp.status === 'Active' ? 'success' : 'default'} />
                              </Box>
                              <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                                Course: <b>{course?.title}</b> ({course?.durationHours} Hours)
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#647089' }}>
                                Class Timing: {grp.startTime} – {grp.endTime} • Admission: {grp.admissionDate} → End: {grp.expectedEndDate}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                                {stdCount}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                                Students
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                    {assignedGroups.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#94a3b8', py: 4, textAlign: 'center' }}>
                        No training groups currently assigned to this trainer.
                      </Typography>
                    )}
                  </Stack>
                )}

                {profileTab === 2 && (
                  <Stack spacing={1}>
                    {myStudents.map((std) => {
                      const grp = db.trainingGroups.find((g) => g.id === std.groupId);
                      const atts = (db.attendances || []).filter((a) => a.studentId === std.id);
                      const present = atts.filter((a) => a.status === 'present').length;
                      const attRate = atts.length > 0 ? Math.round((present / atts.length) * 100) : 100;

                      return (
                        <Paper key={std.id} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={std.photoUrl} sx={{ width: 40, height: 40, bgcolor: '#1a56b0', fontWeight: 800 }}>
                              {std.name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {std.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#647089' }}>
                                {std.tgid} • Group {grp?.groupCode} • Phone: {std.phone}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip
                              label={`Att: ${attRate}%`}
                              size="small"
                              sx={{
                                bgcolor: attRate >= 80 ? '#e5f8ee' : '#fdeceb',
                                color: attRate >= 80 ? '#16834b' : '#d5372f',
                                fontWeight: 800
                              }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', color: '#647089', mt: 0.3 }}>
                              {std.status}
                            </Typography>
                          </Box>
                        </Paper>
                      );
                    })}
                    {myStudents.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#94a3b8', py: 4, textAlign: 'center' }}>
                        No students enrolled in this trainer's groups yet.
                      </Typography>
                    )}
                  </Stack>
                )}

                {profileTab === 3 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                      Indirect Employer Connection (यस प्रशिक्षकले सिकाएका विद्यार्थीहरूको OJT र रोजगारी):
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0', mb: 1.5 }}>
                            🏢 Students in OJT ({myOjts.length})
                          </Typography>
                          <Stack spacing={1}>
                            {myOjts.map((ojt) => {
                              const std = db.students.find((s) => s.id === ojt.studentId);
                              const emp = db.employers.find((e) => e.id === ojt.employerId);
                              return (
                                <Box key={ojt.id} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{std?.name || 'Student'}</Typography>
                                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                                    Host: <b>{emp?.name || 'Employer'}</b> ({emp?.location})
                                  </Typography>
                                  <Chip label={ojt.status} size="small" color={ojt.status === 'Completed' ? 'success' : 'primary'} sx={{ mt: 0.5 }} />
                                </Box>
                              );
                            })}
                            {myOjts.length === 0 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                No students currently dispatched to OJT.
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b', mb: 1.5 }}>
                            💼 Placed Graduates ({myPlacements.length})
                          </Typography>
                          <Stack spacing={1}>
                            {myPlacements.map((plc) => {
                              const std = db.students.find((s) => s.id === plc.studentId);
                              const emp = db.employers.find((e) => e.id === plc.employerId);
                              return (
                                <Box key={plc.id} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{std?.name || 'Student'}</Typography>
                                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                                    Employer: <b>{emp?.name || 'Company'}</b> • Post: {plc.jobTitle}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 800, display: 'block' }}>
                                    Salary: NPR {plc.salary ? plc.salary.toLocaleString() : '—'}
                                  </Typography>
                                </Box>
                              );
                            })}
                            {myPlacements.length === 0 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                No graduates placed yet.
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setProfileTrainer(null)}>Close</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
