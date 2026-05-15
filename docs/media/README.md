# Nu Standard Media System — Documentation Hub

This folder contains the **executable production specification** for Nu Standard website media (still + motion): registry, prompts, implementation mapping, performance governance, and sequencing discipline.

## Creative authority status

A canonical file titled **“Nu Standard Media System Blueprint V1”** was **not found** in-repo during indexing. These documents **establish the baseline** and intentionally align with:

- Nu Standard **premium trust** and **owner-operator accountability** positioning  
- **Calm professionalism** (no cinematic gimmicks; no stock reliance per registry rules)  
- **Educational trust compression** (short dwell educational loops; macro discipline)

If an upstream creative PDF/Figma vault exists externally, **import references here** as `docs/media/UPSTREAM_CREATIVE_AUTHORITY.md` linking-only (no binary blobs required).

---

## Document map

| Document | Purpose |
|----------|---------|
| [`NU_STANDARD_MEDIA_ASSET_REGISTRY_V1.md`](./NU_STANDARD_MEDIA_ASSET_REGISTRY_V1.md) | Authoritative **asset IDs**, categories, placements, emotional objectives, priorities, mobile crop flags (**42 assets** in V1). |
| [`NU_STANDARD_IMAGE_PROMPT_LIBRARY_V1.md`](./NU_STANDARD_IMAGE_PROMPT_LIBRARY_V1.md) | Production-grade **image prompts** with anti-drift negatives + wardrobe/home realism discipline. |
| [`NU_STANDARD_VIDEO_PRODUCTION_LIBRARY_V1.md`](./NU_STANDARD_VIDEO_PRODUCTION_LIBRARY_V1.md) | **Video sequencing**, allowed/forbidden motion + pacing, audio/caption/overlay rules. |
| [`NU_STANDARD_MEDIA_IMPLEMENTATION_MAP_V1.md`](./NU_STANDARD_MEDIA_IMPLEMENTATION_MAP_V1.md) | Maps **surfaces → assets**, responsive + lazy + motion policies + fallback behavior. |
| [`NU_STANDARD_MEDIA_PERFORMANCE_GOVERNANCE_V1.md`](./NU_STANDARD_MEDIA_PERFORMANCE_GOVERNANCE_V1.md) | Performance budgets, autoplay policy, a11y + reduced-motion, CDN expectations. |
| [`NU_STANDARD_LAUNCH_CRITICAL_ASSET_SET_V1.md`](./NU_STANDARD_LAUNCH_CRITICAL_ASSET_SET_V1.md) | **Launch Wave V1:** curated hero / OO trust / booking reassurance / environmental prompts, sequencing, crops, culling. |
| [`NU_STANDARD_LAUNCH_ASSET_IMPLEMENTATION_PLAN_V1.md`](./NU_STANDARD_LAUNCH_ASSET_IMPLEMENTATION_PLAN_V1.md) | **Launch placement plan:** target surfaces, responsive behavior, loading + fallback, implementation priority order. |

---

## Governance & anti-drift enforcement

1. **No asset enters production** without a matching **Asset ID** row in the registry (status moves `planned → briefed → gen → approved`).  
2. **No generation** without copying baseline negatives from the image prompt library **§ Negative instructions master list**.  
3. **Style coherence:** palette tokens + lens/format discipline repeated across prompts.  
4. **Implementation sequencing:** still-first → optional hero video **only if** performance governance thresholds satisfied.

---

## Relationship to runtime code

These docs **do not** automatically wire media into `apps/web`. Implementation follows [`NU_STANDARD_MEDIA_IMPLEMENTATION_MAP_V1.md`](./NU_STANDARD_MEDIA_IMPLEMENTATION_MAP_V1.md) via future focused PRs (typically `public/` marketing routes first).

---

## STOP — README hub only

For architecture primitives governance unrelated to media, see `docs/governance/README.md`.
