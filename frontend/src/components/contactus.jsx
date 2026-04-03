import { useState } from "react";
import './contactus.css';

function Contact() {
  const [submitted, setSubmitted] = useState(false);

 const handleSubmit = (e) => {
  e.preventDefault(); // stop reload

  setSubmitted(true);

  // ✅ clear form fields
  e.target.reset();

  // optional: hide message after 3 sec
  setTimeout(() => setSubmitted(false), 3000);
};
  return (
    <div className="contact-container">
      <div className="contact-card">
        <h1>Contact Us</h1>
        <p className="tagline">We’d love to hear from you 💬</p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" rows="4" required></textarea>
          <button type="submit">Send Message</button>
        </form>

        {/* ✅ Success message */}
        {submitted && (
          <p className="success-msg">
            ✅ Message sent successfully! We’ll get back to you soon.
          </p>
        )}

        <div className="contact-info">
          <p>Email: support@almamatters.com</p>
          <p>Phone: +91 98765 43210</p>
        </div>
      </div>
    </div>
  );
}

export default Contact;