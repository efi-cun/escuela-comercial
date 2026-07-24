# Script para actualizar los datos del dashboard desde los archivos de Excel
# Ejecuta este script en PowerShell si modificas el archivo BASE_ONBOARDING_ESCUELA_COMERCIAL (4).xlsx

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

function ExcelDateToDateString($excelDate) {
    if ($excelDate -eq $null -or $excelDate -eq "") { return "" }
    try {
        if ($excelDate -match '^\d+(\.\d+)?$') {
            $date = [datetime]"1899-12-30"
            $date = $date.AddDays([double]$excelDate)
            return $date.ToString("yyyy-MM-dd")
        }
    } catch {}
    return $excelDate
}

try {
    Write-Output "Iniciando lectura de archivos Excel..."
    
    # Resolver la ruta de los archivos Excel en la carpeta actual
    $file1 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL (4).xlsx" -ErrorAction SilentlyContinue
    if (-not $file1) {
        Write-Output "---------------------------------------------------------"
        Write-Output "ERROR: No se encontro el archivo original:"
        Write-Output "  'BASE_ONBOARDING_ESCUELA_COMERCIAL (4).xlsx'"
        Write-Output "Por favor colocalo en esta carpeta y vuelve a intentarlo."
        Write-Output "---------------------------------------------------------"
        return
    }
    $tempPath1 = "C:\Users\yeison_oyolat\.gemini\antigravity-cli\brain\a1d668f2-5a2e-45c7-8fa4-848e96332c55\scratch\base1.xlsx"
    Copy-Item $file1.FullName $tempPath1 -Force
    
    $wb1 = $excel.Workbooks.Open($tempPath1)
    
    # 1. Exportar la pestaña "Registro"
    $sheetReg = $wb1.Sheets.Item("Registro")
    $registroData = @()
    if ($sheetReg) {
        $headers = @()
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetReg.Cells.Item(1, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += $val
        }
        
        for ($row = 2; $row -le 200; $row++) {
            $noVal = $sheetReg.Cells.Item($row, 1).Value2
            if ($noVal -eq $null -or $noVal -eq "") { break }
            
            $rowObj = [ordered]@{}
            for ($col = 1; $col -le $headers.Length; $col++) {
                $h = $headers[$col-1]
                $val = $sheetReg.Cells.Item($row, $col).Value2
                if ($val -eq $null) { $val = "" }
                
                # Formatear la fecha
                if ($h -like "*FECHA*") {
                    $val = ExcelDateToDateString $val
                }
                
                $rowObj[$h] = $val
            }
            $registroData += $rowObj
        }
    }
    
    # 2. Exportar la pestaña "OJT"
    $sheetOJT = $wb1.Sheets.Item("OJT")
    $ojtData = @()
    if ($sheetOJT) {
        $headers = @()
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetOJT.Cells.Item(1, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += $val
        }
        
        for ($row = 2; $row -le 200; $row++) {
            $docVal = $sheetOJT.Cells.Item($row, 1).Value2
            if ($docVal -eq $null -or $docVal -eq "") {
                $nameVal = $sheetOJT.Cells.Item($row, 2).Value2
                if ($nameVal -eq $null -or $nameVal -eq "") { break }
            }
            
            $rowObj = [ordered]@{}
            for ($col = 1; $col -le $headers.Length; $col++) {
                $h = $headers[$col-1]
                $val = $sheetOJT.Cells.Item($row, $col).Value2
                if ($val -eq $null) { $val = "" }
                
                if ($h -like "*FECHA*") {
                    $val = ExcelDateToDateString $val
                }
                $rowObj[$h] = $val
            }
            $ojtData += $rowObj
        }
    }
    
    # 3. Exportar la pestaña "OJT 2" (Seguimiento diario de OJT)
    $sheetOJT2 = $wb1.Sheets.Item("OJT 2")
    $ojt2Data = @()
    if ($sheetOJT2) {
        $headers = @()
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetOJT2.Cells.Item(1, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += $val
        }
        
        for ($row = 2; $row -le 500; $row++) {
            $docVal = $sheetOJT2.Cells.Item($row, 2).Value2
            if ($docVal -eq $null -or $docVal -eq "") { break }
            
            $rowObj = [ordered]@{}
            for ($col = 1; $col -le $headers.Length; $col++) {
                $h = $headers[$col-1]
                $val = $sheetOJT2.Cells.Item($row, $col).Value2
                if ($val -eq $null) { $val = "" }
                
                if ($h -like "*FECHA*") {
                    $val = ExcelDateToDateString $val
                }
                $rowObj[$h] = $val
            }
            $ojt2Data += $rowObj
        }
    }
    
    $wb1.Close($false)
    if (Test-Path $tempPath1) { Remove-Item $tempPath1 -Force }
    
    # Leer el segundo archivo si existe
    $file2 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL_OJT_APROBADOS.xlsx" -ErrorAction SilentlyContinue
    $ojtAprobadosData = @()
    if ($file2) {
        $tempPath2 = "C:\Users\yeison_oyolat\.gemini\antigravity-cli\brain\a1d668f2-5a2e-45c7-8fa4-848e96332c55\scratch\base2.xlsx"
        Copy-Item $file2.FullName $tempPath2 -Force
        $wb2 = $excel.Workbooks.Open($tempPath2)
        
        $sheet2 = $wb2.Sheets.Item(1)
        if ($sheet2) {
            $headers = @()
            for ($col = 1; $col -le 40; $col++) {
                $val = $sheet2.Cells.Item(1, $col).Value2
                if ($val -eq $null -or $val -eq "") { break }
                $headers += $val
            }
            
            for ($row = 2; $row -le 500; $row++) {
                $docVal = $sheet2.Cells.Item($row, 1).Value2
                if ($docVal -eq $null -or $docVal -eq "") { break }
                
                $rowObj = [ordered]@{}
                for ($col = 1; $col -le $headers.Length; $col++) {
                    $h = $headers[$col-1]
                    $val = $sheet2.Cells.Item($row, $col).Value2
                    if ($val -eq $null) { $val = "" }
                    
                    if ($h -like "*FECHA*") {
                        $val = ExcelDateToDateString $val
                    }
                    $rowObj[$h] = $val
                }
                $ojtAprobadosData += $rowObj
            }
        }
        $wb2.Close($false)
        if (Test-Path $tempPath2) { Remove-Item $tempPath2 -Force }
    }
    
    # Crear objeto de salida completo
    $output = [ordered]@{
        "registro" = $registroData
        "ojt" = $ojtData
        "ojt_diario" = $ojt2Data
        "ojt_aprobados" = $ojtAprobadosData
        "actualizado" = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }
    
    # Convertir a JSON
    $json = ConvertTo-Json $output -Depth 10
    
    # Generar data.js en el directorio actual
    $jsContent = "const ONBOARDING_DATA = " + $json + ";"
    $jsContent | Out-File -FilePath "data.js" -Encoding utf8
    
    Write-Output "========================================================="
    Write-Output "¡DATOS ACTUALIZADOS CON ÉXITO!"
    Write-Output "Se ha guardado el archivo 'data.js' con:"
    Write-Output " - Registro (Participantes): $($registroData.Count) registros"
    Write-Output " - OJT (Aprobados): $($ojtData.Count) registros"
    Write-Output " - OJT Diario (Seguimiento): $($ojt2Data.Count) registros"
    Write-Output " - OJT Aprobados (Extra): $($ojtAprobadosData.Count) registros"
    Write-Output "========================================================="
}
catch {
    Write-Error "Error al procesar el archivo Excel: $_"
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
