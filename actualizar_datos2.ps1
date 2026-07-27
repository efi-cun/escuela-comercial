# Script para actualizar los datos del dashboard desde el archivo de Excel copia (con '2' al final)
# Ejecuta este script en PowerShell si modificas el archivo copia, por ejemplo:
# BASE_ONBOARDING_ESCUELA_COMERCIAL (4) 2.xlsx o BASE_ONBOARDING_ESCUELA_COMERCIAL 2.xlsx

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
    Write-Output "Iniciando lectura de archivos Excel copia..."
    
    # Intentar buscar el archivo copia con '2' al final
    $file2 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL (4) 2.xlsx" -ErrorAction SilentlyContinue
    if (-not $file2) {
        $file2 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL 2.xlsx" -ErrorAction SilentlyContinue
    }
    if (-not $file2) {
        $file2 = Get-Item "*2.xlsx" -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    
    if (-not $file2) {
        Write-Output "---------------------------------------------------------"
        Write-Output "INFO: No se encontro ningun archivo Excel que termine en '2.xlsx'"
        Write-Output "  (por ejemplo: 'BASE_ONBOARDING_ESCUELA_COMERCIAL (4) 2.xlsx')"
        Write-Output "  Si deseas usar el segundo Dashboard, crea una copia de tu Excel"
        Write-Output "  y renombrala añadiendo un 2 al final."
        Write-Output "  Se omitira la actualizacion de 'data2.js' por ahora."
        Write-Output "---------------------------------------------------------"
        return
    }
    
    Write-Output "Archivo seleccionado: $($file2.Name)"
    $tempPath2 = "C:\Users\yeison_oyolat\.gemini\antigravity-cli\brain\a1d668f2-5a2e-45c7-8fa4-848e96332c55\scratch\base2_copia.xlsx"
    Copy-Item $file2.FullName $tempPath2 -Force
    
    $wb2 = $excel.Workbooks.Open($tempPath2)
    
    # 1. Exportar la pestaña "Registro"
    $sheetReg = $wb2.Sheets.Item("Registro")
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
    
    # 2. Exportar la pestaña "OJT" (ahora OJT_APROBADOS)
    $sheetOJT = $wb2.Sheets.Item("OJT_APROBADOS")
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
    
    # 3. Exportar la pestaña "OJT" (Seguimiento diario de OJT, anteriormente OJT 2)
    $sheetOJT2 = $wb2.Sheets.Item("OJT")
    $ojt2Data = @()
    if ($sheetOJT2) {
        $headers = @()
        # En la pestaña de seguimiento OJT las cabeceras están en la fila 4
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetOJT2.Cells.Item(4, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += $val
        }
        
        $currentDoc = ""
        $currentName = ""
        $currentCampana = ""
        $currentFormador = ""
        
        # Los datos comienzan en la fila 5
        for ($row = 5; $row -le 1000; $row++) {
            $diaVal = $sheetOJT2.Cells.Item($row, 6).Value2
            if ($diaVal -eq $null -or $diaVal -eq "") { break } # Fin de la plantilla
            
            $dia = [int]$diaVal
            if ($dia -eq 1) {
                # Es el inicio del bloque de 5 días de un candidato
                $docVal = $sheetOJT2.Cells.Item($row, 2).Value2
                if ($docVal -eq $null -or $docVal -eq "") {
                    # No hay más candidatos aprobados asignados en esta plantilla
                    break
                }
                $currentDoc = $docVal
                $currentName = $sheetOJT2.Cells.Item($row, 3).Value2
                $currentCampana = $sheetOJT2.Cells.Item($row, 4).Value2
                $currentFormador = $sheetOJT2.Cells.Item($row, 5).Value2
            }
            
            # Si no tenemos un candidato actual asignado en este bloque, saltamos
            if ($currentDoc -eq "") { continue }
            
            $rowObj = [ordered]@{}
            for ($col = 1; $col -le $headers.Length; $col++) {
                $h = $headers[$col-1]
                $val = ""
                
                # Para días 2 a 5, completamos los campos del candidato con los del primer día
                if ($h -eq "No. DOCUMENTO") {
                    $val = $currentDoc
                } elseif ($h -eq "NOMBRE COMPLETO") {
                    $val = $currentName
                } elseif ($h -eq "CAMPAÑA") {
                    $val = $currentCampana
                } elseif ($h -eq "FORMADOR") {
                    $val = $currentFormador
                } else {
                    $val = $sheetOJT2.Cells.Item($row, $col).Value2
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
    
    $wb2.Close($false)
    if (Test-Path $tempPath2) { Remove-Item $tempPath2 -Force }
    
    # Crear objeto de salida completo
    $output = [ordered]@{
        "registro" = $registroData
        "ojt" = $ojtData
        "ojt_diario" = $ojt2Data
        "actualizado" = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }
    
    # Convertir a JSON
    $json = ConvertTo-Json $output -Depth 10
    
    # Generar data2.js en el directorio actual
    $jsContent = "const ONBOARDING_DATA = " + $json + ";"
    $jsContent | Out-File -FilePath "data2.js" -Encoding utf8
    
    Write-Output "========================================================="
    Write-Output "¡DATOS DE LA COPIA 2 ACTUALIZADOS CON ÉXITO!"
    Write-Output "Se ha guardado el archivo 'data2.js' con:"
    Write-Output " - Registro (Participantes): $($registroData.Count) registros"
    Write-Output " - OJT (Aprobados): $($ojtData.Count) registros"
    Write-Output " - OJT Diario (Seguimiento): $($ojt2Data.Count) registros"
    Write-Output "========================================================="
}
catch {
    Write-Error "Error al procesar el archivo Excel copia: $_"
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
