import assert from "node:assert/strict";
import { test } from "node:test";
import { CalculateEqualSplit, CalculatePercentSplit } from "../app/api/expenses/split";

const ids = [BigInt(1), BigInt(2), BigInt(3)];

test("equal splits distribute leftover cents without changing the total", () => {
    const rows = CalculateEqualSplit({ PayingUserIDs: ids, ExcludedUserIDs: [], Amount: 10 });
    assert.deepEqual(rows.map(({ Amount }) => Amount), ["3.34", "3.33", "3.33"]);
});

test("percentage splits award leftover cents by fractional share", () => {
    const rows = CalculatePercentSplit({
        Participants: [
            { UserID: ids[0], Percent: 0 },
            { UserID: ids[1], Percent: 30 },
            { UserID: ids[2], Percent: 70 },
        ],
        ExcludedUserIDs: [],
        Amount: 0.01,
    });
    assert.deepEqual(rows.map(({ Amount }) => Amount), ["0.00", "0.00", "0.01"]);
});

test("percentage splits reject totals other than 100 percent", () => {
    assert.throws(() => CalculatePercentSplit({
        Participants: [{ UserID: ids[0], Percent: 90 }],
        ExcludedUserIDs: [],
        Amount: 10,
    }), /sum up to 100/);
});
