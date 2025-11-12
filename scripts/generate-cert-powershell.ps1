# PowerShell script to generate SSL certificate for localhost
# Run as Administrator: .\scripts\generate-cert-powershell.ps1

$ErrorActionPreference = "Stop"

$certsDir = Join-Path $PSScriptRoot "..\certs"
$certPath = Join-Path $certsDir "localhost.pem"
$keyPath = Join-Path $certsDir "localhost-key.pem"

# Create certs directory if it doesn't exist
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
    Write-Host "✅ Created certs directory" -ForegroundColor Green
}

# Check if certificates already exist
if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    Write-Host "✅ SSL certificates already exist" -ForegroundColor Green
    Write-Host "   Key: $keyPath"
    Write-Host "   Cert: $certPath"
    Write-Host ""
    Write-Host "💡 To regenerate, delete the certs directory and run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host "🔐 Generating self-signed SSL certificate for localhost..." -ForegroundColor Cyan
Write-Host ""

try {
    # Generate certificate using New-SelfSignedCertificate
    $cert = New-SelfSignedCertificate `
        -DnsName "localhost", "*.localhost" `
        -CertStoreLocation "cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(1) `
        -FriendlyName "Localhost Dev Certificate" `
        -KeyUsage DigitalSignature, KeyEncipherment `
        -KeyAlgorithm RSA `
        -KeyLength 2048

    Write-Host "✅ Certificate created in certificate store" -ForegroundColor Green

    # Export certificate to PEM format
    $certBase64 = [System.Convert]::ToBase64String($cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert))
    $certPEM = "-----BEGIN CERTIFICATE-----`n"
    for ($i = 0; $i -lt $certBase64.Length; $i += 64) {
        $certPEM += $certBase64.Substring($i, [Math]::Min(64, $certBase64.Length - $i)) + "`n"
    }
    $certPEM += "-----END CERTIFICATE-----"
    
    Set-Content -Path $certPath -Value $certPEM
    Write-Host "✅ Certificate exported to: $certPath" -ForegroundColor Green

    # Export private key (requires OpenSSL or manual extraction)
    # Note: PowerShell doesn't easily export private key to PEM format
    # We'll create a note about this
    Write-Host ""
    Write-Host "⚠️  Private key export requires additional steps:" -ForegroundColor Yellow
    Write-Host "   1. The certificate is stored in Windows Certificate Store"
    Write-Host "   2. To export the private key, you need to:"
    Write-Host "      a. Use OpenSSL (if available)"
    Write-Host "      b. Or use the certificate from the store directly"
    Write-Host ""
    Write-Host "   For now, the certificate is ready to use."
    Write-Host "   The server will use the certificate from the Windows Certificate Store."
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Trust the certificate (double-click $certPath and install)"
    Write-Host "   2. Run: npm run dev:https"
    Write-Host "   3. Access: https://localhost:5000"
    
    # Store certificate thumbprint for reference
    $thumbprintFile = Join-Path $certsDir "cert-thumbprint.txt"
    Set-Content -Path $thumbprintFile -Value $cert.Thumbprint
    Write-Host ""
    Write-Host "   Certificate thumbprint saved to: $thumbprintFile" -ForegroundColor Gray

} catch {
    Write-Host "❌ Error generating certificate: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure you're running PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

