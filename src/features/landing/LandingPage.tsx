'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRightOutlined,
  CheckOutlined,
  LeftOutlined,
  RightOutlined,
  RobotOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import './landing.css';

type Language = 'en' | 'vi';

// ── Translation Dictionary ───────────────────────────────────────────────────
const i18nContent = {
  en: {
    nav: {
      brand: 'AI Chatbot',
      login: 'Sign In',
    },
    hero: {
      titlePart1: 'Intelligent Conversations with ',
      titleHighlight: 'AI Chatbot',
      subtitle:
        'Enhance customer engagement with our powerful AI chatbot. Automate support, boost conversions, and deliver personalized experiences 24/7.',
      getStarted: 'Get started',
      watchDemo: 'Watch Demo',
    },
    whyUs: {
      title: 'Why Choose Us',
      subtitle: 'Discover the features that make our platform stand out from the competition.',
      f1Title: 'Natural Language Processing',
      f1Desc: 'Understands context and responds like a human',
      f2Title: 'Multi-channel Support',
      f2Desc: 'Deploy on website, mobile apps, and messaging platforms',
      f3Title: 'Custom Training',
      f3Desc: 'Train with your data for industry-specific responses',
      f4Title: 'Analytics Dashboard',
      f4Desc: 'Track performance and optimize conversations',
    },
    testimonials: {
      title: 'What Our Clients Say',
      subtitle: "Don't just take our word for it. Here's what our clients have to say.",
      items: [
        {
          name: 'Darrell Steward',
          role: 'Customer Success Manager at TechCorp',
          avatar: 'DS',
          quote:
            '"This AI chatbot has reduced our support ticket volume by 45% while maintaining excellent customer satisfaction scores."',
        },
        {
          name: 'Eleanor Pena',
          role: 'Customer Success Manager at TechCorp',
          avatar: 'EP',
          quote:
            '"We\'ve seen a 30% increase in conversion rates since implementing this chatbot on our product pages."',
        },
        {
          name: 'Marvin McKinney',
          role: 'Customer Success Manager at TechCorp',
          avatar: 'MM',
          quote:
            '"The AI\'s ability to handle complex queries and provide personalized recommendations has transformed our customer journey."',
        },
      ],
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the perfect plan for your needs. No hidden fees.',
      mostPopular: 'Most Popular',
      month: '/ month',
      starter: {
        name: 'Starter',
        price: '$49',
        features: [
          '1,000 conversations/month',
          'Basic AI training',
          'Email support',
          'Website integration',
        ],
        btnText: 'Get started',
      },
      business: {
        name: 'Business',
        price: '$149',
        features: [
          '1,000 conversations/month',
          'Custom AI training',
          'Priority support',
          'Multi-channel integration',
        ],
        btnText: 'Get started',
      },
      enterprise: {
        name: 'Enterprise',
        price: '$499',
        features: [
          'Unlimited conversations',
          'Advanced AI training',
          'Dedicated support',
          'Full API integration',
        ],
        btnText: 'Get started',
      },
    },
    cta: {
      title: 'Ready to Transform Your Customer Experience?',
      subtitle:
        'Join thousands of businesses using our AI chatbot to deliver exceptional customer service around the clock.',
      startFree: 'Start Free Trial',
      contactSales: 'Contact Sales',
    },
    footer: {
      subscribeTitle: 'Subscribe to these exclusive deals',
      emailPlaceholder: 'Enter your Email Address',
      col1Title: 'Important links',
      col1Links: [
        'Cheap flights',
        'Flight status',
        'Trip ideas',
        'Romantic Destinations',
        'Customer Support',
      ],
      col2Title: "We're Thinking",
      col2Links: ['FAQs', 'Investor relations'],
      col3Title: 'Power up your business',
      col3Links: ['Join your fleet', 'Premium Connectivity Partner'],
      copyright: '© 2026 Zodinet. All rights reserved',
      terms: 'Term and conditions',
      privacy: 'Privacy policy',
    },
    widget: {
      title: 'AI Chatbot Assistant',
      welcome: 'Hello! How can I assist you today?',
      placeholderNotice: 'Chat widget embed target ready for script injection.',
    },
  },
  vi: {
    nav: {
      brand: 'AI Chatbot',
      login: 'Đăng nhập',
    },
    hero: {
      titlePart1: 'Trò chuyện thông minh với ',
      titleHighlight: 'AI Chatbot',
      subtitle:
        'Nâng cao tương tác khách hàng với chatbot AI mạnh mẽ. Tự động hóa hỗ trợ, tăng tỷ lệ chuyển đổi và mang đến trải nghiệm cá nhân hóa 24/7.',
      getStarted: 'Bắt đầu ngay',
      watchDemo: 'Xem Demo',
    },
    whyUs: {
      title: 'Tại Sao Chọn Chúng Tôi',
      subtitle:
        'Khám phá các tính năng nổi bật giúp nền tảng của chúng tôi vượt trội so với đối thủ.',
      f1Title: 'Xử Lý Ngôn Ngữ Tự Nhiên',
      f1Desc: 'Hiểu ngữ cảnh và phản hồi tự nhiên như con người',
      f2Title: 'Hỗ Trợ Đa Kênh',
      f2Desc: 'Triển khai dễ dàng trên Website, Ứng dụng di động và các nền tảng tin nhắn',
      f3Title: 'Huấn Luyện Theo Yêu Cầu',
      f3Desc: 'Huấn luyện AI bằng dữ liệu riêng cho từng lĩnh vực kinh doanh',
      f4Title: 'Bảng Báo Cáo Phân Tích',
      f4Desc: 'Theo dõi hiệu suất và tối ưu hóa chất lượng cuộc trò chuyện',
    },
    testimonials: {
      title: 'Khách Hàng Nói Gì Về Chúng Tôi',
      subtitle: 'Hãy nghe chia sẻ trực tiếp từ những khách hàng đã sử dụng dịch vụ.',
      items: [
        {
          name: 'Darrell Steward',
          role: 'Quản lý thành công khách hàng tại TechCorp',
          avatar: 'DS',
          quote:
            '"Chatbot AI này đã giúp giảm 45% lượng yêu cầu hỗ trợ mà vẫn duy trì điểm hài lòng của khách hàng ở mức tuyệt vời."',
        },
        {
          name: 'Eleanor Pena',
          role: 'Quản lý thành công khách hàng tại TechCorp',
          avatar: 'EP',
          quote:
            '"Chúng tôi ghi nhận tỷ lệ chuyển đổi tăng 30% kể từ khi nhúng chatbot vào các trang sản phẩm."',
        },
        {
          name: 'Marvin McKinney',
          role: 'Quản lý thành công khách hàng tại TechCorp',
          avatar: 'MM',
          quote:
            '"Khả năng xử lý các truy vấn phức tạp và đề xuất cá nhân hóa của AI đã nâng tầm toàn bộ hành trình khách hàng của chúng tôi."',
        },
      ],
    },
    pricing: {
      title: 'Bảng Giá Đơn Giản, Minh Bạch',
      subtitle: 'Lựa chọn gói dịch vụ phù hợp nhất với nhu cầu của bạn. Không phí ẩn.',
      mostPopular: 'Phổ Biến Nhất',
      month: '/ tháng',
      starter: {
        name: 'Starter',
        price: '$49',
        features: [
          '1.000 cuộc trò chuyện/tháng',
          'Huấn luyện AI cơ bản',
          'Hỗ trợ qua Email',
          'Tích hợp Website',
        ],
        btnText: 'Bắt đầu ngay',
      },
      business: {
        name: 'Business',
        price: '$149',
        features: [
          '1.000 cuộc trò chuyện/tháng',
          'Huấn luyện AI theo yêu cầu',
          'Hỗ trợ ưu tiên',
          'Tích hợp đa kênh',
        ],
        btnText: 'Bắt đầu ngay',
      },
      enterprise: {
        name: 'Enterprise',
        price: '$499',
        features: [
          'Không giới hạn cuộc trò chuyện',
          'Huấn luyện AI nâng cao',
          'Hỗ trợ chuyên biệt 1:1',
          'Tích hợp toàn bộ API',
        ],
        btnText: 'Bắt đầu ngay',
      },
    },
    cta: {
      title: 'Sẵn Sàng Nâng Tầm Trải Nghiệm Khách Hàng?',
      subtitle:
        'Tham gia cùng hàng ngàn doanh nghiệp đang sử dụng AI Chatbot để cung cấp dịch vụ khách hàng xuất sắc 24/7.',
      startFree: 'Dùng Thử Miễn Phí',
      contactSales: 'Liên Hệ Tư Vấn',
    },
    footer: {
      subscribeTitle: 'Đăng ký nhận ưu đãi độc quyền',
      emailPlaceholder: 'Nhập địa chỉ Email của bạn',
      col1Title: 'Liên kết quan trọng',
      col1Links: [
        'Vé máy bay giá rẻ',
        'Trạng thái chuyến bay',
        'Ý tưởng du lịch',
        'Điểm đến lãng mạn',
        'Hỗ trợ khách hàng',
      ],
      col2Title: 'Góc nhìn & Tin tức',
      col2Links: ['Câu hỏi thường gặp (FAQs)', 'Quan hệ cổ đông'],
      col3Title: 'Phát triển doanh nghiệp',
      col3Links: ['Gia nhập đội ngũ', 'Đối tác kết nối cao cấp'],
      copyright: '© 2026 Zodinet. Tất cả quyền được bảo lưu',
      terms: 'Điều khoản dịch vụ',
      privacy: 'Chính sách bảo mật',
    },
    widget: {
      title: 'Trợ lý AI Chatbot',
      welcome: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
      placeholderNotice: 'Khu vực sẵn sàng nhúng Chat Widget (Script Embed Root).',
    },
  },
};

export function LandingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [activeTestimonial, setActiveTestimonial] = useState(1);

  const t = i18nContent[lang];

  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <div className="landing-container">
      {/* ── Top Header / Language Switcher ── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/landing" className="landing-brand">
            <div className="landing-brand-icon">
              <RobotOutlined />
            </div>
            <span>{t.nav.brand}</span>
          </Link>

          <div className="landing-nav-actions">
            <div className="lang-switcher">
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}

                aria-label="English"
              >
                🇬🇧 EN
              </button>
              <button
                className={`lang-btn ${lang === 'vi' ? 'active' : ''}`}
                onClick={() => setLang('vi')}
                aria-label="Tiếng Việt"
              >
                🇻🇳 VI
              </button>
            </div>

            <Link href="/login" className="nav-login-btn">
              {t.nav.login}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            {t.hero.titlePart1}
            <span className="hero-title-highlight">{t.hero.titleHighlight}</span>
          </h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <div className="hero-buttons">
            <button className="btn-primary-hero" onClick={handleGetStarted}>
              {t.hero.getStarted} <ArrowRightOutlined />
            </button>
            <button className="btn-secondary-hero" onClick={handleGetStarted}>
              {t.hero.watchDemo}
            </button>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="section-wrapper">
        <div className="section-header">
          <h2 className="section-title">{t.whyUs.title}</h2>
          <p className="section-subtitle">{t.whyUs.subtitle}</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <RobotOutlined />
            </div>
            <h3 className="feature-card-title">{t.whyUs.f1Title}</h3>
            <p className="feature-card-desc">{t.whyUs.f1Desc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <AppstoreOutlined />
            </div>
            <h3 className="feature-card-title">{t.whyUs.f2Title}</h3>
            <p className="feature-card-desc">{t.whyUs.f2Desc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <SafetyCertificateOutlined />
            </div>
            <h3 className="feature-card-title">{t.whyUs.f3Title}</h3>
            <p className="feature-card-desc">{t.whyUs.f3Desc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <BarChartOutlined />
            </div>
            <h3 className="feature-card-title">{t.whyUs.f4Title}</h3>
            <p className="feature-card-desc">{t.whyUs.f4Desc}</p>
          </div>
        </div>
      </section>

      {/* ── Testimonials Carousel ── */}
      <section className="section-wrapper testimonials-section">
        <div className="section-header">
          <h2 className="section-title">{t.testimonials.title}</h2>
          <p className="section-subtitle">{t.testimonials.subtitle}</p>
        </div>

        <div className="testimonials-container">
          {t.testimonials.items.map((item, idx) => (
            <div
              key={idx}
              className={`testimonial-card ${idx === activeTestimonial ? 'active' : ''}`}
              onClick={() => setActiveTestimonial(idx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="testimonial-author">
                <div className="author-avatar">{item.avatar}</div>
                <div className="author-info">
                  <h4>{item.name}</h4>
                  <p>{item.role}</p>
                </div>
              </div>
              <p className="testimonial-quote">{item.quote}</p>
            </div>
          ))}
        </div>

        <div className="carousel-controls">
          <button
            className="carousel-arrow-btn"
            onClick={() =>
              setActiveTestimonial((prev) =>
                prev > 0 ? prev - 1 : t.testimonials.items.length - 1,
              )
            }
          >
            <LeftOutlined />
          </button>
          {t.testimonials.items.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot ${idx === activeTestimonial ? 'active' : ''}`}
              onClick={() => setActiveTestimonial(idx)}
            />
          ))}
          <button
            className="carousel-arrow-btn"
            onClick={() =>
              setActiveTestimonial((prev) =>
                prev < t.testimonials.items.length - 1 ? prev + 1 : 0,
              )
            }
          >
            <RightOutlined />
          </button>
        </div>
      </section>

      {/* ── Simple, Transparent Pricing ── */}
      <section className="section-wrapper">
        <div className="section-header">
          <h2 className="section-title">{t.pricing.title}</h2>
          <p className="section-subtitle">{t.pricing.subtitle}</p>
        </div>

        <div className="pricing-grid">
          {/* Starter Plan */}
          <div className="pricing-card">
            <div>
              <h3 className="pricing-plan-name">{t.pricing.starter.name}</h3>
              <div className="pricing-price-box">
                <span className="pricing-amount">{t.pricing.starter.price}</span>
                <span className="pricing-period">{t.pricing.month}</span>
              </div>
              <ul className="pricing-features-list">
                {t.pricing.starter.features.map((feat, idx) => (
                  <li key={idx}>
                    <CheckOutlined className="check-icon" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <button className="pricing-btn" onClick={handleGetStarted}>
              {t.pricing.starter.btnText}
            </button>
          </div>

          {/* Business Plan (Popular) */}
          <div className="pricing-card popular">
            <span className="popular-badge">{t.pricing.mostPopular}</span>
            <div>
              <h3 className="pricing-plan-name">{t.pricing.business.name}</h3>
              <div className="pricing-price-box">
                <span className="pricing-amount">{t.pricing.business.price}</span>
                <span className="pricing-period">{t.pricing.month}</span>
              </div>
              <ul className="pricing-features-list">
                {t.pricing.business.features.map((feat, idx) => (
                  <li key={idx}>
                    <CheckOutlined className="check-icon" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <button className="pricing-btn" onClick={handleGetStarted}>
              {t.pricing.business.btnText}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="pricing-card">
            <div>
              <h3 className="pricing-plan-name">{t.pricing.enterprise.name}</h3>
              <div className="pricing-price-box">
                <span className="pricing-amount">{t.pricing.enterprise.price}</span>
                <span className="pricing-period">{t.pricing.month}</span>
              </div>
              <ul className="pricing-features-list">
                {t.pricing.enterprise.features.map((feat, idx) => (
                  <li key={idx}>
                    <CheckOutlined className="check-icon" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <button className="pricing-btn" onClick={handleGetStarted}>
              {t.pricing.enterprise.btnText}
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">{t.cta.title}</h2>
          <p className="cta-desc">{t.cta.subtitle}</p>
          <div className="hero-buttons">
            <button className="btn-primary-hero" onClick={handleGetStarted}>
              {t.cta.startFree}
            </button>
            <button className="btn-secondary-hero" onClick={handleGetStarted}>
              {t.cta.contactSales}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer Section ── */}
      <footer className="footer-section">
        <div className="footer-inner">
          <div className="footer-top-grid">
            {/* Email Subscribe */}
            <div>
              <h4 className="footer-subscribe-title">{t.footer.subscribeTitle}</h4>
              <div className="footer-email-box">
                <input
                  type="email"
                  placeholder={t.footer.emailPlaceholder}
                  className="footer-email-input"
                />
                <button className="footer-email-btn" aria-label="Subscribe">
                  ↗
                </button>
              </div>
            </div>

            {/* Important Links */}
            <div>
              <h4 className="footer-col-title">{t.footer.col1Title}</h4>
              <ul className="footer-links">
                {t.footer.col1Links.map((link, idx) => (
                  <li key={idx}>
                    <a href="#link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* We're Thinking */}
            <div>
              <h4 className="footer-col-title">{t.footer.col2Title}</h4>
              <ul className="footer-links">
                {t.footer.col2Links.map((link, idx) => (
                  <li key={idx}>
                    <a href="#link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Power Up Your Business */}
            <div>
              <h4 className="footer-col-title">{t.footer.col3Title}</h4>
              <ul className="footer-links">
                {t.footer.col3Links.map((link, idx) => (
                  <li key={idx}>
                    <a href="#link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>{t.footer.copyright}</div>
            <div className="footer-bottom-links">
              <a href="#terms">{t.footer.terms}</a>
              <a href="#privacy">{t.footer.privacy}</a>
              <a href="#facebook">Facebook</a>
              <a href="#instagram">Instagram</a>
              <a href="#linkedin">Linkedin</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
