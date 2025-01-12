import jwt from "jsonwebtoken";
import { usersDB } from "./db.js";

const accessTokenSecretKey = process.env.ACCESS_TOKEN_SECRET_KEY

const mustHaveAccess = async (req, res, next) => {
    const authorization = req.headers?.authorization ?? ''
    const accessToken = authorization.split(' ')?.[1] ?? ''

    if(!accessToken) {
        res.status(403).json({ error: "Access token is missing" })
        return
    }

    const { user_id, client_id, scope } = getDataFromAccessToken(accessToken)

    if (!user_id || !client_id || !scope) {
        res.status(403).json({ error: "Resource acess denied" })
        return
    }

    const user = usersDB.find(user_id)
    if (!user) {
        res.status(404).json({ error: "Resource owner doesn't exist" })
        return
    }

    req.accessRequest = {
        user,
        scope
    }

    next()
}

const getResourceAccessToken = (user_id, client_id, scope) => {
    return jwt.sign({ user_id, client_id, scope }, accessTokenSecretKey, { expiresIn: '1h' });
}

const getDataFromAccessToken = (token = '') => {
    return jwt.verify(token, accessTokenSecretKey);
}

const handleResourcesRequest = (req, res) => {
    const { user, scope } = req.accessRequest ?? {}

    const data = {}

    switch (scope) {
        case 'email':
            data.email = user.email
            break
        case 'bio':
            data.bio = user.bio
    }

    res.json(data)
}

export { mustHaveAccess, handleResourcesRequest, getResourceAccessToken }