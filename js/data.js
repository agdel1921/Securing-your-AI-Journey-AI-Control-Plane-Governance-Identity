/* ------------------------------------------------------------------
   Simulated data for the "Securing your AI Journey" executive demo.
   EVERYTHING here is illustrative. No real client, system or
   personal data is used. Replace with real baselines in a workshop.
------------------------------------------------------------------- */
window.DEMO = {

  regions: {
    APAC:   "Asia Pacific",
    EU:     "Europe",
    MEA:    "Middle East & Africa",
    AMER:   "Americas",
    Global: "Group / Global"
  },

  systems: [
    "Terminal operations",
    "Customs & trade documents",
    "Finance & procurement",
    "People data",
    "Equipment & safety systems",
    "Customer portal"
  ],

  /* scope levels: 0 = no access, 1 = read only, 2 = act with human approval, 3 = act within guardrails */
  scopeLabels: ["No access", "Read only", "Act with approval", "Act within guardrails"],

  autonomyTiers: [
    { level: 0, name: "Observe",            desc: "Watches and reports. Takes no action." },
    { level: 1, name: "Recommend",          desc: "Suggests actions. A person decides and executes." },
    { level: 2, name: "Act with approval",  desc: "Prepares the action. A named person must approve." },
    { level: 3, name: "Act within limits",  desc: "Acts alone inside pre-agreed limits. Everything is logged." },
    { level: 4, name: "Autonomous",         desc: "Broad independent action. Reserved for low-impact, proven use cases." }
  ],

  agents: [
    { id: "AG-001", name: "Berth Planning Agent",        domain: "Operations",  region: "APAC",   origin: "In-house",        autonomy: 2, data: "Medium", status: "Governed",   owner: "Head of Vessel Planning",   scopes: [2,1,0,0,0,1], risk: 46 },
    { id: "AG-002", name: "Yard Optimisation Agent",     domain: "Operations",  region: "EU",     origin: "In-house",        autonomy: 3, data: "Low",    status: "Governed",   owner: "Yard Operations Lead",      scopes: [3,0,0,0,0,0], risk: 38 },
    { id: "AG-003", name: "Crane Scheduling Assistant",  domain: "Operations",  region: "APAC",   origin: "Vendor-embedded", autonomy: 1, data: "Low",    status: "Governed",   owner: "Equipment Manager",         scopes: [1,0,0,0,1,0], risk: 52 },
    { id: "AG-004", name: "Gate & Truck Appointment",    domain: "Operations",  region: "MEA",    origin: "In-house",        autonomy: 3, data: "Medium", status: "Governed",   owner: "Gate Operations Lead",      scopes: [3,0,0,0,0,1], risk: 41 },
    { id: "AG-005", name: "Customs Documentation Agent", domain: "Trade",       region: "EU",     origin: "In-house",        autonomy: 2, data: "High",   status: "Governed",   owner: "Trade Compliance Manager",  scopes: [1,2,0,0,0,1], risk: 63 },
    { id: "AG-006", name: "Predictive Maintenance Agent",domain: "Engineering", region: "Global", origin: "Vendor-embedded", autonomy: 2, data: "Low",    status: "Review",     owner: "Engineering Director",      scopes: [1,0,2,0,1,0], risk: 58 },
    { id: "AG-007", name: "Vessel ETA Prediction",       domain: "Operations",  region: "Global", origin: "In-house",        autonomy: 1, data: "Low",    status: "Governed",   owner: "Network Planning Lead",     scopes: [1,0,0,0,0,0], risk: 22 },
    { id: "AG-008", name: "Customer Service Assistant",  domain: "Commercial",  region: "AMER",   origin: "Vendor-embedded", autonomy: 2, data: "High",   status: "Review",     owner: "Customer Experience Lead",  scopes: [1,0,0,0,0,3], risk: 61 },
    { id: "AG-009", name: "Procurement Assistant",       domain: "Finance",     region: "EU",     origin: "Vendor-embedded", autonomy: 2, data: "Medium", status: "Review",     owner: "Procurement Manager",       scopes: [0,0,2,0,0,0], risk: 55 },
    { id: "AG-010", name: "Security Triage Agent",       domain: "Cyber",       region: "Global", origin: "In-house",        autonomy: 2, data: "High",   status: "Governed",   owner: "Chief Information Security Officer", scopes: [1,1,0,1,1,0], risk: 49 },
    { id: "AG-011", name: "HR Policy Q&A Bot",           domain: "People",      region: "APAC",   origin: "Vendor-embedded", autonomy: 1, data: "High",   status: "Governed",   owner: "HR Business Partner",       scopes: [0,0,0,1,0,0], risk: 44 },
    { id: "AG-012", name: "Spreadsheet Automation Agent",domain: "Finance",     region: "AMER",   origin: "Unmanaged",       autonomy: 3, data: "High",   status: "Unmanaged",  owner: "Not assigned",              scopes: [0,0,3,1,0,0], risk: 89 },
    { id: "AG-013", name: "Sales Copilot (SaaS add-on)", domain: "Commercial",  region: "EU",     origin: "Unmanaged",       autonomy: 1, data: "High",   status: "Unmanaged",  owner: "Not assigned",              scopes: [0,0,0,0,0,1], risk: 72 },
    { id: "AG-014", name: "Contractor-built Chat Bot",   domain: "Operations",  region: "MEA",    origin: "Unmanaged",       autonomy: 2, data: "Medium", status: "Unmanaged",  owner: "Not assigned",              scopes: [2,1,0,0,0,0], risk: 81 }
  ],

  /* Policy simulator scenarios */
  scenarios: [
    { id: "s1", title: "Summarise yard congestion for the shift supervisor", impact: "low", info: true, personalData: false, area: "Terminal operations",
      note: "Information only. No change to operations." },
    { id: "s2", title: "Move a vessel's berth window by 90 minutes",          impact: "medium",   personalData: false, area: "Terminal operations",
      note: "Operational change. Affects cranes, trucks and downstream vessels." },
    { id: "s3", title: "Release a customs hold on a container",              impact: "high",     personalData: false, area: "Customs & trade documents",
      note: "Regulatory decision with legal accountability." },
    { id: "s4", title: "Share driver and crew details with an external analytics vendor", impact: "high", personalData: true, area: "People data",
      note: "Personal data leaving the organisation." },
    { id: "s5", title: "Approve a USD 250,000 spare-parts order",            impact: "high",     personalData: false, area: "Finance & procurement",
      note: "Financial commitment above delegated authority." },
    { id: "s6", title: "Override a crane safety interlock to save time",     impact: "critical", personalData: false, area: "Equipment & safety systems",
      note: "Physical safety. Never delegated to an agent." }
  ],

  /* Live control-plane event templates */
  events: [
    { agent: "Yard Optimisation Agent",      region: "EU",   text: "Re-sequenced 42 container moves",                 decision: "Allowed",  policy: "Within operating limits" },
    { agent: "Berth Planning Agent",         region: "APAC", text: "Proposed berth shift of 75 min",                  decision: "Approval", policy: "Berth change needs planner approval" },
    { agent: "Customs Documentation Agent",  region: "EU",   text: "Requested release of held container",             decision: "Approval", policy: "Regulatory decisions need a named officer" },
    { agent: "Spreadsheet Automation Agent", region: "AMER", text: "Tried to export payroll extract to external site", decision: "Blocked",  policy: "Personal data cannot leave approved systems" },
    { agent: "Gate & Truck Appointment",     region: "MEA",  text: "Rebooked 18 truck slots after delay",             decision: "Allowed",  policy: "Within operating limits" },
    { agent: "Procurement Assistant",        region: "EU",   text: "Drafted purchase order of USD 180,000",           decision: "Approval", policy: "Spend above delegated limit" },
    { agent: "Predictive Maintenance Agent", region: "Global", text: "Raised maintenance ticket for crane motor",     decision: "Allowed",  policy: "Within operating limits" },
    { agent: "Customer Service Assistant",   region: "AMER", text: "Answered 120 booking queries",                    decision: "Allowed",  policy: "Within operating limits" },
    { agent: "Contractor-built Chat Bot",    region: "MEA",  text: "Attempted to read gate system without identity",  decision: "Blocked",  policy: "Unregistered agents have no access" },
    { agent: "Security Triage Agent",        region: "Global", text: "Closed 63 low-risk alerts, escalated 2",        decision: "Allowed",  policy: "Within operating limits" },
    { agent: "Crane Scheduling Assistant",   region: "APAC", text: "Suggested crane reassignment",                    decision: "Allowed",  policy: "Recommendation only" },
    { agent: "Sales Copilot (SaaS add-on)",  region: "EU",   text: "Sent customer data to a non-approved region",     decision: "Blocked",  policy: "Data residency rule (EU)" }
  ],

  /* GRC matrix: rows = regions, columns = obligation areas.
     status: aligned | progress | gap. Wording is illustrative, to be confirmed with Legal. */
  grcColumns: ["AI-specific rules", "Data protection", "Critical infrastructure & cyber", "Port & maritime security"],
  grc: [
    { region: "Asia Pacific", cells: [
      { s: "aligned",  t: "Voluntary AI governance guidance",       d: "Voluntary model AI governance guidance applies in Singapore. Controls mapped; evidence collected automatically." },
      { s: "aligned",  t: "National data protection law",           d: "Consent, purpose and retention rules mapped to agent access policies." },
      { s: "progress", t: "Critical infrastructure obligations",    d: "Agent change management is being added to the incident and change process." },
      { s: "aligned",  t: "Port facility security plans",           d: "Agent access to security-relevant systems covered by the facility security plan." }
    ]},
    { region: "Europe", cells: [
      { s: "progress", t: "EU AI Act classification",               d: "Use cases are being classified by risk. High-risk uses need human oversight, logging and documentation." },
      { s: "aligned",  t: "GDPR and data residency",                d: "Residency rules enforced at runtime. Cross-border transfers blocked unless approved." },
      { s: "progress", t: "NIS2-style security duties",             d: "Supply-chain and incident-reporting duties extended to AI agents and vendors." },
      { s: "aligned",  t: "Port facility security plans",           d: "Agent access aligned with facility security assessments." }
    ]},
    { region: "Middle East & Africa", cells: [
      { s: "progress", t: "Emerging national AI strategies",        d: "Rules vary by country and are changing. A baseline standard is applied everywhere." },
      { s: "progress", t: "Local data protection laws",             d: "Country-by-country mapping under way." },
      { s: "gap",      t: "Local cyber requirements",               d: "Inventory shows unmanaged agents in this region. Priority for Phase 1." },
      { s: "aligned",  t: "Port facility security plans",           d: "Covered by the Group security baseline." }
    ]},
    { region: "Americas", cells: [
      { s: "aligned",  t: "Voluntary risk framework adopted",       d: "A recognised AI risk management framework is used as the internal baseline." },
      { s: "gap",      t: "State and national privacy laws",        d: "Unmanaged agents handle personal data. Remediation is planned." },
      { s: "progress", t: "Sector cyber requirements",              d: "Reporting and access controls are being aligned." },
      { s: "aligned",  t: "Port facility security plans",           d: "Covered by the Group security baseline." }
    ]}
  ],

  roadmap: [
    { when: "First 90 days", name: "Foundation",
      items: ["Complete the enterprise-wide AI agent inventory, including vendor-embedded and unmanaged agents",
              "Name an accountable owner for every agent",
              "Agree autonomy tiers and what is never delegated (for example, safety)",
              "Publish one global AI policy baseline, with regional additions"],
      outcome: "Full visibility and clear accountability" },
    { when: "3 to 12 months", name: "Scale with control",
      items: ["Give every agent its own identity and short-lived, least-privilege access",
              "Turn on policy enforcement and the control plane in two pilot regions",
              "Add approval flows for high-impact actions",
              "Start automated evidence for audit and regulators"],
      outcome: "Faster, safer rollout of new AI use cases" },
    { when: "12 to 24 months", name: "Optimise and assure",
      items: ["Extend to all terminals and regions",
              "Continuous assurance: testing, monitoring and drift checks",
              "Expand autonomy where evidence shows it is safe",
              "Report AI risk and value to the Board each quarter"],
      outcome: "Trusted autonomy at network scale" }
  ],

  /* Presenter notes: shown with the N key */
  notes: [
    "Open with the message: this is a point of view on how to scale AI safely, not a product demonstration. Everything on screen is simulated. Ask the audience what AI they already use today. (2 min)",
    "AI is moving from tools that answer questions to agents that take actions. In a port network, actions touch vessels, cranes, customs and people. The question for leadership changes from 'can we use AI' to 'can we trust it to act'. (3 min)",
    "Walk the five questions. Stress that this is a business framework. Then show the 'what we added' panel: agent identity, autonomy tiers, vendor-embedded AI, resilience, and accountability. These are often missing from first-generation AI programmes. (3 min)",
    "Discovery comes first because you cannot govern what you cannot see. Click 'Unmanaged' to show the agents nobody owns. Point out that vendor-embedded AI is often the biggest blind spot. (4 min)",
    "Treat agents like staff: each has an identity, a named manager, a purpose and only the access it needs. Select an agent, then press 'Request elevated access' to show time-limited, approved access. (4 min)",
    "This is the heart of the demo. Pick a scenario, change the autonomy level and where the agent runs. Show that the same request gets different, explainable outcomes. Finish on the safety-critical scenario: some actions are never delegated. (5 min)",
    "The control plane is the shared cockpit across regions. Let the feed run. Click 'Pause' on an agent to show the kill switch and the fall-back to manual operations. Emphasise resilience and 24/7 operations. (3 min)",
    "Regulation differs by region, but the control framework can be one. Click cells to show what each means. Be open that the red cells are where to focus first. Confirm exact legal positions with Legal and Compliance. (3 min)",
    "Move the sliders. All figures are illustrative placeholders. Offer to replace them with the Port Authority's own baselines in a follow-up working session. The main point: governance is what unlocks scale, not what slows it. (4 min)",
    "Close with the three-horizon roadmap and the four decisions. Ask for agreement on the first 90 days and an executive sponsor. (3 min)"
  ]
};
