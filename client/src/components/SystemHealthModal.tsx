import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  X,
  RefreshCw,
  Database,
  Cpu,
  Layers,
  Server,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';

interface SystemStatus {
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  uptime: number;
  nodeVersion: string;
  timestamp: string;
}

interface ReadinessData {
  status: string;
  database: string;
  redis: string;
  queue: string;
}

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, readyRes] = await Promise.allSettled([
        api.get('/system/status'),
        api.get('/ready', { validateStatus: () => true }),
      ]);
      if (statusRes.status === 'fulfilled' && statusRes.value?.data?.data) {
        setStatus(statusRes.value.data.data);
      }
      if (readyRes.status === 'fulfilled' && readyRes.value?.data?.data) {
        setReadiness(readyRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
    }
  }, [isOpen, fetchTelemetry]);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const timer = setInterval(() => {
      fetchTelemetry();
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen, autoRefresh, fetchTelemetry]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel p-6 w-full"
        style={{
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
              }}
            >
              <Activity size={20} color="var(--accent-indigo)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Platform Telemetry & Observability</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Real-time Prometheus instrumentation and distributed queue health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {autoRefresh ? 'Live (3s)' : 'Paused'}
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Component Health Grid */}
        <div
          className="telemetry-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            className="p-3"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>POSTGRESQL</span>
              <Database size={14} color="var(--accent-indigo)" />
            </div>
            <div className="flex items-center gap-1.5">
              {readiness?.database === 'connected' ? (
                <>
                  <CheckCircle2 size={14} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>CONNECTED</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} color="var(--accent-rose)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)' }}>OFFLINE</span>
                </>
              )}
            </div>
          </div>

          <div
            className="p-3"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REDIS CACHE</span>
              <Layers size={14} color="var(--accent-cyan)" />
            </div>
            <div className="flex items-center gap-1.5">
              {readiness?.redis === 'connected' ? (
                <>
                  <CheckCircle2 size={14} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>CONNECTED</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} color="var(--accent-rose)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)' }}>OFFLINE</span>
                </>
              )}
            </div>
          </div>

          <div
            className="p-3"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>BULLMQ QUEUE</span>
              <Server size={14} color="var(--accent-amber)" />
            </div>
            <div className="flex items-center gap-1.5">
              {readiness?.queue === 'connected' ? (
                <>
                  <CheckCircle2 size={14} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>READY</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} color="var(--accent-rose)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)' }}>OFFLINE</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Queue Telemetry */}
        <div
          className="p-4 mb-4"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>BullMQ Queue Depth</span>
            <span className="badge badge-queued" style={{ fontSize: '0.65rem' }}>
              DISTRIBUTED WORKER POOL
            </span>
          </div>

          <div className="telemetry-queue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            <div className="p-2" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {status?.queue.waiting ?? 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WAITING</div>
            </div>

            <div className="p-2" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                {status?.queue.active ?? 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACTIVE (SANDBOX)</div>
            </div>

            <div className="p-2" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {status?.queue.completed ?? 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMPLETED</div>
            </div>

            <div className="p-2" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                {status?.queue.failed ?? 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DEAD-LETTER (DLQ)</div>
            </div>
          </div>
        </div>

        {/* Runtime & Memory Telemetry */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            fontSize: '0.8rem',
          }}
        >
          <div
            className="p-3 flex items-center justify-between"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Cpu size={16} color="var(--accent-indigo)" />
              <span style={{ color: 'var(--text-secondary)' }}>Memory (Heap / RSS):</span>
            </div>
            <span style={{ fontWeight: 600 }}>
              {status ? `${status.memory.heapUsedMb} MB / ${status.memory.rssMb} MB` : '—'}
            </span>
          </div>

          <div
            className="p-3 flex items-center justify-between"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} color="var(--accent-cyan)" />
              <span style={{ color: 'var(--text-secondary)' }}>Server Uptime:</span>
            </div>
            <span style={{ fontWeight: 600 }}>
              {status ? `${Math.round(status.uptime)}s` : '—'}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Prometheus Scraper: <code>/api/metrics</code></span>
          <span>Node.js: {status?.nodeVersion || 'v24.x'}</span>
        </div>
      </div>
    </div>
  );
};
