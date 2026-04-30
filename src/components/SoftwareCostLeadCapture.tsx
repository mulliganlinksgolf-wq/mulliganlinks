'use client'

/**
 * TeeAhead — Software Cost Lead Capture
 *
 * DROP-IN for /software-cost page.
 *
 * HOW TO USE:
 * 1. Import this component into your software-cost page
 * 2. Wrap your existing calculator results section with <SoftwareCostLeadCapture>
 * 3. Pass the calculated totals as props (see Props below)
 * 4. Wire onLeadSubmit to your email provider (Resend, Mailchimp, etc.)
 *
 * The modal fires automatically when the user's calculated total exceeds $5,000/yr.
 * It fires once per session (stored in sessionStorage).
 * The "Download Report" and "Share" buttons are always visible after calculation.
 */

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostBreakdown {
  annualSubscription: number      // e.g. 3600
  processingMarkup: number        // e.g. 4000
  marketplaceBarter: number       // e.g. 9100
  totalExtraction: number         // e.g. 16700
  savingsAsFounder: number        // e.g. 16700
  savingsAsStandard: number       // e.g. 12512
  selectedVendor?: string         // e.g. "foreUP"
}

interface LeadData {
  name: string
  email: string
  role: string
  courseName: string
  calculatedSavings: number
  vendor: string
}

interface Props {
  costs: CostBreakdown
  onLeadSubmit?: (lead: LeadData) => Promise<void>
  // Optional: override the threshold above which the modal auto-fires
  autoFireThreshold?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'ta_lead_shown'
const STANDARD_MONTHLY = 349
const STANDARD_ANNUAL = STANDARD_MONTHLY * 12

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString()
}

function getTangibles(total: number): Array<{ icon: string; label: string }> {
  const items = [
    { icon: '🛺', label: 'new golf cart', cost: 8000 },
    { icon: '📱', label: 'tee sheet software (10 yrs)', cost: 4200 },
    { icon: '👔', label: 'full-time staff salary', cost: 45000 },
    { icon: '🌿', label: 'fairway renovation', cost: 25000 },
    { icon: '📣', label: 'local marketing campaign', cost: 3500 },
    { icon: '🏌️', label: 'pro shop remodel', cost: 15000 },
  ]
  return items
    .map(item => ({ ...item, qty: Math.floor(total / item.cost) }))
    .filter(item => item.qty >= 1)
    .map(item => ({
      icon: item.icon,
      label: item.qty === 1 ? `1 ${item.label}` : `${item.qty}× ${item.label}`,
    }))
    .slice(0, 4)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SoftwareCostLeadCapture({
  costs,
  onLeadSubmit,
  autoFireThreshold = 5000,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    courseName: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  // Auto-fire modal once per session when total exceeds threshold
  useEffect(() => {
    if (
      costs.totalExtraction > autoFireThreshold &&
      !sessionStorage.getItem(SESSION_KEY)
    ) {
      const timer = setTimeout(() => {
        setModalOpen(true)
        sessionStorage.setItem(SESSION_KEY, '1')
      }, 1200) // slight delay so the number animation lands first
      return () => clearTimeout(timer)
    }
  }, [costs.totalExtraction, autoFireThreshold])

  const validate = useCallback(() => {
    const e: Partial<typeof form> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Valid email required'
    return e
  }, [form])

  const handleSubmit = useCallback(async () => {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setLoading(true)
    try {
      await onLeadSubmit?.({
        name: form.name,
        email: form.email,
        role: form.role,
        courseName: form.courseName,
        calculatedSavings: costs.savingsAsFounder,
        vendor: costs.selectedVendor ?? 'Unknown',
      })
    } catch (err) {
      console.error('Lead submit error:', err)
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }, [form, costs, onLeadSubmit, validate])

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText('https://teeahead.com/software-cost')
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => setCopied(true))
  }, [])

  const handleLinkedIn = useCallback(() => {
    const text = encodeURIComponent(
      `We just calculated what our golf management software is actually costing us — ${fmt(costs.totalExtraction)}/year in subscriptions, processing markups, and marketplace barter. TeeAhead charges $349/month flat. No barter. No commissions. No data extraction. Worth a look: https://teeahead.com/software-cost`
    )
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=https://teeahead.com/software-cost&summary=${text}`,
      '_blank'
    )
  }, [costs.totalExtraction])

  const tangibles = getTangibles(costs.totalExtraction)

  return (
    <>
      {/* ── Share / Download bar — shown below results ── */}
      <div style={styles.shareBar}>
        <p style={styles.shareLabel}>
          Share your results — help other courses see the real cost
        </p>
        <div style={styles.shareRow}>
          <button style={styles.shareBtn} onClick={() => setModalOpen(true)}>
            ↓ Get full report
          </button>
          <button style={styles.shareBtn} onClick={handleCopy}>
            {copied ? '✓ Copied' : '⎘ Copy link'}
          </button>
          <button style={styles.shareBtn} onClick={handleLinkedIn}>
            in Share on LinkedIn
          </button>
        </div>

        {tangibles.length > 0 && (
          <div style={styles.tangibleGrid}>
            <p style={styles.tangibleTitle}>
              What {fmt(costs.totalExtraction)}/yr could buy you instead
            </p>
            <div style={styles.tangibleItems}>
              {tangibles.map((t, i) => (
                <div key={i} style={styles.tangibleItem}>
                  <span style={styles.tangibleIcon}>{t.icon}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal overlay ── */}
      {modalOpen && (
        <div style={styles.overlay} onClick={() => setModalOpen(false)}>
          <div
            style={styles.modal}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {!submitted ? (
              <>
                <h2 id="modal-title" style={styles.modalTitle}>
                  Get your full cost breakdown
                </h2>
                <p style={styles.modalSub}>
                  We'll send you a personalized PDF showing your exact extraction
                  numbers — and what you'd save with TeeAhead.
                </p>

                {/* Pain summary */}
                <div style={styles.painBox}>
                  <div style={styles.painRow}>
                    <span style={styles.painLabel}>Annual subscription</span>
                    <span style={styles.painValue}>
                      {fmt(costs.annualSubscription)}
                    </span>
                  </div>
                  <div style={styles.painRow}>
                    <span style={styles.painLabel}>Processing markup</span>
                    <span style={styles.painValue}>
                      {fmt(costs.processingMarkup)}
                    </span>
                  </div>
                  <div style={styles.painRow}>
                    <span style={styles.painLabel}>Marketplace barter</span>
                    <span style={styles.painValue}>
                      {fmt(costs.marketplaceBarter)}
                    </span>
                  </div>
                  <div style={{ ...styles.painRow, ...styles.painTotal }}>
                    <span style={styles.painLabel}>Total extraction</span>
                    <span style={{ ...styles.painValue, color: '#D85A30' }}>
                      {fmt(costs.totalExtraction)}
                    </span>
                  </div>
                </div>

                {/* Form */}
                <div style={styles.fieldStack}>
                  <input
                    style={{
                      ...styles.input,
                      ...(errors.name ? styles.inputError : {}),
                    }}
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => {
                      setForm(f => ({ ...f, name: e.target.value }))
                      setErrors(er => ({ ...er, name: undefined }))
                    }}
                  />
                  {errors.name && (
                    <span style={styles.errorMsg}>{errors.name}</span>
                  )}

                  <input
                    style={{
                      ...styles.input,
                      ...(errors.email ? styles.inputError : {}),
                    }}
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={e => {
                      setForm(f => ({ ...f, email: e.target.value }))
                      setErrors(er => ({ ...er, email: undefined }))
                    }}
                  />
                  {errors.email && (
                    <span style={styles.errorMsg}>{errors.email}</span>
                  )}

                  <input
                    style={styles.input}
                    placeholder="Role (e.g. GM, Owner, Director of Golf)"
                    value={form.role}
                    onChange={e =>
                      setForm(f => ({ ...f, role: e.target.value }))
                    }
                  />
                  <input
                    style={styles.input}
                    placeholder="Course name (optional)"
                    value={form.courseName}
                    onChange={e =>
                      setForm(f => ({ ...f, courseName: e.target.value }))
                    }
                  />
                </div>

                <div style={styles.modalActions}>
                  <button
                    style={styles.btnPrimary}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Sending…' : 'Send my report'}
                  </button>
                  <button
                    style={styles.btnGhost}
                    onClick={() => setModalOpen(false)}
                  >
                    Skip for now
                  </button>
                </div>

                <p style={styles.modalFootnote}>
                  No spam. We'll also let you know when TeeAhead launches in
                  Metro Detroit.
                </p>
              </>
            ) : (
              <div style={styles.successBox}>
                <div style={styles.successIcon}>✓</div>
                <h2 style={styles.successTitle}>You're on the list</h2>
                <p style={styles.successSub}>
                  We'll send your cost breakdown to{' '}
                  <strong>{form.email}</strong> shortly. Neil will also reach
                  out personally before launch.
                </p>
                <button
                  style={styles.btnPrimary}
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Inline styles (no Tailwind dependency) ──────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  shareBar: {
    marginTop: '2rem',
    padding: '1.5rem',
    border: '0.5px solid #e5e5e5',
    borderRadius: '12px',
    background: '#fafafa',
  },
  shareLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '0.75rem',
  },
  shareRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },
  shareBtn: {
    padding: '0 1rem',
    height: '38px',
    border: '0.5px solid #d0d0d0',
    borderRadius: '8px',
    background: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#333',
  },
  tangibleGrid: {
    marginTop: '0.5rem',
  },
  tangibleTitle: {
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#888',
    marginBottom: '0.75rem',
  },
  tangibleItems: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
  },
  tangibleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#444',
    padding: '8px 10px',
    background: 'white',
    borderRadius: '8px',
    border: '0.5px solid #e5e5e5',
  },
  tangibleIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },

  // Modal
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  },
  modalTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: '22px',
    fontWeight: 400,
    marginBottom: '0.5rem',
    color: '#111',
  },
  modalSub: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '1.25rem',
  },

  // Pain summary
  painBox: {
    background: '#fafafa',
    border: '0.5px solid #e5e5e5',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.25rem',
  },
  painRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
    color: '#444',
  },
  painTotal: {
    borderTop: '0.5px solid #e5e5e5',
    marginTop: '6px',
    paddingTop: '10px',
    fontWeight: 500,
  },
  painLabel: {
    color: '#666',
  },
  painValue: {
    fontWeight: 500,
    color: '#111',
  },

  // Form
  fieldStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    border: '0.5px solid #d0d0d0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: 'white',
    color: '#111',
    outline: 'none',
  },
  inputError: {
    borderColor: '#D85A30',
    boxShadow: '0 0 0 2px rgba(216,90,48,0.12)',
  },
  errorMsg: {
    fontSize: '12px',
    color: '#D85A30',
    marginTop: '-6px',
  },

  // Buttons
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  btnPrimary: {
    flex: 1,
    height: '42px',
    background: '#D85A30',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnGhost: {
    padding: '0 1rem',
    height: '42px',
    background: 'transparent',
    color: '#666',
    border: '0.5px solid #d0d0d0',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  modalFootnote: {
    fontSize: '11px',
    color: '#aaa',
    textAlign: 'center' as const,
  },

  // Success state
  successBox: {
    textAlign: 'center' as const,
    padding: '1rem 0',
  },
  successIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#eaf3de',
    color: '#3B6D11',
    fontSize: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  successTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: '22px',
    fontWeight: 400,
    marginBottom: '0.5rem',
    color: '#111',
  },
  successSub: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
}
