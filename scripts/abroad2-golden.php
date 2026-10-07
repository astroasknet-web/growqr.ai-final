<?php

declare(strict_types=1);

/**
 * Golden results for the pure parts of lib/abroad (loans, funds, visa calendar, mock-interview scoring), from the ORIGINAL PHP.
 *   php scripts/abroad2-golden.php
 */
$root = dirname(__DIR__);
$php = realpath($root . '/../qrscore');
require $php . '/autoload.php';

use QrScore\Portal\Funds;
use QrScore\Portal\Loans;
use QrScore\Portal\MockInterview;
use QrScore\Portal\Visa;

$out = [];
// ---- loans
$out['emi'] = [];
foreach ([[2500000, 9.5, 10, 30], [100000, 12.0, 1, 0], [4000000, 7.25, 15, 24], [50000, 1.0, 20, 72], [0, 9.0, 10, 0], [1000000, null, 10, 12], [1000000, 9.0, 0, 12]] as $a) {
    $out['emi'][] = [$a, Loans::emi($a[0], $a[1], $a[2], $a[3])];
}
$out['validate'] = [];
foreach ([
    [],
    ['lender' => 'SBI', 'loan_type' => 'secured', 'amount_inr' => 'Rs 25,00,000', 'rate_pct' => '9.55', 'tenure_years' => '10', 'moratorium_months' => '30', 'status' => 'sanctioned', 'sanctioned_inr' => '2000000', 'checks' => ['kyc', 'bank', 'nope']],
    ['lender' => 'X', 'amount_inr' => '10', 'rate_pct' => '40', 'tenure_years' => '30', 'moratorium_months' => '99', 'status' => 'bogus'],
    ['lender' => 'HDFC Credila', 'loan_type' => 'x', 'amount_inr' => '999999999', 'rate_pct' => 'abc', 'tenure_years' => '0', 'moratorium_months' => '-1', 'status' => 'disbursing', 'sanctioned_inr' => '5'],
    ['lender' => 'Axis', 'amount_inr' => '300000', 'rate_pct' => '', 'tenure_years' => '', 'moratorium_months' => '', 'status' => 'applied'],
] as $in) {
    $out['validate'][] = [$in, Loans::validate($in)];
}
// ---- funds
$j = json_decode((string) file_get_contents($php . '/data/study-abroad.json'), true);
$out['target'] = [];
foreach ($j['countries'] as $c) {
    $c['fx'] = $j['fx'][$c['currency']] ?? 1;
    foreach (['low', 'mid', 'high'] as $tier) {
        $out['target'][] = [$c['key'], $tier, Funds::target(['cost_tier' => $tier], $c)];
    }
}
$out['coverage'] = [];
foreach ([[0, 0, 1000000], [500000, 400000, 1000000], [1000000, 0, 1000000], [200000, 900000, 1000000], [0, 0, 0], [999999, 1, 1000000], [3333, 3333, 10000]] as [$d, $p, $r]) {
    $out['coverage'][] = [[$d, $p, $r], Funds::coverage(['documented' => $d, 'planned' => $p, 'lines' => []], $r)];
}
// ---- calendar (the stamp line changes every second, so it is checked separately)
$out['ics'] = [];
foreach ([['2026-11-03 09:30:00', 'US Consulate, Chennai; Gate 2'], ['2026-12-31 23:30:00', ''], ['2027-02-28 00:00:00', 'Centre, "VFS"']] as [$at, $centre]) {
    $case = ['id' => 7, 'uni_name' => 'MIT, Cambridge; USA', 'centre' => $centre, 'appointment_at' => $at];
    $out['ics'][] = [$case, array_values(array_filter(explode("\r\n", Visa::ics($case)), static fn ($l) => $l !== '' && !str_starts_with($l, 'DTSTAMP')))];
}
// ---- mock interview scoring
$bank = MockInterview::bank();
$out['mock'] = [];
foreach ($bank['countries'] as $key => $c) {
    $ideal = $c['ideal_words'] ?? [20, 120];
    foreach ($c['questions'] as $q) {
        $all = [];
        foreach ($q['c'] as [$label, $kw]) {
            $all[] = $kw[0];
        }
        $answers = ['', 'maybe', 'I am not sure about this one', implode(' ', $all), implode(' ', array_slice($all, 0, 1)) . ' ' . str_repeat('word ', 200), 'My agent told me to say: ' . implode(' and ', $all), strtoupper(implode(' ', $all)), "It\u{2019}s great, I\u{2019}d say \u{2014} \u{00A3}5,000 and 80%"];
        foreach ($answers as $a) {
            $out['mock'][] = [$key, $q['id'], $a, $ideal, MockInterview::score($q, $a, $ideal), MockInterview::wordCount($a)];
        }
    }
}
$out['band'] = array_map(static fn ($n) => [$n, MockInterview::band($n)], [0, 39, 40, 69, 70, 100]);
@mkdir($root . '/lib/abroad/__golden__', 0777, true);
file_put_contents($root . '/lib/abroad/__golden__/abroad2.json', json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION | JSON_PARTIAL_OUTPUT_ON_ERROR));
echo count($out['mock']), " mock scores\n";
