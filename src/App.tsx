import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AidCard } from './components/AidCard';
import { GlobalRadarMap } from './components/GlobalRadarMap';
import { SnowflakeWarehouseModal } from './components/SnowflakeWarehouseModal';
import { NonprofitVerifyModal } from './components/NonprofitVerifyModal';
import { ProofOfGenerosityModal } from './components/ProofOfGenerosityModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { MicroGrantModal } from './components/MicroGrantModal';
import { FulfillmentProofModal } from './components/FulfillmentProofModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { JudgeSandboxModal } from './components/JudgeSandboxModal';
import { JudgeShowcaseDock } from './components/JudgeShowcaseDock';
import { UNReliefWebModal } from './components/UNReliefWebModal';
import { FloatingVoiceFab } from './components/FloatingVoiceFab';
import { SystemHealthModal } from './components/SystemHealthModal';

import { INITIAL_AID_REQUESTS } from './data/seedData';
import { AidRequest, UNTheme, MicroGrant, SolanaPriceData } from './types';
import { SolanaService, WalletState, PROTOCOL_ESCROW_VAULT } from './services/solanaService';
import { ElevenLabsService, AVAILABLE_VOICES } from './services/elevenlabsService';
import { Search, HeartHandshake, MapIcon } from './components/Icons';
import { ACTIVE_BRAND } from './config/branding';
import { apiUrl } from './config/api';

export const App: React.FC = () => {
  // Main Data States
  const [requests, setRequests] = useState<AidRequest[]>(() => {
    const saved = localStorage.getItem('echokind_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const clean = parsed.filter((r: AidRequest) => {
            if (!r.id || !r.title) return false;
            if (r.tags?.includes('E2E-Test') || r.authorName === 'E2E Test Organizer') return false;
            const key = r.title.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);

            // Auto-heal legacy mock/unfunded recipientWallets cached in browser localStorage
            const seedMatch = INITIAL_AID_REQUESTS.find(d => d.id === r.id);
            if (seedMatch?.recipientWallet) {
              r.recipientWallet = seedMatch.recipientWallet;
            } else if (
              !r.recipientWallet ||
              r.recipientWallet.startsWith('A6hC') ||
              r.recipientWallet.startsWith('2CKY') ||
              r.recipientWallet.startsWith('2iqY') ||
              r.recipientWallet.startsWith('84Lu')
            ) {
              r.recipientWallet = PROTOCOL_ESCROW_VAULT;
            }
            return true;
          });
          if (clean.length > 0) return clean;
        }
      } catch (e) {}
    }
    return INITIAL_AID_REQUESTS;
  });

  const [wallet, setWallet] = useState<WalletState>(() => SolanaService.getWallet());
  const [solanaPrice, setSolanaPrice] = useState<SolanaPriceData | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<UNTheme | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgent' | 'freeze' | 'funding' | 'newest'>('urgent');
  const [viewMode, setViewMode] = useState<'stream' | 'map'>('stream');
  const [selectedMapRequestId, setSelectedMapRequestId] = useState<string | null>(null);

  // Audio Playback States
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [currentPlayingTitle, setCurrentPlayingTitle] = useState<string>('');
  const [currentNarratorName, setCurrentNarratorName] = useState<string>('Rachel (Empathetic)');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Modal & Trajectory States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isUNModalOpen, setIsUNModalOpen] = useState<boolean>(false);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState<boolean>(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);
  const [isSnowflakeModalOpen, setIsSnowflakeModalOpen] = useState<boolean>(false);
  const [snowflakeInitialSql, setSnowflakeInitialSql] = useState<string | undefined>(undefined);
  const [snowflakeAutoExecute, setSnowflakeAutoExecute] = useState<boolean>(false);
  const [donateTargetRequest, setDonateTargetRequest] = useState<AidRequest | null>(null);
  const [donateInitialSOL, setDonateInitialSOL] = useState<number>(0.10);
  const [proofTargetRequest, setProofTargetRequest] = useState<AidRequest | null>(null);
  const [proofInitialReceipt, setProofInitialReceipt] = useState<string | undefined>(undefined);
  const [proofAutoTrigger, setProofAutoTrigger] = useState<boolean>(false);
  const [nonprofitTargetRequest, setNonprofitTargetRequest] = useState<AidRequest | null>(null);
  const [certificateTargetRequest, setCertificateTargetRequest] = useState<AidRequest | null>(null);
  const [recentGrantArc, setRecentGrantArc] = useState<{ from: { lat: number; lng: number; label: string }; to: { lat: number; lng: number; label: string } } | null>(null);

  // Fetch requests from backend on initial mount
  useEffect(() => {
    fetch(apiUrl('/api/requests'))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRequests(data);
        }
      })
      .catch(() => {
        // use local state if backend not running
      });
  }, []);

  // Poll live Solana Price Oracle
  useEffect(() => {
    const updatePrice = () => {
      SolanaService.getLivePrice().then(setSolanaPrice);
    };
    updatePrice();
    const timer = setInterval(updatePrice, 30000);
    return () => clearInterval(timer);
  }, []);

  // Poll live Open-Meteo climate telemetry for requests
  useEffect(() => {
    requests.forEach(req => {
      if (req.coordinates && !req.climateData) {
        fetch(apiUrl(`/api/weather/${req.coordinates.lat}/${req.coordinates.lng}`))
          .then(res => res.ok ? res.json() : null)
          .then(weather => {
            if (weather) {
              setRequests(prev => prev.map(r => r.id === req.id ? { ...r, climateData: weather } : r));
            }
          })
          .catch(() => {});
      }
    });
  }, [requests.length]);

  // Persist requests to localStorage as client cache
  useEffect(() => {
    localStorage.setItem('echokind_requests', JSON.stringify(requests));
  }, [requests]);

  // Sync wallet
  const refreshWallet = () => {
    setWallet(SolanaService.getWallet());
  };

  const handleAirdrop = async () => {
    await SolanaService.requestAirdrop(1.0);
    refreshWallet();
  };

  // Audio Handlers
  const handlePlayRequestAudio = (
    req: AidRequest,
    langMode: 'original' | 'english' = 'english',
    overrideVoiceId?: string
  ) => {
    const isOriginal = langMode === 'original' && !!req.voiceNarrationOriginal;
    const playText = isOriginal ? req.voiceNarrationOriginal! : req.voiceNarrationText;
    const playTitle = isOriginal ? `[${req.originalLanguageLabel || 'Native'}] ${req.title}` : req.title;
    const langCode = isOriginal ? req.originalLanguage : 'en-US';

    if (!overrideVoiceId && activePlayingId === `${req.id}-${langMode}` && isAudioPlaying) {
      ElevenLabsService.stopAudio();
      setIsAudioPlaying(false);
      return;
    }

    setActivePlayingId(`${req.id}-${langMode}`);
    setCurrentPlayingTitle(playTitle);

    let targetVoiceId = overrideVoiceId || selectedVoiceId;
    if (!overrideVoiceId) {
      if (isOriginal && req.originalLanguage) {
        const norm = req.originalLanguage.toLowerCase();
        if (norm.startsWith('es')) targetVoiceId = 'AZnzlk1XvdvUeBnXmlld'; // Marcela (Español)
        else if (norm.startsWith('uk')) targetVoiceId = 'ThT5KcBeYPX3keUQqHPh'; // Olena (Ukrainian)
      } else {
        // If moving to English mode and current voice was language-specific (Marcela or Olena), default to Rachel
        if (targetVoiceId === 'AZnzlk1XvdvUeBnXmlld' || targetVoiceId === 'ThT5KcBeYPX3keUQqHPh') {
          targetVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel
        }
      }
    }

    // Keep voice selector state synchronized with current speaker
    setSelectedVoiceId(targetVoiceId);

    const voiceObj = AVAILABLE_VOICES.find(v => v.elevenLabsVoiceId === targetVoiceId);
    setCurrentNarratorName(voiceObj ? voiceObj.name : 'Rachel');
    setIsAudioPlaying(true);

    ElevenLabsService.playNarration(
      playText,
      targetVoiceId,
      () => setIsAudioPlaying(true),
      () => {
        setIsAudioPlaying(false);
        setActivePlayingId(null);
      },
      () => {
        setIsAudioPlaying(false);
        setActivePlayingId(null);
      },
      langCode
    );
  };

  // Immediate voice switching when user picks a different speaker from the player dock
  const handleSelectVoice = (newVoiceId: string) => {
    setSelectedVoiceId(newVoiceId);
    const voiceObj = AVAILABLE_VOICES.find(v => v.elevenLabsVoiceId === newVoiceId);
    if (voiceObj) {
      setCurrentNarratorName(voiceObj.name);
    }

    // Only hot-switch audio if audio is actively playing!
    if (isAudioPlaying && activePlayingId) {
      if (activePlayingId === 'spotlight') {
        ElevenLabsService.stopAudio();
        setIsAudioPlaying(true);
        ElevenLabsService.playNarration(
          ACTIVE_BRAND.spotlightText,
          newVoiceId,
          () => setIsAudioPlaying(true),
          () => {
            setIsAudioPlaying(false);
            setActivePlayingId(null);
          },
          () => {
            setIsAudioPlaying(false);
            setActivePlayingId(null);
          }
        );
      } else {
        const cleanId = activePlayingId.replace('-original', '').replace('-english', '');
        const targetReq = requests.find(r => r.id === cleanId);
        if (targetReq) {
          ElevenLabsService.stopAudio();
          setIsAudioPlaying(true);

          // Language matching: English personas (Adam, Rachel, Antoni) narrate English translation
          // Marcela narrates Spanish; Olena narrates Ukrainian
          const isSpanishPersona = newVoiceId === 'AZnzlk1XvdvUeBnXmlld';
          const isUkrainianPersona = newVoiceId === 'ThT5KcBeYPX3keUQqHPh';

          let useOriginal = false;
          if (isSpanishPersona && targetReq.originalLanguage?.toLowerCase().startsWith('es') && targetReq.voiceNarrationOriginal) {
            useOriginal = true;
          } else if (isUkrainianPersona && targetReq.originalLanguage?.toLowerCase().startsWith('uk') && targetReq.voiceNarrationOriginal) {
            useOriginal = true;
          }

          const playText = useOriginal && targetReq.voiceNarrationOriginal
            ? targetReq.voiceNarrationOriginal
            : targetReq.voiceNarrationText;
          const langCode = useOriginal ? targetReq.originalLanguage : 'en-US';
          const newActiveId = `${targetReq.id}-${useOriginal ? 'original' : 'english'}`;
          setActivePlayingId(newActiveId);

          const playTitle = useOriginal
            ? `[${targetReq.originalLanguageLabel || 'Native'}] ${targetReq.title}`
            : targetReq.title;
          setCurrentPlayingTitle(playTitle);

          ElevenLabsService.playNarration(
            playText,
            newVoiceId,
            () => setIsAudioPlaying(true),
            () => {
              setIsAudioPlaying(false);
              setActivePlayingId(null);
            },
            () => {
              setIsAudioPlaying(false);
              setActivePlayingId(null);
            },
            langCode
          );
        }
      }
    }
  };

  const handlePlaySpotlightAudio = () => {
    const spotlightTitle = "Rachel's Spotlight: Why Spoken Generosity Matters";
    if (activePlayingId === 'spotlight' && isAudioPlaying) {
      ElevenLabsService.stopAudio();
      setIsAudioPlaying(false);
      return;
    }

    const spotlightText = ACTIVE_BRAND.spotlightText;

    setActivePlayingId('spotlight');
    setCurrentPlayingTitle(spotlightTitle);
    setCurrentNarratorName('Rachel (Warm & Empathetic)');
    setIsAudioPlaying(true);

    ElevenLabsService.playNarration(
      spotlightText,
      selectedVoiceId,
      () => setIsAudioPlaying(true),
      () => {
        setIsAudioPlaying(false);
        setActivePlayingId(null);
      },
      () => {
        setIsAudioPlaying(false);
        setActivePlayingId(null);
      }
    );
  };

  const handleListenFeedSequentially = () => {
    if (isAudioPlaying) {
      ElevenLabsService.stopAudio();
      setIsAudioPlaying(false);
      setActivePlayingId(null);
      return;
    }

    const activeReqs = requests.filter(r => r.status === 'active');
    if (activeReqs.length === 0) return;

    let index = 0;
    const playNext = () => {
      if (index >= activeReqs.length) {
        setIsAudioPlaying(false);
        setActivePlayingId(null);
        return;
      }
      const req = activeReqs[index];
      setActivePlayingId(req.id);
      setCurrentPlayingTitle(`[Feed Story ${index + 1}/${activeReqs.length}] ${req.title}`);
      setCurrentNarratorName('Rachel (Empathetic Assistant)');
      setIsAudioPlaying(true);

      ElevenLabsService.playNarration(
        `Story ${index + 1}. In ${req.location}, ${req.authorName} reports: ${req.voiceNarrationText}`,
        selectedVoiceId,
        () => setIsAudioPlaying(true),
        () => {
          index++;
          playNext();
        },
        () => {
          setIsAudioPlaying(false);
          setActivePlayingId(null);
        }
      );
    };

    playNext();
  };

  const handleTogglePlayBottomBar = () => {
    if (isAudioPlaying) {
      ElevenLabsService.stopAudio();
      setIsAudioPlaying(false);
    } else if (activePlayingId) {
      const cleanId = activePlayingId.replace('-original', '').replace('-english', '');
      const targetReq = requests.find(r => r.id === cleanId);
      if (targetReq) {
        handlePlayRequestAudio(targetReq, activePlayingId.includes('-original') ? 'original' : 'english', selectedVoiceId);
      } else if (activePlayingId === 'spotlight') {
        handlePlaySpotlightAudio();
      }
    } else if (requests.length > 0) {
      handlePlayRequestAudio(requests[0], 'english', selectedVoiceId);
    }
  };

  const handleStopBottomBar = () => {
    ElevenLabsService.stopAudio();
    setIsAudioPlaying(false);
    setActivePlayingId(null);
    setCurrentPlayingTitle('');
  };

  // Helper to get fallback coordinates for common locations
  const geocodeFallback = (locStr?: string) => {
    if (!locStr) return { lat: 40.7128, lng: -74.0060 };
    const l = locStr.toLowerCase();
    if (l.includes('brooklyn') || l.includes('new york')) return { lat: 40.7128, lng: -74.0060 };
    if (l.includes('los angeles') || l.includes('east la')) return { lat: 34.0224, lng: -118.1670 };
    if (l.includes('detroit')) return { lat: 42.3314, lng: -83.0458 };
    if (l.includes('hazard') || l.includes('kentucky')) return { lat: 37.2498, lng: -83.1932 };
    if (l.includes('oakland') || l.includes('bay area') || l.includes('san francisco')) return { lat: 37.8044, lng: -122.2712 };
    if (l.includes('kharkiv') || l.includes('ukraine')) return { lat: 49.9935, lng: 36.2304 };
    if (l.includes('nairobi') || l.includes('kenya')) return { lat: -1.2921, lng: 36.8219 };
    if (l.includes('montreal') || l.includes('canada')) return { lat: 45.5017, lng: -73.5673 };
    if (l.includes('beirut') || l.includes('lebanon')) return { lat: 33.8938, lng: 35.5018 };
    if (l.includes('delhi') || l.includes('india')) return { lat: 28.6139, lng: 77.2090 };
    if (l.includes('bogota') || l.includes('colombia')) return { lat: 4.7110, lng: -74.0721 };
    return { lat: 37.7749, lng: -122.4194 };
  };

  // Add new aid request
  const handleAddRequest = (newReq: AidRequest) => {
    const coords = newReq.coordinates && newReq.coordinates.lat !== 30
      ? newReq.coordinates
      : geocodeFallback(newReq.location);
    const preparedReq = { ...newReq, coordinates: coords };

    setRequests(prev => [preparedReq, ...prev]);
    handlePlayRequestAudio(preparedReq);

    fetch(apiUrl('/api/requests'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preparedReq)
    })
      .then(res => res.ok ? res.json() : null)
      .then(savedReq => {
        if (savedReq && savedReq.coordinates) {
          setRequests(prev => prev.map(r => r.id === savedReq.id ? savedReq : r));
        }
      })
      .catch(err => console.info('Backend request sync offline:', err));
  };

  // Ingest UN report
  const handleIngestUNReport = (newReq: AidRequest) => {
    setRequests(prev => {
      const exists = prev.some(r => r.id === newReq.id || r.title === newReq.title);
      if (exists) return prev;
      return [newReq, ...prev];
    });
  };

  // Grant completed handler
  const handleGrantCompleted = (grant: MicroGrant) => {
    setRequests(prev => prev.map(req => {
      if (req.id === grant.requestId) {
        // Trigger trajectory arc on map
        if (req.coordinates) {
          setRecentGrantArc({
            from: { lat: 37.7749, lng: -122.4194, label: 'San Francisco, CA (Donor Wallet)' },
            to: { lat: req.coordinates.lat, lng: req.coordinates.lng, label: req.location }
          });
        }
        return {
          ...req,
          raisedAmountSOL: Number((req.raisedAmountSOL + grant.amountSOL).toFixed(3)),
          donorCount: req.donorCount + 1
        };
      }
      return req;
    }));
    refreshWallet();
  };

  // Proof verified handler
  const handleProofVerified = (requestId: string, proofUrl: string, notes: string, score: number, receiptDetails?: any) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'fulfilled',
          verifiedProofImageUrl: proofUrl,
          proofNotes: notes,
          proofConfidenceScore: score,
          receiptDetails: receiptDetails || req.receiptDetails,
          itemsNeeded: req.itemsNeeded.map(i => ({ ...i, fulfilled: true }))
        };
      }
      return req;
    }));
  };

  // Item fulfilled toggle
  const handleToggleItemFulfilled = (reqId: string, itemId: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === reqId) {
        return {
          ...req,
          itemsNeeded: req.itemsNeeded.map(item => {
            if (item.id === itemId) {
              return { ...item, fulfilled: !item.fulfilled };
            }
            return item;
          })
        };
      }
      return req;
    }));

    fetch(apiUrl(`/api/requests/${reqId}/items/${itemId}`), {
      method: 'PATCH'
    }).catch(err => console.info('Backend item toggle sync offline:', err));
  };

  // Filter and sort requests
  const filteredRequests = requests
    .filter(req => {
      const matchesTheme = selectedTheme === 'ALL' || 
        req.unTheme === selectedTheme ||
        (selectedTheme === 'Youth Leadership' && (req.category === 'Education & Tech' || (req.tags || []).some(t => /stem|tech|youth|girl|laptop/i.test(t)))) ||
        (selectedTheme === 'Tech-Driven Giving' && (req.category === 'Education & Tech' || (req.tags || []).some(t => /solar|purification|battery|tech/i.test(t))));
      const matchesQuery = searchQuery.trim() === '' || 
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTheme && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === 'urgent') {
        if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
        if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
      } else if (sortBy === 'freeze') {
        const aTemp = a.climateData?.temperatureC ?? 999;
        const bTemp = b.climateData?.temperatureC ?? 999;
        return aTemp - bTemp; // sub-zero first
      } else if (sortBy === 'funding') {
        const aPct = a.raisedAmountSOL / (a.targetAmountSOL || 1);
        const bPct = b.raisedAmountSOL / (b.targetAmountSOL || 1);
        return bPct - aPct; // highest % first
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  // ⚡ 1-Click Judge Walkthrough Demo Handlers
  const handleJudgeSnowflakeDemo = () => {
    setSnowflakeInitialSql('CALL SNOWFLAKE.CORTEX.DETECT_ANOMALIES(TABLE => "GRANTS_STREAM");');
    setSnowflakeAutoExecute(true);
    setIsSnowflakeModalOpen(true);
  };

  const handleJudgeVisionProofDemo = () => {
    const target = requests.find(r => 
      r.itemsNeeded.some(i => i.name.toLowerCase().includes('produce') || i.name.toLowerCase().includes('crate') || i.name.toLowerCase().includes('soup') || i.name.toLowerCase().includes('meal'))
    ) || requests[0];
    setProofInitialReceipt('/demo-assets/sample-kroger-receipt.svg');
    setProofAutoTrigger(true);
    setProofTargetRequest(target);
  };

  const handleJudgeVoiceDemo = () => {
    const target = requests.find(r => r.id === 'req-007' || r.originalLanguage === 'es-US' || r.originalLanguage === 'es-ES' || r.originalLanguage === 'uk-UA') || requests[0];
    if (target) {
      setViewMode('stream');
      setTimeout(() => {
        const el = document.getElementById(`aid-card-${target.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
      handlePlayRequestAudio(target, 'original');
    }
  };

  const handleJudgeClimateRadarDemo = () => {
    setViewMode('map');
    const target = requests.find(r => r.id === 'req-008' || r.location.toLowerCase().includes('kharkiv') || r.location.toLowerCase().includes('kentucky')) || requests[0];
    if (target) {
      setSelectedMapRequestId(target.id);
      setTimeout(() => {
        const el = document.getElementById('global-radar-map-container');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  };

  const handleJudgeMicroGrantDemo = () => {
    const target = requests.find(r => r.id === 'rw-ukraine-winter-2026' || r.id === 'req-008' || r.title.toLowerCase().includes('ukraine')) || requests[0];
    if (target) {
      setViewMode('stream');
      setTimeout(() => {
        const el = document.getElementById(`aid-card-${target.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
      setDonateInitialSOL(0.10);
      setDonateTargetRequest(target);
    }
  };

  // Calculate high-level stats
  const totalGrantsSOL = requests.reduce((acc, r) => acc + (r.raisedAmountSOL || 0), 0);
  const totalStories = requests.length;
  const totalDeliveredItems = requests.reduce((acc, r) => {
    return acc + (r.itemsNeeded || []).filter(i => i.fulfilled).reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <Navbar
        wallet={wallet}
        solanaPrice={solanaPrice}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenUNModal={() => setIsUNModalOpen(true)}
        onOpenSnowflakeModal={() => {
          setSnowflakeInitialSql(undefined);
          setSnowflakeAutoExecute(false);
          setIsSnowflakeModalOpen(true);
        }}
        onOpenJudgeModal={() => setIsSandboxModalOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onListenFeed={handleListenFeedSequentially}
        isAudioPlaying={isAudioPlaying}
        onAirdrop={handleAirdrop}
        onConnectWallet={setWallet}
      />

      {/* Hero Banner with Live Metrics & Audio Spotlight */}
      <HeroBanner
        totalGrantsSOL={totalGrantsSOL}
        totalStories={totalStories}
        totalDeliveredItems={totalDeliveredItems}
        selectedTheme={selectedTheme}
        onSelectTheme={setSelectedTheme}
        onPlaySpotlight={handlePlaySpotlightAudio}
        isPlayingSpotlight={activePlayingId === 'spotlight' && isAudioPlaying}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenUNModal={() => setIsUNModalOpen(true)}
        onOpenSnowflakeModal={() => setIsSnowflakeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '20px 24px 100px', width: '100%' }}>
        {/* View Mode: Global Radar Map */}
        {viewMode === 'map' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
            <GlobalRadarMap
              requests={filteredRequests}
              selectedRequestId={selectedMapRequestId || activePlayingId}
              onSelectRequest={(req) => {
                setSelectedMapRequestId(req.id);
              }}
              onPlayAudio={(req, langMode) => handlePlayRequestAudio(req, langMode || 'english')}
              isPlayingAudio={isAudioPlaying}
              activePlayingId={activePlayingId}
              onOpenDonateModal={(req, presetSOL) => {
                setDonateInitialSOL(presetSOL || 0.10);
                setDonateTargetRequest(req);
              }}
              onOpenNonprofitModal={(req) => setNonprofitTargetRequest(req)}
              onOpenProofModal={(req) => setProofTargetRequest(req)}
              onOpenCertificateModal={(req) => setCertificateTargetRequest(req)}
              recentGrantArc={recentGrantArc}
            />

            {/* Subheader for Cards below Map */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Active Beacon Tickets ({filteredRequests.length})
              </h3>
              <button
                onClick={() => setViewMode('stream')}
                className="btn btn-secondary"
                style={{ fontSize: '0.74rem', padding: '4px 12px' }}
              >
                Switch to Full Stream Grid
              </button>
            </div>
          </div>
        ) : null}

        {/* Search and Feed Header (if in stream view or secondary in map view) */}
        {viewMode === 'stream' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  Living Kindness Stream
                </h2>
                <button
                  onClick={() => setViewMode('map')}
                  className="badge badge-climate"
                  style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}
                  title="Switch to Global Radar Map"
                >
                  <MapIcon size={12} />
                  <span>Open Radar Map</span>
                </button>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Showing {filteredRequests.length} verified community needs across global neighborhoods
              </p>
            </div>

            {/* Search Input & Sort Selector */}
            <div style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              width: 'min(100%, 540px)',
              justifyContent: 'flex-end'
            }}>
              <div style={{
                position: 'relative',
                flex: '1 1 240px',
                minWidth: 200
              }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by cause, city, or items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '9px 16px 9px 36px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Sort Order Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort requests"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  color: '#F8FAFC',
                  fontSize: '0.82rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <option value="urgent" style={{ background: '#0E131F', color: '#F8FAFC' }}>Most Urgent</option>
                <option value="freeze" style={{ background: '#0E131F', color: '#F8FAFC' }}>Freeze Alerts First</option>
                <option value="funding" style={{ background: '#0E131F', color: '#F8FAFC' }}>Highest % Funded</option>
                <option value="newest" style={{ background: '#0E131F', color: '#F8FAFC' }}>Newest Reports</option>
              </select>
            </div>
          </div>
        )}

        {/* Aid Cards Grid */}
        {filteredRequests.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: 48 }}>
            <HeartHandshake size={48} color="var(--primary-amber)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.25rem' }}>No community requests match your filter</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Try clearing your search query or select "All Themes" above.
            </p>
            <button
              onClick={() => { setSelectedTheme('ALL'); setSearchQuery(''); }}
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 24
          }}>
            {filteredRequests.map((req) => (
              <AidCard
                key={req.id}
                request={req}
                isPlayingAudio={(activePlayingId === req.id || activePlayingId?.startsWith(`${req.id}-`)) && isAudioPlaying}
                onPlayAudio={(langMode) => handlePlayRequestAudio(req, langMode)}
                onOpenDonateModal={(presetSOL) => {
                  setDonateInitialSOL(presetSOL || 0.10);
                  setDonateTargetRequest(req);
                }}
                onOpenProofModal={() => setProofTargetRequest(req)}
                onOpenNonprofitModal={(target) => setNonprofitTargetRequest(target)}
                onOpenCertificateModal={(target) => setCertificateTargetRequest(target)}
                onToggleItemFulfilled={(itemId) => handleToggleItemFulfilled(req.id, itemId)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) for Voice Recording */}
      <FloatingVoiceFab
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        isAudioPlaying={isAudioPlaying}
      />

      {/* Floating Audio Player Dock */}
      <AudioPlayerBar
        isPlaying={isAudioPlaying}
        currentTitle={currentPlayingTitle}
        currentNarrator={currentNarratorName}
        selectedVoiceId={selectedVoiceId}
        onSelectVoice={handleSelectVoice}
        onTogglePlay={handleTogglePlayBottomBar}
        onStop={handleStopBottomBar}
        audioLangMode={activePlayingId?.includes('-original') ? 'original' : 'english'}
        hasTranslation={true}
        onToggleLangMode={(mode) => {
          if (activePlayingId) {
            const cleanId = activePlayingId.replace('-original', '').replace('-english', '');
            const targetReq = requests.find(r => r.id === cleanId);
            if (targetReq) {
              handlePlayRequestAudio(targetReq, mode);
            }
          }
        }}
      />

      {/* Modals */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddRequest={handleAddRequest}
      />

      <UNReliefWebModal
        isOpen={isUNModalOpen}
        onClose={() => setIsUNModalOpen(false)}
        onIngestSuccess={handleIngestUNReport}
      />

      <SnowflakeWarehouseModal
        isOpen={isSnowflakeModalOpen}
        onClose={() => {
          setIsSnowflakeModalOpen(false);
          setSnowflakeAutoExecute(false);
        }}
        initialSql={snowflakeInitialSql}
        autoExecute={snowflakeAutoExecute}
      />

      <NonprofitVerifyModal
        isOpen={nonprofitTargetRequest !== null}
        request={nonprofitTargetRequest}
        onClose={() => setNonprofitTargetRequest(null)}
      />

      <ProofOfGenerosityModal
        isOpen={certificateTargetRequest !== null}
        request={certificateTargetRequest}
        onClose={() => setCertificateTargetRequest(null)}
      />

      <MicroGrantModal
        isOpen={donateTargetRequest !== null}
        request={donateTargetRequest}
        initialAmountSOL={donateInitialSOL}
        wallet={wallet}
        onConnectWallet={setWallet}
        onClose={() => setDonateTargetRequest(null)}
        onGrantCompleted={handleGrantCompleted}
      />

      <FulfillmentProofModal
        isOpen={proofTargetRequest !== null}
        request={proofTargetRequest}
        onClose={() => {
          setProofTargetRequest(null);
          setProofAutoTrigger(false);
        }}
        onProofVerified={handleProofVerified}
        initialReceiptUrl={proofInitialReceipt}
        autoTriggerVerify={proofAutoTrigger}
      />

      <JudgeSandboxModal
        isOpen={isSandboxModalOpen}
        onClose={() => setIsSandboxModalOpen(false)}
        onAirdrop={handleAirdrop}
        onTriggerSnowflake={handleJudgeSnowflakeDemo}
        onTriggerVisionOCR={handleJudgeVisionProofDemo}
        onTriggerMultilingualVoice={handleJudgeVoiceDemo}
        onTriggerClimateRadar={handleJudgeClimateRadarDemo}
        onTriggerMicroGrant={handleJudgeMicroGrantDemo}
      />

      <SystemHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        onOpenKeysModal={() => setIsSandboxModalOpen(true)}
      />

      {/* Sticky 1-Click Judge Showcase Dock */}
      <JudgeShowcaseDock
        onTriggerSnowflake={handleJudgeSnowflakeDemo}
        onTriggerVisionOCR={handleJudgeVisionProofDemo}
        onTriggerMultilingualVoice={handleJudgeVoiceDemo}
        onTriggerClimateRadar={handleJudgeClimateRadarDemo}
        onTriggerMicroGrant={handleJudgeMicroGrantDemo}
        onOpenJudgeModal={() => setIsSandboxModalOpen(true)}
        isAudioPlaying={isAudioPlaying}
      />

      {/* Professional Product Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: '#070A10',
        padding: '36px 24px',
        textAlign: 'center',
        fontSize: '0.84rem'
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{ACTIVE_BRAND.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: '#CBD5E1' }}>{ACTIVE_BRAND.subTagline}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            {/* Protocol Telemetry & Diagnostics Trigger */}
            <button
              onClick={() => setIsHealthModalOpen(true)}
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                color: '#34D399',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Inspect live Google Gemini AI, ElevenLabs Audio, and Solana Devnet integration telemetry"
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span>All Systems Operational · Diagnostics</span>
            </button>
          </div>
          <p style={{ maxWidth: 720, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Direct peer-to-peer generosity powered by Google Gemini 1.5 Flash multimodal structuring, ElevenLabs empathetic voice narration, and Solana milestone micro-escrows.
          </p>
        </div>
      </footer>
    </div>
  );
};
