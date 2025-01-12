const handleHomePageRequest = async (req, res) => {
    res.sendFile('home.html', { root: './pages' });
}

const handleSignUpPageRequest = async (req, res) => {
    res.sendFile('signup.html', { root: './pages' });
}

const handleSignInPageRequest = async (req, res) => {
    res.sendFile('signin.html', { root: './pages' });
}

export { handleHomePageRequest, handleSignUpPageRequest, handleSignInPageRequest }