const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

const {
  FaCalendarAlt, FaQrcode, FaUsers, FaChartBar, FaCalculator,
  FaBell, FaShieldAlt, FaCreditCard, FaBolt
} = require("react-icons/fa");

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  deepGreen:  "1B4332",
  forest:     "2D6A4F",
  sage:       "52B788",
  lightSage:  "B7E4C7",
  gold:       "C8973A",
  lightGold:  "F4E2A0",
  cream:      "F5F0E8",
  offWhite:   "FAFAF8",
  white:      "FFFFFF",
  darkText:   "1A1A1A",
  midText:    "4A5568",
  lightText:  "718096",
  mutedText:  "A0AEC0",
  cardBorder: "E2DDD6",
};

async function iconBase64(IconComponent, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const mkShadow  = () => ({ type: "outer", color: "000000", blur: 8,  offset: 3, angle: 135, opacity: 0.10 });
const mkShadowM = () => ({ type: "outer", color: "000000", blur: 12, offset: 4, angle: 135, opacity: 0.14 });

async function build() {
  const pres = new pptxgen();
  pres.layout  = "LAYOUT_WIDE";  // 13.3" × 7.5"
  pres.title   = "TeeAhead – Course Marketing Deck";
  pres.author  = "TeeAhead";
  const W = 13.3, H = 7.5;

  // ══════════════════════════════════════════════════════════
  // SLIDE 1 — COVER
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.deepGreen };

    // Right accent panel
    s.addShape(pres.shapes.RECTANGLE, { x: 8.8, y: 0, w: 4.5, h: H, fill: { color: C.forest }, line: { color: C.forest } });
    s.addShape(pres.shapes.RECTANGLE, { x: 8.8, y: 0, w: 0.07, h: H, fill: { color: C.gold }, line: { color: C.gold } });

    // Right-panel decorative rings
    s.addShape(pres.shapes.OVAL, { x: 10.0, y: 1.4, w: 2.8, h: 2.8, fill: { color: C.deepGreen, transparency: 50 }, line: { color: C.gold, width: 2 } });
    s.addShape(pres.shapes.OVAL, { x: 10.5, y: 1.9, w: 1.8, h: 1.8, fill: { color: C.sage, transparency: 65 }, line: { color: C.sage, width: 1 } });
    s.addText("COURSE\nSOFTWARE\nREDESIGNED", { x: 8.95, y: 1.6, w: 4.2, h: 1.8, fontSize: 12, bold: true, color: C.lightSage, charSpacing: 3, align: "center", valign: "middle", margin: 0 });

    // Wordmark
    s.addText("TEEAHEAD", { x: 0.65, y: 0.9, w: 7.9, h: 1.0, fontSize: 58, bold: true, fontFace: "Georgia", color: C.white, margin: 0 });

    // Gold rule
    s.addShape(pres.shapes.RECTANGLE, { x: 0.65, y: 1.97, w: 7.8, h: 0.06, fill: { color: C.gold }, line: { color: C.gold } });

    // Tagline
    s.addText("The tee sheet software that pays for itself.", { x: 0.65, y: 2.15, w: 8.0, h: 0.58, fontSize: 22, fontFace: "Georgia", italic: true, color: C.lightSage, margin: 0 });
    s.addText("Free for courses. Funded by golfers who love the game.", { x: 0.65, y: 2.8, w: 8.0, h: 0.4, fontSize: 13, color: C.mutedText, margin: 0 });

    // Mid-section: 3 bold claims
    const claims = [
      { head: "$0", sub: "barter — ever" },
      { head: "48 hrs", sub: "to go live" },
      { head: "30-day", sub: "cancel clause" },
    ];
    claims.forEach((c, i) => {
      const cx = 0.65 + i * 2.65;
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: 3.4, w: 2.45, h: 1.5, fill: { color: C.forest }, line: { color: C.sage, width: 1 }, shadow: mkShadow() });
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: 3.4, w: 2.45, h: 0.06, fill: { color: C.gold }, line: { color: C.gold } });
      s.addText(c.head, { x: cx + 0.1, y: 3.55, w: 2.25, h: 0.65, fontSize: 32, bold: true, fontFace: "Georgia", color: C.white, align: "center", margin: 0 });
      s.addText(c.sub,  { x: cx + 0.1, y: 4.2,  w: 2.25, h: 0.42, fontSize: 12, color: C.lightSage, align: "center", margin: 0 });
    });

    // Feature pill row
    const pills = ["Tee Sheet", "Online Booking", "Member Loyalty", "Barter Reports", "Analytics"];
    pills.forEach((p, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: 0.65 + i * 1.6, y: 5.15, w: 1.48, h: 0.38, fill: { color: "0D2B1F" }, line: { color: C.sage, width: 1 } });
      s.addText(p, { x: 0.65 + i * 1.6, y: 5.15, w: 1.48, h: 0.38, fontSize: 9, color: C.lightSage, align: "center", valign: "middle", margin: 0 });
    });

    // Bottom bar
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.62, w: W, h: 0.62, fill: { color: "0D2B1F" }, line: { color: "0D2B1F" } });
    s.addText("teeahead.com  ·  Built for independent golf courses  ·  Metro Detroit & Beyond", {
      x: 0.5, y: H - 0.58, w: W - 1, h: 0.5, fontSize: 11, color: C.lightSage, align: "center", valign: "middle", margin: 0
    });
  }

  // ══════════════════════════════════════════════════════════
  // SLIDE 2 — THE REAL COST OF GOLFNOW
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };

    // Left accent bar
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: H, fill: { color: C.deepGreen }, line: { color: C.deepGreen } });

    // Header
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 1.5, fill: { color: C.offWhite }, line: { color: C.offWhite } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 1.5, w: W, h: 0.05, fill: { color: C.lightSage }, line: { color: C.lightSage } });
    s.addText("What GolfNow Is Really Costing You", { x: 0.5, y: 0.28, w: 10, h: 0.72, fontSize: 30, bold: true, fontFace: "Georgia", color: C.deepGreen, margin: 0 });
    s.addText("The barter model looks free on the surface. The numbers tell a different story.", { x: 0.5, y: 1.01, w: 11, h: 0.42, fontSize: 13, color: C.midText, margin: 0 });

    // 3 stat cards — equal widths, proper margins
    const stats = [
      { num: "$37,000",  label: "Average annual barter\ncost per course",        src: "NGCOA / ORCA study, ~400 courses" },
      { num: "39.6%",    label: "Of all rounds generated\nzero revenue",         src: "Brown Golf, 3-year internal data" },
      { num: "70%",      label: "Of barter tee times booked\nduring peak hours", src: "GolfNow industry analysis" },
    ];

    const cardW = 4.0, startX = 0.5, gap = 0.15;
    stats.forEach((st, i) => {
      const x = startX + i * (cardW + gap);
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.75, w: cardW, h: 3.7, fill: { color: C.white }, line: { color: C.cardBorder, width: 1 }, shadow: mkShadowM() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.75, w: cardW, h: 0.08, fill: { color: C.gold }, line: { color: C.gold } });
      s.addText(st.num, { x: x + 0.15, y: 2.0, w: cardW - 0.3, h: 1.35, fontSize: 58, bold: true, fontFace: "Georgia", color: C.deepGreen, align: "center", margin: 0 });
      s.addText(st.label, { x: x + 0.2, y: 3.4, w: cardW - 0.4, h: 0.9, fontSize: 13.5, color: C.darkText, bold: true, align: "center", margin: 0 });
      s.addText(st.src, { x: x + 0.2, y: 4.35, w: cardW - 0.4, h: 0.45, fontSize: 10, color: C.lightText, align: "center", italic: true, margin: 0 });
    });

    // Quote banner
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.65, w: W - 1.0, h: 1.35, fill: { color: C.deepGreen }, line: { color: C.deepGreen }, shadow: mkShadow() });
    s.addText('"Every time GolfNow books a barter tee time during your Saturday morning, you just worked for free."', {
      x: 0.8, y: 5.7, w: W - 1.6, h: 1.25, fontSize: 14, italic: true, color: C.lightSage, align: "center", valign: "middle", margin: 0
    });
  }

  // ══════════════════════════════════════════════════════════
  // SLIDE 3 — COMPLETELY DIFFERENT MODEL
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.deepGreen };

    s.addText("We Flipped the Model Completely.", { x: 0.6, y: 0.3, w: 12.1, h: 0.75, fontSize: 34, bold: true, fontFace: "Georgia", color: C.white, margin: 0 });
    s.addText("GolfNow charges courses. TeeAhead charges golfers. That single change rewires everything.", { x: 0.6, y: 1.07, w: 12.1, h: 0.44, fontSize: 14, color: C.lightSage, margin: 0 });

    // Column backgrounds
    const lx = 0.55, lw = 5.8;
    const rx = 6.95, rw = 5.85;

    s.addShape(pres.shapes.RECTANGLE, { x: lx, y: 1.68, w: lw, h: 5.3, fill: { color: "2A1515" }, line: { color: "7C3A3A", width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y: 1.68, w: lw, h: 0.6, fill: { color: "7C3A3A" }, line: { color: "7C3A3A" } });
    s.addText("GolfNow Takes From You", { x: lx + 0.2, y: 1.71, w: lw - 0.4, h: 0.52, fontSize: 13, bold: true, color: "F5BFBF", align: "center", valign: "middle", margin: 0 });

    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.68, w: rw, h: 5.3, fill: { color: "152A1F" }, line: { color: C.sage, width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.68, w: rw, h: 0.6, fill: { color: C.forest }, line: { color: C.forest } });
    s.addText("TeeAhead Gives Back", { x: rx + 0.2, y: 1.71, w: rw - 0.4, h: 0.52, fontSize: 13, bold: true, color: C.lightSage, align: "center", valign: "middle", margin: 0 });

    const bads  = ["Barter tee times at full green fee value", "$2.49–$3.49 convenience fee per golfer", "Your course data sold to competitors", "Peak-hour inventory they control", "Multi-year contracts with penalties"];
    const goods = ["$0 barter — your tee times stay yours", "$0 booking fees for your golfers, always", "Your data is yours. Always. Forever.", "You control every single tee time", "30-day cancel clause. No long-term contract."];

    bads.forEach((txt, i) => {
      const y = 2.55 + i * 0.82;
      // X indicator — bright red circle
      s.addShape(pres.shapes.OVAL,      { x: lx + 0.25, y: y + 0.08, w: 0.32, h: 0.32, fill: { color: "C0392B" }, line: { color: "E57373", width: 1 } });
      s.addText("✕",                    { x: lx + 0.25, y: y + 0.08, w: 0.32, h: 0.32, fontSize: 9, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
      s.addText(txt,                    { x: lx + 0.7,  y: y,         w: lw - 0.85, h: 0.45, fontSize: 12.5, color: "F0D0D0", valign: "middle", margin: 0 });
    });

    goods.forEach((txt, i) => {
      const y = 2.55 + i * 0.82;
      // Check indicator — bright green circle
      s.addShape(pres.shapes.OVAL,      { x: rx + 0.25, y: y + 0.08, w: 0.32, h: 0.32, fill: { color: C.sage }, line: { color: C.lightSage, width: 1 } });
      s.addText("✓",                    { x: rx + 0.25, y: y + 0.08, w: 0.32, h: 0.32, fontSize: 9, bold: true, color: C.deepGreen, align: "center", valign: "middle", margin: 0 });
      s.addText(txt,                    { x: rx + 0.7,  y: y,         w: rw - 0.85, h: 0.45, fontSize: 12.5, color: C.lightSage, valign: "middle", margin: 0 });
    });

    // VS badge — centered between columns
    const vsX = lx + lw + (rx - lx - lw) / 2 - 0.38;
    s.addShape(pres.shapes.OVAL, { x: vsX, y: 3.8, w: 0.75, h: 0.75, fill: { color: C.gold }, line: { color: C.gold } });
    s.addText("VS",               { x: vsX, y: 3.8, w: 0.75, h: 0.75, fontSize: 11, bold: true, color: C.deepGreen, align: "center", valign: "middle", margin: 0 });
  }

  // ══════════════════════════════════════════════════════════
  // SLIDE 4 — FEATURE GRID
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    // Header
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 1.3, fill: { color: C.deepGreen }, line: { color: C.deepGreen } });
    s.addText("Everything Your Course Gets", { x: 0.55, y: 0.2, w: 10, h: 0.65, fontSize: 30, bold: true, fontFace: "Georgia", color: C.white, margin: 0 });
    s.addText("Full-featured tee sheet + booking engine + member platform. Included.", { x: 0.55, y: 0.85, w: 10, h: 0.35, fontSize: 12, color: C.lightSage, margin: 0 });

    const features = [
      { icon: FaCalendarAlt, title: "Tee Sheet & Booking",       desc: "Real-time online booking with drag-and-drop tee sheet" },
      { icon: FaQrcode,       title: "QR Code Check-In",          desc: "Mobile check-in for members and walk-ins at the course" },
      { icon: FaUsers,        title: "Member Management",          desc: "Full member profiles, booking history, and tier tracking" },
      { icon: FaChartBar,     title: "5 Built-In Reports",         desc: "Revenue, rounds, members, waitlist, and barter cost" },
      { icon: FaCalculator,   title: "Barter Cost Calculator",     desc: "Monthly PDF showing exactly what GolfNow would cost" },
      { icon: FaBell,         title: "In-Round Service Requests",  desc: "Golfers notify the pro shop from anywhere on the course" },
      { icon: FaShieldAlt,    title: "Role-Based Staff Access",    desc: "Owner, manager, and staff roles with custom permissions" },
      { icon: FaCreditCard,   title: "Stripe Payments Built-In",   desc: "Direct payouts to your bank — no middleman" },
      { icon: FaBolt,         title: "48-Hour Onboarding",         desc: "White-glove setup by our team — you're live in two days" },
    ];

    // White icons for dark-circle contrast
    const iconsData = await Promise.all(features.map(f => iconBase64(f.icon, "#FFFFFF", 256)));

    const cols = 3, rows = 3;
    const cardW = 3.95, cardH = 1.65;
    const startX = 0.38, startY = 1.52, gapX = 0.17, gapY = 0.22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const x = startX + c * (cardW + gapX);
        const y = startY + r * (cardH + gapY);
        const feat = features[idx];

        s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.cardBorder, width: 1 }, shadow: mkShadow() });
        // Left accent bar
        s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h: cardH, fill: { color: C.sage }, line: { color: C.sage } });
        // Icon circle — deep green with white icon
        s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.5, w: 0.62, h: 0.62, fill: { color: C.deepGreen }, line: { color: C.deepGreen } });
        s.addImage({ data: iconsData[idx], x: x + 0.31, y: y + 0.61, w: 0.4, h: 0.4 });
        // Title
        s.addText(feat.title, { x: x + 0.95, y: y + 0.1, w: cardW - 1.08, h: 0.52, fontSize: 11.5, bold: true, color: C.deepGreen, valign: "middle", margin: 0 });
        // Desc
        s.addText(feat.desc,  { x: x + 0.95, y: y + 0.62, w: cardW - 1.08, h: 0.88, fontSize: 10, color: C.midText, margin: 0 });
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // SLIDE 5 — GOLFER MEMBERSHIP TIERS
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };

    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.1, fill: { color: C.deepGreen }, line: { color: C.deepGreen } });
    s.addText("Golfer Memberships Fund the Platform", { x: 0.55, y: 0.2, w: 12.2, h: 0.68, fontSize: 30, bold: true, fontFace: "Georgia", color: C.deepGreen, margin: 0 });
    s.addText("Golfers pay TeeAhead for their membership. You pay nothing for the software — and earn their loyalty.", { x: 0.55, y: 0.9, w: 12.2, h: 0.42, fontSize: 13, color: C.midText, margin: 0 });

    // 3 tier cards
    const tiers = [
      {
        name: "FAIRWAY", topColor: "7A9E8E", price: "FREE",  priceColor: C.midText,
        sub: "Always free to join",
        benefits: [
          "Browse all partner courses",
          "Book tee times online 24/7",
          "Earn Fairway Points every round",
          "Digital member card",
          "3.5% booking fee applies",
          "Self-service account portal",
        ]
      },
      {
        name: "EAGLE",   topColor: C.forest,  price: "$89/yr", priceColor: C.forest,
        sub: "Most popular",
        benefits: [
          "$0 booking fees — always",
          "1.5x Fairway Points on every round",
          "1 complimentary round per year",
          "1 guest pass per year",
          "48-hr priority booking window",
          "10% birthday credit",
        ]
      },
      {
        name: "ACE",     topColor: C.gold,    price: "$159/yr", priceColor: C.gold,
        sub: "The full experience",
        benefits: [
          "$0 booking fees — always",
          "2x Fairway Points on every round",
          "2 complimentary rounds per year",
          "2 guest passes per year",
          "72-hr priority booking window",
          "15% birthday credit",
        ]
      }
    ];

    const cardW2 = 4.02, startX2 = 0.48, gap2 = 0.14;
    // Card spans from y=1.5 to y=7.1 (h=5.6)
    const cardY = 1.5, cardH2 = 5.6;

    tiers.forEach((t, i) => {
      const x = startX2 + i * (cardW2 + gap2);

      // Card background
      s.addShape(pres.shapes.RECTANGLE, { x, y: cardY, w: cardW2, h: cardH2, fill: { color: C.white }, line: { color: C.cardBorder, width: 1 }, shadow: mkShadowM() });

      // Top band (name only — h:0.62)
      s.addShape(pres.shapes.RECTANGLE, { x, y: cardY, w: cardW2, h: 0.62, fill: { color: t.topColor }, line: { color: t.topColor } });
      s.addText(t.name, { x: x + 0.1, y: cardY + 0.08, w: cardW2 - 0.2, h: 0.46, fontSize: 15, bold: true, color: C.white, charSpacing: 4, align: "center", valign: "middle", margin: 0 });

      // Price — below top band, on white background
      s.addText(t.price, { x: x + 0.1, y: cardY + 0.72, w: cardW2 - 0.2, h: 1.0, fontSize: i === 0 ? 30 : 38, bold: true, fontFace: "Georgia", color: t.priceColor, align: "center", margin: 0 });
      s.addText(t.sub, { x: x + 0.1, y: cardY + 1.75, w: cardW2 - 0.2, h: 0.32, fontSize: 10, color: C.lightText, align: "center", italic: true, margin: 0 });

      // Divider
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: cardY + 2.18, w: cardW2 - 0.5, h: 0.04, fill: { color: C.cardBorder }, line: { color: C.cardBorder } });

      // Benefits list
      t.benefits.forEach((b, bi) => {
        const by = cardY + 2.35 + bi * 0.52;
        s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: by + 0.09, w: 0.24, h: 0.24, fill: { color: t.topColor }, line: { color: t.topColor } });
        s.addText("✓", { x: x + 0.25, y: by + 0.09, w: 0.24, h: 0.24, fontSize: 7, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
        s.addText(b, { x: x + 0.6, y: by, w: cardW2 - 0.73, h: 0.42, fontSize: 11, color: C.darkText, valign: "middle", margin: 0 });
      });
    });

    // Footer note
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.38, w: W, h: 0.38, fill: { color: C.deepGreen }, line: { color: C.deepGreen } });
    s.addText("TeeAhead keeps the membership fee  ·  Complimentary rounds are funded by the course  ·  You gain loyalty without losing cash", {
      x: 0.5, y: H - 0.36, w: W - 1, h: 0.32, fontSize: 10, bold: true, color: C.lightSage, align: "center", valign: "middle", margin: 0
    });
  }

  // ══════════════════════════════════════════════════════════
  // SLIDE 6 — REAL RESULTS
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.deepGreen };

    s.addText("Courses That Made the Switch", { x: 0.6, y: 0.3, w: 12.1, h: 0.72, fontSize: 34, bold: true, fontFace: "Georgia", color: C.white, margin: 0 });
    s.addText("What happens when courses stop giving away inventory — and start building real golfer loyalty.", { x: 0.6, y: 1.04, w: 12.1, h: 0.42, fontSize: 13, color: C.lightSage, margin: 0 });

    // Windsor Parke hero card
    const hw = 5.6, hx = 0.55;
    s.addShape(pres.shapes.RECTANGLE, { x: hx, y: 1.62, w: hw, h: 5.3, fill: { color: C.forest }, line: { color: C.sage, width: 1 }, shadow: mkShadowM() });
    s.addShape(pres.shapes.RECTANGLE, { x: hx, y: 1.62, w: hw, h: 0.08, fill: { color: C.gold }, line: { color: C.gold } });
    s.addText("WINDSOR PARKE G.C.", { x: hx + 0.2, y: 1.82, w: hw - 0.4, h: 0.38, fontSize: 11, bold: true, color: C.gold, charSpacing: 2, margin: 0 });
    s.addText("382%", { x: hx + 0.15, y: 2.25, w: hw - 0.3, h: 1.6, fontSize: 96, bold: true, fontFace: "Georgia", color: C.white, align: "center", margin: 0 });
    s.addText("online revenue lift", { x: hx + 0.15, y: 3.88, w: hw - 0.3, h: 0.42, fontSize: 15, italic: true, color: C.lightSage, align: "center", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: hx + 0.8, y: 4.43, w: hw - 1.6, h: 0.05, fill: { color: C.sage, transparency: 40 }, line: { color: C.sage } });
    s.addText("$81,000  →  $393,000\nonline revenue in one year", { x: hx + 0.2, y: 4.55, w: hw - 0.4, h: 0.78, fontSize: 15, bold: true, color: C.white, align: "center", margin: 0 });
    s.addText("After switching from GolfNow barter to\ndirect online booking.", { x: hx + 0.2, y: 5.4, w: hw - 0.4, h: 0.7, fontSize: 11, italic: true, color: C.lightSage, align: "center", margin: 0 });
    s.addText("Actual results. No barter rounds. Full-price bookings only.", { x: hx + 0.2, y: 6.2, w: hw - 0.4, h: 0.42, fontSize: 10, color: C.gold, align: "center", margin: 0 });

    // Right side cards
    const rx = 6.7, rw = 6.05;

    // Missouri Bluffs
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.62, w: rw, h: 2.45, fill: { color: C.forest }, line: { color: C.sage, width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.62, w: rw, h: 0.07, fill: { color: C.sage }, line: { color: C.sage } });
    s.addText("MISSOURI BLUFFS G.C.", { x: rx + 0.2, y: 1.81, w: rw - 0.4, h: 0.36, fontSize: 10, bold: true, color: C.lightSage, charSpacing: 2, margin: 0 });

    const mbStats = [["36.3%", "green fee increase"], ["44.7%", "online revenue increase"]];
    mbStats.forEach(([num, lbl], i) => {
      const sx = rx + 0.2 + i * (rw / 2 - 0.1);
      s.addText(num, { x: sx, y: 2.22, w: rw / 2 - 0.1, h: 0.9, fontSize: 44, bold: true, fontFace: "Georgia", color: C.white, align: "center", margin: 0 });
      s.addText(lbl, { x: sx, y: 3.12, w: rw / 2 - 0.1, h: 0.38, fontSize: 11, color: C.lightSage, align: "center", italic: true, margin: 0 });
    });

    // Structural advantage
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 4.27, w: rw, h: 2.65, fill: { color: "0D2B1F" }, line: { color: C.gold, width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 4.27, w: rw, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });
    s.addText("WHY GOLFNOW CAN'T MATCH THIS", { x: rx + 0.22, y: 4.42, w: rw - 0.44, h: 0.36, fontSize: 10, bold: true, color: C.gold, charSpacing: 2, margin: 0 });
    s.addText([
      { text: "GolfNow cannot go free", options: { bold: true, color: C.white } },
      { text: " — abandoning barter destroys their revenue model. Lightspeed and foreUP ", options: { color: C.lightSage } },
      { text: "cannot add consumer loyalty", options: { bold: true, color: C.white } },
      { text: " without a company-level pivot. This is a ", options: { color: C.lightSage } },
      { text: "structural moat", options: { bold: true, color: C.gold } },
      { text: " — not just a feature advantage.", options: { color: C.lightSage } },
    ], { x: rx + 0.22, y: 4.85, w: rw - 0.44, h: 1.9, fontSize: 12.5, margin: 0 });
  }

  // ══════════════════════════════════════════════════════════
  // SLIDE 7 — FOUNDING PARTNER OFFER
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };

    // Left panel — deep green
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 5.7, h: H, fill: { color: C.deepGreen }, line: { color: C.deepGreen } });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.7, y: 0, w: 0.08, h: H, fill: { color: C.gold }, line: { color: C.gold } });

    s.addText("FOUNDING\nPARTNER\nOFFER", { x: 0.45, y: 0.55, w: 4.85, h: 2.1, fontSize: 42, bold: true, fontFace: "Georgia", color: C.white, charSpacing: 1, align: "center", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.75, w: 4.6, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });

    // FREE box
    s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y: 3.0, w: 4.85, h: 1.75, fill: { color: C.forest }, line: { color: C.sage, width: 1 } });
    s.addText("FREE",                   { x: 0.45, y: 3.08, w: 4.85, h: 0.98, fontSize: 76, bold: true, fontFace: "Georgia", color: C.gold, align: "center", margin: 0 });
    s.addText("for your first 12 months", { x: 0.45, y: 4.05, w: 4.85, h: 0.52, fontSize: 14, italic: true, color: C.lightSage, align: "center", margin: 0 });

    s.addText("Then $349/mo (standard rate)", { x: 0.45, y: 4.88, w: 4.85, h: 0.38, fontSize: 11.5, color: C.lightSage, align: "center", margin: 0 });
    s.addText("Only 10 founding partner spots available.", { x: 0.45, y: 5.35, w: 4.85, h: 0.38, fontSize: 12, bold: true, color: C.gold, align: "center", margin: 0 });

    // CTA button on left panel
    s.addShape(pres.shapes.RECTANGLE, { x: 1.0, y: 5.88, w: 3.75, h: 0.65, fill: { color: C.gold }, line: { color: C.gold }, shadow: mkShadow() });
    s.addText("Apply at teeahead.com",   { x: 1.0, y: 5.88, w: 3.75, h: 0.65, fontSize: 14, bold: true, color: C.deepGreen, align: "center", valign: "middle", margin: 0 });

    // Right side
    const rx = 6.0, rw = 6.8;
    s.addText("Why Courses Say Yes", { x: rx, y: 0.3, w: rw, h: 0.68, fontSize: 28, bold: true, fontFace: "Georgia", color: C.deepGreen, margin: 0 });
    s.addText("We removed every reason to hesitate.", { x: rx, y: 1.0, w: rw, h: 0.38, fontSize: 13, color: C.midText, italic: true, margin: 0 });

    const guarantees = [
      { title: "48-Hour White-Glove Setup",    body: "Our team handles everything. You're live and taking bookings in two business days." },
      { title: "30-Day Cancel Clause",         body: "Not satisfied after 30 days? Cancel with zero penalties — no questions asked." },
      { title: "No Long-Term Contract",        body: "Month-to-month. You stay because TeeAhead works, not because a contract says so." },
      { title: "Zero Revenue Extraction",      body: "No barter, no commissions, no booking fees. What you earn, you keep entirely." },
    ];

    guarantees.forEach((g, i) => {
      const gy = 1.55 + i * 1.38;
      s.addShape(pres.shapes.RECTANGLE, { x: rx, y: gy, w: rw, h: 1.25, fill: { color: C.white }, line: { color: C.cardBorder, width: 1 }, shadow: mkShadow() });
      s.addShape(pres.shapes.RECTANGLE, { x: rx, y: gy, w: 0.09, h: 1.25, fill: { color: C.gold }, line: { color: C.gold } });
      s.addText(g.title, { x: rx + 0.25, y: gy + 0.1,  w: rw - 0.4, h: 0.42, fontSize: 13, bold: true, color: C.deepGreen, margin: 0 });
      s.addText(g.body,  { x: rx + 0.25, y: gy + 0.54, w: rw - 0.4, h: 0.62, fontSize: 11, color: C.midText, margin: 0 });
    });
  }

  // ══════════════════════════════════════════════════════════
  // SLIDE 8 — CLOSING CTA
  // ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.deepGreen };

    // Decorative circles — pushed further out so they don't crowd text
    s.addShape(pres.shapes.OVAL, { x: -1.5, y: -1.5, w: 4.5, h: 4.5, fill: { color: C.forest }, line: { color: C.forest } });
    s.addShape(pres.shapes.OVAL, { x: 11.0,  y: 5.0,  w: 3.5, h: 3.5, fill: { color: C.forest }, line: { color: C.forest } });

    // Gold rule
    s.addShape(pres.shapes.RECTANGLE, { x: 2.2, y: 2.72, w: 8.9, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });

    // Main message
    s.addText("Ready to stop funding GolfNow\nand start building real loyalty?", {
      x: 1.5, y: 0.85, w: 10.3, h: 1.9, fontSize: 36, bold: true, fontFace: "Georgia",
      color: C.white, align: "center", margin: 0
    });

    // Sub-message
    s.addText("Apply for a Founding Partner spot today.", { x: 1.5, y: 2.9, w: 10.3, h: 0.58, fontSize: 18, italic: true, color: C.lightSage, align: "center", margin: 0 });

    // CTA button — white text on gold for maximum contrast
    s.addShape(pres.shapes.RECTANGLE, { x: 4.65, y: 3.7, w: 4.0, h: 0.78, fill: { color: C.gold }, line: { color: C.gold }, shadow: mkShadowM() });
    s.addText("teeahead.com", { x: 4.65, y: 3.7, w: 4.0, h: 0.78, fontSize: 22, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });

    // 3 quick stats — properly centered
    const closingStats = [["$0", "barter, ever"], ["48 hrs", "to go live"], ["30-day", "cancel clause"]];
    const statTotalW = 3 * 2.6 + 2 * 0.5;
    const statStartX = (W - statTotalW) / 2;
    closingStats.forEach((cs, i) => {
      const sx = statStartX + i * 3.1;
      s.addText(cs[0], { x: sx, y: 4.8,  w: 2.6, h: 0.82, fontSize: 40, bold: true, fontFace: "Georgia", color: C.gold,      align: "center", margin: 0 });
      s.addText(cs[1], { x: sx, y: 5.6,  w: 2.6, h: 0.36, fontSize: 13, color: C.lightSage, align: "center", margin: 0 });
    });

    // Separator dots
    s.addShape(pres.shapes.OVAL, { x: 5.72, y: 5.12, w: 0.12, h: 0.12, fill: { color: C.sage }, line: { color: C.sage } });
    s.addShape(pres.shapes.OVAL, { x: 8.82, y: 5.12, w: 0.12, h: 0.12, fill: { color: C.sage }, line: { color: C.sage } });

    // Bottom bar
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.6, w: W, h: 0.6, fill: { color: "0D2B1F" }, line: { color: "0D2B1F" } });
    s.addText("TEEAHEAD  ·  Free for golf courses. Funded by golfers.  ·  teeahead.com", {
      x: 0.5, y: H - 0.56, w: W - 1, h: 0.5, fontSize: 11, color: C.lightSage, align: "center", valign: "middle", charSpacing: 1, margin: 0
    });
  }

  // ── Write ────────────────────────────────────────────────
  await pres.writeFile({ fileName: "TeeAhead_Course_Marketing_Deck.pptx" });
  console.log("TeeAhead_Course_Marketing_Deck.pptx written");
}

build().catch(err => { console.error(err); process.exit(1); });
