const TEMPLATES = [
  {
    id: "generic_http",
    name: "HTTP generico",
    description: "Webhook o API REST personalizzata.",
    method: "POST",
    url: "http://192.168.1.20/api/trigger",
    headers: {
      "Content-Type": "application/json"
    },
    body: "{\n  \"gesture\": \"{{gesture.name}}\",\n  \"score\": {{score}},\n  \"timestamp\": \"{{timestamp}}\"\n}"
  },
  {
    id: "home_assistant",
    name: "Home Assistant",
    description: "Chiamata a un servizio Home Assistant.",
    method: "POST",
    url: "http://homeassistant.local:8123/api/services/light/toggle",
    headers: {
      Authorization: "Bearer INSERISCI_TOKEN",
      "Content-Type": "application/json"
    },
    body: "{\n  \"entity_id\": \"light.studio\"\n}"
  },
  {
    id: "knx_gateway",
    name: "Gateway KNX",
    description: "Scrittura su indirizzo di gruppo tramite gateway REST.",
    method: "POST",
    url: "http://192.168.1.30/api/knx/write",
    headers: {
      "Content-Type": "application/json"
    },
    body: "{\n  \"groupAddress\": \"1/0/1\",\n  \"value\": true\n}"
  },
  {
    id: "ksenia_lares",
    name: "Ksenia Lares",
    description: "Esecuzione scenario domotico tramite API della centrale.",
    method: "POST",
    url: "http://192.168.1.40/api/scenarios/SCENARIO_ID/run",
    headers: {
      Authorization: "Bearer INSERISCI_TOKEN",
      "Content-Type": "application/json"
    },
    body: "{}"
  }
];

export function listIntegrationTemplates(_req, res) {
  return res.json({ templates: TEMPLATES });
}

