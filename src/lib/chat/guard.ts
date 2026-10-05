/**
 * Deterministic screening that runs BEFORE any model call. Questions that are clearly out of scope,
 * adversarial or abusive get a canned reply and never cost a token. Whatever passes is still
 * constrained by the system prompt, the token caps and the rate limits.
 */

export type Verdict =
  | { action: "allow" }
  | { action: "reply"; reason: GateReason; text: string };

export type GateReason =
  | "greeting"
  | "identity"
  | "injection"
  | "secrets"
  | "off_topic"
  | "private"
  | "advice"
  | "link"
  | "abuse"
  | "safety";

import { profile } from "@/data/profile";

const EMAIL = "sohenpatel.work@gmail.com";

const REPLIES: Record<GateReason, string> = {
  greeting:
    "Hi! I can answer questions about Sohen Patel's experience, projects, skills and education. Try asking about his legal AI project, the Market Research Agent, or his work at Ontario Health.",
  identity: `I am the assistant on Sohen Patel's portfolio, so I can only talk about him. In short: ${profile.summary}`,
  injection: `I can only answer questions about Sohen's background, projects and skills. Try one of the preset questions, or email ${EMAIL}.`,
  secrets:
    "I do not have access to any keys, credentials or system details, and I can only answer questions about Sohen's background, projects and skills.",
  off_topic: `I can only answer questions about Sohen Patel's background, projects, skills and education. Try asking about his projects or experience, or email ${EMAIL}.`,
  private: `I cannot share personal details or discuss salary, availability or work authorization. Please email Sohen directly at ${EMAIL}.`,
  advice:
    "I cannot give financial, legal or medical advice. I can tell you about Sohen's projects, including the Market Research Agent, which is for research and education only.",
  link: "I cannot open links or files. Ask me a question about Sohen's background, projects or skills instead.",
  abuse: "That request is too long or repetitive for me to handle. Please ask a short question about Sohen's background, projects or skills.",
  safety: "I cannot help with that. If you are in distress, please contact local emergency services or a crisis line.",
};

// Zero-width and line/paragraph separator characters, built from code points so the source stays plain ASCII.
const INVISIBLE = new RegExp(
  "[" + [[0x200b, 0x200f], [0x2028, 0x202f], [0x2060, 0x2060], [0xfeff, 0xfeff]].map(([a, b]) => String.fromCharCode(a) + "-" + String.fromCharCode(b)).join("") + "]",
  "g",
);

export function normalize(s: string): string {
  return s.normalize("NFKC").replace(INVISIBLE, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const reply = (reason: GateReason): Verdict => ({ action: "reply", reason, text: REPLIES[reason] });

// ------------------------------------------------------------ patterns
const SPECIAL_TOKENS =
  /<\|?\s*(system|im_start|im_end|endoftext|assistant|user)\s*\|?>|\[\/?inst\]|<<\/?sys>>|^#{1,3}\s*(system|instruction)s?\b|```\s*system/;

const INJECTION: RegExp[] = [
  /\b(ignore|disregard|forget|override|bypass|skip|drop|discard|overwrite)\b.{0,40}\b(previous|prior|above|earlier|preceding|all|any|your|the|these|those|safety|content)\b.{0,30}\b(instruction|instructions|rule|rules|prompt|prompts|guideline|guidelines|directive|directives|polic(y|ies)|restriction|restrictions|filter|filters|guardrail|guardrails|constraint|constraints)\b/,
  /\b(system|developer|hidden|initial|original|secret|internal|underlying|base|master)\s+(prompt|message|instruction|instructions|configuration|config)\b/,
  /\b(reveal|show|print|output|display|repeat|recite|leak|dump|disclose|expose|share|tell me|give me|what (is|are|was|were)|say)\b.{0,50}\b(your|ur|their|its|this (bot|assistant|chatbot)'?s?)\b.{0,25}\b(prompt|instructions|rules|configuration|settings|guidelines|programming|directives|guardrails)\b/,
  /\b(instructions?|rules|prompt) (you|u) (were|have been|are|got) (given|following|told)|\bwhat (were|are) you (told|instructed|programmed|asked|given)\b/,
  /\b(your|their) (full|complete|entire|whole|exact|original|verbatim) (instructions?|prompt|rules|guidelines)\b|\bkeys? ['"]?prompt['"]?\b/,
  /\b(please )?comply\b|\bfollow (these|the following|this|that) (instructions?|rules?|commands?|orders?)\b|\bthe following (text|message|instructions?) (comes|is|are|was) from\b/,
  /\bnew (task|topic|mission|objective|job|assignment)\b|\bforget (about )?(sohen|him|the portfolio|this site|your)\b|\bstop being\b|\binstead of (answering|being)\b|\bbe a (general|normal|regular|different)\b|\bnot (just|only) about sohen\b/,
  /\b(repeat|print|output|copy|echo|recite)\b.{0,30}\b(everything|all|the text|the words|text|content)\b.{0,25}\b(above|before|prior|preceding|earlier|so far)\b/,
  /\b(you are (now|no longer|actually|really)|from now on|starting now|new (role|persona|rules|instructions)|your new)\b/,
  /\b(pretend|imagine|suppose|assume)\b.{0,25}\b(you are|you're|to be|that you|you have no)\b/,
  /\b(act|behave|respond|answer|operate)\s+(as|like)\b(?!\s+(a\s+)?(recruiter|hiring))/,
  /\b(role[- ]?play|roleplay|play the role|persona|in character|stay in character)\b/,
  /\b(jailbreak|jail break|dan mode|do anything now|developer mode|debug mode|god mode|admin mode|sudo|unfiltered|uncensored|no restrictions|without restrictions|without (any )?(rules|limits|filters)|no filter)\b/,
  /\b(hypothetical(ly)?|fictional|in a story|for (educational|research|testing) purposes|thought experiment|just (kidding|testing)|as a (test|joke|game))\b/,
  /\b(base64|rot13|rot-13|hexadecimal|morse code|cipher|leetspeak|decode (this|the following)|encode (this|the following)|reverse (this|the following) text)\b/,
  /[a-z0-9+/=]{40,}/i,
  /ignora(r)?\s+(las|todas|tus)|ignorez|ignoriere|ignorer les|vergiss|oublie[sz]? (tout|les)|olvida|忽略|无视|忘记|игнориру|забудь|以前の指示|無視/,
  /\b(system override|new instructions?:|instructions? override)\b/,
  /\bcontext\s*[:=]\s*|\bassistant\s*:\s|\bsystem\s*:\s|\buser\s*:\s/,
  /\b(text|message|messages|instructions?|content|words?|prompt)\b.{0,30}\b(provided|given|sent|shown|written|supplied|fed)\b.{0,15}\bto you\b|\bbefore (my|the) (first|previous|earlier|initial) (message|question)\b/,
  /\b(site owner|admin(istrator)?|developer|creator|owner|operator|maintainer|root user)\b.{0,50}\b(authori[sz]\w*|permission|allow\w*|enable|disable|turn off|unlock|override)\b|\b(turn|switch|shut|take) off\b.{0,15}\b(your |the )?(filters?|rules|restrictions|safety|guardrails)\b|\bauthori[sz]ing you\b/,
  /\byour (instructions?|rules|guidelines|prompt|directives|programming|configuration)\b/,
  /\b(above|before) (the|this) (line|text|message|conversation|paragraph)\b|\bthe line that says\b|\bwritten above\b/,
  /\boverride mode\b|\bprint (the )?config\w*\b|\b(i am|i'm|im|this is) (sohen|the (owner|developer|admin|creator))\b/,
  /\b(complete|continue|finish|fill in)\b.{0,15}\b(this|the following)\b.{0,10}\b(text|sentence|prompt|passage|line)\b|\byou are the assistant on\b/,
  /\b(ignore|disregard|forget)\b.{0,25}\b(prior|previous|above|earlier|everything|all)\b.{0,15}\b(context|conversation|messages?|everything|that|before)\b|\banswer freely\b|\bwithout (any )?(restrictions?|limits?|rules)\b/,
  /\byour (memory|context|knowledge base|training data|hidden|secret)\b|\bcontents? of your\b/,
  /\bif you (were|weren't|are not|were not|had no|didn't have|did not have)\b|\bwhat would you (say|answer|do|reply)\b/,
  /\b(confirm|admit|tell me|say) (that )?you('?re| are)\b|\blist what you (can'?t|cannot|can not|are not allowed)\b|\bwhat (can'?t|cannot) you\b|\bwhat are you (not )?(allowed|able)\b/,
  /\bunrestricted\b|\bversion of you\b|\bevil (version|twin)\b|\bopposite day\b|\bgrandmother\b.{0,40}\b(read|prompts?|instructions?)\b/,
];

// Probing for keys or the way this site is built. Questions about a PROJECT's own keys, models or databases are fine.
// Bare "repeat that" or "say it again" with no topic: the earlier turn is unrelated or forged, so do not spend a model call.
const REPEAT_ONLY = /^(yes|yeah|ok|okay|sure|please|now)?[, ]*(repeat|say|print|show|send|give)( me)?( that| it| this| the (key|token|secret|code|password))( key| token| secret| code| password)?( again| once more)?[!. ]*$/;

const SECRETS = new RegExp(
  [
    String.raw`\b(your|ur|this (site|bot|server|website|chat|chatbot|assistant)'?s?|the (site|server|backend|admin)'?s?)\b.{0,25}\b(api[ _-]?keys?|secrets?|tokens?|passwords?|credentials?|\.env|environment variables?|env vars?|source|code|backend|database|redis|infrastructure|config\w*)\b`,
    String.raw`\b(give|show|tell|reveal|print|leak|share|send|dump|what('?s| is| are)|display)\b.{0,30}\b(api[ _-]?keys?|secret keys?|passwords?|credentials?|\.env|private keys?|(access|auth|bearer|session|refresh) tokens?|environment variables?|env vars?)\b`,
    String.raw`\bhow many (questions|messages|requests|queries|prompts) (can|may|am|could) (i|we)\b|\b(daily|global|hourly|per[- ]day|per[- ]user|per[- ]hour|rate|usage|question|message) (limit|limits|cap|quota)\b`,
    String.raw`\b(api|llm|ai|model) provider\b|\bpowers? (your|this (bot|site|chat|chatbot|assistant|website))\b|\byour (answers?|replies|responses)\b.{0,30}\b(powered|provider|cost|model|api)\b`,
    String.raw`\b(other|previous|earlier) (users?|visitors?|people|conversations?|chats?)\b|\bchat (logs?|history)\b|\bdo you (store|log|save|record|keep|track)\b`,
    String.raw`\b(hosting|host|database|backend|infrastructure|server|stack|cloud)\b.{0,40}\b(run|runs|power|powers|hosts?|use|uses|used|behind)\b.{0,25}\b(this|the) (site|website|bot|chatbot|chat|assistant|portfolio)\b`,
    String.raw`\b(clear|delete|reset|disable) (my |the )?(cookies|cache|local ?storage)\b|\b(vpn|proxy|incognito)\b|\b\d+\s*(questions|messages|requests)\b.{0,15}\b(day|hour)\b`,
    String.raw`\b(\.env|env file|server logs?|server config\w*|admin (panel|password|login))\b`,
    String.raw`\b(this|the) (site|website|bot|chatbot|chat|assistant|portfolio)\b.{0,40}\b(redis|upstash|vercel|database|rate[- ]?limit\w*|backend|infrastructure|hosting|built with|made with|powered by|llm|language model|api)\b`,
    String.raw`\b(redis|upstash|vercel|rate[- ]?limit\w*)\b.{0,40}\b(this|the|your) (site|website|bot|chatbot|chat)\b`,
    String.raw`\bhow (can|do|could) (i|we|you).{0,30}\b(bypass|get around|avoid|exceed|circumvent|beat|abuse)\b.{0,30}\b(limit|limits|rate|quota|restriction|restrictions|filter|filters)\b`,
  ].join("|"),
);

const IDENTITY =
  /\b(who are you|what are you(?! (doing|working))|tell me about (yourself|you)\b|introduce yourself|are you (chatgpt|gpt|claude|gemini|deepseek|llama|an? (ai|llm|bot|robot|human|real))|are you real|who (made|built|trained|created|developed|programmed) you|(which|what) (llm |ai |language )?(model|llm)s? (are you|do you use|powers|is this|does this)|your (provider|vendor|model)|who is your provider|what is your name)\b/;

const PRIVATE =
  /\b(phone|mobile|cell(phone)?|telephone|whatsapp|home address|street address|where does (he|sohen) live|(call|phone|ring|text|whatsapp|dm) (him|sohen)|\$\s?\d{2,3}\s?k\b|\$\s?\d{5,}|\b\d{2,3}\s?k\b|\b(offer|raise|pay him|his rate)\b|\bwould (he|sohen) (take|accept|consider|relocate|work for)\b|\bhe'?d (take|accept|consider)\b|\b(is|are) (he|sohen) (single|taken|dating|gay|straight|religious|rich|poor)\b|his (number|cell)|contact number|phone number|mobile number|where exactly\b.{0,15}\b(he|sohen)\b.{0,15}\b(live|stay|reside)|exact(ly)? (address|location)|home (address|location)|date of birth|birthday|how old|age|salary|salaries|compensation|pay (expectation|range)|expected pay|hourly rate|availability|available (to start|for (work|hire|hiring|an interview|interviews|a role|roles|full[- ]?time))|start date|notice period|when can (he|sohen) start|visa|work (permit|authori[sz]ation)|immigration|citizenship|citizen\w*|permanent resident|green card|nationality|work status|passport|sin|social insurance|marital|married|girlfriend|boyfriend|wife|spouse|dating|religio\w*|politic\w*|sexual|caste|ethnicity|race)\b/;

const ADVICE =
  /\b(should i (buy|sell|invest|short|trade|hold)|which stocks?|stock (tip|pick|recommendation)s?|buy or sell|financial advice|investment advice|trading advice|medical advice|diagnos(e|is)|prescri(be|ption)|legal advice|can i sue|tax advice|crypto (tip|advice)|(good|bad|safe|smart|worth)\b.{0,20}\b(investment|invest|buy|stock)|invest(ing)? in|undervalued|overvalued|price target)\b/;

const SAFETY =
  /\b(suicid\w*|kill myself|self[- ]?harm|hurt myself|end my life|bomb|explosives?|weapons?|how to (hack|steal|poison|stalk)|child abuse|rape|terroris\w*|nazi|porn\w*|nude|naked|sexy?|sexual\w*|fuck\w*|shit\w*|bitch\w*|asshole|racist|sexist|slur|offensive|derogatory|insult\w*|stereotype\w*|hate\w*)\b/;

const CREATIVE =
  /\b(write|compose|generate|create|make|tell|sing|give|draft)\b.{0,30}\b(poem|poetry|story|song|lyrics|joke|haiku|limerick|riddle|rap|sonnet|fiction|novel|fairy tale|bedtime)\b/;

const TASK_VERB =
  /\b(write|generate|create|compose|draft|make|build|code|implement|solve|calculate|compute|translate|rewrite|paraphrase|proofread|correct|fix|debug|refactor|optimi[sz]e|convert|summari[sz]e|explain|define|teach|derive|prove|simulate|predict|plan|recommend|suggest|give me|show me how|how (do|can|to|would) (i|you|we)|how to|help me|can you help|could you help|assist me|i need (help|you|a|an)|i want you to)\b/;

const TASK_OBJECT =
  /\b(script|program|function|class|algorithm|sql|query|regex|html|css|javascript|typescript|python|java|c\+\+|rust|golang|bash|shell|code|snippet|app|website|bot|essay|email|e-mail|letter|cover letter|speech|tweet|post|caption|slogan|article|blog|report|homework|assignment|exam|quiz|test|answer|recipe|itinerary|trip|workout|diet|meal|math|equation|integral|derivative|problem|puzzle|theorem|proof|paragraph|summary|translation|resume for|cv for|poem|steps to|tutorial|guide|lesson|plan for|business plan|marketing|pitch)\b/;

const COST_ABUSE =
  /\b(\d{3,}\s*(words?|times|lines?|paragraphs?|pages?|sentences?|characters?|tokens?|examples?|items?)|repeat .{0,30}(forever|infinitely|endlessly|over and over|\d{2,} times)|repeat your (answer|reply|response)|as (long|detailed) as possible|word for word|(very |extremely |super )+(long|detailed|lengthy)|every single|essay|exhaustive(ly)?|in (great|extreme|exhaustive) detail)\b/;

const GREETING =
  /^(hi|hello|hey|hiya|yo|sup|howdy|greetings|good (morning|afternoon|evening)|thanks|thank you|thx|ty|ok|okay|cool|great|nice|awesome|bye|goodbye|see you)( there| sohen| bot| assistant)?[!. ?]*$/;

/** Words that make a question plainly about Sohen, his work, or this portfolio. */
const DOMAIN =
  /\b(sohen|patel|portfolio|background|experience|experiences|projects?|skills?|education|degree|gpa|resume|cv|contact|linkedin|github|hire|hiring|hired|internship|intern|employers?|employment|career|university|meng|bachelor|thesis|scholarship|awards?|patents?|publications?|volunteer|volunteering|volunteered|mentorship|recognition|certifications?|coursework|courses|tech stack|technical skills|accomplishments?|achievements?|email|teaching assistant|expertise|gate|gold (standard |data)?set|gold dataset|prosecution|defense agent|judge agent|chain[- ]of[- ]thought|gold[- ]standard|golden set)\b/;

const ABOUT_HIM =
  /\b(who is (he|sohen)|about (him|sohen|yourself|you)|tell me about (him|you|yourself)|what (does|did|can|has|is|are) (he|sohen)|where (did|does|has|is) (he|sohen)|how (did|does|has|is|old) (he|sohen)|is (he|sohen)|has (he|sohen)|does (he|sohen)|did (he|sohen)|his (work|projects?|skills?|background|experience|resume|education|role|stack|code|repos?|repositories|github|portfolio|degree|gpa|grades|courses|awards|patents|volunteering|internships?|jobs?|employers?|team|manager|supervisors?|mentors?|contributions|achievements|strengths|weaknesses|interests|goals|results|numbers|metrics|models?|agents?|programming|languages|tools|frameworks|libraries|technolog\w+|hobbies|publications|certifications))\b/;

const STRONG = "(sohen|patel|he|him|his|himself|candidate|applicant)";
const ACTION =
  "(built|build|made|created|developed|designed|deployed|implemented|worked|work|studied|study|learned|know|knows|use|used|uses|using|achieved|achieve|done|do|did|has|have|had|led|lead|wrote|trained|evaluated|published|won|got|received|earned|completed|joined|handled|managed|contributed|focus|focused|specialize|specializes|good|strong|experienced|familiar|live|lives|studying|working)";
const SECOND = "(you|your|yours|yourself)";
const SECOND_ACTION =
  "(built|build|made|created|developed|designed|deployed|implemented|worked|studied|learned|achieved|led|trained|evaluated|published|completed|contributed|specialize|experienced|familiar|know|knows|use|used|using)";
const PERSON_ACTION = new RegExp(
  String.raw`\b${STRONG}\b.{0,40}\b${ACTION}\b|\b${ACTION}\b.{0,25}\b${STRONG}\b|\b${SECOND}\b.{0,40}\b${SECOND_ACTION}\b|\b${SECOND_ACTION}\b.{0,25}\b${SECOND}\b`,
);

/** Names that only exist on this portfolio. Mentioning one makes a question in scope on its own. */
const NAMES = [
  "ontario health", "deloitte", "arcelormittal", "am/ns", "amns", "isro", "hpair", "reach for the stars", "aga khan",
  "university of toronto", "uoft", "u of t", "gujarat", "market research", "legal agent", "legal ai", "workplan",
  "asl", "fingerspelling", "msft", "two-stage", "two stage", "volatility forecast", "volatility model", "direction classifier", "har-rv", "diebold", "legal system", "legal pipeline", "legal project", "legal case", "legal agents", "the judge", "judge's", "judge in", "the evaluation", "workplan agent", "quality gates", "colorization", "imdb", "life expectancy", "ieee-cis", "hot strip mill", "careercraft",
  "hirac", "trial replay", "gate xe", "gate exam", "this site", "this website", "this portfolio", "your site",
  "your portfolio", "your projects", "your resume", "your work", "your experience", "your skills",
];

/** Technology words. They count as in scope only together with a cue that the question is about Sohen. */
const TECH = [
  "copilot studio", "langgraph", "langfuse", "ragas", "deepeval", "dspy", "qdrant", "pgvector", "mlflow", "python", "pytorch",
  "docker", "fastapi", "langchain", "tensorflow", "scikit", "pandas", "sql", "aws", "llm", "mcp", "conformer", "lambdarank",
  "two-tower", "power bi", "sap data", "fraud", "forecasting", "recommender", "recommendation system", "multi-agent", "gaussian",
  "pca", "churn",
];

const STRONG_RE = /\b(sohen|patel|he|him|his|himself|candidate|applicant)\b/;

// Frames that ask for general knowledge or comparisons rather than facts about Sohen.
const GENERIC_FRAME =
  /\b(difference between|compare|comparison|versus|vs\.?|better than|best|top \d+|which is better|pros and cons|what is (a|an)|benefits of|how does .{1,30} work|under the hood)\b/;

export type Screened = { verdict: Verdict; normalized: string };

/** Screens one user message. Pure and fast; safe to call on every turn the model would see. */
export function screen(raw: string, siteTerm = false): Screened {
  const t = normalize(raw);
  const out = (v: Verdict): Screened => ({ verdict: v, normalized: t });

  if (GREETING.test(t)) return out(reply("greeting"));
  if (t.length < 2) return out(reply("off_topic"));

  if (/(.)\1{14,}/.test(t) || COST_ABUSE.test(t)) return out(reply("abuse"));
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ai|dev|app)\b\/?/.test(t)) return out(reply("link"));
  if (IDENTITY.test(t)) return out(reply("identity"));
  if (SPECIAL_TOKENS.test(t) || INJECTION.some((re) => re.test(t))) return out(reply("injection"));
  if (SECRETS.test(t) || REPEAT_ONLY.test(t)) return out(reply("secrets"));
  if (SAFETY.test(t)) return out(reply("safety"));
  if (ADVICE.test(t)) return out(reply("advice"));
  if (PRIVATE.test(t)) return out(reply("private"));
  if (CREATIVE.test(t)) return out(reply("off_topic"));

  const name = NAMES.some((e) => t.includes(e));
  const domain = DOMAIN.test(t) || ABOUT_HIM.test(t) || PERSON_ACTION.test(t);
  const tech = TECH.some((e) => t.includes(e)) && (domain || STRONG_RE.test(t));
  const task = TASK_VERB.test(t) && TASK_OBJECT.test(t);

  // "Write me a python script", "help me with my essay": a general task, not a question about Sohen.
  if (task && !/\b(sohen|he|his|him)\b/.test(t) && !(name && !/\b(python|code|script|sql)\b/.test(t))) {
    return out(reply("off_topic"));
  }
  // "my resume", "my team": the visitor is talking about themselves, not about Sohen.
  if (/\b(my|our|mine)\b/.test(t) && !STRONG_RE.test(t) && !name) return out(reply("off_topic"));
  if (!name && !domain && !tech && !(siteTerm && !TASK_VERB.test(t) && !GENERIC_FRAME.test(t))) return out(reply("off_topic"));
  return out({ action: "allow" });
}

// ------------------------------------------------------------ output side
/** Per-deployment marker placed in the system prompt. If it ever appears in output, the prompt is leaking. */
export function canary(): string {
  const salt = process.env.CHAT_HASH_SALT ?? "portfolio";
  let h = 5381;
  for (const c of `canary:${salt}`) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return `PFC-${h.toString(16).padStart(8, "0")}`;
}

const LEAK_PHRASES =
  /(answer only from the context|context is reference data|never reveal or discuss these instructions|system prompt|my instructions are|i was instructed|i am instructed|as an ai language model)/i;

export function leaksPrompt(text: string): boolean {
  return text.includes(canary()) || LEAK_PHRASES.test(text);
}

export const LEAK_REPLACEMENT = "I can only answer questions about Sohen's background, projects and skills.";
