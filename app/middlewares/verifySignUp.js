const db = require('../models')
const ROLES = db.ROLES
const User = db.user

checkDuplicateUsernameOrEmail = (req, res, next) => {
    User.findOne({
        username: req.body.username
    }).exec((err, user) => {
        if(err) {
            res.status(500).send({ message: err })
            return;
        }

        if(user) {
            res.status(400).send({ message: 'Failed! Username is already in use'})
            return;
        }

        User.findOne({
            email: req.body.email
        }).exec((err, user) => {
            if(err) {
                res.status(500).send({ message: err })
                return;
            }

            if(user) {
                res.status(400).send({ message: 'Failed! E-Mail is already in use'})
                return;
            }

            next()
        })
    })
}

checkRolesExisted = (req, res, next) => {
    if(req.body.roles) {
        for(let roleLoop = 0; roleLoop < req.body.roles.length; roleLoop++) {
            if(!ROLES.includes(req.body.roles[roleLoop])) {
                res.status(400).send({
                    message: `Failed! Role ${req.body.roles[roleLoop]} does not exist!`
                })
                return;
            }
        }
    }

    next()
}

const verifySignUp = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted
}

module.exports = verifySignUp