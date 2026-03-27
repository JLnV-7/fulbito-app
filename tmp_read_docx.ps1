Add-Type -AssemblyName System.IO.Compression.FileSystem
$path = "C:\Users\julia\Desktop\FutLog_Roadmap_2026.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = $content -replace '<[^>]+>', ' ' -replace '\s+', ' '
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("e:\no borrar\fulbitoo\tmp_roadmap_utf8.txt", $text, $utf8)
