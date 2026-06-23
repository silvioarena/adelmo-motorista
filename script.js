const ownerWhatsAppNumber = "5511995698209";
const googleSheetEndpoint =
  "https://script.google.com/macros/s/AKfycbzjWVqofwlFHCz4cqgLz5K0VPf5HiVzkdTdZWgeYVy7-AUKvDG38OiitpI6_ePZgQk/exec";
const buttons = document.querySelectorAll(".button");
const travelForm = document.querySelector("#travel-form");
const campaignFields = document.querySelector("#campaign-fields");
const horarioInput = document.querySelector("#horario");
const floatingCta = document.querySelector(".floating-cta");
const floatingCtaTrigger = document.querySelector(".contact-content");
const campaignStorageKey = "adelmo_motorista_campaign_params";
const clickIdParams = ["gclid", "gbraid", "wbraid", "fbclid"];

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

function getCampaignParamsFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  const campaignParams = {};

  searchParams.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey.startsWith("utm_") || clickIdParams.includes(normalizedKey)) {
      campaignParams[normalizedKey] = value;
    }
  });

  return campaignParams;
}

function getStoredCampaignParams() {
  try {
    return JSON.parse(localStorage.getItem(campaignStorageKey)) || {};
  } catch {
    return {};
  }
}

function saveCampaignParams(campaignParams) {
  try {
    localStorage.setItem(campaignStorageKey, JSON.stringify(campaignParams));
  } catch {
    // If storage is blocked, the current page view still keeps the URL UTMs.
  }
}

function upsertHiddenField(name, value) {
  let input = [...campaignFields.querySelectorAll("input")].find((field) => {
    return field.name === name;
  });

  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    campaignFields.appendChild(input);
  }

  input.value = value;
}

function populateCampaignFields(campaignParams) {
  Object.entries(campaignParams).forEach(([key, value]) => {
    upsertHiddenField(key, value);
  });
}

function getCurrentCampaignParams() {
  const urlCampaignParams = getCampaignParamsFromUrl();
  const storedCampaignParams = getStoredCampaignParams();
  const campaignParams = { ...storedCampaignParams, ...urlCampaignParams };

  if (Object.keys(urlCampaignParams).length > 0) {
    saveCampaignParams(campaignParams);
  }

  populateCampaignFields(campaignParams);

  return campaignParams;
}

function formatCampaignParams(campaignParams) {
  return Object.entries(campaignParams)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function formatTimeInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function updateFloatingCta() {
  const triggerBottom =
    floatingCtaTrigger.getBoundingClientRect().bottom + window.scrollY;
  const shouldShow = window.scrollY >= triggerBottom - 16;
  floatingCta.classList.toggle("is-visible", shouldShow);
}

function sendLeadToSheet(leadData) {
  return fetch(googleSheetEndpoint, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(leadData),
  }).catch((error) => {
    console.error("Nao foi possivel enviar o lead para a planilha.", error);
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    console.log("Solicitacao de viagem iniciada pelo site Adelmo Motorista.");
  });
});

horarioInput.addEventListener("input", () => {
  horarioInput.value = formatTimeInput(horarioInput.value);
});

window.addEventListener("scroll", updateFloatingCta, { passive: true });
window.addEventListener("resize", updateFloatingCta);
updateFloatingCta();

floatingCta.addEventListener("click", () => {
  const latestCampaignParams = getCurrentCampaignParams();

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "form_whatsapp",
    form_name: "whatsapp_flutuante",
    cta_type: "floating_whatsapp",
    whatsapp_number: ownerWhatsAppNumber,
    page_url: window.location.href,
    ...latestCampaignParams,
    campaign_params: latestCampaignParams,
  });
});

getCurrentCampaignParams();

travelForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(travelForm);
  const nome = formData.get("nome");
  const telefone = formData.get("telefone");
  const destino = formData.get("destino");
  const horario = formData.get("horario");
  const pessoas = formData.get("pessoas");
  const latestCampaignParams = getCurrentCampaignParams();
  const leadData = {
    nome,
    telefone,
    destino,
    horario,
    quantidade_pessoas: pessoas,
    page_url: window.location.href,
    ...latestCampaignParams,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "form_whatsapp",
    form_name: "solicitacao_viagem_executiva",
    ...leadData,
    campaign_params: latestCampaignParams,
  });

  sendLeadToSheet(leadData);

  const message = `Olá! Gostaria de solicitar uma viagem executiva.

Nome: ${nome}
Telefone: ${telefone}
Destino: ${destino || "Não informado"}
Horário: ${horario || "Não informado"}
Quantidade de pessoas: ${pessoas || "Não informado"}`;

  const whatsappUrl = `https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener");
  travelForm.reset();
  populateCampaignFields(latestCampaignParams);
});
