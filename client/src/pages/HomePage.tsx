import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="container py-12 flex-1 flex flex-col justify-center">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center" style={{ maxWidth: '840px', margin: '0 auto' }}>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-6"
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            color: 'var(--accent-indigo)',
            fontWeight: 600,
          }}
        >
          <span className="badge badge-easy" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
            Production-Ready
          </span>
          Distributed Code Execution Engine
        </div>

        <h1 style={{ fontSize: '3.25rem', lineHeight: 1.15, fontWeight: 800, marginBottom: '1.25rem' }}>
          Master Algorithms on a{' '}
          <span className="text-gradient-accent">High-Performance</span> Code Judge
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Run your code inside isolated, resource-constrained Docker Alpine sandboxes with asynchronous BullMQ distributed
          queuing, Redis cache-aside acceleration, and real-time execution feedback.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/problems" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
            Browse Problems
            <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Feature Architecture Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '4.5rem',
        }}
      >
        <div className="glass-panel p-6">
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Shield size={22} color="var(--accent-indigo)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Isolated Docker Sandboxes</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every code submission executes in an Alpine Linux container with <code style={{ color: 'var(--accent-cyan)' }}>--network=none</code>,
            strict memory quotas (256MB), and PID limits to protect against fork bombs and security escapes.
          </p>
        </div>

        <div className="glass-panel p-6">
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Zap size={22} color="var(--accent-cyan)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Distributed Queue (BullMQ)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Submissions are enqueued onto Redis and dispatched to dedicated standalone worker pools, returning instant
            <code style={{ color: 'var(--accent-emerald)' }}> HTTP 201 Created</code> responses in under 15ms.
          </p>
        </div>

        <div className="glass-panel p-6">
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Cpu size={22} color="var(--accent-emerald)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Redis Caching & Rate Limiting</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Problem definitions are cached with proactive invalidation on updates. Token bucket rate limiting defends API
            servers against submission spam.
          </p>
        </div>
      </div>

      {/* Tech Stack Bar */}
      <div
        className="glass-panel p-4 flex items-center justify-between flex-wrap gap-4 mt-12"
        style={{ background: 'rgba(15, 23, 42, 0.5)' }}
      >
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          SYSTEM CAPABILITIES
        </span>
        <div className="flex items-center gap-6 flex-wrap" style={{ fontSize: '0.85rem' }}>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" /> Multi-language: Python 3, C++ 17, Java 21
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" /> Monaco VS-Code Web Editor
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" /> Optimistic Concurrency & DLQ
          </span>
        </div>
      </div>
    </div>
  );
};
