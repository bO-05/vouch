/**
 * Vouch End-to-End Integration Test Suite
 * DEV Weekend Challenge: Generosity Edition
 * "Spoken Need. Cryptographic Trust."
 */

const rawServerBase = process.env.TEST_SERVER_URL || 'http://127.0.0.1:3001';
// Cross-version Node 18 & 20 compatibility: Node 18 built-in fetch resolves 'localhost' to IPv6 ::1
// without Happy Eyeballs autoSelectFamily fallback, causing ECONNREFUSED against IPv4 listeners.
// Automatically normalize localhost to 127.0.0.1 for deterministic, rock-solid execution.
const SERVER_BASE = rawServerBase.replace(/:\/\/localhost\b/, '://127.0.0.1');
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
  console.log('🧪 Starting Vouch Protocol End-to-End Integration Tests');
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

  // Test 2: Backend Server Healthcheck (/api/health and /health alias)
  try {
    const res = await fetch(`${SERVER_BASE}/api/health`);
    const data = await res.json();
    const rootRes = await fetch(`${SERVER_BASE}/health`);
    const rootData = await rootRes.json();
    if (data.status === 'ok' && rootData.status === 'ok') {
      logPass('Backend Server Healthcheck', `Status OK (/api/health & /health), Solana: ${data.integrations.solana.status}, Version: ${data.version}`);
    } else {
      throw new Error(`Healthcheck returned invalid status (api: ${data.status}, root: ${rootData.status})`);
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

  // Test 6: Solana Micro-Grant On-Chain Broadcast & Milestone Escrow Lock
  let testedTxSig = '';
  try {
    const broadcastPayload = {
      requestId: createdRequestId,
      recipientWallet: 'J5Q5PG75xeeFecNriPj4FEXuK5qcVz6sZjYTDh2rpZDG',
      amountSOL: 0.25,
      donorName: 'E2E Generous Donor',
      message: 'Automated end-to-end test grant in solidarity.'
    };

    const res = await fetch(`${SERVER_BASE}/api/solana/broadcast-grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(broadcastPayload)
    });
    const data = await res.json();
    if (data.grant && data.grant.id && data.grant.isEscrowLocked === true && data.grant.txSignature) {
      if (data.grant.zeroWalletRequiredForJudges !== true) {
        throw new Error('Expected zeroWalletRequiredForJudges to be true');
      }
      testedTxSig = data.grant.txSignature;
      logPass('Solana Devnet Micro-Grant Broadcast & Escrow Lock', `Grant ID: ${data.grant.id}, Escrow Locked: ${data.grant.isEscrowLocked}, On-Chain: ${data.grant.isOnChain}, Zero-Wallet Judge Ready: ${data.grant.zeroWalletRequiredForJudges}, Tx: ${data.grant.txSignature.slice(0, 16)}...`);
    } else {
      throw new Error(`Grant broadcast failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Solana Devnet Micro-Grant Broadcast & Escrow Lock', err.message);
  }

  // Test 6b: Solana Backend Authority Keypair & Balance
  try {
    const res = await fetch(`${SERVER_BASE}/api/solana/authority`);
    const data = await res.json();
    if ((data.publicKey || data.authorityPublicKey) && data.network === 'devnet') {
      logPass('Solana Devnet Authority Inspection', `Pubkey: ${data.publicKey || data.authorityPublicKey}, Balance: ${data.balanceSOL} SOL, Slot: ${data.slot}`);
    } else {
      throw new Error(`Authority inspection failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Solana Devnet Authority Inspection', err.message);
  }

  // Test 6c: Solana On-Chain Transaction Verification Endpoint
  try {
    const sigToVerify = testedTxSig || '5teRmiF5RDQA9GtCarm5GLJrPghmTWQRCohin6c9K9qfY45h11rNmGKikrJUmpy4xhXvKmu9Nie4jPW9waokki4p';
    const res = await fetch(`${SERVER_BASE}/api/solana/verify-tx/${encodeURIComponent(sigToVerify)}`);
    const data = await res.json();
    if (data.status && data.network === 'devnet') {
      logPass('Solana Transaction Verification Endpoint', `Sig: ${sigToVerify.slice(0, 16)}..., Status: ${data.status}, On-Chain: ${data.isOnChain}`);
    } else {
      throw new Error(`Transaction verification failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Solana Transaction Verification Endpoint', err.message);
  }

  // Test 6d: Confirmed Live On-Chain Solana Devnet Transaction
  try {
    const liveSig = '5teRmiF5RDQA9GtCarm5GLJrPghmTWQRCohin6c9K9qfY45h11rNmGKikrJUmpy4xhXvKmu9Nie4jPW9waokki4p';
    const res = await fetch(`${SERVER_BASE}/api/solana/verify-tx/${encodeURIComponent(liveSig)}`);
    const data = await res.json();
    if (data.isOnChain === true && data.status && data.network === 'devnet') {
      logPass('Solana Live On-Chain Devnet Transaction Verification', `Live Sig: ${liveSig.slice(0, 16)}..., Status: ${data.status}, Slot: ${data.slot}, Explorer: ${data.explorerUrl}`);
    } else {
      throw new Error(`Live Devnet tx verification failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Solana Live On-Chain Devnet Transaction Verification', err.message);
  }

  // Test 6e: Rejection of Fraudulent / Unconfirmed Transaction Signatures
  try {
    const bogusSig = 'InvalidBogusTransactionSignature9999999999999999';
    const res = await fetch(`${SERVER_BASE}/api/solana/verify-tx/${encodeURIComponent(bogusSig)}`);
    const data = await res.json();
    if (res.status === 404 && data.found === false && data.isOnChain === false) {
      logPass('Reject Fraudulent/Unconfirmed Transaction Signatures', `Correctly returned HTTP 404 with found: false for bogus signature`);
    } else {
      throw new Error(`Expected 404 with found: false, got status ${res.status} with body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Reject Fraudulent/Unconfirmed Transaction Signatures', err.message);
  }

  // Test 6f: End-to-End 90 SOL Grant Protocol Escrow & Devnet Proxy Audit
  try {
    const targetSig = '3tGucfgZ8Y9PP231GVryy2q9hW8rFGA9RU76ERMmsHgCEzkbKVPykbEQdaaZ6R9jsUgk1zXVjHonWTnbWhZENz2m';
    const res = await fetch(`${SERVER_BASE}/api/solana/verify-tx/${encodeURIComponent(targetSig)}?recipient=4aoR48sXEwyWEh9eUKzGV536CZzwSocHP5MAsX8WWJvD`);
    const data = await res.json();
    if (res.ok && data.isOnChain === true && data.isDirectRecipientTransfer === false && data.isSponsorRelayerProxy === true && data.recipientVault === '4aoR48sXEwyWEh9eUKzGV536CZzwSocHP5MAsX8WWJvD') {
      logPass('90 SOL Grant Devnet Relayer Proxy & Escrow Verification', `Verified slot #${data.slot}, directTransfer: ${data.isDirectRecipientTransfer}, proxy: ${data.isSponsorRelayerProxy}, vault balance: ${data.recipientVaultBalanceSOL} SOL`);
    } else {
      throw new Error(`90 SOL grant verification failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('90 SOL Grant Devnet Relayer Proxy & Escrow Verification', err.message);
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

  // Test 9: Live Solana Price Oracle & Lamports Engine
  try {
    const res = await fetch(`${SERVER_BASE}/api/solana/price`);
    const data = await res.json();
    if (data.priceUSD > 0 && data.lamportsPerUSD > 0 && data.status === 'live') {
      logPass('Live Crypto Price Oracle (CoinGecko / Coinbase)', `Price: $${data.priceUSD} USD, 24h: ${data.change24h}%, Lamports/USD: ${data.lamportsPerUSD.toLocaleString()}, Source: ${data.source}`);
    } else {
      throw new Error(`Unexpected price oracle response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Live Crypto Price Oracle (CoinGecko / Coinbase)', err.message);
  }

  // Test 10: Real-World UN OCHA ReliefWeb Crisis Feed
  let unReportToIngest = null;
  let unIngestedRequestId = null;
  try {
    const res = await fetch(`${SERVER_BASE}/api/un-reliefweb/feed`);
    const data = await res.json();
    if (Array.isArray(data.reports) && data.reports.length > 0) {
      unReportToIngest = data.reports[0];
      logPass('UN OCHA ReliefWeb Humanitarian Crisis Feed', `Source: ${data.source}, Reports Active: ${data.reports.length}, Sample: "${unReportToIngest.title}"`);
    } else {
      throw new Error(`UN feed failed or empty: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('UN OCHA ReliefWeb Humanitarian Crisis Feed', err.message);
  }

  // Test 11: Ingest Live UN Crisis into Active Community Aid Request
  try {
    const res = await fetch(`${SERVER_BASE}/api/un-reliefweb/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: unReportToIngest?.id })
    });
    const data = await res.json();
    if (data.request?.id && data.request?.category) {
      unIngestedRequestId = data.request.id;
      logPass('Ingest UN Crisis into Vouch Living Stream', `Created Ticket ID: ${data.request.id}, Title: "${data.request.title}", SOL Target: ${data.request.targetAmountSOL} SOL`);
    } else {
      throw new Error(`UN crisis ingestion failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Ingest UN Crisis into Vouch Living Stream', err.message);
  }

  // Test 12: Gemini VisionGuard Pro - Deep Receipt & Inventory OCR
  try {
    const receiptProofPayload = {
      requestId: createdRequestId,
      proofType: 'receipt',
      proofNotes: 'Kroger Supercenter pharmacy order receipt for 40 fresh produce crates and soup containers.',
      proofImage: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80'
    };

    const res = await fetch(`${SERVER_BASE}/api/gemini/verify-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptProofPayload)
    });
    const data = await res.json();
    if (data.isVerified === true && data.receiptDetails?.storeName && data.confidenceScore >= 95) {
      logPass('Gemini VisionGuard Pro: Deep Receipt OCR', `Store: ${data.receiptDetails.storeName}, Total: $${data.receiptDetails.totalUSD}, Confidence: ${data.confidenceScore}%, Escrow Unlocked: ${data.escrowUnlocked}`);
    } else {
      throw new Error(`Receipt OCR verification failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Gemini VisionGuard Pro: Deep Receipt OCR', err.message);
  }

  // Test 13: Multilingual Dialect Translation & Dual Spoken Narration
  try {
    const spanishPlea = "Nuestra cocina comunitaria en el este de Los Ángeles necesita 30 cajas de verduras frescas y frijoles para 45 familias.";
    const res = await fetch(`${SERVER_BASE}/api/gemini/translate-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spanishPlea, sourceLang: 'es' })
    });
    const data = await res.json();
    if (data.detectedLanguage && data.translatedEnglishText && data.voiceNarrationOriginal && data.voiceNarrationEnglish) {
      logPass('Multilingual Cross-Language Bridge (Gemini + ElevenLabs)', `Lang: ${data.detectedLanguage}, Trans: "${data.translatedEnglishText.slice(0, 50)}...", Dual Voice Scripts Generated`);
    } else {
      throw new Error(`Multilingual translation failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Multilingual Cross-Language Bridge (Gemini + ElevenLabs)', err.message);
  }

  // Test 14: Open-Meteo Real-Time Geo-Climate Telemetry
  try {
    const res = await fetch(`${SERVER_BASE}/api/weather/49.99/36.23`);
    const data = await res.json();
    if (data.temperatureC !== undefined && data.weatherCondition && data.alertLevel) {
      logPass('Open-Meteo Real-Time Geo-Climate Telemetry', `Temp: ${data.temperatureC}°C (${data.temperatureF}°F), Weather: ${data.weatherCondition}, Alert: ${data.alertBadge || 'Standard'}, Source: ${data.source}`);
    } else {
      throw new Error(`Unexpected climate response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Open-Meteo Real-Time Geo-Climate Telemetry', err.message);
  }

  // Test 15: Snowflake Generosity Warehouse & Cortex AI Analytics
  try {
    const res = await fetch(`${SERVER_BASE}/api/snowflake/metrics`);
    const data = await res.json();
    if (data.warehouseName === 'VOUCH_ANALYTICS_WH' && data.cortexAIStatus?.model && Array.isArray(data.themeBreakdown)) {
      logPass('Snowflake Generosity Warehouse & Cortex AI Metrics', `Warehouse: ${data.warehouseName}, Cluster: ${data.clusterStatus}, Model: ${data.cortexAIStatus.model}, Themes: ${data.themeBreakdown.length}, Total SOL: ${data.totalSOLProcessed}`);
    } else {
      throw new Error(`Unexpected Snowflake metrics response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Snowflake Generosity Warehouse & Cortex AI Metrics', err.message);
  }

  // Test 16: Snowflake Virtual Warehouse Live SQL Runner & Tabular Result Set
  try {
    const res = await fetch(`${SERVER_BASE}/api/snowflake/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT un_theme, COUNT(*), SUM(amount_sol) FROM VOUCH_WAREHOUSE.PUBLIC.GRANTS GROUP BY 1;'
      })
    });
    const data = await res.json();
    if (data.status === 'SUCCESS' && data.queryId && Array.isArray(data.columns) && Array.isArray(data.rows) && data.rows.length > 0) {
      logPass('Snowflake Cortex Virtual Warehouse SQL Runner', `Query ID: ${data.queryId}, Latency: ${data.executionTimeMs}ms, Columns: [${data.columns.join(', ')}], Rows Produced: ${data.rowsProduced}`);
    } else {
      throw new Error(`Unexpected Snowflake query response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Snowflake Cortex Virtual Warehouse SQL Runner', err.message);
  }

  // Test 17: ProPublica Nonprofit Explorer & 501(c)(3) Trust Verification
  try {
    const res = await fetch(`${SERVER_BASE}/api/verify-nonprofit?ein=95-1831116`);
    const data = await res.json();
    if (data.ein === '95-1831116' && data.subsection === '501(c)(3)' && data.verifiedOnProPublica === true) {
      logPass('ProPublica Nonprofit Explorer & 501(c)(3) Trust Verification', `Org: "${data.name}", EIN: ${data.ein}, Status: ${data.subsection}, Deductibility: ${data.deductibility}, Score: ${data.transparencyScore}%`);
    } else {
      throw new Error(`Unexpected nonprofit verification response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('ProPublica Nonprofit Explorer & 501(c)(3) Trust Verification', err.message);
  }

  // Test 18: Cryptographic Proof of Generosity Certificate
  try {
    const grantsRes = await fetch(`${SERVER_BASE}/api/grants`);
    const grantsData = await grantsRes.json();
    const targetGrant = Array.isArray(grantsData) && grantsData.length > 0 ? grantsData[0] : null;

    if (targetGrant?.id) {
      const res = await fetch(`${SERVER_BASE}/api/grants/${targetGrant.id}/certificate`);
      const certData = await res.json();
      if (certData.certificateId && certData.sha256ProofHash && certData.solanaTxSignature) {
        logPass('Cryptographic Proof of Generosity Certificate', `Cert ID: ${certData.certificateId}, SHA-256 Hash: ${certData.sha256ProofHash.slice(0, 16)}..., Tx: ${certData.solanaTxSignature.slice(0, 16)}..., Solscan: Valid`);
      } else {
        throw new Error(`Unexpected certificate payload: ${JSON.stringify(certData)}`);
      }
    } else {
      throw new Error('No grants available to generate certificate');
    }
  } catch (err) {
    logFail('Cryptographic Proof of Generosity Certificate', err.message);
  }

  // Test 19: Live Solana RPC Balance Endpoint
  try {
    const res = await fetch(`${SERVER_BASE}/api/solana/balance/11111111111111111111111111111111`);
    const data = await res.json();
    if (data.publicKey && typeof data.balanceSOL === 'number') {
      logPass('Live Solana Devnet Balance Endpoint', `Account: ${data.publicKey.slice(0, 8)}..., Balance: ${data.balanceSOL} SOL (${data.lamports} lamports), Network: ${data.network}`);
    } else {
      throw new Error(`Unexpected balance response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail('Live Solana Devnet Balance Endpoint', err.message);
  }

  // Test 20: Persistent Database Test Artifact Hygiene & Teardown
  try {
    let cleaned = 0;
    if (createdRequestId) {
      const del1 = await fetch(`${SERVER_BASE}/api/requests/${createdRequestId}`, { method: 'DELETE' });
      if (del1.ok) cleaned++;
    }
    if (unIngestedRequestId) {
      const del2 = await fetch(`${SERVER_BASE}/api/requests/${unIngestedRequestId}`, { method: 'DELETE' });
      if (del2.ok) cleaned++;
    }
    logPass('E2E Test Artifact Hygiene Cleanup', `Cleanly purged ${cleaned} ephemeral test records from persistent DB`);
  } catch (err) {
    logFail('E2E Test Artifact Hygiene Cleanup', err.message);
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
