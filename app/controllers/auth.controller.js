const   config = require('../config/auth.config'),
        db = require('../models')

const   User = db.user,
        Role = db.role

var jwt = require('jsonwebtoken'),
    bcrypt = require('bcryptjs')


exports.signup = (req, res) => {
    const user = new User({
        username: req.body.username,
        password : bcrypt.hashSync(req.body.password, 8),
        email: req.body.email
    })

    user.save((err, user) => {
        if(err) {
            return res.status(500).send({message: err})
        }

        // update roles
        if(req.body.roles) {
            Role.find(
                {
                    name: { $in: req.body.roles }
                },
                (err, roles) => {
                    if(err) {
                        return res.status(500).send({message: err})
                    }

                    // update with all roles on inserted user
                    user.roles = roles.map(role => role._id)

                    user.save(err => {
                        if(err) {
                            return res.status(500).send({message:err})
                        }
                        
                        res.send({message: 'User was registered succesfully'})
                    })
                }
            )
        } else {
            Role.findOne({ name: "user" }, (err, role) => {
                if(err) {
                    return res.status(500).send({ message: err })
                }

                user.roles = [role._id]
                user.save(err => {
                    if(err) {
                        return res.status(500).send({message:err})
                    }

                    res.send({message: 'User was registered succesfully'})
                })
            })
        }
    })
}

exports.signin = (req, res) => {
    User.findOne({
        username: req.body.username
    })
    .populate('roles', '-__v')
    .exec((err, user) => {
        if(err) {
            return res.status(500).send({message:err})
        }

        if(!user) {
            return res.status(404).send({message: 'User not found!'})
        }

        let passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        )

        if(!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: 'Invalid password'
            })
        }

        let token = jwt.sign({ id: user.id }, config.secret, {
                expiresIn: 86400 // 24 hours
        })

        let authorities = []

        for(let roleLoop = 0; roleLoop < user.roles.length; roleLoop++) {
            authorities.push(`ROLE_${user.roles[roleLoop].name.toUpperCase()}`)
        }

        res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            roles: authorities,
            accessToken: token
        })
    })
}