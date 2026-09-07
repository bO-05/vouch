import React, { useState, useRef } from 'react';
import { X, Mic, MicOff, Sparkles, Volume2, Check, Loader2, Wand2, Globe, Upload, AlertCircle, FileText, CheckCircle2 } from './Icons';
import { GeminiService } from '../services/geminiService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { SolanaService, PROTOCOL_ESCROW_VAULT } from '../services/solanaService';
import { AidRequest } from '../types';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRequest: (newReq: AidRequest) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  tag: string;
  voiceId: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', tag: 'EN', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'es-ES', name: 'Español (LatAm / España)', tag: 'ES', voiceId: 'AZnzlk1XvdvUeBnXmlld' },
  { code: 'uk-UA', name: 'Українська (Ukrainian)', tag: 'UK', voiceId: 'ThT5KcBeYPX3keUQqHPh' },
  { code: 'fr-FR', name: 'Français (French)', tag: 'FR', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'ar-SA', name: 'العربية (Arabic)', tag: 'AR', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)', tag: 'HI', voiceId: '21m00Tcm4TlvDq8ikWAM' }
];

const MULTILINGUAL_SAMPLES = [
  {
    lang: 'es-ES',
    title: 'Cocina Comunitaria en Los Ángeles',
    text: "Nuestra cocina comunitaria en el este de Los Ángeles necesita 30 cajas de verduras frescas, frijoles y arroz para apoyar a 45 familias de trabajadores agrícolas que enfrentan dificultades este invierno.",
    author: 'Elena Morales',
    role: 'Coordinadora de Solidaridad',
    location: 'East Los Angeles, California, USA'
  },
  {
    lang: 'uk-UA',
    title: 'Обігрів та ковдри у Харкові',
    text: "Наша волонтерська група у Харкові терміново потребує 35 теплих ковдр, 5 автономних обігрівачів та паливних брикетів для сімей у пошкоджених будинках перед настанням морозів.",
    author: 'Оксана Шевченко (Oksana)',
    role: 'Волонтерський Координатор',
    location: 'Kharkiv, Ukraine'
  },
  {
    lang: 'fr-FR',
    title: "Manteaux d'hiver à Montréal",
    text: "Notre collectif de solidarité à Montréal a besoin de 40 manteaux d'hiver isolés, de gants thermiques et de soupes chaudes pour les personnes sans abri près de la station Berri-UQAM.",
    author: 'Jean-Luc Tremblay',
    role: 'Bénévole de Rue',
    location: 'Montréal, Québec, Canada'
  },
  {
    lang: 'ar-SA',
    title: 'سلال غذائية ومستلزمات أطفال',
    text: "مجموعتنا التطوعية في الحي تحتاج إلى 50 سلة غذائية طارئة ومستلزمات حليب أطفال وأدوية أساسية للعائلات النازحة قبل نهاية هذا الأسبوع.",
    author: 'Fatima Al-Mansoor',
    role: 'Relief Coordinator',
    location: 'Amman & Border Encampments, Jordan'
  }
];

const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac'
];

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onAddRequest
}) => {
  const [selectedLang, setSelectedLang] = useState<LanguageOption>(SUPPORTED_LANGUAGES[1]); // Default to Spanish for immediate multilingual showcase
  const [inputText, setInputText] = useState(MULTILINGUAL_SAMPLES[0].text);
  const [authorName, setAuthorName] = useState(MULTILINGUAL_SAMPLES[0].author);
  const [authorRole, setAuthorRole] = useState(MULTILINGUAL_SAMPLES[0].role);
  const [location, setLocation] = useState(MULTILINGUAL_SAMPLES[0].location);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=80');

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState<'original' | 'english' | null>(null);
  const [analyzedData, setAnalyzedData] = useState<any>(null);
  const [uploadedAudio, setUploadedAudio] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'error' | 'warning' | 'info'; text: string } | null>(null);

  const recognitionRef = useRef<any>(null);

  if (!isOpen) return null;

  const handleSelectSample = (sample: typeof MULTILINGUAL_SAMPLES[0]) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === sample.lang) || SUPPORTED_LANGUAGES[0];
    setSelectedLang(lang);
    setInputText(sample.text);
    setAuthorName(sample.author);
    setAuthorRole(sample.role);
    setLocation(sample.location);
    setAnalyzedData(null);
    setUploadedAudio(null);
    setFeedbackMessage(null);
  };

  const handleToggleRecord = () => {
    setFeedbackMessage(null);
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = selectedLang.code;

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };
        recognition.onerror = (event: any) => {
          setIsRecording(false);
          recognitionRef.current = null;
          if (event.error === 'not-allowed') {
            setFeedbackMessage({
              type: 'error',
              text: 'Microphone permission denied by browser. Please enable microphone access in your browser settings, type your plea, or upload an audio file.'
            });
          } else if (event.error === 'no-speech') {
            setFeedbackMessage({
              type: 'warning',
              text: 'No speech was detected. Please speak clearly into your microphone or try an instant test scenario.'
            });
          }
        };
        recognition.onend = () => {
          setIsRecording(false);
          recognitionRef.current = null;
        };

        recognition.start();
      } catch (err: any) {
        setIsRecording(false);
        recognitionRef.current = null;
        setFeedbackMessage({
          type: 'error',
          text: `Microphone initialization error: ${err?.message || 'Could not start recording.'}`
        });
      }
    } else {
      setFeedbackMessage({
        type: 'warning',
        text: 'Speech recognition is not natively supported in this browser. You can type directly, choose an instant test scenario below, or upload an audio file.'
      });
    }
  };

  const handleAudioFileUpload = (file: File) => {
    setFeedbackMessage(null);
    const lowerName = file.name.toLowerCase();
    const isSupportedExt = lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') ||
      lowerName.endsWith('.m4a') || lowerName.endsWith('.webm') || lowerName.endsWith('.ogg') || lowerName.endsWith('.aac');

    if (!SUPPORTED_AUDIO_TYPES.includes(file.type) && !isSupportedExt) {
      setFeedbackMessage({
        type: 'error',
        text: `Unsupported audio codec (${file.type || 'unknown'}). Please upload MP3, WAV, WebM, OGG, or M4A.`
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const matches = reader.result.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        const base64Data = matches ? matches[2] : reader.result.split(',')[1] || '';
        const mimeType = matches ? matches[1] : (file.type || 'audio/mp3');

        setUploadedAudio({
          name: file.name,
          base64: base64Data,
          mimeType
        });

        if (!inputText || inputText === MULTILINGUAL_SAMPLES[0].text) {
          setInputText(`Voice note audio file attached: ${file.name}`);
        }
        setFeedbackMessage({
          type: 'info',
          text: `Audio file "${file.name}" loaded (${(file.size / 1024).toFixed(1)} KB). Ready for Gemini AI transcription & structuring.`
        });
      }
    };
    reader.onerror = () => {
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to read audio file. File may be corrupted or unreadable.'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeWithGemini = async () => {
    if (!inputText.trim() && !uploadedAudio) {
      setFeedbackMessage({
        type: 'warning',
        text: 'Please speak, type, or drop an audio recording before analyzing.'
      });
      return;
    }
    setIsAnalyzing(true);
    setFeedbackMessage(null);
    try {
      const result = await GeminiService.translateAndExtractNeed(
        inputText,
        selectedLang.code,
        uploadedAudio?.base64,
        uploadedAudio?.mimeType
      );
      setAnalyzedData(result);
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: `Analysis error: ${err?.message || 'Failed to analyze plea.'}`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreviewVoice = async (mode: 'original' | 'english') => {
    if (!analyzedData) return;
    const textToSpeak = mode === 'original'
      ? (analyzedData.voiceNarrationOriginal || analyzedData.originalTranscript || inputText)
      : (analyzedData.voiceNarrationEnglish || analyzedData.voiceNarration || analyzedData.description);

    const voiceId = mode === 'original' ? selectedLang.voiceId : '21m00Tcm4TlvDq8ikWAM';
    const langCode = mode === 'original' ? selectedLang.code : 'en-US';

    setIsSynthesizingVoice(mode);
    await ElevenLabsService.playNarration(
      textToSpeak,
      voiceId,
      () => {},
      () => setIsSynthesizingVoice(null),
      () => setIsSynthesizingVoice(null),
      langCode
    );
  };

  const handlePublish = () => {
    if (!analyzedData) return;

    const locClean = location.trim() || 'Local Community';
    const locLower = locClean.toLowerCase();
    let coords = { lat: 37.7749, lng: -122.4194 };
    if (locLower.includes('brooklyn') || locLower.includes('new york')) coords = { lat: 40.7128, lng: -74.0060 };
    else if (locLower.includes('los angeles') || locLower.includes('east la')) coords = { lat: 34.0224, lng: -118.1670 };
    else if (locLower.includes('detroit')) coords = { lat: 42.3314, lng: -83.0458 };
    else if (locLower.includes('hazard') || locLower.includes('kentucky')) coords = { lat: 37.2498, lng: -83.1932 };
    else if (locLower.includes('oakland') || locLower.includes('bay area')) coords = { lat: 37.8044, lng: -122.2712 };
    else if (locLower.includes('kharkiv') || locLower.includes('ukraine')) coords = { lat: 49.9935, lng: 36.2304 };
    else if (locLower.includes('nairobi') || locLower.includes('kenya')) coords = { lat: -1.2921, lng: 36.8219 };
    else if (locLower.includes('montreal') || locLower.includes('canada')) coords = { lat: 45.5017, lng: -73.5673 };

    const userWallet = SolanaService.getWallet();
    const recipient = userWallet.publicKey || PROTOCOL_ESCROW_VAULT;

    const newRequest: AidRequest = {
      id: `req-${Date.now()}`,
      title: analyzedData.title,
      description: analyzedData.description,
      authorName: authorName.trim() || 'Community Neighbor',
      authorRole: authorRole.trim() || 'Mutual Aid Organizer',
      location: locClean,
      coordinates: coords,
      recipientWallet: recipient,
      category: analyzedData.category,
      unTheme: analyzedData.unTheme,
      urgency: analyzedData.urgency,
      status: 'active',
      targetAmountSOL: analyzedData.targetAmountSOL || 3.5,
      raisedAmountSOL: 0,
      donorCount: 0,
      itemsNeeded: analyzedData.itemsNeeded || [],
      voiceNarrationText: analyzedData.voiceNarrationEnglish || analyzedData.voiceNarration,
      audioDurationSec: Math.round((analyzedData.voiceNarration || '').split(' ').length / 2.5) || 20,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80',
      createdAt: new Date().toISOString(),
      tags: analyzedData.tags || ['Community Aid'],
      originalLanguage: selectedLang.code,
      originalLanguageLabel: selectedLang.name,
      originalTranscript: inputText,
      voiceNarrationOriginal: analyzedData.voiceNarrationOriginal || inputText
    };

    onAddRequest(newRequest);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="modal-header-icon" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--brand-amber)' }}>
              <Mic size={20} color="var(--brand-amber)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Speak a Need (Multilingual Bridge)</h2>
                <span className="badge badge-equity" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  Cross-Language AI
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Powered by Google Gemini Translation & ElevenLabs Dual Voice Synthesis
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-close" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Language Selector Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          marginBottom: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={15} color="#38BDF8" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF' }}>
              Spoken Tongue / Language:
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLang(lang);
                  setAnalyzedData(null);
                }}
                style={{
                  background: selectedLang.code === lang.code ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: selectedLang.code === lang.code ? '1px solid #38BDF8' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: selectedLang.code === lang.code ? '#7DD3FC' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: selectedLang.code === lang.code ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span className="lang-code-pill">{lang.tag}</span>
                <span>{lang.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Instant Multilingual Test Scenarios (Click to test cross-language translation):
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MULTILINGUAL_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                style={{
                  background: inputText === sample.text ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: inputText === sample.text ? '1px solid #F59E0B' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: inputText === sample.text ? '#FCD34D' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  cursor: 'pointer'
                }}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Spoken Text Area */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Speak or type community need in ${selectedLang.name}...`}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: isRecording ? '1px solid rgba(239, 68, 68, 0.7)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              resize: 'vertical',
              outline: 'none',
              boxShadow: isRecording
                ? '0 0 0 2px rgba(239, 68, 68, 0.35), inset 0 1px 2px rgba(0, 0, 0, 0.4)'
                : 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
            }}
          />

          {/* Record Button */}
          <button
            type="button"
            onClick={handleToggleRecord}
            className="btn"
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: isRecording ? '#EF4444' : 'rgba(245, 158, 11, 0.2)',
              border: isRecording ? '1px solid #EF4444' : '1px solid rgba(245, 158, 11, 0.4)',
              color: isRecording ? '#FFFFFF' : '#FCD34D',
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.76rem'
            }}
          >
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            <span>{isRecording ? `Listening (${selectedLang.name.split(' ')[0]})...` : 'Click to Speak'}</span>
          </button>
        </div>

        {/* Feedback / Error Banner */}
        {feedbackMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: 12,
            fontSize: '0.78rem',
            background: feedbackMessage.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : feedbackMessage.type === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
            border: `1px solid ${feedbackMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : feedbackMessage.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
            color: feedbackMessage.type === 'error' ? '#FCA5A5' : feedbackMessage.type === 'warning' ? '#FCD34D' : '#7DD3FC'
          }}>
            <AlertCircle size={15} />
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Audio File Dropzone & Manual Voice Upload */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          padding: '6px 10px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: '5px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38BDF8',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Upload voice recording file (MP3, WAV, WebM, M4A)"
            >
              <Upload size={13} />
              <span>Drop / Upload Voice Audio</span>
              <input
                type="file"
                accept="audio/*, .mp3, .wav, .m4a, .webm, .ogg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAudioFileUpload(e.target.files[0]);
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Supports MP3, WAV, WebM, M4A, OGG
            </span>
          </div>

          {uploadedAudio && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#10B981' }}>
              <CheckCircle2 size={13} />
              <span style={{ fontWeight: 600 }}>{uploadedAudio.name}</span>
              <button
                type="button"
                onClick={() => setUploadedAudio(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px', display: 'inline-flex', alignItems: 'center' }}
                title="Remove audio file"
                aria-label="Remove audio file"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Step 1 CTA: Gemini AI Extraction & Translation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Selected: <strong style={{ color: '#E2E8F0' }}>{selectedLang.name}</strong> • Preserves raw dialect & cultural nuance
          </div>
          <button
            onClick={handleAnalyzeWithGemini}
            disabled={(!inputText.trim() && !uploadedAudio) || isAnalyzing}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.86rem' }}
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            <span>{isAnalyzing ? 'Gemini AI Translating & Structuring...' : '1. Translate & Structure with Gemini AI'}</span>
          </button>
        </div>

        {/* Analyzed Data Preview with Dual Spoken Voices */}
        {analyzedData && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.04)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#F59E0B" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FCD34D' }}>
                  {analyzedData.detectedLanguage || selectedLang.name} → English Structured Ticket
                </span>
              </div>
              <span className="badge badge-equity">
                {analyzedData.unTheme || 'Equity & Inclusion'}
              </span>
            </div>

            {/* Original vs Translated Comparison */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: 10
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Original Transcript ({selectedLang.name.split(' ')[0]}):
                </span>
                <p style={{ fontSize: '0.78rem', color: '#E2E8F0', marginTop: 2, fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{analyzedData.originalTranscript || inputText}"
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#38BDF8', textTransform: 'uppercase', fontWeight: 700 }}>
                  English Translation:
                </span>
                <p style={{ fontSize: '0.78rem', color: '#FFFFFF', marginTop: 2, lineHeight: 1.4 }}>
                  "{analyzedData.translatedEnglishText || analyzedData.description}"
                </p>
              </div>
            </div>

            {/* Extracted Needs */}
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Itemized Needs Extracted:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {analyzedData.itemsNeeded?.map((item: any, idx: number) => (
                  <div key={idx} style={{
                    fontSize: '0.8rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>• {item.quantity} {item.unit} {item.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>≈${item.estimatedCostUSD}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual Spoken Voice Previews */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              background: 'rgba(251, 113, 133, 0.08)',
              border: '1px solid rgba(251, 113, 133, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: 10
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FDA4AF' }}>
                    Native Voice ({selectedLang.name.split(' ')[0]}):
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreviewVoice('original')}
                    className="btn btn-voice"
                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                  >
                    <Volume2 size={12} />
                    <span>{isSynthesizingVoice === 'original' ? 'Playing...' : 'Listen Native'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  "{analyzedData.voiceNarrationOriginal || inputText.slice(0, 100)}"
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6EE7B7' }}>
                    English Translation:
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreviewVoice('english')}
                    className="btn btn-solana"
                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                  >
                    <Volume2 size={12} />
                    <span>{isSynthesizingVoice === 'english' ? 'Playing...' : 'Listen English'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  "{analyzedData.voiceNarrationEnglish || analyzedData.voiceNarration || 'Every micro-grant directly helps.'}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Meta Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Organizer / Group Name
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#FFFFFF',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Location / Country
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#FFFFFF',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        {/* Publish Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={!analyzedData}
            className="btn btn-primary"
            style={{ padding: '10px 24px', opacity: analyzedData ? 1 : 0.5 }}
          >
            <Check size={16} />
            <span>Publish Multilingual Request to Living Kindness Stream</span>
          </button>
        </div>
      </div>
    </div>
  );
};
