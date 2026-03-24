import React, { useState, useEffect } from "react";
import "./landerpage.css";
import { Link } from "react-router-dom";
import logoimg from "../assets/almamatterslogo.jpeg";
import heroimg1 from "../assets/heroimg1.jpeg";
import heroimg2 from "../assets/heroimg2.jpeg";
import heroimg3 from "../assets/heroimg3.jpeg";
import heroimg4 from "../assets/heroimg4.jpeg";
import image1 from "../assets/image1.jpg";
import image2 from "../assets/image2.jpg";
import image3 from "../assets/image3.jpg";
import image4 from "../assets/image4.jpg";
// import psg from "../assets/psg.jpg";
// import iitm from "../assets/iitm.jpg";
// import iimb from "../assets/iimb.png";
// import iisc from "../assets/iisc.png";
// import bits from "../assets/bits.png";
import heroimg5 from "../assets/almamatterslogowithname.jpeg";

/* ── slide metadata ─────────────────────────────────────── */
const slides = [
  {
    src: heroimg5,
    alt: "AlmaMatters",
    title: "Welcome to AlmaMatters",
    description:
      "AlmaMatters is the premier platform bridging the gap between current students and distinguished alumni. Our mission is to create meaningful connections that translate into real career opportunities, mentorship, and lifelong professional relationships.",
    tag: "About Us",
  },
  {
    src: image1,
    alt: "Community",
    title: "Build Your Network",
    description:
      "Connect with thousands of alumni from top institutions across India. Our smart matching algorithm ensures you meet the right people at the right time — whether you're looking for a mentor, a referral, or a collaborator on your next big idea.",
    tag: "Networking",
  },
  {
    src: image2,
    alt: "Mentorship",
    title: "Get Mentored by the Best",
    description:
      "Access one-on-one mentorship sessions with alumni working at Google, McKinsey, ISRO, and more. Share your goals, get personalised roadmaps, and fast-track your career with guidance from those who have been exactly where you are today.",
    tag: "Mentorship",
  },
  {
    src: image3,
    alt: "Opportunities",
    title: "Discover Opportunities",
    description:
      "Internships, research openings, startup co-founder searches, and full-time roles — all curated by alumni who want to hire from their alma mater. Get early access to opportunities before they hit job boards.",
    tag: "Careers",
  },
  {
    src: image4,
    alt: "Events",
    title: "Attend Exclusive Events",
    description:
      "From campus hackathons to industry summits, AlmaMatters hosts and promotes events that bring communities together. Stay in the loop with alumni reunions, guest lectures, and virtual networking mixers tailored to your college.",
    tag: "Events",
  },
];

export default function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(null); // 'next' | 'prev'
  const [animating, setAnimating] = useState(false);

  /* modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlide, setModalSlide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  /* ── carousel navigation ── */
  const goTo = (idx, dir) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
      setDirection(null);
    }, 420);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length, "prev");
  const next = () => goTo((current + 1) % slides.length, "next");

  /* ── modal open / close ── */
  const openModal = (slide) => {
    setModalSlide(slide);
    setModalOpen(true);
    setTimeout(() => setModalVisible(true), 20);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setModalOpen(false);
      setModalSlide(null);
    }, 500);
  };

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── slide class helper ── */
  const slideClass = () => {
    if (!animating) return "cs-slide cs-active";
    return direction === "next"
      ? "cs-slide cs-exit-left"
      : "cs-slide cs-exit-right";
  };

  return (
    <div className="page">
      {/* ══════════ HEADER ══════════ */}
      <header className="header">
        <div className="logo-section">
          <img src={logoimg} alt="almamatterslogo" className="logo" />
          <span className="brand-name">AlmaMatters</span>
        </div>
        <nav className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/signup">SignUp</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact" className="contact-btn">Contact Us</Link>
        </nav>
      </header>

      {/* ══════════ MAIN ══════════ */}
      <main className="main">
        <div className="firstpara">
          <p>"Connecting Students and Alumni. Creating Opportunities That Matter."</p>
          <p>Join the tribe now!</p>
        </div>

        {/* ── CAROUSEL ── */}
        <div className="carousel-wrapper">
          {/* Left arrow */}
          <button className="arrow arrow-left" onClick={prev} aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Slide */}
          <div className="carousel-viewport" onClick={() => openModal(slides[current])}>
            <div className={slideClass()}>
              <img src={slides[current].src} alt={slides[current].alt} className="carousel-img" />
              <div className="carousel-overlay">
                <span className="carousel-tag">{slides[current].tag}</span>
                <p className="carousel-hint">Click to explore →</p>
              </div>
            </div>
          </div>

          {/* Right arrow */}
          <button className="arrow arrow-right" onClick={next} aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === current ? "dot-active" : ""}`}
                onClick={() => goTo(i, i > current ? "next" : "prev")}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── TRUSTED BY ── */}
        {/* <div className="trustedby">
          <h4>Trusted By :</h4>
          <div className="logos-row">
            {[{ src: psg, alt: "PSG" }, { src: iitm, alt: "IITM" }, { src: bits, alt: "BITS" }, { src: iimb, alt: "IIMB" }, { src: iisc, alt: "IISc" }].map((col) => (
              <div className="collegelogos" key={col.alt}>
                <img src={col.src} alt={col.alt} />
                <p>{col.alt}</p>
              </div>
            ))}
          </div>
        </div> */}
      </main>

      {/* ══════════ SPLIT-PANEL MODAL ══════════ */}
      {modalOpen && modalSlide && (
        <div className={`modal-backdrop ${modalVisible ? "modal-backdrop-in" : ""}`} onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>

            {/* TOP PANEL — slides in from above */}
            <div className={`modal-panel modal-top ${modalVisible ? "panel-top-in" : ""}`}>
              <img src={modalSlide.src} alt={modalSlide.alt} className="modal-img" />
              <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {/* BOTTOM PANEL — slides in from below */}
            <div className={`modal-panel modal-bottom ${modalVisible ? "panel-bottom-in" : ""}`}>
              <span className="modal-tag">{modalSlide.tag}</span>
              <h2 className="modal-title">{modalSlide.title}</h2>
              <p className="modal-desc">{modalSlide.description}</p>
              <div className="modal-actions">
                <Link to="/signup" className="modal-cta" onClick={closeModal}>Join Now</Link>
                <button className="modal-secondary" onClick={closeModal}>Maybe Later</button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}