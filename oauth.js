import jwt from "jsonwebtoken";
import { oAuthClientDB } from "./db.js"
import { getResponseMarkupFromTemplate } from "./template.js"
import { getResourceAccessToken } from "./resource.js";

const authCodeSecretKey = process.env.AUTH_CODE_SECRET_KEY
const VALID_SCOPE = ['email', 'bio']

const handleAuthRequest = async (req, res) => {
    // ?response_type=code&client_id=power-tool&redirect_uri=http://localhost:3211/callback&scope=email&state=123xyz

    const { response_type, client_id, redirect_uri, scope, state } = req.query

    if (response_type !== 'code') {
        res.status(400).json({ error: "Invalid OAuth response type" })
        return
    }

    const client = oAuthClientDB.find(client_id)

    if (!client) {
        res.status(403).json({ error: "Client not found" })
        return
    }

    if (client?.redirect_uri !== redirect_uri) {
        res.status(403).json({ error: "Invalid redirect URI" })
        return
    }

    if (!VALID_SCOPE.includes(scope)) {
        res.status(403).json({ error: "Invalid access scope" })
        return
    }

    if (req.method === 'GET') {
        res.send(getResponseMarkupFromTemplate(
            'access-request',
            {
                client_name: client.name,
                access_scope: scope,
                form_action: req.originalUrl
            }
        ))
    } else if (req.method === 'POST') {
        const { access } = req.body ?? {}

        if(access !== 'granted') {
            res.redirect(client.redirect_uri)
            return
        }
        
        const authorization_code = generateAuthorizationCode(req.user.id, client.id, scope)

        const redirectURLObj = new URL(client.redirect_uri)
        redirectURLObj.searchParams.set('code', authorization_code)
        redirectURLObj.searchParams.set('state', state)

        res.redirect(redirectURLObj.toString())
    } else {
        res.end('N/A')
    }
}

const handleTokenRequest = async (req, res) => {
    // /token?grant_type=authorization_code&code=CODE&redirect_uri=http://localhost:3211/callback&client_id=power-tool&client_secret=ok

    const { grant_type, code, client_id, client_secret, redirect_uri } = req.query

    if (grant_type !== 'authorization_code') {
        res.status(400).json({ error: "Invalid grant type" })
        return
    }

    if (!code) {
        res.status(400).json({ error: "Authorization code is missing" })
        return
    }

    const {user_id, client_id: client_id_from_code, scope} = getDataFromAuthorizationCode(code)
    const client = oAuthClientDB.find(client_id_from_code)

    if (client?.id !== client_id) {
        res.status(403).json({ error: "Invalid Client id" })
        return
    }

    if (client?.redirect_uri !== redirect_uri) {
        res.status(403).json({ error: "Invalid redirect URI" })
        return
    }

    res.json({
        token: getResourceAccessToken(user_id, client_id, scope)
    })
}

const generateAuthorizationCode = (user_id, client_id, scope) => {
    return jwt.sign({ user_id, client_id, scope }, authCodeSecretKey, { expiresIn: '1h' });
}

const getDataFromAuthorizationCode = (code = '') => {
    return jwt.verify(code, authCodeSecretKey);
}

export { handleAuthRequest, handleTokenRequest }