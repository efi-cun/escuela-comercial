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

function Get-SheetSafely($workbook, $name) {
    try {
        foreach ($sh in $workbook.Sheets) {
            if ($sh.Name -eq $name) { return $sh }
        }
        foreach ($sh in $workbook.Sheets) {
            if ($sh.Name -like "*$name*") { return $sh }
        }
    } catch {}
    return $null
}

try {
    Write-Output "Iniciando lectura de archivos Excel..."
    
    # Resolver la ruta de los archivos Excel en la carpeta actual
    $file1 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL (4).xlsx" -ErrorAction SilentlyContinue
    if (-not $file1) {
        $file1 = Get-ChildItem "BASE_ONBOARDING*.xlsx" -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if (-not $file1) {
        $file1 = Get-ChildItem "*.xlsx" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*OJT*" -and $_.Name -notlike "*2*" } | Select-Object -First 1
    }
    if (-not $file1) {
        Write-Output "---------------------------------------------------------"
        Write-Output "ERROR: No se encontro el archivo original de Excel."
        Write-Output "Por favor colocalo en esta carpeta y vuelve a intentarlo."
        Write-Output "---------------------------------------------------------"
        return
    }
    $tempPath1 = [System.IO.Path]::Combine($env:TEMP, "temp_base1_$([guid]::NewGuid().ToString('N')).xlsx")
    Copy-Item $file1.FullName $tempPath1 -Force
    
    $wb1 = $excel.Workbooks.Open($tempPath1)
    
    # 1. Exportar la pestaña "Registro"
    $sheetReg = Get-SheetSafely $wb1 "Registro"
    if (-not $sheetReg) { $sheetReg = $wb1.Sheets.Item(1) }
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
    
    # 2. Exportar la pestaña "OJT" (Candidatos Aprobados OJT y Seguimiento Diario)
    $sheetOJT = Get-SheetSafely $wb1 "OJT"
    $ojtData = @()
    $ojt2Data = @()

    if ($sheetOJT) {
        $headers = @()
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetOJT.Cells.Item(1, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += "$val".Trim()
        }
        
        $currDoc = ""
        $currName = ""
        $currCampana = ""
        $currGrade = ""

        for ($row = 2; $row -le 1000; $row++) {
            $diaVal = $sheetOJT.Cells.Item($row, 6).Value2
            $docVal = $sheetOJT.Cells.Item($row, 2).Value2

            if (($diaVal -eq $null -or "$diaVal".Trim() -eq "") -and ($docVal -eq $null -or "$docVal".Trim() -eq "")) {
                break
            }

            $nameVal = $sheetOJT.Cells.Item($row, 3).Value2
            $campVal = $sheetOJT.Cells.Item($row, 4).Value2
            $gradeVal = $sheetOJT.Cells.Item($row, 5).Value2

            if ($docVal -ne $null -and "$docVal".Trim() -ne "") {
                $currDoc = "$docVal".Trim()
                $currName = "$nameVal".Trim()
                $currCampana = "$campVal".Trim()
                $currGrade = "$gradeVal".Trim()

                $ojtData += [ordered]@{
                    "No. DOCUMENTO" = $currDoc
                    "NOMBRE COMPLETO" = $currName
                    "CAMPAÑA" = $currCampana
                    "NOTA FINAL" = $currGrade
                    "APRUEBA" = "Aprueba"
                }
            }

            if ($currDoc -ne "") {
                $rowObj = [ordered]@{}
                for ($col = 1; $col -le $headers.Length; $col++) {
                    $h = $headers[$col-1]
                    $val = ""
                    if ($h -eq "No. DOCUMENTO") { $val = $currDoc }
                    elseif ($h -eq "NOMBRE COMPLETO") { $val = $currName }
                    elseif ($h -eq "CAMPAÑA") { $val = $currCampana }
                    elseif ($h -like "*NOTA*") { $val = $currGrade }
                    else {
                        $val = $sheetOJT.Cells.Item($row, $col).Value2
                        if ($val -eq $null) { $val = "" }
                    }
                    if ($h -like "*FECHA*") {
                        $val = ExcelDateToDateString $val
                    }
                    $rowObj[$h] = $val
                }
                $ojt2Data += $rowObj
            }
        }
    }
    
    $wb1.Close($false)
    if (Test-Path $tempPath1) { Remove-Item $tempPath1 -Force }
    
    # Leer el segundo archivo si existe
    $file2 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL_OJT_APROBADOS.xlsx" -ErrorAction SilentlyContinue
    $ojtAprobadosData = @()
    if ($file2) {
        $tempPath2 = [System.IO.Path]::Combine($env:TEMP, "temp_base2_$([guid]::NewGuid().ToString('N')).xlsx")
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
    $targetDataFile = Join-Path $PSScriptRoot "data.js"
    if (Test-Path $targetDataFile) {
        $item = Get-Item $targetDataFile -Force
        $item.Attributes = [System.IO.FileAttributes]::Normal
    }
    $jsContent = "const ONBOARDING_DATA = " + $json + ";"
    [System.IO.File]::WriteAllText($targetDataFile, $jsContent, [System.Text.Encoding]::UTF8)
    
    # Crear un archivo HTML historico con la fecha de la actualización
    $dateStamp = Get-Date -Format "yyyy-MM-dd"
    $datedHtmlName = "Dashboard_$dateStamp.html"
    $datedHtmlPath = Join-Path $PSScriptRoot $datedHtmlName
    $indexPath = Join-Path $PSScriptRoot "index.html"
    if (Test-Path $indexPath) {
        $indexContent = Get-Content $indexPath -Raw -Encoding UTF8
        if ($indexContent -match "const ONBOARDING_DATA =") {
            $datedContent = $indexContent -replace 'const ONBOARDING_DATA = [\s\S]*?;\r?\n', "const ONBOARDING_DATA = $json;`n"
        } else {
            $datedContent = $indexContent -replace '<script src="data.js"></script>', "<script>`nconst ONBOARDING_DATA = $json;`n</script>"
        }
        [System.IO.File]::WriteAllText($datedHtmlPath, $datedContent, [System.Text.Encoding]::UTF8)
        [System.IO.File]::WriteAllText($indexPath, $datedContent, [System.Text.Encoding]::UTF8)
    }
    
    # Ocultar archivos técnicos para que la carpeta permanezca limpia
    $filesToHide = @("app.js", "style.css", "data.js", "data2.js", "actualizar_datos.ps1", "actualizar_datos2.ps1")
    foreach ($f in $filesToHide) {
        if (Test-Path $f) {
            $item = Get-Item $f -Force
            $item.Attributes = $item.Attributes -bor [System.IO.FileAttributes]::Hidden
        }
    }
    
    Write-Output "========================================================="
    Write-Output "¡DATOS ACTUALIZADOS CON ÉXITO!"
    Write-Output "Se ha guardado el archivo 'data.js' y '$datedHtmlName' con:"
    Write-Output " - Registro (Participantes): $($registroData.Count) registros"
    Write-Output " - OJT (Aprobados): $($ojtData.Count) registros"
    Write-Output " - OJT Diario (Seguimiento): $($ojt2Data.Count) registros"
    Write-Output " - OJT Aprobados (Extra): $($ojtAprobadosData.Count) registros"
    Write-Output "========================================================="
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
