// for node (client) and config (server)
const createBackwardCompatible = (obj) => {
  if (typeof obj.name === 'undefined') obj.name = ''
  if (typeof obj.container === 'undefined') obj.container = obj.containerOpts
  if (typeof obj.errorHandling === 'undefined') obj.errorHandling = ''
  
  if (typeof obj.grantType === 'undefined') obj.grantType = obj.grantOpts
  if (typeof obj.accessTokenUrl === 'undefined') obj.accessTokenUrl =  ''
  if (typeof obj.clientSecret === 'undefined') obj.clientSecret =  ''
  if (typeof obj.clientId === 'undefined') obj.clientId =  ''
  if (typeof obj.scope === 'undefined') obj.scope =  ''
  if (typeof obj.userName === 'undefined') obj.userName =  ''
  if (typeof obj.password === 'undefined') obj.password =  ''
  if (typeof obj.authorizationEndpoint === 'undefined') obj.authorizationEndpoint =  ''
  if (typeof obj.code === 'undefined') obj.code =  ''

  if (typeof obj.internalErrors === 'undefined') obj.internalErrors = {}
  if (typeof obj.devMode === 'undefined') obj.devMode = false
  if (typeof obj.keepAuth === 'undefined') obj.keepAuth = false 
  if (typeof obj.rejectUnauthorized === 'undefined') obj.rejectUnauthorized = false
  if (typeof obj.clientCredentialsInBody === 'undefined') obj.clientCredentialsInBody = false 
  if (typeof obj.headers === 'undefined') obj.headers = [ { key: "favicon", value: "", type: "str" }] 

  if (typeof obj.showBanner === 'undefined') obj.showBanner = false
  if (typeof obj.disableInput === 'undefined') obj.disableInput = false 

}

module.exports = {
  createBackwardCompatible
}
