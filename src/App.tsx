import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AidCard } from './components/AidCard';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { MicroGrantModal } from './components/MicroGrantModal';
import { FulfillmentProofModal } from './components/FulfillmentProofModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { JudgeSandboxModal } from './components/JudgeSandboxModal';
import { DevPostHelperModal } from './components/DevPostHelperModal';

import { INITIAL_AID_REQUESTS } from './data/seedData';
import { AidRequest, UNTheme, MicroGrant } from './types';
import { SolanaService, WalletState } from './services/solanaService';
import { ElevenLabsService, AVAILABLE_VOICES } from './services/elevenlabsService';
import { Search, HeartHandshake } from './components/Icons';

export const App: React.FC = () => {
  // Main Data States
  const [requests, setRequests] = useState<AidRequest[]>(() => {
    const saved = localStorage.getItem('echokind_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_AID_REQUESTS;
  });

  const [wallet, setWallet] = useState<WalletState>(() => SolanaService.getWallet());
  const [selectedTheme, setSelectedTheme] = useState<UNTheme | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Audio Playback States
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [currentPlayingTitle, setCurrentPlayingTitle] = useState<string>('');
  const [currentNarratorName, setCurrentNarratorName] = useState<string>('Rachel (Empathetic)');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Modal States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState<boolean>(false);
  const [isDevPostModalOpen, setIsDevPostModalOpen] = useState<boolean>(false);
  const [donateTargetRequest, setDonateTargetRequest] = useState<AidRequest | null>(null);
  const [proofTargetRequest, setProofTargetRequest] = useState<AidRequest | null>(null);

  // Fetch requests from backend on initial mount
  useEffect(() => {
    fetch('/api/requests')
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

  // Persist requests to localStorage as client cache
  useEffect(() => {
    localStorage.setItem('echokind_requests', JSON.stringify(requests));
  }, [requests]);

  // Sync wallet
  const refreshWallet = () => {
    setWallet(SolanaService.getWallet());
  };

  // Audio Handlers
  const handlePlayRequestAudio = (req: AidRequest) => {
    if (activePlayingId === req.id && isAudioPlaying) {
      ElevenLabsService.stopAudio();
      setIsAudioPlaying(false);
      return;
    }

    setActivePlayingId(req.id);
    setCurrentPlayingTitle(req.title);
    const voiceObj = AVAILABLE_VOICES.find(v => v.elevenLabsVoiceId === selectedVoiceId);
    setCurrentNarratorName(voiceObj ? voiceObj.name : 'Rachel');
    setIsAudioPlaying(true);

    ElevenLabsService.playNarration(
      req.voiceNarrationText,
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

  const handlePlaySpotlightAudio = () => {
    const spotlightTitle = "Rachel's Spotlight: Why Spoken Generosity Matters";
    if (activePlayingId === 'spotlight' && isAudioPlaying) {
      ElevenLabsService.stopAudio();
      setIsAudioPlaying(false);
      return;
    }

    const spotlightText = "Welcome to EchoKind. Generosity is not a bureaucratic transaction. It is an act of human connection. When an Appalachian nurse or a Detroit youth mentor speaks their real need, hearing their voice breaks every barrier. We thank you for listening, giving, and sharing.";

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
      const targetReq = requests.find(r => r.id === activePlayingId);
      if (targetReq) {
        handlePlayRequestAudio(targetReq);
      } else if (activePlayingId === 'spotlight') {
        handlePlaySpotlightAudio();
      }
    }
  };

  const handleStopBottomBar = () => {
    ElevenLabsService.stopAudio();
    setIsAudioPlaying(false);
    setActivePlayingId(null);
    setCurrentPlayingTitle('');
  };

  // Add new aid request
  const handleAddRequest = (newReq: AidRequest) => {
    setRequests([newReq, ...requests]);
    handlePlayRequestAudio(newReq);

    // Persist to backend database
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReq)
    }).catch(err => console.info('Backend request sync offline:', err));
  };

  // Grant completed handler
  const handleGrantCompleted = (grant: MicroGrant) => {
    setRequests(prev => prev.map(req => {
      if (req.id === grant.requestId) {
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
  const handleProofVerified = (requestId: string, proofUrl: string, notes: string, score: number) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'fulfilled',
          verifiedProofImageUrl: proofUrl,
          proofNotes: notes,
          proofConfidenceScore: score,
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

    // Sync to backend
    fetch(`/api/requests/${reqId}/items/${itemId}`, {
      method: 'PATCH'
    }).catch(err => console.info('Backend item toggle sync offline:', err));
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesTheme = selectedTheme === 'ALL' || req.unTheme === selectedTheme;
    const matchesQuery = searchQuery.trim() === '' || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTheme && matchesQuery;
  });

  // Calculate high-level stats
  const totalGrantsSOL = requests.reduce((acc, r) => acc + r.raisedAmountSOL, 0);
  const totalStories = requests.length;
  const totalDeliveredItems = requests.reduce((acc, r) => {
    return acc + r.itemsNeeded.filter(i => i.fulfilled).reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <Navbar
        wallet={wallet}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenSandboxModal={() => setIsSandboxModalOpen(true)}
        onOpenDevPostModal={() => setIsDevPostModalOpen(true)}
        onListenFeed={handleListenFeedSequentially}
        isAudioPlaying={isAudioPlaying}
        onAirdrop={refreshWallet}
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
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '20px 24px 100px', width: '100%' }}>
        {/* Search and Feed Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24
        }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Living Kindness Stream
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Showing {filteredRequests.length} verified community needs across global neighborhoods
            </p>
          </div>

          {/* Search Input */}
          <div style={{
            position: 'relative',
            width: 'min(100%, 340px)'
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
        </div>

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
                isPlayingAudio={activePlayingId === req.id && isAudioPlaying}
                onPlayAudio={() => handlePlayRequestAudio(req)}
                onOpenDonateModal={() => setDonateTargetRequest(req)}
                onOpenProofModal={() => setProofTargetRequest(req)}
                onToggleItemFulfilled={(itemId) => handleToggleItemFulfilled(req.id, itemId)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Audio Player Dock */}
      <AudioPlayerBar
        isPlaying={isAudioPlaying}
        currentTitle={currentPlayingTitle}
        currentNarrator={currentNarratorName}
        selectedVoiceId={selectedVoiceId}
        onSelectVoice={(vId) => setSelectedVoiceId(vId)}
        onTogglePlay={handleTogglePlayBottomBar}
        onStop={handleStopBottomBar}
      />

      {/* Modals */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddRequest={handleAddRequest}
      />

      <MicroGrantModal
        isOpen={donateTargetRequest !== null}
        request={donateTargetRequest}
        onClose={() => setDonateTargetRequest(null)}
        onGrantCompleted={handleGrantCompleted}
      />

      <FulfillmentProofModal
        isOpen={proofTargetRequest !== null}
        request={proofTargetRequest}
        onClose={() => setProofTargetRequest(null)}
        onProofVerified={handleProofVerified}
      />

      <JudgeSandboxModal
        isOpen={isSandboxModalOpen}
        onClose={() => setIsSandboxModalOpen(false)}
        onAirdrop={refreshWallet}
      />

      <DevPostHelperModal
        isOpen={isDevPostModalOpen}
        onClose={() => setIsDevPostModalOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(8, 12, 20, 0.95)',
        padding: '30px 24px',
        textAlign: 'center',
        fontSize: '0.84rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: '#FCD34D' }}>EchoKind</span>
            <span>•</span>
            <span>Built for DEV Weekend Challenge: Generosity Edition</span>
            <span>•</span>
            <span style={{ color: '#10B981' }}>September 2026</span>
          </div>
          <p style={{ maxWidth: 700, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Empowering neighbors with Google Gemini Multimodal AI, ElevenLabs Voice Synthesis, and Solana Devnet Micro-Escrow.
          </p>
        </div>
      </footer>
    </div>
  );
};
