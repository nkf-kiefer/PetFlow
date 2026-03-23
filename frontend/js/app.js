const API_BASE = (() => {
  if (window.PETFLOW_API_BASE) return String(window.PETFLOW_API_BASE).replace(/\/+$/, "");

  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocalHost && window.location.port && window.location.port !== "8000") {
    return "http://localhost:8000/api";
  }

  return `${window.location.origin}/api`;
})();
let authToken = localStorage.getItem("authToken") || null;

let clinics = [];
let tutors = [];
let pets = [];
let services = [];
let products = [];
let employees = [];
let schedulings = [];
let stockMovements = [];
let financialRecords = [];
const tableFilters = {};
const tableFilterTimers = {};

function isMobileViewport() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function setMobileNavOpen(open) {
  const shouldOpen = Boolean(open && isMobileViewport());
  document.body.classList.toggle("mobile-nav-open", shouldOpen);

  const toggleButton = document.getElementById("mobileNavToggle");
  if (toggleButton) {
    toggleButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    toggleButton.setAttribute("aria-label", shouldOpen ? "Fechar menu" : "Abrir menu");
  }
}

function closeMobileNav() {
  setMobileNavOpen(false);
}

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeSearch(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark-theme", dark);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = dark ? "☀️ Tema claro" : "🌙 Tema escuro";
}

function toggleTheme() {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
}

function updateKPIs() {
  const lowStock = products.filter((p) => (p.quantity || 0) <= (p.alert_threshold ?? 0)).length;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todaySchedulings = schedulings.filter((s) => {
    if (!s.date_time) return false;
    const d = new Date(s.date_time);
    if (Number.isNaN(d.getTime())) return false;
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return localDate === today;
  }).length;

  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const getYearMonth = (dateValue) => {
    if (!dateValue) return "";
    // Quando já vem como "YYYY-MM-DD"
    if (typeof dateValue === "string" && /^\d{4}-\d{2}/.test(dateValue)) {
      return dateValue.slice(0, 7);
    }
    // Fallback para Date/ISO
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const confirmedFinancials = financialRecords.filter((f) => {
    const status = String(f.status || "").toLowerCase();
    const isConfirmed = status === "realizado" || status === "pago";
    return isConfirmed;
  });

  const availablePeriods = confirmedFinancials
    .map((f) => getYearMonth(f.payment_date || f.due_date || f.created_at))
    .filter(Boolean)
    .sort();

  const selectedPeriod = availablePeriods.length > 0
    ? availablePeriods[availablePeriods.length - 1]
    : currentMonthPrefix;

  const confirmedFinancialsInPeriod = confirmedFinancials.filter((f) => {
    const referenceMonth = getYearMonth(f.payment_date || f.due_date || f.created_at);
    return referenceMonth === selectedPeriod;
  });

  const confirmedRevenue = confirmedFinancialsInPeriod
    .filter((f) => String(f.record_type || "").toLowerCase() === "receita")
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  const confirmedExpense = confirmedFinancialsInPeriod
    .filter((f) => String(f.record_type || "").toLowerCase() === "despesa")
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  const monthRevenue = confirmedRevenue - confirmedExpense;

  const periodDate = selectedPeriod ? new Date(`${selectedPeriod}-01T00:00:00`) : now;
  const periodText = periodDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("kpiClinics", clinics.length);
  setText("kpiPets", pets.length);
  setText("kpiLowStock", lowStock);
  setText("kpiTodaySchedulings", todaySchedulings);
  setText("kpiMonthRevenue", formatCurrency(monthRevenue));
  setText("kpiMonthBalanceLabel", `Saldo confirmado (${periodText})`);

  const monthCard = document.getElementById("kpiMonthBalanceCard");
  if (monthCard) {
    monthCard.classList.remove("kpi-positive", "kpi-negative", "kpi-neutral");
    if (monthRevenue > 0) monthCard.classList.add("kpi-positive");
    else if (monthRevenue < 0) monthCard.classList.add("kpi-negative");
    else monthCard.classList.add("kpi-neutral");
  }
}

function showLogin() {
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
}

function switchTab(tab) {
  document.querySelectorAll(".section").forEach((s) => s.classList.add("hidden"));
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
  const el = document.getElementById(`${tab}Section`);
  if (el) el.classList.remove("hidden");
  // Ativar o botão de nav correto
  const activeBtn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  // Atualizar título da página
  const titles = {
    clinics:        ['Clínicas',          'Gerencie as clínicas cadastradas'],
    tutors:         ['Tutores',           'Gerencie os tutores cadastrados'],
    pets:           ['Pets',              'Gerencie os pets cadastrados'],
    employees:      ['Funcionários',      'Gerencie a equipe da clínica'],
    services:       ['Serviços',          'Configure os serviços oferecidos'],
    products:       ['Produtos',          'Gerencie o estoque de produtos'],
    stockmovements: ['Estoque',           'Registre movimentações de estoque'],
    schedulings:    ['Agendamentos',      'Gerencie os agendamentos de atendimento'],
    financialrecords:['Finanças',         'Controle financeiro da clínica'],
  };
  const [title, subtitle] = titles[tab] || ['PetFlow', ''];
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  if (pageTitle) pageTitle.textContent = title;
  if (pageSubtitle) pageSubtitle.textContent = subtitle;

  if (isMobileViewport()) {
    closeMobileNav();
  }
}

async function apiCall(endpoint, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    if (response.status === 401) {
      alert("Sessão expirada. Faça login novamente.");
      logout();
    }
    throw new Error(`API error ${response.status}`);
  }

  if (response.status !== 204) return await response.json();
  return null;
}

function logout() {
  authToken = null;
  localStorage.removeItem("authToken");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  closeMobileNav();
  showLogin();
}

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Preencha usuário e senha.");
    return;
  }

  try {
    const resp = await fetch(`${API_BASE}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.detail || "Login inválido");
    }

    authToken = data.access;
    localStorage.setItem("authToken", authToken);
    showDashboard();
    await loadAllData();
  } catch (err) {
    alert(err.message || "Erro no login");
  }
}

async function loadAllData() {
  try {
    const [c, t, p, s, pr, e, sc, sm, fr] = await Promise.all([
      apiCall("/clinics/"),
      apiCall("/tutors/"),
      apiCall("/pets/"),
      apiCall("/services/"),
      apiCall("/products/"),
      apiCall("/employees/"),
      apiCall("/schedulings/"),
      apiCall("/stock-movements/"),
      apiCall("/financial-records/"),
    ]);

    clinics = c || [];
    tutors = t || [];
    pets = p || [];
    services = s || [];
    products = pr || [];
    employees = e || [];
    schedulings = sc || [];
    stockMovements = sm || [];
    financialRecords = fr || [];

    console.log("Dados carregados:", { clinics, tutors, pets, services, products, employees, schedulings, stockMovements, financialRecords });

    populateSelectors();
    updateSchedulingPetOptions(); // Inicializar com todos os pets
    updateBreedOptions(); // Inicializar com todas as raças
    displayAll();
    updateKPIs();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  }
}

function populateSelectors() {
  // Populate selects with backend data
  fillSelect("tutorClinic", clinics);
  fillSelect("petTutor", tutors);
  fillSelect("productClinic", clinics);
  fillSelect("employeeClinic", clinics);
  fillSelect("schedulingClinic", clinics);
  fillSelect("schedulingTutor", tutors);
  fillSelect("schedulingPet", pets);
  fillSelect("schedulingEmployee", employees);
  fillSelect("schedulingService", services);
  fillSelect("stockClinic", clinics);
  fillSelect("stockProduct", products);
  fillSelect("stockEmployee", employees);
  fillSelect("financialClinic", clinics);
}

function fillSelect(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = el.value;
  el.innerHTML = "<option value=''>Selecione</option>";

  items.forEach((x) => {
    const opt = document.createElement("option");
    opt.value = x.id || x.pk || x.uuid || x.id;
    opt.textContent = x.name || x.title || x.title || x.value || x.label || x.email || x.phone || x.name;
    el.appendChild(opt);
  });

  if (current) el.value = current;
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function updatePetOptions() {
  const tutorId = document.getElementById('petTutor').value;
  const petSelect = document.getElementById('petId'); // Assuming there's a petId for scheduling, but for pets form, maybe not needed. Wait, for pets form, it's the pet name, but to avoid errors, perhaps clear or something. Actually, for pets form, when tutor changes, maybe just leave pet as is, but the user said to direct to pets of that tutor, but since it's creating a new pet, perhaps not applicable. Wait, re-reading: "o nome do pet já é direcionado para os petz vinculados aquele tutor" - perhaps for scheduling, not for pets form.

  // For pets form, when creating, tutor is selected, but pet is the new one. Perhaps not needed for pets form. But for scheduling, yes.

  // Actually, the user said "na guia de pets", so for pets form, perhaps when editing, but for new, maybe not. But to be safe, perhaps add logic to filter pets in scheduling.

  // For now, since it's for pets, and to avoid errors, perhaps do nothing, or if editing, set the pet.

  // But the user wants to avoid errors, so perhaps in scheduling, filter pets by tutor.

  // Let's add for scheduling: when tutor changes, update pet options.

  // But the select is petId for scheduling.

  // In populateSelectors, fillSelect("petId", pets); but to filter, need dynamic.

  // Add onchange to schedulingTutor.

  // First, find the scheduling form.

}

function updateBreedOptions() {
  const species = document.getElementById("petSpecies").value;
  const breedSelect = document.getElementById("petStandardBreed");
  const currentValue = breedSelect.value;

  breedSelect.innerHTML = '<option value="">Raça padronizada</option>';

  const breedOptions = {
    cachorro: [
      { value: "labrador", text: "Labrador" },
      { value: "golden", text: "Golden Retriever" },
      { value: "poodle", text: "Poodle" },
      { value: "bulldog", text: "Bulldog" },
      { value: "pastor_alemao", text: "Pastor Alemão" },
      { value: "beagle", text: "Beagle" },
      { value: "chihuahua", text: "Chihuahua" },
      { value: "yorkshire", text: "Yorkshire" },
      { value: "shih_tzu", text: "Shih Tzu" },
      { value: "rottweiler", text: "Rottweiler" },
      { value: "pitbull", text: "Pitbull" },
      { value: "srd", text: "Sem Raça Definida (SRD)" },
    ],
    gato: [
      { value: "siames", text: "Siamês" },
      { value: "persa", text: "Persa" },
      { value: "maine_coon", text: "Maine Coon" },
      { value: "angora", text: "Angorá" },
      { value: "sphynx", text: "Sphynx" },
      { value: "ragdoll", text: "Ragdoll" },
      { value: "bengal", text: "Bengal" },
      { value: "british_shorthair", text: "British Shorthair" },
    ],
    passaro: [
      { value: "calopsita", text: "Calopsita" },
      { value: "periquito", text: "Periquito" },
      { value: "canario", text: "Canário" },
      { value: "papagaio", text: "Papagaio" },
      { value: "outro", text: "Outro" },
    ],
    roedor: [
      { value: "hamster", text: "Hamster" },
      { value: "porquinho_da_india", text: "Porquinho-da-Índia" },
      { value: "chinchila", text: "Chinchila" },
      { value: "rato_twister", text: "Rato Twister" },
      { value: "outro", text: "Outro" },
    ],
  };

  if (species && breedOptions[species]) {
    breedOptions[species].forEach((breed) => {
      const option = document.createElement("option");
      option.value = breed.value;
      option.textContent = breed.text;
      breedSelect.appendChild(option);
    });

    if (currentValue) {
      breedSelect.value = currentValue;
    }
  }
}

function updateSchedulingPetOptions() {
  const tutorId = document.getElementById('schedulingTutor').value;
  const petSelect = document.getElementById('schedulingPet');
  const filteredPets = tutorId ? pets.filter(p => p.tutor === tutorId) : pets;
  fillSelect('schedulingPet', filteredPets);
}

function updateFinancialCategories() {
  const type = document.getElementById('financialRecordType').value;
  const categorySelect = document.getElementById('financialCategory');
  categorySelect.innerHTML = '<option value="">Selecione categoria</option>';

  const categories = {
    receita: ['servico', 'produto', 'outro'],
    despesa: ['salario', 'aluguel', 'energia', 'agua', 'telefone', 'manutencao', 'marketing', 'outro'],
  };

  if (type && categories[type]) {
    categories[type].forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      categorySelect.appendChild(option);
    });
  }
}

function displayAll() {
  displayEntities("clinics", clinics, renderClinicRow);
  displayEntities("tutors", tutors, renderTutorRow);
  displayEntities("pets", pets, renderPetRow);
  displayEntities("services", services, renderServiceRow);
  displayEntities("products", products, renderProductRow);
  displayEntities("employees", employees, renderEmployeeRow);
  displayEntities("schedulings", schedulings, renderSchedulingRow);
  displayEntities("stockMovements", stockMovements, renderStockMovementRow);
  displayEntities("financialRecords", financialRecords, renderFinancialRecordRow);
}

function renderSingleList(listKey) {
  const map = {
    clinics: () => displayEntities("clinics", clinics, renderClinicRow),
    tutors: () => displayEntities("tutors", tutors, renderTutorRow),
    pets: () => displayEntities("pets", pets, renderPetRow),
    services: () => displayEntities("services", services, renderServiceRow),
    products: () => displayEntities("products", products, renderProductRow),
    employees: () => displayEntities("employees", employees, renderEmployeeRow),
    schedulings: () => displayEntities("schedulings", schedulings, renderSchedulingRow),
    stockMovements: () => displayEntities("stockMovements", stockMovements, renderStockMovementRow),
    financialRecords: () => displayEntities("financialRecords", financialRecords, renderFinancialRecordRow),
  };
  map[listKey]?.();
}

function displayEntities(containerId, items, rowRenderer) {
  const box = document.getElementById(`${containerId}List`);
  if (!box) return;
  if (!items || items.length === 0) {
    box.innerHTML = '<div class="empty-state">Nenhum registro cadastrado</div>';
    return;
  }

  const searchQuery = tableFilters[containerId] || "";
  const normalizedQuery = normalizeSearch(searchQuery).trim();
  const itemMatchesQuery = (item) => {
    if (!normalizedQuery) return true;

    // Busca apenas no texto realmente exibido na linha da tabela
    const renderedRowText = rowRenderer(item)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ");
    const renderedText = normalizeSearch(renderedRowText);
    // Suporte a múltiplos termos: todos os termos devem existir
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return terms.every((term) => renderedText.includes(term));
  };

  const filteredItems = items.filter(itemMatchesQuery);

  if (filteredItems.length === 0) {
    box.innerHTML = `
      <div class="list-toolbar">
        <div class="list-toolbar-meta">0 de ${items.length} registros</div>
        <input class="table-search" type="search" placeholder="Buscar nesta lista..." value="${escapeHtml(searchQuery)}" data-list-filter="${containerId}" />
      </div>
      <div class="empty-state">Nenhum registro encontrado para a busca.</div>
    `;
  } else {
    const rows = filteredItems.map((item) => rowRenderer(item)).join("");
    box.innerHTML = `
      <div class="list-toolbar">
        <div class="list-toolbar-meta">${filteredItems.length} de ${items.length} registros</div>
        <input class="table-search" type="search" placeholder="Buscar nesta lista..." value="${escapeHtml(searchQuery)}" data-list-filter="${containerId}" />
      </div>
      <div class="table-wrapper"><table><thead>${rowRenderer.head}</thead><tbody>${rows}</tbody></table></div>
    `;
  }

}

// Renders

function renderClinicRow(c) {
  return `<tr><td><strong>${c.name}</strong></td><td>${c.cnpj || "-"}</td><td>${c.email || "-"}</td><td>${c.phone || "-"}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editClinic('${c.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteClinic('${c.id}')">Excluir</button></div></td></tr>`;
}
renderClinicRow.head = `<tr><th>Nome</th><th>CNPJ</th><th>E-mail</th><th>Telefone</th><th>Ações</th></tr>`;

function renderTutorRow(t) {
  return `<tr><td><strong>${t.name}</strong></td><td>${t.cpf || "-"}</td><td>${t.email || "-"}</td><td>${t.phone || "-"}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editTutor('${t.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteTutor('${t.id}')">Excluir</button></div></td></tr>`;
}
renderTutorRow.head = `<tr><th>Nome</th><th>CPF</th><th>E-mail</th><th>Telefone</th><th>Ações</th></tr>`;

function renderPetRow(p) {
  const speciesEmoji = {cachorro:'🐕',gato:'🐈',passaro:'🦜',roedor:'🐹'}[p.species] || '🐾';
  return `<tr><td><strong>${p.name}</strong></td><td>${speciesEmoji} ${p.species || "-"}</td><td>${p.breed || p.standard_breed || "-"}</td><td>${p.weight ? p.weight + ' kg' : "-"}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editPet('${p.id}')">Editar</button><button class="action-btn btn-delete" onclick="deletePet('${p.id}')">Excluir</button></div></td></tr>`;
}
renderPetRow.head = `<tr><th>Nome</th><th>Espécie</th><th>Raça</th><th>Peso</th><th>Ações</th></tr>`;

function renderServiceRow(s) {
  return `<tr><td><strong>${s.name}</strong></td><td><span class="badge badge-info">${s.category||"-"}</span></td><td>R$ ${parseFloat(s.price||0).toFixed(2)}</td><td>${s.duration_minutes ? s.duration_minutes + ' min' : "-"}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editService('${s.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteService('${s.id}')">Excluir</button></div></td></tr>`;
}
renderServiceRow.head = `<tr><th>Nome</th><th>Categoria</th><th>Preço</th><th>Duração</th><th>Ações</th></tr>`;

function renderProductRow(p) {
  const isLow = p.quantity <= p.alert_threshold;
  const stockBadge = isLow ? '<span class="badge badge-inactive">⚠️ Baixo</span>' : '<span class="badge badge-active">✓ OK</span>';
  return `<tr><td><strong>${p.name}</strong></td><td>${p.category||"-"}</td><td>${p.brand||"-"}</td><td>${p.quantity||0}</td><td>R$ ${parseFloat(p.price||0).toFixed(2)}</td><td>${stockBadge}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editProduct('${p.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteProduct('${p.id}')">Excluir</button></div></td></tr>`;
}
renderProductRow.head = `<tr><th>Nome</th><th>Categoria</th><th>Marca</th><th>Qtd</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr>`;

function renderEmployeeRow(e) {
  return `<tr><td><strong>${e.name}</strong></td><td>${e.email}</td><td><span class="badge badge-info">${e.role}</span></td><td>${e.phone || "-"}</td><td><span class="badge ${e.is_active ? "badge-active" : "badge-inactive"}">${e.is_active ? "✅ Ativo" : "❌ Inativo"}</span></td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editEmployee('${e.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteEmployee('${e.id}')">Excluir</button></div></td></tr>`;
}
renderEmployeeRow.head = `<tr><th>Nome</th><th>E-mail</th><th>Cargo</th><th>Telefone</th><th>Status</th><th>Ações</th></tr>`;

function renderSchedulingRow(s) {
  const petName = pets.find((i) => i.id === s.pet)?.name || "-";
  const statusMap = {agendado:'badge-info',confirmado:'badge-active',em_andamento:'badge-warning',concluido:'badge-active',cancelado:'badge-inactive'};
  return `<tr><td><strong>${petName}</strong></td><td>${new Date(s.date_time).toLocaleString('pt-BR')}</td><td><span class="badge ${statusMap[s.status]||'badge-info'}">${s.status}</span></td><td>R$ ${parseFloat(s.total_value||0).toFixed(2)}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editScheduling('${s.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteScheduling('${s.id}')">Excluir</button></div></td></tr>`;
}
renderSchedulingRow.head = `<tr><th>Pet</th><th>Data / Hora</th><th>Status</th><th>Valor</th><th>Ações</th></tr>`;

function renderStockMovementRow(m) {
  const productName = products.find((i) => i.id === m.product)?.name || "-";
  const typeMap = {entrada:'badge-active',saida:'badge-inactive',ajuste:'badge-warning',devolucao:'badge-info'};
  return `<tr><td><strong>${productName}</strong></td><td><span class="badge ${typeMap[m.movement_type]||'badge-info'}">${m.movement_type}</span></td><td>${m.quantity}</td><td>${m.description || "-"}</td><td>${new Date(m.created_at).toLocaleDateString('pt-BR')}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editStockMovement('${m.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteStockMovement('${m.id}')">Excluir</button></div></td></tr>`;
}
renderStockMovementRow.head = `<tr><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Descrição</th><th>Data</th><th>Ações</th></tr>`;

function renderFinancialRecordRow(f) {
  const typeClass = f.record_type === 'receita' ? 'badge-active' : 'badge-inactive';
  const statusClass = f.status === 'realizado' ? 'badge-active' : f.status === 'cancelado' ? 'badge-inactive' : 'badge-warning';
  return `<tr><td><span class="badge ${typeClass}">${f.record_type === 'receita' ? '📈 Receita' : '📉 Despesa'}</span></td><td>${f.category}</td><td>${f.description||'-'}</td><td><strong>R$ ${parseFloat(f.amount||0).toFixed(2)}</strong></td><td><span class="badge ${statusClass}">${f.status}</span></td><td>${new Date(f.due_date).toLocaleDateString('pt-BR')}</td><td><div class="table-actions"><button class="action-btn btn-edit" onclick="editFinancialRecord('${f.id}')">Editar</button><button class="action-btn btn-delete" onclick="deleteFinancialRecord('${f.id}')">Excluir</button></div></td></tr>`;
}
renderFinancialRecordRow.head = `<tr><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Vencimento</th><th>Ações</th></tr>`;

// CRUD helpers for each entity
function getEditId(section) {
  return document.querySelector(`#${section}Section button[onclick+='save${section.charAt(0).toUpperCase()+section.slice(1)}()']`)?.getAttribute('data-edit-id') || null;
}

function setEditButton(section, label) {
  const btn = document.querySelector(`#${section}Section button[onclick^='save${section.charAt(0).toUpperCase()+section.slice(1)}']`);
  if (btn) { btn.textContent = label; }
}

// Implement the individual actions. To save time, reused code patterns.

async function saveClinic(){
  const editId = document.querySelector("#clinicsSection button[onclick='saveClinic()']").getAttribute('data-edit-id');
  const clinic = {
    name: document.getElementById("clinicName").value,
    cnpj: document.getElementById("clinicCnpj").value,
    email: document.getElementById("clinicEmail").value,
    phone: document.getElementById("clinicPhone").value,
    address: document.getElementById("clinicAddress").value,
    city: document.getElementById("clinicCity").value,
    state: document.getElementById("clinicState").value,
    zip_code: document.getElementById("clinicZipCode").value,
    opening_time: document.getElementById("clinicOpeningTime").value,
    closing_time: document.getElementById("clinicClosingTime").value,
    appointment_interval: document.getElementById("clinicAppointmentInterval").value,
    work_days: document.getElementById("clinicWorkDays").value,
  };

  try {
    if (editId) {
      await apiCall(`/clinics/${editId}/`, "PATCH", clinic);
      alert("Clínica atualizada com sucesso!");
      const submitBtn = document.querySelector("#clinicsSection button[onclick='saveClinic()']");
      submitBtn.removeAttribute('data-edit-id');
      submitBtn.textContent = 'Salvar Clínica';
      submitBtn.style.background = '#059669';
    } else {
      await apiCall("/clinics/", "POST", clinic);
      alert("Clínica salva com sucesso!");
    }
    clearClinicForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar clínica.');
  }
}

function editClinic(id){
  const c = clinics.find((x)=>x.id===id);
  if (!c) return;
  document.getElementById('clinicName').value=c.name||'';
  document.getElementById('clinicCnpj').value=c.cnpj||'';
  document.getElementById('clinicEmail').value=c.email||'';
  document.getElementById('clinicPhone').value=c.phone||'';
  document.getElementById('clinicAddress').value=c.address||'';
  document.getElementById('clinicCity').value=c.city||'';
  document.getElementById('clinicState').value=c.state||'';
  document.getElementById('clinicZipCode').value=c.zip_code||'';
  document.getElementById('clinicOpeningTime').value=c.opening_time||'';
  document.getElementById('clinicClosingTime').value=c.closing_time||'';
  document.getElementById('clinicAppointmentInterval').value=c.appointment_interval||30;
  document.getElementById('clinicWorkDays').value=c.work_days||'seg-sex';
  const btn=document.querySelector("#clinicsSection button[onclick='saveClinic()']");
  btn.setAttribute('data-edit-id',id); btn.textContent='Atualizar Clínica'; btn.style.background='#0ea5e9';
}

async function deleteClinic(id){
  if(!confirm('Tem certeza?')) return;
  await apiCall(`/clinics/${id}/`, 'DELETE');
  await loadAllData();
}

function clearClinicForm(){
  ['clinicName','clinicCnpj','clinicEmail','clinicPhone','clinicAddress','clinicCity','clinicState','clinicZipCode','clinicOpeningTime','clinicClosingTime','clinicAppointmentInterval','clinicWorkDays'].forEach(id => document.getElementById(id).value='');
  const btn=document.querySelector("#clinicsSection button[onclick='saveClinic()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Salvar Clínica'; btn.style.background = '#059669';
}

async function saveTutor() {
  const editId = document.querySelector("#tutorsSection button[onclick='saveTutor()']").getAttribute('data-edit-id');
  const tutor = {
    clinic: document.getElementById('tutorClinic').value,
    name: document.getElementById('tutorName').value,
    cpf: document.getElementById('tutorCpf').value,
    email: document.getElementById('tutorEmail').value,
    phone: document.getElementById('tutorPhone').value,
    secondary_phone: document.getElementById('tutorSecondaryPhone').value,
  };

  try {
    if (editId) {
      await apiCall(`/tutors/${editId}/`, 'PATCH', tutor);
      alert('Tutor atualizado com sucesso!');
    } else {
      await apiCall('/tutors/', 'POST', tutor);
      alert('Tutor salvo com sucesso!');
    }
    clearTutorForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar tutor.');
  }
}

function editTutor(id) {
  const t = tutors.find((x) => x.id === id);
  if (!t) return;
  document.getElementById('tutorClinic').value = t.clinic || '';
  document.getElementById('tutorName').value = t.name || '';
  document.getElementById('tutorCpf').value = t.cpf || '';
  document.getElementById('tutorEmail').value = t.email || '';
  document.getElementById('tutorPhone').value = t.phone || '';
  document.getElementById('tutorSecondaryPhone').value = t.secondary_phone || '';
  const btn = document.querySelector("#tutorsSection button[onclick='saveTutor()']");
  btn.setAttribute('data-edit-id', id); btn.textContent = 'Atualizar Tutor'; btn.style.background = '#0ea5e9';
}

async function deleteTutor(id) {
  if (!confirm('Tem certeza que deseja deletar este tutor?')) return;
  await apiCall(`/tutors/${id}/`, 'DELETE');
  await loadAllData();
}

function clearTutorForm() {
  ['tutorClinic','tutorName','tutorCpf','tutorEmail','tutorPhone','tutorSecondaryPhone'].forEach(id => document.getElementById(id).value='');
  const btn = document.querySelector("#tutorsSection button[onclick='saveTutor()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Salvar Tutor'; btn.style.background = '#059669';
}

async function savePet() {
  const editId = document.querySelector("#petsSection button[onclick='savePet()']").getAttribute('data-edit-id');
  const pet = {
    tutor: document.getElementById('petTutor').value,
    name: document.getElementById('petName').value,
    species: document.getElementById('petSpecies').value,
    breed: document.getElementById('petBreed').value,
    standard_breed: document.getElementById('petStandardBreed').value,
    birth_date: document.getElementById('petBirthDate').value,
    color: document.getElementById('petColor').value,
    weight: parseFloat(document.getElementById('petWeight').value) || null,
    gender: document.getElementById('petGender').value,
    size: document.getElementById('petSize').value,
    notes: document.getElementById('petNotes').value,
  };

  try {
    if (editId) {
      await apiCall(`/pets/${editId}/`, 'PATCH', pet);
      alert('Pet atualizado com sucesso!');
    } else {
      await apiCall('/pets/', 'POST', pet);
      alert('Pet salvo com sucesso!');
    }
    clearPetForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar pet.');
  }
}

function editPet(id) {
  const p = pets.find((x) => x.id === id);
  if (!p) return;
  document.getElementById('petTutor').value = p.tutor || '';
  document.getElementById('petName').value = p.name || '';
  document.getElementById('petSpecies').value = p.species || '';
  updateBreedOptions();
  document.getElementById('petBreed').value = p.breed || '';
  document.getElementById('petStandardBreed').value = p.standard_breed || '';
  document.getElementById('petBirthDate').value = p.birth_date || '';
  document.getElementById('petColor').value = p.color || '';
  document.getElementById('petWeight').value = p.weight || '';
  document.getElementById('petGender').value = p.gender || '';
  document.getElementById('petSize').value = p.size || '';
  document.getElementById('petNotes').value = p.notes || '';
  const btn = document.querySelector("#petsSection button[onclick='savePet()']");
  btn.setAttribute('data-edit-id', id); btn.textContent='Atualizar Pet'; btn.style.background='#0ea5e9';
}

async function deletePet(id) {
  if (!confirm('Tem certeza?')) return;
  await apiCall(`/pets/${id}/`, 'DELETE');
  await loadAllData();
}

function clearPetForm() {
  ['petTutor','petName','petSpecies','petBreed','petStandardBreed','petBirthDate','petColor','petWeight','petGender','petSize','petNotes'].forEach(id => document.getElementById(id).value='');
  const btn = document.querySelector("#petsSection button[onclick='savePet()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Salvar Pet'; btn.style.background = '#059669';
}

async function saveService() {
  const editId = document.getElementById('saveServiceBtn').getAttribute('data-edit-id');
  const service = {
    name: document.getElementById('serviceName').value,
    category: document.getElementById('serviceCategory').value,
    price: parseFloat(document.getElementById('servicePrice').value) || 0,
    duration_minutes: parseInt(document.getElementById('serviceDuration').value) || 0,
    description: document.getElementById('serviceDescription').value,
    is_active: true,
  };

  try {
    if (editId) {
      await apiCall(`/services/${editId}/`, 'PATCH', service);
      alert('Serviço atualizado com sucesso!');
    } else {
      await apiCall('/services/', 'POST', service);
      alert('Serviço salvo com sucesso!');
    }
    clearServiceForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar serviço.');
  }
}

function editService(id) {
  const s = services.find((x) => x.id === id);
  if (!s) return;
  document.getElementById('serviceName').value = s.name || '';
  document.getElementById('serviceCategory').value = s.category || '';
  document.getElementById('servicePrice').value = s.price || '';
  document.getElementById('serviceDuration').value = s.duration_minutes || '';
  document.getElementById('serviceDescription').value = s.description || '';
  const btn = document.getElementById('saveServiceBtn');
  btn.setAttribute('data-edit-id', id); btn.textContent='Atualizar Serviço'; btn.style.background='#0ea5e9';
}

async function deleteService(id) {
  if (!confirm('Tem certeza?')) return;
  await apiCall(`/services/${id}/`, 'DELETE');
  await loadAllData();
}

function clearServiceForm() {
  ['serviceName','serviceCategory','servicePrice','serviceDuration','serviceDescription'].forEach(id => document.getElementById(id).value='');
  const btn = document.getElementById('saveServiceBtn');
  btn.removeAttribute('data-edit-id'); btn.textContent='Salvar Serviço'; btn.style.background = '#059669';
}

async function saveProduct() {
  const editId = document.querySelector("#productsSection button[onclick='saveProduct()']").getAttribute('data-edit-id');
  const product = {
    clinic: document.getElementById('productClinic').value,
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    brand: document.getElementById('productBrand').value,
    quantity: parseInt(document.getElementById('productQuantity').value) || 0,
    min_stock: parseInt(document.getElementById('productMinStock').value) || 0,
    alert_threshold: parseInt(document.getElementById('productAlertThreshold').value) || 0,
    price: parseFloat(document.getElementById('productPrice').value) || 0,
    description: document.getElementById('productDescription').value,
    is_active: true,
  };

  try {
    if (editId) {
      await apiCall(`/products/${editId}/`, 'PATCH', product);
      alert('Produto atualizado com sucesso!');
    } else {
      await apiCall('/products/', 'POST', product);
      alert('Produto salvo com sucesso!');
    }
    clearProductForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar produto.');
  }
}

function editProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  document.getElementById('productClinic').value = p.clinic || '';
  document.getElementById('productName').value = p.name || '';
  document.getElementById('productCategory').value = p.category || '';
  document.getElementById('productBrand').value = p.brand || '';
  document.getElementById('productQuantity').value = p.quantity || '';
  document.getElementById('productMinStock').value = p.min_stock || '';
  document.getElementById('productAlertThreshold').value = p.alert_threshold || '';
  document.getElementById('productPrice').value = p.price || '';
  document.getElementById('productDescription').value = p.description || '';
  const btn = document.querySelector("#productsSection button[onclick='saveProduct()']");
  btn.setAttribute('data-edit-id', id); btn.textContent='Atualizar Produto'; btn.style.background='#0ea5e9';
}

async function deleteProduct(id) {
  if (!confirm('Tem certeza?')) return;
  await apiCall(`/products/${id}/`, 'DELETE');
  await loadAllData();
}

function clearProductForm() {
  ['productClinic','productName','productCategory','productBrand','productQuantity','productMinStock','productAlertThreshold','productPrice','productDescription'].forEach(id => document.getElementById(id).value='');
  const btn = document.querySelector("#productsSection button[onclick='saveProduct()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Salvar Produto'; btn.style.background = '#059669';
}

async function saveEmployee() {
  const editId = document.querySelector("#employeesSection button[onclick='saveEmployee()']").getAttribute('data-edit-id');
  const employee = {
    clinic: document.getElementById('employeeClinic').value,
    name: document.getElementById('employeeName').value,
    email: document.getElementById('employeeEmail').value,
    role: document.getElementById('employeeRole').value,
    password: document.getElementById('employeePassword').value,
    phone: document.getElementById('employeePhone').value,
    admission_date: document.getElementById('employeeAdmissionDate').value,
    is_active: document.getElementById('employeeIsActive').value === 'true',
  };

  if (!employee.email || !employee.name || !employee.role || (!employee.password && !editId)) {
    alert('Preencha dados obrigatórios do funcionário.');
    return;
  }

  try {
    if (editId) {
      await apiCall(`/employees/${editId}/`, 'PATCH', employee);
      alert('Funcionário atualizado com sucesso!');
    } else {
      await apiCall('/employees/', 'POST', employee);
      alert('Funcionário salvo com sucesso!');
    }
    clearEmployeeForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar funcionário.');
  }
}

function editEmployee(id) {
  const e = employees.find((x) => x.id === id);
  if (!e) return;
  document.getElementById('employeeClinic').value = e.clinic || '';
  document.getElementById('employeeName').value = e.name || '';
  document.getElementById('employeeEmail').value = e.email || '';
  document.getElementById('employeeRole').value = e.role || '';
  document.getElementById('employeePassword').value = '';
  document.getElementById('employeePhone').value = e.phone || '';
  document.getElementById('employeeAdmissionDate').value = e.admission_date || '';
  document.getElementById('employeeIsActive').value = String(e.is_active ?? true);
  const btn = document.querySelector("#employeesSection button[onclick='saveEmployee()']");
  btn.setAttribute('data-edit-id', id); btn.textContent='Atualizar Funcionário'; btn.style.background='#0ea5e9';
}

async function deleteEmployee(id) {
  if (!confirm('Tem certeza?')) return;
  await apiCall(`/employees/${id}/`, 'DELETE');
  await loadAllData();
}

function clearEmployeeForm() {
  ['employeeClinic','employeeName','employeeEmail','employeeRole','employeePassword','employeePhone','employeeAdmissionDate'].forEach(id => document.getElementById(id).value='');
  document.getElementById('employeeIsActive').value = 'true';
  const btn = document.querySelector("#employeesSection button[onclick='saveEmployee()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Salvar Funcionário'; btn.style.background = '#059669';
}

async function saveScheduling() {
  const editId = document.querySelector("#schedulingsSection button[onclick='saveScheduling()']").getAttribute('data-edit-id');
  const schedulingDateTime = document.getElementById('schedulingDateTime').value;
  const scheduling = {
    clinic: document.getElementById('schedulingClinic').value,
    tutor: document.getElementById('schedulingTutor').value,
    pet: document.getElementById('schedulingPet').value,
    employee: document.getElementById('schedulingEmployee').value,
    date_time: schedulingDateTime ? new Date(schedulingDateTime).toISOString() : null,
    status: document.getElementById('schedulingStatus').value,
    total_value: parseFloat(document.getElementById('schedulingTotal').value) || 0,
    notes: document.getElementById('schedulingNotes').value,
    scheduled_services: [{ service: document.getElementById('schedulingService').value, service_value: parseFloat(document.getElementById('schedulingTotal').value) || 0 }],
  };

  if (!scheduling.clinic || !scheduling.tutor || !scheduling.pet || !scheduling.employee || !scheduling.date_time) {
    alert('Preencha todos os campos obrigatórios de agendamento.');
    return;
  }

  try {
    if (editId) {
      await apiCall(`/schedulings/${editId}/`, 'PATCH', scheduling);
      alert('Agendamento atualizado com sucesso!');
    } else {
      await apiCall('/schedulings/', 'POST', scheduling);
      alert('Agendamento salvo com sucesso!');
    }
    clearSchedulingForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar agendamento.');
  }
}

function editScheduling(id) {
  const s = schedulings.find((x) => x.id === id);
  if (!s) return;
  document.getElementById('schedulingClinic').value = s.clinic || '';
  document.getElementById('schedulingTutor').value = s.tutor || '';
  document.getElementById('schedulingPet').value = s.pet || '';
  document.getElementById('schedulingEmployee').value = s.employee || '';
  document.getElementById('schedulingDateTime').value = s.date_time ? new Date(s.date_time).toISOString().slice(0, 16) : '';
  document.getElementById('schedulingStatus').value = s.status || 'agendado';
  document.getElementById('schedulingTotal').value = s.total_value || '';
  document.getElementById('schedulingService').value = s.scheduled_services?.[0]?.service || '';
  document.getElementById('schedulingNotes').value = s.notes || '';
  const btn = document.querySelector("#schedulingsSection button[onclick='saveScheduling()']");
  btn.setAttribute('data-edit-id', id); btn.textContent='Atualizar Agendamento'; btn.style.background='#0ea5e9';
}

async function deleteScheduling(id) {
  if (!confirm('Tem certeza?')) return;
  await apiCall(`/schedulings/${id}/`, 'DELETE');
  await loadAllData();
}

function clearSchedulingForm() {
  ['schedulingClinic','schedulingTutor','schedulingPet','schedulingEmployee','schedulingDateTime','schedulingStatus','schedulingTotal','schedulingService','schedulingNotes'].forEach(id=>document.getElementById(id).value='');
  const btn = document.querySelector("#schedulingsSection button[onclick='saveScheduling()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Salvar Agendamento'; btn.style.background = '#059669';
}

async function saveStockMovement() {
  const editId = document.querySelector("#stockmovementsSection button[onclick='saveStockMovement()']").getAttribute('data-edit-id');
  const movement = {
    clinic: document.getElementById('stockClinic').value,
    product: document.getElementById('stockProduct').value,
    movement_type: document.getElementById('stockMovementType').value,
    quantity: parseInt(document.getElementById('stockQuantity').value) || 0,
    description: document.getElementById('stockDescription').value,
    employee: document.getElementById('stockEmployee').value,
    notes: document.getElementById('stockNotes').value,
  };

  if (!movement.clinic || !movement.product || !movement.movement_type || !movement.quantity) {
    alert('Preencha todos os campos obrigatórios de estoque.');
    return;
  }

  try {
    if (editId) {
      await apiCall(`/stock-movements/${editId}/`, 'PATCH', movement);
      alert('Movimento atualizado com sucesso!');
    } else {
      await apiCall('/stock-movements/', 'POST', movement);
      alert('Movimento registrado com sucesso!');
    }
    clearStockForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao registrar movimento.');
  }
}

function editStockMovement(id) {
  const m = stockMovements.find((x) => x.id === id);
  if (!m) return;
  document.getElementById('stockClinic').value = m.clinic || '';
  document.getElementById('stockProduct').value = m.product || '';
  document.getElementById('stockMovementType').value = m.movement_type || '';
  document.getElementById('stockQuantity').value = m.quantity || '';
  document.getElementById('stockDescription').value = m.description || '';
  document.getElementById('stockEmployee').value = m.employee || '';
  document.getElementById('stockNotes').value = m.notes || '';
  const btn = document.querySelector("#stockmovementsSection button[onclick='saveStockMovement()']");
  btn.setAttribute('data-edit-id', id); btn.textContent='Atualizar Movimento'; btn.style.background='#0ea5e9';
}

async function deleteStockMovement(id) {
  if (!confirm('Tem certeza?')) return;
  await apiCall(`/stock-movements/${id}/`, 'DELETE');
  await loadAllData();
}

function clearStockForm() {
  ['stockClinic','stockProduct','stockMovementType','stockQuantity','stockDescription','stockEmployee','stockNotes'].forEach(id => document.getElementById(id).value='');
  const btn = document.querySelector("#stockmovementsSection button[onclick='saveStockMovement()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Registrar Movimento'; btn.style.background = '#059669';
}

async function saveFinancialRecord() {
  const editId = document.querySelector("#financialrecordsSection button[onclick='saveFinancialRecord()']").getAttribute('data-edit-id');
  const record = {
    clinic: document.getElementById('financialClinic').value,
    record_type: document.getElementById('financialRecordType').value,
    category: document.getElementById('financialCategory').value,
    description: document.getElementById('financialDescription').value,
    amount: parseFloat(document.getElementById('financialAmount').value) || 0,
    status: document.getElementById('financialStatus').value,
    due_date: document.getElementById('financialDueDate').value,
    payment_method: document.getElementById('financialPaymentMethod').value,
    notes: document.getElementById('financialNotes').value,
  };

  if (!record.clinic || !record.record_type || !record.category || !record.amount || !record.due_date) {
    alert('Preencha todos os campos obrigatórios financeiros.');
    return;
  }

  try {
    if (record.record_type === 'receita' && ['salario','aluguel','energia','agua','telefone','manutencao','marketing'].includes(record.category)) {
      alert('Categoria inválida para receita.');
      return;
    }
    if (record.record_type === 'despesa' && !['salario','aluguel','energia','agua','telefone','manutencao','marketing','outro'].includes(record.category)) {
      alert('Categoria inválida para despesa.');
      return;
    }

    if (editId) {
      await apiCall(`/financial-records/${editId}/`, 'PATCH', record);
      alert('Transação atualizada com sucesso!');
    } else {
      await apiCall('/financial-records/', 'POST', record);
      alert('Transação registrada com sucesso!');
    }
    clearFinancialForm();
    await loadAllData();
  } catch (err) {
    console.error(err);
    alert('Erro ao registrar transação.');
  }
}

function editFinancialRecord(id) {
  const f = financialRecords.find((x)=>x.id===id);
  if (!f) return;
  document.getElementById('financialClinic').value = f.clinic || '';
  document.getElementById('financialRecordType').value = f.record_type || '';
  document.getElementById('financialCategory').value = f.category || '';
  document.getElementById('financialDescription').value = f.description || '';
  document.getElementById('financialAmount').value = f.amount || '';
  document.getElementById('financialStatus').value = f.status || 'pendente';
  document.getElementById('financialDueDate').value = f.due_date || '';
  document.getElementById('financialPaymentMethod').value = f.payment_method || '';
  document.getElementById('financialNotes').value = f.notes || '';
  const btn = document.querySelector("#financialrecordsSection button[onclick='saveFinancialRecord()']");
  btn.setAttribute('data-edit-id', id); btn.textContent='Atualizar Transação'; btn.style.background='#0ea5e9';
}

async function deleteFinancialRecord(id) {
  if (!confirm('Tem certeza?')) return;
  await apiCall(`/financial-records/${id}/`, 'DELETE');
  await loadAllData();
}

function clearFinancialForm() {
  ['financialClinic','financialRecordType','financialCategory','financialDescription','financialAmount','financialStatus','financialDueDate','financialPaymentMethod','financialNotes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('financialStatus').value = 'pendente';
  const btn = document.querySelector("#financialrecordsSection button[onclick='saveFinancialRecord()']");
  btn.removeAttribute('data-edit-id'); btn.textContent='Registrar Transação'; btn.style.background = '#059669';
}

function clearForm(section) {
  switch (section) {
    case 'clinic':
      setFieldValue('clinicName', '');
      setFieldValue('clinicCnpj', '');
      setFieldValue('clinicEmail', '');
      setFieldValue('clinicPhone', '');
      setFieldValue('clinicAddress', '');
      setFieldValue('clinicCity', '');
      setFieldValue('clinicState', '');
      setFieldValue('clinicZipCode', '');
      setFieldValue('clinicOpeningTime', '08:00');
      setFieldValue('clinicClosingTime', '20:00');
      setFieldValue('clinicWorkDays', 'seg-sex');
      setFieldValue('clinicAppointmentInterval', '30');
      break;
    case 'tutor':
      setFieldValue('tutorClinic', '');
      setFieldValue('tutorName', '');
      setFieldValue('tutorCpf', '');
      setFieldValue('tutorEmail', '');
      setFieldValue('tutorPhone', '');
      setFieldValue('tutorSecondaryPhone', '');
      break;
    case 'pet':
      setFieldValue('petTutor', '');
      setFieldValue('petName', '');
      setFieldValue('petSpecies', '');
      setFieldValue('petBreed', '');
      setFieldValue('petStandardBreed', '');
      setFieldValue('petBirthDate', '');
      setFieldValue('petColor', '');
      setFieldValue('petGender', '');
      setFieldValue('petSize', '');
      setFieldValue('petWeight', '');
      setFieldValue('petNotes', '');
      updateBreedOptions();
      break;
    case 'service':
      setFieldValue('serviceName', '');
      setFieldValue('serviceCategory', '');
      setFieldValue('servicePrice', '');
      setFieldValue('serviceDuration', '');
      setFieldValue('serviceDescription', '');
      break;
    case 'product':
      setFieldValue('productClinic', '');
      setFieldValue('productName', '');
      setFieldValue('productCategory', '');
      setFieldValue('productBrand', '');
      setFieldValue('productQuantity', '');
      setFieldValue('productMinStock', '');
      setFieldValue('productAlertThreshold', '10');
      setFieldValue('productPrice', '');
      setFieldValue('productDescription', '');
      break;
    case 'employee':
      setFieldValue('employeeClinic', '');
      setFieldValue('employeeName', '');
      setFieldValue('employeeEmail', '');
      setFieldValue('employeeRole', '');
      setFieldValue('employeePassword', '');
      setFieldValue('employeePhone', '');
      setFieldValue('employeeAdmissionDate', '');
      setFieldValue('employeeIsActive', 'true');
      break;
    case 'scheduling':
      setFieldValue('schedulingClinic', '');
      setFieldValue('schedulingTutor', '');
      setFieldValue('schedulingPet', '');
      setFieldValue('schedulingEmployee', '');
      setFieldValue('schedulingService', '');
      setFieldValue('schedulingDateTime', '');
      setFieldValue('schedulingTotal', '');
      setFieldValue('schedulingNotes', '');
      setFieldValue('schedulingStatus', 'agendado');
      break;
    case 'stock':
      setFieldValue('stockClinic', '');
      setFieldValue('stockProduct', '');
      setFieldValue('stockMovementType', '');
      setFieldValue('stockQuantity', '');
      setFieldValue('stockDescription', '');
      setFieldValue('stockEmployee', '');
      setFieldValue('stockNotes', '');
      break;
    case 'financial':
      setFieldValue('financialClinic', '');
      setFieldValue('financialRecordType', '');
      setFieldValue('financialCategory', '');
      setFieldValue('financialAmount', '');
      setFieldValue('financialDescription', '');
      setFieldValue('financialDueDate', '');
      setFieldValue('financialPaymentMethod', '');
      setFieldValue('financialStatus', 'pendente');
      setFieldValue('financialNotes', '');
      break;
  }
}

// Initialize UI on load
window.addEventListener('load', async () => {
  applyTheme(localStorage.getItem("theme") || "light");

  const mobileNavToggle = document.getElementById("mobileNavToggle");
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.contains("mobile-nav-open");
      setMobileNavOpen(!isOpen);
    });
  }

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      closeMobileNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileNav();
    }
  });

  // Delegação global para busca nas listas (evita perder listener ao re-renderizar)
  document.addEventListener("input", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.matches("[data-list-filter]")) return;

    const listKey = target.getAttribute("data-list-filter");
    if (!listKey) return;

    const value = target.value;
    const selectionStart = target.selectionStart ?? value.length;
    const selectionEnd = target.selectionEnd ?? value.length;
    const mainContent = document.querySelector(".main-content");
    const previousScrollTop = mainContent ? mainContent.scrollTop : window.scrollY;

    tableFilters[listKey] = value;

    if (tableFilterTimers[listKey]) {
      clearTimeout(tableFilterTimers[listKey]);
    }

    tableFilterTimers[listKey] = setTimeout(() => {
      renderSingleList(listKey);

      if (mainContent) {
        mainContent.scrollTop = previousScrollTop;
      } else {
        window.scrollTo({ top: previousScrollTop });
      }

      const listBox = document.getElementById(`${listKey}List`);
      const newSearchInput = listBox?.querySelector("[data-list-filter]");
      if (newSearchInput instanceof HTMLInputElement) {
        try {
          newSearchInput.focus({ preventScroll: true });
        } catch {
          newSearchInput.focus();
        }
        const start = Math.min(selectionStart, newSearchInput.value.length);
        const end = Math.min(selectionEnd, newSearchInput.value.length);
        if (typeof newSearchInput.setSelectionRange === "function") {
          newSearchInput.setSelectionRange(start, end);
        }
      }
    }, 120);
  });

  if (authToken) {
    showDashboard();
    await loadAllData();
  } else {
    showLogin();
  }

  // Set employee phone based on selected clinic
  document.getElementById('employeeClinic').addEventListener('change', function() {
    const clinicId = this.value;
    const clinic = clinics.find(c => c.id == clinicId);
    if (clinic) {
      document.getElementById('employeePhone').value = clinic.phone || '';
    }
  });

  closeMobileNav();
});
