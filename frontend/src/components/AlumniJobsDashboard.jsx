import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAlumniJobs, getJobApplications, updateApplicationStatus } from './api';
import './JobsPage.css';

function ApplicantsModal({ job, onClose }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplicants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const loadApplicants = async () => {
    try {
      const data = await getJobApplications(job.job_id);
      setApplicants(data.applications || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await updateApplicationStatus(applicationId, status);
      // Optimistically update UI
      setApplicants(prev => prev.map(a => a.application_id === applicationId ? { ...a, status } : a));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="jobs-modal-overlay" onClick={onClose}>
      <div className="jobs-modal-box" style={{maxWidth:'600px'}} onClick={e => e.stopPropagation()}>
        <div className="jobs-modal-header">
          <h2>Applicants for "{job.title}"</h2>
          <button className="jobs-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="jobs-form">
          {loading ? (
            <p className="jobs-loading">Loading applicants...</p>
          ) : applicants.length === 0 ? (
            <p className="jobs-empty">No applications yet.</p>
          ) : (
            applicants.map(app => (
              <div key={app.application_id} className="applicant-card">
                <div className="applicant-info">
                  {app.applicant_avatar ? (
                    <img src={app.applicant_avatar} className="applicant-avatar" alt="avatar"/>
                  ) : (
                    <div className="applicant-avatar" style={{background:'#ccc', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {app.applicant_name?.[0] || '?'}
                    </div>
                  )}
                  <div className="applicant-details">
                    <h4>{app.applicant_name}</h4>
                    <p>{app.applicant_headline}</p>
                    <p style={{fontSize:'0.8rem', color:'#888'}}>Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="applicant-status-actions">
                  {app.status === 'pending' ? (
                    <div className="applicant-actions">
                      <button className="jobs-btn-success" onClick={() => handleUpdateStatus(app.application_id, 'accepted')}>Accept</button>
                      <button className="jobs-btn-danger" onClick={() => handleUpdateStatus(app.application_id, 'rejected')}>Reject</button>
                    </div>
                  ) : (
                    <span className={`job-badge ${app.status === 'accepted' ? 'success' : 'danger'}`} style={{background: app.status==='accepted'?'#d4edda':'#f8d7da', color: app.status==='accepted'?'#155724':'#721c24'}}>
                      {app.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlumniJobsDashboard() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
  })();

  useEffect(() => {
    if (!currentUser || currentUser.type !== 'alumni') {
      navigate(`/${username}/jobs`); // redirect if not alumni
      return;
    }
    
    getAlumniJobs(currentUser.id)
      .then(data => setJobs(data.jobs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
      
  }, [currentUser, navigate, username]);

  return (
    <div className="jobs-page">
      <div className="jobs-header-actions">
        <h1>My Posted Jobs</h1>
        <button className="jobs-btn-secondary" onClick={() => navigate(`/${username}/jobs`)}>
          Back to Jobs Board
        </button>
      </div>

      {loading ? (
        <p className="jobs-loading">Loading your jobs...</p>
      ) : jobs.length === 0 ? (
        <div className="jobs-empty">
          <p>You haven't posted any jobs yet.</p>
          <button className="jobs-btn-primary" onClick={() => navigate(`/${username}/jobs`)}>Go Post a Job</button>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map(job => (
            <div key={job.job_id} className="job-card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-desc" style={{marginBottom:'8px'}}>{job.description.substring(0, 100)}...</p>
                  <p className="job-company" style={{fontSize:'0.85rem'}}>Posted on {new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <span className="job-badge" style={{display:'block', marginBottom:'8px', background: new Date(job.application_deadline) > new Date() ? '#d4edda' : '#e2e3e5', color: '#333'}}>
                    {new Date(job.application_deadline) > new Date() ? 'Active' : 'Expired'}
                  </span>
                  <span className="job-badge">👥 {job.applicant_count} Applicants</span>
                </div>
              </div>

              <div className="job-actions">
                <button 
                  className="jobs-btn-primary" 
                  onClick={() => setSelectedJob(job)}
                >
                  View Applicants
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <ApplicantsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}
