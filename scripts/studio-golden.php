<?php

declare(strict_types=1);

/**
 * Generates the "golden" results the TypeScript Resume Studio (lib/studio) is tested against: the ORIGINAL PHP classes
 * (../qrscore/src/Studio) are run on a fixed set of inputs and inputs + outputs are written to
 * lib/studio/__golden__/studio.json.
 *
 *   php scripts/studio-golden.php
 *
 * Re-run after changing the PHP Studio, then `npx vitest run lib/studio`.
 */

$root = dirname(__DIR__);
$php = realpath($root . '/../qrscore');
if ($php === false || !is_file($php . '/autoload.php')) {
    fwrite(STDERR, "PHP app not found next to this project (expected ../qrscore).\n");
    exit(1);
}
require $php . '/autoload.php';

use QrScore\QrScore;
use QrScore\Studio\Diff;
use QrScore\Studio\Docx;
use QrScore\Studio\JobMatch;
use QrScore\Studio\Renderer;
use QrScore\Studio\ResumeData;
use QrScore\Studio\Scorer;
use QrScore\Studio\Templates;

$out = [];

// ---------------------------------------------------------------- catalogue
$out['templates'] = Templates::all();
$prefsGrid = [];
foreach (array_keys(Templates::regionOptions()) as $region) {
    foreach ([['level' => 'student', 'industry' => 'tech', 'goal' => 'job'], ['level' => 'mid', 'industry' => 'creative', 'goal' => 'change'], ['level' => 'executive', 'industry' => 'finance', 'goal' => 'promotion'],
        ['level' => 'academic', 'industry' => 'education', 'goal' => 'academic'], ['level' => 'senior', 'industry' => 'government', 'goal' => 'job'], ['level' => '', 'industry' => '', 'goal' => '']] as $p) {
        foreach ([[null, false], [40.0, false], [80.0, true]] as [$rq, $pro]) {
            $prefs = ['region' => $region] + $p;
            $prefsGrid[] = ['prefs' => $prefs, 'rq' => $rq, 'pro' => $pro, 'picks' => Templates::recommend($prefs, $rq, $pro)];
        }
    }
}
$out['recommend'] = $prefsGrid;
$out['popular'] = [
    ['usage' => [], 'exclude' => [], 'picks' => Templates::popular([], [])],
    ['usage' => ['de-modern' => 9, 'chrono-classic' => 4, 'nope-x' => 99, 'jp-classic' => 4], 'exclude' => ['chrono-classic'], 'picks' => Templates::popular(['de-modern' => 9, 'chrono-classic' => 4, 'nope-x' => 99, 'jp-classic' => 4], ['chrono-classic'])],
];

// ---------------------------------------------------------------- normalize
$messy = [
    ['label' => 'empty', 'in' => null],
    ['label' => 'scalar', 'in' => 'hello'],
    ['label' => 'rich', 'in' => [
        'personal' => ['name' => "  Zoë <b>O'Neil</b> \x01\x07 ", 'headline' => str_repeat('x', 300), 'email' => 'bad@@mail', 'phone' => '0', 'location' => 'Köln', 'dob' => '1999-02-30', 'nationality' => 'Indian', 'marital' => 'Single', 'visa' => 'H1B',
            'links' => [['label' => 'LinkedIn', 'url' => 'linkedin.com/in/zoe'], ['label' => 'x', 'url' => 'javascript:alert(1)'], ['label' => 'bad', 'url' => 'https://exa mple.com'], ['label' => '', 'url' => 'http://www.example.com/a?b=1'], 'str', ['url' => 'ftp://x.org']]],
        'summary' => 'Line one' . "\n" . 'two',
        'experience' => [
            ['title' => 'Engineer', 'company' => 'ACME', 'location' => 'Pune', 'start' => '2020-01', 'end' => '2022-13', 'current' => '0', 'bullets' => "Did a\r\nDid b\n\n  Did c  ", 'hours' => '40', 'salary' => '$90k', 'supervisor' => 'Sam'],
            ['title' => '', 'company' => '', 'bullets' => []],
            ['title' => 'Lead', 'company' => 'Foo', 'start' => '2022-02', 'end' => '2023-05', 'current' => 'yes', 'bullets' => ['a', 'b', ['nested'], 5, 1.5, null, true]],
            'junk',
        ],
        'education' => [['degree' => 'B.Tech', 'field' => 'CS', 'institution' => 'IIT', 'location' => 'Delhi', 'year' => '2019', 'score' => '8.1'], ['degree' => '', 'institution' => ''], ['degree' => 'MBA', 'institution' => 'XLRI', 'year' => 'c. 2021 expected']],
        'skills' => "Python\nSQL\n  \nExcel",
        'projects' => [['name' => 'P1', 'link' => 'github.com/x/y', 'bullets' => ['one']], ['name' => '', 'bullets' => []]],
        'certifications' => [['name' => 'AWS', 'issuer' => 'Amazon', 'year' => '2023'], ['name' => '']],
        'awards' => ['Best', '', 'Second'],
        'publications' => 'Paper A' . "\n" . 'Paper B',
        'languages' => [['name' => 'Hindi', 'level' => 'Native'], ['name' => '', 'level' => 'x']],
    ]],
    ['label' => 'assoc-as-list', 'in' => ['skills' => ['a' => 'Go', 'b' => 'Rust'], 'experience' => ['x' => ['title' => 'T', 'company' => 'C', 'bullets' => ['z']]]]],
];
foreach ($messy as &$m) {
    $m['out'] = ResumeData::normalize($m['in']);
}
unset($m);
$out['normalize'] = $messy;

// ---------------------------------------------------------------- dates
$out['dates'] = [
    'fmtMonth' => array_map(static fn ($a) => ['in' => $a, 'out' => ResumeData::fmtMonth($a[0], $a[1])], [['2023-07', 'my'], ['2023-07', 'slash'], ['2023-07', 'jp'], ['', 'my'], ['junk', 'my']]),
    'fmtDob' => array_map(static fn ($a) => ['in' => $a, 'out' => ResumeData::fmtDob($a[0], $a[1])], [['1999-02-03', 'de'], ['1999-02-03', 'jp'], ['1999-02-03', null], ['1999-02-03', 'in'], ['bad', 'de']]),
    'parseRange' => array_map(static fn ($s) => ['in' => $s, 'out' => ResumeData::parseRange($s)], [
        'July 2023 - Present', '2019 - 2022', 'Sept 2018 – Mar 2021', 'Jan. 2020 to current', '03/2019 - 11/2020', '13/2019', 'May 2020', 'sep 2021 till date', 'no dates here', 'Aug, 2022 - Dec 2023', "Feb\xC2\xA02020 - 2021", 'JUNE 2017 - ONGOING',
    ]),
];

// ---------------------------------------------------------------- fromProfile (from real engine parses)
$fixDir = $root . '/lib/qrscore/__fixtures__';
$fp = [];
foreach (['resume--resume-01-rahul-sharma', 'resume--resume-02-priya-patel', 'resume--experienced', 'resume--weak', 'resume--resume-03-amit-kumar', 'resume--resume-04-sneha-reddy', 'train--train-001-aditi-banerjee', 'train--train-014-abhishek-chauhan'] as $name) {
    $text = (string) file_get_contents($fixDir . '/' . $name . '.txt');
    $res = QrScore::fromText($text);
    if (!QrScore::isScored($res)) {
        continue;
    }
    $user = ['name' => 'Test User', 'email' => 'test.user@example.com'];
    $rq = ['profile' => $res['profile'], 'career' => $res['career']];
    $fp[] = ['name' => $name, 'rq' => $rq, 'user' => $user, 'text' => $text, 'out' => ResumeData::fromProfile($rq, $user, $text), 'out_notext' => ResumeData::fromProfile($rq, $user, '')];
}
$out['fromProfile'] = $fp;
$out['fromProfileNull'] = ResumeData::fromProfile(null, ['name' => 'Only Name', 'email' => 'o@x.com']);

// ---------------------------------------------------------------- text, html, docx, scorer
$sample = ResumeData::sample();
$rich = $messy[2]['out'];
$rich['personal']['phone'] = '+91 98765 43210';
$rich['personal']['email'] = 'zoe@example.com';
$rich['personal']['dob'] = '1999-02-03';
$rich['personal']['name'] = 'Zoë <b>O\'Neil</b> & "Co"';
$rich['education'][0]['field'] = 'b.tech';
$dupe = $sample;
$dupe['personal']['phone'] = 'same@x';
$dupe['personal']['email'] = 'same@x';
$cases = ['sample' => $sample, 'rich' => $rich, 'dupe' => $dupe, 'blank' => ResumeData::blank()];
$out['cases'] = $cases;
$out['render'] = [];
$out['text'] = [];
foreach ($cases as $cname => $d) {
    foreach (['us', 'de', 'in', 'jp', null] as $rg) {
        $out['text'][] = ['case' => $cname, 'region' => $rg, 'text' => ResumeData::toText($d, $rg), 'words' => ResumeData::wordCount(ResumeData::toText($d, $rg))];
    }
    foreach (Templates::all() as $id => $t) {
        $out['render'][] = ['case' => $cname, 'template' => $id, 'html' => Renderer::html($d, $t), 'thumb' => Renderer::html($d, $t, true), 'ats' => Renderer::atsNotes($d, $t)];
    }
}
$out['docx'] = [];
$out['scorer'] = [];
foreach (['sample', 'rich', 'dupe'] as $cname) {
    foreach (['chrono-classic', 'us-classic', 'de-modern', 'jp-classic', 'in-modern', 'us_fed-classic'] as $tid) {
        $t = Templates::get($tid);
        $bytes = Docx::build($cases[$cname], $t);
        $zip = new ZipArchive();
        $tmp = tempnam(sys_get_temp_dir(), 'gd');
        file_put_contents($tmp, (string) $bytes);
        $zip->open($tmp);
        $out['docx'][] = ['case' => $cname, 'template' => $tid, 'document' => (string) $zip->getFromName('word/document.xml')];
        $zip->close();
        @unlink($tmp);
        $s = Scorer::run($cases[$cname], $t);
        unset($s['result']);
        $out['scorer'][] = ['case' => $cname, 'template' => $tid] + $s;
    }
}
// Scorer on a fuller resume built from a real parse.
foreach ($fp as $f) {
    $t = Templates::get('chrono-classic');
    $s = Scorer::run($f['out'], $t);
    unset($s['result']);
    $out['scorer'][] = ['case' => 'fp:' . $f['name'], 'template' => 'chrono-classic', 'data' => $f['out']] + $s;
}

// ---------------------------------------------------------------- job match
$jds = [
    "Senior Data Analyst\n\nAbout the role\nWe are a fast growing fintech company.\n\nRequirements:\n- 3+ years of experience in SQL and Python\n- Strong Excel and Tableau skills\n- Experience with A/B testing\n\nPreferred:\n- Machine learning\n- AWS\n\nResponsibilities\nBuild dashboards, analyse data, communicate with stakeholders. You will work with data pipelines and data warehouse teams.",
    "Marketing Executive. Must have SEO and Google Analytics. Copywriting is a plus. 2 yrs experience. Social media, content marketing, email campaigns. Content marketing is key; content strategy too.",
    'We are hiring.',
    "Nice to have: Docker, Kubernetes\nMust have: JavaScript, React, Node.js, TypeScript\nJS and TS are required.\nBonus: GraphQL\nPreferred: Python, A/B testing\n5+ years of professional software development experience in teams.",
];
$out['jobmatch'] = [];
foreach ($jds as $jd) {
    foreach ([[$sample, 4], [$rich, null], [$fp[0]['out'] ?? $sample, 1]] as [$d, $years]) {
        $out['jobmatch'][] = ['jd' => $jd, 'resume' => ResumeData::toText($d), 'years' => $years, 'out' => JobMatch::analyze($jd, ResumeData::toText($d), $years)];
    }
}

// ---------------------------------------------------------------- diff
$pairs = [
    ["a\nb\nc\nd", "a\nc\nd\ne"],
    ['', 'x'],
    ["same\nsame", "same\nsame"],
    [ResumeData::toText($sample), ResumeData::toText($rich)],
    ["  x\r\ny  ", "x\ny"],
];
$out['diff'] = array_map(static function ($p) {
    $d = Diff::lines($p[0], $p[1]);
    return ['a' => $p[0], 'b' => $p[1], 'lines' => $d, 'stats' => Diff::stats($d)];
}, $pairs);

@mkdir($root . '/lib/studio/__golden__', 0777, true);
file_put_contents($root . '/lib/studio/__golden__/studio.json', json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION | JSON_PARTIAL_OUTPUT_ON_ERROR));
echo 'wrote ', count($out['render']), " renders, ", count($out['jobmatch']), " job matches\n";
