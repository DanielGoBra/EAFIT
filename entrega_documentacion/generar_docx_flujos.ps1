param(
    [string]$MarkdownPath = (Join-Path $PSScriptRoot 'Documento_de_flujos_del_sistema.md'),
    [string]$OutputPath = (Join-Path $PSScriptRoot 'Documento_de_flujos_del_sistema.docx')
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (!(Test-Path $MarkdownPath)) {
    throw "No se encontro el archivo fuente: $MarkdownPath"
}

function Escape-XmlText {
    param([string]$Text)

    if ($null -eq $Text) {
        return ''
    }

    return $Text.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;')
}

function New-RunXml {
    param(
        [string]$Text,
        [switch]$Bold,
        [string]$FontSize
    )

    $escaped = Escape-XmlText $Text
    $runProperties = ''

    if ($Bold -or $FontSize) {
        $parts = @()
        if ($Bold) {
            $parts += '<w:b/>'
        }
        if ($FontSize) {
            $parts += "<w:sz w:val=`"$FontSize`"/>"
        }
        $runProperties = "<w:rPr>$($parts -join '')</w:rPr>"
    }

    return "<w:r>$runProperties<w:t xml:space=`"preserve`">$escaped</w:t></w:r>"
}

function New-ParagraphXml {
    param(
        [string]$Text,
        [string]$Kind = 'normal'
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return '<w:p/>'
    }

    switch ($Kind) {
        'heading1' {
            $run = New-RunXml -Text $Text -Bold -FontSize '32'
            return "<w:p><w:pPr><w:spacing w:before=`"120`" w:after=`"80`"/></w:pPr>$run</w:p>"
        }
        'heading2' {
            $run = New-RunXml -Text $Text -Bold -FontSize '28'
            return "<w:p><w:pPr><w:spacing w:before=`"80`" w:after=`"60`"/></w:pPr>$run</w:p>"
        }
        'heading3' {
            $run = New-RunXml -Text $Text -Bold -FontSize '24'
            return "<w:p><w:pPr><w:spacing w:before=`"60`" w:after=`"40`"/></w:pPr>$run</w:p>"
        }
        'bullet' {
            $run = New-RunXml -Text "- $Text"
            return "<w:p><w:pPr><w:ind w:left=`"360`"/></w:pPr>$run</w:p>"
        }
        default {
            $run = New-RunXml -Text $Text
            return "<w:p>$run</w:p>"
        }
    }
}

$paragraphs = New-Object System.Collections.Generic.List[string]

foreach ($rawLine in [System.IO.File]::ReadAllLines($MarkdownPath)) {
    $line = $rawLine.TrimEnd()

    if ([string]::IsNullOrWhiteSpace($line)) {
        $paragraphs.Add((New-ParagraphXml -Text ''))
        continue
    }

    if ($line -match '^# (.+)$') {
        $paragraphs.Add((New-ParagraphXml -Text $Matches[1] -Kind 'heading1'))
        continue
    }

    if ($line -match '^## (.+)$') {
        $paragraphs.Add((New-ParagraphXml -Text $Matches[1] -Kind 'heading2'))
        continue
    }

    if ($line -match '^### (.+)$') {
        $paragraphs.Add((New-ParagraphXml -Text $Matches[1] -Kind 'heading3'))
        continue
    }

    if ($line -match '^- (.+)$') {
        $paragraphs.Add((New-ParagraphXml -Text $Matches[1] -Kind 'bullet'))
        continue
    }

    $paragraphs.Add((New-ParagraphXml -Text $line))
}

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $($paragraphs -join "`r`n    ")
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
"@

$relationshipsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"@

$tempRoot = Join-Path $env:TEMP ("docx_" + [System.Guid]::NewGuid().ToString())
$relsPath = Join-Path $tempRoot '_rels'
$wordPath = Join-Path $tempRoot 'word'
$tempZip = [System.IO.Path]::ChangeExtension($OutputPath, '.zip')
$utf8 = New-Object System.Text.UTF8Encoding($false)

try {
    New-Item -ItemType Directory -Path $relsPath -Force | Out-Null
    New-Item -ItemType Directory -Path $wordPath -Force | Out-Null

    [System.IO.File]::WriteAllText((Join-Path $tempRoot '[Content_Types].xml'), $contentTypesXml, $utf8)
    [System.IO.File]::WriteAllText((Join-Path $relsPath '.rels'), $relationshipsXml, $utf8)
    [System.IO.File]::WriteAllText((Join-Path $wordPath 'document.xml'), $documentXml, $utf8)

    if (Test-Path $tempZip) {
        Remove-Item $tempZip -Force
    }
    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force
    }

    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempRoot, $tempZip)
    Move-Item -Path $tempZip -Destination $OutputPath -Force
}
finally {
    if (Test-Path $tempRoot) {
        Remove-Item $tempRoot -Recurse -Force
    }
}