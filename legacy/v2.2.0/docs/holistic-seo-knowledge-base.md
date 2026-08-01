# Holistic SEO Knowledge Base

> **Universal SEO strategy reference** based on Koray Tugberk Gubur's Holistic SEO / Topical Authority methodology. This document is the single source of truth for all SEO work across every project built with this system.
>
> **Audience:** AI agents building content, SEO engineers, content system designers.
>
> **Version:** 2026-03-01 v2.0 (major upgrade — integrated Koray agent-training methodology)

---

## 0. Warnings (Read First)

Before applying anything in this document, internalize these guardrails:

### 0.1 Don't Create "Template Footprints"

If you rigidly template headings, sentence patterns, and page structures across hundreds of pages (especially programmatic ecommerce), you create a detectable footprint. Use algorithmic authorship as a **controlled writing system**, not a robotic cookie-cutter. Vary sentence openers, paragraph lengths, and section ordering while keeping the underlying EAV coverage consistent.

### 0.2 Primary Sources vs Community Summaries

There are many third-party writeups claiming "41 rules" or a definitive "Koray framework." Treat them as **interpretations unless published directly by Koray**. Use these as the primary corpus:
- **HolisticSEO.digital** — Koray's own site
- **Oncrawl articles** by Koray (SCN case studies)
- **Koray's Medium/LinkedIn/YouTube**

Community posts (rokonz.com, pos1.ar, genghisdigital.com.au, etc.) are secondary — useful for different angles but not canonical.

### 0.3 Programmatic Ecommerce Risks

Programmatic "thin" pages (near-duplicate facets, weak unique value, auto-spun copy) increase crawl cost and dilute topical/quality signals. If you scale, scale **coverage + usefulness**, not page count. Every indexed page must justify its existence with unique, genuinely useful content.

### 0.4 AI Content Risks

AI-generated content is fine if it is **accurate, attributable, updated, and human-reviewed**. But hallucinated facts, invented citations, or fake expertise destroy trust. In Koray's framing, the goal is to be an understood, reliable source — fabricated claims undermine that fundamentally. Always verify facts, cite real sources, and have domain experts review content before publishing.

---

## 1. Framework Overview

### What "Koray Methodology" Means

In SEO communities, "Koray methodology" refers to a **semantic SEO framework** that builds **topical authority** by:

1. **Modeling a knowledge domain** as an **entity network** (entities, attributes, values)
2. Building a **Topical Map** that covers core + outer sections, using **query templates** and **document templates**
3. Publishing in a deliberate order to form a **Semantic Content Network** (SCN)
4. Using **Algorithmic Authorship**: repeatable writing constraints that improve machine understanding (context, heading hierarchy, sentence-level relevance, definitional clarity, lexical consistency)
5. Linking with **Contextual Bridges**: internal links explained by phrase/concept connections (not random "SEO links")
6. Using **historical data** effects (click satisfaction, query logs, seasonality, re-ranking) by sustaining consistent, high-satisfaction coverage

### The Core Formula

**Topical Authority = Topical Coverage + Historical Data**

- **Topical Coverage**: Breadth and depth of content covering all facets of a topic. Not just "more pages" — it means covering more entities, more attributes, and deeper context with consistency.
- **Historical Data**: Accumulated user engagement signals, content freshness, update patterns, and trust over time. Same content on different sources can rank differently based on historical data.

This is NOT about keyword density, backlinks, or gaming the algorithm. It is about becoming the most comprehensive, reliable, well-structured source on your topic.

### The Six Pillars

| Pillar | What It Means |
|--------|--------------|
| **1. Entity-Attribute-Value Model** | Structure all knowledge as Entity-Attribute-Value triples for complete, comparable coverage |
| **2. Topical Map** | Strategic blueprint of all content to create — core section, outer section, borders |
| **3. Semantic Content Network** | The implemented topical map: published, interlinked pages forming a traversable knowledge domain |
| **4. Algorithmic Authorship** | Controlled writing system: heading hierarchy, macro/micro context, early answer zone, lexical consistency |
| **5. Contextual Bridges** | Internal links grounded in entity/attribute overlap, not arbitrary "SEO linking" |
| **6. Historical Data & Re-Ranking** | Publishing cadence, content updates, user satisfaction signals that compound over time |

### Quality Threshold vs Keyword Difficulty

Instead of traditional "keyword difficulty" scores, Koray uses:

- **Quality threshold**: The minimum quality level needed to compete for a query class. This is the bar set by the best existing content.
- **Relevance threshold**: The minimum topical relevance needed to even be considered. A site with no related content cannot rank for a query regardless of individual page quality.
- **Predictive ranking**: How a search engine predicts potential user satisfaction before behavioral signals accumulate.

**Implication:** Don't ask "how hard is this keyword?" Ask "how much topical coverage and quality do I need to exceed the threshold for this query class?"

### Cost of Retrieval

The total cost for a search engine to crawl, render, evaluate, index, and serve a document. Lower cost + higher quality + clearer structure improves a site's ability to be processed and trusted. Factors that increase retrieval cost:

- Duplicate/near-duplicate pages (faceted navigation, parameter URLs)
- Heavy JavaScript rendering requirements
- Inconsistent or unclear site structure
- Thin content that requires extra evaluation work
- Deep crawl depth for important pages

**Practical rule:** Every page should be worth the search engine's processing cost. If it's not, consolidate or remove it.

---

## 2. Key Vocabulary & Primitives

Master these terms before proceeding — they are used throughout:

### 2.1 Entity / Attribute / Value (EAV)

- **Entity**: A real-world thing or concept (e.g., *watercolor paper*, *Baohong pad*, *cold press*, *cotton fiber*)
- **Attribute**: A property of an entity (e.g., *weight GSM*, *surface texture*, *sizing*, *absorbency*)
- **Value**: The attribute's specific value (e.g., *300gsm*, *cold press*, *gelatin-sized*)

EAV provides a compact way to ensure coverage is complete and comparable across documents.

### 2.2 Topical Map

A strategic plan for covering a topic domain through connected content items:
- **Central entity** and **central intent** (source context + monetization context)
- **Core section**: Main attributes + high-demand query templates
- **Outer section**: Secondary attributes, long-tail contexts, adjacent concepts
- **Borders**: What is in scope vs out of scope

### 2.3 Semantic Content Network (SCN)

The *implemented* topical map: pages that are published and interlinked so crawlers and users can traverse the knowledge domain efficiently. An SCN is the living, deployed realization of the topical map.

### 2.4 Query Templates / Document Templates / Intent Templates

- **Query template**: A pattern users search, with variable slots filled by entities. Examples: `"best {ENTITY} for {USE_CASE}"`, `"{ENTITY} vs {ENTITY}"`, `"{ATTRIBUTE} of {ENTITY}"`
- **Document template**: How a page is structured to satisfy a query template (sections, headings, tables, comparisons)
- **Intent template**: The underlying user need behind the query template (informational, navigational, commercial, transactional)

These three work together: every document template maps to one or more query templates, which map to intent templates. This creates a systematic, predictable content architecture.

### 2.5 Contextual Bridge

A phrase/concept connection that explains why two pages should link. A valid bridge:
- Keeps the same query candidate category or intent family
- Links via entity/attribute overlap
- Improves navigation and context (not a random "SEO link")

### 2.6 Source Context

The brand's purpose and overall relevance — defines the perspective from which ALL content is written. For an art supply store: "We sell and recommend the best watercolor supplies for artists in Sri Lanka." Every article should reinforce this context.

### 2.7 Macro Context vs Micro Context

- **Macro context**: The single main topic/intention of a page. Must be stable and unambiguous.
- **Micro contexts**: Supporting subtopics that serve the macro context. Must be *entailed by* the macro context — no random tangents.

**Rule**: One macro context per page. Every subsection must support it.

### 2.8 Topical Centroid

A specifically important concept that defines multiple other concepts from a point of view. Example: "watercolor techniques" is a centroid connecting wet-on-wet, dry brush, glazing, lifting, etc. Centroids are the hub nodes in your content network.

### 2.9 Strongly Connected Components

Groups of concepts that are all reachable from each other — they define and reference each other, forming tight content clusters.

### 2.10 Topical Gap

Contextual disconnectedness between topic clusters. If "watercolor paper" and "watercolor techniques" exist as content but nothing bridges them, there is a topical gap.

### 2.11 Topical Consolidation

The process of focusing only on relevant topics by increasing contextual relevance between website segments. Non-quality information in one section may negatively affect rankability of another section.

**Implication:** Weak content on a topic can hurt your authority on related topics. Better to have no content than low-quality content that dilutes topical authority.

---

## 3. Entity-Attribute-Value (EAV) Architecture

### The EAV Model

Everything in semantic SEO can be modeled as Entity-Attribute-Value triples:

| Entity | Attribute | Value |
|--------|-----------|-------|
| Winsor & Newton Cotman | pigment type | synthetic |
| Winsor & Newton Cotman | price range | affordable |
| Winsor & Newton Cotman | best for | beginners |
| Cold-pressed paper | texture | medium rough |
| Cold-pressed paper | weight (GSM) | 300 |
| Wet-on-wet technique | difficulty | intermediate |

### Types of Attributes

#### Root Attributes
The most fundamental, defining attributes of an entity type. For watercolor paint: pigment, binder, color, form (tube/pan/liquid).

#### Rare Attributes
Unusual or specialized attributes that differentiate an expert source. For watercolor paint: granulation index, ASTM lightfastness rating, single-pigment vs multi-pigment.

#### Unique Attributes
Attributes specific to a particular entity instance. For Winsor & Newton Cotman: "reformulated in 2019," "uses synthetic pigments as alternatives to expensive cadmiums."

**Key insight from Koray:** "Attributes are more important than entities to classify context." Covering rare and unique attributes signals deep expertise that generic sources miss.

### Attribute Filtering

Not all attributes are equally important. Filter by:

1. **Prominence**: How defining is this attribute? (Color is prominent for paint; packaging material is not)
2. **Relatedness**: How connected is this attribute to the entity's core purpose? (Pigment properties are highly related to paint quality)
3. **Popularity**: How often do users search for this attribute? (Price is popular; chemical composition is rare but signals expertise)

**Source context determines which attributes matter most.** For a watercolor supply store, commercial attributes (price, availability, brand) AND educational attributes (technique suitability, pigment properties) both matter.

### Neural Matching and EAV

Google's neural matching systems understand entities through their attribute patterns. When your content consistently describes entities using complete EAV triples, it aligns with how neural matching classifies and retrieves information.

### Ecommerce Entity Layers

For ecommerce sites, entities naturally form layers:

| Layer | Examples | Content Type |
|-------|----------|-------------|
| **Category entities** | Watercolor paper, watercolor brush | Category hub pages |
| **Brand entities** | Baohong, Potentate, Winsor & Newton | Brand authority pages |
| **Product entities** | SKU-level items | Product detail pages |
| **Use-case entities** | Urban sketching, botanical painting | Technique/guide articles |
| **Problem entities** | Buckling, backruns, paint lifting | Troubleshooting articles |
| **Material entities** | Cotton fiber, cellulose, gum arabic | Educational/glossary pages |
| **Technique entities** | Wet-on-wet, glazing, dry brush | Tutorial articles |
| **Measurement entities** | GSM, rough/cold/hot press, lightfastness | Specification/comparison pages |

### Attribute Sets by Entity Type

For each entity type, define a complete attribute schema. Example for **Watercolor Paper**:

| Attribute | Type | Values/Range | Notes |
|-----------|------|-------------|-------|
| Composition | enum | 100% cotton, cotton blend, cellulose | Root attribute |
| Weight | number (GSM) | 190, 200, 300, 640 | Root attribute |
| Texture | enum | rough, cold press, hot press | Root attribute |
| Sizing | enum | gelatin, synthetic, unknown | Rare attribute |
| Absorbency | text | low, medium, high | Rare attribute |
| Buckling resistance | text | poor, moderate, excellent | Rare attribute |
| Color | enum | bright white, natural, cream | Standard attribute |
| Recommended use-cases | list | botanical, landscapes, ink+wash | Relationship attribute |
| Scrubbing tolerance | text | low, high | Unique attribute |

**Agent rule:** Store attributes with canonical name, aliases (including language variants), data type, acceptable values, and source quality expectations.

### Coverage Checklist as Constraint

Algorithmic authorship relies on the idea that a document template + EAV checklist creates:
- **Consistent extraction**: Search engines can reliably grab structured information
- **Predictable relevance**: Content reliably satisfies the expected query patterns
- **Better internal linking paths**: Attributes become natural anchor points for contextual bridges

### Entity Graph Data Schema

For systematic content planning, model your entity graph as structured data:

```json
{
  "entities": [
    {
      "id": "paper.watercolor",
      "type": "CategoryEntity",
      "name": "Watercolor paper",
      "aliases": ["water colour paper", "wc paper", "aquarelle paper"],
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
    {"from": "paper.watercolor", "type": "usedFor", "to": "technique.wet_on_wet"},
    {"from": "brand.baohong", "type": "produces", "to": "paper.watercolor"}
  ]
}
```

---

## 4. Topical Maps

### Purpose

A topical map is the strategic blueprint that defines WHAT content to create, in what order, and how it connects. It is the planning document; the Semantic Content Network is its implementation.

### Structure: Core vs Outer Sections

#### Core Section (Transactional Relevance + Defining Attributes)

The core covers the highest-demand, most commercially relevant content:
- Category hub pages (product listing pages or category landing pages)
- "Best X for Y" buyer guides tightly linked to category hubs
- Attribute definition pages that reduce decision friction (e.g., "cold press vs hot press")

**Core node examples (watercolor store):**
- "Watercolor paper buying guide"
- "Cotton vs cellulose watercolor paper"
- "Cold press vs hot press vs rough"
- "300gsm vs 200gsm paper"
- Brand authority hubs (Baohong overview, Winsor & Newton overview)

#### Outer Section (Breadth, Long-Tail, Adjacent Domains)

Outer nodes deepen trust and connect contexts:
- Technique guides: "How to prevent buckling"
- Maintenance: "How to store watercolor paper"
- Comparisons: "Baohong vs Arches vs Fabriano"
- Use cases: "Best paper for ink + watercolor"
- Localized content: "Where to buy watercolor paper in Sri Lanka"
- Problem/troubleshooting: "Why does my watercolor paper buckle?"

#### Borders (Scope Definition)

Define what is in scope and out of scope. For a watercolor supply store:
- **In scope**: Watercolor paints, papers, brushes, techniques, materials science, artist education
- **Out of scope**: Oil painting, digital art, general crafting, art history (unless directly relevant to watercolor)

### Topical Map Node Schema

Each node in the topical map can be modeled as structured data:

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

### Three Methods to Expand Topical Maps

1. **Cover more entities of the same type.** If you cover 5 watercolor brands, cover 15 more. Each new entity adds density to the topic.

2. **Cover more attributes of existing entities.** If you describe paint by color and size, also cover: pigment properties, lightfastness, granulation, transparency, staining, mixing behavior.

3. **Deepen context with further consistency.** Add comparison articles, "how to choose" guides, "X vs Y" content, and definitional content that creates stronger contextual bridges between existing clusters.

### Expansion Best Practices

- **3+ contextual bridges per topic cluster.** Don't leave any cluster isolated.
- **Content briefs should be symmetrical.** All articles covering the same entity type should follow the same structure, creating patterned content the search engine can extract information from.
- **Macro-context via query templates.** Use "how to use," "best," "what is," "X vs Y," "types of" as organizational patterns.
- **Entity sets using "is-A" definitional sentences.** "Watercolor paper IS-A art supply. Cold-pressed paper IS-A type of watercolor paper."
- **Information extraction from templatic content.** When content follows consistent templates, search engines can extract structured data more efficiently.

### Topical Centroids

Specifically important concepts that define multiple other concepts from a point of view. Example: "watercolor techniques" is a centroid that connects wet-on-wet, dry brush, glazing, lifting, etc. Identify centroids in your topical map and make them hub pages with the richest content and most internal links.

---

## 5. Semantic Content Networks (SCN)

### Foundation: Predicates (Verbs)

Predicates — verbs and actions — are the foundation of semantic content networks. They define the RELATIONSHIPS between entities:

- Watercolor paint **dissolves** in water
- Artists **apply** wet-on-wet technique
- Cold-pressed paper **absorbs** pigment slowly
- Brushes **hold** varying amounts of water

Every sentence in content should use clear, specific predicates that help search engines understand entity relationships through Semantic Role Labels.

### Semantic Role Labels (SRL)

Search engines parse sentences into semantic roles:
- **Agent**: Who/what performs the action (the artist)
- **Patient/Theme**: What is acted upon (the watercolor paper)
- **Instrument**: What tool is used (a round brush)
- **Location**: Where it happens (on the palette)
- **Goal**: The purpose or result (to create a wash)
- **Source**: Origin (from the tube)

**Writing rule:** Every important sentence should clearly identify the Agent, Action, and Patient/Theme at minimum.

### FrameNet Frames

FrameNet organizes language into "frames" — situations described by a set of roles. Example:

**Frame: Applying_Material**
- Artist (Agent) applies watercolor paint (Material) to paper (Surface) using a brush (Tool) to create a wash (Result)

Content that consistently activates the same semantic frames builds stronger topical coherence.

### Query-Focused Semantic Vocabulary

For each topic, there exists a "semantic vocabulary" — the set of terms, phrases, and conceptual elements that authoritative sources consistently use. Missing terms from this vocabulary signals gaps the search engine notices.

Example vocabulary for "watercolor painting":
- Pigment, binder, gum arabic, lightfastness, transparency, granulation
- Wet-on-wet, wet-on-dry, dry brush, glazing, lifting, blooming
- Cold-pressed, hot-pressed, rough, cotton, cellulose, GSM weight
- Wash, gradient, edge control, color mixing, palette

### Publishing Order (Why Sequence Matters)

Topical authority emerges from connected coverage over time. Publishing order determines how quickly search engines understand your source context and how cleanly they can cluster your pages.

**Recommended publishing sequence:**

1. **Define the core entity** (introductory hub page)
2. **Define the primary attributes** (glossary/definition pages: "What is X?")
3. **Publish high-value buyer guides** (decision pages: "Best X for Y")
4. **Publish comparisons** (entity vs entity: "X vs Y")
5. **Expand outer section** (problems, techniques, niche use-cases)
6. **Translate / expand locales** (only after the model is stable in the primary language)

**Key rule:** Publish in clusters, not individually. Push 5-10 related articles together. Complete topic clusters before moving to new ones.

### Website Segmentation

Koray emphasizes that clear website segments help search engines interpret:
- Content groups (what belongs together)
- Intent coverage (what user needs each segment serves)
- Indexation patterns (what deserves crawling)
- Cost of retrieval (how efficiently the site can be processed)

Clean taxonomy + clear segment boundaries = lower retrieval cost + better topical clustering.

### Query Templates in Practice

For each entity type, define the query patterns users actually search:

| Query Template Pattern | Example | Document Template |
|-----------------------|---------|-------------------|
| `"what is {ENTITY}"` | "what is watercolor paper" | Definitional article with EAV coverage |
| `"types of {ENTITY}"` | "types of watercolor brushes" | Taxonomy list with comparisons |
| `"best {ENTITY} for {USE_CASE}"` | "best paper for wet-on-wet" | Buyer guide with recommendations |
| `"{ENTITY} vs {ENTITY}"` | "cotton vs cellulose paper" | Head-to-head comparison table |
| `"how to {ACTION} {ENTITY}"` | "how to stretch watercolor paper" | Tutorial/how-to guide |
| `"{ENTITY} review"` | "Winsor Newton Cotman review" | Product review with EAV specs |
| `"{ATTRIBUTE} of {ENTITY}"` | "lightfastness of watercolor paint" | Attribute deep-dive article |
| `"{ENTITY} {PROBLEM}"` | "watercolor paper buckling" | Troubleshooting article |

Each query template maps to a document template (page structure), which maps to an intent template (user need).

---

## 6. Algorithmic Authorship & Content Configuration

### What is Algorithmic Authorship?

Algorithmic Authorship (AA) is a controlled writing system that optimizes semantic extractability. It is NOT about formulaic content — it is about writing constraints that help search engines reliably extract structured information while keeping content natural and useful for readers.

### Macro Context and Micro Contexts

- **Macro context**: The single main topic/intention of the page. Must be stable and unambiguous throughout.
- **Micro contexts**: Supporting subtopics within the page that serve the macro context.

**Rules:**
- One macro context per page — never try to cover two separate topics
- Every micro context must be *entailed by* the macro context (no random tangents)
- The H1 heading defines the macro context
- All H2/H3 sections must support the macro context

### Heading Hierarchy as Context Layers

AA strongly favors proper heading layering:
- **H1**: Macro context (central entity + intent) — exactly ONE per page
- **H2**: Major micro contexts / attribute groups / steps
- **H3/H4**: Deeper support, examples, edge cases

**Never skip heading levels** (H1 → H3 without H2). The heading hierarchy IS your context hierarchy.

### Early Answer Zone

The paragraph(s) immediately after H1 should provide:
- A concise definitional or decision answer (40-80 words)
- Entity + key attribute mentions
- Minimal ambiguity

This "answer zone" optimizes for extractive summarization behaviors in modern search systems. When a search engine needs a featured snippet or quick answer, this zone provides it.

**Example answer zone:**
> "Cold-pressed watercolor paper is a medium-textured art paper that excels at holding water and pigment for techniques like wet-on-wet washes. It offers a balance between the controlled detail of hot press and the dramatic texture of rough paper, making it the most popular choice for both beginners and experienced watercolor artists."

### Content Article Template

The AA-optimized structure for any article:

1. **Definitional opener**: "X is a [type] that [defining predicate] [key attribute]."
2. **Early answer zone**: Concise summary answering the core question (40-80 words)
3. **Attribute coverage**: Systematic coverage of all defined attributes (root, rare, unique)
4. **Relationship mapping**: How this entity connects to other entities
5. **Comparison/context**: How this entity compares to alternatives
6. **Practical application**: How to use/choose/apply this entity
7. **Specifications list**: Structured data (bullet list of key EAV triples)

### Content Brief Template

For each article, define before writing:
- Target entity and entity type
- All attributes to cover (root, rare, unique)
- Related entities to reference
- Query patterns to satisfy
- Semantic frames to activate
- Internal links to include (outbound and expected inbound)

### Lexical Semantics & Vocabulary Control

AA involves controlling linguistic consistency:

- **Synonyms**: Choose one canonical term and use it consistently. Don't randomly switch between "watercolor paper" and "aquarelle paper" within the same article.
- **Hypernyms/Hyponyms**: Use correct category relationships. "Watercolor paper" (hypernym) → "cold-pressed paper" (hyponym).
- **Consistent terminology for attributes**: If you call it "GSM" on one page, don't call it "paper weight in grams" on another without explicitly connecting them.
- **Disambiguation**: Avoid switching terms casually. If "wash" can mean multiple things, establish context clearly.

### Sentence-Level Relevance and Predicate Frames

At the sentence level, optimize for:
- Clear predicates (verbs/actions): choose, compare, prevent, fix, use, apply
- Entity-attribute-value connections in each sentence
- Semantic role clarity (who does what to what, using what, for what purpose)

**Good sentence:** "Beginners should choose 300gsm cold-pressed cotton paper because it resists buckling during wet-on-wet washes."
(Agent: beginners. Action: choose. Entity: paper. Attributes: 300gsm, cold-pressed, cotton. Reason: resists buckling. Context: wet-on-wet.)

**Weak sentence:** "This paper is really good for painting."
(No specific entity, no attributes, no clear predicate frame.)

### Content Configuration Loop (Revision Methodology)

After publishing, run periodic "content configuration" audits:

1. **Vocabulary gap analysis**: Compare your content's terminology against top-ranking competitors. What terms are they using that you're missing?
2. **Query-document alignment**: Does each page satisfy the queries it should rank for?
3. **Context flow check**: Does the content flow logically from definition to attributes to application?
4. **Entity completeness**: Are all relevant entities in the topic covered?
5. **Attribute completeness**: For each entity, are all important attributes covered?
6. **Internal link audit**: Do contextual bridges exist between all topic clusters?
7. **Factual accuracy check**: Are specifications, prices, availability up to date?

### AA Lint Rules (Machine-Checkable)

```json
{
  "rules": [
    {"id": "AA-H1-ONE", "desc": "Exactly one H1 per page"},
    {"id": "AA-HEADINGS-ORDER", "desc": "Never skip heading levels (H1->H2->H3, never H1->H3)"},
    {"id": "AA-MACRO-CONTEXT", "desc": "Every section must serve the stated macro context"},
    {"id": "AA-EAV-COVERAGE", "desc": "Required entity attributes must be covered with values or explicit unknowns"},
    {"id": "AA-ANSWER-ZONE", "desc": "Provide an early extractive summary (40-80 words) after H1"},
    {"id": "AA-DEFINITIONAL-OPENER", "desc": "First sentence should be definitional: X is a [type] that [predicate]"},
    {"id": "AA-CONSISTENT-TERMS", "desc": "Use canonical attribute names consistently throughout"},
    {"id": "AA-NO-TANGENTS", "desc": "Every paragraph must support the macro context"},
    {"id": "AA-MIN-INTERNAL-LINKS", "desc": "At least 3 contextual internal links per article"},
    {"id": "AA-SPECS-LIST", "desc": "End with structured EAV specification list for product/entity pages"}
  ]
}
```

### Microsemantics vs Macrosemantics

- **Macrosemantics**: The overall topical structure — which topics exist, how they connect, the topical map itself
- **Microsemantics**: Sentence-level optimization — word choice, sentence structure, predicate clarity, semantic role labeling

Both must work together. A perfect topical map with poorly written content fails. Beautifully written content without topical structure also fails.

---

## 7. Entity-Oriented Search Understanding

### Core Concept

Entity-oriented search means understanding SERPs based on entities, their types, attributes, and connections — not just keyword strings.

### Entity Connections

Entities connect through:
- **Ontology**: Hierarchical "is-a" relationships (Cotman IS-A watercolor paint brand)
- **Triples**: Subject-Predicate-Object (Artists USE Cotman FOR beginner painting)
- **Co-occurrence**: Entities that frequently appear together in quality content
- **Knowledge Graphs**: Structured databases of entity relationships

### Context Defines Entities

The SAME entity word has completely different meanings in different contexts:
- "Wash" in watercolor = transparent layer of diluted paint
- "Wash" in laundry = cleaning clothes
- "Wash" in geography = dry riverbed

**Your content must establish clear context** so search engines correctly interpret entity references.

### 11 Methods to Improve Topical Authority

From the BKMKitap and other case studies:

1. **Compare entities across pages** — Compare different brands, products, techniques
2. **Compare context/content angles** — Same topic from different perspectives
3. **Compare facts/prepositions/SRL** — Ensure consistent factual framework
4. **Compare questions** — Cover the same questions competitors answer, plus more
5. **Compare N-grams** — Use the same core terminology as authoritative sources
6. **Compare web page layouts** — Match the page structures users expect
7. **Compare anchor texts** — Internal link text should use entity-defining language
8. **Take all entity attributes and order by relatedness/popularity** — Cover attributes systematically
9. **Use clear sentence structures** — Definitional, factual, comparative sentences
10. **Don't dilute context** — Stay focused on the topic without tangential content
11. **Process same entity type with same context** — All products in a category should follow the same content template

---

## 8. Initial Ranking, Re-Ranking & Historical Data

### Initial Ranking

The first ranking a search engine assigns to a new web page. Key factors:

- **Source authority**: If the website is already authoritative on the topic, new pages get higher initial rankings
- **Topical coverage**: A page published on a site with extensive related content gets boosted
- **Historical data**: A source with positive user feedback history gets better initial placement
- **Source section identity**: Different parts of a website can have different initial ranking scores

**For new sites without history:**
- Broader appeal, deeper information, and faster topical map completion boost initial ranking
- Complete your topical map quickly rather than slowly dripping content

### Re-Ranking

After initial ranking, the re-ranking process uses:
- **User behavior signals**: Click-through rate, dwell time, pogo-sticking, satisfaction
- **Content updates**: Changes to the page, new information added
- **External signals**: New links, mentions, social endorsement
- **Topical authority changes**: As you publish more content on the topic, all related pages can be re-ranked
- **Competitive landscape**: New competitors entering, existing ones improving

### Re-Ranking Methods (from patents)

- **Local interconnectivity**: Documents that link to each other in a topic cluster
- **Language and location matching**: Content in the right language for the target audience
- **Commercial intent detection**: Search engines change SERP for commercial vs. informational queries
- **Community endorsement**: Backlinks, mentions, social shares, quotes as trust signals
- **Topic familiarity**: Depth level matching (beginner vs. expert content) to user preference
- **TrustRank**: Link-based and behavior-based trust scoring
- **Agent Rank**: Author reputation affecting content ranking

### Historical Data Importance

- Same content on different sources can rank differently based on historical data
- Publishing and updating content frequently for a topic builds positive historical data
- Domain age itself is not a ranking factor, but accumulated behavioral and trust data IS
- A source from Tier 1 servers (high-trust) gets indexed faster with less inconsistency
- Discontinued / fluctuating rankings indicate low confidence scores — build more topical coverage to stabilize

### Practical Implications

1. **Publish complete topic clusters quickly** — don't trickle one article per week
2. **Update existing content regularly** — freshness signals trigger re-ranking
3. **Monitor initial ranking positions** — they reveal how much authority the search engine grants you
4. **Build diverse traffic sources** — if you only get traffic from Google, your site looks dependent; diversified traffic signals real value
5. **Internal links create local interconnectivity** — strengthen your content cluster's cohesion

---

## 9. Internal Linking: Contextual Bridges, Hubs & Propagation

### Linking Goals

Internal linking in this framework serves four purposes:
1. **Help crawlers discover and cluster content** — clear paths through your knowledge domain
2. **Help users traverse decision paths** — from learning to comparison to purchase
3. **Propagate relevance/quality to core commercial pages** — informational content lifts commercial pages
4. **Reduce retrieval cost** — clean, connected segments are cheaper to process

### Link Graph Patterns

**Pattern A — Hub propagation:**
Hub page → attribute definitions → buyer guides → product pages

**Pattern B — Problem-solution flow:**
Problem pages → solution guides → recommended products

**Pattern C — Comparison network:**
Comparison pages → category hub + individual brand hubs

### Anchor Strategy (Entity/Attribute Grounded)

Prefer anchors that include:
- Entity name: "watercolor paper buying guide"
- Attribute or use-case phrase: "how to prevent paper buckling"
- Specific, descriptive text: "300gsm cotton paper for wet-on-wet"

**Avoid generic anchors**: "click here", "learn more", "read this" — unless UI constraints require it.

### Contextual Bridge Validation

A link is valid as a contextual bridge if:
- Source page and target page share a query-network relationship
- Anchor phrase can be explained as entity/attribute overlap
- It improves navigation and context, not distracts from it

**Invalid bridge examples:**
- Linking a "watercolor technique" article to a "store hours" page (no entity overlap)
- Using "click here" as anchor for a detailed product guide (no semantic content in anchor)

### Ideal Interlink Hierarchy

1. **Contextual in-body links** (BEST): Natural links within paragraph text that flow with the content. Example: "When choosing paper, the [weight and texture](link) matter more than brand."
2. **Contextual bridge articles**: Dedicated articles that connect two otherwise separate clusters.
3. **"Keep Reading" sections** (ACCEPTABLE): Curated link lists at the bottom of articles. Less SEO value than in-body links but still useful for user navigation.
4. **Avoid**: Generic "related posts" plugins, sidebar link widgets, footer link dumps.

**Rule:** Every article should have at least 3 contextual in-body links to other articles. Add more as the content library grows.

---

## 10. Statistics & Data Authority Pages

### Why Stats Pages Matter

Statistics and data-driven pages serve a unique role in the topical map:
- **Attract backlinks naturally** — journalists, bloggers, and researchers link to data sources
- **Satisfy data-seeking intents** — queries like "watercolor paper GSM guide" or "brush size chart"
- **Create a "data authority" node** — a hub that links outward to guides, product pages, and comparisons

### How to Build Stats Pages Safely

Checklist for creating data/statistics content:

1. **Use primary sources**: Reports, journals, official datasets, manufacturer specs — not secondary blog posts
2. **Provide definitions + methodology notes**: Explain what the numbers mean
3. **Date-stamp updates**: Show "last updated" prominently — data pages must stay current
4. **Avoid cherry-picking**: Cite multiple sources where possible; present balanced data
5. **Use tables and structured formats**: Short explanations + data tables, not long narrative "fluff"
6. **Include units and measurement context**: GSM, oz/yd, pixel dimensions — specify everything

### Turning Stats Into Internal Links

From stats/data pages, create contextual bridges to:
- Relevant buyer guides: "What this means for choosing paper GSM"
- Category hubs: "Shop 300gsm papers in our collection"
- Use-case pages: "Best paper weight for wet-on-wet techniques"

### Example Stats Page Ideas

| Topic | Stats Page | Bridges To |
|-------|-----------|-----------|
| Paper | "Watercolor Paper GSM Guide & Weight Chart" | Paper buying guide, paper types, buckling prevention |
| Brushes | "Brush Size Chart: Round, Flat & Mop Sizes Explained" | Brush buying guide, technique tutorials |
| Paint | "Pigment Lightfastness Ratings: Complete Chart" | Paint buying guide, color mixing, brand comparisons |
| Industry | "Watercolor Art Market Statistics & Trends" | General blog, about page, brand story |

---

## 11. Google Author Rank & Authorship Signals

### What is Author Rank?

Google can recognize, define, and rank authors for topics based on their expertise, authority, and validity. Key mechanisms:

#### Agent Rank (Patent, 2005)
- Authors can be identified by digital signatures (profiles, linked accounts)
- Author reputation is calculated per topic, not globally
- High-reputation authors boost the content they produce
- "Seed agents" — trusted initial authors whose endorsements bootstrap reputation for others

#### Author Vectors (Patent)
- Google generates vector representations of authors based on their writing style, word sequences, topics
- Similar author vectors get clustered — the most authoritative in a cluster becomes the representative
- Author vectors extend to: language patterns, topic expertise, sentiment consistency

#### Website Representation Vectors
- Websites are classified by vector similarity — similar sites get clustered
- The most authoritative site in a cluster becomes the "representative"
- Authors from representative/authoritative sources inherit higher reputation

### Practical Author/Brand Implementation

For ecommerce and niche sites:

1. **Author pages with credentials**: Real bio, topical scope, qualifications, published works
2. **Editorial policy + update policy**: Visible content quality standards
3. **Citations for claims**: Especially for technical, medical, or financial content
4. **Clear business identity**: Contact info, address, policies, legal pages
5. **Consistent author identity across the web**: Same name, bio, photo across website, social media, third-party mentions
6. **Schema.org structured data**: Organization, WebSite, WebPage, Product, Person, FAQ as appropriate
7. **Social media profiles linked**: Connected to the same identity
8. **Third-party corroboration**: Author/brand mentioned or cited on other authoritative sites
9. **Topical consistency**: Write about the same topics consistently over time

### For Small Businesses / E-Commerce

- The brand entity CAN be the author (e.g., "Watercolor.lk" as author)
- Establish the brand as an expert entity through consistent, topical content
- Create an About page that establishes real-world expertise and identity
- Get the brand mentioned on local directories, review sites, and industry resources

---

## 12. Knowledge Panel & Brand SERP

### Knowledge Panel Basics

A Knowledge Panel is an information box on Google SERP that shows an entity's features, attributes, and prominence. Getting a Knowledge Panel signals that Google recognizes your brand as a real-world entity.

### How to Work Toward a Knowledge Panel

1. **Establish consistent entity information** across authoritative sources (Google Business Profile, Wikipedia/Wikidata if notable, Crunchbase, social media)
2. **Use Schema.org structured data** (Organization, LocalBusiness, Person) on your website
3. **Build corroboration** — the same information about your entity appearing on multiple independent sources
4. **Claim your Google Business Profile** — a primary data source for Knowledge Panels
5. **Disambiguation** — ensure Google can distinguish your entity from others with similar names

### Brand SERP Optimization

Brand SERP = what Google shows when someone searches your brand name. Optimize by:

- Controlling as many first-page results as possible (website, social profiles, review sites)
- Ensuring consistent information across all properties
- Publishing quality content that reinforces your brand's topical expertise
- Building genuine reviews and mentions on third-party sites

---

## 13. E-Commerce Topical Authority

### The E-Commerce Challenge

E-commerce sites need both:
1. **Commercial content**: Product pages, category pages, buying guides — optimized for transactional queries
2. **Informational content**: Blog posts, guides, tutorials — building topical authority that lifts commercial pages

### Product-Level Topical Authority

Cover ALL dimensions of your products:
- **Product attributes**: Price, size, color, material, weight, brand, availability
- **Product usage**: How to use, best practices, techniques, tips
- **Product comparisons**: X vs Y, best X for [use case], alternatives
- **Product reviews**: Expert opinions, user experiences, ratings
- **Product questions**: FAQ, common problems, solutions
- **Product relationships**: What works with what, complementary products, bundles

### Category-Level Topical Authority

Each product category should have:
- **Definitional content**: What is [category]? Types of [category]
- **Buying guides**: How to choose [category]. What to look for.
- **Brand coverage**: All major brands in the category, their specialties
- **Comparison content**: Brand A vs Brand B for [use case]
- **Educational content**: Techniques, tutorials, tips related to the category

### Category Pages as Entity Hubs

Treat category pages (product listing pages) as entity hubs:
- Core entity page for the category
- Attribute filter explainers (GSM, texture, cotton vs cellulose)
- Navigation entry points to deeper content

**Agent improvements for category pages:**
- Add short, precise explanation for each major attribute/filter
- Include internal links to deep guides and comparisons
- Avoid duplicate boilerplate across categories — each must have unique, useful content

### Product Detail Pages as Attribute Ground Truth

Product detail pages are where EAV is most concrete:
- Use structured specs (explicit EAV triples)
- Use consistent wording across all products of the same type
- Show use-cases, comparisons, and compatibility
- Add FAQ sections where genuinely helpful
- End with a structured specifications list

### Faceted Navigation & Duplication Risks

Common ecommerce risks that increase retrieval cost:
- **Infinite URL combinations**: Filter combinations creating thousands of thin pages
- **Near-duplicate pages**: Minimal unique value between facet variants
- **Crawl budget waste**: Higher retrieval cost with lower per-page quality

**Solutions:**
- Define canonical strategy (canonicals, parameter handling, noindex for low-value facets)
- Build "curated landing pages" for high-demand facets that deserve indexing
- Consolidate duplicates into stronger hub pages
- Use robots.txt and meta robots to control crawl scope

### Multi-Language Strategy

For sites serving multiple languages (e.g., English + Sinhala + Tamil):
- Semantic networks can be extended across languages via translation
- Implement proper hreflang tags
- Don't over-replicate strategies across too many language variants without unique value
- Start with the primary language, build the full topical map, THEN expand to additional languages
- Each language version should be a complete, coherent content experience — not partial translations

### The BKMKitap Pattern (Bookstore Case Study)

BKMKitap.com built topical authority through dual content types:
1. **E-commerce pages**: Product listings, categories, commercial content
2. **Knowledge pages**: Author biographies, book genres, literary movements, reader guides

They covered: Book Genres, Books from different geographies, Authors from different eras/cultures/ideologies, Individual author biographies, Author-book connections.

**Result:** 750K to 3.2M clicks through entity-oriented SEO that overcame massive technical problems.

**Key lesson:** The dual approach — commercial + educational — works for any ecommerce site.

### E-Commerce Content Templates

#### Product Description Template
1. Definitional sentence: "[Product] is a [type] by [brand] designed for [use case]."
2. Key attributes: Material, size, specifications
3. Best for / ideal user: Who should buy this and why
4. How to use: Brief usage guidance
5. Specifications list: Bullet-point EAV triples
6. Related products: Internal links to complementary items

#### Category Description Template
1. Definition: "What are [category products]?"
2. Types/subtypes: The different kinds available
3. How to choose: Key selection criteria
4. Brand overview: What brands are stocked
5. Local context: Availability, delivery in your region

---

## 14. Niche Site Implementation (Ads/Affiliate/Informational)

### How Niche Sites Differ from Ecommerce

Niche sites (content-only, monetized via ads, affiliate, or lead generation) don't have product pages as ground truth. Instead, the content itself IS the product. This means:
- The topical map is the entire site architecture
- Quality thresholds are often higher (competing against established publishers)
- Topical authority is the PRIMARY ranking mechanism (no product page anchor)

### Start with "Definition + Attribute + Behavior"

A niche site topical map typically begins with:
- **Definitions**: "What is X" articles for every major entity
- **Attributes**: "Types of X", "Properties of X" articles
- **Behaviors**: "How to do X", "How to fix X" tutorials
- **Comparisons**: "X vs Y" articles
- **Decision pages**: "Best X for Y" buying guides (affiliate) or recommendation lists

### Avoid "Random Keyword Clusters"

The map should reflect **query networks**, not just keyword groupings. Query networks form through:
- **Intent patterns**: Groups of queries that serve the same underlying need
- **Entity families**: Entities that share types, attributes, or relationships
- **Behavioral similarity**: Queries that users search in the same session

Don't cluster keywords by surface similarity ("watercolor tips" + "watercolor tricks" = same page). Cluster by entity/attribute overlap and user intent.

### Niche Site Publishing Strategy

1. **Phase 1 — Foundation**: Definition + attribute pages for the central entity and its immediate subtypes
2. **Phase 2 — Decision content**: Comparison and "best for" pages that drive monetization
3. **Phase 3 — Depth**: Problem-solving, advanced technique, and niche use-case content
4. **Phase 4 — Breadth**: Adjacent topics, contextual bridges to related domains
5. **Phase 5 — Data authority**: Statistics, charts, reference tables that attract backlinks

---

## 15. Monitoring & Iteration

### Metrics That Align with the Methodology

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| **Coverage completion** | % of topical map nodes published | 100% of core section first |
| **Query network growth** | Number of ranking queries per cluster | Steady growth after each cluster completes |
| **Internal link depth** | Average clicks from hub to deepest page | Max 3 clicks to any page |
| **Indexation ratio** | Indexed pages vs discovered pages | > 90% for quality pages |
| **CTR / satisfaction proxies** | Click-through rate, time on page, bounce rate | Improving trends |
| **Stability through algorithm updates** | Ranking consistency during Google updates | Minimal drops = strong authority |
| **Topical map density** | Entities covered / Total entities in domain | Higher = better coverage |

### Content Configuration Cycle (Monthly/Quarterly)

For each core node in your topical map:

1. **Compare SERP competitors**: Missing attributes, missing entities, missing intent coverage
2. **Check vocabulary**: Synonyms and terms used by top-ranking pages vs yours
3. **Add new sections only if they serve macro context**: Don't bloat pages with irrelevant additions
4. **Update stats/data pages with fresh sources**: Date-stamp all updates
5. **Re-audit internal links**: Ensure new content is linked from/to existing content
6. **Review user behavior signals**: High bounce rate pages may need restructuring

### When to Expand vs When to Consolidate

- **Expand** when: Core section is complete, rankings are stable, and there are clear topical gaps in the outer section
- **Consolidate** when: Multiple weak pages on similar topics, high crawl cost with low indexation ratio, or rankings fluctuate across related pages (indicates unclear topical clustering)

---

## 16. Case Studies Summary

| # | Website | Growth | Key Strategy |
|---|---------|--------|--------------|
| 1 | TeamColorcodes.com | 110% clicks, 7K+ top-3 rankings | Cover more entities of same type, more attributes, deepened context consistency |
| 2 | Kanbanize.com | 245% clicks, 39K+ queries | Expanded from Task Management to Business Charts to Business Efficiency via contextual bridges |
| 3 | Snuffstore.de | 1200% clicks | Product definitions, brand/manufacturer coverage, types/subtypes, health connections |
| 4 | Encazip.com | 5150% clicks, 45K+ queries | Energy company expanded to money saving, financial independence, credit, insurance |
| 5 | TheCoolist.com | 120% clicks, 561K+ queries | Fixed topical gaps with 3+ contextual bridges per topic |
| 6 | Website 6 | 320% clicks, 413K+ queries | Systematic topical coverage |
| 7 | Website 7 | 350% clicks, 210K+ queries | 3D printing + materials + configurations. Real expert authors, no backlinks needed |
| 8 | BKMKitap.com | 350% clicks, 68.5K+ queries | Bookstore: author bios, book genres, reader demographics |
| 9 | Website 9 | 200% clicks, 210K+ queries | Food/calories expanded to nutrients, amino acids, minerals, fitness |
| 10 | Website 10 | 0 to 1M clicks/month | Applied the full framework systematically |
| 11 | Website 11 | 100% clicks, 210K+ queries | Home furniture affiliate: symmetric content brief + article templates |
| BKM | BKMKitap.com (Entity SEO) | 750K to 3.2M clicks | Entity-oriented SEO overcame massive technical problems |

### Key Takeaway from All Case Studies

**No backlinks were used in most cases.** Topical authority through semantic SEO alone was sufficient to achieve massive growth. The search engine rewards comprehensive, well-structured topical coverage over link building.

---

## 17. Implementation Playbook

### Phase 1: Foundation (Week 1)

1. **Define Source Context**: Why does your website exist? What is its purpose? What expertise does it bring?
2. **Define Brand Identity**: Founder, mission, location, expertise, unique value proposition
3. **Create About Page**: Establish the brand as a real-world entity with verifiable information
4. **Set up Google Business Profile**: Consistent NAP (Name, Address, Phone) data
5. **Author/brand schema markup**: Implement structured data (Organization, Person, WebSite)

### Phase 2: Domain Modeling & Topical Map (Week 1-2)

1. **Build entity inventory**: Identify all entity types, instances, synonyms, language variants
2. **Define attribute schemas**: For each entity type, list root, rare, and unique attributes with values
3. **Identify the central entity**: What is the ONE main topic?
4. **Map entity types to content clusters**: Each entity type = one cluster in the topical map
5. **Map query templates**: For each entity type, what do users search? (how to, best, vs, types of, reviews)
6. **Design core section**: High-demand, commercially relevant content
7. **Design outer section**: Long-tail, educational, neighboring topics
8. **Set borders**: What is explicitly in scope vs out of scope
9. **Identify topical centroids**: Key hub concepts that connect everything
10. **Plan contextual bridges**: How will clusters connect?
11. **Define publishing order**: Core definitions first, then buyer guides, comparisons, outer content

### Phase 3: Content Templates (Week 2)

1. **Create content brief template**: Standard brief format for all articles (entity, attributes, related entities, queries, semantic frames, internal links)
2. **Create article templates per entity type**: Product articles, technique articles, comparison articles, guide articles — all follow the AA structure
3. **Define semantic vocabulary**: The canonical terms every article must use
4. **Define internal linking rules**: How articles link to each other, anchor text conventions
5. **Set up AA lint rules**: Machine-checkable quality constraints

### Phase 4: Content Creation (Week 3+)

1. **Start with definitional content**: "What is X?" for every major entity type
2. **Build category hubs**: Comprehensive hub pages for each product category / content cluster
3. **Create entity-specific content**: Individual product guides, technique tutorials, brand overviews
4. **Add comparison content**: X vs Y, best X for [use case]
5. **Add contextual bridges**: Articles that connect different topic clusters
6. **Publish in clusters**: 5-10 related articles at once, not individually
7. **Maintain consistency**: Follow templates, use semantic vocabulary, complete EAV triples

### Phase 5: Optimization & Expansion (Ongoing)

1. **Run content configuration audits**: Vocabulary gaps, missing entities/attributes, context flow
2. **Monitor initial rankings**: Track how quickly new content gets indexed and ranked
3. **Update existing content**: Add new information, fix gaps, refresh data
4. **Expand topical coverage**: More entities, more attributes, deeper context
5. **Build external signals**: Get mentioned/cited on authoritative sources (directories, reviews, press)
6. **Track topical authority growth**: Monitor ranking improvements across entire clusters, not just individual pages
7. **Run monthly content configuration cycles**: Compare against SERP, close gaps, update data

### Publishing Strategy Rules

- **Publish in clusters, not individually.** Push 5-10 related articles together, not one per week.
- **Complete topic clusters before moving to new ones.** Don't leave gaps.
- **Update frequently.** Regular updates build positive historical data.
- **Internal link immediately.** Every new article should link to AND FROM existing content.
- **Order matters.** Definitions before guides, guides before comparisons, core before outer.

---

## 18. Agent Prompt Templates

These are starter prompts for AI agents working on SEO content projects:

### Prompt A — Build EAV Graph from Catalog/Domain

**Task:** Create an entity graph for a niche ecommerce catalog or content domain.
**Inputs:** Product exports, category taxonomy, spec sheets, competitor content.
**Outputs:** Entity types, attributes (root/rare/unique), values, aliases, relations (JSON format).

### Prompt B — Generate Topical Map from EAV + Intent Families

**Task:** Build core + outer topical map nodes using query templates and intent templates.
**Outputs:** Node list with priorities, core/outer classification, borders, contextual bridges, publishing order.

### Prompt C — Create Content Briefs with AA Constraints

**Task:** For each topical map node, output a content brief with: macro context, required entity coverage, heading hierarchy, answer zone specification, required tables/lists, internal links (outbound + expected inbound).

### Prompt D — Link Graph Planner

**Task:** Produce an internal linking plan that enforces contextual bridges and hub propagation. Map every page to its outbound links with anchor text and bridge justification.

### Prompt E — Content Configuration Auditor

**Task:** Compare each published page vs SERP baselines and generate a revision checklist: coverage gaps, vocabulary gaps, factual gaps, context flow issues, missing internal links.

---

## 19. Curated Reference Library

### Primary Corpus (Koray / HolisticSEO / Oncrawl authored)

| Resource | URL |
|----------|-----|
| HolisticSEO main site | https://www.holisticseo.digital/ |
| Author page | https://www.holisticseo.digital/author/koray-tugberk-gubur/ |
| Topical Map + Contextual Bridges | https://www.holisticseo.digital/seo-research-study/topical-map |
| Entity SEO / Entity-oriented search | https://www.holisticseo.digital/seo-research-study/entity-seo |
| EAV Architecture | https://www.holisticseo.digital/seo-research-study/entity-attribute-value |
| Semantic Search (verbs/frames) | https://www.holisticseo.digital/seo-research-study/semantic-search |
| Ranking / Historical Data | https://www.holisticseo.digital/theoretical-seo/ranking/ |
| Quality Threshold (KD replacement) | https://www.holisticseo.digital/theoretical-seo/glossary/keyword-difficulty |
| Cost of Retrieval (SaaS guide) | https://www.holisticseo.digital/seo-research-study/saas |
| Google Author Rank | https://www.holisticseo.digital/theoretical-seo/google-author |
| Lexical Semantics | https://www.holisticseo.digital/seo-research-study/lexical-semantics |
| SEO Writing Tips (stats pages) | https://www.holisticseo.digital/on-page-seo/writing-tips-for-seo |
| Oncrawl: Topical Authority importance | https://www.oncrawl.com/technical-seo/importance-topical-authority-semantic-seo/ |
| Oncrawl: SCN + Query/Document Templates | https://www.oncrawl.com/on-page-seo/creating-semantic-content-networks-with-query-document-templates-case-study/ |
| Ecommerce Semantics (DOCX) | https://www.holisticseo.digital/wp-content/uploads/Aspose.Words/e-commerce-seo-with-semantics-3-website-examples.docx |
| Medium: Create Global Brands with Semantic SEO | https://medium.com/@ktgubur/create-global-brands-with-semantic-seo-the-longest-seo-case-study-from-300-to-13-000-66dee4b387eb |

### Secondary Sources (Community Interpretations — Use with Caution)

| Resource | URL |
|----------|-----|
| Majestic interview | https://majestic.com/seo-in-2022/koray-tugberk-gubur |
| Reboot Online Q&A | https://www.rebootonline.com/blog/q-and-a-koray-tugberk-gubur/ |
| Inlinks case study repost | https://inlinks.com/case-studies/importance-of-entity-oriented-search-understanding-for-seo-beyond-strings/ |
| Semantic content writing rules | https://rokonz.com/resources/semantic-content-writing-rules |
| GenghisDigital summary | https://genghisdigital.com.au/blog/koray-framework/ |

**Agent rule:** Treat secondary sources as derived notes, not canonical doctrine. Always prefer primary sources for methodology details.

---

## Glossary of Key Terms

| Term | Definition |
|------|-----------|
| **Topical Authority** | State where a source is recognized as authoritative on a topic — achieved through topical coverage + historical data |
| **Topical Coverage** | Breadth and depth of content covering all facets of a topic |
| **Topical Map** | Strategic blueprint of all topics, entities, attributes, and relationships to cover |
| **Topical Centroid** | Important hub concept that defines and connects multiple other concepts |
| **Topical Gap** | Missing contextual connection between topic clusters |
| **Topical Consolidation** | Focusing only on relevant topics; removing weak content that dilutes authority |
| **Contextual Bridge** | Content that connects two otherwise disconnected topic clusters via entity/attribute overlap |
| **Source Context** | The brand's purpose and relevance — why THIS source talks about THIS topic |
| **Macro Context** | The single main topic/intention of a page — must be unambiguous |
| **Micro Context** | Supporting subtopics within a page that serve the macro context |
| **EAV Triple** | Entity-Attribute-Value structure (e.g., Cotman Paint - pigment type - synthetic) |
| **Root Attribute** | Fundamental, defining attribute of an entity type |
| **Rare Attribute** | Specialized attribute that signals expert-level knowledge |
| **Unique Attribute** | Attribute specific to one entity instance |
| **Semantic Content Network (SCN)** | Interconnected web of published, interlinked content forming a comprehensive knowledge graph |
| **Query Template** | Search pattern with variable slots (e.g., "best {ENTITY} for {USE_CASE}") |
| **Document Template** | Page structure designed to satisfy a specific query template |
| **Intent Template** | The underlying user need behind a query template |
| **Predicate** | Verb/action that defines the relationship between entities |
| **Semantic Role Label (SRL)** | Parsed sentence role: Agent, Patient, Instrument, Location, Goal |
| **FrameNet Frame** | A conceptual frame organizing language into situation-specific roles |
| **Semantic Vocabulary** | The set of terms and phrases authoritative sources consistently use for a topic |
| **Algorithmic Authorship (AA)** | Controlled writing system with repeatable constraints for machine-extractable content |
| **Content Configuration** | Auditing and restructuring content to close vocabulary/semantic gaps |
| **Early Answer Zone** | The 40-80 word extractive summary immediately after H1 |
| **Macrosemantics** | Overall topical structure and organization |
| **Microsemantics** | Sentence-level optimization — word choice, structure, clarity |
| **Initial Ranking** | First ranking assigned to a new page — influenced by source authority and topical coverage |
| **Re-Ranking** | Subsequent ranking adjustments based on user feedback and signals |
| **Quality Threshold** | Minimum quality level needed to compete for a query class |
| **Relevance Threshold** | Minimum topical relevance needed to even be considered for a query |
| **Predictive Ranking** | How a search engine predicts satisfaction before behavioral signals accumulate |
| **Cost of Retrieval** | Total cost for a search engine to crawl, render, evaluate, index, and serve a document |
| **Agent Rank** | Google patent: author reputation per topic affects content ranking |
| **Author Vectors** | Vector representation of an author's writing style, topics, and expertise |
| **Website Representation Vector** | Vector classification of a website's type, authority, and knowledge domain |
| **Query Network** | The interconnected set of queries related to a topic — queries form networks through intent and entity overlap |
| **Broad Index Refresh** | Search engine refreshes ranked documents, potentially removing lower quality sources |
| **Template Footprint** | Detectable pattern of overly rigid content structure — avoid by varying surface structure while keeping EAV coverage consistent |

---

## References

### Primary
1. Koray Tugberk Gubur — HolisticSEO.digital (all articles)
2. Oncrawl SCN + Query/Document Templates Case Study
3. Oncrawl Topical Authority + Semantic SEO Case Study
4. EAV Architecture — holisticseo.digital/seo-research-study/entity-attribute-value
5. Topical Map Expansion — holisticseo.digital/seo-research-study/topical-map
6. Entity-Oriented Search — holisticseo.digital/seo-research-study/entity-seo
7. Semantic Search — holisticseo.digital/seo-research-study/semantic-search
8. Ranking / Historical Data — holisticseo.digital/theoretical-seo/ranking
9. Google Author Rank — holisticseo.digital/theoretical-seo/google-author
10. Knowledge Panel — holisticseo.digital/theoretical-seo/knowledge-panel
11. Lexical Semantics — holisticseo.digital/seo-research-study/lexical-semantics
12. SaaS SEO + Cost of Retrieval — holisticseo.digital/seo-research-study/saas

### Secondary
13. GenghisDigital Framework Summary — genghisdigital.com.au/blog/koray-framework
14. Koray Methodology Agent Training Document (internal, 2026-03-01)

---

*This knowledge base was synthesized from Koray Tugberk Gubur's primary writings and supplemented with the agent-training methodology document. It covers entity modeling, topical mapping, semantic content networks, algorithmic authorship, internal linking theory, ecommerce/niche implementation, and monitoring. Updated 2026-03-01 (v2.0 — major upgrade integrating all 16+ methodology gaps).*
