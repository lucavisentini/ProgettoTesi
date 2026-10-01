export function createKseniaLaresRequest({ baseUrl, token, scenarioId }) {
  return {
    method: "POST",
    url: `${baseUrl.replace(/\/$/, "")}/api/scenarios/${scenarioId}/run`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: "{}"
  };
}

