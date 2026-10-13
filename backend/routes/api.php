<?php

use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IssueController;
use App\Http\Controllers\Api\JournalController;
use Illuminate\Support\Facades\Route;

// ---------- Autenticação ----------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

// ---------- Catálogo público ----------
Route::get('/areas', [AreaController::class, 'index']);

Route::get('/journals', [JournalController::class, 'index']);
Route::get('/journals/{journal}', [JournalController::class, 'show']);

Route::get('/issues/{issue}', [IssueController::class, 'show']);

Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{id}', [ArticleController::class, 'show'])->whereNumber('id');
Route::get('/articles/{id}/download', [ArticleController::class, 'download'])->whereNumber('id');
