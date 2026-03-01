# Koray Tuğberk GÜBÜR “Holistic SEO / Topical Authority” Methodology  
**Purpose:** Build a technical, agent-trainable reference that summarizes Koray Tuğberk GÜBÜR’s *Holistic SEO / Topical Authority* approach (often casually called “Koray methodology”), with emphasis on **entity-first topical mapping**, **semantic content networks**, **algorithmic authorship**, **internal linking via contextual bridges**, and **use of statistics / historical data** — tailored for **ecommerce** and **niche sites**.

**Audience:** SEO engineers, content systems builders, and AI-agent developers.

**Version:** 2026‑03‑01 (Asia/Colombo)  
**Note:** This file is a *methodology summary* with links to primary sources; it does **not** reproduce Koray’s paid course materials and avoids long verbatim quotations.

---

## 0) Important warnings (read first)

### 0.1 Don’t “copy Koraynese” footprints
If you rigidly template headings and sentence patterns, you can create a detectable “template footprint” across thousands of pages (especially programmatic ecommerce). Use *algorithmic authorship* as a **controlled writing system**, not a robotic cookie-cutter.

### 0.2 Separate “Koray’s primary writing” vs community summaries
There are many third-party writeups claiming “41 rules” or a definitive list of “Koray rules.” Treat them as **interpretations unless published directly by Koray**. Use **HolisticSEO.digital + Oncrawl + Koray’s own Medium/LinkedIn/YouTube** as primary corpus, and community posts as secondary.

### 0.3 Be careful with programmatic ecommerce pages
Programmatic “thin” pages (near-duplicate facets, weak unique value, auto-spun copy) often increase crawl cost and dilute topical/quality signals. If you scale, scale *coverage + usefulness*, not page count.

### 0.4 AI content risks
AI-generated content can be fine if it is **accurate, attributable, updated, and human-reviewed**. But hallucinated facts, invented citations, or fake expertise harm trust. In Koray’s framing, the goal is to be an understood, reliable source; fabricated claims undermine that.

---

## 1) What people mean by “Koray methodology” (high-level)

In SEO communities, “Koray methodology” usually means a **semantic SEO** framework that tries to make your site become a **topical authority** by:

1. **Modeling a knowledge domain** (topic universe) as an **entity network** (entities, attributes, values).
2. Building a **Topical Map** that covers core + outer sections, using **query templates** and **document templates**.
3. Publishing in a deliberate order to form a **Semantic Content Network** (SCN).
4. Using **Algorithmic Authorship**: repeatable writing constraints that improve machine understanding (context, heading hierarchy, sentence-level relevance, definitional clarity, lexical consistency).
5. Linking with **Contextual Bridges**: internal links explained by phrase/concept connections (not random “SEO links”).
6. Using **historical data** effects (click satisfaction, query logs, seasonality, re-ranking) by sustaining consistent, high-satisfaction coverage.

---

## 2) Key vocabulary & primitives (agent should learn these)

### 2.1 Entity / Attribute / Value (EAV)
- **Entity:** a real-world thing or concept (e.g., *watercolor paper*, *Baohong pad*, *cold press*, *cotton fiber*).
- **Attribute:** a property of an entity (e.g., *weight GSM*, *surface texture*, *sizing*, *absorbency*).
- **Value:** the attribute’s value (e.g., *300gsm*, *cold press*, *gelatin-sized*).

**Why it matters:** EAV provides a compact way to ensure coverage is *complete and comparable* across documents, enabling a consistent semantic layer.

Primary reference:  
- EAV architecture article: https://www.holisticseo.digital/seo-research-study/entity-attribute-value

### 2.2 Topical Map
A **Topical Map** is a plan for covering a topic domain through connected content items, typically organized as:

- **Central entity** and **central intent** (source context + monetization context).
- **Core section:** main attributes + high-demand query templates.
- **Outer section:** secondary attributes, long-tail contexts, adjacent concepts.
- **Borders:** what is *in scope* vs *out of scope*.

Primary reference:  
- Topical map expansion + contextual bridge: https://www.holisticseo.digital/seo-research-study/topical-map

### 2.3 Semantic Content Network (SCN)
A **Semantic Content Network** is the *implemented* topical map: pages that are published and interlinked so crawlers/users can traverse the knowledge domain efficiently.

Reference (case study framing):  
- Oncrawl SCN + query/document templates: https://www.oncrawl.com/on-page-seo/creating-semantic-content-networks-with-query-document-templates-case-study/

### 2.4 Query templates / Document templates / Intent templates
- **Query template:** “pattern” users search, with variable slots filled by entities  
  Example pattern: “best {ENTITY} for {USE_CASE}”, “{ENTITY} vs {ENTITY}”, “{ATTRIBUTE} of {ENTITY}”
- **Document template:** how a page is structured to satisfy a query template (sections, headings, tables, comparisons)
- **Intent template:** the underlying user need behind the query template

Reference:  
- Oncrawl SCN case study: https://www.oncrawl.com/on-page-seo/creating-semantic-content-networks-with-query-document-templates-case-study/

### 2.5 Contextual Bridge (internal linking theory)
A **Contextual Bridge** is a phrase/concept connection that explains why two pages should link (same query candidate categories / query context / query template) while using different entities/attribute pairs.

Reference:  
- https://www.holisticseo.digital/seo-research-study/topical-map

### 2.6 Cost of retrieval (crawl → render → evaluate → serve)
Koray uses “cost of retrieval” to describe the total cost for a search engine to crawl, render, evaluate, index, and serve a document. Lower cost + higher quality / clearer structure can improve a site’s ability to be processed and trusted.

Reference (mentions cost-of-retrieval definition):  
- https://www.holisticseo.digital/seo-research-study/saas

### 2.7 Quality threshold / relevance threshold / predictive ranking
Instead of “keyword difficulty,” Koray discusses:
- **Quality threshold:** minimum quality level needed to compete for a query class
- **Relevance threshold:** minimum relevance required to be eligible
- **Predictive ranking:** how a search engine predicts potential satisfaction before user signals finalize rankings

Reference:  
- https://www.holisticseo.digital/theoretical-seo/glossary/keyword-difficulty

### 2.8 Initial ranking / re-ranking / historical data
Initial ranking is the early score before heavy user feedback; re-ranking is adjustment after behavior signals and logs accumulate.

Reference:  
- https://www.holisticseo.digital/theoretical-seo/ranking/

---

## 3) The “Koray pipeline” as an AI-agent skill graph

### 3.1 Inputs
For ecommerce:
- Product catalog taxonomy: categories → brands → products → variants
- Attributes schema: product specs + usage contexts + comparisons
- SERP sampling: top pages for key query templates
- Business constraints: inventory, margins, seasonality, target audience, locales/languages

For niche content sites:
- Knowledge domain boundary (what you cover)
- Monetization routes (ads/affiliate/lead gen/products)
- Audience persona and reading depth

### 3.2 Outputs
- Entity graph (EAV model)
- Topical map (core/outer, borders, node priorities)
- Content brief per node (algorithmic authorship constraints)
- Internal linking plan (contextual bridges + hubs)
- Publication order (to form SCN)
- Revision plan (“content configuration” cycles)

### 3.3 Agent stages (recommended)
1. **Domain modeling**
   - Build entity inventory (types, synonyms, language variants)
   - Identify attributes and values for each entity type
2. **Query-template generation**
   - Map user intents to query patterns
   - Connect each pattern to a document template
3. **Topical map assembly**
   - Core nodes first (highest centrality)
   - Outer nodes to expand breadth and connect contexts
4. **Semantic content network orchestration**
   - Publish clusters in sequence
   - Add contextual bridges as pages go live
5. **Content configuration + maintenance**
   - Run gap checks (coverage, vocabulary, accuracy)
   - Update pages as new queries emerge / seasonality shifts

---

## 4) Building the entity model (EAV) for ecommerce and niche sites

### 4.1 Ecommerce entity layers (typical)
- **Category entities:** “Watercolor paper”, “watercolor brush”
- **Brand entities:** “Baohong”, “Potentate”
- **Product entities:** SKU-level pages
- **Use-case entities:** “urban sketching”, “botanical painting”
- **Problem entities:** “buckling”, “backruns”, “paint lifting”
- **Material entities:** “cotton fiber”, “cellulose”
- **Technique entities:** “wet-on-wet”, “glazing”
- **Measurement entities:** “GSM”, “rough/cold/hot press”

### 4.2 Attribute sets by entity type
Example: **Watercolor paper**  
- Composition: cotton %, cellulose
- Weight: GSM
- Texture: rough/cold press/hot press
- Sizing: internal/external, gelatin/synthetic
- Absorbency and lifting
- Buckling resistance
- Color (bright white / natural)
- Durability, scrubbing tolerance
- Recommended use-cases (botanical vs landscapes vs ink+wash)

Your agent should store attributes as:
- Canonical name (English)
- Aliases (Sinhala/Tamil variants, common misspellings)
- Data type (numeric, enum, text)
- Acceptable values and ranges
- Source quality expectations (lab spec sheet vs anecdote)

### 4.3 “Coverage checklist” as a constraint
Algorithmic authorship relies on the idea that a document template + EAV checklist creates:
- consistent extraction
- predictable relevance
- better internal linking paths (attributes become anchors)

Reference for EAV and templates:  
- https://www.holisticseo.digital/seo-research-study/entity-attribute-value

---

## 5) Topical map design: core vs outer (with examples)

### 5.1 Core section (transactional relevance + defining attributes)
For ecommerce, your core often includes:
- Category hub pages (PLP or category landing)
- “Best X for Y” buyer guides tightly linked to category hubs
- Attribute definition pages that reduce decision friction (e.g., “cold press vs hot press”)

**Core node examples (watercolor store):**
- “Watercolor paper buying guide”
- “Cotton vs cellulose watercolor paper”
- “Cold press vs hot press vs rough”
- “300gsm vs 200gsm paper”
- Brand authority hubs (Baohong paper overview, Potentate sketchbooks overview)

### 5.2 Outer section (breadth, long-tail, adjacent domains)
Outer nodes deepen trust and connect contexts:
- Technique guides: “How to prevent buckling”
- Maintenance: “How to store watercolor paper”
- Comparisons: “Baohong vs Arches vs Fabriano”
- Use cases: “Best paper for ink + watercolor”
- Localized content: “Where to buy watercolor paper in Sri Lanka” (if relevant)

### 5.3 Contextual bridge rules (how to link)
A contextual bridge should:
- Keep the same query candidate category or intent family
- Link via phrase/concept connection (attribute or use-case)
- Avoid irrelevant “SEO linking”

Reference:  
- https://www.holisticseo.digital/seo-research-study/topical-map

---

## 6) Semantic Content Network (SCN): publishing order and structure

### 6.1 Why order matters
In this framework, “topical authority” emerges from *connected coverage over time*, so publishing order can:
- build a clear “source context” early
- reduce ambiguity in what your site represents
- help crawlers cluster your pages by segments

### 6.2 Recommended publishing order (practical heuristic)
1. **Define the core entity** (intro hub)
2. **Define the primary attributes** (glossary/definition pages)
3. **Publish the high-value buyer guides** (decision pages)
4. **Publish comparisons** (entity vs entity)
5. **Expand outer section** (problems, techniques, niche use-cases)
6. **Translate / expand locales** (only after the model is stable)

### 6.3 Website segmentation (taxonomy + ontology)
Koray often emphasizes that website segments can help search engines interpret:
- content groups
- intent coverage
- indexation patterns
- cost of retrieval

Reference:  
- https://www.holisticseo.digital/theoretical-seo/ranking/

---

## 7) Algorithmic Authorship (AA): how to operationalize it

> Think of AA as “writing rules that optimize semantic extractability.”

### 7.1 Macro context and micro contexts
- **Macro context:** the single main topic/intention of the page (should be stable and unambiguous)
- **Micro contexts:** supporting subtopics that serve the macro context

Your agent should enforce:
- One macro context per page
- Micro contexts must be *entailed* by the macro context (no random tangents)

### 7.2 Heading hierarchy as context layers
AA strongly favors proper heading layering:
- H1: macro context (central entity + intent)
- H2: major micro contexts / attribute groups / steps
- H3/H4: deeper support, examples, edge cases

### 7.3 Early “answer zone” for extractive systems
Many semantic SEO systems optimize the paragraph(s) immediately after H1 to provide:
- a concise definitional/decision answer
- entity + key attribute mentions
- minimal ambiguity

(This idea aligns with extractive summarization behaviors in IR systems.)

### 7.4 Sentence-level relevance and predicate frames
Koray frequently references verbs/predicates (frame semantics) in semantic search discussion:
- model actions (choose, compare, prevent, fix, use)
- connect entity–attribute–value to user intent behaviors

Reference:  
- https://www.holisticseo.digital/seo-research-study/semantic-search

### 7.5 Lexical semantics and vocabulary control
AA involves controlling:
- synonyms, hypernyms/hyponyms (category relationships)
- consistent terminology for attributes
- disambiguation (avoid switching terms casually)

Reference (lexical semantics case study context):  
- https://www.holisticseo.digital/seo-research-study/lexical-semantics

### 7.6 “Content configuration” loop (revision methodology)
After publishing, you revise for:
- missing entities/attributes
- vocabulary gaps vs SERP documents
- factual accuracy and clarity
- broken context flow

Reference (content configuration mentioned alongside AA templates):  
- https://www.holisticseo.digital/seo-research-study/entity-attribute-value

---

## 8) Authorship, identity, and trust signals (practical engineering)

### 8.1 Author identity and “author vectors”
Koray discusses Google’s ability to connect content to authors and recognize authorship signals (broadly framed as “Google Author Rank”). This is often treated as a proxy for:
- consistent expertise
- consistent topical focus
- identifiable creators

Reference:  
- https://www.holisticseo.digital/theoretical-seo/google-author

### 8.2 Practical author/brand implementation checklist
For ecommerce & niche sites:
- Author pages with credentials, real bio, topical scope
- Editorial policy + update policy
- Citations for claims (especially medical/financial/technical)
- Clear business identity (contact, address, policies)
- Structured data (Organization, WebSite, WebPage, Product, FAQ when appropriate)

**Agent task:** create templates and enforce completeness.

---

## 9) Internal linking: contextual bridges, hubs, and propagation

### 9.1 Linking goals in this framework
- Help crawlers discover and cluster content
- Help users traverse decision paths
- Propagate relevance/quality to core commercial pages
- Reduce retrieval cost by building clean, connected segments

### 9.2 Link graph patterns
**Pattern A — Hub → attribute definitions → buyer guides → product lists**  
**Pattern B — Problem pages → solutions → products (if appropriate)**  
**Pattern C — Comparison pages → category hub + brand hubs**

### 9.3 Anchor strategy (entity/attribute grounded)
Prefer anchors that include:
- entity name
- attribute or use-case phrase
Avoid generic anchors (“click here”, “learn more”) unless UI constraints.

### 9.4 Contextual bridge linting (agent rule)
A link is valid if:
- source page and target page share a query-network relationship
- anchor phrase can be explained as entity/attribute overlap
- it improves navigation and context, not distracts it

Primary reference (concept definition):  
- https://www.holisticseo.digital/seo-research-study/topical-map

---

## 10) Statistics & numbers: how Koray-style “numbers pages” fit in

### 10.1 Why stats pages matter
Stats pages can:
- attract backlinks naturally
- satisfy data-seeking intents
- create a “data authority” node that links outward to guides

HolisticSEO has examples of statistics content (e.g., shopping behavior statistics, podcast statistics, etc.).  
Reference pointer:  
- https://www.holisticseo.digital/on-page-seo/writing-tips-for-seo

### 10.2 How to do stats pages safely
Agent checklist:
- Use primary sources (reports, journals, official datasets)
- Provide definitions + methodology notes (what the numbers mean)
- Date-stamp updates and show last-updated
- Avoid cherry-picking; cite multiple sources where possible
- Use tables and short explanations; avoid long “fluff”

### 10.3 Turning stats into internal links (contextual bridge)
From stats pages:
- Link to the relevant buyer guide (“What it means for choosing paper GSM”)
- Link to category hubs (“Shop 300gsm paper”)
- Link to use-case pages (“Best paper for wet-on-wet”)

---

## 11) Ecommerce implementation notes (where this differs from content sites)

### 11.1 Category pages (PLP) as “entity hubs”
Treat category pages as:
- entity hubs (watercolor paper)
- attribute filter explainers (GSM, texture, cotton)
- navigation entrypoints

Agent improvements:
- add short, precise explanation for each major attribute
- include internal links to deep guides and comparisons
- avoid duplicate boilerplate across categories

### 11.2 Product detail pages (PDP) as “attribute ground truth”
PDP is where EAV can be most concrete:
- use structured specs (EAV)
- use consistent wording
- show use-cases, comparisons, and compatibility
- add FAQ where genuinely helpful

### 11.3 Faceted navigation and duplication risks
Common risks:
- infinite URL combinations
- near-duplicate pages with minimal unique value
- crawl budget waste (higher retrieval cost)

Agent tasks:
- define canonical strategy (canonicals, parameter handling, noindex for low-value facets)
- build “curated landing pages” for high-demand facets (that deserve indexing)
- consolidate duplicates into stronger hubs

### 11.4 Multi-language (Sinhala/Tamil) strategy
Koray’s case studies mention that semantic networks can be extended across languages (translation), with cautions about over-replicating strategies across too many sites/languages.

Reference (multilingual note in case study):  
- https://www.holisticseo.digital/marketing/seo-for-casino-websites-a-seo-case-study-for-bet-and-gamble-industry/

---

## 12) Niche site implementation notes (ads/affiliate/informational)

### 12.1 Start with “definition + attribute + behavior”
A niche site topical map usually begins with:
- definitions (what is X)
- attributes (types, properties)
- behaviors (how to do X, how to fix X)
- comparisons (X vs Y)
- decision pages (best X for Y)

### 12.2 Avoid “random keyword clusters”
The map should reflect **query networks**, not just keyword groupings. Query networks can form through:
- intent patterns
- entity families
- behavioral similarity

Reference (query networks concept discussed in ranking / SCN contexts):  
- https://www.holisticseo.digital/theoretical-seo/ranking/  
- https://www.oncrawl.com/on-page-seo/creating-semantic-content-networks-with-query-document-templates-case-study/

---

## 13) Technical SOP: implement this as code + data structures

### 13.1 Data schema: entity graph (suggested JSON)
```json
{
  "entities": [
    {
      "id": "paper.watercolor",
      "type": "CategoryEntity",
      "name": "Watercolor paper",
      "aliases": ["water colour paper", "wc paper"],
      "attributes": [
        {"name": "gsm", "type": "number", "unit": "gsm", "values": [190, 200, 300]},
        {"name": "texture", "type": "enum", "values": ["rough", "cold press", "hot press"]},
        {"name": "composition", "type": "enum", "values": ["100% cotton", "cotton blend", "cellulose"]},
        {"name": "sizing", "type": "enum", "values": ["gelatin", "synthetic", "unknown"]}
      ]
    }
  ],
  "relations": [
    {"from": "paper.watercolor", "type": "hasSubType", "to": "paper.cold_press"},
    {"from": "paper.watercolor", "type": "usedFor", "to": "technique.wet_on_wet"}
  ]
}
```

### 13.2 Data schema: topical map node
```json
{
  "node_id": "guide.cold-press-vs-hot-press",
  "macro_context": "Compare cold press vs hot press watercolor paper for selection decisions",
  "entity_targets": ["paper.cold_press", "paper.hot_press"],
  "attribute_targets": ["texture", "lifting", "detail_level", "wash_behavior"],
  "query_templates": [
    "{ENTITY} vs {ENTITY}",
    "cold press vs hot press for {USE_CASE}",
    "what is cold press watercolor paper"
  ],
  "document_template": {
    "h1": "Cold press vs hot press watercolor paper",
    "answer_zone": "40-80 word extractive comparison summary",
    "sections": [
      {"h2": "Quick comparison table", "type": "table"},
      {"h2": "How texture affects washes", "type": "explanatory"},
      {"h2": "Best use-cases", "type": "list"},
      {"h2": "Common mistakes + fixes", "type": "troubleshooting"},
      {"h2": "Recommended products", "type": "commerce_links"}
    ]
  },
  "internal_links": {
    "outbound": [
      {"to": "hub.watercolor-paper", "anchor": "watercolor paper buying guide", "bridge": "selection decision"},
      {"to": "guide.prevent-buckling", "anchor": "how to prevent paper buckling", "bridge": "wash behavior"}
    ]
  }
}
```

### 13.3 Data schema: algorithmic authorship constraints (lint rules)
```json
{
  "rules": [
    {"id": "AA-H1-ONE", "desc": "Exactly one H1 per page"},
    {"id": "AA-HEADINGS-ORDER", "desc": "Never skip heading levels"},
    {"id": "AA-MACRO-CONTEXT", "desc": "Every section must serve the macro context"},
    {"id": "AA-EAV-COVERAGE", "desc": "Required entity attributes must be covered with values or explicit unknowns"},
    {"id": "AA-ANSWER-ZONE", "desc": "Provide an early extractive summary after H1"}
  ]
}
```

### 13.4 Crawler + retrieval-cost hygiene (agent checklist)
- prune low-value parameter URLs
- minimize duplicate boilerplate
- improve internal link discoverability
- keep pages fast and renderable
- enforce segment clarity (clean taxonomy)

References to segments/crawl cost concepts are discussed within the ranking/cost-of-retrieval contexts:  
- https://www.holisticseo.digital/theoretical-seo/ranking/  
- https://www.holisticseo.digital/seo-research-study/saas

---

## 14) Monitoring and iteration (how the agent should evaluate success)

### 14.1 Metrics that align with the methodology
- Coverage completion: % of topical map nodes published
- Query network growth: number of ranking queries per cluster
- Internal link depth and crawl paths (log files)
- Indexation ratio (indexed vs discovered)
- CTR / satisfaction proxies (time on page, pogo behavior proxies if available)
- Stability through algorithm updates

### 14.2 “Content configuration” cycle (monthly/quarterly)
For each core node:
- compare SERP competitors: missing attributes, missing entities, missing intent coverage
- check vocabulary: synonyms used by SERP vs your page
- add new sections only if they serve macro context
- update stats pages with fresh sources

---

## 15) Examples from Koray’s own works (what to study)

### 15.1 Topical authority case study narratives
- Oncrawl article describes growth via topical authority and semantic SEO, with a concrete traffic growth example.  
  https://www.oncrawl.com/technical-seo/importance-topical-authority-semantic-seo/

### 15.2 Semantic content network + query/document templates
- Oncrawl case study focuses on query templates, document templates, and semantic networks.  
  https://www.oncrawl.com/on-page-seo/creating-semantic-content-networks-with-query-document-templates-case-study/

### 15.3 EAV architecture + algorithmic authorship mentions
- EAV article includes discussion of algorithmic authorship templates and relevance configuration concepts.  
  https://www.holisticseo.digital/seo-research-study/entity-attribute-value

### 15.4 Historical data / ranking phases
- Ranking / historical data explanation (initial ranking, re-ranking, query logs, time-based data).  
  https://www.holisticseo.digital/theoretical-seo/ranking/

### 15.5 Ecommerce semantics examples (DOCX)
- A HolisticSEO docx containing examples of Semantic SEO intersecting with Ecommerce.  
  https://www.holisticseo.digital/wp-content/uploads/Aspose.Words/e-commerce-seo-with-semantics-3-website-examples.docx

### 15.6 Medium long-form case study narrative (brand building)
- “Create Global Brands with Semantic SEO” (long narrative; use as conceptual reference, not as a template to copy).  
  https://medium.com/@ktgubur/create-global-brands-with-semantic-seo-the-longest-seo-case-study-from-300-to-13-000-66dee4b387eb

### 15.7 Cost-of-retrieval framing (practical hints inside niche guides)
- SaaS SEO guide includes an explicit definition of “cost of retrieval” and how quality/crawl cost interact.  
  https://www.holisticseo.digital/seo-research-study/saas

### 15.8 Author identity / author rank framing
- Google Author Rank article for identity signals and author association.  
  https://www.holisticseo.digital/theoretical-seo/google-author

---

## 16) Curated reference library (for agent training)

### 16.1 Primary corpus (Koray / HolisticSEO / Oncrawl authored)
- Holistic SEO main site: https://www.holisticseo.digital/  
- Author page: https://www.holisticseo.digital/author/koray-tugberk-gubur/  
- Topical Map: https://www.holisticseo.digital/seo-research-study/topical-map  
- Entity SEO / entity-oriented search case study: https://www.holisticseo.digital/seo-research-study/entity-seo  
- EAV architecture: https://www.holisticseo.digital/seo-research-study/entity-attribute-value  
- Semantic Search (verbs / frames): https://www.holisticseo.digital/seo-research-study/semantic-search  
- Ranking / historical data: https://www.holisticseo.digital/theoretical-seo/ranking/  
- Keyword difficulty replacement concepts (quality threshold): https://www.holisticseo.digital/theoretical-seo/glossary/keyword-difficulty  
- Cost-of-retrieval mention (SaaS guide): https://www.holisticseo.digital/seo-research-study/saas  
- Google Author Rank: https://www.holisticseo.digital/theoretical-seo/google-author  
- Oncrawl topical authority case study: https://www.oncrawl.com/technical-seo/importance-topical-authority-semantic-seo/  
- Oncrawl SCN + templates case study: https://www.oncrawl.com/on-page-seo/creating-semantic-content-networks-with-query-document-templates-case-study/  
- Ecommerce semantics docx: https://www.holisticseo.digital/wp-content/uploads/Aspose.Words/e-commerce-seo-with-semantics-3-website-examples.docx  

### 16.2 Additional interviews / third-party context (secondary)
- Majestic interview (semantic SEO, topical maps): https://majestic.com/seo-in-2022/koray-tugberk-gubur  
- Reboot Online Q&A: https://www.rebootonline.com/blog/q-and-a-koray-tugberk-gubur/  
- Inlinks case study repost: https://inlinks.com/case-studies/importance-of-entity-oriented-search-understanding-for-seo-beyond-strings/  

### 16.3 Community summaries (use with caution)
- Semantic content writing rules (community interpretation): https://rokonz.com/resources/semantic-content-writing-rules  
- “Koray framework” summaries: https://pos1.ar/seo/koray-framework/  
- GenghisDigital summary: https://genghisdigital.com.au/blog/koray-framework/  

**Agent rule:** treat these as *derived notes*, not canonical doctrine.

---

## 17) Practical “agent prompts” (starter set)

### Prompt A — Build EAV graph from catalog
**Task:** Create an entity graph for a niche ecommerce catalog.  
**Inputs:** product exports, category taxonomy, spec sheets.  
**Outputs:** entity types, attributes, values, aliases, relations.

### Prompt B — Generate topical map from EAV + intent families
**Task:** Build core + outer topical map nodes using query templates and intent templates.  
**Outputs:** node list with priorities, borders, and contextual bridges.

### Prompt C — Create content briefs with algorithmic authorship constraints
**Task:** For each node, output a brief with macro context, required entity coverage, heading hierarchy, answer zone, tables, and internal links.

### Prompt D — Link graph planner
**Task:** Produce an internal linking plan that enforces contextual bridges and hub propagation.

### Prompt E — Content configuration auditor
**Task:** Compare each page vs SERP baselines and generate a revision checklist (coverage, vocab gaps, factual gaps, context flow).

---

## 18) Final notes: how to apply this to your watercolor ecommerce + niche content

If your niche is watercolor art / materials:
- Your central entities are *paper, brushes, paints, sketchbooks*.
- Your most important attributes are *material + performance + use-case fit*.
- Your best topical bridges connect “how to choose” → “how to use” → “what to buy”.

A good “Koray-style” setup is:
- Strong, non-duplicated category hubs + attribute definition pages
- Buyer guides connected to product listings
- Technique/problem-solving outer nodes that naturally link to products
- A stats hub (“watercolor paper GSM guide + buckling statistics” style) using reputable sources

---

*End of file.*
