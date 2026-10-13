<?php

use App\Http\Controllers\Api\Admin\ArticleReviewController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IssueController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\ResearcherArticleController;
use Illuminate\Support\Facades\Route;

// ---------- Autenticação ----------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// ---------- Catálogo público ----------
Route::get('/areas', [AreaController::class, 'index']);

Route::get('/journals', [JournalController::class, 'index']);
Route::get('/journals/{journal}', [JournalController::class, 'show']);

Route::get('/issues/{issue}', [IssueController::class, 'show']);

Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{id}', [ArticleController::class, 'show'])->whereNumber('id');
Route::get('/articles/{id}/download', [ArticleController::class, 'download'])->whereNumber('id');

// ---------- Rotas que exigem login (Sanctum) ----------
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Pesquisador: submissão e gestão dos próprios artigos
    Route::middleware('role:pesquisador')->group(function () {
        Route::get('/my/articles', [ResearcherArticleController::class, 'index']);
        Route::post('/articles', [ResearcherArticleController::class, 'store']);
        Route::put('/articles/{article}', [ResearcherArticleController::class, 'update']);
        Route::post('/articles/{article}/file', [ResearcherArticleController::class, 'replaceFile']);
        Route::post('/articles/{article}/submit', [ResearcherArticleController::class, 'submit']);
    });

    // Dono ou admin (a Policy decide quem pode)
    Route::delete('/articles/{article}', [ResearcherArticleController::class, 'destroy']);

    // Administrador: avaliação e publicação
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/articles', [ArticleReviewController::class, 'index']);
        Route::patch('/articles/{article}/publish', [ArticleReviewController::class, 'publish']);
    });
});
