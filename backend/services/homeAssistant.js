export function createHomeAssistantRequest({ baseUrl, token, domain, service, entityId, data = {} }) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/services/${domain}/${service}`;

  return {
    method: "POST",
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      entity_id: entityId,
      ...data
    })
  };
}

