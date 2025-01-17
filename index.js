import express from 'express';
import cookieParser from 'cookie-parser';
import { handleProfileRequest, handleSignInRequest, handleSignUpRequest, mustBeAuthenticated } from './users.js';
import { handleHomePageRequest, handleSignInPageRequest, handleSignUpPageRequest } from './pages/index.js';
import { handleAuthRequest, handleTokenRequest } from './oauth.js';
import { handleResourcesRequest, mustHaveAccess } from './resource.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', handleHomePageRequest)
app.get('/signup', handleSignUpPageRequest)
app.get('/signin', handleSignInPageRequest)

app.post('/signup', handleSignUpRequest)
app.post('/signin', handleSignInRequest)
app.get('/profile', mustBeAuthenticated, handleProfileRequest)

// OAuth 2.0
app.all('/auth', mustBeAuthenticated, handleAuthRequest)
app.post('/token', handleTokenRequest)
app.get('/api/resources', mustHaveAccess, handleResourcesRequest)

app.all('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
})

app.listen(3210, () => {
    console.log('Server is running on port 3210');
})
