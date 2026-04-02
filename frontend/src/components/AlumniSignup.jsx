import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentSignup.css";
import { registerAlumniStep } from "./api";

function Field({ label, name, type = "text", placeholder, value, onChange, required }) {
  return (
    <div className="field-group">
      <label htmlFor={name} className="field-label">
        {label}{required && <span className="required-star"> *</span>}
      </label>
      <input
        id={name} name={name} type={type}
        placeholder={placeholder || label}
        value={value || ""} onChange={onChange}
        className="field-input"
      />
    </div>
  );
}


const STEP_LABELS = ["Roll Number", "Professional", "Work", "Higher Studies", "Academic", "Address", "Login"];

function StepBar({ current }) {
  return (
    <div className="step-bar">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className={`step-dot-wrap${i + 1 < current ? " done" : ""}${i + 1 === current ? " active" : ""}`}>
          <div className="step-dot">{i + 1 < current ? "✓" : i + 1}</div>
          <span className="step-dot-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AlumniSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [alumniId, setAlumniId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [steps, setSteps] = useState({
    step1: {}, // roll_number, graduation_year
    step2: {}, // linkedin_url, current_city
    step3: {}, // company_name, job_title, industry, years_of_experience
    step4: {}, // university_name, degree, field_of_study, country, start_year, end_year
    step5: {}, // department, program, course, batch_year, graduation_year, cgpa, class_obtained
    step6: {}, // address_line1, address_line2, city, state, pincode, country
    step7: {}  // username, password
  });

  const handleChange = (stepKey) => (e) => {
    setError("");
    setSteps(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], [e.target.name]: e.target.value }
    }));
  };

  const validate = () => {
    const { step1, step2, step3, step4, step5, step6, step7 } = steps;
    if (step === 1) {
      if (!step1.roll_number?.trim()) return "Roll number is required.";
      if (!step1.graduation_year) return "Graduation year is required.";
    }
    if (step === 2) {
      if (!step2.linkedin_url?.trim() || !step2.current_city?.trim()) return "All professional presence fields are required.";
    }
    if (step === 3) {
      if (!step3.company_name?.trim() || !step3.job_title?.trim() || !step3.industry?.trim() || !step3.years_of_experience) {
        return "All employment fields are required.";
      }
    }
    if (step === 4) {
      if (!step4.university_name?.trim() || !step4.degree?.trim() || !step4.field_of_study?.trim() || !step4.country?.trim() || !step4.start_year || !step4.end_year) {
         return "All higher education fields are required.";
      }
    }
    if (step === 5) {
      if (!step5.department?.trim() || !step5.program?.trim() || !step5.course?.trim() || !step5.batch_year || !step5.graduation_year || !step5.cgpa || !step5.class_obtained?.trim()) {
         return "All academic background fields are required.";
      }
    }
    if (step === 6) {
      if (!step6.address_line1?.trim() || !step6.address_line2?.trim() || !step6.city?.trim() || !step6.state?.trim() || !step6.pincode?.trim() || !step6.country?.trim()) {
         return "All address fields are required.";
      }
    }
    if (step === 7) {
      if (!step7.username?.trim()) return "Username is required.";
      if (!step7.password?.trim()) return "Password is required.";
      if (step7.password.length < 8) return "Password must be at least 8 characters.";
    }
    return null;
  };

  const goNext = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const currentStepKey = `step${step}`;
      const res = await registerAlumniStep(step, steps[currentStepKey], alumniId);
      if (step === 1) {
        setAlumniId(res.alumni_id);
      }
      setStep(s => s + 1);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save step data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await registerAlumniStep(7, steps.step7, alumniId);
      setStep(8);
      setTimeout(() => navigate("/login"), 2500);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const s1 = steps.step1; const s2 = steps.step2; const s3 = steps.step3;
  const s4 = steps.step4; const s5 = steps.step5; const s6 = steps.step6; const s7 = steps.step7;
  const ch = handleChange;

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2 className="signup-title">Alumni Sign Up</h2>
        <StepBar current={step} />

        {error && <div className="error-banner" role="alert">⚠️ {error}</div>}

        <div className="step-body">
          {/* STEP 1: Roll Number & Graduation Year */}
          {step === 1 && (
            <section>
              <h3>Student Information</h3>
              <Field
                label="Roll Number"
                name="roll_number"
                type="text"
                required
                placeholder="e.g. 24pw18"
                value={s1.roll_number}
                onChange={ch("step1")}
              />
              <Field
                label="Graduation Year"
                name="graduation_year"
                type="number"
                required
                placeholder="YYYY"
                value={s1.graduation_year}
                onChange={ch("step1")}
              />
            </section>
          )}

          {/* STEP 2: Professional Links */}
          {step === 2 && (
            <section>
              <h3>Professional Presence</h3>
              <Field
                label="LinkedIn URL"
                name="linkedin_url"
                required
                placeholder="https://linkedin.com/in/..."
                value={s2.linkedin_url}
                onChange={ch("step2")}
              />
              <Field
                label="Current City"
                name="current_city"
                required
                placeholder="e.g. Bengaluru"
                value={s2.current_city}
                onChange={ch("step2")}
              />
            </section>
          )}

          {/* STEP 3: Work Experience */}
          {step === 3 && (
            <section>
              <h3>Current Employment</h3>
              <Field label="Company Name" name="company_name" required value={s3.company_name} onChange={ch("step3")} />
              <Field label="Job Title" name="job_title" required value={s3.job_title} onChange={ch("step3")} />
              <Field label="Industry" name="industry" required value={s3.industry} onChange={ch("step3")} />
              <Field label="Years of Experience" name="years_of_experience" type="number" step="0.1" required
                value={s3.years_of_experience} onChange={ch("step3")} />
            </section>
          )}

          {/* STEP 4: Higher Studies */}
          {step === 4 && (
            <section>
              <h3>Higher Education (if any)</h3>
              <Field label="University Name" name="university_name" required value={s4.university_name} onChange={ch("step4")} />
              <Field label="Degree" name="degree" required value={s4.degree} onChange={ch("step4")} />
              <Field label="Field of Study" name="field_of_study" required value={s4.field_of_study} onChange={ch("step4")} />
              <Field label="Country" name="country" required value={s4.country} onChange={ch("step4")} />
              <Field label="Start Year" name="start_year" placeholder="YYYY" required value={s4.start_year} onChange={ch("step4")} />
              <Field label="End Year" name="end_year" placeholder="YYYY" required value={s4.end_year} onChange={ch("step4")} />
            </section>
          )}

          {/* STEP 5: Academic Details */}
          {step === 5 && (
            <section>
              <h3>Academic Background</h3>
              <Field label="Department" name="department" required value={s5.department} onChange={ch("step5")} />
              <Field label="Program" name="program" required value={s5.program} onChange={ch("step5")} />
              <Field label="Course" name="course" required value={s5.course} onChange={ch("step5")} />
              <Field label="Batch Year" name="batch_year" placeholder="YYYY" required value={s5.batch_year} onChange={ch("step5")} />
              <Field label="Graduation Year" name="graduation_year" placeholder="YYYY" required value={s5.graduation_year} onChange={ch("step5")} />
              <Field label="CGPA" name="cgpa" type="number" step="0.01" required value={s5.cgpa} onChange={ch("step5")} />
              <Field label="Class Obtained" name="class_obtained" placeholder="e.g. First Class" required value={s5.class_obtained} onChange={ch("step5")} />
            </section>
          )}

          {/* STEP 6: Address */}
          {step === 6 && (
            <section>
              <h3>Current Address</h3>
              <Field label="Address Line 1" name="address_line1" required value={s6.address_line1} onChange={ch("step6")} />
              <Field label="Address Line 2" name="address_line2" required value={s6.address_line2} onChange={ch("step6")} />
              <Field label="City" name="city" required value={s6.city} onChange={ch("step6")} />
              <Field label="State" name="state" required value={s6.state} onChange={ch("step6")} />
              <Field label="Pincode" name="pincode" required value={s6.pincode} onChange={ch("step6")} />
              <Field label="Country" name="country" required value={s6.country} onChange={ch("step6")} />
            </section>
          )}

          {/* STEP 7: Login */}
          {step === 7 && (
            <section>
              <h3>Create Login</h3>
              <p className="step-hint">Your account will be created when you click <strong>Finish</strong>.</p>
              <Field label="Username" name="username" required placeholder="Choose a username" value={s7.username} onChange={ch("step7")} />
              <Field label="Password" name="password" type="password" required placeholder="Min. 8 characters" value={s7.password} onChange={ch("step7")} />
            </section>
          )}

          {/* STEP 8: Success */}
          {step === 8 && (
            <section className="success-section">
              <div className="success-icon">🎉</div>
              <h3>Registration Complete!</h3>
              <p>Your alumni account has been created. Redirecting to login…</p>
            </section>
          )}
        </div>

        {/* Navigation */}
        {step <= 7 && (
          <div className="nav-buttons">
            {step > 1 && (
              <button className="btn-back" onClick={() => { setError(""); setStep(s => s - 1); }} disabled={loading}>
                ← Back
              </button>
            )}
            {step < 7 ? (
              <button className="btn-next" onClick={goNext} disabled={loading}>
                {loading ? "Saving…" : "Next →"}
              </button>
            ) : (
              <button className="btn-next" onClick={handleFinish} disabled={loading}>
                {loading ? "Registering…" : "Finish ✓"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}