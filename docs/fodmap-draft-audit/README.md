# Draft recipe audit (not a pack, not a menu)

Developer notes for the 8 November 2026 packet. Nothing in this folder is installed, shown in the app, or eligible for Make my week. `src/utils/fodmap/productionDataset.js` stays empty. The app does not import these files.

`candidates.json` is the handoff as received. `audit.md` is the source write-up. This page only records how to read them and what is still open.

## Status of the eight drafts

Two breakfasts (B01, B02) and six mains (M01–M06). All original culinary drafts. All of these are null or false, on every recipe:

- `clinical_review_status`: `not_reviewed`
- `low_fodmap_status`: null
- `meal_fodmap_assessment`: null
- `eligible_for_trial_menu`: false
- `nutrients_per_serving`: null
- each line’s `fodmap_classification` and `fodmap_grams_per_serving`: null
- `brand`: null
- `allergy_safety_verified`: false

There is no therapy-ready week and no numeric reintroduction dose. No automatic plan should be generated from this folder.

## What was actually looked at

One public supplement of Liljebo, Störsrud and Andreasson, BMC Nutrition (2020), doi:10.1186/s40795-020-00374-3. Selected table cells only. Not the unpublished 1,060-food database, not a serving-threshold table, and not a clinical review. Attribution and licence notes are inside `candidates.json`. Monash recipes, photos and dose tables were not copied. The NHS gentle-diet leaflet was not copied and is not treated as a Monash-equivalent protocol.

## Missing is not zero

`published_values_g_per_100g: null` means this audit did not import a number. It is not a zero, and it is not “FODMAP-free”.

A numeric `0` in a published cell (orange, potato, cucumber) is a figure reported in that supplement. It is not proof that every variety, form and serving was assayed, and it is not a low-FODMAP threshold. Green lentils have a single reported GOS value (0.46 g/100 g). Other subtypes for that food are absent, not zero. The 40 g lentil amount in M04 is a kitchen draft, not a classified portion.

## Water, oil, and laboratory scope

Water and olive oil are marked `not_found_in_selected_public_supplement` because that one supplement did not list them. That is the limit of this audit. It does not mean plain potable water needs its own FODMAP laboratory test, and it does not mean every pure fat is permanently clinically unknown.

A later human review of a whole recipe may record a food-identity rationale, with provenance, for ingredients of that kind. This repository does not write that rationale, and the software does not auto-pass water, oil, or any other ingredient. The app also does not require a separate lab value on every line. The only thing that could eventually filter Make my week is a reviewed recipe at one individual serving. None exists in production.

## Serving when cooked weight is unknown

`finished_weight_g` is null because nobody has weighed the cooked dish yet. The draft already defines the serving as the entire prepared recipe from the stated inputs. Unknown yield is kitchen work still pending. It does not, by itself, make that input-defined serving unportionable. These drafts are still not recipes in the planner.

A larger batch that keeps the same amount on each plate is the same individual serving. A different amount on the plate, a substitution, or a different preparation would need its own review. Do not assume a brand, a portion transfer, or a swap.

## Gaps a reviewer still has to close

- Evidence and clinical review of each fixed serving, including the whole plate. Partial table matches are not that review.
- Soy is listed on B02, M01, M02, M03, M05 and M06. A soy exclusion removes those six. B01 and M04 do not list soy. Do not substitute to fill the hole, and do not treat what remains as a nutritionally adequate week.
- M05 also lists peanut. Allergen flags are unverified.
- No energy, protein, iron, calcium, B12, iodine, zinc, omega-3 or fibre figures. `nutrients_per_serving` is null on purpose. A day built from these drafts has not been assessed.
- Two breakfasts and six mains are not a varied week.
- Reintroduction still needs a clinician’s own foods and amounts. This packet has none.
- Kitchen test of method and cooked yield, when someone decides a draft is worth cooking. That test is not a FODMAP approval.
