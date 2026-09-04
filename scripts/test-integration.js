/**
 * EchoKind End-to-End Integration Test Suite
 * DEV Weekend Challenge: Generosity Edition
 */

const SERVER_BASE = process.env.TEST_SERVER_URL || 'http://localhost:3001';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

let testsPassed = 0;
let testsFailed = 0;

function logPass(title, detail) {
  console.log(`\x1b[32m[PASS]\x1b[0m ${title}`);
  if (detail) console.log(`       -> ${detail}`);
  testsPassed++;
}

function logFail(title, error) {
  console.error(`\x1b[31m[FAIL]\x1b[0m ${title}:`, error);
  testsFailed++;
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting EchoKind End-to-End Integration Tests');
  console.log(`Target Backend: ${SERVER_BASE}`);
  console.log(`Target Solana RPC: ${SOLANA_RPC}`);
  console.log('====================================================\n');

  // Test 1: Live Solana Devnet RPC
  try {
    const res = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' })
    });
    const data = await res.json();
    if (data.result && typeof data.result === 'number') {
      logPass('Solana Devnet JSON-RPC Connectivity', `Live Devnet Slot: #${data.result}`);
    } else {
      throw new Error(`Unexpected Solana RPC response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Solana Devnet JSON-RPC Connectivity', err.message);
  }

  // Test 2: Backend Health Endpoint
  try {
    const res = await fetch(`${SERVER_BASE}/api/health`);
    const data = await res.json();
    if (data.status === 'ok') {
      logPass('Backend Server Healthcheck', `Status OK, Solana Status: ${data.integrations.solana.status}`);
    } else {
      throw new Error(`Healthcheck returned status: ${data.status}`);
    }
  } catch (err) {
    logFail('Backend Server Healthcheck', err.message);
  }

  // Test 3: Fetch Community Requests
  let initialRequestsCount = 0;
  try {
    const res = await fetch(`${SERVER_BASE}/api/requests`);
    const data = await res.json();
    if (Array.isArray(data) && data.length >= 6) {
      initialRequestsCount = data.length;
      logPass('Fetch Aid Requests from Database', `Retrieved ${data.length} community aid requests`);
    } else {
      throw new Error(`Expected array with at least 6 requests, got: ${data?.length}`);
    }
  } catch (err) {
    logFail('Fetch Aid Requests from Database', err.message);
  }

  // Test 4: Google Gemini Need Structuring
  let structuredNeed = null;
  try {
    const samplePlea = "Our neighborhood solidarity kitchen in Brooklyn needs 40 fresh vegetable crates and 20 insulated soup carriers for elderly residents.";
    const res = await fetch(`${SERVER_BASE}/api/gemini/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: samplePlea })
    });
    const data = await res.json();
    if (data.title && data.category && data.itemsNeeded && data.voiceNarration) {
      structuredNeed = data;
      logPass('Google Gemini AI Need Extraction', `Parsed Title: "${data.title}", Category: ${data.category}, Urgency: ${data.urgency}`);
    } else {
      throw new Error(`Missing expected fields in extraction: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Google Gemini AI Need Extraction', err.message);
  }

  // Test 5: Post New Request End-to-End
  let createdRequestId = null;
  try {
    const newRequestPayload = {
      title: structuredNeed?.title || 'Emergency Fresh Food Pantry Supplies',
      description: 'Supplying fresh food baskets to families affected by grocery store closures.',
      authorName: 'E2E Test Organizer',
      authorRole: 'Community Lead',
      location: 'Brooklyn, New York, USA',
      category: structuredNeed?.category || 'Food & Nutrition',
      unTheme: structuredNeed?.unTheme || 'Ethical Giving',
      urgency: 'urgent',
      status: 'active',
      targetAmountSOL: 3.5,
      raisedAmountSOL: 0,
      donorCount: 0,
      itemsNeeded: structuredNeed?.itemsNeeded || [
        { id: 'e2e-item-1', name: 'Fresh Vegetable Crates', quantity: 40, unit: 'crates', fulfilled: false }
      ],
      voiceNarrationText: structuredNeed?.voiceNarration || 'Hello neighbors, we need fresh produce for our community pantry.',
      audioDurationSec: 20,
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80',
      tags: ['E2E-Test', 'Solidarity']
    };

    const res = await fetch(`${SERVER_BASE}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequestPayload)
    });
    const data = await res.json();
    if (data.id) {
      createdRequestId = data.id;
      logPass('Create Aid Request in Persistent DB', `Saved with ID: ${data.id}`);
    } else {
      throw new Error(`Request creation failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Create Aid Request in Persistent DB', err.message);
  }

  // Test 6: Solana Micro-Grant & Escrow Lock
  try {
    const grantPayload = {
      requestId: createdRequestId,
      requestTitle: structuredNeed?.title || 'Emergency Fresh Food Pantry Supplies',
      donorName: 'E2E Generous Donor',
      amountSOL: 0.25,
      amountUSD: 36.25,
      txSignature: '5KindTestSig' + Math.random().toString(36).substring(2, 15) + 'DevnetVerifiable',
      message: 'Automated end-to-end test grant in solidarity.'
    };

    const res = await fetch(`${SERVER_BASE}/api/grants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grantPayload)
    });
    const data = await res.json();
    if (data.id && data.isEscrowLocked === true) {
      logPass('Solana Micro-Grant & Milestone Escrow Lock', `Grant ID: ${data.id}, Escrow Locked: ${data.isEscrowLocked}, Amount: ${data.amountSOL} SOL`);
    } else {
      throw new Error(`Grant creation failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Solana Micro-Grant & Milestone Escrow Lock', err.message);
  }

  // Test 7: Multimodal Delivery Proof & Escrow Release
  try {
    const proofPayload = {
      requestId: createdRequestId,
      proofNotes: 'Delivered 40 fresh vegetable crates to Brooklyn community center. Received signed receipt.',
      proofImage: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80'
    };

    const res = await fetch(`${SERVER_BASE}/api/gemini/verify-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proofPayload)
    });
    const data = await res.json();
    if (data.isVerified === true && data.escrowUnlocked === true && data.confidenceScore >= 90) {
      logPass('VisionGuard Multimodal Proof & Escrow Unlock', `Confidence Score: ${data.confidenceScore}%, Escrow Unlocked: ${data.escrowUnlocked}`);
    } else {
      throw new Error(`Proof verification failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('VisionGuard Multimodal Proof & Escrow Unlock', err.message);
  }

  // Test 8: ElevenLabs Audio Synthesis Endpoint
  try {
    const res = await fetch(`${SERVER_BASE}/api/elevenlabs/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'When a neighbor speaks, kindness echoes across the community.',
        voiceId: '21m00Tcm4TlvDq8ikWAM'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('audio') || res.status === 200) {
      logPass('ElevenLabs Voice Synthesis / Stream Pipeline', `Received response with Content-Type: ${contentType}`);
    } else {
      throw new Error(`Unexpected audio response: status ${res.status}`);
    }
  } catch (err) {
    logFail('ElevenLabs Voice Synthesis / Stream Pipeline', err.message);
  }

  // Summary
  console.log('\n====================================================');
  console.log(`🏁 Test Summary: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('====================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
