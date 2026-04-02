import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentSignup.css";
import { registerFull, checkRollNumberExists } from "./api";

const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:3000';

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

const STEP_LABELS = ["Roll No.", "Personal", "Contact", "Address", "Academic", "Interests", "Login"];

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

export default function StudentSignup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [steps, setSteps] = useState({
        step1: {}, step2: {}, step3: {}, step4: {},
        step6: {}, step7: {}, areas_of_interest: [], currentInterest: ""
    });

    const handleChange = (stepKey) => (e) => {
        setError("");
        setSteps(prev => ({
            ...prev,
            [stepKey]: { ...prev[stepKey], [e.target.name]: e.target.value }
        }));
    };

    const validate = () => {
        const { step1, step2, step3, step4, step6, step7, areas_of_interest } = steps;
        if (step === 1 && !step1.roll_number?.trim()) return "Roll number is required.";
        if (step === 2) {
            if (!step2.first_name?.trim())  return "First name is required.";
            if (!step2.last_name?.trim())   return "Last name is required.";
            if (!step2.full_name?.trim())   return "Full name is required.";
            if (!step2.date_of_birth)       return "Date of birth is required.";
            if (!step2.gender)              return "Gender is required.";
            if (!step2.blood_group?.trim()) return "Blood group is required.";
            if (!step2.nationality?.trim()) return "Nationality is required.";
            if (!step2.religion?.trim())    return "Religion is required.";
            if (!step2.profile_photo_url?.trim()) return "Profile photo is required.";
        }
        if (step === 3) {
            if (!step3.email?.trim())        return "Email address is required.";
            if (!step3.phone_number?.trim()) return "Phone number is required.";
            if (!step3.alternate_phone_number?.trim()) return "Alternate phone number is required.";
        }
        if (step === 4) {
            if (!step4.address_line1?.trim() || !step4.address_line2?.trim() || !step4.city?.trim() || !step4.state?.trim() || !step4.pincode?.trim() || !step4.country?.trim())
                return "All address fields are required.";
        }
        if (step === 5) {
            if (!step6.batch_year?.trim() || !step6.admission_date || !step6.expected_graduation_date ||
                !step6.current_year?.trim() || !step6.current_semester?.trim() || !step6.section?.trim() || !step6.academic_status)
                return "All academic details are required.";
        }
        if (step === 6) {
            if (!areas_of_interest || areas_of_interest.length === 0) return "Add at least one area of interest.";
        }
        if (step === 7) {
            if (!step7.username?.trim())  return "Username is required.";
            if (!step7.password?.trim())  return "Password is required.";
            if (step7.password.length < 8) return "Password must be at least 8 characters.";
        }
        return null;
    };

    const goNext = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError("");

        if (step === 1) {
            setLoading(true);
            try {
                const exists = await checkRollNumberExists(steps.step1.roll_number);
                if (exists) {
                    setError("This roll number is already registered. Please use a different one.");
                    setLoading(false);
                    return;
                }
            } catch (e) {
                setError("Could not verify roll number. Please try again.");
                setLoading(false);
                return;
            } finally {
                setLoading(false);
            }
        }
        setStep(s => s + 1);
    };

    const handleFinish = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setLoading(true);
        setError("");
        try {
            await registerFull(steps);
            setStep(8);
            setTimeout(() => navigate("/login"), 2500);
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Registration failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const s1 = steps.step1; const s2 = steps.step2; const s3 = steps.step3;
    const s4 = steps.step4; const s6 = steps.step6;
    const s7 = steps.step7;
    const ch = handleChange;

    const handleAddInterest = () => {
        if (steps.currentInterest && steps.currentInterest.trim() !== "") {
            setSteps(prev => ({
                ...prev,
                areas_of_interest: [...prev.areas_of_interest, prev.currentInterest.trim()],
                currentInterest: ""
            }));
        }
    };

    const handleRemoveInterest = (idx) => {
        setSteps(prev => ({
            ...prev,
            areas_of_interest: prev.areas_of_interest.filter((_, i) => i !== idx)
        }));
    };

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h2 className="signup-title">Student Sign Up</h2>
                <StepBar current={step} />

                {error && <div className="error-banner" role="alert">⚠️ {error}</div>}

                <div className="step-body">
                    {step === 1 && (
                        <section>
                            <h3>Basic Information</h3>
                            <Field label="Roll Number" name="roll_number" required
                                placeholder="e.g. 21CS001" value={s1.roll_number} onChange={ch("step1")} />
                        </section>
                    )}
                    {step === 2 && (
                        <section>
                            <h3>Personal Details</h3>
                            <Field label="First Name" name="first_name" required value={s2.first_name} onChange={ch("step2")} />
                            <Field label="Last Name" name="last_name" required value={s2.last_name} onChange={ch("step2")} />
                            <Field label="Full Name" name="full_name" required value={s2.full_name} onChange={ch("step2")} />
                            <Field label="Date of Birth" name="date_of_birth" type="date" required value={s2.date_of_birth} onChange={ch("step2")} />
                            <SelectField label="Gender" name="gender" required
                                options={["Male", "Female", "Other", "Prefer not to say"]}
                                value={s2.gender} onChange={ch("step2")} />
                            <Field label="Blood Group" name="blood_group" placeholder="e.g. O+" required value={s2.blood_group} onChange={ch("step2")} />
                            <Field label="Nationality" name="nationality" placeholder="e.g. Indian" required value={s2.nationality} onChange={ch("step2")} />
                            <Field label="Religion" name="religion" required value={s2.religion} onChange={ch("step2")} />
                            <Field label="Aadhaar Number" name="aadhaar_number" placeholder="12-digit Aadhaar (Optional)" value={s2.aadhaar_number} onChange={ch("step2")} />
                            <Field label="Passport Number" name="passport_number" placeholder="Optional" value={s2.passport_number} onChange={ch("step2")} />
                            <div className="field-group">
                                <label className="field-label">Profile Photo<span className="required-star"> *</span></label>
                                <input type="file" accept="image/*" onChange={async (e) => {
                                    if(e.target.files && e.target.files[0]) {
                                        const fd = new FormData();
                                        fd.append("profile_photo", e.target.files[0]);
                                        try {
                                            const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: fd });
                                            const data = await res.json();
                                            if(data.url) {
                                                setSteps(prev => ({...prev, step2: {...prev.step2, profile_photo_url: data.url}}));
                                            }
                                        } catch(err) {
                                            setError("Photo upload failed");
                                        }
                                    }
                                }} className="field-input" />
                                {s2.profile_photo_url && <span style={{color: 'green', fontSize: '13px', marginTop: '4px', display: 'block'}}>Photo uploaded successfully!</span>}
                            </div>
                        </section>
                    )}
                    {step === 3 && (
                        <section>
                            <h3>Contact Details</h3>
                            <Field label="Email Address" name="email" type="email" required
                                placeholder="you@example.com" value={s3.email} onChange={ch("step3")} />
                            <Field label="Phone Number" name="phone_number" type="tel" required
                                placeholder="+91 XXXXX XXXXX" value={s3.phone_number} onChange={ch("step3")} />
                            <Field label="Alternate Phone" name="alternate_phone_number" type="tel" required
                                placeholder="Required" value={s3.alternate_phone_number} onChange={ch("step3")} />
                        </section>
                    )}
                    {step === 4 && (
                        <section>
                            <h3>Address</h3>
                            <Field label="Address Line 1" name="address_line1" required placeholder="Street / Door No." value={s4.address_line1} onChange={ch("step4")} />
                            <Field label="Address Line 2" name="address_line2" required placeholder="Area" value={s4.address_line2} onChange={ch("step4")} />
                            <Field label="City" name="city" required value={s4.city} onChange={ch("step4")} />
                            <Field label="State" name="state" required value={s4.state} onChange={ch("step4")} />
                            <Field label="Pincode" name="pincode" required placeholder="6-digit" value={s4.pincode} onChange={ch("step4")} />
                            <Field label="Country" name="country" required placeholder="e.g. India" value={s4.country} onChange={ch("step4")} />
                        </section>
                    )}
                    {step === 5 && (
                        <section>
                            <h3>Academic Details</h3>
                            <Field label="Batch Year" name="batch_year" required placeholder="e.g. 2021" value={s6.batch_year} onChange={ch("step6")} />
                            <Field label="Admission Date" name="admission_date" type="date" required value={s6.admission_date} onChange={ch("step6")} />
                            <Field label="Expected Graduation Date" name="expected_graduation_date" required type="date" value={s6.expected_graduation_date} onChange={ch("step6")} />
                            <Field label="Current Year" name="current_year" required placeholder="e.g. 3" value={s6.current_year} onChange={ch("step6")} />
                            <Field label="Current Semester" name="current_semester" required placeholder="e.g. 5" value={s6.current_semester} onChange={ch("step6")} />
                            <Field label="Section" name="section" required placeholder="e.g. A" value={s6.section} onChange={ch("step6")} />
                            <SelectField label="Academic Status" name="academic_status" required
                                options={["Active", "Detained", "Passed Out", "Lateral Entry"]}
                                value={s6.academic_status} onChange={ch("step6")} />
                        </section>
                    )}
                    {step === 6 && (
                        <section>
                            <h3>Areas of Interest</h3>
                            <div className="field-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="field-label">Add Interest<span className="required-star"> *</span></label>
                                    <input type="text" value={steps.currentInterest} onChange={(e) => setSteps(p => ({...p, currentInterest: e.target.value}))} placeholder="e.g. Machine Learning" className="field-input" />
                                </div>
                                <button type="button" onClick={handleAddInterest} style={{ padding: '10px 15px', height: '42px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {steps.areas_of_interest.map((area, idx) => (
                                    <span key={idx} style={{ background: '#eef2ff', color: '#4f46e5', padding: '5px 12px', borderRadius: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {area}
                                        <button type="button" onClick={() => handleRemoveInterest(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>&times;</button>
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                    {step === 7 && (
                        <section>
                            <h3>Create Login</h3>
                            <p className="step-hint">Your account will be created only after you click <strong>Finish</strong>.</p>
                            <Field label="Username" name="username" required placeholder="Choose a username" value={s7.username} onChange={ch("step7")} />
                            <Field label="Password" name="password" type="password" required placeholder="Min. 8 characters" value={s7.password} onChange={ch("step7")} />
                        </section>
                    )}
                    {step === 8 && (
                        <section className="success-section">
                            <div className="success-icon">🎉</div>
                            <h3>Registration Complete!</h3>
                            <p>Your account has been created. Redirecting to login…</p>
                        </section>
                    )}
                </div>

                {step <= 7 && (
                    <div className="nav-buttons">
                        {step > 1 && (
                            <button className="btn-back" onClick={() => { setError(""); setStep(s => s - 1); }} disabled={loading}>
                                ← Back
                            </button>
                        )}
                        {step < 7 ? (
                            <button className="btn-next" onClick={goNext} disabled={loading}>
                                {loading ? "Checking…" : "Next →"}
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