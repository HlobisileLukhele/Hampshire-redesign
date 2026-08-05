/* Hampshire Hotel — shared interactions */
(function () {
  "use strict";

  var bookingUrl = "booknow.html";

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
    var guestToggle = document.getElementById("guestToggle");
    var guestPicker = document.getElementById("guestPicker");
    var guestSummary = document.getElementById("guestSummary");
    var adultCount = document.getElementById("adultCount");
    var childCount = document.getElementById("childCount");
    var childAges = document.getElementById("childAges");
    var childAgeFields = document.getElementById("childAgeFields");
    var adults = 0;
    var children = 0;
    var today = (function () {
      var now = new Date();
      var localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      return localNow.toISOString().split("T")[0];
    })();

    function setBookingNote(message) {
      var note = document.getElementById("bookingNote");
      if (!note) return;
      note.textContent = message;
      note.classList.add("show");
    }

    function updateGuestPicker() {
      var totalGuests = adults + children;
      if (adultCount) adultCount.textContent = adults;
      if (childCount) childCount.textContent = children;
      if (guestSummary) guestSummary.textContent = totalGuests + (totalGuests === 1 ? " Guest" : " Guests");

      document.querySelectorAll('[data-guest-type="adults"][data-guest-change="-1"]').forEach(function (button) {
        button.disabled = adults <= 0;
      });
      document.querySelectorAll('[data-guest-type="children"][data-guest-change="-1"]').forEach(function (button) {
        button.disabled = children <= 0;
      });
    }

    function renderChildAgeFields() {
      if (!childAges || !childAgeFields) return;

      var selectedAges = Array.prototype.map.call(childAgeFields.querySelectorAll("select"), function (select) {
        return select.value;
      });
      childAgeFields.innerHTML = "";
      childAges.hidden = children === 0;

      for (var index = 0; index < children; index += 1) {
        var field = document.createElement("div");
        field.className = "booking-child-age-field";

        var label = document.createElement("label");
        var selectId = "childAge" + (index + 1);
        label.htmlFor = selectId;
        label.textContent = "Child " + (index + 1) + " age";

        var select = document.createElement("select");
        select.id = selectId;
        select.name = selectId;
        select.setAttribute("aria-label", "Age for child " + (index + 1));

        var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select age";
        placeholder.disabled = true;
        placeholder.selected = !selectedAges[index];
        select.appendChild(placeholder);

        for (var age = 0; age <= 17; age += 1) {
          var option = document.createElement("option");
          option.value = age;
          option.textContent = age === 0 ? "Under 1" : age + (age === 1 ? " year" : " years");
          option.selected = selectedAges[index] === String(age);
          select.appendChild(option);
        }

        field.appendChild(label);
        field.appendChild(select);
        childAgeFields.appendChild(field);
      }
    }

    function closeGuestPicker() {
      if (!guestPicker || !guestToggle) return;
      guestPicker.hidden = true;
      guestToggle.setAttribute("aria-expanded", "false");
    }

    if (guestToggle && guestPicker) {
      guestToggle.addEventListener("click", function () {
        var willOpen = guestPicker.hidden;
        guestPicker.hidden = !willOpen;
        guestToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });

      document.addEventListener("click", function (event) {
        if (!guestPicker.hidden && !guestPicker.contains(event.target) && !guestToggle.contains(event.target)) {
          closeGuestPicker();
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeGuestPicker();
      });
    }

    document.querySelectorAll(".booking-stepper__button").forEach(function (button) {
      button.addEventListener("click", function () {
        var guestType = button.getAttribute("data-guest-type");
        var change = Number(button.getAttribute("data-guest-change"));

        if (guestType === "adults") {
          adults = Math.max(0, adults + change);
        } else if (guestType === "children") {
          children = Math.max(0, children + change);
          renderChildAgeFields();
        }

        updateGuestPicker();
      });
    });

    updateGuestPicker();
    if (inEl) inEl.min = today;
    if (outEl) outEl.min = today;
    if (inEl) inEl.addEventListener("change", function () {
      if (outEl) outEl.min = inEl.value || today;
    });

    bookBtn.addEventListener("click", function () {
      var selectedCheckIn = inEl && inEl.value;
      var selectedCheckOut = outEl && outEl.value;
      var selectedChildAges = childAgeFields ? Array.prototype.map.call(childAgeFields.querySelectorAll("select"), function (select) {
        return select.value;
      }) : [];

      if (!selectedCheckIn || !selectedCheckOut) {
        setBookingNote("Please choose your check-in and check-out dates.");
        return;
      }
      if (selectedCheckOut <= selectedCheckIn) {
        setBookingNote("Your check-out date must be after check-in.");
        return;
      }
      if (adults < 1) {
        setBookingNote("Please add at least one adult.");
        return;
      }
      if (children > 0 && selectedChildAges.some(function (age) { return age === ""; })) {
        setBookingNote("Please select an age for each child.");
        return;
      }

      var htiSearch = {
        arrivalDate: selectedCheckIn,
        departDate: selectedCheckOut,
        adults: String(adults)
      };
      if (children > 0) htiSearch.children = JSON.stringify(selectedChildAges.map(Number));

      closeGuestPicker();
      window.location.assign(bookingUrl + "#/hotel/90/?" + new URLSearchParams(htiSearch).toString());
    });
  }

  /* ---- Contact / enquiry form ---- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var status = document.getElementById("formStatus");
      var submitButton = form.querySelector('button[type="submit"]');
      var formData = new FormData(form);
      var payload = Object.fromEntries(formData.entries());

      if (submitButton) {
        submitButton.disabled = true;
      }
      form.setAttribute("aria-busy", "true");

      if (status) {
        status.textContent = "Sending your enquiry…";
        status.classList.add("show");
      }

      try {
        var apiResponse = await fetch("/api/enquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var responseData = await apiResponse.json().catch(function () { return {}; });

        if (!apiResponse.ok) {
          throw new Error(responseData.message || "Unable to send your enquiry.");
        }

        if (status) {
          status.textContent = responseData.message;
        }
        form.reset();
      } catch (error) {
        if (status) {
          status.textContent = error.message || "Unable to send your enquiry. Please call reservations for assistance.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
        form.removeAttribute("aria-busy");
      }
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

  /* ---- Hero background video ---- */
  var heroVideos = document.querySelectorAll(".js-hero-video");
  if (heroVideos.length) {
    var youtubeApiUrl = "https://www.youtube.com/iframe_api";

    function videoUrl(videoId, isConferenceBackground) {
      var params = new URLSearchParams({
        autoplay: "1",
        mute: "1",
        loop: "1",
        playlist: videoId,
        controls: "0",
        playsinline: "1",
        rel: "0",
        enablejsapi: "1"
      });

      if (window.location.origin && window.location.origin !== "null") {
        params.set("origin", window.location.origin);
      }

      if (isConferenceBackground) {
        params.set("disablekb", "1");
        params.set("fs", "0");
        params.set("iv_load_policy", "3");
      }

      return "https://www.youtube.com/embed/" + encodeURIComponent(videoId) + "?" + params.toString();
    }

    function showVideoFallback(iframe) {
      var videoBackground = iframe.closest(".hero-video-bg");
      if (videoBackground) videoBackground.classList.add("is-video-unavailable");
    }

    function revealConferenceVideo(iframe) {
      var conferenceVideo = iframe.closest(".conference-hero__video");
      if (conferenceVideo) conferenceVideo.classList.add("is-video-playing");
    }

    function startPlayer(iframe) {
      var videoId = iframe.getAttribute("data-video-id");
      if (!videoId || !window.YT || !window.YT.Player) return;

      var isConferenceBackground = iframe.closest(".conference-hero__video") !== null;
      iframe.src = videoUrl(videoId, isConferenceBackground);

      var playerConfig = {
        events: {
          onReady: function (event) {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: function (event) {
            if (event.data === window.YT.PlayerState.PLAYING) {
              revealConferenceVideo(iframe);
            }

            // Keep a single-video playlist moving even if YouTube reports its end.
            if (event.data === window.YT.PlayerState.ENDED) {
              event.target.seekTo(0, true);
              event.target.playVideo();
            }
          },
          onError: function () { showVideoFallback(iframe); },
          onAutoplayBlocked: function () { showVideoFallback(iframe); }
        }
      };

      if (isConferenceBackground) {
        playerConfig.playerVars = {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          mute: 1,
          playlist: videoId,
          playsinline: 1,
          rel: 0
        };
      }

      new window.YT.Player(iframe, playerConfig);
    }

    function initialisePlayers() {
      heroVideos.forEach(startPlayer);
    }

    var previousYoutubeReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previousYoutubeReady === "function") previousYoutubeReady();
      initialisePlayers();
    };

    var youtubeApi = document.createElement("script");
    youtubeApi.src = youtubeApiUrl;
    youtubeApi.async = true;
    youtubeApi.onerror = function () { heroVideos.forEach(showVideoFallback); };
    document.head.appendChild(youtubeApi);
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
