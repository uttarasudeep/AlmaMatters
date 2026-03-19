import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentSignup.css"; // Reuse the same card/step styling
import { registerAdminStep } from "./api";

/* ── Reusable field components ─────────────────────────────── */
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

function SelectField({ label, name, options, value, onChange, required }) {
  return (
    <div className="field-group">
      <label htmlFor={name} className="field-label">
        {label}{required && <span className="required-star"> *</span>}
      </label>
      <select id={name} name={name} value={value || ""} onChange={onChange} className="field-input">
        <option value="">— Select {label} —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── Step progress bar ──────────────────────────────────────── */
const STEP_LABELS = ["Employee ID", "Personal", "Contact", "Address", "Login"];

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

/* ── Main component ─────────────────────────────────────────── */
export default function AdminSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [adminId, setAdminId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Store data for each step separately
  const [steps, setSteps] = useState({
    step1: {}, // employee_id
    step2: {}, // first_name, last_name, full_name, date_of_birth, gender, profile_photo_url
    step3: {}, // email, phone_number, alternate_phone_number
    step4: {}, // address_line1, address_line2, city, state, pincode, country
    step5: {}  // username, password
  });

  const handleChange = (stepKey) => (e) => {
    setError("");
    setSteps(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], [e.target.name]: e.target.value }
    }));
  };

  // Validation per step
  const validate = () => {
    const { step1, step2, step3, step5 } = steps;
    if (step === 1 && !step1.employee_id?.trim()) {
      return "Employee ID is required.";
    }
    if (step === 2 && !step2.first_name?.trim()) {
      return "First name is required.";
    }
    if (step === 3 && !step3.email?.trim()) {
      return "Email address is required.";
    }
    if (step === 5) {
      if (!step5.username?.trim()) return "Username is required.";
      if (!step5.password?.trim()) return "Password is required.";
      if (step5.password.length < 8) return "Password must be at least 8 characters.";
    }
    return null;
  };

  // Go to next step (save current step data)
  const goNext = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const currentStepKey = `step${step}`;
      const res = await registerAdminStep(step, steps[currentStepKey], adminId);
      if (step === 1) {
        setAdminId(res.admin_id); // backend returns admin_id after first step
      }
      setStep(s => s + 1);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error saving step data. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Final step: submit last step and show success
  const handleFinish = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await registerAdminStep(5, steps.step5, adminId);
      setStep(6); // success screen
      setTimeout(() => navigate('/admin-login'), 2500);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const s1 = steps.step1;
  const s2 = steps.step2;
  const s3 = steps.step3;
  const s4 = steps.step4;
  const s5 = steps.step5;
  const ch = handleChange;

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2 className="signup-title">Admin Sign Up</h2>
        <StepBar current={step} />

        {error && <div className="error-banner" role="alert">⚠️ {error}</div>}

        <div className="step-body">
          {/* STEP 1: Employee ID */}
          {step === 1 && (
            <section>
              <h3>Employment Information</h3>
              <Field
                label="Employee ID"
                name="employee_id"
                required
                placeholder="e.g. EMP-001"
                value={s1.employee_id}
                onChange={ch("step1")}
              />
            </section>
          )}

          {/* STEP 2: Personal Details */}
          {step === 2 && (
            <section>
              <h3>Personal Details</h3>
              <Field
                label="First Name"
                name="first_name"
                required
                value={s2.first_name}
                onChange={ch("step2")}
              />
              <Field
                label="Last Name"
                name="last_name"
                value={s2.last_name}
                onChange={ch("step2")}
              />
              <Field
                label="Full Name"
                name="full_name"
                value={s2.full_name}
                onChange={ch("step2")}
              />
              <Field
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={s2.date_of_birth}
                onChange={ch("step2")}
              />
              <SelectField
                label="Gender"
                name="gender"
                options={["Male", "Female", "Other", "Prefer not to say"]}
                value={s2.gender}
                onChange={ch("step2")}
              />
              <Field
                label="Profile Photo URL"
                name="profile_photo_url"
                placeholder="https://..."
                value={s2.profile_photo_url}
                onChange={ch("step2")}
              />
            </section>
          )}

          {/* STEP 3: Contact Details */}
          {step === 3 && (
            <section>
              <h3>Contact Details</h3>
              <Field
                label="Email Address"
                name="email"
                type="email"
                required
                placeholder="admin@example.com"
                value={s3.email}
                onChange={ch("step3")}
              />
              <Field
                label="Phone Number"
                name="phone_number"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={s3.phone_number}
                onChange={ch("step3")}
              />
              <Field
                label="Alternate Phone"
                name="alternate_phone_number"
                type="tel"
                placeholder="Optional"
                value={s3.alternate_phone_number}
                onChange={ch("step3")}
              />
            </section>
          )}

          {/* STEP 4: Address */}
          {step === 4 && (
            <section>
              <h3>Address</h3>
              <Field
                label="Address Line 1"
                name="address_line1"
                placeholder="Street / Door No."
                value={s4.address_line1}
                onChange={ch("step4")}
              />
              <Field
                label="Address Line 2"
                name="address_line2"
                placeholder="Area (optional)"
                value={s4.address_line2}
                onChange={ch("step4")}
              />
              <Field
                label="City"
                name="city"
                value={s4.city}
                onChange={ch("step4")}
              />
              <Field
                label="State"
                name="state"
                value={s4.state}
                onChange={ch("step4")}
              />
              <Field
                label="Pincode"
                name="pincode"
                placeholder="6-digit"
                value={s4.pincode}
                onChange={ch("step4")}
              />
              <Field
                label="Country"
                name="country"
                placeholder="e.g. India"
                value={s4.country}
                onChange={ch("step4")}
              />
            </section>
          )}

          {/* STEP 5: Login Credentials */}
          {step === 5 && (
            <section>
              <h3>Create Login</h3>
              <p className="step-hint">Your account will be created when you click <strong>Finish</strong>.</p>
              <Field
                label="Username"
                name="username"
                required
                placeholder="Choose an admin username"
                value={s5.username}
                onChange={ch("step5")}
              />
              <Field
                label="Password"
                name="password"
                type="password"
                required
                placeholder="Min. 8 characters"
                value={s5.password}
                onChange={ch("step5")}
              />
            </section>
          )}

          {/* STEP 6: Success */}
          {step === 6 && (
            <section className="success-section">
              <div className="success-icon">🎉</div>
              <h3>Registration Complete!</h3>
              <p>Your admin account has been created. Redirecting to login…</p>
            </section>
          )}
        </div>

        {/* Navigation Buttons */}
        {step <= 5 && (
          <div className="nav-buttons">
            {step > 1 && (
              <button
                className="btn-back"
                onClick={() => { setError(""); setStep(s => s - 1); }}
                disabled={loading}
              >
                ← Back
              </button>
            )}
            {step < 5 ? (
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