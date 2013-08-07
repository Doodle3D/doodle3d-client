<?php

/*$url = $_GET['url'];
if ( !$url ) {
  $url = $_POST['url'];
}*/
$target_url = "http://192.168.5.1/cgi-bin/d3dapi/";
$target_api = str_replace("/proxy5.php/","",$_SERVER["REQUEST_URI"]);
$target_url .= $target_api;
//echo "target_url: ".$target_url;

$postdata = file_get_contents("php://input");
$ok = true;

$c = curl_init();
curl_setopt($c, CURLOPT_HTTPHEADER, array('Content-Type' => 'application/xml'));
curl_setopt($c, CURLOPT_URL, $target_url);
curl_setopt($c, CURLOPT_POST, true);
curl_setopt($c, CURLOPT_POSTFIELDS,$postdata);
$result = curl_exec ($c);
curl_close ($c);
if(!
$result)
{
  $ok = false;
  $error = "Failed to forward HTTP request to: {$target_url}\r\n" . var_export(error_get_last(),true) . "\r\n{$postdata}";
  error_log($error);
  error_log($error, 1, "my-email-address@my-test-domain.com");
}

if(!
$ok)
  header('HTTP/1.1 500 Internal Server Error');
else
  header('HTTP/1.1 200 OK');
?>