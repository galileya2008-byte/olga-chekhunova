const CONTENT_KEY = "olga-chekhunova-content";

const defaultContent = {
  services: [
    {
      id: "service-individual",
      title: "Индивидуальная консультация",
      description:
        "Бережное пространство, где можно исследовать привычные сценарии, чувства и отношение к себе.",
      price: "Стоимость уточняйте",
      format: "Онлайн",
    },
  ],
  articles: [],
  credentials: [
    {
      id: "cred-placeholder-1",
      title: "Диплом об образовании",
      issuer: "Документ будет загружен",
      year: "",
      image: "",
    },
    {
      id: "cred-placeholder-2",
      title: "Сертификат / повышение квалификации",
      issuer: "Документ будет загружен",
      year: "",
      image: "",
    },
  ],
};

function getContent() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTENT_KEY));
    if (!saved || !Array.isArray(saved.services) || !Array.isArray(saved.articles)) {
      return structuredClone(defaultContent);
    }
    return {
      services: saved.services,
      articles: saved.articles,
      credentials: Array.isArray(saved.credentials)
        ? saved.credentials
        : structuredClone(defaultContent.credentials),
    };
  } catch {
    return structuredClone(defaultContent);
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderServices(services) {
  const list = document.querySelector("#service-list");
  if (!list) return;

  if (!services.length) {
    list.innerHTML = '<p class="empty-state">Информация об услугах скоро появится.</p>';
    return;
  }

  list.innerHTML = services
    .map(
      (service, index) => `
        <article class="service-card reveal">
          <div class="service-top">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <span>${escapeHtml(service.format)}</span>
          </div>
          <h3>${escapeHtml(service.title)}</h3>
          <p>${escapeHtml(service.description)}</p>
          <div class="service-top">
            <span>${escapeHtml(service.price)}</span>
            <a class="text-link" href="https://t.me/olgacheh" target="_blank" rel="noopener">Записаться <span>↗</span></a>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderArticles(articles) {
  const list = document.querySelector("#article-list");
  if (!list) return;

  if (!articles.length) {
    list.innerHTML = '<p class="empty-state">Здесь скоро появятся статьи Ольги.</p>';
    return;
  }

  list.innerHTML = articles
    .map(
      (article) => `
        <article class="article-card reveal">
          <span class="article-meta">${escapeHtml(article.category || "Психология")}</span>
          <h3>${escapeHtml(article.title)}</h3>
          <p>${escapeHtml(article.excerpt)}</p>
          ${
            article.link
              ? `<a class="text-link" href="${escapeHtml(article.link)}" target="_blank" rel="noopener">Читать <span>↗</span></a>`
              : ""
          }
        </article>
      `,
    )
    .join("");
}

function renderCredentials(credentials) {
  const list = document.querySelector("#credential-list");
  if (!list) return;

  if (!credentials.length) {
    list.innerHTML =
      '<p class="empty-state">Дипломы и сертификаты появятся здесь после загрузки.</p>';
    return;
  }

  list.innerHTML = credentials
    .map((item, index) => {
      const meta = [item.issuer, item.year].filter(Boolean).join(" · ");
      const media = item.image
        ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">`
        : `<div class="credential-placeholder">${String(index + 1).padStart(2, "0")}</div>`;

      return `
        <article class="credential-card reveal">
          <button type="button" data-credential-id="${escapeHtml(item.id)}" aria-label="Открыть: ${escapeHtml(item.title)}">
            <div class="credential-frame">${media}</div>
            <div class="credential-body">
              <p class="eyebrow">Документ</p>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(meta || "Основание для оказания услуг")}</p>
            </div>
          </button>
        </article>
      `;
    })
    .join("");
}

function setupCredentialLightbox(credentials) {
  const list = document.querySelector("#credential-list");
  const lightbox = document.querySelector("#credential-lightbox");
  if (!list || !lightbox) return;

  const image = document.querySelector("#lightbox-image");
  const title = document.querySelector("#lightbox-title");
  const meta = document.querySelector("#lightbox-meta");
  const closeBtn = document.querySelector("#lightbox-close");

  const close = () => {
    if (lightbox.open) lightbox.close();
  };

  const open = (item) => {
    title.textContent = item.title;
    meta.textContent =
      [item.issuer, item.year].filter(Boolean).join(" · ") ||
      "Документ, подтверждающий подготовку для оказания услуг";
    if (item.image) {
      image.hidden = false;
      image.src = item.image;
      image.alt = item.title;
    } else {
      image.hidden = true;
      image.removeAttribute("src");
    }
    if (!lightbox.open) lightbox.showModal();
  };

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-credential-id]");
    if (!button) return;
    const item = credentials.find((entry) => entry.id === button.dataset.credentialId);
    if (item) open(item);
  });

  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
}

function setupReveals() {
  const revealElements = document.querySelectorAll(".reveal:not(.visible)");
  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealElements.forEach((element) => observer.observe(element));
}

function setupMenu() {
  const button = document.querySelector(".menu-button");
  const nav = document.querySelector(".main-nav");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      document.body.classList.remove("menu-open");
      button.setAttribute("aria-expanded", "false");
    }
  });
}

function setupScrollDetails() {
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress span");
  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle("scrolled", scrollTop > 36);
    if (progress) {
      progress.style.width = `${scrollRange > 0 ? (scrollTop / scrollRange) * 100 : 0}%`;
    }
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );
  update();
}

function setupCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
    document.body.classList.add("cursor-visible");
  });

  const follow = () => {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(follow);
  };
  follow();

  document.addEventListener("mouseover", (event) => {
    document.body.classList.toggle(
      "cursor-hover",
      Boolean(
        event.target.closest(
          "a, button, .service-card, .principle, .article-card, .preview-card, .credential-card",
        ),
      ),
    );
  });

  document.documentElement.addEventListener("mouseleave", () => {
    document.body.classList.remove("cursor-visible");
  });
}

function setupCardStagger() {
  document
    .querySelectorAll(".service-grid, .article-grid, .credential-grid, .preview-grid")
    .forEach((grid) => {
      grid.querySelectorAll(".reveal").forEach((card, index) => {
        card.style.transitionDelay = `${Math.min(index * 90, 360)}ms`;
      });
    });
}

const content = getContent();
renderServices(content.services);
renderArticles(content.articles);
renderCredentials(content.credentials);
setupCredentialLightbox(content.credentials);
setupMenu();
setupScrollDetails();
setupCursor();
setupCardStagger();
setupReveals();

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
