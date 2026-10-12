param (
    [Parameter(Mandatory = $true)]
    [string]$InputFile
)

# Read lines and reject code that is too wide for the playback display.
$lines = @(Get-Content $InputFile)
$longLines = for ($index = 0; $index -lt $lines.Count; $index++) {
    $trimmedLine = $lines[$index].TrimEnd()
    if ($trimmedLine.Length -gt 70) {
        "Line $($index + 1): $($trimmedLine.Length) characters"
    }
}

if ($longLines) {
    throw "Lines should not exceed 70 characters:`n$($longLines -join "`n")"
}

# Trim trailing spaces, escape quotes, and join with \n
$singleLine = ($lines | ForEach-Object {
    $_.TrimEnd() -replace '"', '\"'
}) -join "\n"

# Output the result
$singleLine

# Copy the result to clipboard
Set-Clipboard -Value $singleLine
