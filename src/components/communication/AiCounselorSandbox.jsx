import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { simulateGeminiCounselorTurn } from '../../services/whatsappCloudApi';

export default function AiCounselorSandbox({ customInstructions = '', inDialog = false }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: 'नमस्ते! म ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी) को २४/७ AI Counselor हुँ। म तपाईंलाई केयरगिभर, टेलरिङ, ब्युटिसियन कोर्स, शुल्क वा भर्नाबारे के जानकारी दिन सक्छु?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leadDetected, setLeadDetected] = useState(null);

  const handleSend = async (customText) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    // Live Lead Intent Simulation
    const lower = text.toLowerCase();
    if (
      lower.includes('भर्ना') ||
      lower.includes('admission') ||
      lower.includes('apply') ||
      lower.includes('आउँछु') ||
      lower.includes('join') ||
      lower === '4'
    ) {
      setLeadDetected({
        title: 'High Priority Admission Lead Intent Detected!',
        detail: `The visitor showed clear admission/enrollment intent ("${text}"). In live WhatsApp, this automatically captures a High-Priority Lead into CRM and notifies counseling staff.`
      });
    }

    try {
      const res = await simulateGeminiCounselorTurn({
        messages: nextMessages,
        userInput: text,
        customInstructions
      });
      setMessages((prev) => [...prev, { role: 'model', text: res.reply, model: res.model }]);
    } catch (err) {
      setError(err?.message || 'Failed to get AI Counselor response.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'model',
        text: 'नमस्ते! म ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी) को २४/७ AI Counselor हुँ। म तपाईंलाई केयरगिभर, टेलरिङ, ब्युटिसियन कोर्स, शुल्क वा भर्नाबारे के जानकारी दिन सक्छु?'
      }
    ]);
    setLeadDetected(null);
    setError(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2.25 },
        borderRadius: 2.5,
        border: '1px solid #C7D2FE',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon sx={{ color: '#4F46E5', fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E1B4B' }}>
              Live AI Counselor Test Sandbox (Interactive 2-Way Simulator)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Real-time conversational memory • Nepali Devanagari • English digits for fees &amp; phones • Lead intent detection
            </Typography>
          </Box>
        </Box>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<RestartAltIcon fontSize="small" />}
          onClick={handleReset}
          sx={{ fontWeight: 700 }}
        >
          Reset Chat
        </Button>
      </Box>

      {/* Quick sample prompt chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {[
          'केयरगिभर तालिम कति महिनाको हो?',
          'दैनिक सिफ्ट कति बजे हुन्छ?',
          'शुल्क कति लाग्छ र तिर्ने तरिका के हो?',
          'म भोलि भर्ना हुन आउँछु सिट छ कि छैन?'
        ].map((prompt) => (
          <Chip
            key={prompt}
            label={prompt}
            size="small"
            clickable
            disabled={loading}
            onClick={() => handleSend(prompt)}
            sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' }, fontSize: '0.75rem', fontWeight: 600 }}
          />
        ))}
      </Box>

      {/* Chat messages viewport */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          maxHeight: inDialog ? 380 : 320,
          minHeight: 200,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25
        }}
      >
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <Box
              key={idx}
              sx={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                p: 1.25,
                borderRadius: 2,
                bgcolor: isUser ? '#1E293B' : '#FFFFFF',
                color: isUser ? '#FFFFFF' : '#0F172A',
                border: isUser ? 'none' : '1px solid #E2E8F0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, mb: 0.25, color: isUser ? '#94A3B8' : '#4F46E5' }}>
                {isUser ? 'Visitor (You)' : `AI Counselor${m.model ? ` (${m.model})` : ''}`}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.85rem' }}>
                {m.text}
              </Typography>
            </Box>
          );
        })}
        {loading && (
          <Box sx={{ alignSelf: 'flex-start', p: 1, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={14} sx={{ color: '#4F46E5' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
              Gemini AI Counselor is thinking and drafting reply...
            </Typography>
          </Box>
        )}
      </Box>

      {leadDetected && (
        <Alert severity="success" onClose={() => setLeadDetected(null)} sx={{ py: 0.5 }}>
          <strong>{leadDetected.title}</strong> — {leadDetected.detail}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0.5 }}>
          {error}
        </Alert>
      )}

      {/* Input bar */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Type a visitor question in Nepali, Roman Nepali, or English..."
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          variant="contained"
          disabled={loading || !input.trim()}
          onClick={() => handleSend()}
          endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
          sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontWeight: 700, px: 2.5 }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
}
