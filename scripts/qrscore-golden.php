<?php

declare(strict_types=1);

/**
 * Generates the "golden" results the TypeScript scoring engine is tested against: every fixture is scored by the ORIGINAL
 * PHP engine (../qrscore) and the full result is written to lib/qrscore/__golden__/results.json.
 *
 *   php scripts/qrscore-golden.php
 *
 * Besides the fixtures themselves it writes "variants" of resume fixtures that stress the places where PHP and JavaScript
 * regular expressions differ: en/em dashes, non-breaking spaces, other bullet glyphs, curly quotes, CRLF, accents, Hindi,
 * emoji and upper-case text. Re-run it whenever the PHP engine, its JSON data files or the fixtures change, then run
 * `npx vitest run lib/qrscore`.
 */

$root = dirname(__DIR__);
$php = realpath($root . '/../qrscore');
if ($php === false || !is_file($php . '/autoload.php')) {
    fwrite(STDERR, "PHP engine not found next to this project (expected ../qrscore).\n");
    exit(1);
}
require $php . '/autoload.php';

use QrScore\QrScore;

$dir = $root . '/lib/qrscore/__fixtures__';
$vdir = $dir . '/variants';
@mkdir($vdir, 0777, true);
foreach (glob($vdir . '/*.txt') ?: [] as $old) {
    unlink($old);
}

/** @var array<string, callable(string):string> */
$variants = [
    'emdash' => static fn (string $t): string => (string) preg_replace('/(\d{4})\s*[-–]\s*(\d{4}|Present|present)/u', '$1 — $2', $t),
    'endash' => static fn (string $t): string => (string) preg_replace('/(\d{4})\s*-\s*(\d{4}|Present|present)/u', '$1 – $2', $t),
    'nbsp' => static fn (string $t): string => (string) preg_replace('/(?<=\d) (?=[-–—%])|(?<=[-–—]) (?=\d)|(?<=\d) (?=\d)/u', "\u{00A0}", $t),
    'bullets-dash' => static fn (string $t): string => (string) preg_replace('/^[•▪◦]\s*/mu', '– ', $t),
    'bullets-dot' => static fn (string $t): string => (string) preg_replace('/^[•▪◦]\s*/mu', '· ', $t),
    'bullets-quote' => static fn (string $t): string => (string) preg_replace('/^[•▪◦]\s*(\w)/mu', "• \u{201C}$1", $t),
    'crlf' => static fn (string $t): string => str_replace("\n", "\r\n", $t),
    'upper' => static fn (string $t): string => mb_strtoupper($t),
    'accents' => static fn (string $t): string => str_replace(['Pune', 'Delhi', 'Mumbai'], ['Pūne', 'Dēlhi', 'Mumbaï'], $t) . "\nRésumé café naïve – coördinated\n",
    'hindi-emoji' => static fn (string $t): string => $t . "\nभाषाएँ: हिन्दी, English 😀 ✓\n",
    'indent' => static fn (string $t): string => (string) preg_replace('/^/m', "  \t", $t),
    'long-lines' => static fn (string $t): string => str_replace("\n", ' ', $t),
];

$files = array_merge(glob($dir . '/resume--*.txt') ?: [], array_slice(glob($dir . '/train--*.txt') ?: [], 0, 14));
sort($files);
foreach ($files as $f) {
    $base = pathinfo($f, PATHINFO_FILENAME);
    $text = (string) file_get_contents($f);
    foreach ($variants as $vn => $fn) {
        $v = $fn($text);
        if ($v !== $text) {
            file_put_contents($vdir . '/' . $base . '~' . $vn . '.txt', $v);
        }
    }
}

$all = array_merge(glob($dir . '/*.txt') ?: [], glob($vdir . '/*.txt') ?: []);
sort($all);
$out = ['year' => (int) date('Y'), 'engine' => 'php ' . PHP_VERSION, 'cases' => []];
foreach ($all as $f) {
    $key = (str_contains($f, '/variants/') ? 'variants/' : '') . basename($f);
    $r = QrScore::fromText((string) file_get_contents($f));
    if (isset($r['extraction']['text'])) {
        unset($r['extraction']['text']); // the input is the fixture itself
    }
    $out['cases'][$key] = $r;
}
file_put_contents($root . '/lib/qrscore/__golden__/results.json', json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION));
$scored = count(array_filter($out['cases'], static fn ($r) => QrScore::isScored($r)));
echo count($out['cases']) . " inputs scored with the PHP engine ({$scored} scored, " . (count($out['cases']) - $scored) . " refused as not a resume).\n";
