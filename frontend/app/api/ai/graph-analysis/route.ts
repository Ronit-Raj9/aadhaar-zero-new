// POST /api/ai/graph-analysis – Proxy to Python GNN mule detection
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, withErrorHandling, withAuth } from '@/lib/api-middleware';

const AI_BACKEND = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MOCK_AI = process.env.MOCK_AI === 'true' || !process.env.AI_SERVICE_URL;

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();

    // Mock fallback when Python backend is unavailable
    if (MOCK_AI) {
      const nodeCount = body.transactions?.length || 5;
      return apiSuccess({
        total_nodes: nodeCount,
        flagged_nodes: 1,
        communities_detected: 2,
        anomaly_threshold: 0.5,
        nodes: Array.from({ length: Math.min(nodeCount, 5) }, (_, i) => ({
          id: `user_${i}`,
          anomaly_score: i === 0 ? 0.72 : Math.random() * 0.3,
          is_flagged: i === 0,
          centrality: { pagerank: Math.random() * 0.1, betweenness: Math.random() * 0.05, degree: Math.random() * 0.2 },
          community: i < 3 ? 0 : 1,
        })),
      });
    }

    try {
      const response = await fetch(`${AI_BACKEND}/risk/graph-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        return apiError(result.detail || 'Graph analysis failed', response.status);
      }

      return apiSuccess(result.data || result);
    } catch (err) {
      console.error('Graph analysis AI call failed:', err);
      return apiError('AI service unavailable', 503);
    }
  })
);
