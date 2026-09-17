import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { jqlService } from '../services/jql.service';

describe('Server API Endpoints', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /readiness should return diagnostic system metrics', async () => {
    const res = await request(app).get('/readiness');
    expect([200, 503]).toContain(res.status);
    expect(res.body.system).toBeDefined();
    expect(res.body.system.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(res.body.database).toBeDefined();
  });

  it('GET /api/docs/json should return OpenAPI 3.0 schema', async () => {
    const res = await request(app).get('/api/docs/json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toContain('ProjectPilot');
  });

  it('GET /api/auth/me without token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/login with invalid email format should return 422 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET non-existent route should return 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/invalid-route-name');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Issue Query Language (JQL) Engine', () => {
  it('tokenizes keywords, operators, and literals correctly', () => {
    const tokens = jqlService.tokenize('status = done AND priority in (high, highest) ORDER BY position DESC');
    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens.some((t) => t.type === 'ORDER_BY')).toBe(true);
    expect(tokens.some((t) => t.type === 'AND')).toBe(true);
  });

  it('compiles valid JQL into MongoDB filter query', async () => {
    const res = await jqlService.parseAndCompile(
      'status = done AND priority in (high, highest)',
      'proj-123'
    );
    expect(res.valid).toBe(true);
    expect(res.mongoQuery).toBeDefined();
    expect((res.mongoQuery as any).project).toBe('proj-123');
    expect((res.mongoQuery as any).$and).toBeDefined();
  });

  it('substitutes "me" keyword with current user id', async () => {
    const currentUserId = '665000000000000000000001';
    const res = await jqlService.parseAndCompile(
      'assignee = me',
      'proj-123',
      currentUserId
    );
    expect(res.valid).toBe(true);
    expect((res.mongoQuery as any).assignee).toBe(currentUserId);
  });

  it('returns syntax error for invalid fields', async () => {
    const res = await jqlService.parseAndCompile(
      'invalidField = foo',
      'proj-123'
    );
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Unknown field');
  });

  it('generates context-aware autocomplete suggestions', () => {
    const emptySuggestions = jqlService.getSuggestions('');
    expect(emptySuggestions.length).toBeGreaterThan(0);
    expect(emptySuggestions.some((s) => s.value === 'status')).toBe(true);

    const opSuggestions = jqlService.getSuggestions('status ');
    expect(opSuggestions.some((s) => s.value === '=')).toBe(true);

    const valSuggestions = jqlService.getSuggestions('status = ');
    expect(valSuggestions.some((s) => s.value === 'done')).toBe(true);
  });
});
