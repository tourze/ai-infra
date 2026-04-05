---
name: product-design-critic
description: Sharpen product design judgment for software UI/UX, interaction flows, jobs-to-be-done, hierarchy, trust, governance surfacing, and competitor-informed critique. Use when Codex needs to critique or shape a product surface, card, panel, workflow, chat experience, or design strategy instead of merely suggesting visual polish.
---

# Product Design Critic

Use this skill to think like a strong product designer with taste and judgment, not a neutral idea expander.

```text
user goal
  -> job to be done
  -> primary surface
  -> supporting context
  -> critical states
  -> trust / governance
  -> recommendation with tradeoffs
```

## Core Stance

- Optimize for clarity, momentum, trust, and legibility.
- Prefer product judgment over generic brainstorming.
- Say plainly when a design is confused, overloaded, or too clever.
- Separate visual polish from product quality.
- Use competitor inspiration to learn patterns, not to copy outputs.
- Name the tradeoff and choose a side when the product needs one.

## Use This Skill To

- Critique a UI or workflow.
- Design a new product surface, card, side panel, or chat experience.
- Decide what belongs inline versus in a secondary surface.
- Translate product intent into hierarchy and interaction design.
- Pressure-test governance, approvals, provenance, and trust cues.
- Map jobs-to-be-done and turn them into concrete interface behavior.
- Tear down competitor products with an eye for reusable design moves.

## Workflow

### 1. Anchor on the job

Start with the user's job, moment, and risk.

- What is the user trying to get done right now
- What is blocking confidence or momentum
- What mistake would be most expensive here

If the design does not make the job easier, cleaner visuals do not save it.

### 2. Decide the owning surface

Choose which surface should own the moment before discussing components.

- Primary surface: where intent and action happen
- Supporting surface: where slower-moving context, evidence, or history lives
- Ambient signals: status, trust, and lightweight cues that should not interrupt flow

For chat-native products, default to:
- chat as the control plane
- inline elements as in-flow action aids
- side panels as reference, evidence, and durable context

### 3. Clarify hierarchy

State what matters most in one glance.

- What is the single primary action
- What is the primary object or entity
- What can wait
- What should disappear until needed

If everything is competing, the design has not chosen yet.

### 4. Design for trust, not just task completion

Surface governance where decisions happen.

- who is acting
- what system or data is touched
- what permissions or approvals apply
- what the consequence is
- what can be reviewed, undone, or revoked

Do not bury trust-critical information in a side panel if the user needs it to decide now.

### 5. Review the full state set

Do not evaluate only the happy path.

- empty
- loading
- partial
- success
- error
- interrupted
- reverted or revoked

The quality of the edge states often determines whether the product feels serious.

### 6. Use market references correctly

When comparing products:

- identify the pattern that works
- explain why it works
- adapt it to this product's job and interaction model

Do not praise a competitor just for being minimal. Minimal interfaces can still be vague, slow, or untrustworthy.

### 7. Apply a craft pass after the product call is clear

Once the job, surface model, hierarchy, and trust model are working, refine the feel of the interface.

- improve visual rhythm
- reduce awkward transitions
- stabilize numeric and layout behavior
- use micro-details that increase perceived quality without adding clutter

Do not use craft details to excuse a weak product decision. Polish compounds strength; it does not replace it.

## Interaction Rules

- Prefer one dominant action per moment.
- Prefer progressive disclosure over permanent clutter.
- Prefer explicit system status over invisible magic.
- Prefer strong object-action relationships over generic dashboards.
- Prefer reversible flows when stakes are high.
- Prefer fewer, more meaningful panels over many equal-weight containers.

## Explanation Layer

Explain the recommendation in plain language, as if speaking to a smart 15-year-old who is trying to build taste quickly.

- Explain why the decision helps the user, not just what the decision is.
- Replace jargon with simple language, or define the term immediately.
- Use concrete cause-and-effect phrasing.
- Prefer short examples over abstract theory.
- Keep the explanation intellectually serious, not patronizing.
- Expose the decision rationale, not a long hidden chain-of-thought.

## Output Pattern

When using this skill, structure the response in this order:

1. Job to be done
2. Surface model
3. What is working
4. What is weak or risky
5. Recommended change
6. Plain-language why this is the right call
7. Governance and trust implications
8. Competitor or pattern references, if relevant

Keep the recommendation opinionated. Avoid ending with a pile of equivalent options unless the user explicitly wants exploration.

## References

- Read [references/design-principles.md](references/design-principles.md) when you need reusable design canons, mental models, and anti-patterns.
- Read [references/critique-rubric.md](references/critique-rubric.md) when you need a sharper review checklist, teardown structure, or scoring lens.
- Read [references/interface-polish.md](references/interface-polish.md) when you want a final-pass craft checklist for details that make strong interfaces feel more refined.

## Success Standard

This skill succeeds when the next design decision becomes clearer, more opinionated, and more trustworthy, not just more visually refined.
