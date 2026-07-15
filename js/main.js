/* Hampshire Hotel — shared interactions */
(function () {
  "use strict";

  var bookingUrl = "https://hampshirehotel.co.za/bookings/#/hotel/90";

  if (document.body && document.body.hasAttribute("data-booknow-redirect")) {
    window.location.replace(bookingUrl);
    return;
  }

  /* ---- Mobile nav ---- */
    var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () { header.classList.remove("nav-open"); });
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Booking widget ---- */
  var bookBtn = document.getElementById("checkAvailability");
  if (bookBtn) {
    var inEl = document.getElementById("checkIn");
    var outEl = document.getElementById("checkOut");
    var today = new Date().toISOString().split("T")[0];
    if (inEl) inEl.min = today;
    if (outEl) outEl.min = today;
    if (inEl) inEl.addEventListener("change", function () {
      if (outEl) outEl.min = inEl.value || today;
    });
    bookBtn.addEventListener("click", function () {
      window.location.assign(bookingUrl);
      return;

      var note = document.getElementById("bookingNote");
      if (!note) return;
      var ci = inEl && inEl.value, co = outEl && outEl.value;
      if (!ci || !co) {
        note.innerHTML = "Please choose your <b>check-in</b> and <b>check-out</b> dates.";
      } else if (co <= ci) {
        note.innerHTML = "Your <b>check-out</b> date must be after check-in.";
      } else {
        var g = document.getElementById("guests");
        var fmt = function (d) { return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }); };
        note.innerHTML = "Searching availability for <b>" + fmt(ci) + " – " + fmt(co) +
          "</b> · " + (g ? g.value : "1") + " guest(s). A reservations consultant will confirm your rate shortly.";
      }
      note.classList.add("show");
    });
  }

  /* ---- Contact / enquiry form ---- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var status = document.getElementById("formStatus");
      var name = (document.getElementById("fName") || {}).value || "there";
      if (status) {
        status.innerHTML = "Thank you, <b>" + name.split(" ")[0] +
          "</b> — your enquiry has been received. Our reservations team will be in touch within one business day.";
        status.classList.add("show");
      }
      form.reset();
    });
  }

  /* ---- Hero image slider ---- */
  var heroSlider = document.querySelector(".hero-slider");
  if (heroSlider) {
    var slides = heroSlider.querySelectorAll(".hero-slide");
    var dots = heroSlider.querySelectorAll(".hero-slider__dot");
    var label = document.getElementById("slideLabel");
    var slideLabels = ["Front", "Pool-side", "Side view"];
    var current = 0;
    var slideInterval;
    function showSlide(idx) {
      slides.forEach(function (s, i) { s.classList.toggle("active", i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === idx); });
      if (label) label.textContent = slideLabels[idx] || "";
      current = idx;
    }
    function nextSlide() { showSlide((current + 1) % slides.length); }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { showSlide(i); resetTimer(); });
    });
    function resetTimer() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 5000); }
    if (slides.length > 1) slideInterval = setInterval(nextSlide, 5000);
  }

  /* ---- Reviews carousel (infinite loop) ---- */
  var carousel = document.querySelector(".reviews-carousel");
  if (carousel) {
    var track = carousel.querySelector(".reviews-carousel__track");
    var prevBtn = carousel.querySelector(".reviews-carousel__btn--prev");
    var nextBtn = carousel.querySelector(".reviews-carousel__btn--next");
    if (track) {
      var cIndex = 0;
      var cCards = track.children;
      var autoTimer;
      function getVisible() { return window.innerWidth <= 620 ? 1 : window.innerWidth <= 980 ? 2 : 3; }
      function getMaxIndex() { return Math.max(0, cCards.length - getVisible()); }
      function updateCarousel() {
        var cardWidth = cCards.length ? cCards[0].offsetWidth + 24 : 0;
        track.style.transform = "translateX(-" + (cIndex * cardWidth) + "px)";
        if (prevBtn) prevBtn.style.opacity = cIndex === 0 ? "0.35" : "1";
        if (nextBtn) nextBtn.style.opacity = cIndex >= getMaxIndex() ? "0.35" : "1";
      }
      function goNext() {
        var maxIdx = getMaxIndex();
        if (cIndex >= maxIdx) { cIndex = 0; } else { cIndex++; }
        updateCarousel();
      }
      function goPrev() {
        var maxIdx = getMaxIndex();
        if (cIndex <= 0) { cIndex = maxIdx; } else { cIndex--; }
        updateCarousel();
      }
      function startAuto() { autoTimer = setInterval(goNext, 4000); }
      function resetAuto() { clearInterval(autoTimer); startAuto(); }
      if (prevBtn) prevBtn.addEventListener("click", function () { goPrev(); resetAuto(); });
      if (nextBtn) nextBtn.addEventListener("click", function () { goNext(); resetAuto(); });
      window.addEventListener("resize", updateCarousel);
      updateCarousel();
      startAuto();
    }
  }

  /* ---- Mobile dropdown toggle ---- */
  if (toggle && header) {
    header.querySelectorAll(".nav-dropdown__toggle").forEach(function (t) {
      t.addEventListener("click", function (e) {
        if (window.innerWidth <= 760) {
          e.preventDefault();
          t.closest(".nav-dropdown").classList.toggle("open");
        }
      });
    });
  }

  /* ---- Footer year ---- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();


/* reviews */ 
document.addEventListener("DOMContentLoaded", () => {
  // 1. The top 8 curated reviews array
  const premiumReviews = [
    { text: "A truly elevated hotel experience from start to finish. The rooms were immaculate and the team made us feel completely at home.", author: "Michael H." },
    { text: "The pool area at sunset is absolutely magical. Best value hotel in Ballito — we'll definitely be returning!", author: "Sarah K." },
    { text: "Friendly staff, spotless rooms and the breakfast was delicious. Perfect location close to the beach and shops.", author: "James M." },
    { text: "Exceptional conference hosting capabilities. The state-of-the-art facilities and coordination made our corporate retreat smooth.", author: "David L." },
    { text: "Beautifully styled common areas, super fast Wi-Fi, and amazing hospitality. Truly a gem on the Dolphin Coast.", author: "Elena R." },
    { text: "The ocean breeze from the balcony is unmatched. Clean rooms, incredibly comfortable beds, and world-class service.", author: "Nico M." },
    { text: "Perfect balance of luxury and coastal relaxation. The dinner options were fantastic, and the staff went above and beyond.", author: "Thando N." },
    { text: "Stunning venue! We utilized both the facilities and accommodation options for our team meeting. Will book again.", author: "Prisha S." }
  ];

  const track = document.getElementById("reviewsTrack");
  if (!track) return;

  // 2. Function to generate a standardized card string
  const createCardHTML = (review) => `
    <div class="review-card">
      <p>"${review.text}"</p>
      <cite><b>${review.author}</b> Verified guest</cite>
    </div>
  `;

  // 3. Render the original 8 items
  const originalHTML = premiumReviews.map(createCardHTML).join('');
  
  // 4. Inject the original set PLUS a duplicated set to create the infinite seamless bridge
  track.innerHTML = originalHTML + originalHTML;
});
