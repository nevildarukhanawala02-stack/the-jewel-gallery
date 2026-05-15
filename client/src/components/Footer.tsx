import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Shop Column */}
        <div>
          <div className="footer-col-title">Shop</div>
          <div className="footer-links">
            <Link href="/category/rings" className="footer-link">Rings</Link>
            <Link href="/category/necklaces" className="footer-link">Necklaces</Link>
            <Link href="/category/earrings" className="footer-link">Earrings</Link>
            <Link href="/category/bracelets" className="footer-link">Bracelets</Link>
            <Link href="/celebrity" className="footer-link">Celebrity Looks</Link>
            <Link href="/our-story" className="footer-link">Our Story</Link>
          </div>
        </div>

        {/* Legal Column */}
        <div>
          <div className="footer-col-title">Legal</div>
          <div className="footer-links">
            <Link href="/policies?tab=privacy" className="footer-link">Privacy</Link>
            <Link href="/policies?tab=terms" className="footer-link">Terms</Link>
            <Link href="/policies?tab=shipping" className="footer-link">Shipping</Link>
            <Link href="/policies?tab=returns" className="footer-link">Returns</Link>
          </div>
        </div>

        {/* Instagram Column */}
        <div>
          <div className="footer-col-title">Follow Us</div>
          <a
            href="https://www.instagram.com/the_jewel_gallery/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-instagram-card"
          >
            {/* Instagram gradient icon */}
            <div className="footer-ig-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="25%" stopColor="#e6683c" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="75%" stopColor="#cc2366" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-grad)" strokeWidth="1.8" fill="none" />
                <circle cx="12" cy="12" r="4.5" stroke="url(#ig-grad)" strokeWidth="1.8" fill="none" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig-grad)" />
              </svg>
            </div>
            <div className="footer-ig-text">
              <span className="footer-ig-handle">@the_jewel_gallery</span>
              <span className="footer-ig-desc">
                Latest products, celebrity looks &amp; behind-the-scenes — all on Instagram.
              </span>
              <span className="footer-ig-cta">Follow Us →</span>
            </div>
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <span>© 2014–{new Date().getFullYear()} The Jewel Gallery. All rights reserved.</span>
      </div>
    </footer>
  );
}
