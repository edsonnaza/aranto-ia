<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index(): Response
    {
        $users = User::with('roles')
            ->paginate(20);

        return Inertia::render('users/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Show the form for creating a new user
     */
    public function create(): Response
    {
        return Inertia::render('users/Create');
    }

    /**
     * Display the specified user
     */
    public function show(User $user): Response
    {
        $user->load('roles');

        return Inertia::render('users/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user
     */
    public function edit(User $user): Response
    {
        $user->load('roles');

        return Inertia::render('users/Edit', [
            'user' => $user,
        ]);
    }
}
