// =========================================================
// budget.js — THE WEEKLY NUMBER MATH
//
// The formula:
//
//   weekly amount = (money now
//                    − fixed bills due before the next money date
//                    − money set aside in your jar(s))
//                   ÷ weeks left until the next money date
//
// Worked example (also checked in tests.html):
//   Money now: $3,000 on Wed Nov 18, 2026
//   Next money: Jan 5, 2027  → 48 days away = 6.86 weeks
//   Bills before then: rent $800 on Dec 1 and Jan 1, phone $50 on Dec 15 = $1,650
//   Jar: $0
//   ($3,000 − $1,650 − $0) ÷ 6.86 = $196.87 → "You can spend $196 this week"
//
// Details that keep it fair:
//  • A "week" starts on the weekday you first set up HazelHollow.
//  • The weekly amount is fixed at the start of each week. Spending you
//    log this week is subtracted from it ("$X left this week").
//    If you overspend, next week's number gently shrinks to make up for it.
//  • If your next money arrives mid-week, that last short week gets
//    everything that's left.
//  • Bills due on the day you entered your balance count as already paid.
//  • Everything here is an ESTIMATE based on what the person types in.
// =========================================================

const Budget = (function () {
  // ---- Date helpers. Dates are text like "2026-11-18". ----
  // We turn a date into a plain day number so we can subtract dates safely.
  function D(str) {
    const [y, m, d] = str.split("-").map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 86400000);
  }
  function fromD(n) {
    return new Date(n * 86400000).toISOString().slice(0, 10);
  }
  function todayStr(now) {
    const t = now || new Date();
    return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  }
  function daysInMonth(y, m) { // m = 1..12
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }

  // ---- Bills: list every time a bill is due from day `a` up to (not including) day `b`. ----
  function billDates(bill, a, b) {
    const out = [];
    if (b <= a) return out;
    if (bill.freq === "once") {
      const d = D(bill.date);
      if (d >= a && d < b) out.push(d);
    } else if (bill.freq === "weekly") {
      let d = D(bill.date);
      if (d < a) d += Math.ceil((a - d) / 7) * 7; // jump forward to the first one on/after a
      for (; d < b; d += 7) out.push(d);
    } else { // monthly, on day `bill.day` (if the month is shorter, the last day)
      const start = new Date(a * 86400000);
      let y = start.getUTCFullYear(), m = start.getUTCMonth() + 1;
      for (let i = 0; i < 400; i++) {
        const day = Math.min(Number(bill.day) || 1, daysInMonth(y, m));
        const d = D(y + "-" + String(m).padStart(2, "0") + "-" + String(day).padStart(2, "0"));
        if (d >= b) break;
        if (d >= a) out.push(d);
        m++; if (m > 12) { m = 1; y++; }
      }
    }
    return out;
  }
  function billsTotal(bills, a, b) {
    let total = 0;
    const items = [];
    (bills || []).forEach(function (bill) {
      billDates(bill, a, b).forEach(function (d) {
        total += Number(bill.amount) || 0;
        items.push({ name: bill.name, amount: Number(bill.amount) || 0, date: fromD(d) });
      });
    });
    items.sort(function (x, y) { return x.date < y.date ? -1 : 1; });
    return { total: total, items: items };
  }

  // ---- The main calculation ----
  function compute(state, today) {
    const t = D(today);
    const anchor = D(state.setup.anchor);
    const balDay = D(state.balance.date);
    const balTs = state.balance.ts || 0;
    const next = D(state.nextMoney.date);

    // Which week are we in?
    const weekIndex = Math.max(0, Math.floor((t - anchor) / 7));
    const weekStart = anchor + weekIndex * 7;
    const weekEnd = weekStart + 7;               // first day of NEXT week
    const periodStart = Math.max(weekStart, balDay); // if you updated your balance mid-week, start from then
    const overdue = next <= t;                   // next money date has arrived/passed

    // Only logs added AFTER the balance was entered change the money.
    // A log dated before the balance date is treated as happening on the balance date.
    const logs = (state.logs || []).filter(function (l) { return (l.ts || 0) >= balTs; });
    function effDay(l) { return Math.max(D(l.date), balDay); }
    function sum(kind, a, b) {
      return logs.filter(function (l) { return l.kind === kind && effDay(l) >= a && effDay(l) < b; })
        .reduce(function (s, l) { return s + Number(l.amount); }, 0);
    }

    // 1) Money at the start of this week (+ any extra money that came in this week)
    const paidBefore = billsTotal(state.bills, balDay + 1, periodStart).total;
    const pool = Number(state.balance.amount) - paidBefore
      + sum("income", -Infinity, weekEnd)
      - sum("spend", -Infinity, periodStart);

    // 2) Bills still to pay before the next money date (counting from this week)
    const reservedFrom = Math.max(periodStart, balDay + 1);
    const billsAhead = overdue ? { total: 0, items: [] } : billsTotal(state.bills, reservedFrom, next);

    // 3) Money set aside in jars
    const jar = (state.goals || []).reduce(function (s, g) { return s + (Number(g.saved) || 0); }, 0);

    // 4) What's free to spend until the next money date
    const spendable = pool - billsAhead.total - jar;

    // 5) Weeks left
    const daysLeft = overdue ? 7 : Math.max(1, next - periodStart);
    const periodEnd = overdue ? weekEnd : Math.min(weekEnd, next);
    const daysThisWeek = Math.max(1, periodEnd - periodStart);
    const weeksLeft = daysLeft / 7;

    // 6) This week's amount: spendable ÷ weeks left
    //    (same as spendable × days this week ÷ days left, which also handles short weeks)
    const allowance = spendable <= 0 ? 0 : spendable * Math.min(1, daysThisWeek / daysLeft);

    // 7) Spending logged this week
    const spentThisWeek = sum("spend", periodStart, weekEnd);
    const left = allowance - spentThisWeek;

    // Money you have right now (for display)
    const moneyNow = Number(state.balance.amount)
      - billsTotal(state.bills, balDay + 1, t + 1).total
      + sum("income", -Infinity, Infinity) - sum("spend", -Infinity, Infinity);

    return {
      today: today, weekStart: fromD(weekStart), weekEnd: fromD(weekEnd - 1), periodStart: fromD(periodStart),
      pool: round2(pool), billsAhead: billsAhead, jar: round2(jar), spendable: round2(spendable),
      daysLeft: daysLeft, weeksLeft: weeksLeft, daysThisWeek: daysThisWeek, shortWeek: daysThisWeek < 7 || periodEnd < weekEnd,
      allowance: round2(allowance), spentThisWeek: round2(spentThisWeek), left: round2(left),
      moneyNow: round2(moneyNow), overdue: overdue,
    };
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  return { compute: compute, billsTotal: billsTotal, D: D, fromD: fromD, todayStr: todayStr, round2: round2 };
})();
