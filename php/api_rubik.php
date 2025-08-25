<?php
include "conexion.php";
header('Content-Type: application/json');

// Get user data
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['get_user'])) {
    $username = $_POST['username'];
    $stmt = $conexion->prepare("SELECT * FROM usuarios WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode(["success" => true, "data" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "Usuario no encontrado"]);
    }
    $stmt->close();
    exit;
}

// Registro de usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['registro'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $email = $_POST['email'];
    $stmt = $conexion->prepare("INSERT INTO usuarios (username, password, email) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $password, $email);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Usuario registrado correctamente"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al registrar usuario"]);
    }
    $stmt->close();
    exit;
}

// Login de usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $stmt = $conexion->prepare("SELECT * FROM usuarios WHERE username = ? AND password = ?");
    $stmt->bind_param("ss", $username, $password);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        echo json_encode(["success" => true, "message" => "Login exitoso"]);
    } else {
        echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos"]);
    }
    $stmt->close();
    exit;
}

// Actualizar usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['actualizar'])) {
    // si es password
    if ($_POST['actualizar'] === 'password') {
        $username = $_POST['username'];
        $password = $_POST['password'];
        $stmt = $conexion->prepare("UPDATE usuarios SET password = ? WHERE username = ?");
        $stmt->bind_param("ss", $password, $username);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Contraseña actualizada correctamente"]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar contraseña"]);
        }
        $stmt->close();
        exit;
    }

    if ($_POST['actualizar'] === 'email') {
        $username = $_POST['username'];
        $email = $_POST['email'];
        $stmt = $conexion->prepare("UPDATE usuarios SET email = ? WHERE username = ?");
        $stmt->bind_param("ss", $email, $username);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Email actualizado correctamente"]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar email"]);
        }
        $stmt->close();
        exit;
    }

    // actualizar foto
    if ($_POST['actualizar'] === 'foto') {
        $username = $_POST['username'];
        $foto = $_POST['photo'];
        $stmt = $conexion->prepare("UPDATE usuarios SET photo = ? WHERE username = ?");
        $stmt->bind_param("is", $foto, $username);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Foto actualizada correctamente"]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar foto"]);
        }
        $stmt->close();
        exit;
    }

    echo json_encode(["success" => true, "message" => "Usuario actualizado correctamente"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al actualizar usuario"]);
    }
    $stmt->close();
    exit;

// Eliminar usuario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['eliminar'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $stmt = $conexion->prepare("DELETE FROM usuarios WHERE username = ? AND password = ?");
    $stmt->bind_param("ss", $username, $password);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Usuario eliminado correctamente"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al eliminar usuario"]);
    }
    $stmt->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Petición inválida"]);
