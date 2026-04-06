import './about.css';

function About() {
  return (
    <div className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <h1 className="hero-title">
          Connecting students with alumni for real growth.
        </h1>

        <p className="hero-description">
          AlmaMatters creates a space where mentorship, opportunities,
          and meaningful connections come together to shape careers.
        </p>
      </section>

      {/* FEATURES GRID (6 BOXES) */}
      <section className="features-grid">

        <div className="feature-card">
          <h3>Alumni Data Management</h3>
          <p>
            Centralised alumni profiles — career history, location, and expertise in one searchable directory.
          </p>
        </div>

        <div className="feature-card">
          <h3>Student–Alumni Connect</h3>
          <p>
            Students discover and connect with alumni across industries based on shared background and goals.
          </p>
        </div>

        <div className="feature-card">
          <h3>Mentorship Matching</h3>
          <p>
            Smart recommendations pair students with the right mentors based on interests and compatibility.
          </p>
        </div>

        <div className="feature-card">
          <h3>Event Coordination</h3>
          <p>
            Plan and manage alumni events — from reunions to virtual sessions — all in one place.
          </p>
        </div>

        <div className="feature-card">
          <h3>Career Networking</h3>
          <p>
            Internship referrals, job postings, and warm introductions to unlock opportunities.
          </p>
        </div>

        <div className="feature-card">
          <h3>Community Building</h3>
          <p>
            A strong alumni network that stays active and supports students beyond graduation.
          </p>
        </div>

      </section>
      {/* TEAM SECTION */}
<section className="team-section">

  <h2 className="team-title">Behind AlmaMatters</h2>

  <p className="team-subtitle">
    AlmaMatters is built by a passionate group of developers who believe in
    transforming student–alumni connections into meaningful career opportunities.
    Every feature is designed, developed, and refined collaboratively.
  </p>

  <div className="team-grid">

    <div className="team-card">
      <h3>Backend Engineering</h3>
      <p className="team-name">Sajin</p>
      <p className="team-name">Abishek</p>
      <p className="team-role">
        Designed and implemented secure APIs, database architecture,
        authentication systems, and core server-side logic ensuring
        scalability and performance.
      </p>
    </div>

    <div className="team-card">
      <h3>Frontend Engineering</h3>
      <p className="team-name">Uttra</p>
      <p className="team-name">Keshika</p>
      <p className="team-role">
        Crafted an intuitive and responsive user interface with a strong
        focus on user experience, accessibility, and seamless interaction
        across all modules.
      </p>
    </div>

  </div>

</section>

    </div>
  );
}

export default About;