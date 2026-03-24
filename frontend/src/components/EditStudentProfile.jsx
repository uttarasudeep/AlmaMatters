import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StudentSignup.css"; // Reuse signup styles

function Field({ label, name, type = "text", placeholder, value, onChange, required, disabled }) {
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
                disabled={disabled}
            />
        </div>
    );
}

function SelectField({ label, name, options, value, onChange, required, disabled }) {
    return (
        <div className="field-group">
            <label htmlFor={name} className="field-label">
                {label}{required && <span className="required-star"> *</span>}
            </label>
            <select id={name} name={name} value={value || ""} onChange={onChange} className="field-input" disabled={disabled}>
                <option value="">— Select {label} —</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

const STEP_LABELS = ["Personal", "Contact", "Address", "Academic", "Interests"];

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

export default function EditStudentProfile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(true);

    const [steps, setSteps] = useState({
        step1: {}, step2: {}, step3: {}, step4: {},
        step6: {}, areas_of_interest: [], currentInterest: ""
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Get student info embedded in localStorage from login (or just fetch ID by username)
                const storedUser = JSON.parse(sessionStorage.getItem('currentUser'));
                if (!storedUser || storedUser.type !== 'student') {
                    setError("Unauthorized access.");
                    setLoading(false);
                    return;
                }
                const res = await fetch(`http://localhost:3000/api/students/profile/${storedUser.id}`);
                if (!res.ok) throw new Error("Failed to load profile.");
                const data = await res.json();
                setSteps(prev => ({
                    ...prev,
                    step1: data.step1 || {},
                    step2: data.step2 || {},
                    step3: data.step3 || {},
                    step4: data.step4 || {},
                    step6: data.step6 || {},
                    areas_of_interest: data.areas_of_interest || []
                }));
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (stepKey) => (e) => {
        setError("");
        setSuccessMsg("");
        setSteps(prev => ({
            ...prev,
            [stepKey]: { ...prev[stepKey], [e.target.name]: e.target.value }
        }));
    };

    const validate = () => {
        const { step2, step3, step6, areas_of_interest } = steps;
        if (step === 1) { // Personal
            if (!step2.first_name?.trim())  return "First name is required.";
            if (!step2.full_name?.trim())   return "Full name is required.";
            if (!step2.date_of_birth)       return "Date of birth is required.";
            if (!step2.gender)              return "Gender is required.";
        }
        if (step === 2) { // Contact
            if (!step3.email?.trim())        return "Email address is required.";
            if (!step3.phone_number?.trim()) return "Phone number is required.";
        }
        if (step === 3) { // Address
            // Optional
        }
        if (step === 4) { // Academic
            if (!step6.batch_year || !step6.admission_date || !step6.expected_graduation_date || !step6.academic_status)
                return "Academic status and dates are required.";
        }
        if (step === 5) { // Interests
            if (!areas_of_interest || areas_of_interest.length === 0) return "Add at least one area of interest.";
        }
        return null;
    };

    const goNext = () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError("");
        setStep(s => s + 1);
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setLoading(true);
        setError("");
        setSuccessMsg("");
        try {
            const storedUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const res = await fetch(`http://localhost:3000/api/students/profile/${storedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(steps)
            });
            if (!res.ok) throw new Error("Failed to update profile.");
            setSuccessMsg("Profile saved successfully!");
            setTimeout(() => navigate(`/${username}/home`), 2000);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

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

    if (loading && !steps.step2.first_name) return <div style={{padding:'2rem', textAlign:'center'}}>Loading Profile...</div>;

    const s1 = steps.step1; const s2 = steps.step2; const s3 = steps.step3;
    const s4 = steps.step4; const s6 = steps.step6;
    const ch = handleChange;

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h2 className="signup-title">Edit Profile</h2>
                <StepBar current={step} />

                {error && <div className="error-banner" role="alert">⚠️ {error}</div>}
                {successMsg && <div className="success-section" style={{padding:'10px', marginTop:'10px'}}>✅ {successMsg}</div>}

                <div className="step-body">
                    {step === 1 && (
                        <section>
                            <h3>Personal Details</h3>
                            <Field label="Roll Number" name="roll_number" value={s1.roll_number} disabled />
                            <Field label="First Name" name="first_name" required value={s2.first_name} onChange={ch("step2")} />
                            <Field label="Last Name" name="last_name" value={s2.last_name} onChange={ch("step2")} />
                            <Field label="Full Name" name="full_name" required value={s2.full_name} onChange={ch("step2")} />
                            <Field label="Date of Birth" name="date_of_birth" type="date" required value={s2.date_of_birth} onChange={ch("step2")} />
                            <SelectField label="Gender" name="gender" required
                                options={["Male", "Female", "Other", "Prefer not to say"]}
                                value={s2.gender} onChange={ch("step2")} />
                            <Field label="Blood Group" name="blood_group" value={s2.blood_group} onChange={ch("step2")} />
                            <Field label="Nationality" name="nationality" value={s2.nationality} onChange={ch("step2")} />
                            <Field label="Religion" name="religion" value={s2.religion} onChange={ch("step2")} />
                            
                            <div className="field-group">
                                <label className="field-label">Profile Photo Update</label>
                                <input type="file" accept="image/*" onChange={async (e) => {
                                    if(e.target.files && e.target.files[0]) {
                                        const fd = new FormData();
                                        fd.append("profile_photo", e.target.files[0]);
                                        try {
                                            const res = await fetch("http://localhost:3000/api/upload", { method: "POST", body: fd });
                                            const data = await res.json();
                                            if(data.url) {
                                                setSteps(prev => ({...prev, step2: {...prev.step2, profile_photo_url: data.url}}));
                                            }
                                        } catch(err) {
                                            setError("Photo upload failed");
                                        }
                                    }
                                }} className="field-input" />
                                {s2.profile_photo_url && (
                                    <div style={{marginTop:'10px'}}>
                                        <img src={`http://localhost:3000${s2.profile_photo_url}`} alt="Preview" style={{width:'80px', height:'80px', objectFit:'cover', borderRadius:'50%'}} />
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                    {step === 2 && (
                        <section>
                            <h3>Contact Details</h3>
                            <Field label="Email Address" name="email" type="email" required value={s3.email} onChange={ch("step3")} />
                            <Field label="Phone Number" name="phone_number" type="tel" required value={s3.phone_number} onChange={ch("step3")} />
                            <Field label="Alternate Phone" name="alternate_phone_number" type="tel" value={s3.alternate_phone_number} onChange={ch("step3")} />
                        </section>
                    )}
                    {step === 3 && (
                        <section>
                            <h3>Address</h3>
                            <Field label="Address Line 1" name="address_line1" value={s4.address_line1} onChange={ch("step4")} />
                            <Field label="Address Line 2" name="address_line2" value={s4.address_line2} onChange={ch("step4")} />
                            <Field label="City" name="city" value={s4.city} onChange={ch("step4")} />
                            <Field label="State" name="state" value={s4.state} onChange={ch("step4")} />
                            <Field label="Pincode" name="pincode" value={s4.pincode} onChange={ch("step4")} />
                            <Field label="Country" name="country" value={s4.country} onChange={ch("step4")} />
                        </section>
                    )}
                    {step === 4 && (
                        <section>
                            <h3>Academic Details</h3>
                            <Field label="Batch Year" name="batch_year" value={s6.batch_year} onChange={ch("step6")} />
                            <Field label="Admission Date" name="admission_date" type="date" value={s6.admission_date} onChange={ch("step6")} />
                            <Field label="Expected Graduation Date" name="expected_graduation_date" type="date" value={s6.expected_graduation_date} onChange={ch("step6")} />
                            <Field label="Current Year" name="current_year" value={s6.current_year} onChange={ch("step6")} />
                            <Field label="Current Semester" name="current_semester" value={s6.current_semester} onChange={ch("step6")} />
                            <Field label="Section" name="section" value={s6.section} onChange={ch("step6")} />
                            <SelectField label="Academic Status" name="academic_status"
                                options={["Active", "Detained", "Passed Out", "Lateral Entry"]}
                                value={s6.academic_status} onChange={ch("step6")} />
                        </section>
                    )}
                    {step === 5 && (
                        <section>
                            <h3>Areas of Interest</h3>
                            <div className="field-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="field-label">Add Interest</label>
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
                </div>

                <div className="nav-buttons">
                    {step > 1 && (
                        <button className="btn-back" onClick={() => { setError(""); setStep(s => s - 1); }} disabled={loading}>
                            ← Back
                        </button>
                    )}
                    {step < 5 ? (
                        <button className="btn-next" onClick={goNext} disabled={loading}>
                            Next →
                        </button>
                    ) : (
                        <button className="btn-next" onClick={handleSave} disabled={loading}>
                            {loading ? "Saving…" : "Save Changes ✓"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
