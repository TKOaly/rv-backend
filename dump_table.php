<?php
/* PHP script to dump RV price table to JSON */

$sql = "SELECT * FROM PRICE WHERE endtime IS NULL";
$dsn = 'mysql:host=localhost;dbname=rv';
$username = 'root';
$password = '';
$options = array(
    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
);

try {
    $db = new PDO ($dsn, $username, $password, $options) ;
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $newResults = array();
    foreach($result as $key => $val) {
        $newResults[] = array(
            "barcode" => $val["barcode"],
            "count" => (int)$val["count"],
            "buyprice" => (int)$val["buyprice"],
            "sellprice" => (int)$val["sellprice"],
            "itemid" => (int)$val["itemid"],
            "userid" => (int)2,
            "starttime" => "new Date()",
            "endtime" => null
        );
    }
    file_put_contents("output.txt", json_encode($newResults));
} catch (PDOException $Exception) {
    die($Exception);
}
