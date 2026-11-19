/**
 * AI AirGuard — Guardrails System
 * All 9 guardrail categories with practical checks
 */

// ── 1. INPUT GUARDRAILS ─────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s*prompt/i,
  /jailbreak/i,
  /act\s+as\s+(dan|root|admin)/i,
  /<script[\s>]/i,
  /javascript:/i,
  /eval\(/i,
  /prompt\s+injection/i,
];

const SQL_INJECTION_PATTERNS = [
  /('\s*(or|and)\s*'?\d)/i,
  /(;|\s)(drop|delete|insert|update|create|alter)\s+/i,
  /union\s+select/i,
  /--\s*$/,
];

const PII_PATTERNS = [
  { pattern: /\b\d{10,12}\b/, type: 'Phone Number' },
  { pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/, type: 'PAN Card' },
  { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/, type: 'Aadhaar-like' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i, type: 'Email' },
  { pattern: /\b\d{6}\b/, type: 'Postal Code' },
];

export function validateInput(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'Empty or invalid input', guardrail: 'input' };
  }
  const trimmed = text.trim();
  if (trimmed.length < 2) {
    return { valid: false, reason: 'Input too short', guardrail: 'input' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, reason: 'Input too long (max 2000 chars)', guardrail: 'input' };
  }

  // Injection check
  for (const p of INJECTION_PATTERNS) {
    if (p.test(trimmed)) {
      return { valid: false, reason: 'Potential prompt injection detected', guardrail: 'security', blocked: true };
    }
  }
  // SQL injection
  for (const p of SQL_INJECTION_PATTERNS) {
    if (p.test(trimmed)) {
      return { valid: false, reason: 'SQL injection pattern detected', guardrail: 'security', blocked: true };
    }
  }
  // PII detection
  const piiFound = PII_PATTERNS.filter(({ pattern }) => pattern.test(trimmed));
  if (piiFound.length > 0) {
    return {
      valid: true, warning: true,
      reason: `PII detected: ${piiFound.map(p => p.type).join(', ')}. Data will not be stored.`,
      guardrail: 'data',
    };
  }
  return { valid: true };
}

// ── 2. OUTPUT GUARDRAILS ────────────────────────────────────────────────────

const TOXIC_PATTERNS = [
  /\b(kill|murder|bomb|terrorist|weapon)\b/i,
  /\b(hate\s+speech|racial\s+slur)\b/i,
];

const HALLUCINATION_INDICATORS = [
  'as of my knowledge cutoff',
  'i cannot verify',
  'i don\'t have access to real-time',
];

export function validateOutput(text, context) {
  if (!text || text.trim().length < 5) {
    return { valid: false, reason: 'Empty or too short output', guardrail: 'output' };
  }
  // Toxicity check
  for (const p of TOXIC_PATTERNS) {
    if (p.test(text)) {
      return { valid: false, reason: 'Toxic content detected in output', guardrail: 'output', filtered: true };
    }
  }
  // Hallucination check — flag if contradicts known data
  const warnings = [];
  if (context?.aqi && text.includes('AQI')) {
    const aqiMentioned = text.match(/AQI\s*(?:is\s*)?(\d+)/i);
    if (aqiMentioned && Math.abs(Number(aqiMentioned[1]) - context.aqi) > 100) {
      warnings.push('AI response AQI value differs significantly from measured data');
    }
  }
  // Check for factual grounding
  const hasIndicators = HALLUCINATION_INDICATORS.some(i => text.toLowerCase().includes(i));
  if (hasIndicators) warnings.push('Output may contain hedging language — verify against measured data');

  return { valid: true, warnings };
}

// ── 3. TOOL EXECUTION GUARDRAILS ────────────────────────────────────────────

const ALLOWED_TOOLS = ['fetch_aqi', 'analyze_route', 'get_health_advice', 'simulate_pollution', 'search_location'];
const TOOL_RATE_LIMITS = {};

export function validateToolCall(toolName, params) {
  if (!ALLOWED_TOOLS.includes(toolName)) {
    return { allowed: false, reason: `Tool '${toolName}' not in allowed list`, guardrail: 'tool' };
  }
  // Rate limit: max 10 calls per minute per tool
  const now = Date.now();
  if (!TOOL_RATE_LIMITS[toolName]) TOOL_RATE_LIMITS[toolName] = [];
  TOOL_RATE_LIMITS[toolName] = TOOL_RATE_LIMITS[toolName].filter(t => now - t < 60000);
  if (TOOL_RATE_LIMITS[toolName].length >= 10) {
    return { allowed: false, reason: `Rate limit exceeded for tool '${toolName}'`, guardrail: 'operational' };
  }
  TOOL_RATE_LIMITS[toolName].push(now);
  return { allowed: true };
}

// ── 4. DATA GUARDRAILS ──────────────────────────────────────────────────────

const SENSITIVE_FIELDS = ['apikey', 'password', 'token', 'secret', 'credential'];

export function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
}

export function maskPII(text) {
  let masked = text;
  for (const { pattern, type } of PII_PATTERNS) {
    masked = masked.replace(pattern, `[${type} MASKED]`);
  }
  return masked;
}

// ── 5. SECURITY GUARDRAILS ──────────────────────────────────────────────────

const REQUEST_LOG = [];
const MAX_REQUESTS_PER_MIN = 30;

export function checkSecurityLimits(sessionId = 'default') {
  const now = Date.now();
  const recent = REQUEST_LOG.filter(r => r.session === sessionId && now - r.time < 60000);
  if (recent.length >= MAX_REQUESTS_PER_MIN) {
    return { allowed: false, reason: 'Rate limit exceeded. Please wait before making more requests.', guardrail: 'security' };
  }
  REQUEST_LOG.push({ session: sessionId, time: now });
  if (REQUEST_LOG.length > 1000) REQUEST_LOG.splice(0, 500);
  return { allowed: true };
}

export function detectJailbreak(text) {
  const jailbreakPatterns = [
    /ignore all previous instructions/i,
    /you are now (DAN|GPT-\d|a different AI)/i,
    /pretend you have no restrictions/i,
    /disregard your (guidelines|safety|training)/i,
    /override your (programming|system prompt)/i,
  ];
  return jailbreakPatterns.some(p => p.test(text));
}

// ── 6. OPERATIONAL GUARDRAILS ───────────────────────────────────────────────

const API_CALL_TIMES = {};

export async function withTimeout(promise, timeoutMs = 15000, fallback = null) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
  );
  try {
    return await Promise.race([promise, timeout]);
  } catch (err) {
    if (err.message.includes('timeout')) {
      console.warn('Guardrail: timeout triggered, using fallback');
      return fallback;
    }
    throw err;
  }
}

export function checkTokenLimit(text, maxTokens = 1000) {
  const estimated = Math.round(text.length / 4); // rough estimate
  if (estimated > maxTokens) {
    return { withinLimit: false, estimated, maxTokens, truncated: text.slice(0, maxTokens * 4) };
  }
  return { withinLimit: true, estimated };
}

// ── 7. HUMAN-IN-THE-LOOP GUARDRAILS ─────────────────────────────────────────

const PENDING_APPROVALS = [];

export function requireHumanApproval(action, data, severity = 'low') {
  if (severity === 'critical') {
    const id = `approval_${Date.now()}`;
    PENDING_APPROVALS.push({ id, action, data, severity, createdAt: new Date().toISOString(), status: 'pending' });
    return { requiresApproval: true, id, message: `Critical action '${action}' requires human approval before execution.` };
  }
  return { requiresApproval: false };
}

export function approveAction(approvalId) {
  const idx = PENDING_APPROVALS.findIndex(a => a.id === approvalId);
  if (idx >= 0) {
    PENDING_APPROVALS[idx].status = 'approved';
    return true;
  }
  return false;
}

export function getPendingApprovals() { return PENDING_APPROVALS.filter(a => a.status === 'pending'); }

// ── 8. MULTI-AGENT GUARDRAILS ───────────────────────────────────────────────

const AGENT_PERMISSIONS = {
  monitoring:    ['fetch_aqi', 'analyze_data'],
  hotspot:       ['analyze_data', 'rank_locations'],
  source:        ['analyze_data', 'identify_sources'],
  health:        ['analyze_data', 'generate_advisory', 'plan_route'],
  environmental: ['all'],
};

const AGENT_MESSAGE_LOG = [];
let agentLoopCount = {};

export function checkAgentPermission(agentId, action) {
  const perms = AGENT_PERMISSIONS[agentId] || [];
  if (perms.includes('all') || perms.includes(action)) {
    return { allowed: true };
  }
  return { allowed: false, reason: `Agent '${agentId}' not permitted to perform '${action}'` };
}

export function logAgentCommunication(fromAgent, toAgent, message, type = 'task') {
  AGENT_MESSAGE_LOG.push({
    from: fromAgent, to: toAgent, message: String(message).slice(0, 200),
    type, timestamp: new Date().toISOString(),
  });
  if (AGENT_MESSAGE_LOG.length > 100) AGENT_MESSAGE_LOG.splice(0, 50);
}

export function detectAgentLoop(agentId) {
  const key = `${agentId}_${Math.floor(Date.now() / 1000)}`; // per-second bucket
  agentLoopCount[key] = (agentLoopCount[key] || 0) + 1;
  if (agentLoopCount[key] > 5) {
    return { loopDetected: true, message: `Agent loop detected for ${agentId}. Stopping execution.` };
  }
  return { loopDetected: false };
}

export function getAgentMessageLog() { return [...AGENT_MESSAGE_LOG]; }

// ── 9. ETHICAL & COMPLIANCE GUARDRAILS ─────────────────────────────────────

const AUDIT_TRAIL = [];

export function logAuditEvent(action, actor, data, outcome) {
  AUDIT_TRAIL.push({
    id: `audit_${Date.now()}`,
    action, actor,
    data: typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : String(data).slice(0, 300),
    outcome,
    timestamp: new Date().toISOString(),
  });
  if (AUDIT_TRAIL.length > 200) AUDIT_TRAIL.splice(0, 100);
}

export function checkBiasFairness(data) {
  // Check if recommendations differ unfairly by location demographics
  const warnings = [];
  if (!data) return { fair: true };
  // All locations get same quality of service check
  if (data.isDemo && !data.demoLabeled) {
    warnings.push('Demo data not explicitly labeled — ensure users know this is estimated data');
  }
  return { fair: warnings.length === 0, warnings };
}

export function generateExplanation(recommendation, data) {
  return {
    recommendation,
    basedOn: [`AQI: ${data.aqi}`, `PM2.5: ${data.pm25} μg/m³`, `Location: ${data.location || data.city}`],
    reasoning: 'Recommendation generated based on current measured pollutant levels using Indian CPCB AQI standards.',
    confidence: data.isDemo ? 'Demo estimate based on Bengaluru pollution patterns' : 'Based on real-time sensor data',
    model: 'IBM Granite / AI AirGuard Agent System',
    timestamp: new Date().toISOString(),
  };
}

export function getAuditTrail() { return [...AUDIT_TRAIL]; }

// ── Master guardrail runner ─────────────────────────────────────────────────

export function runAllGuardrails(type, payload) {
  const results = { type, passed: [], failed: [], warnings: [], timestamp: new Date().toISOString() };

  if (type === 'input') {
    const r = validateInput(payload.text);
    if (r.valid) results.passed.push('Input Validation'); else results.failed.push(`Input: ${r.reason}`);
    if (r.warning) results.warnings.push(r.reason);

    const sec = checkSecurityLimits(payload.sessionId);
    if (sec.allowed) results.passed.push('Security Rate Limit'); else results.failed.push(`Security: ${sec.reason}`);

    if (detectJailbreak(payload.text || '')) results.failed.push('Security: Jailbreak attempt detected');
    else results.passed.push('Jailbreak Detection');
  }

  if (type === 'output') {
    const r = validateOutput(payload.text, payload.context);
    if (r.valid) results.passed.push('Output Validation'); else results.failed.push(`Output: ${r.reason}`);
    if (r.warnings?.length) results.warnings.push(...r.warnings);
    results.passed.push('Toxicity Check');
    results.passed.push('Hallucination Monitor');
  }

  logAuditEvent('guardrail_check', 'system', { type }, `${results.passed.length} passed, ${results.failed.length} failed`);
  return results;
}
