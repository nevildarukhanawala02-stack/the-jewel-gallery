import StorefrontLayout from "@/components/StorefrontLayout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const TABS = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
  { id: "shipping", label: "Shipping Policy" },
  { id: "returns", label: "Returns & Exchanges" },
];

const POLICIES: Record<string, { title: string; lastUpdated: string; content: React.ReactNode }> = {
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "January 2025",
    content: (
      <>
        <p>At The Jewel Gallery, we are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data.</p>

        <h3>Information We Collect</h3>
        <p>We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment information when you make a purchase or create an account.</p>

        <h3>How We Use Your Information</h3>
        <ul>
          <li>To process and fulfil your orders</li>
          <li>To communicate with you about your orders and account</li>
          <li>To send you updates about new collections and exclusive events (with your consent)</li>
          <li>To improve our products and services</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h3>Data Security</h3>
        <p>We implement industry-standard security measures to protect your personal information. All payment transactions are encrypted using SSL technology and processed through secure payment gateways.</p>

        <h3>Data Sharing</h3>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties except as necessary to fulfil your orders (such as shipping partners) or as required by law.</p>

        <h3>Your Rights</h3>
        <p>You have the right to access, correct, or delete your personal information at any time. To exercise these rights, please contact us at <strong>care@thejewelgallery.in</strong>.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of Service",
    lastUpdated: "January 2025",
    content: (
      <>
        <p>By accessing and using The Jewel Gallery website and services, you agree to be bound by these Terms of Service. Please read them carefully before making a purchase.</p>

        <h3>Products & Descriptions</h3>
        <p>We make every effort to display our products as accurately as possible. However, slight variations in colour may occur due to monitor settings. All jewellery is handcrafted, and minor variations in finish are a hallmark of artisanal work, not defects.</p>

        <h3>Pricing</h3>
        <p>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes. We reserve the right to modify prices without prior notice. Orders placed before a price change will be honoured at the original price.</p>

        <h3>Order Acceptance</h3>
        <p>We reserve the right to refuse or cancel any order at our discretion. If an order is cancelled after payment, a full refund will be issued within 5–7 business days.</p>

        <h3>Intellectual Property</h3>
        <p>All content on this website, including designs, images, and text, is the intellectual property of The Jewel Gallery and may not be reproduced without written permission.</p>

        <h3>Limitation of Liability</h3>
        <p>The Jewel Gallery shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services beyond the value of the purchase made.</p>
      </>
    ),
  },
  shipping: {
    title: "Shipping Policy",
    lastUpdated: "January 2025",
    content: (
      <>
        <p>We take great care in packaging and shipping your precious jewellery. Every order is gift-wrapped and dispatched with the utmost care.</p>

        <h3>Shipping Options</h3>
        <ul>
          <li><strong>Standard Shipping — FREE</strong> on all orders. Delivery within 5–7 business days across India.</li>
          <li><strong>Express Shipping — ₹500</strong>. Delivery within 2–3 business days. Available for all pin codes serviced by our courier partners.</li>
        </ul>

        <h3>Free Shipping Threshold</h3>
        <p>Complimentary Standard Shipping is available on all orders, with no minimum order value. Express Shipping is available at ₹500 for faster delivery.</p>

        <h3>Processing Time</h3>
        <p>Orders are processed within 1–2 business days. Custom or made-to-order pieces may require additional time, which will be communicated at the time of purchase.</p>

        <h3>Tracking</h3>
        <p>Once your order is dispatched, you will receive a tracking number via email and SMS. You can track your order through our website or directly on the courier's website.</p>

        <h3>International Shipping</h3>
        <p>We currently ship within India only. International shipping will be available soon. Please contact us at <strong>care@thejewelgallery.in</strong> for special requests.</p>

        <h3>Packaging</h3>
        <p>Every piece is presented in our signature jewellery box, wrapped in tissue, and enclosed in a branded gift bag — complimentary with every order.</p>
      </>
    ),
  },
  returns: {
    title: "Returns & Exchanges",
    lastUpdated: "January 2025",
    content: (
      <>
        <p>We want you to be completely satisfied with your purchase from The Jewel Gallery. If for any reason you are not, we offer a straightforward returns and exchange policy.</p>

        <h3>Return Eligibility</h3>
        <ul>
          <li>Items must be returned within <strong>30 days</strong> of delivery</li>
          <li>Items must be unworn, unaltered, and in their original condition</li>
          <li>Items must be returned in their original packaging with all certificates and tags</li>
          <li>Custom or personalised pieces are not eligible for return</li>
        </ul>

        <h3>How to Initiate a Return</h3>
        <p>To initiate a return, please email us at <strong>care@thejewelgallery.in</strong> with your order number and reason for return. Our team will respond within 24 hours with return instructions.</p>

        <h3>Refund Process</h3>
        <p>Once we receive and inspect the returned item, we will process your refund within 5–7 business days. Refunds are issued to the original payment method.</p>

        <h3>Exchanges</h3>
        <p>We are happy to exchange a piece for a different size or style, subject to availability. Please contact us within 30 days of delivery to arrange an exchange.</p>

        <h3>Damaged or Defective Items</h3>
        <p>If you receive a damaged or defective item, please contact us within 48 hours of delivery with photographs. We will arrange a replacement or full refund at no additional cost to you.</p>

        <h3>Return Shipping</h3>
        <p>Return shipping costs are borne by the customer, except in cases of damaged or defective items, where we will arrange a complimentary pickup.</p>
      </>
    ),
  },
};

export default function PoliciesPage() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("privacy");

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    const tab = params.get("tab");
    if (tab && TABS.find((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const policy = POLICIES[activeTab];

  return (
    <StorefrontLayout>
      <div className="policies-page">
        {/* Hero */}
        <div className="policies-hero">
          <div className="section-eyebrow">Legal & Information</div>
          <h1 className="section-title">Our <em>Policies</em></h1>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Transparency is at the heart of everything we do. Here you'll find everything you need to know
            about how we operate, protect your data, and handle your orders.
          </p>
        </div>

        {/* Tabs */}
        <div className="policies-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`policy-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {policy && (
          <div className="policy-content">
            <h2>{policy.title}</h2>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "32px" }}>
              Last updated: {policy.lastUpdated}
            </p>
            {policy.content}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
