<?php

// AUTO-GENERADO por: php artisan users:generate-seeder
// Fecha: 2026-05-05 14:15:48
// Usuarios: 60
//
// Seguro para producción:
// - No borra usuarios.
// - Inserta faltantes.
// - Actualiza solo campos cambiados.
// - No pisa contraseñas existentes.
// - En roles, solo agrega roles faltantes.

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;


class UsersProductionSeeder extends Seeder
{
    public function run(): void
    {
        $u = User::firstOrNew(['email' => 'admin@aranto.com']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Super Administrador') {
            $changes['name'] = 'Super Administrador';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$IG161e28moWakSqLTF9RgubopiaXbfOGBZLPzmtsbvwXrtA10ekt.';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        foreach (['super-admin', 'super_admin'] as $roleName) {
            if (!$u->hasRole($roleName)) {
                $u->assignRole($roleName);
            }
        }

        $u = User::firstOrNew(['email' => 'doctor@aranto.com']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Dr. Juan Pérez') {
            $changes['name'] = 'Dr. Juan Pérez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$6RbulAsSO6bQ/ITjFRtpruLoTNh4klGV7SAu1SAyANwgj99YMnWvG';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        foreach (['admin'] as $roleName) {
            if (!$u->hasRole($roleName)) {
                $u->assignRole($roleName);
            }
        }

        $u = User::firstOrNew(['email' => 'cajero@aranto.com']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'María González') {
            $changes['name'] = 'María González';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$Y.kwOx/lZU63JweASkyQPOOBvr8pMtfwRfh9f0x6cbiDKf3qQElNO';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        foreach (['cashier', 'cajero'] as $roleName) {
            if (!$u->hasRole($roleName)) {
                $u->assignRole($roleName);
            }
        }

        $u = User::firstOrNew(['email' => 'supervisor@aranto.com']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Carlos Supervisor') {
            $changes['name'] = 'Carlos Supervisor';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$DACRF8keGgzKGPR3pNhfKOXPTO..xmGghYeXIqf03pL5Cuzvl/UIa';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        foreach (['accountant', 'supervisor'] as $roleName) {
            if (!$u->hasRole($roleName)) {
                $u->assignRole($roleName);
            }
        }

        $u = User::firstOrNew(['email' => 'auditor@aranto.com']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Ana Auditor') {
            $changes['name'] = 'Ana Auditor';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$Wvm/5xO1hRp7GtJwKYMCpuHRpdCYL2n8gwZ4.q5LkwRB//Y3mQZmK';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        foreach (['viewer', 'auditor'] as $roleName) {
            if (!$u->hasRole($roleName)) {
                $u->assignRole($roleName);
            }
        }

        $u = User::firstOrNew(['email' => 'edson@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Edson Sanchez') {
            $changes['name'] = 'Edson Sanchez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$mMpBYhAe3XAHAE4nXodWpO50bBvpYgDg03RYofajt8d37KAMRy0fe';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'ccenter@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'ccenter Informatica') {
            $changes['name'] = 'ccenter Informatica';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$wyKgVtkv1bb/8fpwWZ3pOuk4mPTpzNTqNsf6RkMr1vYnfA4OfY/B.';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'adita@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Ada Brizuela') {
            $changes['name'] = 'Ada Brizuela';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$Yd9mWbS6G8YjH.bcyx4VD.3GVaz6nPQ5kgQ5vEcoyWm2DaEs8d6BW';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'amelgarejo@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Angelina Melgarejo') {
            $changes['name'] = 'Angelina Melgarejo';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$PJRdeSWpjMwRaNPNnalXX.mi.DVZ09O.6o1h26OsygIR.FhFWAWf2';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'rrolon@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Rosalía Rolón') {
            $changes['name'] = 'Rosalía Rolón';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$pmis.CC9TTORANrvz1it1eAoML4n1TmykTsKZBtTfgJvOt1SBqL.m';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'bfariña@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Blanca Fariña') {
            $changes['name'] = 'Blanca Fariña';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$n91GYdTw2zsK5nxqTA5NLutpphPfvmxuCZb4KGc2/stPmdsZ6Cv1G';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'iramirez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Irma Ramirez') {
            $changes['name'] = 'Irma Ramirez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$ZyKx2xvjEKr46TkyhBLl7.TCZF6228gdBhG5QgPoKb/YTUkhWOpnC';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'mpalacios@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Mariela Palacios') {
            $changes['name'] = 'Mariela Palacios';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$zAoyGBWRr4tit6x6CfHgJ.PpglhY9DFAyCpiJXyfK4NzL/Hy4heUS';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'dalarcon@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Diana Alarcón') {
            $changes['name'] = 'Diana Alarcón';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$OgmKW8zXGyUI0cP1VIFopegQim/DidD8GOBHapl.DeKvmIQALtPSa';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'gvillaalta@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Graciela Villaalta') {
            $changes['name'] = 'Graciela Villaalta';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$3HY81b/VVZcZ/6FGpM.xleEyy61KqC4Kxvutz4E/gtesfi/Iyp9xe';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'jessicaf@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Jessica  Fariña') {
            $changes['name'] = 'Jessica  Fariña';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$bflfAFn.zWJhXFsJG3NaX.0LHEKSOSQkvj5UeE4upMS3Suv1iWZrK';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'lsamudio@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Lise Samudio') {
            $changes['name'] = 'Lise Samudio';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$TPhu79bYER3.6JUfweIOV.hI/3Zzyy2gppJcPjg7GM27j2aNRSnsm';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'sinfila@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'SinFila Demo') {
            $changes['name'] = 'SinFila Demo';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$2nzWQUCvYsdzQwH5I1WWuOAHSVskXx20jkwuCWXwTY8S7mqgmS33u';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'ruleta@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Ruleta DEMO') {
            $changes['name'] = 'Ruleta DEMO';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$A7IWayJRcj20eQfy3Oz5lOMVv1IuUqV5/KV4bwwqObb3.N.XgSTWq';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'emartinez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Elizabeth Martinez') {
            $changes['name'] = 'Elizabeth Martinez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$SE6Qwm.YW/Qqyk3aJTtqlOJA8.t7apXPuMSs0EIU1GvCE1hHjL2QK';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'bruno@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Bruno Farina') {
            $changes['name'] = 'Bruno Farina';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$unKEVg/PRmBG49ga4GR5DeOVh72zaJZ5hRvQaHCH6K1WJrQYTR7e2';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'sportillo@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Sonia Portillo') {
            $changes['name'] = 'Sonia Portillo';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$CFPwuwE6Xxt08BoAy6IOh.E5n.0679cPHIzndAyVy9XLvRLHzccBe';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'nresquin@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Nelly Vidalia Resquin Sanchez') {
            $changes['name'] = 'Nelly Vidalia Resquin Sanchez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$5oeGCA/PA6/yPkXpkp5CtuEOls4DI9QuWVQ9k/l7EstVGH1je0oyW';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'mvazquez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Mabel  Vazquez') {
            $changes['name'] = 'Mabel  Vazquez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$QB59Ah5nL088QhMtPuh6MenhbY1DKm1HMmBBT8jFTRygWDZtTzDFK';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'nacosta@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Nieves Acosta') {
            $changes['name'] = 'Nieves Acosta';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$YcgFcjy9HBHNQy8Ys235eOVGRRbZ2B1GmPDXi8aMNNQmSLqcbidZ2';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'gbenitez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Graciela Benitez') {
            $changes['name'] = 'Graciela Benitez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$tbadWDZH8CDIAo2ylbP6XuptT2nxSDnltCGjcHah3hH.JjRB0TUYu';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'lpaiva@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Lilian Paiva') {
            $changes['name'] = 'Lilian Paiva';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$5xOzWc//ZnjDHSFA9AosyuWjWrqealGaAtBAvJ3ezjmkSakHBhcHu';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'cvazquez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Cristina Vazquez') {
            $changes['name'] = 'Cristina Vazquez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$BLUV9njRsNHsAMZUjrEV5eWpN1ok.g7/4lCFsPYVbxNGCXjvfMvGm';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'jdenis@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Julia Denis') {
            $changes['name'] = 'Julia Denis';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$2FI4Vr.JfTl7.mOJHkYOyelxpWfnyfpJln5wjxA.7zmfcIlSWpI/G';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'nmaidana@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Nilsa Maidana') {
            $changes['name'] = 'Nilsa Maidana';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$SqaoctYfXC3AnqyjM6zzQuseFYlMwWB3LMZThgJZIHx0NnFFwjeJu';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'erecalde@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Elva Recalde') {
            $changes['name'] = 'Elva Recalde';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$K0ArLO0FW078VZIAso4rTe4wV7CDBd39tsxTGgca2G4to40MymX/q';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'ncuellar@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Natalia Cuellar') {
            $changes['name'] = 'Natalia Cuellar';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$cDMDpFP8vKjtw1Pn6PtI..rzovW3yuzMoxumbM4FPvv4buz0k48fS';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'mgonzalez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Mariela Gonzalez') {
            $changes['name'] = 'Mariela Gonzalez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$svFzvuJU5yEKdHNiYepLWeIa742hvZNcHpkopnnsUYLU2sRdOoxv6';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'nvillar@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Noelia Villar') {
            $changes['name'] = 'Noelia Villar';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$49Loh9ne6PYBjqpcQnZ/SOXyhpHJWq0sRvCYa9gjNNZf2DsM9fi/q';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'ltorres@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Liliana Torres') {
            $changes['name'] = 'Liliana Torres';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$u6.uLPZse/JCjos9mUsEWezXjsE6C7LzlnQcsizArSPIAjzhE3Mkm';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'jtan@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Jessica Tan') {
            $changes['name'] = 'Jessica Tan';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$CRHUa4ieOj8F2RNx319O1eAidlx2SFE6JJjaVJJNTSIm8LSz1CURy';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'rbaez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Roxana Báez') {
            $changes['name'] = 'Roxana Báez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$tpoLHTUMnzYDSIrGX/uPMefutUDa12EnTWeJ1sGnVQD0fwJCHBFhe';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'lbenitez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Leticia  Benitez') {
            $changes['name'] = 'Leticia  Benitez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$74KVDxereb/9zPGCgAuseuGOCoWCgSm8dXuK7AZC9VR/vwX1DPUIu';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'poviedo@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Paola Oviedo') {
            $changes['name'] = 'Paola Oviedo';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$klxbMTLCBzAC5KsDLPnzLe0IADOxoJWXhnph7cQ7ERtIIPwM80Tqu';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'kmancuello@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Karen Mancuello') {
            $changes['name'] = 'Karen Mancuello';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$e1LX3AdAUTWWONJblYamm.JB8TaC6N0KfS4g33o9hPEZu8O3KGUWC';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'mrojas@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Mariela Rojas') {
            $changes['name'] = 'Mariela Rojas';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$AvKIGo9yvMoNmVhAx8n5ue5fv/omuzDeyjnJR3Vu3uDmDZvcY0lX2';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'rodrigo@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Rodrigo  Fernandez Alfonzo') {
            $changes['name'] = 'Rodrigo  Fernandez Alfonzo';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$1vVlxLI7szEIfuAZMjh/hu.WWgmt.fT1UoKz30QkjIcF1N6Ypap0e';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'maria@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'María Teresita Lezcano Romero') {
            $changes['name'] = 'María Teresita Lezcano Romero';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$31y8X0tVtSr4Az0fHcrsp.bLgmm3TRRIBoccQtuf0cs0N7sDPVAeu';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'liz@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Liz Paola Maidana Brizuela') {
            $changes['name'] = 'Liz Paola Maidana Brizuela';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$NeJPpcyA0DeiN5G02xYG7uZu2zM9c8pR05sKIyyvMaBLLIQjrez2y';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'luis@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Luis Maria  Vega Insaurralde') {
            $changes['name'] = 'Luis Maria  Vega Insaurralde';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$c4A1GvFuaEATVBRqct7F0.7nBW1bblNWQEgU1UXGYegvbMPigwwca';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'laboratorio@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'laboratorio Clinic Center') {
            $changes['name'] = 'laboratorio Clinic Center';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$lsbB//6A4.UzzK/40/XygufQ9C9rr8yHkSwtBGqTZ/UT1D8OgWsTC';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'gmedina@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Gladys Medina') {
            $changes['name'] = 'Gladys Medina';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$QhcbqYHhu/f1h0C1CaYI2OR1w1praZfyKn5XzllbUIWlomLkOTNRy';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'sandra@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Sandra Diana') {
            $changes['name'] = 'Sandra Diana';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$BxuPEY.VEAWMjYpdclSxG.vYsIkjioFA7g880woWjUDryU5OlkJcy';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'fabiana@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Fabiana Volpe') {
            $changes['name'] = 'Fabiana Volpe';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$KrIEBmWDoYrQ127atYDY2uNs4vjH7uX.Sa71/ANweivXmCi5sjpt6';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'alicia@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Alicia Lugo') {
            $changes['name'] = 'Alicia Lugo';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$LXq.PehXCilMF2PUv.twBOQ8bL1Pw3nC3JU1sEBa3D/BQiH.QIRAq';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'lidiana@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Lidiana Peña') {
            $changes['name'] = 'Lidiana Peña';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$.vPrxaSeC7556NI8BoeXJuWegneYdXPpdAWw8T10Gocp4jH9rkmdy';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'romina@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Romina Garcia') {
            $changes['name'] = 'Romina Garcia';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$.nvaV.IqPwCJC1MrbTf8E.JamS6ti.tKMaQ6dgk8aJxQVU/57/SYa';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'alvaro@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Alvaro Roman') {
            $changes['name'] = 'Alvaro Roman';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$RqijM1/bSScVuDOiT3MQbuWQ2gW00njydDwTkYoZ3vxY7PgjT6qFe';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'antonia@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Antonia Cuevas Rodriguez') {
            $changes['name'] = 'Antonia Cuevas Rodriguez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$rPtung.ovU47V2TlF1.0POOkHCgFQncFUk3aBRGpwLu019TKs0aX2';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'lizg@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'LIz Fabiola Gonzalez') {
            $changes['name'] = 'LIz Fabiola Gonzalez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$9PcNBsGWmG.UANVH/5pCS.UONE6/UR8/1nxMwmeCygPJ5di1VuHim';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'eusebia@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Eusebia González Arce') {
            $changes['name'] = 'Eusebia González Arce';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$hcj7NQvR9lnYWkYXKH2d5u3sOr57eRJy2tmmRXVoyYopOwx8/jl4K';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'maricel@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Maricel Centurion') {
            $changes['name'] = 'Maricel Centurion';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$NgpUGx4Wyf2mFxR2X6TsAOuxgZLzPmti3DHEbj8GS9h43F8eLVE06';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'isaac@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Isaac Spagnol') {
            $changes['name'] = 'Isaac Spagnol';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$Oe8ewwtVrxIK5TlwGnWCduePSl1qG5I1DpH.kyCXrNQI8jjy/gaEi';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'pmartinez@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Perla Martinez') {
            $changes['name'] = 'Perla Martinez';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$W4qzqjNw9nQL9mMvGCMWfOYzw7hMK9q3.5Qx4OTPIBkqTBD.d0ZXe';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }

        $u = User::firstOrNew(['email' => 'taveiro@legacy.local']);
        $isNew = !$u->exists;

        $changes = [];
        if ($u->name !== 'Tathiana Aveiro') {
            $changes['name'] = 'Tathiana Aveiro';
        }
        if ($isNew) {
            $changes['password'] = '$2y$12$OjwRLZ6XU0nBGjn6YNEdBOekfjJnfE8UUJO3Xh6ZhRyYNdrUaySSe';
        }

        if (!empty($changes)) {
            $u->fill($changes);
            $u->save();
        }
    }
}