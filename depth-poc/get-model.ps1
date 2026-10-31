$ErrorActionPreference = 'Stop'
$target = Join-Path $PSScriptRoot 'models\depth-anything-v2-small-int8.onnx'
$expected = 'fcf51f1b230362b28690bb9d1809bf0431f29cad20534e3f589bd7285547f20d'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
if ((Test-Path -LiteralPath $target) -and (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -eq $expected) { Write-Host '模型已存在，校验通过。'; exit 0 }
$temp = "$target.download"
Invoke-WebRequest -Uri 'https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/f7421df0cc30f121782ab050d42f0a423291dcde/onnx/model_quantized.onnx' -OutFile $temp
if ((Get-FileHash -LiteralPath $temp -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw '模型校验失败，未替换已有文件。' }
Move-Item -LiteralPath $temp -Destination $target -Force
Write-Host '模型下载及校验完成。'
