const ownerWhatsAppNumber = "5599999999999";
const buttons = document.querySelectorAll(".button");
const travelForm = document.querySelector("#travel-form");
const campaignFields = document.querySelector("#campaign-fields");
const campaignStorageKey = "adelmo_motorista_campaign_params";
const clickIdParams = ["gclid", "gbraid", "wbraid", "fbclid"];

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

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    console.log("Solicitacao de viagem iniciada pelo site Adelmo Motorista.");
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
  const campaignMessage = formatCampaignParams(latestCampaignParams);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "form_whatsapp",
    form_name: "solicitacao_viagem_executiva",
    nome,
    telefone,
    destino,
    horario,
    quantidade_pessoas: pessoas,
    campaign_params: latestCampaignParams,
  });

  const message = `Olá! Gostaria de solicitar uma viagem executiva.

Nome: ${nome}
Telefone: ${telefone}
Destino: ${destino}
Horário: ${horario}
Quantidade de pessoas: ${pessoas}${campaignMessage ? `\n\nDados da campanha:\n${campaignMessage}` : ""}`;

  const whatsappUrl = `https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener");
  travelForm.reset();
  populateCampaignFields(latestCampaignParams);
});
