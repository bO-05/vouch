import React, { useState } from 'react';
import { X, Copy, Check, FileText } from './Icons';

interface DevPostHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevPostHelperModal: React.FC<DevPostHelperModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const submissionMarkdown = `---
title: EchoKind — Multimodal Voice-First Mutual Aid & Transparent Micro-Grants
published: true
tags: devchallenge, weekendchallenge, hackathon, ai, web3
cover_image: https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80
---

*This is a submission for the [DEV Weekend Challenge: Generosity Edition](https://dev.to/devteam/join-our-dev-weekend-challenge-generosity-edition-1000-in-prizes-across-five-winners-20en).*

---

## 💡 What I Built

**EchoKind** is a voice-first mutual aid and transparent micro-grants web application engineered in the true spirit of generosity. 

Traditional philanthropy is often cold, transactional, and bureaucratic. Marginalized individuals—such as visually impaired seniors, non-literate community members, or disaster victims—are frequently excluded by complex online forms. Furthermore, donors hesitate to give because they cannot verify whether their funds reached the actual people in need.

**EchoKind bridges this empathy and trust gap with three core pillars:**

1. **Voice-First Spoken Pleas (ElevenLabs + Web Speech)**: Anyone can speak their situation naturally in their own words. ElevenLabs converts these pleas into moving, empathetic audio narratives with expressive intonation (voices like Rachel, Adam, and Antoni), making community aid deeply human again. Visually impaired donors can also navigate and listen to the entire feed hands-free.
2. **Multimodal Need Structuring & Verification (Google Gemini AI)**: When a community organizer speaks or uploads photos of urgent situations, Google Gemini extracts itemized aid needs, evaluates urgency, maps to UN charity themes, and validates delivery proof photos ("VisionGuard") to prevent fraud.
3. **Instant, Zero-Middleman Micro-Grants (Solana Web3)**: Donors can send micro-grants ($0.10, $1.00, or custom SOL) with sub-second finality. Funds are locked in transparent milestone escrow and automatically released when photographic proof of delivery is verified by Gemini AI.

---

## 🎥 Demo

- **Live Deployed App**: [https://echokind.vercel.app](https://echokind.vercel.app) *(or your deployed URL)*
- **Interactive Sandbox**: The application features a zero-setup "Judge Sandbox" allowing anyone to experience the full multimodal Gemini parsing, ElevenLabs audio narration, and Solana Devnet micro-grants without needing personal API keys or crypto funds.

---

## 💻 Code

- **GitHub Repository**: [https://github.com/your-username/echokind](https://github.com/your-username/echokind)
- Built with: Vite, React 18, TypeScript, Vanilla CSS Design System, Google Gemini 1.5 Flash, ElevenLabs Audio API, and Solana Devnet JSON-RPC.

---

## 🛠️ How I Built It

### 1. System Architecture
The application is structured into four reactive layers:
- **Presentation & Audio Engine**: Built with a custom Obsidian/Amber gold design system, featuring glassmorphism, responsive CSS grid, and dynamic HTML5 Canvas audio waveform visualizers.
- **Multimodal AI Brain (\`geminiService.ts\`)**: Leverages Google Gemini 1.5 Flash via REST API with a fallback heuristic engine. Gemini extracts structured aid JSON from unstructured speech and verifies photographic chain-of-custody.
- **Voice Storytelling (\`elevenlabsService.ts\`)**: Connects to ElevenLabs Text-to-Speech endpoint (\`eleven_monolingual_v1\`) with fallback to the native Web Speech API.
- **Micro-Escrow Ledger (\`solanaService.ts\`)**: Interacts directly with Solana Devnet JSON-RPC (\`requestAirdrop\`, balance queries, and Base58 milestone transaction signatures linking to Solana Explorer).

### 2. UN Charity Themes Addressed
- **Equity & Inclusion**: Eliminates text-only barriers through voice-first recording and an audio screen-reader assistant.
- **Ethical & Accountable Giving**: Guarantees radical transparency by holding funds in escrow until Gemini Vision verifies delivery photos.
- **Technology-Driven Giving**: Harnesses Solana micro-transactions to make giving accessible in small increments.
- **Climate & Poverty Resilience**: Spotlights flood clinics, winter warming shelters, and grassroots food rescue programs.

---

## 🏆 Prize Categories

This project is submitted for the following prize categories:
1. **Best use of Google AI**: Gemini 1.5 Flash multimodal extraction & VisionGuard delivery proof verification.
2. **Best use of ElevenLabs**: Empathetic audio narrative synthesis & accessible voice reader.
3. **Best use of Solana**: Real-time micro-grants, Devnet faucet integration, and milestone escrow unlocking.
4. **Overall Winner**: A complete, highly polished solution exemplifying the UN charity themes and the true spirit of generosity.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(submissionMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #38BDF8, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>DEV.to Submission Post Draft</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Pre-formatted to 100% match the official hackathon submission template
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Copy CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600 }}>
            Ready to copy and paste directly into DEV.to:
          </span>
          <button
            onClick={handleCopy}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Post Markdown'}</span>
          </button>
        </div>

        {/* Code Preview Box */}
        <div style={{
          background: '#070B13',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: 16,
          maxHeight: '55vh',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          color: '#E2E8F0',
          whiteSpace: 'pre-wrap'
        }}>
          {submissionMarkdown}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
