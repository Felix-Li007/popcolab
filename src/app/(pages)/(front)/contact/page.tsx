'use client';

import { useState } from 'react';
import styles from '@/styles/contact.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setStatusMessage('Sending...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setStatusMessage(result.message);

        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          subject: '',
          message: '',
        });

        setTimeout(() => setSubmitted(false), 3000);
      } else {
        setStatusMessage(result.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatusMessage('Failed to send message. Try again later.');
    }
  };

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email',
      detail: 'hello@popcolab.com',
      description: 'We will respond within 24 hours',
    },
    {
      icon: '📱',
      title: 'Phone',
      detail: '+1 (555) 123-4567',
      description: 'Available Mon-Fri, 9AM-6PM EST',
    },
    {
      icon: '📍',
      title: 'Address',
      detail: '123 Creative Street, San Francisco, CA 94105',
      description: 'Visit our office anytime',
    },
  ];
  const statusVariantClass = submitted ? '' : styles['error-message'];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className={styles['contact-hero']}>
          <div className={styles['contact-hero-content']}>
            <h1 className={styles['contact-hero-title']}>Get in Touch</h1>
            <p className={styles['contact-hero-subtitle']}>
              Have questions? We would love to hear from you
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className={styles['contact-info-section']}>
          <div className={styles['contact-info-grid']}>
            {contactInfo.map(info => (
              <div key={info.title} className={styles['contact-info-card']}>
                <div className={styles['info-icon']}>{info.icon}</div>
                <h3 className={styles['info-title']}>{info.title}</h3>
                <p className={styles['info-detail']}>{info.detail}</p>
                <p className={styles['info-description']}>{info.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className={styles['contact-form-section']}>
          <div className={styles['form-container']}>
            <h2 className={styles['form-title']}>Send us a Message</h2>
            <p className={styles['form-subtitle']}>
              Fill out the form below and we will get back to you soon
            </p>

            {statusMessage && (
              <div
                className={`${styles['success-message']} ${statusVariantClass}`}
              >
                {statusMessage}
              </div>
            )}

            <form className={styles['contact-form']} onSubmit={handleSubmit}>
              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="name" className={styles['form-label']}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={styles['form-input']}
                    placeholder="John Doe"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="email" className={styles['form-label']}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={styles['form-input']}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="phone" className={styles['form-label']}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles['form-input']}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="company" className={styles['form-label']}>
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={styles['form-input']}
                    placeholder="Your Company"
                  />
                </div>
              </div>

              <div
                className={`${styles['form-group']} ${styles['full-width']}`}
              >
                <label htmlFor="subject" className={styles['form-label']}>
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={styles['form-input']}
                >
                  <option value="">Select a subject</option>
                  <option value="inquiry">General Inquiry</option>
                  <option value="services">Services Information</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="support">Customer Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div
                className={`${styles['form-group']} ${styles['full-width']}`}
              >
                <label htmlFor="message" className={styles['form-label']}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className={styles['form-textarea']}
                  placeholder="Tell us more about your inquiry..."
                  rows={6}
                />
              </div>

              <button type="submit" className={styles['form-submit-btn']}>
                Send Message
              </button>
            </form>
          </div>
        </section>

        {/* Social Links */}
        <section className={styles['contact-social']}>
          <h2 className={styles['social-title']}>Follow Us</h2>
          <div className={styles['social-links']}>
            <button type="button" className={styles['social-link']}>
              LinkedIn
            </button>
            <button type="button" className={styles['social-link']}>
              Instagram
            </button>
            <button type="button" className={styles['social-link']}>
              Facebook
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
