export function createKnxGatewayRequest({ baseUrl, groupAddress, value }) {
  return {
    method: "POST",
    url: `${baseUrl.replace(/\/$/, "")}/api/knx/write`,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      groupAddress,
      value
    })
  };
}

