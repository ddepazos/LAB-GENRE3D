# LAB-GENRE3D: inventario seguro de diferencias LOCAL vs GitHub main.
# No hace git pull, merge, reset, checkout, push ni borra archivos.
# No exporta código, credenciales ni assets. Solo rutas y hashes de código.
param(
  [switch]$RefreshRemote,
  [string]$OutputPath = ""
)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $root
try {
  if (-not (Test-Path ".git")) { throw "No estás en el repositorio LAB-GENRE3D." }
  if ($RefreshRemote) {
    # git fetch actualiza referencias remotas, nunca los archivos del usuario.
    & git fetch --no-tags origin main
    if ($LASTEXITCODE -ne 0) { throw "Falló git fetch. No se modificó el trabajo local." }
  }
  $local = (& git rev-parse HEAD).Trim()
  $remote = (& git rev-parse --verify refs/remotes/origin/main 2>$null)
  if ($LASTEXITCODE -ne 0) { $remote = "(origin/main no está disponible)" }
  else { $remote = ($remote | Select-Object -First 1).Trim() }

  $status = @(& git status --porcelain=v1 --untracked-files=all)
  $trackedDiff = @(& git diff --name-only HEAD -- src public docs tests scripts)
  $untracked = @(& git ls-files --others --exclude-standard -- src public docs tests scripts)
  $remoteDiff = @()
  if ($remote -notlike "(origin*") {
    $remoteDiff = @(& git diff --name-only origin/main -- src public docs tests scripts)
  }

  $isAtlas = { param($path) $path -match '(^|/|\\)(anatomyAtlasLoader|atlas\.json|\.reference-human-atlas|human-atlas|anatomy/atlas)(/|\\|\.|$)' }
  $filtered = @($remoteDiff + $trackedDiff + $untracked |
    Where-Object { $_ -and -not (& $isAtlas $_) } | Sort-Object -Unique)
  $atlasExcluded = @($remoteDiff + $trackedDiff + $untracked |
    Where-Object { $_ -and (& $isAtlas $_) } | Sort-Object -Unique)

  $keyFiles = @(
    "src/main.tsx", "src/fbxImport.ts", "src/EditorCameraControls.tsx",
    "src/AlphaCapture.tsx", "src/captureExport.ts", "src/timelineView.ts",
    "src/stylusSculpt.ts", "src/stylusInput.ts",
    "src/projectPersistence.ts", "src/rigAnimation.ts",
    "src/anatomyInterop.ts", "src/anatomyMetadata.ts"
  )
  $hashes = foreach ($file in $keyFiles) {
    if (Test-Path $file) {
      $info = Get-Item $file
      [pscustomobject]@{ file=$file; sha256=(Get-FileHash $file -Algorithm SHA256).Hash; size=$info.Length }
    }
  }
  $report = [ordered]@{
    repository="LAB-GENRE3D"
    generatedAt=(Get-Date).ToString("o")
    localHead=$local
    cachedOriginMain=$remote
    remoteRefreshed=[bool]$RefreshRemote
    workingTreeHasChanges=($status.Count -gt 0)
    changedPathsComparedToWeb=$filtered
    excludedFailedHumanAtlas=$atlasExcluded
    importantFileHashes=@($hashes)
    note="Solo inventario. No se copiaron archivos. Atlas descartado; no reintegrar."
  }
  if (-not $OutputPath) {
    $OutputPath = Join-Path $env:TEMP ("LAB-GENRE3D-local-vs-web-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".json")
  }
  $report | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath -Encoding UTF8
  Write-Host "Inventario creado: $OutputPath"
  Write-Host "Local HEAD: $local"
  Write-Host "Remote main: $remote"
  Write-Host ("Candidatos útiles: " + $filtered.Count)
  Write-Host ("Human Atlas excluido: " + $atlasExcluded.Count)
} finally { Pop-Location }
