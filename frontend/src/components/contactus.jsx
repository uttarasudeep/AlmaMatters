import './contactus.css';

function Contact() {
  return (
    <div className="contact-container">
      <div className="contact-card">
        <h1>Contact Us</h1>
        <p className="tagline">We’d love to hear from you 💬</p>

        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" rows="4" required></textarea>
          <button type="submit">Send Message</button>
        </form>

        <div className="contact-info">
          <p>Email: support@almamatters.com</p>
          <p>Phone: +91 98765 43210</p>
        </div>
      </div>
    </div>
  );
}

export default Contact;