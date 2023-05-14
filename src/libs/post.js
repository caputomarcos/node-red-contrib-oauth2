const axios = require("axios");

const GetToken = async (payload) => {

    let PARAMS, DATA;
    if (payload.form.grantType == 'refresh_token') {
        PARAMS = new URLSearchParams({
            'grant_type': payload.form.grantType,
            'refresh_token': payload.form.refreshToken
        })
        DATA = {
            auth: {
                username: payload.form.clientId,
                password: payload.form.clientSecret,
            }
        }
    }
    if (payload.form.grantType == 'password') {
        PARAMS = `grant_type=${payload.form.grantType}&username=${payload.form.userName}&password=${payload.form.password}&scope=${payload.form.scope}`
        DATA = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: payload.form.clientId,
                password: payload.form.clientSecret,
            }
        }
    }
    const response = await axios.post(
        payload.url,
        PARAMS,
        DATA
    );

    return response;
}

module.exports = {
    GetToken
}