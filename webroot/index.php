<?php

declare(strict_types=1);

ini_set('display_errors', "1");
ini_set('display_startup_errors', "1");
error_reporting(E_ALL);

define('URL','https://d64.nl');

include('./includes/d64.php');

$d64 = new d64();
$d64->header = new d64header($d64);
$d64->footer = new d64footer($d64);

$d64->header->set_description("Test website van Gerda");

$d64->footer->setFooter('<div class="w3-center">&copy; 2020 - <a href="https://github.com/Sjaak7/D64">Source</a></div>');
// Check if we are on the frontpage without any jokes like querystrings.. holla hop
if(!isset($d64->path[0]) && empty($_SERVER['QUERY_STRING'])){
	$bitpay = json_decode(file_get_contents(ROOTPATH.'/cache/btc.json'),true);
	if(is_array($bitpay))
		$bitprice = $bitpay[3]['rate'];
	else $bitprice = 'NaN';

	$d64->setContent(
		'<div class="p1" id="p1">'.
			'<h1>Lobby:</h1>'.
			'<div id="cFrame">'.
				'<div id="cB"></div>'.
				'<div class="w3-margin-top w3-small" id="cN"></div>'.
			'</div>'.
		'</div>'.
		'<div class="p2" id="p2">'.
			'<h1>Swipe test</h1>'.
		'</div>'
	);
	$d64->footer->setFooter(
		'<div id="cIForm">'.
			'<textarea id="cI" maxlength="9" wrap="soft"></textarea>'.
			'<div><input type="checkbox" class="w3-check" id="btc" checked> <label for="btc">BTC updates</label></div>'.
		'</div>'
	);
}elseif($d64->path[0]==='offline'){
	$d64->setContent(
		'<h2>Geen verbinding</h2>'.
		'<p>Je hebt geen verbinding met internet. Ik probeer het opnieuw als de verbinding hersteld is.</p>'
	);
}

$d64->init();

$d64->header->set_script('<script src="/js/d64.js"></script>');

echo $d64->header->makeHeader().
//	'<div class="container" id="content">'.
		$d64->getContent().
//	'</div>'.
	$d64->footer->makeFooter();

?>
