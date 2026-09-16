# Article Two — $AGNTS, the token that powers the whole thing

**Status:** copy LOCKED 2026-09-12 (Tut's draft) · token NOT deployed
**Launch:** AGNT Social, early this week. No date yet.
**Blocking:** activation split (50% burn / 50% treasury) and the 1/6/21/55 weights are decided but not built — see FACTCHECK and `drop/REWARD-MODEL.md`

---

Article one covered the tut™ AGNTS PFP collection — the art, the mint, the burns.

This one covers the other half: **$AGNTS**, the ERC-20 that powers the whole thing.

## The token

**1,000,000,000 $AGNTS.**

- **50% fair launch on AGNT**
- **50% held by the tut™ AMM vault** for swaps.

Trades through our own custom v4 pools.

$AGNTS will be tradeable on AGNT from launch.

## The peg

Every AGNT has an equivalent value of $AGNTS, by tier:

| Tier | Peg |
|---|---|
| Common | 100,000 $AGNTS |
| Rare | 500,000 $AGNTS |
| Epic | 1,500,000 $AGNTS |
| Legendary | 3,000,000 $AGNTS |

The vault trades at the peg. Both directions.

Bring $AGNTS, take an AGNT PFP out. Bring an AGNT PFP, take $AGNTS out.

Which means the vault will accept any piece at the fixed amount for its tier, while it holds $AGNTS to pay.

**Using the vault costs 5% of the floor.** Want to pick the exact AGNT you're taking out, instead of a random one? That's 15%.

The fee is one way — selling into the vault returns the full peg. Burning doesn't pay it at all. Fees go to the protocol fee wallet.

| Tier | Floor | Random (+5%) | Pick it (+15%) |
|---|---|---|---|
| Common | 100,000 | 105,000 | 115,000 |
| Rare | 500,000 | 525,000 | 575,000 |
| Epic | 1,500,000 | 1,575,000 | 1,725,000 |
| Legendary | 3,000,000 | 3,150,000 | 3,450,000 |

## 3 things you can do

1. **Buy an AGNT with $AGNTS** — pay the peg, take your piece out of the vault.
2. **Sell an AGNT to the vault** — hand it in, take the peg.
3. **Activate** — makes a piece eligible for the protocol's fee distribution.

## Activation

Activating a piece costs a fixed amount of $AGNTS by tier — **100,000 Common · 300,000 Rare · 600,000 Epic · 1,000,000 Legendary** — plus a fee of 10% of the piece's floor price, paid in ETH.

Half the $AGNTS is burned, half goes to treasury. **None of it is returned or redistributed to other holders.**

An activated piece is eligible for the distribution pool at its tier's weight:

| Tier | Weight |
|---|---|
| Common | 1× |
| Rare | 6× |
| Epic | 21× |
| Legendary | 55× |

The weights are steeper than the burn ratios on purpose: a Rare's weight (6) is higher than the combined weight of the five Commons burned to draw it (5). Otherwise a burn would leave your share unchanged.

## How fees are split

**1.095% on $AGNTS trades: 100% to the protocol.**

**Everything else:** when distributions go live, the pool will be funded by 70% of the streams below. The remaining 30% goes to treasury. Nothing has been distributed to date.

- 5% on secondary sales and vault swaps
- 0.4% on curated token launches

## It burns from both ends

Two supplies shrinking at once.

**Pieces burn:** 5 Commons → a Rare or better, and up. Modelled against today's holders, supply ends near **4,100**. That end state is a projection.

**$AGNTS burns:** every activation burns 50% of the peg.

---

AGNTS are collectibles. Activation is a mechanic within the collection, not an investment, and nothing here should be read as a return, a yield, or a promise of any payment. Distributions depend entirely on protocol activity — there is no fixed rate, no guaranteed amount, and no promised outcome.
