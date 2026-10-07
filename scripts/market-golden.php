<?php

declare(strict_types=1);

/**
 * Golden results for the TypeScript marketplace (lib/market): the ORIGINAL PHP JobSearch is run on the sample listings and
 * on a set of queries, and inputs + outputs are written to lib/market/__golden__/market.json.
 *
 *   php scripts/market-golden.php
 */

$root = dirname(__DIR__);
$php = realpath($root . '/../qrscore');
if ($php === false || !is_file($php . '/autoload.php')) {
    fwrite(STDERR, "PHP app not found next to this project (expected ../qrscore).\n");
    exit(1);
}
require $php . '/autoload.php';
require $php . '/public/_samples.php'; // defines $JOBS

use QrScore\Portal\JobSearch;

$jobs = [];
foreach ($JOBS as $i => $j) {
    $jobs[] = [
        'id' => $i + 1, 'slug' => $j['slug'], 'title' => $j['title'], 'company' => $j['company'], 'cat' => $j['cat'], 'loc' => $j['loc'], 'mode' => $j['mode'],
        'skills' => $j['skills'], 'perks' => $j['perks'], 'badge' => $j['badge'], 'about' => $j['about'], 'posted' => $j['posted'], 'stipend' => $j['stipend'], 'weeks' => $j['weeks'],
    ];
}
$queries = [
    '', '   ', 'python', 'python developer', 'Python Developer intern', 'dev', 'js', 'front-end', 'front end react', 'wfh', 'remote data', 'pyth', 'reactt', 'pythn developr',
    'bangalore', 'bengaluru design', 'ux designer', 'seo', 'machine learning', 'ml', 'finance', 'accounting accountant', 'hr recruiter', 'qa tester', 'nodejs', 'node js',
    'internship jobs for freshers', 'the', 'C++', 'c#', '.net', 'a/b testing', "o'brien", 'zzzzqx', 'data analyst power bi', 'content writer blog', 'marketing growth', 'cloud aws',
    'full stack', 'fullstack developer', 'delhi', 'mumbai bombay', 'hybrid', 'on-site pune', 'stipend', 'design', 'figma', 'sql', 'excel finance', 'xyzzy developer', 'développeur', 'डेटा',
    str_repeat('react ', 40),
];
$search = [];
foreach ($queries as $q) {
    $r = JobSearch::run($jobs, $q);
    $search[] = ['q' => $q, 'out' => ['jobs' => array_map(static fn ($j) => ['id' => $j['id'], '_score' => $j['_score'] ?? null, '_fields' => $j['_fields'] ?? null], $r['jobs']), 'terms' => $r['terms'], 'mode' => $r['mode'], 'corrected' => $r['corrected'], 'original' => $r['original']]];
}
$suggest = [];
foreach (array_merge($queries, ['fro', 'pyt', 'goo', 'north', 'soft', 'dat', 'rea', 'ux', 'figm', 'reac', 'pythn', 'qzx', 'a', 'de', 'front-e']) as $q) {
    $suggest[] = ['q' => $q, 'limit' => 6, 'out' => JobSearch::suggest($jobs, $q, 6)];
}
$hl = [];
foreach ([['Frontend Developer Intern at Northwind', ['frontend', 'dev']], ["O'Brien & <Sons> React-js", ['react', 'js']], ['Python python PYTHONIC', ['python']], ['no match here', ['zzz']], ['', ['a1']], ['Développeur React', ['react', 'dev']]] as [$t, $terms]) {
    $hl[] = ['text' => $t, 'terms' => $terms, 'out' => JobSearch::highlight($t, $terms)];
}
$norm = [];
foreach (['Front-End  Developer', 'full stack', 'Back End', 'node.js / React', "  C++ & C# ", "rock-n-roll", "Bengaluru\u{00A0}Karnataka", "Ünïcode ñ", 'A/B-testing'] as $s) {
    $norm[] = ['in' => $s, 'out' => JobSearch::normalize($s), 'terms' => JobSearch::terms($s)];
}
@mkdir($root . '/lib/market/__golden__', 0777, true);
file_put_contents($root . '/lib/market/__golden__/market.json', json_encode(['jobs' => $jobs, 'search' => $search, 'suggest' => $suggest, 'highlight' => $hl, 'normalize' => $norm], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION));
echo count($jobs), " jobs, ", count($search), " searches, ", count($suggest), " suggestions\n";
