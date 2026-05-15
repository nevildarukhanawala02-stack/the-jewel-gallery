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
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <span>© 2014–{new Date().getFullYear()} The Jewel Gallery. All rights reserved.</span>
      </div>
    </footer>
  );
}
