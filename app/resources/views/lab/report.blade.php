<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Informe de Laboratorio {{ $report->report_number }}</title>
    <style>
        @page { margin: 110px 40px 80px 40px; }
        * { font-family: DejaVu Sans, sans-serif; }
        body { font-size: 11px; color: #1f2937; margin: 0; }

        header { position: fixed; top: -90px; left: 0; right: 0; height: 90px; }
        footer { position: fixed; bottom: -60px; left: 0; right: 0; height: 60px;
            font-size: 8px; color: #6b7280; }

        .brand { border-bottom: 2px solid #2563eb; padding-bottom: 6px; }
        .brand-logo-cell { width: 72px; }
        .brand-logo-box { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        .brand-logo-box img { max-width: 60px; max-height: 60px; object-fit: contain; }
        .brand-name { font-size: 20px; font-weight: bold; color: #2563eb; letter-spacing: 1px; }
        .brand-sub { font-size: 10px; color: #6b7280; }
        .brand-meta { font-size: 9px; color: #6b7280; margin-top: 2px; }
        .brand-org { font-size: 12px; font-weight: bold; color: #374151; text-align: right; }
        .brand-org small { font-weight: normal; color: #6b7280; }

        .patient-box { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px;
            margin-bottom: 12px; }
        .patient-box table { width: 100%; border-collapse: collapse; }
        .patient-box td { padding: 2px 4px; font-size: 10px; vertical-align: top; }
        .lbl { color: #6b7280; font-weight: bold; }

        .section-title { background: #eff6ff; color: #1e40af; font-weight: bold;
            padding: 5px 8px; font-size: 12px; margin-top: 10px; border-left: 3px solid #2563eb; }

        table.results { width: 100%; border-collapse: collapse; margin-top: 2px; }
        table.results th { text-align: left; font-size: 9px; color: #2563eb; text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1; padding: 5px 6px; }
        table.results th.num, table.results td.num { text-align: right; }
        table.results td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
        .param-name { font-weight: 600; color: #111827; }
        .group-row td { background: #f8fafc; font-weight: bold; color: #334155; font-size: 10px;
            text-transform: uppercase; }
        .value { font-weight: bold; }
        .out-of-range { color: #b91c1c; }
        .flag { font-size: 8px; color: #b91c1c; font-weight: bold; }
        .ref { color: #6b7280; font-size: 9px; }

        .sign { margin-top: 44px; width: 100%; }
        .sign td { width: 50%; vertical-align: bottom; padding-top: 30px; }
        .sign .line { border-top: 1px solid #9ca3af; width: 70%; padding-top: 6px;
            font-size: 9px; color: #374151; }
        .signature-box { min-height: 86px; margin-bottom: 8px; text-align: center; }
        .signature-box img { display: inline-block; max-height: 74px; max-width: 210px; object-fit: contain; }
        .stamp-box { margin-top: 10px; text-align: center; }
        .stamp-box img { display: inline-block; max-height: 78px; max-width: 130px; object-fit: contain; }
        .sign-name { font-size: 10px; font-weight: bold; color: #111827; line-height: 1.35; }
        .sign-role { font-size: 9px; color: #374151; line-height: 1.35; }
        .sign-license { font-size: 9px; color: #4b5563; line-height: 1.35; }
        .sign-status { font-size: 8px; color: #6b7280; line-height: 1.35; margin-top: 3px; }
    </style>
</head>
<body>
    <header>
        <table style="width:100%; border:0;" class="brand">
            <tr>
                @if (!empty($clinic['logo_data_url']))
                    <td class="brand-logo-cell" style="border:0; vertical-align:top;">
                        <div class="brand-logo-box">
                            <img src="{{ $clinic['logo_data_url'] }}" alt="Logo de la empresa">
                        </div>
                    </td>
                @endif
                <td style="border:0; vertical-align:top;">
                    <div class="brand-name">{{ $clinic['name'] }}</div>
                    <div class="brand-sub">Laboratorio Clínico</div>
                    @if (!empty($clinic['ruc']) || !empty($clinic['phone']) || !empty($clinic['email']))
                        <div class="brand-meta">
                            @if (!empty($clinic['ruc']))RUC: {{ $clinic['ruc'] }}@endif
                            @if (!empty($clinic['phone'])) &nbsp;|&nbsp; Tel: {{ $clinic['phone'] }}@endif
                            @if (!empty($clinic['email'])) &nbsp;|&nbsp; {{ $clinic['email'] }}@endif
                        </div>
                    @endif
                </td>
                <td style="border:0; text-align:right; vertical-align:top;">
                    <div class="brand-org">
                        Informe de Resultados<br>
                        <small>N° {{ $report->report_number }}</small>
                    </div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <div style="border-top:1px solid #d1d5db; padding-top:4px;">
            (*) Resultados verificados &nbsp;|&nbsp; La interpretación de los resultados es exclusiva del médico tratante.<br>
            (**) Los valores de referencia están de acuerdo a la edad y sexo del paciente. &nbsp;|&nbsp;
            Generado el {{ $generatedAt }}.
        </div>
    </footer>

    <main>
        <div class="patient-box">
            <table>
                <tr>
                    <td style="width:60%;"><span class="lbl">Paciente:</span> {{ $patient['name'] }}</td>
                    <td><span class="lbl">Documento:</span> {{ $patient['document'] }}</td>
                </tr>
                <tr>
                    <td><span class="lbl">Sexo:</span> {{ $patient['gender'] }} &nbsp;&nbsp;
                        <span class="lbl">Edad:</span> {{ $patient['age'] }}</td>
                    <td><span class="lbl">N° de Orden:</span> {{ $sample['number'] }}</td>
                </tr>
                <tr>
                    <td><span class="lbl">Fecha de ingreso:</span> {{ $sample['received_at'] }}</td>
                    <td><span class="lbl">Fecha de impresión:</span> {{ $generatedAt }}</td>
                </tr>
            </table>
        </div>

        @foreach ($profiles as $profile)
            <div class="section-title">{{ $profile['name'] }}</div>
            <table class="results">
                <thead>
                    <tr>
                        <th style="width:42%;">Parámetro</th>
                        <th class="num" style="width:18%;">Resultado</th>
                        <th style="width:12%;">Unidad</th>
                        <th style="width:28%;">Valor de Referencia</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($profile['rows'] as $row)
                        <tr>
                            <td class="param-name">{{ $row['name'] }}</td>
                            <td class="num value {{ $row['out_of_range'] ? 'out-of-range' : '' }}">
                                {{ $row['value'] }}
                                @if ($row['out_of_range'])<span class="flag">*</span>@endif
                            </td>
                            <td>{{ $row['unit'] }}</td>
                            <td class="ref">{{ $row['reference'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endforeach

        <table class="sign">
            <tr>
                <td></td>
                <td style="text-align:center;">
                    <div class="signature-box">
                        @if (!empty($signatory['signature_data_url']))
                            <img src="{{ $signatory['signature_data_url'] }}" alt="Firma autorizada">
                        @endif
                    </div>
                    <div class="line" style="margin:0 auto;">
                        <div class="sign-name">{{ $signatory['name'] ?? $validatedBy ?? '—' }}</div>
                        <div class="sign-role">{{ $signatory['role_label'] ?? 'Bioquímico/a autorizado/a' }}</div>
                        <div class="sign-license">
                            Matrícula:
                            {{ !empty($signatory['license']) ? $signatory['license'] : 'No registrada' }}
                        </div>
                        <div class="sign-status">
                            <strong>Validado por</strong>
                            @if ($validatedAt) · {{ $validatedAt }} @endif
                        </div>
                    </div>
                    @if (!empty($signatory['stamp_data_url']))
                        <div class="stamp-box">
                            <img src="{{ $signatory['stamp_data_url'] }}" alt="Sello profesional">
                        </div>
                    @endif
                </td>
            </tr>
        </table>
    </main>
</body>
</html>
