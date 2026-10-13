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

const sectionSettings = {
  services: {
    title: "Услуги",
    addLabel: "Добавить услугу",
    newTitle: "Новая услуга",
    editTitle: "Редактирование услуги",
  },
  credentials: {
    title: "Документы",
    addLabel: "Добавить документ",
    newTitle: "Новый документ",
    editTitle: "Редактирование документа",
  },
  articles: {
    title: "Статьи",
    addLabel: "Добавить статью",
    newTitle: "Новая статья",
    editTitle: "Редактирование статьи",
  },
};

let state = loadContent();
let activeSection = "services";
let editingId = null;
let pendingImage = null;

const list = document.querySelector("#content-list");
const pageTitle = document.querySelector("#page-title");
const addButton = document.querySelector("#add-button");
const dialog = document.querySelector("#editor-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const form = document.querySelector("#editor-form");
const formFields = document.querySelector("#form-fields");
const toast = document.querySelector("#toast");

function loadContent() {
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

function saveContent() {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(state));
  showToast();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  const settings = sectionSettings[activeSection];
  const items = state[activeSection];
  pageTitle.textContent = settings.title;
  addButton.textContent = `＋ ${settings.addLabel}`;

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.section === activeSection);
  });

  if (!items.length) {
    list.innerHTML = `
      <div class="empty-admin">
        <strong>Здесь пока ничего нет</strong>
        Нажмите «${settings.addLabel}», чтобы создать первую запись.
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map((item, index) => {
      let detail = "";
      let description = "";

      if (activeSection === "services") {
        detail = `${escapeHtml(item.format)} · ${escapeHtml(item.price)}`;
        description = item.description;
      } else if (activeSection === "credentials") {
        detail = [item.issuer, item.year].filter(Boolean).map(escapeHtml).join(" · ") || "Без описания";
        description = item.image ? "Изображение загружено" : "Изображение ещё не загружено";
      } else {
        detail = escapeHtml(item.category || "Без категории");
        description = item.excerpt;
      }

      return `
        <article class="content-item">
          <span class="item-index">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(description)}</p>
          </div>
          <span class="item-detail">${detail}</span>
          <div class="item-actions">
            <button class="icon-button" type="button" data-action="edit" data-id="${item.id}" aria-label="Редактировать">✎</button>
            <button class="icon-button delete" type="button" data-action="delete" data-id="${item.id}" aria-label="Удалить">×</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function getServiceFields(item = {}) {
  return `
    <div class="field">
      <label for="title">Название</label>
      <input id="title" name="title" value="${escapeHtml(item.title)}" required maxlength="100">
    </div>
    <div class="field">
      <label for="description">Описание</label>
      <textarea id="description" name="description" required maxlength="500">${escapeHtml(item.description)}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="format">Формат</label>
        <input id="format" name="format" value="${escapeHtml(item.format || "Онлайн")}" required maxlength="50">
      </div>
      <div class="field">
        <label for="price">Стоимость</label>
        <input id="price" name="price" value="${escapeHtml(item.price)}" required maxlength="80">
      </div>
    </div>
  `;
}

function getArticleFields(item = {}) {
  return `
    <div class="field">
      <label for="title">Заголовок</label>
      <input id="title" name="title" value="${escapeHtml(item.title)}" required maxlength="120">
    </div>
    <div class="field">
      <label for="excerpt">Краткое описание</label>
      <textarea id="excerpt" name="excerpt" required maxlength="400">${escapeHtml(item.excerpt)}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="category">Категория</label>
        <input id="category" name="category" value="${escapeHtml(item.category || "Психология")}" maxlength="50">
      </div>
      <div class="field">
        <label for="link">Ссылка на статью</label>
        <input id="link" name="link" type="url" value="${escapeHtml(item.link || "")}" placeholder="https://...">
      </div>
    </div>
  `;
}

function getCredentialFields(item = {}) {
  const hasImage = Boolean(item.image || pendingImage);
  return `
    <div class="field">
      <label for="title">Название документа</label>
      <input id="title" name="title" value="${escapeHtml(item.title)}" required maxlength="120" placeholder="Диплом, сертификат…">
    </div>
    <div class="field-row">
      <div class="field">
        <label for="issuer">Организация / программа</label>
        <input id="issuer" name="issuer" value="${escapeHtml(item.issuer || "")}" maxlength="120">
      </div>
      <div class="field">
        <label for="year">Год</label>
        <input id="year" name="year" value="${escapeHtml(item.year || "")}" maxlength="20" placeholder="2024">
      </div>
    </div>
    <div class="field">
      <label for="image-file">Файл диплома / сертификата</label>
      <input id="image-file" type="file" accept="image/*,.pdf">
      <small class="field-hint">${hasImage ? "Файл уже есть — можно заменить новым." : "Загрузите изображение (JPG, PNG, WebP). PDF лучше сохранить как изображение."}</small>
      <input type="hidden" name="image" id="image-data" value="">
    </div>
  `;
}

function openEditor(id = null) {
  editingId = id;
  pendingImage = null;
  const item = id ? state[activeSection].find((entry) => entry.id === id) : {};
  const settings = sectionSettings[activeSection];
  dialogTitle.textContent = id ? settings.editTitle : settings.newTitle;

  if (activeSection === "services") formFields.innerHTML = getServiceFields(item);
  else if (activeSection === "credentials") formFields.innerHTML = getCredentialFields(item);
  else formFields.innerHTML = getArticleFields(item);

  if (activeSection === "credentials") {
    const fileInput = formFields.querySelector("#image-file");
    fileInput?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 4.5 * 1024 * 1024) {
        window.alert("Файл слишком большой. Пожалуйста, загрузите изображение до 4,5 МБ.");
        fileInput.value = "";
        return;
      }
      pendingImage = await readFileAsDataURL(file);
      const hint = formFields.querySelector(".field-hint");
      if (hint) hint.textContent = `Выбрано: ${file.name}`;
    });
  }

  dialog.showModal();
  requestAnimationFrame(() => form.querySelector("input")?.focus());
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function closeEditor() {
  dialog.close();
  form.reset();
  editingId = null;
  pendingImage = null;
}

function deleteItem(id) {
  const item = state[activeSection].find((entry) => entry.id === id);
  if (!item || !window.confirm(`Удалить «${item.title}»?`)) return;
  state[activeSection] = state[activeSection].filter((entry) => entry.id !== id);
  saveContent();
  render();
}

function showToast() {
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    activeSection = button.dataset.section;
    render();
  });
});

addButton.addEventListener("click", () => openEditor());

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") openEditor(button.dataset.id);
  if (button.dataset.action === "delete") deleteItem(button.dataset.id);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  delete values.image;

  let nextItem = { id: editingId || crypto.randomUUID(), ...values };

  if (activeSection === "credentials") {
    const existing = editingId
      ? state.credentials.find((entry) => entry.id === editingId)
      : null;
    nextItem = {
      ...nextItem,
      image: pendingImage || existing?.image || "",
    };
  }

  if (editingId) {
    state[activeSection] = state[activeSection].map((item) =>
      item.id === editingId ? nextItem : item,
    );
  } else {
    state[activeSection].push(nextItem);
  }

  saveContent();
  closeEditor();
  render();
});

document.querySelector("#close-dialog").addEventListener("click", closeEditor);
document.querySelector("#cancel-dialog").addEventListener("click", closeEditor);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeEditor();
});

render();
