<?php
declare(strict_types=1);

const APP_ROOT = __DIR__ . '/..';
const STORAGE_DIR = APP_ROOT . '/storage';
const DB_FILE = STORAGE_DIR . '/data.json';

if (!is_dir(STORAGE_DIR)) {
    mkdir(STORAGE_DIR, 0775, true);
}

session_name('cham_phieu_session');
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

require_once __DIR__.'/preferences.php';
require_once __DIR__.'/fresh-start.php';
apply_fresh_start(DB_FILE);

/* Production should replace this JSON store with MySQL/PostgreSQL. JSON keeps the MVP dependency-free. */
function store(): array { if (!file_exists(DB_FILE)) file_put_contents(DB_FILE, json_encode(['users'=>[],'exams'=>[],'keys'=>[],'students'=>[],'submissions'=>[]])); return json_decode(file_get_contents(DB_FILE), true) ?: []; }
function save_store(array $data): void { file_put_contents(DB_FILE, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES), LOCK_EX); }
function next_id(array $items): int { return $items ? max(array_column($items,'id'))+1 : 1; }
/*
function db(): PDO {
    static $pdo;
    if (!$pdo) {
        $pdo = new PDO('sqlite:' . DB_FILE, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            subject TEXT NOT NULL DEFAULT 'Trắc nghiệm',
            question_count INTEGER NOT NULL DEFAULT 40,
            codes TEXT NOT NULL DEFAULT '[\"101\"]',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS answer_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            answers TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(exam_id, code), FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            student_no TEXT NOT NULL,
            name TEXT NOT NULL,
            class_name TEXT NOT NULL DEFAULT '',
            UNIQUE(exam_id, student_no), FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
        )");
        $pdo->exec("CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            student_no TEXT NOT NULL,
            student_name TEXT NOT NULL DEFAULT '',
            code TEXT NOT NULL,
            answers TEXT NOT NULL,
            score REAL NOT NULL DEFAULT 0,
            flags TEXT NOT NULL DEFAULT '[]',
            image_data TEXT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
        )");
    }
    return $pdo;
}
*/

function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function user(): ?array {
    if (!isset($_SESSION['user_id'])) return null;
    foreach (store()['users'] as $u) if ($u['id']===$_SESSION['user_id']) {if((int)($_SESSION['auth_version']??0)!==(int)($u['auth_version']??0))return null;return public_account($u);}
    return null;
}

function require_user(): array {
    $u = user();
    if (!$u) respond(['error' => 'Bạn cần đăng nhập'], 401);
    return $u;
}

