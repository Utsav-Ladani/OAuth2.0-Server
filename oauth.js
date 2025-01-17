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
        redirectWithQueryParams(res, redirect_uri, {
            error: 'unsupported_response_type',
            error_description: 'Unsupported OAuth response type'
        })
        return
    }

    const client = oAuthClientDB.find(client_id)

    if (!client) {
        redirectWithQueryParams(res, redirect_uri, {
            error: 'access_denied',
            error_description: 'Client not found'
        })
        return
    }

    if (client?.redirect_uri !== redirect_uri) {
        redirectWithQueryParams(res, redirect_uri, {
            error: 'invalid_request',
            error_description: 'Invalid redirect URI'
        })
        return
    }

    if (!VALID_SCOPE.includes(scope)) {
        redirectWithQueryParams(res, redirect_uri, {
            error: 'invalid_scope',
            error_description: 'Invalid access scope'
        })
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
        return
    }

    if (req.method === 'POST') {
        const { access } = req.body ?? {}

        if (access === 'granted') {
            const authorization_code = generateAuthorizationCode(req.user.id, client.id, scope)
            redirectWithQueryParams(res, redirect_uri, {
                code: authorization_code,
                state
            })
        } else {
            redirectWithQueryParams(res, redirect_uri, {
                error: 'access_denied',
                error_description: 'Access denied'
            })
        }
        return
    }

    res.end('N/A')
}

const handleTokenRequest = async (req, res) => {
    // POST /token
    // grant_type=authorization_code&code=CODE&redirect_uri=http://localhost:3211/callback&client_id=power-tool&client_secret=ok

    const { grant_type, code, client_id, client_secret, redirect_uri } = req.body || {}

    if (grant_type !== 'authorization_code') {
        res.status(400).json({ error: "Invalid grant type" })
        return
    }

    if (!code) {
        res.status(400).json({ error: "Authorization code is missing" })
        return
    }

    const { user_id, client_id: client_id_from_code, scope } = getDataFromAuthorizationCode(code)
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
        access_token: getResourceAccessToken(user_id, client_id, scope),
    })
}

const generateAuthorizationCode = (user_id, client_id, scope) => {
    return jwt.sign({ user_id, client_id, scope }, authCodeSecretKey, { expiresIn: '1h' });
}

const getDataFromAuthorizationCode = (code = '') => {
    try {
        return jwt.verify(code, authCodeSecretKey);
    } catch (err) {
        return {}
    }
}

const redirectWithQueryParams = (res, redirectUrl, params = {}) => {
    const redirectURLObj = new URL(redirectUrl)
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            redirectURLObj.searchParams.set(key, value)
        }
    })
    res.redirect(redirectURLObj.toString())
}

export { handleAuthRequest, handleTokenRequest }