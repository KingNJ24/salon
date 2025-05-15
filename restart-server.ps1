# PowerShell script to restart the salon website server

Write-Host "Stopping any running Node.js processes..."
taskkill /F /IM node.exe 2>$null

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 1

Write-Host "Starting the salon website server..."
npm start 