<div align="center">


# Authist
[![NPM version](https://img.shields.io/npm/v/authist)](https://www.npmjs.com/package/authist)
[![Pipeline Status](https://github.com/AckeeCZ/authist/workflows/Pipeline/badge.svg)](https://github.com/AckeeCZ/authist/actions)
[![Deploy Status](https://github.com/AckeeCZ/authist/workflows/Deploy/badge.svg)](https://github.com/AckeeCZ/authist/actions)
[![Coverage](https://img.shields.io/codecov/c/github/AckeeCZ/authist?style=flat-square)](https://codecov.io/gh/AckeeCZ/authist)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/AckeeCZ/authist.svg?style=flat-square)](https://snyk.io/test/github/AckeeCZ/authist?targetFile=package.json)

</div>

- Check our [API documentation](https://ackeecz.github.io/authist/)

# Error codes
| Code | Message | How to debug / fix |
|---|---|---|
| PasswordMismatch | You entered a wrong password! | Did you store password we hashed for you? |
| UsernameRequired | Username is required field, please enter the username! | :thinking: |
| PasswordRequired | Password is required field, please enter the password! | :thinking: |
| UserNotFound | It seems this user doesn't exist, are you sure you entered correct credentials? | Do you want to enable auto registration? Declare `saveNonExistingUser` function |

# 🚧🏗️🚧
Under heavy development

# Features
- supported features by Firebase Authentication, a fellow auth ideal service
    - email and password authentication [ref](https://firebase.google.com/docs/auth)
    - google authentication [ref](https://firebase.google.com/docs/auth)
    - facebook authentication [ref](https://firebase.google.com/docs/auth)
    - twitter authentication [ref](https://firebase.google.com/docs/auth)
    - github authentication [ref](https://firebase.google.com/docs/auth)
    - custom auth system authentication [ref](https://firebase.google.com/docs/auth)
    - anonymous auth [ref](https://firebase.google.com/docs/auth) [kept forever](https://stackoverflow.com/a/48776702/7224851)
    - storing provider data [ref](https://firebase.google.com/docs/auth/web/manage-users#get_a_users_provider-specific_profile_information) [what data](https://firebase.google.com/docs/reference/js/firebase.User#providerdata)
    - reset password email [ref](https://firebase.google.com/docs/auth/custom-email-handler)
    - recovery email [ref](https://firebase.google.com/docs/auth/custom-email-handler)
    - verify email [ref](https://firebase.google.com/docs/auth/custom-email-handler)

## Email and password authentication

### Usage

```typescript
import { createAuthenticator } from 'authist';

const authenticator = createAuthenticator({
    getUserById: () => Promise.resolve(), // todo: add implementation
    emailPassword: {
        getUserByEmail: (email: string) => Promise.resolve(), // todo: add implementation
    },
});
const { user, credentials } = await authenticator.signInWithEmailAndPassword(email, password);
```

#### Express middleware

```typescript
import express from 'express';

const app = express();
app.get('/users/me', authenticator.expressBearer, (req, res) => {
    res.json(req.user);
});
```

## License

This project is licensed under [MIT](./LICENSE).
