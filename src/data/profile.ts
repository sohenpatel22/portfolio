export const profile = {
  name: "Sohen Patel",
  handle: "sohenpatel22",
  role: "AI / ML Engineer",
  tagline:
    "I build and evaluate LLM, agentic and applied ML systems, and I measure whether they actually work.",
  location: "Toronto, ON, Canada",
  email: "sohenpatel.work@gmail.com",
  linkedin: "https://www.linkedin.com/in/sohen-patel",
  github: "https://github.com/sohenpatel22",
  resume: "/Sohen_Patel_Resume.pdf",
  photo: "/headshot.jpg",
  summary:
    "I am an MEng student at the University of Toronto (GPA 3.81/4.0, graduating Jan 2027) who builds LLM and agentic systems and then measures whether they actually work. I shipped an enterprise agent to 5,000+ employees at Ontario Health, led a student team building a six-agent consulting system for a Deloitte-sponsored practicum, and I am building a multi-agent legal reasoning system for my research project. Before AI, I spent a year turning plant data into decisions at ArcelorMittal Nippon Steel. I care about honest baselines, gold-standard datasets and systems people can trust.",
};

export const stats = [
  { value: 5000, suffix: "+", label: "employees using the Ontario Health News Agent I built" },
  { value: 124, suffix: "%", label: "F1 gain from Chain-of-Thought prompting (0.25 → 0.57)" },
  { value: 129, suffix: "", label: "automated tests behind the 6-agent Deloitte practicum system" },
  { value: 46, suffix: "%", label: "NDCG@10 lift from a two-stage recommender" },
];

export const experience = [
  {
    role: "Teaching Assistant",
    org: "University of Toronto",
    place: "Toronto, ON",
    period: "Sep 2026 – Present",
    bullets: [
      "MIE354 Business Process Engineering: supporting course delivery, lab sessions, student assignments, exam grading and assessments.",
      "MIE1628 Cloud-Based Data Analytics: supporting student assignments, exam grading and lab work.",
    ],
  },
  {
    role: "AI Research Intern",
    org: "Ontario Health",
    place: "Toronto, ON",
    period: "Jul 2026 – Sep 2026",
    bullets: [
      "Built an enterprise Ontario Health News Agent in Microsoft Copilot Studio end-to-end, deployed to 5,000+ employees org-wide.",
      "Created a 248-item human-verified gold-standard dataset for 3 healthcare tasks; built an end-to-end LLM evaluation framework for 5 models (GPT-5, Claude, Gemini, MS Copilot, Perplexity) across 13+ metrics using RAGAS, DeepEval and LLM-as-a-Judge.",
      "Ran prompt-engineering experiments across 4 strategies: Chain-of-Thought on a 5-year dataset doubled the agent's F1 (0.25 → 0.57, +124%) and cut hallucination rate by 51% (78% → 27%).",
    ],
    more: [
      {
        title: "The agent",
        items: [
          "Three tasks, each with its own window: PHIPA privacy-decision news (last 6 months), hospital leadership and CEO changes (last 5 years), and interim supervisors appointed by the Province (last 5 years).",
          "Guardrails written into the agent's instructions: defined news criteria (clinical services and leadership in, recruitment ads and fundraising out), an approved hospitals-by-region document as the single source of truth instead of geographic guesses, trusted sources first (mainstream media, official hospital sites, the privacy commissioner), and mandatory citations with date, publisher, title and URL. Results come back as a chronological table by region and hospital, exportable to Word.",
          "Tested the same agent on Claude and GPT model variants inside Copilot Studio before choosing what to roll out.",
        ],
      },
      {
        title: "Building the ground truth",
        items: [
          "Built the gold dataset by hand from primary sources such as hospital announcements and government orders, tiered by confidence (dated announcement, undated, inferred) so a recall number could be split by how certain the answer was.",
          "Tagged every gold row by origin (agent-derived, other-tool-derived, independent research) and reported recall on the independent subset too. Several facts entered the gold set because a system under test surfaced them; without that split the agent would get credit for answers it helped write.",
        ],
      },
      {
        title: "Evaluation framework",
        items: [
          "Combined Copilot Studio's built-in LLM-judge metrics (relevance, groundedness, completeness, abstention) with RAGAS and DeepEval answer relevancy and factual correctness, entity-level precision/recall/F1, and custom scoring for citation validity.",
          "Custom metrics beyond F1: recall by confidence tier, specificity of dates, field-level accuracy (role, date, direction), omission rate, hallucination rate, completeness across hospitals, and run-to-run consistency measured as pairwise Jaccard similarity over repeated runs.",
          "Every returned item with no gold match was adjudicated into one of five buckets (gold gap, hallucination, wrong attribution, out of window, out of scope), so precision and hallucination were not inflated by real-but-unlisted answers. Errors were then classified into a fixed six-way taxonomy. Confidence intervals came from bootstrap resampling.",
          "Kept tasks separate instead of pooling: the PHIPA window is 6 months and the leadership window 5 years, so their numbers are not comparable.",
        ],
      },
      {
        title: "Debugging the evaluator itself",
        items: [
          "Found and fixed three scorer bugs: table header rows counted as answers (inflating hallucination), ambiguous first names matching the wrong person, and a completeness score stuck at 1.0.",
          "Later found that a person with several career events at one hospital was being matched to whichever gold row came first. Re-scoring by date and direction repointed 161 matches across 26 files and raised recall and date accuracy for every system.",
          "Checked the automated judge against a stratified 70-item hand re-adjudication: 4 disagreements (about 6%), all traced to that same matching bug. I did not report an inter-rater kappa because the second reviewer was not independent.",
        ],
      },
      {
        title: "What the experiments showed",
        items: [
          "Chain-of-thought helped at scale but hurt on the small set. On the 5-year dataset it lifted the best system's F1 from 0.254 to 0.569 and cut hallucination from 78% to 27%. On the short 6-month set the same technique made models over-extract, and hallucination rose above 80%.",
          "Structured, field-by-field prompts raised recall but pushed ChatGPT's hallucination rate from 0% to 40%: a straight recall-precision trade-off.",
          "Consistency across repeat runs varied a lot: under the baseline prompt some general-purpose chatbots scored as low as 0.14, while the Copilot agent with chain-of-thought reached a perfect 1.0.",
          "Even the best system found fewer than half of the leadership changes, so the honest conclusion was a useful first pass that needs human verification, not automation.",
          "Most common real errors: no usable citation link (214 of 297 matched items), wrong role title (189) and wrong date (119). One person was completely fabricated by one run of one system, confirmed against the hospital's own records.",
          "Root cause of many failures was the prompt, not the model. Windows like 'last 5 years' and terms like 'leadership' were ambiguous, so I proposed explicit date ranges and written in-scope and out-of-scope definitions.",
        ],
      },
      {
        title: "Communication",
        items: [
          "Produced briefing decks on Copilot agents, evaluation methodology and results for supervisors and team leads, and drafted a research write-up of the evaluation.",
        ],
      },
    ],
  },
  {
    role: "AI Engineering Project Team Lead",
    org: "Deloitte (Sponsored Practicum)",
    place: "Toronto, ON",
    period: "May 2026 – Jun 2026",
    bullets: [
      "Built a 6-agent system that turns a client brief into consulting deliverables (WBS, RACI, RAID, weekly status report) with a human-in-the-loop revision loop and Deloitte template sync for DOCX/XLSX exports, backed by 129 automated tests.",
      "Added an LLM routing layer with fallback across 4 backends (Claude, GPT, Gemini, DeepSeek) and prompt-cache warm-up to cut repeated token cost.",
      "Built a 13-rule Quality Gates engine (graph-based WBS cycle detection, RAID/RACI cross-artifact validation).",
    ],
    more: [
      {
        title: "How I built it",
        items: [
          "Grew the system in stages: command-line prototype, then specialist agents with Pydantic schemas, a provider layer for multiple LLMs, rendering and templates, a FastAPI backend with a web UI, file upload and export, confirmation questions before generation, quality gates, and artifact versioning with streaming.",
          "Grounded output in the firm's own templates. A sync script extracts column names, examples and structure from the real WBS, RAID, stakeholder and status-report templates into machine-readable specs that are injected into the prompts, so generated documents match the format reviewers expect.",
          "Compared three generation strategies: free-form markdown, structured JSON rendered afterwards, and template-guided structured generation. Structured and template-guided output was the easiest to validate and the closest to the target format.",
          "Ran model ablations by holding agents, schemas, prompts and templates fixed and swapping only the model, scoring completeness, template alignment, schema validity, speed and cost. Smaller models were cheaper and faster, larger ones reasoned better, and strict schemas plus template grounding narrowed the gap.",
        ],
      },
      {
        title: "Human in the loop",
        items: [
          "The system asks the reviewer to confirm open questions from the brief before it generates anything, instead of guessing.",
          "Reviewer feedback is scoped to one artifact at a time; each revision creates a new version with a diff, and linked artifacts (work packages, owners, risks) are reconciled afterwards.",
          "A quality-gates checklist lists what a human must still verify, and a failure-mode table records each known way the agents go wrong with its mitigation.",
        ],
      },
      {
        title: "Engineering",
        items: [
          "Prompt caching: stable context (parsed brief, WBS, RACI) is cached and warmed before the expensive generation calls to cut repeated token cost.",
          "Runs offline with a mock LLM, so demos and CI never need API keys.",
          "129 tests written alongside the code, covering agents, API, caching, exports and artifact links.",
        ],
      },
    ],
  },
  {
    role: "Graduate Engineer Trainee",
    org: "ArcelorMittal Nippon Steel India (AM/NS)",
    place: "Surat, India",
    period: "Aug 2024 – Aug 2025",
    bullets: [
      "Used SAP datasets and project logs for real-time monitoring of compliance metrics and workflows, supporting executive decisions across 12 cross-functional departments.",
      "Designed Power BI dashboards tracking KPIs, resources and progress for a plant expansion from 7 to 14 MMTPA.",
      "Identified workflow bottlenecks and execution gaps, contributing to a 16.7% reduction in project timelines.",
    ],
    more: [
      {
        title: "Scope",
        items: [
          "Worked with 12 department heads, under the plant's Executive Director, on the upstream expansion project. The goal was to shorten the timeline by two months (the 16.7% improvement) and double steel capacity from 7 to 14 MMTPA by December 2025.",
          "Assessed optimum production levels and utilisation of machinery, raw materials and consumables at Hot Strip Mill #1 and #2.",
          "Analysed production and indirect costs for plant facilities under the Operation Integration Group.",
          "Ran HIRAC (hazard identification, risk assessment and control) and PSM (process safety management) reviews to strengthen health, safety and hazard prevention.",
        ],
      },
      {
        title: "The analytics angle",
        items: [
          "The work was mostly turning messy operational data (SAP records, project logs, utilisation and cost figures) into numbers a decision-maker could act on: which mill or facility was under-utilised, where cost sat, and where the schedule was slipping.",
          "Building KPI dashboards across 12 departments meant agreeing what each metric meant with the team that owned it before visualising it. I now do the same when defining evaluation metrics for LLM systems.",
        ],
      },
    ],
  },
];

export const skills = [
  { group: "Languages & Data", items: ["Python", "SQL (MySQL, PostgreSQL)", "Pandas", "NumPy", "Statsmodels", "Matplotlib", "Seaborn", "Plotly", "Power BI"] },
  { group: "ML & Deep Learning", items: ["scikit-learn", "PyTorch", "Transformers", "LSTM", "GMMs", "Time Series", "ROC-AUC / F1 / NDCG"] },
  { group: "LLMs & Agentic AI", items: ["LangChain", "RAG", "Vector DBs", "Prompt Engineering", "Pydantic", "RAGAS", "DeepEval", "Streamlit", "Hugging Face"] },
  { group: "MLOps & Deployment", items: ["Git / GitHub", "Docker", "FastAPI", "MLflow", "DVC", "pytest", "CI/CD", "AWS (S3, EC2, SageMaker, Bedrock)"] },
];

export type Education = {
  school: string;
  degree: string;
  period: string;
  note: string;
  highlights: { label: string; text: string }[];
  patents?: { intro: string; items: { title: string; number: string; filed: string }[] };
  showCoursework?: boolean;
};

export const education: Education[] = [
  {
    school: "University of Toronto",
    degree: "Master of Engineering, Data Analytics and Machine Learning",
    period: "Sep 2025 – Expected Jan 2027",
    note: "GPA 3.81/4.0",
    highlights: [
      {
        label: "Scholarship",
        text: "Aga Khan Foundation International Scholarship (Jul 2025), awarded to one of the few students from India and covering the full program.",
      },
    ],
    showCoursework: true,
  },
  {
    school: "L.D. College of Engineering, Gujarat Technological University",
    degree: "B.E. Mechanical Engineering",
    period: "Jul 2021 – Jul 2024",
    note: "CGPA 8.40/10",
    highlights: [{ label: "Exam", text: "All-India Rank 3465 in GATE XE 2023, a national-level engineering examination." }],
    patents: {
      intro: "Filed from my ISRO research internship.",
      items: [
        {
          title: "Coarse Actuation Mechanism for Primary Optics Deployment in CubeSat-Based Space Telescopes for Sub-Meter Resolution Imaging Applications",
          number: "IN:202421088072",
          filed: "Nov 14, 2024",
        },
        {
          title: "Fine Actuation Device for Precision Alignment of Primary Optics in Deployable Space Telescopes",
          number: "IN:202421087180",
          filed: "Nov 12, 2024",
        },
      ],
    },
  },
];

export const coursework = [
  { name: "Introduction to Machine Learning" },
  { name: "Introduction to Deep Learning" },
  { name: "Data Science Methods and Statistical Learning" },
  { name: "Foundations of Data Analytics and ML" },
  { name: "AI in Finance: Neural Networks to Deep Learning" },
  { name: "Management Consulting for Engineers" },
  { name: "Project Management" },
  { name: "MEng Research Project", inProgress: true },
];

export const recognition = [
  {
    title: "Delegate, Harvard Project for Asian and International Relations (HPAIR) Asia Conference",
    detail: "Hong Kong, August 2023 · attended on a scholarship",
    text: "HPAIR is a student-run Harvard College organisation, founded in 1991, that hosts an annual conference for students and young professionals on the economic, political and social issues facing the Asia-Pacific. The 2023 conference in Hong Kong brought together keynotes, fireside chats and team impact challenges. It deepened my understanding of global issues and collaboration, and I am grateful for the scholarship that made it possible.",
  },
  {
    title: "Reach for the Stars (RFS) Mentorship Program, Cycle 6",
    detail: "National-level programme",
    text: "Selected among the top 60 students for a mentorship programme organised at the national level.",
  },
];

export const volunteering = [
  {
    role: "Speaker",
    org: "Aga Khan Foundation",
    period: "Jun 2024 – Jul 2024",
    text: "Gave a national webinar, 'Dream of Becoming an Engineer?', for the CareerCraft program of the Aga Khan Education Board for India, guiding students across India on choosing engineering career paths. Received a Letter of Appreciation.",
  },
  {
    role: "MIS Incharge",
    org: "Aga Khan Foundation",
    period: "Mar 2019 – Mar 2024",
    text: "Maintained and regulated attendance records in the portal for religious classes run under the Ismaili Tariqah and Religious Education Board for India (ITREB).",
  },
  {
    role: "Volunteer",
    org: "Aga Khan Foundation",
    period: "Mar 2020 – Mar 2022",
    text: "Managed and oversaw virtual religious classes during the COVID-19 pandemic under ITREB.",
  },
  {
    role: "Member",
    org: "Aga Khan Foundation",
    period: "Mar 2019 – Mar 2021",
    text: "Part of a volunteer team supporting young people, with a focus on sports, under the Aga Khan Youth and Sports Board for India (AKYSB).",
  },
];
