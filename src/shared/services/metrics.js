/**
 * In-memory application metrics collector.
 * Lightweight — no external dependencies. Exposes counters, histograms,
 * and snapshot helpers consumed by the /api/admin/metrics endpoint.
 */

class Metrics {
  constructor() {
    this.startedAt = Date.now();

    // Counters
    this.httpRequests = 0;
    this.httpErrors = 0;
    this.statusCodes = {};
    this.routeHits = {};

    // Latency histogram (buckets in ms)
    this.latencyBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 5000];
    this.latencyCounts = new Array(this.latencyBuckets.length + 1).fill(0);
    this.latencySum = 0;

    // Active connections
    this.activeRequests = 0;
    this.peakActiveRequests = 0;

    // Error tracking
    this.recentErrors = []; // ring buffer, last 50
    this.errorsByCode = {};

    // Per-minute request rate (rolling 60 slots)
    this._minuteSlots = new Array(60).fill(0);
    this._currentMinute = this._getMinuteIndex();
  }

  // ── Recording ──────────────────────────────────────────────

  recordRequest(method, path, statusCode, durationMs) {
    this.httpRequests++;

    // Status code distribution
    const codeGroup = `${Math.floor(statusCode / 100)}xx`;
    this.statusCodes[codeGroup] = (this.statusCodes[codeGroup] || 0) + 1;

    if (statusCode >= 400) {
      this.httpErrors++;
    }

    // Route hits (normalised path)
    const routeKey = `${method} ${this._normalisePath(path)}`;
    if (!this.routeHits[routeKey]) {
      this.routeHits[routeKey] = { count: 0, totalMs: 0, maxMs: 0 };
    }
    const route = this.routeHits[routeKey];
    route.count++;
    route.totalMs += durationMs;
    if (durationMs > route.maxMs) route.maxMs = durationMs;

    // Latency histogram
    this.latencySum += durationMs;
    let placed = false;
    for (let i = 0; i < this.latencyBuckets.length; i++) {
      if (durationMs <= this.latencyBuckets[i]) {
        this.latencyCounts[i]++;
        placed = true;
        break;
      }
    }
    if (!placed) this.latencyCounts[this.latencyBuckets.length]++;

    // Per-minute rate
    this._tickMinute();
  }

  recordError(error, req) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      code: error.code || "UNKNOWN",
      status: error.status || 500,
      method: req?.method,
      path: req?.originalUrl,
    };

    this.recentErrors.push(entry);
    if (this.recentErrors.length > 50) this.recentErrors.shift();

    const code = entry.code;
    this.errorsByCode[code] = (this.errorsByCode[code] || 0) + 1;
  }

  trackActive(delta) {
    this.activeRequests += delta;
    if (this.activeRequests > this.peakActiveRequests) {
      this.peakActiveRequests = this.activeRequests;
    }
  }

  // ── Snapshot ───────────────────────────────────────────────

  snapshot() {
    const uptimeMs = Date.now() - this.startedAt;
    const avgLatency =
      this.httpRequests > 0
        ? Math.round(this.latencySum / this.httpRequests)
        : 0;

    // Top 10 routes by count
    const topRoutes = Object.entries(this.routeHits)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([route, stats]) => ({
        route,
        count: stats.count,
        avgMs: Math.round(stats.totalMs / stats.count),
        maxMs: Math.round(stats.maxMs),
      }));

    // Build histogram
    const histogram = {};
    for (let i = 0; i < this.latencyBuckets.length; i++) {
      histogram[`<=${this.latencyBuckets[i]}ms`] = this.latencyCounts[i];
    }
    histogram[`>${this.latencyBuckets[this.latencyBuckets.length - 1]}ms`] =
      this.latencyCounts[this.latencyBuckets.length];

    return {
      uptime: Math.floor(uptimeMs / 1000),
      requests: {
        total: this.httpRequests,
        errors: this.httpErrors,
        errorRate:
          this.httpRequests > 0
            ? +(this.httpErrors / this.httpRequests * 100).toFixed(2)
            : 0,
        perMinute: this._getRequestsPerMinute(),
        active: this.activeRequests,
        peakActive: this.peakActiveRequests,
      },
      statusCodes: { ...this.statusCodes },
      latency: {
        avgMs: avgLatency,
        histogram,
      },
      topRoutes,
      errors: {
        byCode: { ...this.errorsByCode },
        recent: this.recentErrors.slice(-10),
      },
      system: {
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
      },
    };
  }

  // ── Private helpers ────────────────────────────────────────

  _normalisePath(path) {
    // Replace UUIDs / numeric IDs with :id
    return (path || "/")
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
      .replace(/\/\d+/g, "/:id")
      .split("?")[0];
  }

  _getMinuteIndex() {
    return Math.floor(Date.now() / 60000) % 60;
  }

  _tickMinute() {
    const idx = this._getMinuteIndex();
    if (idx !== this._currentMinute) {
      // Clear slots between last and current
      let i = (this._currentMinute + 1) % 60;
      while (i !== idx) {
        this._minuteSlots[i] = 0;
        i = (i + 1) % 60;
      }
      this._minuteSlots[idx] = 0;
      this._currentMinute = idx;
    }
    this._minuteSlots[idx]++;
  }

  _getRequestsPerMinute() {
    // Sum last 5 slots and average
    const idx = this._getMinuteIndex();
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      sum += this._minuteSlots[(idx - i + 60) % 60];
    }
    return Math.round(sum / 5);
  }
}

const metrics = new Metrics();

module.exports = { Metrics, metrics };
