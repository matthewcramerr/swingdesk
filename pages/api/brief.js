// In-memory store for the daily briefing
// In production this persists within the same serverless instance
// For multi-instance reliability, this uses a simple date-keyed approach

let briefStore = {
  date: null,
  data: null,
};

export function storeBrief(data) {
  const today = new Date().toISOString().split("T")[0];
  briefStore = { date: today, data };
}

export function getBrief() {
  const today = new Date().toISOString().split("T")[0];
  if (briefStore.date === today && briefStore.data) {
    return briefStore.data;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const brief = getBrief();
    if (brief) {
      return res.status(200).json({ hasData: true, data: brief });
    }
    return res.status(200).json({ hasData: false, data: null });
  }

  if (req.method === "POST") {
    // Store a brief manually (called by cron)
    const { data } = req.body;
    if (data) {
      storeBrief(data);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "No data provided" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
