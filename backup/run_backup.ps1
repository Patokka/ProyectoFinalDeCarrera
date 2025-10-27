#CONFIGURACIÓN
$ProyectoRuta = "C:\Users\Usuario\Desktop\ProyectoFinal"
$BackupCarpeta = "C:\Users\Usuario\Desktop\ProyectoFinal\backup" # Muevo la carpeta de backup a la raíz
$DbContenedorNombre = "proyectofinal-db-1" # Capaz cambie a sistema-arrendamientos-db-1
$DbUsuario = "root"
$DbPassword = "Snordesan2025" 
$DbNombre = "sistema_arrendamientos"

#Configuración SMTP
$SmtpServidor = "smtp.gmail.com"
$SmtpPuerto = 587
$SmtpUsuario = "patogaggiotti@gmail.com"
$SmtpPassword = "ftlu hied tuwd yrtn"
$EmailDestino = "patogaggiotti@gmail.com"
$EmailOrigen = "patogaggiotti@gmail.com"

#CREAR NOMBRE DE ARCHIVOS
$Fecha = Get-Date -Format "yyyy-MM-dd"
$SqlNombre = "backup_db_$($Fecha).sql"
$ZipNombre = "backup_db_$($Fecha).zip"
$SqlRuta = Join-Path $BackupCarpeta $SqlNombre
$ZipRuta = Join-Path $BackupCarpeta $ZipNombre

Write-Host "Iniciando backup: $SqlNombre"

#NAVEGAR AL PROYECTO Y GENERAR BACKUP
try {
    cd $ProyectoRuta
    
    $cmd = "docker exec $DbContenedorNombre mysqldump --user=$DbUsuario -p$DbPassword $DbNombre"
    
    Invoke-Expression $cmd | Set-Content -Path $SqlRuta -Encoding utf8
    
    if (-not (Test-Path $SqlRuta)) {
        # Mensaje de error actualizado
        throw "¡Error! El comando 'docker exec' falló y no se creó el archivo .sql."
    }
    
    if ((Get-Item $SqlRuta).Length -eq 0) {
        Remove-Item $SqlRuta
        throw "¡Error! El .sql está vacío. Revisa la contraseña, el nombre de la DB o el nombre del contenedor."
    }
    
    Write-Host "Backup .sql creado y verificado en $SqlRuta"
}
catch {
    Write-Error "Error al generar el .sql: $_"
    exit 1
}

#COMPRIMIR EL BACKUP
try {
    Compress-Archive -Path $SqlRuta -DestinationPath $ZipRuta -Force
    Write-Host "Archivo comprimido creado en $ZipRuta"
}
catch {
    Write-Error "Error al comprimir el archivo: $_"
    exit 1
}

#ENVIAR EL CORREO
try {
    Write-Host "Enviando email a $EmailDestino..."
    
    $Credencial = New-Object System.Management.Automation.PSCredential($SmtpUsuario, (ConvertTo-SecureString $SmtpPassword -AsPlainText -Force))
    
    $EmailParams = @{
        From = $EmailOrigen
        To = $EmailDestino
        Subject = "Backup Base de Datos - $Fecha"
        Body = "Adjunto el backup de la base de datos '$DbNombre' del día $Fecha."
        SmtpServer = $SmtpServidor
        Port = $SmtpPuerto
        UseSsl = $true
        Credential = $Credencial
        Attachments = $ZipRuta
    }
    
    Send-MailMessage @EmailParams
    Write-Host "¡Email enviado exitosamente!"
}
catch {
    Write-Error "Error al enviar el email: $_"
    exit 1
}

#LIMPIEZA (Opcional)
Write-Host "Limpiando archivos locales..."
#Remove-Item $SqlRuta
Remove-Item $ZipRuta

Write-Host "Proceso de backup completado."