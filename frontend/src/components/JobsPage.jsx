import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getActiveJobs, applyForJob, createJob } from './api';
import './JobsPage.css';
import logo from '../assets/almamatterslogowithname.jpeg';

/* ══ ICONS ══ */
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="30" height="30">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ══ CREATE JOB MODAL ══ */
function CreateJobModal({ currentUser, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '', description: '', required_skills: '',
    stipend_salary: '', expectations: '', qualification: '', application_deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.application_deadline) {
      setError('Title, description and deadline are required.'); return;
    }
    setLoading(true);
    try {
      await createJob({ alumni_id: currentUser.id, ...formData });
      onCreated(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to post job.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="jobs-modal-overlay" onClick={onClose}>
      <div className="jobs-modal-box" onClick={e => e.stopPropagation()}>
        <div className="jobs-modal-header">
          <h2>Post a Job</h2>
          <button className="jobs-modal-close" onClick={onClose}><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="jobs-form">
          <div>
            <label className="jobs-form-label">Job Title *</label>
            <input required className="jobs-input" placeholder="e.g. Frontend Developer Intern"
              value={formData.title} onChange={set('title')} />
          </div>
          <div>
            <label className="jobs-form-label">Description *</label>
            <textarea required className="jobs-textarea" rows={3}
              placeholder="Describe the role and responsibilities…"
              value={formData.description} onChange={set('description')} />
          </div>
          <div>
            <label className="jobs-form-label">Required Skills</label>
            <input className="jobs-input" placeholder="e.g. React, Node.js, Python"
              value={formData.required_skills} onChange={set('required_skills')} />
          </div>
          <div>
            <label className="jobs-form-label">Stipend / Salary</label>
            <input className="jobs-input" placeholder="e.g. ₹15,000/month or Unpaid"
              value={formData.stipend_salary} onChange={set('stipend_salary')} />
          </div>
          <div>
            <label className="jobs-form-label">Expectations</label>
            <textarea className="jobs-textarea" rows={2}
              placeholder="What do you expect from the candidate?"
              value={formData.expectations} onChange={set('expectations')} />
          </div>
          <div>
            <label className="jobs-form-label">Qualification</label>
            <input className="jobs-input" placeholder="e.g. B.Tech CSE, any branch"
              value={formData.qualification} onChange={set('qualification')} />
          </div>
          <div>
            <label className="jobs-form-label">Application Deadline *</label>
            <input required type="datetime-local" className="jobs-input"
              value={formData.application_deadline} onChange={set('application_deadline')} />
          </div>
          {error && <p className="jobs-error">{error}</p>}
          <div className="jobs-modal-footer">
            <button type="submit" className="jobs-btn-primary" disabled={loading}>
              {loading ? 'Posting…' : 'Post Job →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ══ */
export default function JobsPage() {
  const navigate = useNavigate();
  const { username } = useParams();

  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
  })();

  // We store per-job apply status locally so tabs work without extra API
  const [allJobs,       setAllJobs]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [activeTab,     setActiveTab]     = useState('recent');
  const [applyStatus,   setApplyStatus]   = useState({}); // { [jobId]: 'loading'|'applied'|'completed' }

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await getActiveJobs();
      setAllJobs(data.jobs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadJobs(); }, []);

  const handleApply = async (jobId) => {
    if (!currentUser) return;
    setApplyStatus(p => ({ ...p, [jobId]: 'loading' }));
    try {
      await applyForJob(jobId, { applicant_type: currentUser.type, applicant_id: currentUser.id });
      setApplyStatus(p => ({ ...p, [jobId]: 'applied' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting application');
      setApplyStatus(p => ({ ...p, [jobId]: undefined }));
    }
  };

  // Derive tab lists
  const appliedIds   = Object.entries(applyStatus).filter(([,v]) => v === 'applied' || v === 'completed').map(([k]) => k);
  const completedIds = Object.entries(applyStatus).filter(([,v]) => v === 'completed').map(([k]) => k);

  const tabJobs = {
    recent:    allJobs,
    applied:   allJobs.filter(j => appliedIds.includes(String(j.job_id))),
    completed: allJobs.filter(j => completedIds.includes(String(j.job_id))),
  };

  const displayedJobs = tabJobs[activeTab] || [];

  const TABS = [
    { key: 'recent',    label: '🔍 Recent Jobs' },
    { key: 'applied',   label: '📤 Applied' },
    { key: 'completed', label: '✅ Completed' },
  ];

  const EMPTY = {
    recent:    { icon: '💼', title: 'No jobs posted yet', sub: 'Check back soon — alumni post new opportunities regularly.' },
    applied:   { icon: '📤', title: "You haven't applied yet", sub: 'Browse recent jobs and hit Apply to get started.' },
    completed: { icon: '🎉', title: 'No completed jobs yet', sub: 'Completed opportunities will appear here.' },
  };

  const stagger = i => ({ animationDelay: `${i * 0.05}s` });

  const cardClass = (jobId) => {
    const s = applyStatus[String(jobId)];
    if (s === 'completed') return 'job-card completed';
    if (s === 'applied')   return 'job-card applied';
    return 'job-card';
  };

  return (
    <div className="jobs-page">

      {/* ══ NAVBAR ══ */}
      <nav className="jobs-navbar">
        <div className="jobs-nav-left">
          <button className="jobs-icon-btn" onClick={() => navigate(`/${username}/home`)} title="Home">
            <HomeIcon />
          </button>
        </div>
        <div className="jobs-nav-center">
          <img src={logo} alt="AlmaMatters" className="jobs-nav-logo" />
          <h1 className="jobs-nav-title">Opportunities</h1>
        </div>
        <div className="jobs-nav-right">
          {currentUser?.type === 'alumni' && (
            <button className="jobs-btn-primary" onClick={() => setShowPostModal(true)}>
              <PlusIcon /> Post Job
            </button>
          )}
        </div>
      </nav>

      {/* ══ BODY ══ */}
      <div className="jobs-body">

        <div className="jobs-heading">
          <h1>Job <span>Opportunities</span></h1>
          <div className="jobs-heading-actions">
            {currentUser?.type === 'alumni' && (
              <button className="jobs-btn-secondary" onClick={() => navigate(`/${username}/alumni-jobs`)}>
                My Dashboard →
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="jobs-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`jobs-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="jobs-loading-state">
            <div className="jobs-spinner" />
            <p>Loading opportunities…</p>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="jobs-empty">
            <div className="jobs-empty-icon">{EMPTY[activeTab].icon}</div>
            <h3>{EMPTY[activeTab].title}</h3>
            <p>{EMPTY[activeTab].sub}</p>
            {activeTab !== 'recent' && (
              <button className="jobs-btn-secondary" style={{ marginTop: 6 }} onClick={() => setActiveTab('recent')}>
                Browse Jobs →
              </button>
            )}
          </div>
        ) : (
          <div className="jobs-list">
            {displayedJobs.map((job, i) => {
              const status  = applyStatus[String(job.job_id)];
              const isLoading = status === 'loading';
              const isApplied = status === 'applied' || status === 'completed';
              const isOwner   = currentUser?.type === 'alumni' && String(currentUser?.id) === String(job.alumni_id);
              const deadline  = new Date(job.application_deadline);
              const isPast    = deadline < new Date();

              return (
                <div key={job.job_id} className={cardClass(job.job_id)} style={stagger(i)}>
                  <div className="job-card-header">
                    {job.poster_avatar
                      ? <img src={job.poster_avatar} alt="poster" className="job-avatar" />
                      : <div className="job-avatar-placeholder">{(job.poster_name || 'A')[0].toUpperCase()}</div>}
                    <div className="job-card-meta">
                      <div className="job-title">{job.title}</div>
                      <div className="job-company">{job.company_name || 'Posted by'} · {job.poster_name}</div>
                    </div>
                    {isApplied ? (
                      <span className="job-status-tag tag-applied">Applied</span>
                    ) : isPast ? (
                      <span className="job-status-tag tag-completed">Closed</span>
                    ) : (
                      <span className="job-status-tag tag-open">Open</span>
                    )}
                  </div>

                  <p className="job-desc">{job.description}</p>

                  <div className="job-badges">
                    {job.stipend_salary && (
                      <span className="job-badge salary">💰 {job.stipend_salary}</span>
                    )}
                    {job.required_skills && (
                      <span className="job-badge">🛠 {job.required_skills}</span>
                    )}
                    {job.qualification && (
                      <span className="job-badge">🎓 {job.qualification}</span>
                    )}
                    <span className="job-badge deadline">
                      ⏰ {isPast ? 'Closed' : `Closes ${deadline.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}`}
                    </span>
                  </div>

                  <div className="job-card-footer">
                    <span className="job-posted-by">
                      Posted by <strong style={{ color: 'var(--t2)' }}>{job.poster_name}</strong>
                    </span>
                    {!isOwner && !isPast && (
                      <button
                        className="jobs-btn-primary"
                        onClick={() => handleApply(job.job_id)}
                        disabled={isLoading || isApplied}>
                        {isLoading ? 'Applying…' : isApplied ? '✓ Applied' : 'Apply Now →'}
                      </button>
                    )}
                    {isOwner && (
                      <span style={{ fontSize: '0.76rem', color: 'var(--t3)', fontWeight: 600 }}>Your posting</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPostModal && (
        <CreateJobModal currentUser={currentUser}
          onClose={() => setShowPostModal(false)}
          onCreated={loadJobs} />
      )}
    </div>
  );
}
