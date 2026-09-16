# AGNTS docs — factcheck & open items
Run 2026-09-12. Every "chain" line below was read live off `https://rpc.mainnet.chain.robinhood.com` today.

## Verified on chain

```
NFT        0x57eFd86cf3ab1812CB47F0FD3c3d5bf0eFb1F2D5   name/symbol "AGNTS"  MAX_SUPPLY 6969
owner      0xEdaA4c0e0056eD6A17A755493c283296Fe8202Bb   (Breadio — treasury)
controller 0xfAD3335ba59c8e4438C2be47147080EF5809bF7e   paused() = true
oracle     0x209bF1C450f0456eEb7e21b009F4c1452CDB2930   fixed $2,500 peg -> 0.004 / 0.002 ETH

balanceOf(Breadio)     2272
balanceOf(controller)  1671   <- unsold stage inventory
balanceOf(0x...dEaD)      0   <- NOTHING HAS BEEN BURNED
derived: holder wallets 3026  (6969 - 2272 - 1671)
tierOf(1) = 0            tierOf is live and deterministic
```

## Corrections made to your draft (article one)

| Draft said | Reality | Why it changed |
|---|---|---|
| 3,434 public / 3,535 vault | 4,750 slots activated into the controller, 2,219 held outside. Today: 3,026 in wallets / 1,671 unsold in controller / 2,272 treasury | That split never shipped. Three different plans exist in the repo (2,500 vault on 09-08, 3,484/3,485 on 09-09, 4,750/2,219 deployed). Publishing 3,434/3,535 would be the only version that matches nothing. |
| "Mint: Thursday Sept 10, 1pm UTC" | **Friday, September 11 at 12pm** (Tut, 2026-09-12) | Both the draft and my notes were off. Article one now carries the real time. |
| "GTD Phase: 2 hours, then public" | Shipped as delta rounds r1–r4; a wallet's entitlement is the SUM of its leaves across rounds. r5 built, never deployed. | The 2h-GTD-then-public structure isn't what ran. Replaced with "fully allowlisted." |
| "After mint completes, the burn phase begins" | Burns are **not open**. Burn + reroll were disabled at launch, and the burn address holds 0. | Article now states the ladder is locked but not live. |
| "5% trading fee on PFP swaps and gacha packs" | Locked wording: 5% on **secondary sales and vault swaps** | Packs pay the mint price, not a 5% trading fee. |
| "~$15 in eth on RH" / "link shared closer to date" | removed | Mint-day operational copy; doesn't belong in an evergreen doc. |
| "rarity tiers determine your reward multiplier" | made concrete: 1× / 5× / 15× / 30× | It was locked already, just not written down in the article. |

Kept as-is and confirmed correct: the $5 / $10 / $2.50 pricing (= 0.002 / 0.004 / 0.001 ETH at the $2,500 peg), tier counts 5,669 / 1,000 / 250 / 50, the burn ladder ratios, the 70/30 split, and the 0.4% / 5% / 10% fee sources.

Mint result numbers (3,079 sold · 658 free of 850 · 6.28 ETH · 0 cancellations · 192 free owed) come from the mint-day tally, not from a fresh chain read. The chain-derived 3,026 in wallets is consistent with 3,079 sold less the ~53 still sitting with Breadio pending delivery.

## Open before article one is safe to publish

1. **Burn model — SETTLED (Tut, 2026-09-12).** Burn a stack, draw a **random AGNT from vault inventory in the next tier up, with odds to land higher**. That kills the `TutVault.burn()` design, which deterministically mints a *new* tokenId 6970+ with no art in the 6,969 manifest. The contract has to be reworked to draw from inventory before burns open — the fixed pool of 6,969 is now safe, but the code doesn't implement this yet.
2. **Fee-share language — CONFIRMED as written (Tut, 2026-09-12).** The 70/30 rewards line stays. Noting once for the record that the equivalent wording was flagged for counsel before and rewritten to utility framing; Tut has re-affirmed it.
3. **ERC-6551 / RWA — REVERSED 2026-09-16.** Every reference to tokenized-asset distributions ($AAPL, $NVDA) is REMOVED from all public copy. Distributing tokenized equities to passive holders is a securities distribution in its own right, independent of any question about the NFT, and pulls in broker-dealer and transfer-agent exposure. **This is a design decision still open** — the copy is out; whether the mechanic survives is counsel's call.
4. **Mint date — RESOLVED.** Friday, September 11 at 12pm.

## Open before article two ships

1. **Activation split — DECIDED, not built. 50% burns, 50% to treasury (Tut, 2026-09-12).** `AgntsActivation.sol:108` is `agnts.burn(p)` — the full peg, with no treasury leg at all. Needs `burn(p/2)` plus a transfer of `p/2` to treasury, and a treasury address in the constructor. The 10% activation fee is paid in **ETH to treasury** — not $AGNTS, not to stakers, and not a holder reward stream. Activation cost is also now its own ladder (100k/300k/600k/1M), independent of the peg.
2. **Stake weight — RESOLVED 2026-09-16.** Activation is priced on its own ladder (100k/300k/600k/1M), separate from the peg, so nothing is "staked" and nothing is locked — it is spent. All staking and lock-up vocabulary is removed from public copy; it was both inaccurate and the wrong framing.
3. **Token route — SETTLED.** Deployed on AGNT Social, custom v4 pools. The article says no more than that. The old A-vs-B question is closed. Still verify at launch that the 500M vault carve reaches TutVault — the carve is claimed by `release()` from the recipient's own wallet and TutVault has no `release()`, so it has to route through an EOA and transfer in.
4. **Launch timing copy is stale in the old draft.** "Mints Thursday, token 24 hours after mint completes" is superseded — the collection is minted and live, and the token launches on AGNT Social **early this week, no date**. The locked article opens on that instead.
5. **1.095% is settled** — you wrote it into the draft yourself, so the old 1%-vs-1.095% conflict with the flowchart is closed in favor of the live v4 hook rate. The flowchart still says 1% and should be regenerated.

## Vault fees — added 2026-09-12 (Tut)

**5% of floor to use the vault, 15% to pick the exact piece, one way.** Selling into the vault returns the full peg; the fee only applies taking a piece out. The 10% gap between random and picked scales with tier automatically, so a Legendary snipe costs 450,000 $AGNTS and a Common snipe 15,000 — no hand-tuned snipe table needed. Now in article two.

**Both follow-ups answered (Tut, 2026-09-12):** burning does **not** pay the fee — the burn draw pulls from vault inventory free, so the ladder carries no extra drag. And the 5% goes to the **protocol fee wallet**.

The fee wallet splits **70% to the distribution pool / 30% to treasury** — everything outside the 1.095% trade fee. The activation fee is NOT in that 70%; it is a treasury fee. Public copy now states that nothing has been distributed and that fees collected before distributions go live are not paid out retroactively.

## The ladder was flat — RESOLVED 2026-09-12

Every rung is peg-neutral, weight-neutral and cost-neutral, because the peg and the reward weight are the same number (100k/500k/1.5M/3M IS 1x/5x/15x/30x):

| Burn | Peg in | Peg out | Weight in | Weight out |
|---|---|---|---|---|
| 5 Commons -> Rare | 500,000 | 500,000 | 5 | 5 |
| 3 Rares -> Epic | 1,500,000 | 1,500,000 | 15 | 15 |
| 2 Epics -> Legendary | 3,000,000 | 3,000,000 | 30 | 30 |

So burning costs four NFTs and returns nothing but the odds of landing above the guaranteed tier. **The ~1,400 circulating figure was removed from both articles — no model supports it.** Spec floor 2,779; model at locked odds 4,115.

Fix direction (Tut working it): unweld the two dials. Peg stays linear — it is the redemption promise. Reward weight curves. `AgntsActivation.sol` already stores `uint256[TIERS] public peg` and comments it "stake weight per tier (= $AGNTS peg)"; a second array is a few lines and the vault's solvency never moves.  Size of the premium is open — it sets how fast 6,969 actually drains.

## Written but not in your draft — available if you want them

Two items. (A dollar-denominated floor table was here and is **cut** — the floor is the peg, and the peg is denominated in $AGNTS: 100,000 / 500,000 / 1,500,000 / 3,000,000. Not dollars.)

- **Swap as a fourth vault action** — trade your AGNT plus the 5% vault fee for a fresh pack, floor at your own tier, odds to climb. Your fee list already charges "5% on vault swaps," so the mechanic is referenced but never introduced.

## Still on the mint itself

- 192 free packs owed to tut holders
- straggler round for wallets with no allocation
- `withdrawProceeds()` — 6.28 ETH unswept
- `closeStage` + `sweepUnsold` moves the 1,671 to the vault. **One-way door — do it last.**

## Securities framing pass — 2026-09-16

A Howey-framing audit ran across all nine mintlify pages, both articles, the posted announcement and
the oracle seed. **This was a language review, not legal advice.** Fourteen copy findings applied:

- **Tokenized-equity rewards removed** — $AAPL / $NVDA references gone from every document.
- **"Climbing pays" / "earns more than the stack"** replaced with the mechanic: a Rare's weight (6)
  exceeds the combined weight of the five Commons burned to draw it (5).
- **"70% of fees go to holders"** now states that nothing has been distributed, that only the listed
  streams fund the pool, and that earlier fees are not paid out retroactively.
- **Vault language** — "gives every piece a floor", "backing the pieces", "redemption value" replaced
  with what the vault does: swap a piece for a fixed amount per tier, while it holds tokens to pay.
- **Market-cap scenario table and USD floor quotes deleted** — together they implied a price
  expectation.
- **Staking vocabulary removed** from Article 2, which was also factually stale (it said a Legendary
  stakes 3,000,000; activation costs 1,000,000 and nothing is locked).
- **"IP that grows way beyond the collection"** removed — that sentence type decided Impact Theory.
- **Collectible warning now on all four AGNTS pages** and both articles, not one page.

### Still open, and not copy problems

1. **The live posted announcement** still carries "share a portion of fees from the protocol and
   royalties". `ANNOUNCEMENT.md:103` records that this was identified as securities-sensitive on
   2026-09-08 and rewritten, but the post was never corrected. That note is discoverable — fix the
   post, then append the date, and do not delete the note.
2. **RWA as a mechanic**, not just as copy.
3. **The activation design itself.** Pay a non-refundable fee, receive a weekly pro-rata slice of
   platform fees weighted by how much you paid. No wording changes that shape. The design remedies
   are to tie the share to the holder's own activity, cap it to non-monetary utility, or accept the
   exposure with counsel structuring it.
4. **The promoter-run fixed-peg vault holding 50% of supply** is price support by construction, and
   "always returns the full peg" depends on treasury solvency. The failure mode is undisclosed.
