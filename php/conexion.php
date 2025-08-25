<?php
$conexion = new mysqli("localhost", "root", "1234567890", "rubik_db");
if ($conexion->connect_error) {
  die("Conexión fallida: " . $conexion->connect_error);
}
?>