#ps1 powershell script password generator

Add-Type -AssemblyName System.Web
$services = @("mariadb","elasticsearch","rabbitmq","redis")
ForEach($service in $services) {
if ($service -eq "redis"){
   Write-Output ($service + ' password generated to -> ' + $service + '/' + $service + '_password')
   Out-File -InputObject  ('user default on >' + [System.Web.Security.Membership]::GeneratePassword(32,2) + ' ~* &* +@all')  -FilePath $service/${service}_password -NoNewline
 }
if ($service -ne "redis"){
   Write-Output ($service + ' password generated to -> ' + $service + '/' + $service + '_password')
   Out-File -InputObject ([System.Web.Security.Membership]::GeneratePassword(32,2)) -FilePath $service/${service}_password -NoNewline
 }
}
