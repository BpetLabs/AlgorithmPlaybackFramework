param (
    [Parameter(Mandatory = $true)]
    [string]$InputFile
)

# Read lines, trim trailing spaces, escape quotes, and join with \n
$singleLine = (Get-Content $InputFile | ForEach-Object {
    $_.TrimEnd() -replace '"', '\"'
}) -join "\n"

# Output the result
$singleLine

# Copy the result to clipboard
Set-Clipboard -Value $singleLine
