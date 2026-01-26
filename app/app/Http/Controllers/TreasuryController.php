<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class TreasuryController extends Controller
{
    /**
     * Display the treasury index page
     */
    public function index(): Response
    {
        return Inertia::render('financial/treasury/Index', [
            'stats' => [
                'total_cash' => 0,
                'today_income' => 0,
                'today_expense' => 0,
                'pending_transactions' => 0,
            ]
        ]);
    }
}
