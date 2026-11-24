import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'node:crypto';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import { GeminiAIService } from '../ai/gemini-ai.service';

export interface RetrievedChunk {
  id: string;
  source: string;
  section: string;
  content: string;
  score: number;
  retrievalPath?: 'atlas_vector' | 'cosine_fallback' | 'keyword_idf' | 'hybrid_rrf';
}

/**
 * Curated, self-contained EcoStep Brain Knowledge Base.
 * Does NOT depend on local docs/ files on disk — works identically in local dev and Render production.
 */
const ECOSTEP_BRAIN_KNOWLEDGE: Array<{
  source: string;
  section: string;
  content: string;
}> = [
    {
      source: 'ecostep_brain',
      section: 'System Overview & Mission',
      content:
        'EcoStep is a smart piezoelectric footstep kinetic energy harvesting and real-time IoT monitoring system developed at Cebu Technological University (CTU) Daanbantayan Campus. Website: https://ecostep.cebutech.digital. Backend API: https://ecostep-xvck.onrender.com. Every footstep compresses piezoelectric (PZT) discs inside the floor tile, generating electrical energy that is rectified, buffered in capacitors, sampled by an ESP32 microcontroller, and streamed live to the cloud dashboard.',
    },
    {
      source: 'ecostep_brain',
      section: 'Research Team (CTU Daanbantayan)',
      content:
        'The EcoStep Research Team consists of 6 members: Lord Jason Riveral (Project Lead & Hardware Lead), Merry Apple Edaño (Software and Manuscript Lead), Jerome Magdadaro (Hardware Assistant), Jhemarsh Lee Conde (Documentation and Debugging), Alyza Pitogo (Documentation and Debugging), and Francis Keith Banan (Documentation & Hardware Worker).',
    },
    {
      source: 'ecostep_brain',
      section: 'Public Website Pages & Navigation',
      content:
        'Public visitors need no login to explore: Landing Page (/) with How it works, EcoStepMat animation, Dashboard preview, EcoGuide preview, and About section (YouTube promo video + Research Team); Central Dashboard (/dashboard) showing live POWER OUTPUT (mW, Live vs Standby), STEPS TODAY, ENERGY TODAY (mWh), Voltage, Current, hardware status pill, and a Refresh button; Analytics (/analytics) for historical charts and records with zero-record filtering; Milestone (/milestones) for monthly & weekly energy goals; About (/about); and EcoGuide AI assistant.',
    },
    {
      source: 'ecostep_brain',
      section: 'User Roles, Security & Admin Pages',
      content:
        'EcoStep has 3 access levels: (1) Public Visitors get read-only access and live read-only Socket.IO updates without logging in. (2) SYSTEM_ADMIN logs in via Access Code at /admin/login (no inactivity auto-logout; stays signed in until manual logout) and unlocks Health (/admin/diagnostics), Ledger (/reports), and Settings (/settings). (3) SUPER_ADMIN is restricted to Admins (/admin-management) and Logs (/admin/logs) audit trails. Hardware ESP32 units authenticate via X-API-Key header and must have status active.',
    },
    {
      source: 'ecostep_brain',
      section: 'Real-Time Architecture & Database Collections',
      content:
        'Telemetry flows from ESP32 via POST /api/iot/readings or POST /api/iot/piezo/readings to NestJS, stored in MongoDB Atlas (energy-monitoring database) with compound index { sensorId, timestamp } (IXSCAN). Every reading triggers dual real-time push: Socket.IO (reading:new) and Firebase Firestore (liveReadings/latest), plus automatic React Query cache invalidation on the frontend. Core MongoDB collections: users, sensors, energy_readings, alerts, reports, audit_logs, milestone_targets, diagnostic_tests, daily_diagnostic_tasks, reference_configs, notification_logs, subscribers, players, and knowledge_chunks.',
    },
    {
      source: 'ecostep_brain',
      section: 'Dashboard Logical Rules & Timezone',
      content:
        'All daily totals (STEPS TODAY, ENERGY TODAY, todayTotalPower) use Asia/Manila (UTC+8) midnight-to-midnight boundaries converted to UTC via fromZonedTime. Central shows Live when a valid reading from today arrives and Standby (0.00 mW) when idle. STEPS TODAY sums per-upload step counts directly across all sensors. The top status badge shows Standby (connected to EcoStep and waiting for footsteps, since the tile only sends data when stepped on), Live (active footstep reading within 60s or active BLE), or Connection Lost (live server connection dropped).',
    },
    {
      source: 'ecostep_brain',
      section: 'Web Bluetooth (BLE) Wi-Fi Provisioning',
      content:
        'In Settings (/settings), admins can pair directly from Chrome or Edge over HTTPS with the ESP32 (EcoStep-Harvester) via Web Bluetooth without a native mobile app. On connect, EcoStep displays "ESP32 Connection Successful", requests a 2.4 GHz Wi-Fi scan ({"cmd":"scan"} -> wifi_list) with manual SSID fallback, stays connected when the modal closes, auto-retries GATT reconnection up to 3 times on brief drops, and warns "ESP32 Is Already Connected" if reopened while paired.',
    },
    {
      source: 'ecostep_brain',
      section: 'Tile Health Diagnostics, Milestones & Ledger Reports',
      content:
        'Tile Health (/admin/diagnostics) compares a firm footstep test against a 30-day normal output baseline (mWh per step, ±34% normal zone) via Start test mode and logs Daily tasks and All runs. Milestones (/milestones) tracks monthly and weekly kinetic energy targets; admins configure targets by the 2nd day of each month (Asia/Manila) or see an overdue reminder banner. Ledger (/reports) generates downloadable PDF and Excel energy reports by date range.',
    },
    {
      source: 'ecostep_brain',
      section: 'SOP Verification & Performance Benchmarks',
      content:
        'Automated SOP verification on ecostep.cebutech.digital achieved: SOP 2.2 Batch Reliability 20/20 packets saved (100% PSTR, HTTP 201); SOP 2.3A DB Integrity 5/5 passed (IXSCAN true, 0 duplicates, lastSeenAt synced); SOP 2.3B API Latency 135.05-205.05 ms (mean 156.12 ms, <500 ms Pass); SOP 2.4A E2E UI Latency mean 929.6 ms (steady-state T2-T5: 765.75 ms, <3000 ms Pass); SOP 2.4B UI Accuracy 100% match between MongoDB and Dashboard.',
    },
  ];

@Injectable()
export class KnowledgeRagService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeRagService.name);
  private readonly vectorIndexName =
    process.env.MONGODB_VECTOR_INDEX_NAME || 'knowledge_vector_index';
  private readonly minVectorScore = 0.58;

  constructor(
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    private readonly geminiService: GeminiAIService,
  ) { }

  onModuleInit(): void {
    // Non-blocking background sync so server startup is never delayed
    void this.syncKnowledgeBase().catch((err) => {
      this.logger.warn(`Knowledge RAG background sync skipped: ${err?.message || err}`);
    });
  }

  /**
   * Sync the curated EcoStep Brain Knowledge Base into MongoDB `knowledge_chunks`
   * with Gemini vector embeddings, removing any stale chunks.
   */
  async syncKnowledgeBase(): Promise<{ indexed: number; total: number }> {
    const STATIC_SOURCE = 'ecostep_brain';
    const curatedChunks = ECOSTEP_BRAIN_KNOWLEDGE.map((item) => ({
      ...item,
      source: STATIC_SOURCE,
      contentHash: this.hash(`${STATIC_SOURCE}:${item.section}:${item.content}`),
    }));

    const validHashes = curatedChunks.map((c) => c.contentHash);
    // Only manage chunks owned by the curated static source; never delete custom DB chunks
    await this.chunkModel
      .deleteMany({
        source: STATIC_SOURCE,
        contentHash: { $nin: validHashes },
      })
      .exec();

    const existing = await this.chunkModel
      .find({ source: STATIC_SOURCE }, { contentHash: 1, embedding: 1 })
      .lean()
      .exec();
    const existingMap = new Map<string, number[]>(
      existing.map((doc: any) => [doc.contentHash, doc.embedding || []]),
    );

    let indexed = 0;
    for (const chunk of curatedChunks) {
      const existingEmbedding = existingMap.get(chunk.contentHash);
      if (existingEmbedding && existingEmbedding.length > 0) {
        continue;
      }

      const embedding = await this.geminiService.embedText(
        `${chunk.section}\n${chunk.content}`,
      );

      await this.chunkModel.updateOne(
        { contentHash: chunk.contentHash },
        {
          $set: {
            source: chunk.source,
            section: chunk.section,
            content: chunk.content,
            contentHash: chunk.contentHash,
            embedding: embedding ?? [],
          },
        },
        { upsert: true },
      );
      indexed++;
    }

    this.logger.log(
      `[RAG] EcoStep Brain ready (${curatedChunks.length} chunks, ${indexed} newly embedded)`,
    );

    // Ensure MongoDB Atlas vector search index exists with matching dimensions (3072 for gemini-embedding-001)
    const sampleDoc = await this.chunkModel
      .findOne({ 'embedding.0': { $exists: true } }, { embedding: 1 })
      .lean()
      .exec();
    const numDimensions = sampleDoc?.embedding?.length || 3072;
    await this.ensureVectorSearchIndex(numDimensions);

    return { indexed, total: curatedChunks.length };
  }

  private async ensureVectorSearchIndex(numDimensions: number): Promise<void> {
    try {
      const collection = this.chunkModel.collection;
      const existing = await collection
        .listSearchIndexes(this.vectorIndexName)
        .toArray();

      const desiredDefinition = {
        fields: [
          {
            type: 'vector',
            path: 'embedding',
            numDimensions,
            similarity: 'cosine',
          },
        ],
      };

      if (existing.length === 0) {
        await collection.createSearchIndex({
          name: this.vectorIndexName,
          type: 'vectorSearch',
          definition: desiredDefinition,
        });
        this.logger.log(
          `[RAG] Created Atlas vector index "${this.vectorIndexName}" (${numDimensions} dims, cosine)`,
        );
        return;
      }

      const currentField = (existing[0] as any)?.latestDefinition?.fields?.find(
        (f: any) => f.path === 'embedding',
      );
      if (currentField && currentField.numDimensions !== numDimensions) {
        await collection.updateSearchIndex(
          this.vectorIndexName,
          desiredDefinition,
        );
        this.logger.log(
          `[RAG] Updated Atlas vector index "${this.vectorIndexName}" to ${numDimensions} dims`,
        );
      }
    } catch (err: any) {
      this.logger.debug(
        `[RAG] Skipping Atlas vector index ensure: ${err?.message || err}`,
      );
    }
  }

  private static readonly RRF_K = 60;
  private static readonly KEYWORD_STOPWORDS = new Set([
    'the', 'is', 'are', 'was', 'were', 'a', 'an', 'in', 'on', 'at', 'to',
    'for', 'of', 'and', 'or', 'do', 'does', 'did', 'how', 'what', 'where',
    'when', 'why', 'who', 'can', 'my', 'your', 'it', 'its', 'this', 'that',
    'with', 'without', 'from', 'by', 'as', 'be', 'not', 'no', 'used', 'use',
    'about', 'does', 'into', 'out', 'up', 'set',
  ]);

  /**
   * Hybrid retrieval: runs vector search and IDF-weighted MongoDB keyword search
   * in parallel, then merges and deduplicates by chunk id via Reciprocal Rank Fusion (k=60).
   */
  async retrieveRelevantChunks(
    query: string,
    topK: number = 2,
  ): Promise<RetrievedChunk[]> {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const candidateK = Math.max(topK * 3, 6);

    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorRetrieve(trimmed, candidateK),
      this.keywordRetrieve(trimmed, candidateK),
    ]);

    if (vectorResults.length === 0 && keywordResults.length === 0) {
      return [];
    }

    const fused = new Map<string, { chunk: RetrievedChunk; rrfScore: number }>();

    const accumulate = (list: RetrievedChunk[]) => {
      list.forEach((chunk, index) => {
        const key = chunk.id || `${chunk.source}:${chunk.section}`;
        const contribution = 1 / (KnowledgeRagService.RRF_K + index + 1);
        const existing = fused.get(key);
        if (existing) {
          existing.rrfScore += contribution;
        } else {
          fused.set(key, { chunk, rrfScore: contribution });
        }
      });
    };

    accumulate(vectorResults);
    accumulate(keywordResults);

    return Array.from(fused.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, topK)
      .map(({ chunk, rrfScore }) => ({
        ...chunk,
        score: rrfScore,
        retrievalPath: 'hybrid_rrf',
      }));
  }

  async vectorRetrieve(
    query: string,
    topK: number,
  ): Promise<RetrievedChunk[]> {
    try {
      const queryVector = await this.geminiService.embedText(query);
      if (!queryVector || queryVector.length === 0) {
        return [];
      }

      // 1. Try native MongoDB Atlas $vectorSearch
      try {
        const atlasResults = await this.chunkModel.aggregate([
          {
            $vectorSearch: {
              index: this.vectorIndexName,
              path: 'embedding',
              queryVector,
              numCandidates: Math.max(topK * 10, 20),
              limit: topK,
            },
          },
          {
            $project: {
              _id: 1,
              source: 1,
              section: 1,
              content: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ]);

        if (atlasResults.length > 0) {
          // Atlas $vectorSearch cosine score is (1 + cosine) / 2; convert back to cosine [-1, 1]
          return atlasResults
            .map((r: any) => ({
              id: String(r._id),
              source: r.source,
              section: r.section,
              content: r.content,
              score: Math.max(-1, Math.min(1, 2 * (r.score ?? 0) - 1)),
              retrievalPath: 'atlas_vector' as const,
            }))
            .filter((r: any) => r.score >= this.minVectorScore);
        }
      } catch (atlasErr: any) {
        this.logger.debug(
          `[RAG] Atlas $vectorSearch unavailable (${atlasErr?.message}), using cosine similarity fallback`,
        );
      }

      // 2. Cosine similarity over stored MongoDB embeddings
      const docs = await this.chunkModel
        .find(
          { 'embedding.0': { $exists: true } },
          { _id: 1, source: 1, section: 1, content: 1, embedding: 1 },
        )
        .lean()
        .exec();

      if (docs.length > 0) {
        return docs
          .map((doc: any) => ({
            id: String(doc._id),
            source: doc.source,
            section: doc.section,
            content: doc.content,
            score: this.cosineSimilarity(queryVector, doc.embedding || []),
            retrievalPath: 'cosine_fallback' as const,
          }))
          .filter((c) => c.score >= this.minVectorScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      }
    } catch (err: any) {
      this.logger.warn(`[RAG] Vector retrieval failed: ${err?.message || err}`);
    }

    return [];
  }

  /**
   * IDF-weighted keyword retrieval directly over MongoDB `knowledge_chunks`.
   * No dependency on the hardcoded ECOSTEP_BRAIN_KNOWLEDGE array.
   */
  async keywordRetrieve(
    query: string,
    topK: number,
  ): Promise<RetrievedChunk[]> {
    const tokens = Array.from(
      new Set(
        query
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(
            (t) =>
              t.length > 2 && !KnowledgeRagService.KEYWORD_STOPWORDS.has(t),
          ),
      ),
    );

    if (tokens.length === 0) {
      return [];
    }

    try {
      const docs = await this.chunkModel
        .find({}, { _id: 1, source: 1, section: 1, content: 1 })
        .lean()
        .exec();

      if (docs.length === 0) {
        return [];
      }

      const totalDocs = docs.length;
      const docTexts = docs.map((doc: any) => ({
        doc,
        sectionLower: String(doc.section || '').toLowerCase(),
        fullLower: `${doc.section || ''} ${doc.content || ''}`.toLowerCase(),
      }));

      // Compute IDF per query token across the MongoDB collection
      const idfMap = new Map<string, number>();
      for (const token of tokens) {
        let df = 0;
        for (const item of docTexts) {
          if (item.fullLower.includes(token)) {
            df++;
          }
        }
        if (df > 0) {
          idfMap.set(token, Math.log((totalDocs + 1) / (df + 1)) + 1);
        }
      }

      if (idfMap.size === 0) {
        return [];
      }

      return docTexts
        .map(({ doc, sectionLower, fullLower }) => {
          let score = 0;
          for (const [token, idf] of idfMap.entries()) {
            if (fullLower.includes(token)) {
              score += sectionLower.includes(token) ? idf * 2 : idf;
            }
          }
          return {
            id: String(doc._id),
            source: doc.source,
            section: doc.section,
            content: doc.content,
            score,
            retrievalPath: 'keyword_idf' as const,
          };
        })
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch (err: any) {
      this.logger.warn(`[RAG] Keyword retrieval failed: ${err?.message || err}`);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
