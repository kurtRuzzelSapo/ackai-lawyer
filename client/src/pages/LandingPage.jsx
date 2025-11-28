import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const suggestions = [
    "Explain my constitutional rights",
    "Help with a legal complaint",
    "Guide me on due process",
    "Discuss freedom of speech"
  ];

  useEffect(() => {
    // Animate stats counter
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'));
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          stat.textContent = target.toLocaleString();
          clearInterval(timer);
        } else {
          stat.textContent = Math.floor(current).toLocaleString();
        }
      }, 30);
    });

    // FAQ accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('active');
      });
    });

    // Step switcher
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach(item => {
      item.addEventListener('click', () => {
        const step = parseInt(item.getAttribute('data-step'));
        setActiveStep(step);
      });
    });
  }, []);

  const handleStartWithQuestion = (question) => {
    navigate('/video-call', { state: { initialQuestion: question } });
  };

  const handleStart = () => {
    navigate('/video-call');
  };

  return (
    <div className="landing-page">
      {/* Grid Background */}
      <div className="grid-background"></div>

      {/* Header Navigation */}
      <header className="header">
        <nav className="nav-container">
          <div className="nav-content">
            <div className="logo">
              <a href="/">ACKAI</a>
            </div>

            {/* Desktop Menu */}
            <div className="nav-menu desktop-menu">
              <a href="#home" className="nav-link">Home</a>
              <a href="#services" className="nav-link">Services</a>
              <a href="#careers" className="nav-link">Careers</a>
              <a href="#blogs" className="nav-link">Blogs</a>
              <a href="#about" className="nav-link">About</a>
            </div>

            {/* Login Button */}
            <button onClick={handleStart} className="btn-login">Get Started</button>

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mobile-menu active">
              <a href="#home" className="nav-link-mobile">Home</a>
              <a href="#services" className="nav-link-mobile">Services</a>
              <a href="#careers" className="nav-link-mobile">Careers</a>
              <a href="#blogs" className="nav-link-mobile">Blogs</a>
              <a href="#about" className="nav-link-mobile">About</a>
              <button onClick={handleStart} className="btn-login-mobile">Get Started</button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-container">
          <div className="hero-content animate-slide-down">
            <h1 className="hero-title">
              AI Citizen Knowledge & Advisory Interface
            </h1>
            <p className="hero-subtitle">
              Understand citizen scenarios, retrieve accurate knowledge from authoritative sources, 
              and advise through a structured, conversation-based interface — bridging human interaction 
              with AI reasoning for critical real-world use cases involving rights, governance, and civic interactions.
            </p>
            <div className="hero-buttons">
              <button onClick={handleStart} className="btn-primary">
                Get Started
              </button>
            </div>

            {/* Quick Questions */}
            <div className="suggestion-container">
              <h3 className="suggestion-title">Quick Questions</h3>
              <div className="suggestion-grid">
                {suggestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStartWithQuestion(question)}
                    className="suggestion-btn"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <h2 className="stat-number" data-target="50000">0</h2>
                <p className="stat-label">Citizens Advised</p>
              </div>
              <div className="stat-item">
                <h2 className="stat-number" data-target="1000">0</h2>
                <p className="stat-label">Legal Queries Resolved</p>
              </div>
              <div className="stat-item">
                <h2 className="stat-number" data-target="200">0</h2>
                <p className="stat-label">Civic Scenarios Covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Segment */}
      <section id="careers" className="client-segment">
        <h2 className="section-title">Who ACKAI Serves</h2>
        <p className="section-subtitle">
          ACKAI provides AI-powered advisory for individuals facing legal, civic, and rights-related challenges.
        </p>

        <div className="cards-grid">
          <div className="service-card">
            <div className="card-icon">
              <i className="fas fa-balance-scale"></i>
            </div>
            <h3 className="card-title">Legal Guidance Seekers</h3>
            <p className="card-desc">Individuals needing advice on contracts, rights, and legal procedures.</p>
          </div>

          <div className="service-card">
            <div className="card-icon">
              <i className="fas fa-building"></i>
            </div>
            <h3 className="card-title">Civic Participants</h3>
            <p className="card-desc">Citizens engaging with government services and public processes.</p>
          </div>

          <div className="service-card">
            <div className="card-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="card-title">Rights Advocates</h3>
            <p className="card-desc">People facing rights-related uncertainty and seeking neutral explanations.</p>
          </div>

          <div className="service-card">
            <div className="card-icon">
              <i className="fas fa-compass"></i>
            </div>
            <h3 className="card-title">Governance Navigators</h3>
            <p className="card-desc">Individuals dealing with bureaucratic processes and civic interactions.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <h2 className="section-title">Our Advisory Services</h2>
        <p className="section-subtitle">
          Comprehensive AI-powered advisory solutions tailored for citizens facing legal, civic, and rights-related challenges.
        </p>

        <div className="services-grid">
          <div className="service-card ">
            <div className="card-icon">
              <i className="fas fa-gavel"></i>
            </div>
            <h3 className="card-title">Legal Advisory</h3>
            <p className="card-desc">Get accurate legal guidance on contracts, rights, and procedures.</p>
          </div>

          <div className="service-card">
            <div className="card-icon">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="card-title">Civic Information</h3>
            <p className="card-desc">Navigate government services and public processes with confidence.</p>
          </div>

          <div className="service-card">
            <div className="card-icon">
              <i className="fas fa-hand-holding-heart"></i>
            </div>
            <h3 className="card-title">Rights Support</h3>
            <p className="card-desc">Understand and assert your rights in various situations.</p>
          </div>

          <div className="service-card">
            <div className="card-icon">
              <i className="fas fa-landmark"></i>
            </div>
            <h3 className="card-title">Governance Guidance</h3>
            <p className="card-desc">Support for dealing with bureaucratic processes.</p>
          </div>
        </div>
      </section>

      {/* CTA Glass Card */}
      <div className="cta-container">
        <div className="glass-card">
          <div className="glass-content">
            <h2 className="glass-title">Get Expert AI Advice Today</h2>
            <p className="glass-description">
              Start a conversation to explore how ACKAI can help with your legal, civic, or rights-related questions.
            </p>
          </div>
          <button onClick={handleStart} className="btn-glass">
            <i className="fas fa-comment-dots"></i>
            Start Conversation
          </button>
        </div>
      </div>

      {/* Connect With ACKAI */}
      <section id="blogs" className="connect-section">
        <h2 className="section-title">Connect With ACKAI</h2>
        <div className="social-links">
          <a href="#" target="_blank" rel="noopener noreferrer" className="social-link">
            <i className="fab fa-linkedin"></i>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="social-link">
            <i className="fab fa-facebook"></i>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="social-link">
            <i className="fas fa-globe"></i>
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="about" className="faq-section">
        <div className="faq-container">
          <div className="faq-header">
            <h2 className="faq-title">FAQ</h2>
            <p className="faq-subtitle">
              Have questions about how ACKAI can help with your legal, civic, or rights-related needs? We've got answers.
            </p>
          </div>

          <div className="faq-list">
            <div className="faq-item">
              <button className="faq-question">
                <span>What is ACKAI?</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="faq-answer">
                ACKAI is an AI Citizen Knowledge & Advisory Interface designed to provide accurate, neutral advice on legal, civic, and rights-related matters through a conversational interface.
              </div>
            </div>

            <div className="faq-item">
              <button className="faq-question">
                <span>How does ACKAI work?</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="faq-answer">
                Describe your scenario, and ACKAI retrieves knowledge from authoritative sources to provide structured, actionable guidance tailored to your needs.
              </div>
            </div>

            <div className="faq-item">
              <button className="faq-question">
                <span>What types of scenarios can ACKAI help with?</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="faq-answer">
                Legal guidance, civic information, rights advisory, governance support, and knowledge retrieval for citizen-related challenges.
              </div>
            </div>

            <div className="faq-item">
              <button className="faq-question">
                <span>Is ACKAI free to use?</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="faq-answer">
                Yes, ACKAI is designed to be accessible for all citizens seeking reliable information and advice.
              </div>
            </div>

            <div className="faq-item">
              <button className="faq-question">
                <span>How accurate is the information provided?</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="faq-answer">
                ACKAI draws from authoritative sources and uses AI reasoning to ensure accuracy, but always consult professionals for critical decisions.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 ACKAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;