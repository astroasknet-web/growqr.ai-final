<?php

declare(strict_types=1);

/**
 * Golden results for lib/abroad: the ORIGINAL PHP fit engine is run on every university and a grid of student profiles.
 *   php scripts/abroad-golden.php
 */
$root = dirname(__DIR__);
$php = realpath($root . '/../qrscore');
require $php . '/autoload.php';

use QrScore\Portal\Abroad;

$j = json_decode((string) file_get_contents($php . '/data/study-abroad.json'), true);
$countries = [];
foreach ($j['countries'] as $x) {
    $x['fx'] = $j['fx'][$x['currency']] ?? 1;
    $x['reviewed'] = $j['reviewed'] ?? '';
    $countries[$x['key']] = $x;
}
$unis = [];
foreach ($j['universities'] as $i => $x) {
    $unis[] = ['id' => $i + 1, 'slug' => $x['slug'], 'country_key' => $x['country'], 'name' => $x['name'], 'city' => $x['city'], 'type' => $x['type'], 'url' => $x['url'], 'band' => (int) $x['band'],
        'cost_tier' => $x['cost'], 'levels' => implode(',', $x['levels']), 'fields' => $x['fields'], 'level_list' => $x['levels'], 'english_taught' => !empty($x['english_taught']), 'blurb' => (string) ($x['blurb'] ?? ''), 'sort' => $i];
}
$profiles = [];
foreach ([['percentage', 45], ['percentage', 62.5], ['percentage', 78], ['percentage', 91], ['cgpa10', 6.4], ['cgpa10', 8.7], ['gpa4', 2.4], ['gpa4', 3.8]] as [$st, $sv]) {
    foreach ([['none', null], ['IELTS', 5.5], ['IELTS', 7.0], ['TOEFL', 96], ['PTE', 61]] as [$et, $es]) {
        foreach ([['Computer Science & IT', 'usa,uk', 1500000, 'PG'], ['Business & Management', '', 4000000, 'UG'], ['', 'canada', 0, 'PG'], ['Design & Arts', 'germany,australia', 10000000, 'UG']] as [$field, $cs, $budget, $level]) {
            $idx = Abroad::academicIndex($st, (float) $sv);
            $eq = $et === 'none' ? null : Abroad::englishEq($et, (float) $es);
            $profiles[] = ['score_type' => $st, 'score_value' => $sv, 'english_test' => $et, 'english_score' => $es, 'academic_index' => $idx, 'english_eq' => $eq, 'field' => $field, 'countries' => $cs, 'budget_inr' => $budget, 'level' => $level];
        }
    }
}
$out = ['countries' => $countries, 'unis' => $unis, 'profiles' => $profiles, 'fits' => []];
foreach ($profiles as $pi => $p) {
    foreach ($unis as $u) {
        $out['fits'][] = [$pi, $u['slug'], Abroad::fit($p, $u, $countries[$u['country_key']])];
    }
}
$out['cost'] = array_map(static fn ($u) => [$u['slug'], Abroad::cost($u, $countries[$u['country_key']])], $unis);
$out['conv'] = [
    'index' => array_map(static fn ($a) => [$a, Abroad::academicIndex($a[0], $a[1])], [['percentage', 45.555], ['percentage', 150], ['percentage', -3], ['cgpa10', 8.123], ['cgpa10', 10.5], ['gpa4', 3.333], ['gpa4', 0]]),
    'english' => array_map(static fn ($a) => [$a, Abroad::englishEq($a[0], $a[1])], [['IELTS', 6.74], ['IELTS', 6.75], ['IELTS', 12], ['TOEFL', 118], ['TOEFL', 94], ['TOEFL', 93], ['TOEFL', 20], ['PTE', 84], ['PTE', 58], ['PTE', 10], ['GRE', 300]]),
    'inr' => array_map(static fn ($n) => [$n, Abroad::inr($n)], [0, 950, 99999, 100000, 1250000, 3000000, 9999999, 10000000, 15500000, 123456789]),
];
@mkdir($root . '/lib/abroad/__golden__', 0777, true);
file_put_contents($root . '/lib/abroad/__golden__/abroad.json', json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION));
echo count($out['fits']), " fits\n";
