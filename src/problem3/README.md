## WalletPage refactor: inefficiencies & anti-patterns found

1) getPriority declared inside component
	- Problem: `getPriority` is declared inside the component which causes a new function instance to be created on every render.
    - Impact: unnecessary allocations and may break referential equality checks if the function were used in dependencies or passed down.
	- Refactor: `getPriority` was moved to module scope and strongly typed (`Blockchain` union). This avoids recreating the function each render and improves readability and type safety.

2) Missing/incorrect typing for `WalletBalance.blockchain`
	- Problem: implicit `any` / inconsistent types lead to unsafe usage and prevents compile-time checks.
    - Impact: runtime surprises and lost TS safety.
	- Refactor: added a `Blockchain` union type and included `blockchain` on `WalletBalance`. This enables safer calls to `getPriority` and better tooling.

3) Broken filter predicate
	- Problem: wrong variable name and inverted logic - the predicate returns `true` for balances with amount <= 0 and returns `false` for others.
	- Impact: incorrect list of balances (keeps zero/negative amounts) and likely runtime ReferenceError in stricter environments.
	- Refactor: the filter predicate was corrected to use the proper `priority` variable and the logic now keeps only items with priority > -99 and amount > 0.

4) Incorrect and verbose sort comparator
	- Problem: verbose, error-prone comparator that omits the equal case.
	- Impact: unclear sort semantics and potential unpredictable ordering for equals.
	- Refactor: comparator simplified to numeric subtraction: `getPriority(rhs) - getPriority(lhs)` which handles all cases (positive, negative, zero) cleanly.

5) Multiple, unnecessary traversals of arrays
	- Problem: extra iterations over the same data (filter -> sort -> map, and then another map) increase CPU work.
	- Impact: extra work for large lists; avoidable re-computation on renders.
	- Refactor: the pipeline was combined inside `useMemo` (filter -> sort -> map) and memoized as `formattedBalances`, so rows iterate only once over a memoized array. Also `useMemo`'s dependency was tightened to avoid unnecessary recomputations.

6) Wrong array used when rendering rows (mix of sorted vs formatted)
	- Problem: `rows` consumes the wrong array and expects fields that are only in `formattedBalances` - a bug leading to `undefined` `formatted` or stale data.
	- Impact: runtime errors or rendering incorrect/empty formatted amounts.
	- Refactor: `rows` iterates over the memoized `formattedBalances`, guaranteeing each item has the `formatted` property.

7) Using array index as React key (anti-pattern)
	- Problem: index keys cause issues when lists are reordered - they prevent React from preserving element identity across reorder operations.
	- Impact: visual glitches, lost input focus, and inefficient reconciliations during reorder.
	- Refactor: use a deterministic key (`key={`${balance.blockchain}`}`) which is stable across renders and better for reordering. (If `blockchain` is not unique across items in real data, a stable unique id should be used instead.)

8) Unsafe price lookup (possible NaN)
	- Problem: if `prices[balance.currency]` is undefined, multiplication yields `NaN`.
	- Impact: UI displays NaN or breaks numeric calculations.
	- Refactor: use `(prices[balance.currency] || 0) * balance.amount` to safely default to 0 if price is missing.

9) Wrong useMemo dependencies (over-broad)
	- Problem: unnecessary re-computation of memoized values when unrelated `prices` change.
	- Impact: avoided optimization - extra recomputations.
	- Refactor: dependency array reduced to `[balances]` which is the only input to the pipeline. This avoids recompute when `prices` changes.

10) Inconsistent/weak typing in component and props
	 - Problem: missing typing makes reasoning and refactor harder and allows accidental misuse.
	 - Impact: weaker editor/compile-time checks and potential runtime bugs.
	 - Refactor: `Props` now declares `children?: ReactNode` and local variables `balances` and `prices` are strongly typed (`WalletBalance[]`, `Record<string, number>`). This improves safety and readability.

Quality/Performance summary
- Fixed multiple correctness bugs (undefined variable in filter, wrong array used, unsafe price lookup).
- Reduced work by combining filter/sort/map into a single memoized pipeline and tightening memo dependencies (fewer array traversals and fewer recomputations).
- Improved type safety by adding `Blockchain` union, typing `WalletBalance`, `FormattedWalletBalance`, `balances`, and `prices`.
- Improved React rendering stability by replacing index keys with stable keys.


