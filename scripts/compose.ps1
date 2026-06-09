# This script is used to start the development environment using Docker Compose.
# It will build and run the containers defined in the respective compose file.
# Environment variables are injected through Infisical CLI.
[CmdletBinding()]
param (
    # Docker Compose actions
    [Parameter(Mandatory = $true, HelpMessage = "Docker Compose actions to perform. For example: 'up', 'down', 'build', etc.")]
    [string]$Action,

    # Infisical environment
    [Parameter(Mandatory = $false, HelpMessage = "Infisical environment slug name to fetch from. For example: 'dev', 'prod'.")]
    [string]$Environment = "dev",

    # Additional options for Docker Compose
    [Parameter(Mandatory = $false, HelpMessage = "Additional options for Docker Compose. For example: '-d' for detached mode.")]
    [string[]]$Options
)

if ($Environment -eq "dev") {
    $ComposeFilePath = Join-Path -Path $PSScriptRoot -ChildPath "..\docker-compose.dev.yml"
}
else {
    $ComposeFilePath = Join-Path -Path $PSScriptRoot -ChildPath "..\docker-compose.yml"
}

if (-Not (Test-Path -Path $ComposeFilePath)) {
    Write-Error "Docker Compose file not found at path: $ComposeFilePath"
    exit 1
}

& infisical.exe run --env=$Environment --path=/MongoDB --path=/Discord -- docker compose -f $ComposeFilePath $Action @Options